import { useCallback, useEffect, useRef, useState } from 'react'
import TutorialDesign from './tutorialDesign/TutorialDesign.jsx'
import AvatarThreeViewer from './tutorialDesign/AvatarThreeViewer.jsx'
import clickSoundSrc from './tutorialDesign/assets/click1.mp3'
import './App.css'

const TEST_MODE_SKIP_CAPTURE_ANALYSIS = import.meta.env.VITE_SKIP_CAPTURE_ANALYSIS === 'true'
const TEST_MODE_RELAXED_NICKNAME = import.meta.env.DEV || import.meta.env.VITE_ALLOW_DUPLICATE_NICKNAME === 'true'
const PERSONA_TOTAL_TURNS = 5
const CLICK_SOUND_FALLBACK_MS = 320
const CLICK_SOUND_TAIL_GAP_MS = 40

const DEBUG_AVATAR_OPTIONS = {
  hair: [
    ['bun_hair', '번 헤어'],
    ['bun_hair_with_bangs', '앞머리 번'],
    ['bob_hair_with_bangs', '단발 앞머리'],
    ['permed_short_hair', '펌 숏헤어'],
    ['half_ponytail_hair', '하프 포니테일'],
    ['long_wave_hair_with_bangs', '긴 웨이브 앞머리'],
    ['long_wave_hair', '긴 웨이브'],
    ['low_tied_hair', '낮게 묶은 머리'],
    ['high_tied_hair', '높게 묶은 머리'],
    ['bowl_cut_hair', '바가지 컷'],
    ['gael_cut_left_hair', '가엘컷 왼쪽'],
    ['gael_cut_right_hair', '가엘컷 오른쪽'],
    ['wolf_cut_hair', '울프컷'],
    ['pompadour_hair', '포마드'],
    ['dandy_cut_hair', '댄디컷'],
  ],
  skin: [
    ['soft_peach_skin', '피치 피부'],
    ['light_warm_skin', '밝은 웜 피부'],
  ],
  eye: [
    ['round_open_eyes', '동그란 눈'],
    ['almond_upturned_eyes', '올라간 눈'],
    ['hooded_shadow_eyes', '그늘진 눈'],
    ['simple_block_eyes', '심플 눈'],
  ],
  mouth: [
    ['closed_smile_mouth', '닫힌 미소'],
    ['bored_mouth', '무심한 입'],
    ['broad_smile_mouth', '큰 미소'],
    ['smirk_mouth', '스마크'],
    ['w_shape_mouth', 'W 입'],
    ['toothy_smile_mouth', '치아 미소'],
  ],
  top: [
    ['short_sleeve_tshirt', '반팔 티셔츠'],
    ['long_sleeve_tshirt', '긴팔 티셔츠'],
    ['button_shirt', '단추 셔츠'],
  ],
  bottom: [
    ['short_pants', '짧은 바지'],
    ['long_pants', '긴 바지'],
    ['short_skirt', '짧은 치마'],
    ['long_skirt', '긴 치마'],
  ],
  outfit: [
    ['none', '원피스 없음'],
    ['short_onepiece', '짧은 원피스'],
    ['long_onepiece', '긴 원피스'],
  ],
  shoes: [
    ['sneakers', '운동화'],
    ['sandals', '샌달'],
  ],
}

const DEBUG_ASSET_TO_APPEARANCE = {
  hair: {
    bun_hair: ['bun', 'none', 'center'],
    bun_hair_with_bangs: ['bun', 'full_bang', 'center'],
    bob_hair_with_bangs: ['bob_straight', 'full_bang', 'center'],
    permed_short_hair: ['short_cut', 'none', 'center'],
    half_ponytail_hair: ['half_up', 'none', 'center'],
    long_wave_hair_with_bangs: ['long_wave', 'full_bang', 'center'],
    long_wave_hair: ['long_wave', 'none', 'center'],
    low_tied_hair: ['ponytail_low', 'none', 'center'],
    high_tied_hair: ['ponytail_high', 'none', 'center'],
    bowl_cut_hair: ['bowl_cut', 'full_bang', 'center'],
    gael_cut_left_hair: ['gael_cut_left', 'none', 'left'],
    gael_cut_right_hair: ['gael_cut_right', 'none', 'right'],
    wolf_cut_hair: ['wolf_cut', 'none', 'center'],
    pompadour_hair: ['pomade', 'none', 'center'],
    dandy_cut_hair: ['dandy_cut', 'none', 'center'],
  },
  top: {
    short_sleeve_tshirt: 'short_sleeve_tshirt',
    long_sleeve_tshirt: 'long_sleeve_tshirt',
    button_shirt: 'button_shirt',
  },
  bottom: {
    short_pants: 'shorts',
    long_pants: 'long_pants',
    short_skirt: 'short_skirt',
    long_skirt: 'long_skirt',
  },
  outfit: {
    short_onepiece: 'short_onepiece',
    long_onepiece: 'long_onepiece',
  },
}

let personaClickAudioPool = []
let personaClickAudioPoolIndex = 0
let personaClickBlockedUntil = 0

const getPersonaClickAudioPool = () => {
  if (typeof window === 'undefined') {
    return []
  }

  if (personaClickAudioPool.length === 0) {
    personaClickAudioPool = Array.from({ length: 3 }, () => {
      const audio = new Audio(clickSoundSrc)
      audio.preload = 'auto'
      audio.volume = 1
      return audio
    })
  }

  return personaClickAudioPool
}

const playPersonaClickSound = () => {
  if (Date.now() < personaClickBlockedUntil) {
    return
  }

  const pool = getPersonaClickAudioPool()
  if (pool.length === 0) {
    return
  }

  const audio = pool[personaClickAudioPoolIndex]
  personaClickAudioPoolIndex = (personaClickAudioPoolIndex + 1) % pool.length
  const clickDurationMs =
    Number.isFinite(audio.duration) && audio.duration > 0
      ? audio.duration * 1000
      : CLICK_SOUND_FALLBACK_MS
  personaClickBlockedUntil = Date.now() + clickDurationMs + CLICK_SOUND_TAIL_GAP_MS
  audio.currentTime = 0
  void audio.play().catch(() => {})
}

const MOCK_APPEARANCE_RESULT = {
  hair_style: 'short_cut',
  hair_part_direction: 'center',
  bangs_type: 'none',
  hair_color: 'black',
  eye_type: 'round_open_eyes',
  eye_color: 'dark_brown',
  mouth_type: 'closed_smile',
  top_type: 'hoodie',
  bottom_type: 'wide_long_pants',
  accessories: {
    glasses_type: 'none',
    has_necklace: false,
    has_earrings: false,
  },
}

function App() {
  const urlParams = new URLSearchParams(window.location.search)
  if (window.location.pathname === '/debug') {
    return <AvatarDebugPage />
  }
  const isProfileCaptureRoute = window.location.pathname === '/avatar-profile-capture'
    || urlParams.get('mode') === 'avatar-profile-capture'
  if (isProfileCaptureRoute) {
    return <AvatarProfileCapturePage />
  }

  return <TutorialApp />
}

function AvatarDebugPage() {
  const [selection, setSelection] = useState({
    hair: 'long_wave_hair',
    skin: 'soft_peach_skin',
    eye: 'round_open_eyes',
    mouth: 'closed_smile_mouth',
    top: 'short_sleeve_tshirt',
    bottom: 'short_pants',
    outfit: 'none',
    shoes: 'sneakers',
  })
  const [modelUrl, setModelUrl] = useState('')
  const [manifest, setManifest] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const requestSeqRef = useRef(0)

  const updateSelection = (key, value) => {
    setSelection((current) => ({ ...current, [key]: value }))
  }

  useEffect(() => {
    const requestSeq = requestSeqRef.current + 1
    requestSeqRef.current = requestSeq
    const controller = new AbortController()
    const build = async () => {
      setStatus('loading')
      setError('')
      const hairInfo = DEBUG_ASSET_TO_APPEARANCE.hair[selection.hair] || ['long_wave', 'none', 'center']
      const hasOutfit = selection.outfit !== 'none'
      const appearance = {
        hair_style: hairInfo[0],
        hair_part_direction: hairInfo[2],
        bangs_type: hairInfo[1],
        hair_color: 'black',
        eye_type: selection.eye,
        eye_color: 'dark_brown',
        mouth_type: selection.mouth.replace(/_mouth$/, '').replace('broad_smile', 'big_smile'),
        top_type: DEBUG_ASSET_TO_APPEARANCE.top[selection.top],
        top_color: 'white',
        bottom_type: hasOutfit
          ? DEBUG_ASSET_TO_APPEARANCE.outfit[selection.outfit]
          : DEBUG_ASSET_TO_APPEARANCE.bottom[selection.bottom],
        bottom_color: hasOutfit ? 'white' : 'black',
        shoe_type: selection.shoes,
        accessories: {
          glasses_type: 'none',
          has_necklace: false,
          has_earrings: false,
        },
        asset_tags: {
          skin_texture: selection.skin,
          eye_texture: selection.eye,
          mouth_texture: selection.mouth,
          hair_mesh: selection.hair,
          top_mesh: selection.top,
          bottom_mesh: selection.bottom,
          outfit_mesh: selection.outfit,
          shoe_mesh: selection.shoes,
          glasses_mesh: 'none',
          necklace_mesh: 'none',
          earring_mesh: 'none',
        },
      }

      try {
        const response = await fetch('/api/avatar/build', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: `debug-avatar-${requestSeq}`,
            appearance,
          }),
          signal: controller.signal,
        })
        const payload = await response.json()
        if (!response.ok) {
          throw new Error(payload?.error || 'avatar build failed')
        }
        if (requestSeqRef.current !== requestSeq) return
        setModelUrl(payload.modelUrl || '')
        setManifest(payload)
        setStatus('ready')
      } catch (buildError) {
        if (controller.signal.aborted || requestSeqRef.current !== requestSeq) return
        setStatus('error')
        setError(buildError instanceof Error ? buildError.message : 'avatar build failed')
      }
    }

    const timer = window.setTimeout(build, 120)
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [selection])

  const hasOutfit = selection.outfit !== 'none'
  const selectedNodes = manifest?.merge?.selectedNodes || []

  return (
    <main className="debug-avatar-page">
      <section className="debug-avatar-view">
        <div className="debug-avatar-stage">
          {modelUrl ? (
            <AvatarThreeViewer
              src={modelUrl}
              alt="아바타 디버그 미리보기"
              variant="avatar"
              distanceMultiplier={1.7}
              className="debug-avatar-canvas"
            />
          ) : (
            <div className="debug-avatar-empty">아바타 생성 중</div>
          )}
        </div>
        <div className="debug-avatar-state">
          <span>{status === 'loading' ? '생성 중' : status === 'ready' ? '준비됨' : status === 'error' ? '오류' : '대기'}</span>
          {error ? <strong>{error}</strong> : null}
        </div>
      </section>

      <aside className="debug-avatar-panel" aria-label="아바타 에셋 선택">
        <h1>Avatar Debug</h1>
        <DebugSelect label="머리" value={selection.hair} options={DEBUG_AVATAR_OPTIONS.hair} onChange={(value) => updateSelection('hair', value)} />
        <DebugSelect label="피부" value={selection.skin} options={DEBUG_AVATAR_OPTIONS.skin} onChange={(value) => updateSelection('skin', value)} />
        <DebugSelect label="눈" value={selection.eye} options={DEBUG_AVATAR_OPTIONS.eye} onChange={(value) => updateSelection('eye', value)} />
        <DebugSelect label="입" value={selection.mouth} options={DEBUG_AVATAR_OPTIONS.mouth} onChange={(value) => updateSelection('mouth', value)} />
        <DebugSelect label="원피스" value={selection.outfit} options={DEBUG_AVATAR_OPTIONS.outfit} onChange={(value) => updateSelection('outfit', value)} />
        <DebugSelect label="상의" value={selection.top} options={DEBUG_AVATAR_OPTIONS.top} disabled={hasOutfit} onChange={(value) => updateSelection('top', value)} />
        <DebugSelect label="하의" value={selection.bottom} options={DEBUG_AVATAR_OPTIONS.bottom} disabled={hasOutfit} onChange={(value) => updateSelection('bottom', value)} />
        <DebugSelect label="신발" value={selection.shoes} options={DEBUG_AVATAR_OPTIONS.shoes} onChange={(value) => updateSelection('shoes', value)} />

        <div className="debug-avatar-nodes">
          <h2>selectedNodes</h2>
          <code>{selectedNodes.length ? selectedNodes.join(', ') : '-'}</code>
        </div>
      </aside>
    </main>
  )
}

function DebugSelect({ label, value, options, disabled = false, onChange }) {
  return (
    <label className={`debug-select ${disabled ? 'is-disabled' : ''}`}>
      <span>{label}</span>
      <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  )
}

function TutorialApp() {
  const [stage, setStage] = useState('idle')
  const [countdown, setCountdown] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [personaAgentId, setPersonaAgentId] = useState('')
  const [personaQuestion, setPersonaQuestion] = useState(null)
  const [personaLoading, setPersonaLoading] = useState(false)
  const [personaError, setPersonaError] = useState('')
  const [personaInput, setPersonaInput] = useState('')
  const [personaResult, setPersonaResult] = useState(null)
  const [nicknameInput, setNicknameInput] = useState('')
  const [nicknameStatus, setNicknameStatus] = useState('idle')
  const [nicknameValue, setNicknameValue] = useState('')
  const [enterUrl, setEnterUrl] = useState('')
  const [avatarModelUrl, setAvatarModelUrl] = useState('')
  const [isPersonaCustomInputOpen, setIsPersonaCustomInputOpen] = useState(false)
  const [selectedOptionIds, setSelectedOptionIds] = useState([])
  const [starredOptionId, setStarredOptionId] = useState('')
  const [answeredHistory, setAnsweredHistory] = useState([])
  const [historyViewIndex, setHistoryViewIndex] = useState(null)
  const [captureLocked, setCaptureLocked] = useState(false)
  const [autoCaptureRequested, setAutoCaptureRequested] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [isQuestionTransitionLoading, setIsQuestionTransitionLoading] = useState(false)
  const [isCaptureProcessing, setIsCaptureProcessing] = useState(false)
  const [isAvatarPreloading, setIsAvatarPreloading] = useState(false)
  const [isAvatarLoadingExit, setIsAvatarLoadingExit] = useState(false)
  const [isAvatarHandoffCover, setIsAvatarHandoffCover] = useState(false)
  const timeoutIdsRef = useRef([])
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const startInterviewInFlightRef = useRef(false)
  const startInterviewRequestIdRef = useRef(0)
  const syncedAppearanceAgentRef = useRef('')
  const capturePipelineRef = useRef(null)
  const personaAgentIdRef = useRef('')
  const nicknameValueRef = useRef('')
  const nicknameInputRef = useRef('')
  const avatarPreviewRotationRef = useRef({ yaw: 0, pitch: 0 })
  const avatarTransitionFinishingRef = useRef(false)
  const uploadedProfileImageKeyRef = useRef('')

  const clearTimers = () => {
    timeoutIdsRef.current.forEach((id) => window.clearTimeout(id))
    timeoutIdsRef.current = []
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const resetPersonaSession = () => {
    startInterviewRequestIdRef.current += 1
    startInterviewInFlightRef.current = false
    capturePipelineRef.current = null
    personaAgentIdRef.current = ''
    nicknameValueRef.current = ''
    nicknameInputRef.current = ''
    syncedAppearanceAgentRef.current = ''
    avatarTransitionFinishingRef.current = false
    uploadedProfileImageKeyRef.current = ''
    setPersonaAgentId('')
    setPersonaQuestion(null)
    setPersonaLoading(false)
    setPersonaError('')
    setPersonaInput('')
    setPersonaResult(null)
    setNicknameInput('')
    setNicknameStatus('idle')
    setNicknameValue('')
    setEnterUrl('')
    setAvatarModelUrl('')
    setIsAvatarPreloading(false)
    setIsAvatarLoadingExit(false)
    setIsAvatarHandoffCover(false)
    setAnsweredHistory([])
    setHistoryViewIndex(null)
    setSelectedOptionIds([])
    setStarredOptionId('')
    setIsCaptureProcessing(false)
  }

  const captureCurrentFrame = () => {
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
  }

  const handleAvatarPreviewRotationChange = useCallback((rotation) => {
    avatarPreviewRotationRef.current = {
      yaw: Number.isFinite(rotation?.yaw) ? rotation.yaw : avatarPreviewRotationRef.current.yaw,
      pitch: Number.isFinite(rotation?.pitch) ? rotation.pitch : avatarPreviewRotationRef.current.pitch,
    }
  }, [])

  const beginAvatarIntroTransition = useCallback(() => {
    setStage('avatarIntro')
  }, [])

  const finishAvatarLoadingTransition = useCallback(() => {
    if (avatarTransitionFinishingRef.current) {
      return
    }
    avatarTransitionFinishingRef.current = true
    setIsAvatarLoadingExit(true)
    const cleanupTimer = window.setTimeout(() => {
      setIsAvatarPreloading(false)
      setIsAvatarLoadingExit(false)
      setIsAvatarHandoffCover(false)
      avatarTransitionFinishingRef.current = false
    }, 1980)
    timeoutIdsRef.current.push(cleanupTimer)
  }, [])

  const analyzePhotoWithLlmServer = async (imageDataUrl) => {
    try {
      const response = await fetch('/api/analyze-appearance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageDataUrl }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Analyze request failed.')
      }

      if (!payload?.result || typeof payload.result !== 'object') {
        throw new Error('Server returned an invalid analyze response.')
      }

      setAnalysisResult(payload.result)
      return payload.result
    } catch {
      setAnalysisResult(null)
      return null
    }
  }

  const syncAppearanceToAgent = useCallback(
    async (agentId, appearance) => {
      if (!agentId || !appearance || typeof appearance !== 'object') {
        return
      }

      const syncKey = `${agentId}:${JSON.stringify(appearance)}`
      if (syncedAppearanceAgentRef.current === syncKey) {
        return
      }

      try {
        const response = await fetch('/api/persona/appearance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ agentId, appearance }),
        })
        if (!response.ok) {
          return
        }
        syncedAppearanceAgentRef.current = syncKey
      } catch {
        // best-effort sync only
      }
    },
    [],
  )

  const buildAvatarModel = async ({ agentId, appearance }) => {
    if (!agentId || !appearance) {
      return null
    }

    try {
      const response = await fetch('/api/avatar/build', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentId, appearance }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Avatar build request failed.')
      }
      setAvatarModelUrl(payload.modelUrl ?? '')
      return payload
    } catch (error) {
      console.warn(error instanceof Error ? error.message : 'Unknown error while building avatar.')
      return null
    }
  }

  const handleAvatarProfileImageReady = useCallback(async (viewerApi) => {
    const activeAgentId = personaAgentIdRef.current || personaAgentId
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

      await fetch('/api/avatar/profile-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: activeAgentId,
          imageDataUrl,
        }),
      })
    } catch (error) {
      uploadedProfileImageKeyRef.current = ''
      console.warn(error instanceof Error ? error.message : 'Unknown error while saving avatar profile image.')
    }
  }, [avatarModelUrl, personaAgentId])

  const startPersonaInterview = useCallback(async (appearanceOverride = null) => {
    if (startInterviewInFlightRef.current) {
      return false
    }

    startInterviewInFlightRef.current = true
    const requestId = startInterviewRequestIdRef.current + 1
    startInterviewRequestIdRef.current = requestId

    setPersonaLoading(true)
    setPersonaError('')
    const appearancePayload = appearanceOverride ?? analysisResult ?? null

    try {
      const response = await fetch('/api/persona/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appearance: appearancePayload,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Persona start request failed.')
      }

      if (!payload?.agentId || !payload?.question) {
        throw new Error('Server returned an invalid persona start response.')
      }

      if (requestId !== startInterviewRequestIdRef.current) {
        return
      }

      setPersonaAgentId(payload.agentId)
      setPersonaQuestion(payload.question)
      setPersonaResult(null)
      setPersonaInput('')
      setPersonaError('')
      setSelectedOptionIds([])
      setStarredOptionId('')
      setAnsweredHistory([])
      setHistoryViewIndex(null)
      return payload
    } catch (error) {
      if (requestId === startInterviewRequestIdRef.current) {
        setPersonaError(error instanceof Error ? error.message : 'Unknown error while starting persona interview.')
      }
      return null
    } finally {
      if (requestId === startInterviewRequestIdRef.current) {
        setPersonaLoading(false)
      }
      startInterviewInFlightRef.current = false
    }
  }, [analysisResult])

  useEffect(() => {
    personaAgentIdRef.current = personaAgentId
  }, [personaAgentId])

  useEffect(() => {
    nicknameValueRef.current = nicknameValue
  }, [nicknameValue])

  useEffect(() => {
    nicknameInputRef.current = nicknameInput
  }, [nicknameInput])

  useEffect(() => {
    return () => {
      clearTimers()
      stopCamera()
    }
  }, [])

  useEffect(() => {
    if (!['webcam', 'cameraDesignCapture'].includes(stage)) {
      return
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
  }, [stage])

  useEffect(() => {
    if (!['nickname', 'persona'].includes(stage) || personaQuestion || personaAgentId || personaResult || personaLoading || personaError) {
      return
    }

    void startPersonaInterview()
  }, [stage, personaQuestion, personaAgentId, personaResult, personaLoading, personaError, startPersonaInterview])

  useEffect(() => {
    if (!personaAgentId || !analysisResult) {
      return
    }
    void syncAppearanceToAgent(personaAgentId, analysisResult)
  }, [personaAgentId, analysisResult, syncAppearanceToAgent])

  const handleEnterCameraDesignStep = () => {
    if (stage !== 'idle') {
      return
    }

    clearTimers()
    resetPersonaSession()
    setAutoCaptureRequested(false)
    setCaptureLocked(false)
    setCountdown(null)
    setCameraReady(false)
    setIsCaptureProcessing(false)
    setAnalysisResult(null)
    setStage('cameraDesignCapture')
  }

  const handleCapture = () => {
    if (stage !== 'cameraDesignCapture' || countdown !== null || captureLocked || isCaptureProcessing) {
      return
    }

    setAutoCaptureRequested(false)
    setCaptureLocked(true)
    clearTimers()
    setCountdown(3)

    const countTwoTimer = window.setTimeout(() => setCountdown(2), 1000)
    const countOneTimer = window.setTimeout(() => setCountdown(1), 2000)

    const flashTimer = window.setTimeout(() => {
      const imageDataUrl = captureCurrentFrame()

      setCountdown(null)
      setIsCaptureProcessing(true)
      avatarPreviewRotationRef.current = { yaw: 0, pitch: 0 }
      setIsAvatarPreloading(false)
      setIsAvatarLoadingExit(false)
      setIsAvatarHandoffCover(false)
      avatarTransitionFinishingRef.current = false
      setStage('avatarLoading')

      const capturePipeline = (async () => {
        try {
          let appearanceResult = null
          if (TEST_MODE_SKIP_CAPTURE_ANALYSIS) {
            setAnalysisResult(MOCK_APPEARANCE_RESULT)
            appearanceResult = MOCK_APPEARANCE_RESULT
          } else {
            if (imageDataUrl) {
              appearanceResult = await analyzePhotoWithLlmServer(imageDataUrl)
            }
          }

          if (!appearanceResult) {
            throw new Error('외형 분석에 실패했습니다. 다시 촬영해 주세요.')
          }

          const avatarAppearance = appearanceResult
          const personaPayload = await startPersonaInterview(avatarAppearance)
          let avatarPayload = null
          if (personaPayload?.agentId) {
            avatarPayload = await buildAvatarModel({
              agentId: personaPayload.agentId,
              appearance: avatarAppearance,
            })
            const latestNickname = (nicknameValueRef.current || nicknameInputRef.current || '').trim()
            if (latestNickname) {
              await fetch('/api/avatar/rename', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  agentId: personaPayload.agentId,
                  nickname: latestNickname,
                }),
              }).catch(() => null)
            }
          }
          if (avatarPayload?.modelUrl) {
            setIsAvatarHandoffCover(true)
            const handoffTimer = window.setTimeout(() => {
              setIsAvatarPreloading(true)
              setIsAvatarHandoffCover(false)
              beginAvatarIntroTransition()
            }, 260)
            timeoutIdsRef.current.push(handoffTimer)
          } else {
            setStage('avatarIntro')
          }
          return personaPayload
        } catch (error) {
          setAnalysisResult(null)
          setPersonaError(error instanceof Error ? error.message : '외형 분석 또는 페르소나 시작에 실패했습니다.')
          setCaptureLocked(false)
          setStage('cameraDesignCapture')
          return null
        } finally {
          setIsCaptureProcessing(false)
        }
      })()
      capturePipelineRef.current = capturePipeline
    }, 3000)

    timeoutIdsRef.current.push(countTwoTimer, countOneTimer, flashTimer)
  }

  useEffect(() => {
    if (!['webcam', 'cameraDesignCapture'].includes(stage) || !autoCaptureRequested || !cameraReady || captureLocked || isCaptureProcessing || countdown !== null) {
      return
    }

    const captureTimer = window.setTimeout(() => {
      handleCapture()
    }, 450)
    return () => window.clearTimeout(captureTimer)
    // handleCapture reads the latest camera frame when this short-lived timer fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, autoCaptureRequested, cameraReady, captureLocked, isCaptureProcessing, countdown])

  const submitPersonaAnswer = async (answerPayload, answerText) => {
    if (!personaQuestion || !personaAgentId || personaResult || personaLoading) {
      return
    }

    const safePayload = answerPayload && typeof answerPayload === 'object' ? answerPayload : null
    const trimmedAnswerText = typeof answerText === 'string' ? answerText.trim() : ''
    if (!safePayload || selectedOptionIds.length === 0 || !trimmedAnswerText) {
      return
    }

    setPersonaLoading(true)
    setPersonaError('')
    const submittedQuestion = personaQuestion

    try {
      const response = await fetch('/api/persona/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: personaAgentId,
          answer: safePayload,
          turn: personaQuestion.turn,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Persona answer request failed.')
      }

      setPersonaInput('')

      if (payload?.done) {
        if (submittedQuestion) {
          setAnsweredHistory((prev) => [
            ...prev,
            {
              question: submittedQuestion,
              answerText: trimmedAnswerText,
              answerMode: 'taste',
            },
          ])
        }
        setPersonaResult(payload.result ?? null)
        setPersonaQuestion(null)
        setIsQuestionTransitionLoading(false)
        setStage('finalDesign')
        return
      }

      if (!payload?.question) {
        throw new Error('Server returned an invalid next-question response.')
      }

      if (submittedQuestion) {
        setAnsweredHistory((prev) => [
          ...prev,
            {
              question: submittedQuestion,
              answerText: trimmedAnswerText,
              answerMode: 'taste',
            },
          ])
        }

      setPersonaQuestion(payload.question)
      setSelectedOptionIds([])
      setStarredOptionId('')
      setIsPersonaCustomInputOpen(false)
      setIsQuestionTransitionLoading(false)
    } catch (error) {
      setPersonaError(error instanceof Error ? error.message : 'Unknown error while processing persona answer.')
      setIsQuestionTransitionLoading(false)
    } finally {
      setPersonaLoading(false)
    }
  }

  const handlePersonaOptionClick = (option) => {
    if (historyViewIndex !== null) {
      return
    }

    const optionId = option?.id
    if (!optionId) return
    playPersonaClickSound()

    setSelectedOptionIds((prev) => {
      const isSelected = prev.includes(optionId)
      if (isSelected) {
        const next = prev.filter((id) => id !== optionId)
        if (starredOptionId === optionId) {
          setStarredOptionId(next[0] || '')
        }
        if (optionId === 'other_custom') {
          setIsPersonaCustomInputOpen(false)
          setPersonaInput('')
        }
        return next
      }

      if (prev.length >= (displayQuestion?.maxSelections || displayQuestion?.max_select || 3)) {
        return prev
      }

      const next = [...prev, optionId]
      setStarredOptionId(next[0] || '')
      if (option?.allowsCustom) {
        setIsPersonaCustomInputOpen(true)
      }
      return next
    })
  }

  const handleNextClick = () => {
    if (historyViewIndex !== null) {
      if (historyViewIndex < answeredHistory.length - 1) {
        setHistoryViewIndex((prev) => (prev === null ? null : prev + 1))
      } else {
        setHistoryViewIndex(null)
      }
      return
    }

    if (canSubmitSelection) {
      setIsQuestionTransitionLoading(true)
      void submitPersonaAnswer(
        {
          selectedOptionIds,
          starredOptionId: selectedOptionIds[0] || '',
          customText: selectedOptionIds.includes('other_custom') ? personaInput.trim() : '',
        },
        selectedAnswerText,
      )
    }
  }

  const resetCurrentSelection = () => {
    setSelectedOptionIds([])
    setStarredOptionId('')
    setIsPersonaCustomInputOpen(false)
    setPersonaInput('')
  }

  const handlePrevClick = () => {
    if (personaResult) {
      return
    }

    if (personaLoading || isQuestionTransitionLoading) {
      return
    }

    if (historyViewIndex !== null) {
      if (historyViewIndex > 0) {
        setHistoryViewIndex((prev) => (prev === null ? null : prev - 1))
      } else {
        setHistoryViewIndex(null)
      }
      return
    }

    if (answeredHistory.length > 0) {
      setHistoryViewIndex(answeredHistory.length - 1)
      setIsPersonaCustomInputOpen(false)
      return
    }

    if (selectedOptionIds.length > 0 || isPersonaCustomInputOpen || personaInput.trim()) {
      resetCurrentSelection()
    }
  }

  const currentQuestion = personaQuestion
  const viewingHistoryEntry = historyViewIndex !== null ? answeredHistory[historyViewIndex] ?? null : null
  const displayQuestion = viewingHistoryEntry?.question ?? currentQuestion
  const personaQuestionText = displayQuestion?.question ?? ''
  const personaTotalTurns = Number(displayQuestion?.total_turns || displayQuestion?.totalTurns || PERSONA_TOTAL_TURNS) || PERSONA_TOTAL_TURNS
  const personaTurnKey = personaResult ? 'persona-result' : `persona-turn-${displayQuestion?.turn ?? 0}`
  const isViewingHistory = historyViewIndex !== null
  const displayOptions = Array.isArray(displayQuestion?.options) ? displayQuestion.options : []
  const optionLabelMap = new Map(displayOptions.map((option) => [option.id, option]))
  const selectedOptionLabels = selectedOptionIds
    .map((optionId) => optionLabelMap.get(optionId))
    .filter(Boolean)
    .map((option) => (option.id === 'other_custom' && personaInput.trim() ? `직접입력: ${personaInput.trim()}` : option.label))
  const selectedAnswerText = selectedOptionLabels.join(' / ')
  const hasSelectedCustom = selectedOptionIds.includes('other_custom')
  const canSubmitSelection = selectedOptionIds.length > 0
    && (!hasSelectedCustom || personaInput.trim().length >= 2)
  const personaKeywords = [
    ...(Array.isArray(personaResult?.survey_trace?.starred_tastes) ? personaResult.survey_trace.starred_tastes : []),
    ...(Array.isArray(personaResult?.survey_trace?.dominant_tokens) ? personaResult.survey_trace.dominant_tokens : []),
  ]
    .map((value) => String(value || '').replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/)[0])
    .filter(Boolean)
    .slice(0, 4)

  const handleNicknameClaim = async (nicknameOverride = null, nextStage = 'persona') => {
    const targetNickname = typeof nicknameOverride === 'string' ? nicknameOverride.trim() : nicknameInput.trim()
    const isValidNickname = TEST_MODE_RELAXED_NICKNAME
      ? targetNickname.length > 0
      : /^[A-Za-z0-9가-힣 ]{2,12}$/.test(targetNickname)
    if (!isValidNickname || nicknameStatus === 'checking') {
      return false
    }

    let activeAgentId = personaAgentId || personaAgentIdRef.current
    if (!activeAgentId && capturePipelineRef.current) {
      setNicknameStatus('checking')
      const pipelinePayload = await capturePipelineRef.current.catch(() => null)
      activeAgentId = pipelinePayload?.agentId || personaAgentIdRef.current
    }
    if (!activeAgentId && TEST_MODE_RELAXED_NICKNAME) {
      activeAgentId = `test-${Date.now()}`
    }
    if (!activeAgentId) {
      setNicknameStatus('idle')
      return false
    }
    if (!personaAgentId) {
      setPersonaAgentId(activeAgentId)
    }

    setNicknameStatus('checking')

    const acceptNickname = (payload = {}) => {
      setEnterUrl(payload.enterUrl ?? `https://terarium.team-doob.com/profile?agentId=${encodeURIComponent(activeAgentId)}`)
      setNicknameValue(targetNickname)
      setNicknameInput(targetNickname)
      setNicknameStatus('success')
      if (nextStage) {
        setStage(nextStage)
      }
      return true
    }

    try {
      const response = await fetch('/api/nickname/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: activeAgentId,
          nickname: targetNickname,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error ?? '닉네임 저장에 실패했습니다.')
      }

      const avatarResponse = await fetch('/api/avatar/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: activeAgentId,
          nickname: targetNickname,
        }),
      })
      const avatarPayload = await avatarResponse.json().catch(() => null)
      if (avatarResponse.ok && avatarPayload) {
        setAvatarModelUrl(avatarPayload.modelUrl ?? avatarModelUrl)
      }
      return acceptNickname(payload)
    } catch (error) {
      if (TEST_MODE_RELAXED_NICKNAME) {
        return acceptNickname()
      }
      setNicknameStatus('error')
      console.warn(error instanceof Error ? error.message : '닉네임 저장에 실패했습니다.')
      return false
    }
  }

  if (stage === 'idle') {
    return (
      <TutorialDesign
        onCameraStepEnter={handleEnterCameraDesignStep}
        onBeginCamera={handleEnterCameraDesignStep}
      />
    )
  }

  if (stage === 'cameraDesignCapture') {
    return (
      <>
        <TutorialDesign
          initialId={8}
          onBeginCamera={handleCapture}
          hideUi={captureLocked || countdown !== null || isCaptureProcessing}
          backgroundSlot={
            <video
              ref={videoRef}
              className="tutorial-camera-background-video"
              autoPlay
              playsInline
              muted
            />
          }
        />
        {countdown !== null && (
          <section className="countdown-overlay" aria-live="polite">
            <p className="countdown-text">{countdown}</p>
          </section>
        )}
      </>
    )
  }

  if (stage === 'avatarLoading') {
    return (
      <main className={`avatar-loading-screen ${isAvatarHandoffCover ? 'is-covered' : ''}`} aria-label="로딩 중" aria-live="polite">
        <AvatarThreeViewer
          className="avatar-loading-preview"
          src="/model/basic/basic.glb"
          alt="avatar loading preview"
          variant="loadingBase"
          distanceMultiplier={1.66}
          initialYaw={avatarPreviewRotationRef.current.yaw}
          onRotationChange={handleAvatarPreviewRotationChange}
        />
      </main>
    )
  }

  if (stage === 'avatarIntro') {
    return (
      <>
        <TutorialDesign
          initialId={9}
          avatarUrl={avatarModelUrl}
          avatarInitialYaw={avatarPreviewRotationRef.current.yaw}
          externalName={nicknameValue}
          onAvatarRotationChange={handleAvatarPreviewRotationChange}
          onAvatarReady={isAvatarPreloading ? finishAvatarLoadingTransition : null}
          onAvatarProfileImageReady={handleAvatarProfileImageReady}
          onNameSubmit={(name) => handleNicknameClaim(name, null)}
          onStartQuestions={() => setStage('persona')}
        />
        {isAvatarPreloading && (
          <main className={`avatar-transition-overlay ${isAvatarLoadingExit ? 'is-exiting' : ''}`} aria-hidden="true" />
        )}
      </>
    )
  }

  if (stage === 'finalDesign') {
    return (
        <TutorialDesign
        initialId={15}
        avatarUrl={avatarModelUrl}
        externalName={nicknameValue || nicknameInput.trim()}
        keywords={personaKeywords}
        enterUrl={enterUrl}
        onFinish={() => setStage('idle')}
      />
    )
  }

  return (
    <div
      className="start-screen phase-persona is-started"
      role="application"
      aria-label="페르소나 인터뷰 화면"
    >
      <section className="persona-stage" aria-label="페르소나 인터뷰 화면">
        <div className="persona-brand-bg">TERARiUM</div>

        <header className="persona-header">
          <div className="persona-question-meta">
            <span className="persona-meta-label">Question</span>
            <span className="persona-meta-count">{`${displayQuestion ? displayQuestion.turn : 1}/${personaTotalTurns}`}</span>
          </div>
          <p className="persona-question">
            {personaResult
              ? '페르소나 분석이 완료되었습니다.'
              : isQuestionTransitionLoading
                ? ''
              : personaQuestionText || (personaLoading ? '질문을 준비하고 있습니다...' : '질문을 불러오는 중 문제가 발생했습니다.')}
          </p>
          {isQuestionTransitionLoading && <div className="persona-question-loading" aria-hidden="true" />}
        </header>

        <section className="persona-board" aria-live="polite">
          <div key={personaTurnKey} className="persona-turn-block">
            {!displayQuestion ? (
                <article className="persona-status-card">
                  <p className="persona-status-text">
                    {personaLoading ? '분석 중...' : personaError || '질문을 다시 불러와 주세요.'}
                  </p>
                  {!personaLoading && (
                    <button className="persona-retry-button" type="button" onClick={() => void startPersonaInterview()}>
                      다시 생성
                    </button>
                  )}
                </article>
              ) : isQuestionTransitionLoading ? (
                <section className="persona-options" aria-label="분석 중">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div
                      key={`persona-option-skeleton-${index}`}
                      className="persona-option-skeleton"
                      style={{ animationDelay: `${index * 0.08}s` }}
                    />
                  ))}
                </section>
              ) : isViewingHistory ? (
                <section className="persona-options" aria-label="이전 질문 답변 보기">
                  <article className="persona-answer-review-card">
                    <p className="persona-answer-review-label">
                      {viewingHistoryEntry?.answerMode === 'custom' ? '직접 입력한 답변' : '선택한 답변'}
                    </p>
                    <p className="persona-answer-review-text">{viewingHistoryEntry?.answerText ?? ''}</p>
                  </article>
                </section>
              ) : (
                <section className="persona-options" aria-label="선택지">
                  {personaError && <p className="persona-inline-error">{personaError}</p>}

                  {displayOptions.map((option, index) => {
                      const isSelected = selectedOptionIds.includes(option.id)
                      const selectionRank = selectedOptionIds.indexOf(option.id) + 1
                      const isDimmed = selectedOptionIds.length > 0 && !isSelected
                      const isCustom = option.allowsCustom || option.id === 'other_custom'
                      return (
                        <button
                          key={`persona-option-${displayQuestion.turn}-${option.id || index}`}
                          type="button"
                          className={`persona-option ${isSelected ? 'is-selected' : ''} ${isDimmed ? 'is-dimmed' : ''} ${isCustom ? 'is-custom' : ''}`}
                          style={{
                            animationDelay: `${0.1 + index * 0.035}s`,
                            '--persona-option-bg': option.visual?.background || undefined,
                          }}
                          onClick={() => handlePersonaOptionClick(option)}
                          disabled={personaLoading}
                        >
                          <span className="persona-option-text">{option.label}</span>
                          {isSelected && (
                            <span className="persona-option-rank" aria-label={`${selectionRank}순위`}>
                              {selectionRank}
                            </span>
                          )}
                        </button>
                      )
                    })}

                  {isPersonaCustomInputOpen ? (
                    <div className="persona-custom-editor" style={{ animationDelay: '0.1s' }}>
                      <div className="persona-custom-editor-inner">
                        <textarea
                          className="persona-custom-editor-textarea"
                          value={personaInput}
                          onChange={(e) => setPersonaInput(e.target.value)}
                          placeholder="직접 입력하세요. (2글자 이상)"
                          disabled={personaLoading}
                        />
                      </div>
                    </div>
                  ) : null}
                </section>
              )}
            </div>
          </section>

          {!personaResult && displayQuestion && (
            <nav className="persona-bottom-nav">
              {isViewingHistory || answeredHistory.length > 0 || selectedOptionIds.length > 0 || isPersonaCustomInputOpen || personaInput.trim() ? (
                <button
                  className="nav-btn prev-btn"
                  type="button"
                  onClick={handlePrevClick}
                  disabled={personaLoading || isQuestionTransitionLoading}
                >
                  이전으로
                </button>
              ) : (
                <div />
              )}
              {(canSubmitSelection || isQuestionTransitionLoading || isViewingHistory) && (
                <button
                  className="nav-btn next-btn is-active"
                  type="button"
                  onClick={handleNextClick}
                  disabled={personaLoading || isQuestionTransitionLoading || (!canSubmitSelection && !isViewingHistory)}
                >
                  {isQuestionTransitionLoading ? '분석 중...' : '다음으로'}
                </button>
              )}
            </nav>
          )}

        </section>
    </div>
  )
}

function AvatarProfileCapturePage() {
  const [modelUrl, setModelUrl] = useState('')
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const agentId = String(params.get('agentId') || '').trim()
    const explicitModelUrl = String(params.get('modelUrl') || '').trim()
    if (explicitModelUrl) {
      setModelUrl(explicitModelUrl)
      return
    }
    if (!agentId) {
      setError('agentId is required')
      setStatus('error')
      return
    }

    let cancelled = false
    fetch(`/api/avatar/recipe/${encodeURIComponent(agentId)}`)
      .then(async (response) => {
        const payload = await response.json().catch(() => null)
        if (!response.ok) {
          throw new Error(payload?.error || 'avatar recipe not found')
        }
        return payload
      })
      .then((payload) => {
        if (!cancelled) setModelUrl(payload?.recipe?.modelUrl || '')
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'failed to load avatar recipe')
          setStatus('error')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="avatar-profile-capture-page" data-status={status} data-error={error}>
      {modelUrl ? (
        <AvatarThreeViewer
          className="avatar-profile-capture-viewer"
          src={modelUrl}
          alt="avatar profile capture"
          variant="profileCapture"
          distanceMultiplier={1}
          onReady={() => {
            setStatus('ready')
            window.__TERARIUM_AVATAR_PROFILE_CAPTURE_READY__ = true
          }}
        />
      ) : null}
      {status !== 'ready' && <span className="avatar-profile-capture-status">{error || status}</span>}
    </main>
  )
}

export default App

