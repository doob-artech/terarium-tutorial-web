import { useCallback, useEffect, useRef } from 'react'

const CAMERA_STAGES = new Set(['webcam', 'cameraDesignCapture'])

export function useCameraCapture({ stage, setCameraReady }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const captureCurrentFrame = useCallback(() => {
    const video = videoRef.current

    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      return null
    }

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return null
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.92)
  }, [])

  useEffect(() => {
    if (!CAMERA_STAGES.has(stage)) {
      return undefined
    }

    let canceled = false

    const startCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        })

        if (canceled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            setCameraReady(true)
          }
        }
        setCameraReady(true)
      } catch {
        setCameraReady(false)
      }
    }

    startCamera()

    return () => {
      canceled = true
      setCameraReady(false)
      stopCamera()
    }
  }, [stage, setCameraReady, stopCamera])

  return {
    videoRef,
    stopCamera,
    captureCurrentFrame,
  }
}
