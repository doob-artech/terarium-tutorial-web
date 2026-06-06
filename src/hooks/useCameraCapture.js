import { useCallback, useEffect, useRef, useState } from 'react'

const CAMERA_STAGES = new Set(['webcam', 'cameraDesignCapture'])
const CAMERA_LOG_PREFIX = '[tutorial-camera]'
const SECONDARY_CAMERA_PROBE_DELAYS_MS = [800, 1800, 3600, 6500]

const captureVideoFrame = (video) => {
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
}

export function useCameraCapture({ stage, setCameraReady }) {
  const videoRef = useRef(null)
  const secondaryVideoRef = useRef(null)
  const streamRef = useRef(null)
  const secondaryStreamRef = useRef(null)
  const [cameraDevices, setCameraDevices] = useState([])
  const [selectedCameraId, setSelectedCameraId] = useState('')

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (secondaryStreamRef.current) {
      secondaryStreamRef.current.getTracks().forEach((track) => track.stop())
      secondaryStreamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    if (secondaryVideoRef.current) {
      secondaryVideoRef.current.srcObject = null
    }
  }, [])

  const captureCurrentFrame = useCallback(() => {
    return captureVideoFrame(videoRef.current)
  }, [])

  const captureCameraFrames = useCallback(() => ({
    frontImageDataUrl: captureVideoFrame(videoRef.current),
    rearImageDataUrl: captureVideoFrame(secondaryVideoRef.current),
  }), [])

  const refreshCameraDevices = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      setCameraDevices([])
      return []
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices
        .filter((device) => device.kind === 'videoinput')
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${index + 1}`,
        }))

      setCameraDevices(videoDevices)
      console.info(
        CAMERA_LOG_PREFIX,
        'video devices:',
        videoDevices.map((device, index) => ({
          index: index + 1,
          label: device.label,
          hasDeviceId: Boolean(device.deviceId),
        })),
      )
      return videoDevices
    } catch (error) {
      console.warn(CAMERA_LOG_PREFIX, 'enumerateDevices failed:', error)
      setCameraDevices([])
      return []
    }
  }, [])

  useEffect(() => {
    if (!CAMERA_STAGES.has(stage)) {
      return undefined
    }

    let canceled = false
    let primaryCameraIdForEffect = ''
    const probeTimeouts = []

    const clearProbeTimeouts = () => {
      probeTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId))
      probeTimeouts.length = 0
    }

    const startSecondaryCameraIfAvailable = async (devices, primaryCameraId, reason = 'scan') => {
      if (canceled || secondaryStreamRef.current) {
        return false
      }

      const secondaryDevice = devices.find((device) => device.deviceId && device.deviceId !== primaryCameraId)
      if (!secondaryDevice) {
        console.info(CAMERA_LOG_PREFIX, 'secondary camera not available:', {
          reason,
          deviceCount: devices.length,
          hasPrimaryDeviceId: Boolean(primaryCameraId),
        })
        return false
      }

      try {
        const secondaryStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: secondaryDevice.deviceId } },
          audio: false,
        })
        if (canceled) {
          secondaryStream.getTracks().forEach((track) => track.stop())
          return false
        }

        secondaryStreamRef.current = secondaryStream
        console.info(CAMERA_LOG_PREFIX, 'secondary camera opened:', {
          reason,
          label: secondaryStream.getVideoTracks()[0]?.label || secondaryDevice.label,
          hasDeviceId: Boolean(secondaryDevice.deviceId),
        })
        if (secondaryVideoRef.current) {
          secondaryVideoRef.current.srcObject = secondaryStream
        }
        return true
      } catch (secondaryError) {
        console.warn(CAMERA_LOG_PREFIX, 'secondary camera failed:', {
          reason,
          label: secondaryDevice.label,
          error: secondaryError,
        })
        if (secondaryVideoRef.current) {
          secondaryVideoRef.current.srcObject = null
        }
        return false
      }
    }

    const probeSecondaryCamera = (reason) => {
      if (!navigator.mediaDevices?.enumerateDevices || !primaryCameraIdForEffect || secondaryStreamRef.current) {
        return
      }

      void (async () => {
        const devices = await refreshCameraDevices()
        await startSecondaryCameraIfAvailable(devices, primaryCameraIdForEffect, reason)
      })()
    }

    const startCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return
      }

      try {
        setCameraReady(false)
        stopCamera()

        const initialDevices = await refreshCameraDevices()
        const preferredCameraId = selectedCameraId || initialDevices[0]?.deviceId || ''
        let stream = null
        try {
          const videoConstraint = preferredCameraId
            ? { deviceId: { exact: preferredCameraId } }
            : { facingMode: 'user' }
          stream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraint,
            audio: false,
          })
        } catch (preferredError) {
          console.warn(CAMERA_LOG_PREFIX, 'main camera preferred constraint failed; retrying default camera:', preferredError)
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          })
        }

        if (canceled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        const activeTrack = stream.getVideoTracks()[0]
        const activeDeviceId = activeTrack?.getSettings?.().deviceId || ''
        console.info(CAMERA_LOG_PREFIX, 'main camera opened:', {
          label: activeTrack?.label || '',
          hasDeviceId: Boolean(activeDeviceId),
        })
        const devices = await refreshCameraDevices()
        const primaryCameraId = activeDeviceId || preferredCameraId || devices[0]?.deviceId || ''
        primaryCameraIdForEffect = primaryCameraId
        if (primaryCameraId && primaryCameraId !== selectedCameraId) {
          setSelectedCameraId(primaryCameraId)
        }
        await startSecondaryCameraIfAvailable(devices, primaryCameraId, 'initial')
        SECONDARY_CAMERA_PROBE_DELAYS_MS.forEach((delayMs, index) => {
          const timeoutId = window.setTimeout(() => {
            probeSecondaryCamera(`continuity-probe-${index + 1}`)
          }, delayMs)
          probeTimeouts.push(timeoutId)
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            setCameraReady(true)
          }
        }
        setCameraReady(true)
      } catch (error) {
        console.error(CAMERA_LOG_PREFIX, 'main camera failed:', error)
        setCameraReady(false)
      }
    }

    startCamera()

    const handleDeviceChange = () => {
      probeSecondaryCamera('devicechange')
    }
    navigator.mediaDevices?.addEventListener?.('devicechange', handleDeviceChange)

    return () => {
      canceled = true
      clearProbeTimeouts()
      navigator.mediaDevices?.removeEventListener?.('devicechange', handleDeviceChange)
      setCameraReady(false)
      stopCamera()
    }
  }, [stage, selectedCameraId, setCameraReady, stopCamera, refreshCameraDevices])

  return {
    videoRef,
    secondaryVideoRef,
    stopCamera,
    captureCurrentFrame,
    captureCameraFrames,
    cameraDevices,
    selectedCameraId,
    setSelectedCameraId,
    refreshCameraDevices,
  }
}
