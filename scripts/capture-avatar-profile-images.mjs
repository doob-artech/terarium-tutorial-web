import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const DEFAULT_BASE_URL = 'http://127.0.0.1:3000'
const baseUrl = String(process.env.TUTORIAL_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '')
const publicBaseUrl = String(process.env.TUTORIAL_PUBLIC_BASE_URL || 'https://tutorial.team-doob.com').replace(/\/+$/, '')
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))
const onlyArg = process.argv.find((arg) => arg.startsWith('--agent='))
const missingOnly = process.argv.includes('--missing-only')
const limit = Math.max(1, Math.min(200, Number.parseInt(limitArg?.split('=')[1] || '100', 10) || 100))
const onlyAgentId = String(onlyArg?.split('=')[1] || '').trim()

const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean)

async function findChrome() {
  for (const candidate of chromeCandidates) {
    try {
      await fs.access(candidate)
      return candidate
    } catch {
      // try next candidate
    }
  }
  throw new Error('Chrome or Edge executable was not found. Set CHROME_PATH to a Chromium-compatible browser.')
}

async function requestJson(pathname, init = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.error || `${response.status} ${response.statusText}`)
  }
  return payload
}

async function loadTargets() {
  if (onlyAgentId) {
    const payload = await requestJson(`/api/avatar/profile-image-targets?limit=${limit}`)
    return (payload.targets || []).filter((target) => target.agentId === onlyAgentId)
  }
  const suffix = missingOnly ? '&missingOnly=1' : ''
  const payload = await requestJson(`/api/avatar/profile-image-targets?limit=${limit}${suffix}`)
  return payload.targets || []
}

async function runChromeScreenshot({ chromePath, screenshotPath, captureUrl, virtualTimeBudget, userDataDir }) {
  await execFileAsync(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--use-angle=swiftshader',
    '--use-gl=angle',
    '--hide-scrollbars',
    '--mute-audio',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-extensions',
    '--disable-sync',
    '--metrics-recording-only',
    '--run-all-compositor-stages-before-draw',
    '--window-size=512,512',
    '--force-device-scale-factor=1',
    `--user-data-dir=${userDataDir}`,
    `--virtual-time-budget=${virtualTimeBudget}`,
    `--screenshot=${screenshotPath}`,
    captureUrl,
  ], { windowsHide: true, timeout: Math.max(30000, virtualTimeBudget + 12000) })
}

async function captureProfileImage({ chromePath, target, modelUrl }) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'terarium-profile-'))
  const userDataDir = path.join(tmpDir, 'browser-profile')
  const screenshotPath = path.join(tmpDir, `${target.agentId}.png`)
  const captureUrl =
    `${baseUrl}/avatar-profile-capture?agentId=${encodeURIComponent(target.agentId)}` +
    `&modelUrl=${encodeURIComponent(modelUrl)}` +
    `&v=${Date.now()}`

  try {
    let png = Buffer.alloc(0)
    for (const virtualTimeBudget of [12000, 24000]) {
      await runChromeScreenshot({ chromePath, screenshotPath, captureUrl, virtualTimeBudget, userDataDir })
      png = await fs.readFile(screenshotPath)
      if (png.length >= 4096) break
    }
    if (png.length < 4096) {
      throw new Error(`captured image is unexpectedly small (${png.length} bytes)`)
    }
    return `data:image/png;base64,${png.toString('base64')}`
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}

async function main() {
  const chromePath = await findChrome()
  const targets = await loadTargets()
  if (targets.length === 0) {
    console.log('No profile image targets found.')
    return
  }

  let saved = 0
  for (const target of targets) {
    try {
      console.log(`[profile-capture] building ${target.agentName} (${target.agentId})`)
      const build = await requestJson('/api/avatar/build', {
        method: 'POST',
        body: JSON.stringify({
          agentId: target.agentId,
          appearance: target.appearance,
        }),
      })
      const modelUrl = String(build.modelUrl || '')
      if (!modelUrl) throw new Error('avatar build did not return modelUrl')

      console.log(`[profile-capture] capturing ${target.agentName}`)
      const imageDataUrl = await captureProfileImage({ chromePath, target, modelUrl })
      const savedPayload = await requestJson('/api/avatar/profile-image', {
        method: 'POST',
        body: JSON.stringify({
          agentId: target.agentId,
          imageDataUrl,
          publicBaseUrl,
        }),
      })
      saved += 1
      console.log(`[profile-capture] saved ${target.agentName}: ${savedPayload.profileImageUrl}`)
    } catch (error) {
      console.error(`[profile-capture] failed ${target.agentName || target.agentId}:`, error instanceof Error ? error.message : error)
    }
  }

  console.log(`[profile-capture] complete: ${saved}/${targets.length} saved`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
