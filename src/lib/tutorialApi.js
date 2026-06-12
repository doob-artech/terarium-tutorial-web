import { apiUrl } from '../apiBase.js'

const jsonHeaders = {
  'Content-Type': 'application/json',
}

async function requestJson(path, { method = 'GET', body, fallbackError = 'Request failed.', signal } = {}) {
  const response = await fetch(apiUrl(path), {
    method,
    headers: jsonHeaders,
    cache: 'no-store',
    signal,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.error ?? payload?.detail ?? fallbackError)
  }

  return payload
}

export async function analyzeAppearance(input) {
  const body = typeof input === 'string'
    ? { imageDataUrl: input }
    : {
        frontImageDataUrl: input?.frontImageDataUrl || input?.imageDataUrl || '',
        rearImageDataUrl: input?.rearImageDataUrl || '',
      }

  const payload = await requestJson('/api/analyze-appearance', {
    method: 'POST',
    body,
    fallbackError: 'Analyze request failed.',
  })

  if (!payload?.result || typeof payload.result !== 'object') {
    throw new Error('Server returned an invalid analyze response.')
  }

  return payload.result
}

export async function syncPersonaAppearance(agentId, appearance) {
  await requestJson('/api/persona/appearance', {
    method: 'POST',
    body: { agentId, appearance },
    fallbackError: 'Appearance sync request failed.',
  })
}

export async function buildAvatar({ agentId, appearance, signal }) {
  return requestJson('/api/avatar/build', {
    method: 'POST',
    body: { agentId, appearance },
    fallbackError: 'Avatar build request failed.',
    signal,
  })
}

export async function saveAvatarProfileImage({ agentId, imageDataUrl }) {
  return requestJson('/api/avatar/profile-image', {
    method: 'POST',
    body: { agentId, imageDataUrl },
    fallbackError: 'Avatar profile image request failed.',
  })
}

export async function createRandomAgent() {
  const payload = await requestJson('/api/random-agent', {
    method: 'POST',
    body: {},
    fallbackError: 'Random agent request failed.',
  })

  if (!payload?.agentId || !payload?.avatar?.modelUrl) {
    throw new Error('Server returned an invalid random-agent response.')
  }

  return payload
}

export async function startPersona({ appearance }) {
  const payload = await requestJson('/api/persona/start', {
    method: 'POST',
    body: { appearance },
    fallbackError: 'Persona start request failed.',
  })

  if (!payload?.agentId || !payload?.question) {
    throw new Error('Server returned an invalid persona start response.')
  }

  return payload
}

export async function answerPersona({ agentId, answer, turn }) {
  const payload = await requestJson('/api/persona/answer', {
    method: 'POST',
    body: { agentId, answer, turn },
    fallbackError: 'Persona answer request failed.',
  })

  if (!payload?.done && !payload?.question) {
    throw new Error('Server returned an invalid next-question response.')
  }

  return payload
}

export async function undoPersonaAnswer({ agentId, turn }) {
  const payload = await requestJson('/api/persona/undo', {
    method: 'POST',
    body: { agentId, turn },
    fallbackError: 'Persona undo request failed.',
  })

  if (!payload?.question) {
    throw new Error('Server returned an invalid undo response.')
  }

  return payload
}

export function personaSessionAbandonUrl() {
  return apiUrl('/api/persona/session/abandon')
}

export async function abandonPersonaSession(agentId) {
  if (!agentId) return null
  return requestJson('/api/persona/session/abandon', {
    method: 'POST',
    body: { agentId },
    fallbackError: 'Persona abandon request failed.',
  })
}

export async function claimNickname({ agentId, nickname }) {
  return requestJson('/api/nickname/claim', {
    method: 'POST',
    body: { agentId, nickname },
    fallbackError: '닉네임 저장에 실패했습니다.',
  })
}

export async function renameAvatar({ agentId, nickname }) {
  return requestJson('/api/avatar/rename', {
    method: 'POST',
    body: { agentId, nickname },
    fallbackError: 'Avatar rename request failed.',
  })
}

export async function fetchAvatarRecipe(agentId) {
  return requestJson(`/api/avatar/recipe/${encodeURIComponent(agentId)}`, {
    fallbackError: 'avatar recipe not found',
  })
}
