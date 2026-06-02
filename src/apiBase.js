const productionApiBase = 'https://tutorial-api.team-doob.com'
const defaultApiBase = import.meta.env.PROD ? productionApiBase : ''
const configuredApiBase = String(import.meta.env.VITE_TUTORIAL_API_BASE || defaultApiBase).replace(/\/+$/, '')

const localProxyUrl = (path) => {
  const normalizedPath = String(path || '')
  if (!import.meta.env.DEV) return normalizedPath

  try {
    const url = new URL(normalizedPath)
    if (url.origin === productionApiBase) {
      return `${url.pathname}${url.search}${url.hash}`
    }
  } catch {
    // Relative paths are already suitable for the local Vite proxy.
  }

  return normalizedPath
}

export const apiUrl = (path) => {
  const normalizedPath = localProxyUrl(path)
  if (!configuredApiBase) return normalizedPath
  if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath
  return `${configuredApiBase}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`
}

export const assetUrl = apiUrl
