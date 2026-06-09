import { useCallback, useEffect, useRef, useState } from 'react'

const CAMERA_STAGES = new Set(['webcam', 'cameraDesignCapture'])
const CAMERA_LOG_PREFIX = '[tutorial-camera]'
const PREFERRED_CAMERA_LABEL_PATTERN = /(orbbec|femto|bolt)/i
const PREFERRED_COLOR_CAMERA_LABEL_PATTERN = /(color|colour|rgb|webcam|video)/i
const NON_COLOR_CAMERA_LABEL_PATTERN = /(depth|ir|infrared|tof|stereo)/i
const ANALYSIS_CAPTURE_MAX_EDGE = 720
const ANALYSIS_CAPTURE_JPEG_QUALITY = 0.68
const ANALYSIS_CAPTURE_GAMMA = 1.14
const CAMERA_VIDEO_QUALITY = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: 24, max: 30 },
}

const captureVideoFrame = (
  video,
  {
    maxEdge = ANALYSIS_CAPTURE_MAX_EDGE,
    quality = ANALYSIS_CAPTURE_JPEG_QUALITY,
    gamma = ANALYSIS_CAPTURE_GAMMA,
  } = {},
) => {
  if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
    return null
  }

  const sourceWidth = video.videoWidth
  const sourceHeight = video.videoHeight
  const scale = Math.min(1, maxEdge / Math.max(sourceWidth, sourceHeight))
  const width = Math.max(1, Math.round(sourceWidth * scale))
  const height = Math.max(1, Math.round(sourceHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return null
  }

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  if (gamma && Math.abs(gamma - 1) > 0.01) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const inverseGamma = 1 / gamma
    for (let index = 0; index < imageData.data.length; index += 4) {
      imageData.data[index] = Math.round(255 * ((imageData.data[index] / 255) ** inverseGamma))
      imageData.data[index + 1] = Math.round(255 * ((imageData.data[index + 1] / 255) ** inverseGamma))
      imageData.data[index + 2] = Math.round(255 * ((imageData.data[index + 2] / 255) ** inverseGamma))
    }
    ctx.putImageData(imageData, 0, 0)
  }
  const dataUrl = canvas.toDataURL('image/jpeg', quality)
  console.info(CAMERA_LOG_PREFIX, 'captured analysis frame:', {
    source: `${sourceWidth}x${sourceHeight}`,
    sent: `${width}x${height}`,
    gamma,
    bytes: Math.round((dataUrl.length * 3) / 4),
  })
  return dataUrl
}

export function useCameraCapture({ stage, setCameraReady }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [cameraDevices, setCameraDevices] = useState([])
  const [selectedCameraId, setSelectedCameraId] = useState('')

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
    return captureVideoFrame(videoRef.current)
  }, [])

  const captureCameraFrames = useCallback(() => ({
    frontImageDataUrl: captureVideoFrame(videoRef.current),
    rearImageDataUrl: '',
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

  const choosePreferredCameraId = useCallback((devices) => {
    const preferredDevices = devices.filter((device) => PREFERRED_CAMERA_LABEL_PATTERN.test(device.label || ''))
    const preferredDevice =
      preferredDevices.find((device) => {
        const label = device.label || ''
        return PREFERRED_COLOR_CAMERA_LABEL_PATTERN.test(label) && !NON_COLOR_CAMERA_LABEL_PATTERN.test(label)
      }) ||
      preferredDevices.find((device) => !NON_COLOR_CAMERA_LABEL_PATTERN.test(device.label || '')) ||
      preferredDevices[0]
    if (preferredDevice?.deviceId) {
      console.info(CAMERA_LOG_PREFIX, 'preferred camera selected:', {
        label: preferredDevice.label,
        reason: NON_COLOR_CAMERA_LABEL_PATTERN.test(preferredDevice.label || '')
          ? 'orbbec-femto-bolt-fallback'
          : 'orbbec-femto-bolt-color',
      })
      return preferredDevice.deviceId
    }

    if (selectedCameraId && devices.some((device) => (
      device.deviceId === selectedCameraId && !NON_COLOR_CAMERA_LABEL_PATTERN.test(device.label || '')
    ))) {
      return selectedCameraId
    }

    return devices.find((device) => !NON_COLOR_CAMERA_LABEL_PATTERN.test(device.label || ''))?.deviceId || devices[0]?.deviceId || ''
  }, [selectedCameraId])

  useEffect(() => {
    if (!CAMERA_STAGES.has(stage)) {
      return undefined
    }

    let canceled = false

    const openCameraStream = async (cameraId) => {
      const videoConstraint = cameraId
        ? { ...CAMERA_VIDEO_QUALITY, deviceId: { exact: cameraId } }
        : { ...CAMERA_VIDEO_QUALITY, facingMode: 'user' }
      return navigator.mediaDevices.getUserMedia({
        video: videoConstraint,
        audio: false,
      })
    }

    const startCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return
      }

      try {
        setCameraReady(false)
        stopCamera()

        const initialDevices = await refreshCameraDevices()
        const preferredCameraId = choosePreferredCameraId(initialDevices)
        let stream = null
        try {
          stream = await openCameraStream(preferredCameraId)
        } catch (preferredError) {
          console.warn(CAMERA_LOG_PREFIX, 'main camera preferred constraint failed; retrying default camera:', preferredError)
          stream = await navigator.mediaDevices.getUserMedia({
            video: CAMERA_VIDEO_QUALITY,
            audio: false,
          })
        }

        if (canceled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        let activeTrack = stream.getVideoTracks()[0]
        let activeDeviceId = activeTrack?.getSettings?.().deviceId || ''
        console.info(CAMERA_LOG_PREFIX, 'main camera opened:', {
          label: activeTrack?.label || '',
          hasDeviceId: Boolean(activeDeviceId),
        })

        const devices = await refreshCameraDevices()
        const preferredAfterPermissionId = choosePreferredCameraId(devices)
        const currentCameraId = activeDeviceId || preferredCameraId
        if (preferredAfterPermissionId && preferredAfterPermissionId !== currentCameraId) {
          console.info(CAMERA_LOG_PREFIX, 'switching to preferred camera after permission labels resolved')
          stream.getTracks().forEach((track) => track.stop())
          stream = await openCameraStream(preferredAfterPermissionId)
          if (canceled) {
            stream.getTracks().forEach((track) => track.stop())
            return
          }
          activeTrack = stream.getVideoTracks()[0]
          activeDeviceId = activeTrack?.getSettings?.().deviceId || preferredAfterPermissionId
          console.info(CAMERA_LOG_PREFIX, 'main camera opened:', {
            label: activeTrack?.label || '',
            hasDeviceId: Boolean(activeDeviceId),
          })
        }

        streamRef.current = stream
        const activeCameraId = activeDeviceId || preferredAfterPermissionId || preferredCameraId || devices[0]?.deviceId || ''
        if (activeCameraId && activeCameraId !== selectedCameraId) {
          setSelectedCameraId(activeCameraId)
        }

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
      void refreshCameraDevices()
    }
    navigator.mediaDevices?.addEventListener?.('devicechange', handleDeviceChange)

    return () => {
      canceled = true
      navigator.mediaDevices?.removeEventListener?.('devicechange', handleDeviceChange)
      setCameraReady(false)
      stopCamera()
    }
  }, [stage, selectedCameraId, setCameraReady, stopCamera, refreshCameraDevices, choosePreferredCameraId])

  return {
    videoRef,
    stopCamera,
    captureCurrentFrame,
    captureCameraFrames,
    cameraDevices,
    selectedCameraId,
    setSelectedCameraId,
    refreshCameraDevices,
  }
}
