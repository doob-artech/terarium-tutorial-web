const configuredApiBase = String(import.meta.env.VITE_TUTORIAL_API_BASE || '').replace(/\/+$/, '')

export const apiUrl = (path) => {
  const normalizedPath = String(path || '')
  if (!configuredApiBase) return normalizedPath
  if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath
  return `${configuredApiBase}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`
}

export const assetUrl = apiUrl
