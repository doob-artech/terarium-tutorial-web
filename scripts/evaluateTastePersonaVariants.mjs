import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const TUTORIAL_BASE_URL = process.env.TUTORIAL_BASE_URL || 'http://127.0.0.1:3000'
const WORLD_BASE_URL = process.env.WORLD_BASE_URL || 'http://127.0.0.1:8080'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = process.env.OUTPUT_PATH || path.join(__dirname, '..', 'reports', 'taste-persona-evaluation.json')

const cases = [
  {
    id: 'quiet-memory',
    intent: '조용하고 회상적인 관찰자',
    answers: [['old_photo', 'portrait'], ['ambient', 'ballad'], ['drama', 'documentary'], ['library', 'small_room'], ['silence', 'care']],
  },
  {
    id: 'quiet-memory-priority-shift',
    intent: '같은 선택지에서 우선순위만 바뀌는 경우',
    answers: [['portrait', 'old_photo'], ['ballad', 'ambient'], ['documentary', 'drama'], ['small_room', 'library'], ['care', 'silence']],
  },
  {
    id: 'high-energy-social',
    intent: '활동적이고 사람 사이 반응이 빠른 타입',
    answers: [['kitsch', 'cyber'], ['pop', 'techno'], ['comedy', 'action'], ['club', 'rooftop'], ['play', 'conversation']],
  },
  {
    id: 'dark-intense',
    intent: '긴장, 자극, 어두운 감각이 강한 타입',
    answers: [['ruins', 'strange'], ['metal', 'noise'], ['horror', 'thriller'], ['abandoned_factory', 'club'], ['secret', 'debate']],
  },
  {
    id: 'structured-minimal',
    intent: '정돈과 거리 조절을 선호하는 타입',
    answers: [['minimal', 'portrait'], ['classic', 'jazz'], ['documentary', 'drama'], ['hotel', 'library'], ['promise', 'debate']],
  },
  {
    id: 'open-future',
    intent: '새로운 것과 미래적 감각에 끌리는 타입',
    answers: [['cyber', 'abstract'], ['techno', 'ambient'], ['sf', 'cult'], ['studio', 'rooftop'], ['freedom', 'conversation']],
  },
  {
    id: 'warm-companion',
    intent: '친밀감과 돌봄을 중시하는 타입',
    answers: [['nature', 'portrait'], ['ballad', 'jazz'], ['romance', 'drama'], ['small_room', 'sea'], ['care', 'companion']],
  },
  {
    id: 'contradictory',
    intent: '상충하는 감각을 섞었을 때 합성이 평면화되지 않는지 확인',
    answers: [['minimal', 'kitsch', 'strange'], ['classic', 'noise', 'pop'], ['romance', 'horror', 'comedy'], ['library', 'club', 'sea'], ['silence', 'debate', 'play']],
  },
  {
    id: 'single-choice',
    intent: '매 턴 하나만 고른 희소 입력',
    answers: [['abstract'], ['jazz'], ['cult'], ['studio'], ['freedom']],
  },
  {
    id: 'custom-text',
    intent: '직접 입력이 결과에 과하게 노출되지 않는지 확인',
    answers: [['other_custom'], ['ambient'], ['drama'], ['rooftop'], ['companion']],
    customTextByTurn: ['비 오는 날 오래된 상가의 계단참에 앉아 사람들 발소리를 듣는 분위기', '', '', '', ''],
  },
]

async function requestJson(url, options = {}) {
  const response = await fetch(url, options)
  const text = await response.text()
  let payload
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = { raw: text }
  }
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${url} failed ${response.status}: ${text}`)
  return payload
}

async function postTutorial(pathname, body) {
  return requestJson(`${TUTORIAL_BASE_URL}${pathname}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function deleteTemporaryAgent(agentId) {
  if (!agentId) return
  await requestJson(`${WORLD_BASE_URL}/v1/world/agents/${encodeURIComponent(agentId)}`, { method: 'DELETE' }).catch((error) => {
    console.warn(`[cleanup] ${agentId}: ${error.message}`)
  })
}

async function evaluateCase(testCase) {
  const started = await postTutorial('/api/persona/start', {})
  const agentId = started.agentId
  let question = started.question
  let finalResult = null
  let fallbackPersona = false
  try {
    for (let index = 0; index < testCase.answers.length; index += 1) {
      const selectedOptionIds = testCase.answers[index]
      const answered = await postTutorial('/api/persona/answer', {
        agentId,
        turn: question?.turn || index + 1,
        answer: {
          selectedOptionIds,
          starredOptionId: selectedOptionIds[0],
          customText: testCase.customTextByTurn?.[index] || '',
        },
      })
      question = answered.question
      finalResult = answered.result || finalResult
      fallbackPersona = Boolean(answered.fallbackPersona)
    }
    return {
      id: testCase.id,
      intent: testCase.intent,
      answers: testCase.answers,
      customTextByTurn: testCase.customTextByTurn || [],
      fallbackPersona,
      persona: finalResult?.public_result?.persona_block || finalResult?.persona_block || '',
      profileImageDirection: finalResult?.public_result?.profile_image_direction || '',
      profileImagePrompt: finalResult?.public_result?.profile_image_prompt || '',
      snsProfileBio: finalResult?.public_result?.sns_profile_bio || '',
      agentId,
    }
  } finally {
    await deleteTemporaryAgent(agentId)
  }
}

async function main() {
  const startedAt = new Date().toISOString()
  const results = []
  for (const testCase of cases) {
    console.log(`[evaluate] ${testCase.id}`)
    try {
      results.push(await evaluateCase(testCase))
    } catch (error) {
      results.push({ id: testCase.id, intent: testCase.intent, answers: testCase.answers, error: error.message })
    }
  }
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true })
  await fs.writeFile(OUTPUT_PATH, JSON.stringify({ startedAt, completedAt: new Date().toISOString(), results }, null, 2))
  console.log(`[report] ${OUTPUT_PATH}`)
  for (const result of results) {
    console.log(`\n## ${result.id}${result.fallbackPersona ? ' [fallback]' : ''}`)
    console.log(result.error || result.persona)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
