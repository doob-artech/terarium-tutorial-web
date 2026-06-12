import { useCallback, useRef } from 'react'
import { buildAvatar, saveAvatarProfileImage } from '../lib/tutorialApi.js'

export function useAvatarWorkflow({
  avatarModelUrl,
  getActiveAgentId,
  normalizeAssetUrl,
  setAvatarModelUrl,
}) {
  const uploadedProfileImageKeyRef = useRef('')

  const resetProfileImageUpload = useCallback(() => {
    uploadedProfileImageKeyRef.current = ''
  }, [])

  const buildAvatarModel = useCallback(async ({ agentId, appearance }) => {
    if (!agentId || !appearance) {
      return null
    }

    const payload = await buildAvatar({ agentId, appearance })
    setAvatarModelUrl(normalizeAssetUrl(payload.modelUrl))
    return payload
  }, [normalizeAssetUrl, setAvatarModelUrl])

  const handleAvatarProfileImageReady = useCallback(async (viewerApi) => {
    const activeAgentId = getActiveAgentId()
    if (!activeAgentId || !viewerApi || typeof viewerApi.capturePng !== 'function') {
      return
    }

    const uploadKey = `${activeAgentId}:${avatarModelUrl}`
    if (uploadedProfileImageKeyRef.current === uploadKey) {
      return
    }
    uploadedProfileImageKeyRef.current = uploadKey

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 120))
      const imageDataUrl = viewerApi.capturePng()
      if (!imageDataUrl || !imageDataUrl.startsWith('data:image/')) {
        return
      }

      await saveAvatarProfileImage({
        agentId: activeAgentId,
        imageDataUrl,
      })
    } catch (error) {
      uploadedProfileImageKeyRef.current = ''
      console.warn(error instanceof Error ? error.message : 'Unknown error while saving avatar profile image.')
    }
  }, [avatarModelUrl, getActiveAgentId])

  return {
    buildAvatarModel,
    handleAvatarProfileImageReady,
    resetProfileImageUpload,
  }
}
