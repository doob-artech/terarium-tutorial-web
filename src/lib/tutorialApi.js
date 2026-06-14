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

export async function runAppearancePipeline({
  agentId,
  frontImageDataUrl,
  rearImageDataUrl,
  signal,
}) {
  const payload = await requestJson('/api/pipeline/appearance', {
    method: 'POST',
    body: {
      agentId,
      frontImageDataUrl,
      rearImageDataUrl,
    },
    fallbackError: 'Appearance pipeline request failed.',
    signal,
  })

  if (!payload?.agentId || !payload?.result || typeof payload.result !== 'object' || !payload?.avatar?.modelUrl) {
    throw new Error('Server returned an invalid appearance pipeline response.')
  }

  return payload
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

export async function startPersona({ agentId, appearance }) {
  const payload = await requestJson('/api/persona/start', {
    method: 'POST',
    body: { agentId, appearance },
    fallbackError: 'Persona start request failed.',
  })

  if (!payload?.agentId || !payload?.question) {
    throw new Error('Server returned an invalid persona start response.')
  }

  return payload
}

export async function synthesizePersona({
  agentId,
  appearance,
  positiveKeywords,
  negativeKeywords,
  unusualKeywords,
  terariumWish,
}) {
  const payload = await requestJson('/api/persona/synthesize', {
    method: 'POST',
    body: {
      agentId,
      appearance,
      positive_keywords: positiveKeywords,
      negative_keywords: negativeKeywords,
      unusual_keywords: unusualKeywords,
      terarium_wish: terariumWish,
    },
    fallbackError: 'Persona synthesis request failed.',
  })

  if (
    !payload?.done
    || !payload?.result
    || !payload?.persona_json
    || !payload?.enterUrl
  ) {
    throw new Error('Server returned an invalid persona synthesis response.')
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
