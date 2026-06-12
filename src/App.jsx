import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import TutorialDesign from './tutorialDesign/TutorialDesign.jsx'
import { assetUrl } from './apiBase.js'
import {
  abandonPersonaSession,
  analyzeAppearance,
  answerPersona,
  buildAvatar,
  claimNickname,
  createRandomAgent,
  fetchAvatarRecipe,
  personaSessionAbandonUrl,
  renameAvatar,
  startPersona,
  syncPersonaAppearance,
  undoPersonaAnswer,
} from './lib/tutorialApi.js'
import { useAvatarWorkflow } from './hooks/useAvatarWorkflow.js'
import { useCameraCapture } from './hooks/useCameraCapture.js'
import { useTutorialFlowState } from './hooks/useTutorialFlowState.js'
import clickSoundSrc from './tutorialDesign/assets/click1.mp3'
import logo1Src from './tutorialDesign/assets/logo1.png'
import countdownFontUrl from './tutorialDesign/fonts/CHANGWONDANGAMASAC-BOLD.TTF?url'
import './App.css'

const COUNTDOWN_FONT_FAMILY = 'ChangwonDangamAsac'
const AvatarThreeViewer = lazy(() => import('./tutorialDesign/AvatarThreeViewer.jsx'))
const TEST_MODE_SKIP_CAPTURE_ANALYSIS = import.meta.env.VITE_SKIP_CAPTURE_ANALYSIS === 'true'
const TEST_MODE_RELAXED_NICKNAME = import.meta.env.DEV || import.meta.env.VITE_ALLOW_DUPLICATE_NICKNAME === 'true'
const PERSONA_TOTAL_TURNS = 5
const CLICK_SOUND_FALLBACK_MS = 320
const CLICK_SOUND_TAIL_GAP_MS = 40
const LOADING_BASE_AVATAR_URL = assetUrl('/model/source/avatar_v2.glb')
let countdownFontPreloadPromise = null

const avatarAssetUrl = (value) => {
  const raw = String(value || '').trim()
  return raw ? assetUrl(raw) : ''
}

const preloadCountdownFont = () => {
  if (typeof document === 'undefined') {
    return Promise.resolve()
  }

  if (!document.querySelector('link[data-terarium-countdown-font="true"]')) {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'font'
    link.type = 'font/ttf'
    link.href = countdownFontUrl
    link.crossOrigin = 'anonymous'
    link.dataset.terariumCountdownFont = 'true'
    document.head.appendChild(link)
  }

  if (!countdownFontPreloadPromise) {
    countdownFontPreloadPromise = document.fonts
      ?.load?.(`700 180px "${COUNTDOWN_FONT_FAMILY}"`)
      ?.then(() => undefined)
      ?.catch(() => undefined) ?? Promise.resolve()
  }

  return countdownFontPreloadPromise
}

const DEBUG_AVATAR_OPTIONS = {
  hair: [
    ['bun_hair', '번 헤어'],
    ['bangs_bun_hair', '앞머리 번'],
    ['bangs_bobbed_hair', '앞머리 단발'],
    ['bobbed_hair', '단발'],
    ['permed_hair', '펌 헤어'],
    ['half_ponytail', '하프 포니테일'],
    ['bangs_long_wave_hair', '앞머리 긴 웨이브'],
    ['long_wave_hair', '긴 웨이브'],
    ['bangs_straight_hair', '앞머리 긴 생머리'],
    ['straight_hair', '긴 생머리'],
    ['twin_braids', '양갈래 땋은 머리'],
    ['high_ponytail', '높은 포니테일'],
    ['bangs_high_ponytail', '앞머리 높은 포니테일'],
    ['low_ponytail', '낮은 포니테일'],
    ['bangs_low_ponytail', '앞머리 낮은 포니테일'],
    ['bowl_cut', '바가지 컷'],
    ['gael_cut_1', '가엘컷 1'],
    ['gael_cut_2', '가엘컷 2'],
    ['wolf_cut', '울프컷'],
    ['crop_cut', '크롭컷'],
    ['pompadour_cut', '포마드'],
    ['dandy_cut', '댄디컷'],
  ],
  skin: [
    ['soft_peach_skin', '피치 피부'],
    ['light_warm_skin', '밝은 웜 피부'],
  ],
  eye: [
    ['puppy_eyes', '강아지 눈'],
    ['cat_eyes', '고양이 눈'],
    ['lazy_eyes', '나른한 눈'],
    ['round_eyes', '동그란 눈'],
    ['drooping_eyes', '처진 눈'],
    ['cloudy_eyes', '탁한 눈'],
    ['fox_eyes', '여우 눈'],
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
    ['short_Tshirt', '반팔 티셔츠'],
    ['long_Tshirt', '긴팔 티셔츠'],
    ['shirts', '셔츠'],
  ],
  bottom: [
    ['short_pants', '짧은 바지'],
    ['long_pants', '긴 바지'],
    ['short_skirt', '짧은 치마'],
    ['long_skirt', '긴 치마'],
  ],
  outfit: [
    ['none', '원피스 없음'],
    ['onepiece_1', '짧은 원피스'],
    ['onepiece_2', '긴 원피스'],
  ],
  shoes: [
    ['shoes', '운동화'],
    ['sandals', '샌달'],
  ],
  glasses: [
    ['none', '안경 없음'],
    ['round_glasses', '둥근 안경'],
    ['square_glasses', '사각 안경'],
  ],
  necklace: [
    ['none', '목걸이 없음'],
    ['pearl_necklace', '진주 목걸이'],
  ],
  earrings: [
    ['none', '귀걸이 없음'],
    ['Earring01', '후프 귀걸이'],
    ['Earring02', '심플 귀걸이'],
  ],
}

const buildDebugAppearance = (selection) => ({
  hair_color: selection.hairColor,
  eye_color: 'dark_brown',
  top_color: selection.topColor,
  bottom_color: selection.outfit !== 'none' ? selection.topColor : selection.bottomColor,
  shoe_color: selection.shoeColor,
  asset_tags: {
    skin_texture: selection.skin,
    eye_texture: selection.eye,
    mouth_texture: selection.mouth,
    hair_mesh: selection.hair,
    top_mesh: selection.top,
    bottom_mesh: selection.bottom,
    outfit_mesh: selection.outfit,
    shoe_mesh: selection.shoes,
    glasses_mesh: selection.glasses,
    necklace_mesh: selection.necklace,
    earring_mesh: selection.earrings,
  },
})

const DEBUG_COLOR_OPTIONS = [
  ['black', 'Black', '#101010'],
  ['dark_brown', 'Dark brown', '#1b120d'],
  ['brown', 'Brown', '#5a3524'],
  ['light_brown', 'Light brown', '#9a6a43'],
  ['blonde', 'Blonde', '#d8bd65'],
  ['gray', 'Gray', '#777777'],
  ['white', 'White', '#f4f4f0'],
  ['red', 'Red', '#a63d3d'],
  ['orange', 'Orange', '#c96a2c'],
  ['yellow', 'Yellow', '#d7b53f'],
  ['green', 'Green', '#4c9a58'],
  ['blue', 'Blue', '#3f6fb5'],
  ['navy', 'Navy', '#1d2e5f'],
  ['purple', 'Purple', '#7a4aa0'],
  ['pink', 'Pink', '#d879a7'],
]

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
  hair_color: 'black',
  eye_color: 'dark_brown',
  top_color: 'black',
  bottom_color: 'black',
  shoe_color: 'black',
  asset_tags: {
    skin_texture: 'soft_peach_skin',
    eye_texture: 'puppy_eyes',
    mouth_texture: 'closed_smile_mouth',
    hair_mesh: 'dandy_cut',
    top_mesh: 'short_Tshirt',
    bottom_mesh: 'long_pants',
    outfit_mesh: 'none',
    shoe_mesh: 'shoes',
    glasses_mesh: 'none',
    necklace_mesh: 'none',
    earring_mesh: 'none',
  },
}

function App() {
  const urlParams = new URLSearchParams(window.location.search)
  if (window.location.pathname === '/debug') {
    return <AvatarDebugPageV2 />
  }
  const isProfileCaptureRoute = window.location.pathname === '/avatar-profile-capture'
    || urlParams.get('mode') === 'avatar-profile-capture'
  if (isProfileCaptureRoute) {
    return <AvatarProfileCapturePage />
  }
  if (window.location.pathname === '/random-agent') {
    return <RandomAgentPage />
  }

  return <TutorialApp />
}

function AvatarDebugPageV2() {
  const [selection, setSelection] = useState({
    hair: 'long_wave_hair',
    skin: 'soft_peach_skin',
    eye: 'puppy_eyes',
    mouth: 'closed_smile_mouth',
    top: 'short_Tshirt',
    bottom: 'short_pants',
    outfit: 'none',
    shoes: 'shoes',
    hairColor: 'black',
    topColor: 'white',
    bottomColor: 'black',
    shoeColor: 'black',
    glasses: 'none',
    necklace: 'none',
    earrings: 'none',
  })
  const [modelUrl, setModelUrl] = useState('')
  const [manifest, setManifest] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [zoom, setZoom] = useState(1)
  const requestSeqRef = useRef(0)
  const viewerCaptureRef = useRef(null)

  const updateSelection = (key, value) => {
    setSelection((current) => ({ ...current, [key]: value }))
  }

  const downloadPreview = () => {
    const capturePng = viewerCaptureRef.current
    if (!capturePng) return
    const dataUrl = capturePng()
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `terarium-avatar-debug-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  useEffect(() => {
    const requestSeq = requestSeqRef.current + 1
    requestSeqRef.current = requestSeq
    const controller = new AbortController()
    const build = async () => {
      setStatus('loading')
      setError('')
      viewerCaptureRef.current = null
      const appearance = buildDebugAppearance(selection)

      try {
        const payload = await buildAvatar({
          agentId: `debug-avatar-${requestSeq}`,
          appearance,
          signal: controller.signal,
        })
        if (requestSeqRef.current !== requestSeq) return
        setModelUrl(avatarAssetUrl(payload.modelUrl))
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
        <div className="debug-avatar-toolbar" aria-label="Avatar preview controls">
          <div className="debug-zoom-control">
            <button type="button" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(0.7, Number((value - 0.1).toFixed(2))))}>
              -
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button type="button" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(2.2, Number((value + 0.1).toFixed(2))))}>
              +
            </button>
          </div>
          <button type="button" className="debug-download-button" disabled={!modelUrl || status !== 'ready'} onClick={downloadPreview}>
            Download PNG
          </button>
        </div>
        <div className="debug-avatar-stage">
          {modelUrl ? (
            <Suspense fallback={<div className="debug-avatar-canvas" />}>
              <AvatarThreeViewer
                src={modelUrl}
                alt="Avatar debug preview"
                variant="avatar"
                distanceMultiplier={1.96 / zoom}
                fitFullBounds
                className="debug-avatar-canvas"
                onReady={({ capturePng }) => {
                  viewerCaptureRef.current = capturePng
                }}
              />
            </Suspense>
          ) : (
            <div className="debug-avatar-empty">Building avatar</div>
          )}
        </div>
        <div className="debug-avatar-state">
          <span>{status === 'loading' ? 'Building' : status === 'ready' ? 'Ready' : status === 'error' ? 'Error' : 'Idle'}</span>
          {error ? <strong>{error}</strong> : null}
        </div>
      </section>

      <aside className="debug-avatar-panel" aria-label="Avatar asset selector">
        <h1>Avatar Debug</h1>
        <DebugStepper label="Hair" value={selection.hair} options={DEBUG_AVATAR_OPTIONS.hair} onChange={(value) => updateSelection('hair', value)} />
        <DebugStepper label="Hair color" value={selection.hairColor} options={DEBUG_COLOR_OPTIONS} onChange={(value) => updateSelection('hairColor', value)} />
        <DebugStepper label="Skin" value={selection.skin} options={DEBUG_AVATAR_OPTIONS.skin} onChange={(value) => updateSelection('skin', value)} />
        <DebugStepper label="Eyes" value={selection.eye} options={DEBUG_AVATAR_OPTIONS.eye} onChange={(value) => updateSelection('eye', value)} />
        <DebugStepper label="Mouth" value={selection.mouth} options={DEBUG_AVATAR_OPTIONS.mouth} onChange={(value) => updateSelection('mouth', value)} />
        <DebugStepper label="One-piece" value={selection.outfit} options={DEBUG_AVATAR_OPTIONS.outfit} onChange={(value) => updateSelection('outfit', value)} />
        <DebugStepper label="Top" value={selection.top} options={DEBUG_AVATAR_OPTIONS.top} disabled={hasOutfit} onChange={(value) => updateSelection('top', value)} />
        <DebugStepper label="Top color" value={selection.topColor} options={DEBUG_COLOR_OPTIONS} onChange={(value) => updateSelection('topColor', value)} />
        <DebugStepper label="Bottom" value={selection.bottom} options={DEBUG_AVATAR_OPTIONS.bottom} disabled={hasOutfit} onChange={(value) => updateSelection('bottom', value)} />
        <DebugStepper label="Bottom color" value={selection.bottomColor} options={DEBUG_COLOR_OPTIONS} disabled={hasOutfit} onChange={(value) => updateSelection('bottomColor', value)} />
        <DebugStepper label="Shoes" value={selection.shoes} options={DEBUG_AVATAR_OPTIONS.shoes} onChange={(value) => updateSelection('shoes', value)} />
        <DebugStepper label="Shoe color" value={selection.shoeColor} options={DEBUG_COLOR_OPTIONS} onChange={(value) => updateSelection('shoeColor', value)} />
        <DebugStepper label="Glasses" value={selection.glasses} options={DEBUG_AVATAR_OPTIONS.glasses} onChange={(value) => updateSelection('glasses', value)} />
        <DebugStepper label="Necklace" value={selection.necklace} options={DEBUG_AVATAR_OPTIONS.necklace} onChange={(value) => updateSelection('necklace', value)} />
        <DebugStepper label="Earrings" value={selection.earrings} options={DEBUG_AVATAR_OPTIONS.earrings} onChange={(value) => updateSelection('earrings', value)} />

        <div className="debug-avatar-nodes">
          <h2>selectedNodes</h2>
          <code>{selectedNodes.length ? selectedNodes.join(', ') : '-'}</code>
        </div>
      </aside>
    </main>
  )
}

function DebugStepper({ label, value, options, disabled = false, onChange }) {
  const currentIndex = Math.max(0, options.findIndex(([optionValue]) => optionValue === value))
  const currentOption = options[currentIndex] || options[0]
  const swatch = currentOption?.[2] || ''
  const step = (direction) => {
    if (disabled || options.length === 0) return
    const nextIndex = (currentIndex + direction + options.length) % options.length
    onChange(options[nextIndex][0])
  }

  return (
    <div className={`debug-stepper ${disabled ? 'is-disabled' : ''}`}>
      <span className="debug-stepper-label">{label}</span>
      <div className="debug-stepper-control">
        <button type="button" disabled={disabled} aria-label={`${label} previous`} onClick={() => step(-1)}>
          &lt;
        </button>
        <div className="debug-stepper-value">
          {swatch ? <i style={{ background: swatch }} aria-hidden="true" /> : null}
          <strong>{currentOption?.[1] || value}</strong>
          <small>{value}</small>
        </div>
        <button type="button" disabled={disabled} aria-label={`${label} next`} onClick={() => step(1)}>
          &gt;
        </button>
      </div>
    </div>
  )
}

function AvatarDebugPage() {
  const [selection, setSelection] = useState({
    hair: 'long_wave_hair',
    skin: 'soft_peach_skin',
    eye: 'puppy_eyes',
    mouth: 'closed_smile_mouth',
    top: 'short_Tshirt',
    bottom: 'short_pants',
    outfit: 'none',
    shoes: 'shoes',
    hairColor: 'black',
    topColor: 'white',
    bottomColor: 'black',
    shoeColor: 'black',
    glasses: 'none',
    necklace: 'none',
    earrings: 'none',
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
      const appearance = buildDebugAppearance(selection)

      try {
        const payload = await buildAvatar({
          agentId: `debug-avatar-${requestSeq}`,
          appearance,
          signal: controller.signal,
        })
        if (requestSeqRef.current !== requestSeq) return
        setModelUrl(avatarAssetUrl(payload.modelUrl))
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
            <Suspense fallback={<div className="debug-avatar-canvas" />}>
              <AvatarThreeViewer
                src={modelUrl}
                alt="아바타 디버그 미리보기"
                variant="avatar"
                distanceMultiplier={1.96}
                fitFullBounds
                className="debug-avatar-canvas"
              />
            </Suspense>
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
        <DebugSelect label="안경" value={selection.glasses} options={DEBUG_AVATAR_OPTIONS.glasses} onChange={(value) => updateSelection('glasses', value)} />
        <DebugSelect label="목걸이" value={selection.necklace} options={DEBUG_AVATAR_OPTIONS.necklace} onChange={(value) => updateSelection('necklace', value)} />
        <DebugSelect label="귀걸이" value={selection.earrings} options={DEBUG_AVATAR_OPTIONS.earrings} onChange={(value) => updateSelection('earrings', value)} />

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
  const {
    stage,
    setStage,
    countdown,
    setCountdown,
    analysisResult,
    setAnalysisResult,
    personaAgentId,
    setPersonaAgentId,
    personaQuestion,
    setPersonaQuestion,
    personaLoading,
    setPersonaLoading,
    personaError,
    setPersonaError,
    personaInput,
    setPersonaInput,
    personaResult,
    setPersonaResult,
    nicknameInput,
    setNicknameInput,
    nicknameStatus,
    setNicknameStatus,
    nicknameValue,
    setNicknameValue,
    enterUrl,
    setEnterUrl,
    avatarModelUrl,
    setAvatarModelUrl,
    isPersonaCustomInputOpen,
    setIsPersonaCustomInputOpen,
    selectedOptionIds,
    setSelectedOptionIds,
    starredOptionId,
    setStarredOptionId,
    answeredHistory,
    setAnsweredHistory,
    setHistoryViewIndex,
    captureLocked,
    setCaptureLocked,
    autoCaptureRequested,
    setAutoCaptureRequested,
    cameraReady,
    setCameraReady,
    isQuestionTransitionLoading,
    setIsQuestionTransitionLoading,
    isCaptureProcessing,
    setIsCaptureProcessing,
    isAvatarPreloading,
    setIsAvatarPreloading,
    isAvatarLoadingExit,
    setIsAvatarLoadingExit,
    isAvatarHandoffCover,
    setIsAvatarHandoffCover,
    resetFlowState,
  } = useTutorialFlowState()
  const timeoutIdsRef = useRef([])
  const startInterviewInFlightRef = useRef(false)
  const startInterviewRequestIdRef = useRef(0)
  const captureSessionIdRef = useRef(0)
  const syncedAppearanceAgentRef = useRef('')
  const capturePipelineRef = useRef(null)
  const personaAgentIdRef = useRef('')
  const personaCompletedRef = useRef(false)
  const nicknameValueRef = useRef('')
  const nicknameInputRef = useRef('')
  const avatarPreviewRotationRef = useRef({ yaw: 0, pitch: 0 })
  const avatarTransitionFinishingRef = useRef(false)
  const avatarPreloadReadyRef = useRef(false)
  const frontCaptureDataUrlRef = useRef('')
  const [rearCapturePromptVisible, setRearCapturePromptVisible] = useState(false)
  const {
    videoRef,
    stopCamera,
    captureCameraFrames,
  } = useCameraCapture({ stage, setCameraReady })
  const getActiveAvatarAgentId = useCallback(
    () => personaAgentIdRef.current || personaAgentId,
    [personaAgentId],
  )
  const {
    buildAvatarModel,
    handleAvatarProfileImageReady,
    resetProfileImageUpload,
  } = useAvatarWorkflow({
    avatarModelUrl,
    getActiveAgentId: getActiveAvatarAgentId,
    normalizeAssetUrl: avatarAssetUrl,
    setAvatarModelUrl,
  })

  useEffect(() => {
    void preloadCountdownFont()
  }, [])

  const clearTimers = () => {
    timeoutIdsRef.current.forEach((id) => window.clearTimeout(id))
    timeoutIdsRef.current = []
  }

  const abandonActivePersonaSession = useCallback((preferBeacon = false) => {
    const activeAgentId = personaAgentIdRef.current
    if (!activeAgentId || personaCompletedRef.current) {
      return
    }

    if (preferBeacon && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const payload = JSON.stringify({ agentId: activeAgentId })
      navigator.sendBeacon(personaSessionAbandonUrl(), payload)
      return
    }

    void abandonPersonaSession(activeAgentId).catch(() => null)
  }, [])

  const resetPersonaSession = () => {
    abandonActivePersonaSession()
    startInterviewRequestIdRef.current += 1
    captureSessionIdRef.current += 1
    startInterviewInFlightRef.current = false
    capturePipelineRef.current = null
    frontCaptureDataUrlRef.current = ''
    personaAgentIdRef.current = ''
    personaCompletedRef.current = false
    nicknameValueRef.current = ''
    nicknameInputRef.current = ''
    syncedAppearanceAgentRef.current = ''
    avatarTransitionFinishingRef.current = false
    avatarPreloadReadyRef.current = false
    resetProfileImageUpload()
    resetFlowState()
  }

  const handleAvatarPreviewRotationChange = useCallback((rotation) => {
    avatarPreviewRotationRef.current = {
      yaw: Number.isFinite(rotation?.yaw) ? rotation.yaw : avatarPreviewRotationRef.current.yaw,
      pitch: Number.isFinite(rotation?.pitch) ? rotation.pitch : avatarPreviewRotationRef.current.pitch,
    }
  }, [])

  const beginAvatarIntroTransition = useCallback(() => {
    setStage('avatarIntro')
  }, [setStage])

  const handleAvatarBackgroundPreloadReady = useCallback(() => {
    if (avatarPreloadReadyRef.current || stage !== 'avatarLoading') {
      return
    }

    avatarPreloadReadyRef.current = true
    setIsAvatarPreloading(false)
    setIsAvatarLoadingExit(true)
    const coverTimer = window.setTimeout(() => {
      setIsAvatarHandoffCover(true)
    }, 260)
    const handoffTimer = window.setTimeout(() => {
      setIsAvatarLoadingExit(false)
      setIsAvatarHandoffCover(false)
      beginAvatarIntroTransition()
    }, 560)
    timeoutIdsRef.current.push(coverTimer, handoffTimer)
  }, [
    beginAvatarIntroTransition,
    setIsAvatarHandoffCover,
    setIsAvatarLoadingExit,
    setIsAvatarPreloading,
    stage,
  ])

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
    }, 620)
    timeoutIdsRef.current.push(cleanupTimer)
  }, [setIsAvatarHandoffCover, setIsAvatarLoadingExit, setIsAvatarPreloading])

  const analyzePhotoWithLlmServer = async (cameraFrames, captureSessionId) => {
    try {
      const result = await analyzeAppearance(cameraFrames)
      if (captureSessionId !== captureSessionIdRef.current) {
        return null
      }
      setAnalysisResult(result)
      return result
    } catch (error) {
      console.error('[tutorial-appearance] analyze failed:', error)
      if (captureSessionId === captureSessionIdRef.current) {
        setAnalysisResult(null)
      }
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
        await syncPersonaAppearance(agentId, appearance)
        syncedAppearanceAgentRef.current = syncKey
      } catch (error) {
        setPersonaError(error instanceof Error ? error.message : 'Appearance sync request failed.')
      }
    },
    [setPersonaError],
  )

  const startPersonaInterview = useCallback(async (appearanceOverride = null) => {
    if (startInterviewInFlightRef.current) {
      return false
    }

    startInterviewInFlightRef.current = true
    personaCompletedRef.current = false
    const requestId = startInterviewRequestIdRef.current + 1
    startInterviewRequestIdRef.current = requestId

    setPersonaLoading(true)
    setPersonaError('')
    const appearancePayload = appearanceOverride ?? analysisResult ?? null

    try {
      const payload = await startPersona({ appearance: appearancePayload })

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
  }, [
    analysisResult,
    setAnsweredHistory,
    setHistoryViewIndex,
    setPersonaAgentId,
    setPersonaError,
    setPersonaInput,
    setPersonaLoading,
    setPersonaQuestion,
    setPersonaResult,
    setSelectedOptionIds,
    setStarredOptionId,
  ])

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
      abandonActivePersonaSession()
      stopCamera()
    }
  }, [abandonActivePersonaSession, stopCamera])

  useEffect(() => {
    const handlePageExit = () => {
      abandonActivePersonaSession(true)
    }

    window.addEventListener('pagehide', handlePageExit)
    window.addEventListener('beforeunload', handlePageExit)
    return () => {
      window.removeEventListener('pagehide', handlePageExit)
      window.removeEventListener('beforeunload', handlePageExit)
    }
  }, [abandonActivePersonaSession])

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
    frontCaptureDataUrlRef.current = ''
    setRearCapturePromptVisible(false)
    setStage('cameraDesignCapture')
  }

  const handleCapture = () => {
    if (stage !== 'cameraDesignCapture' || countdown !== null || captureLocked || isCaptureProcessing) {
      return
    }

    void preloadCountdownFont()
    setAutoCaptureRequested(false)
    setCaptureLocked(true)
    clearTimers()
    setRearCapturePromptVisible(false)
    setCountdown(3)
    const captureSessionId = captureSessionIdRef.current

    const countTwoTimer = window.setTimeout(() => {
      if (captureSessionId === captureSessionIdRef.current) {
        setCountdown(2)
      }
    }, 1000)
    const countOneTimer = window.setTimeout(() => {
      if (captureSessionId === captureSessionIdRef.current) {
        setCountdown(1)
      }
    }, 2000)

    const flashTimer = window.setTimeout(() => {
      if (captureSessionId !== captureSessionIdRef.current) {
        return
      }
      const cameraFrames = captureCameraFrames()
      const capturedImageDataUrl = cameraFrames.frontImageDataUrl

      setCountdown(null)
      if (!frontCaptureDataUrlRef.current) {
        if (!capturedImageDataUrl) {
          setPersonaError('촬영에 실패했습니다. 다시 촬영해 주세요.')
          setCaptureLocked(false)
          return
        }
        frontCaptureDataUrlRef.current = capturedImageDataUrl
        setCaptureLocked(false)
        setRearCapturePromptVisible(true)
        return
      }

      const analysisFrames = {
        frontImageDataUrl: frontCaptureDataUrlRef.current,
        rearImageDataUrl: capturedImageDataUrl || '',
      }
      if (!analysisFrames.rearImageDataUrl) {
        setPersonaError('옆모습 촬영에 실패했습니다. 다시 촬영해 주세요.')
        setCaptureLocked(false)
        setRearCapturePromptVisible(true)
        return
      }
      setIsCaptureProcessing(true)
      setStage('avatarLoading')
      avatarPreviewRotationRef.current = { yaw: 0, pitch: 0 }
      setIsAvatarPreloading(false)
      setIsAvatarLoadingExit(false)
      setIsAvatarHandoffCover(false)
      avatarTransitionFinishingRef.current = false
      avatarPreloadReadyRef.current = false

      const capturePipeline = (async () => {
        try {
          let appearanceResult = null
          if (TEST_MODE_SKIP_CAPTURE_ANALYSIS) {
            setAnalysisResult(MOCK_APPEARANCE_RESULT)
            appearanceResult = MOCK_APPEARANCE_RESULT
          } else {
            if (analysisFrames.frontImageDataUrl) {
              appearanceResult = await analyzePhotoWithLlmServer(analysisFrames, captureSessionId)
            }
          }

          if (captureSessionId !== captureSessionIdRef.current) {
            return null
          }

          if (!appearanceResult) {
            throw new Error('외형 분석에 실패했습니다. 다시 촬영해 주세요.')
          }

          const avatarAppearance = appearanceResult
          const personaPayload = await startPersonaInterview(avatarAppearance)
          if (captureSessionId !== captureSessionIdRef.current) {
            return null
          }
          let avatarPayload = null
          if (personaPayload?.agentId) {
            avatarPayload = await buildAvatarModel({
              agentId: personaPayload.agentId,
              appearance: avatarAppearance,
            })
            if (captureSessionId !== captureSessionIdRef.current) {
              return null
            }
            if (!avatarPayload?.modelUrl) {
              throw new Error('아바타 생성에 실패했습니다. 다시 촬영해 주세요.')
            }
            const latestNickname = (nicknameValueRef.current || nicknameInputRef.current || '').trim()
            if (latestNickname) {
              await renameAvatar({
                agentId: personaPayload.agentId,
                nickname: latestNickname,
              }).catch(() => null)
            }
          }
          if (avatarPayload?.modelUrl) {
            setIsAvatarPreloading(true)
          } else {
            setIsCaptureProcessing(false)
            setStage('avatarIntro')
          }
          return personaPayload
        } catch (error) {
          if (captureSessionId !== captureSessionIdRef.current) {
            return null
          }
          setAnalysisResult(null)
          setPersonaError(error instanceof Error ? error.message : '외형 분석 또는 페르소나 시작에 실패했습니다.')
          frontCaptureDataUrlRef.current = ''
          setRearCapturePromptVisible(false)
          setCaptureLocked(false)
          setIsCaptureProcessing(false)
          setIsAvatarPreloading(false)
          avatarPreloadReadyRef.current = false
          setStage('cameraDesignCapture')
          return null
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
    const submittedAnswerRecord = {
      selectedOptionIds: Array.isArray(safePayload.selectedOptionIds) ? safePayload.selectedOptionIds : [],
      starredOptionId: safePayload.starredOptionId || '',
      customText: safePayload.customText || '',
    }

    try {
      const payload = await answerPersona({
        agentId: personaAgentId,
        answer: safePayload,
        turn: personaQuestion.turn,
      })

      setPersonaInput('')

      if (payload?.done) {
        personaCompletedRef.current = true
        const finalNickname = (nicknameValueRef.current || nicknameInputRef.current || '').trim()
        const didCommitNickname = await commitNicknameToServer(finalNickname, personaAgentId)
        if (!didCommitNickname) {
          setPersonaError('이름 저장에 실패했습니다. 다른 이름으로 다시 시도해 주세요.')
          setIsQuestionTransitionLoading(false)
          return
        }

        if (submittedQuestion) {
          setAnsweredHistory((prev) => [
            ...prev,
            {
              question: submittedQuestion,
              answerText: trimmedAnswerText,
              answerMode: 'taste',
              answerPayload: submittedAnswerRecord,
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
              answerPayload: submittedAnswerRecord,
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

  const restoreAnswerForEditing = (entry, serverAnswer = null) => {
    const localPayload = entry?.answerPayload && typeof entry.answerPayload === 'object' ? entry.answerPayload : null
    const selectedIds = Array.isArray(serverAnswer?.selectedOptionIds)
      ? serverAnswer.selectedOptionIds
      : Array.isArray(localPayload?.selectedOptionIds)
        ? localPayload.selectedOptionIds
        : []
    const customText = typeof serverAnswer?.customText === 'string'
      ? serverAnswer.customText
      : typeof localPayload?.customText === 'string'
        ? localPayload.customText
        : ''
    const starredId = typeof serverAnswer?.starredOptionId === 'string' && serverAnswer.starredOptionId
      ? serverAnswer.starredOptionId
      : typeof localPayload?.starredOptionId === 'string' && localPayload.starredOptionId
        ? localPayload.starredOptionId
        : selectedIds[0] || ''

    setSelectedOptionIds(selectedIds)
    setStarredOptionId(starredId)
    setPersonaInput(customText)
    setIsPersonaCustomInputOpen(selectedIds.includes('other_custom'))
  }

  const editHistoryAnswer = async (entry, entryIndex) => {
    if (!entry?.question || !personaAgentId || personaLoading || isQuestionTransitionLoading) {
      return
    }

    setPersonaLoading(true)
    setPersonaError('')
    try {
      const payload = await undoPersonaAnswer({
        agentId: personaAgentId,
        turn: entry.question.turn,
      })
      setPersonaQuestion(payload.question)
      setPersonaResult(null)
      setAnsweredHistory((prev) => prev.slice(0, Math.max(0, entryIndex)))
      setHistoryViewIndex(null)
      restoreAnswerForEditing(entry, payload.restoredAnswer)
    } catch (error) {
      setPersonaError(error instanceof Error ? error.message : '이전 답변을 다시 불러오지 못했습니다.')
    } finally {
      setPersonaLoading(false)
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

    if (answeredHistory.length > 0) {
      const previousEntryIndex = answeredHistory.length - 1
      const previousEntry = answeredHistory[previousEntryIndex]
      void editHistoryAnswer(previousEntry, previousEntryIndex)
      return
    }

    if (selectedOptionIds.length > 0 || isPersonaCustomInputOpen || personaInput.trim()) {
      resetCurrentSelection()
    }
  }

  const currentQuestion = personaQuestion
  const displayQuestion = currentQuestion
  const personaQuestionText = displayQuestion?.question ?? ''
  const personaTotalTurns = Number(displayQuestion?.total_turns || displayQuestion?.totalTurns || PERSONA_TOTAL_TURNS) || PERSONA_TOTAL_TURNS
  const personaCurrentTurn = Number(displayQuestion?.turn || 0) || 0
  const isFinalPersonaQuestion = Boolean(displayQuestion && personaCurrentTurn >= personaTotalTurns)
  const personaTurnKey = personaResult ? 'persona-result' : `persona-turn-${displayQuestion?.turn ?? 0}`
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

  const isNicknameValid = (value) => (
    TEST_MODE_RELAXED_NICKNAME
      ? value.length > 0
      : /^[A-Za-z가-힣 ]{2,12}$/.test(value)
  )

  const acceptNicknameDraft = (targetNickname) => {
    setNicknameValue(targetNickname)
    setNicknameInput(targetNickname)
    setNicknameStatus('success')
    return true
  }

  const commitNicknameToServer = async (targetNickname, agentIdOverride = null) => {
    const activeAgentId = agentIdOverride || personaAgentId || personaAgentIdRef.current
    if (!targetNickname || !activeAgentId) {
      return false
    }

    setNicknameStatus('checking')

    try {
      const payload = await claimNickname({
        agentId: activeAgentId,
        nickname: targetNickname,
      })

      const avatarPayload = await renameAvatar({
        agentId: activeAgentId,
        nickname: targetNickname,
      }).catch(() => null)
      if (avatarPayload) {
        setAvatarModelUrl(avatarAssetUrl(avatarPayload.modelUrl) || avatarModelUrl)
      }

      setEnterUrl(payload.enterUrl ?? `https://terarium.team-doob.com/profile?agentId=${encodeURIComponent(activeAgentId)}`)
      setNicknameValue(targetNickname)
      setNicknameInput(targetNickname)
      setNicknameStatus('success')
      return true
    } catch (error) {
      if (TEST_MODE_RELAXED_NICKNAME) {
        setEnterUrl(`https://terarium.team-doob.com/profile?agentId=${encodeURIComponent(activeAgentId)}`)
        setNicknameValue(targetNickname)
        setNicknameInput(targetNickname)
        setNicknameStatus('success')
        return true
      }
      setNicknameStatus('error')
      console.warn(error instanceof Error ? error.message : '닉네임 저장에 실패했습니다.')
      return false
    }
  }

  const handleNicknameClaim = async (nicknameOverride = null, nextStage = 'persona') => {
    const targetNickname = typeof nicknameOverride === 'string' ? nicknameOverride.trim() : nicknameInput.trim()
    if (!isNicknameValid(targetNickname) || nicknameStatus === 'checking') {
      return false
    }

    if (nextStage === null) {
      return acceptNicknameDraft(targetNickname)
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

    const didCommitNickname = await commitNicknameToServer(targetNickname, activeAgentId)
    if (didCommitNickname && nextStage) {
      setStage(nextStage)
    }
    return didCommitNickname
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
          hideUi={captureLocked || countdown !== null || rearCapturePromptVisible}
          backgroundSlot={
            <>
              <video
                ref={videoRef}
                className="tutorial-camera-background-video"
                autoPlay
                playsInline
                muted
              />
            </>
          }
        />
        {rearCapturePromptVisible && (
          <section className="rear-capture-overlay" aria-live="polite">
            <div className="rear-capture-panel">
              <p className="rear-capture-title">이제 옆으로 돌아 주세요</p>
              <p className="rear-capture-copy">머리 길이와 묶음 위치를 정확히 보기 위해 옆모습을 한 번 더 촬영할게요.</p>
              <button
                type="button"
                className="rear-capture-button"
                onClick={handleCapture}
              >
                옆모습 촬영
              </button>
            </div>
          </section>
        )}
        {isCaptureProcessing && (
          <section className="capture-processing-overlay" aria-live="polite">
            <div className="capture-processing-pill">
              <span className="capture-processing-dot" aria-hidden="true" />
              <p className="capture-processing-text">아바타를 준비하는 중</p>
            </div>
          </section>
        )}
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
      <main
        className={`avatar-loading-screen${isAvatarHandoffCover ? ' is-covered' : ''}`}
        aria-label="로딩 중"
        aria-live="polite"
      >
        <Suspense fallback={<div className="avatar-loading-preview" />}>
          <AvatarThreeViewer
            className="avatar-loading-preview"
            src={LOADING_BASE_AVATAR_URL}
            alt="avatar loading preview"
            variant="loadingBase"
            distanceMultiplier={1.66}
            initialYaw={0}
            onRotationChange={handleAvatarPreviewRotationChange}
          />
        </Suspense>
        <div className="avatar-loading-status-layer">
          <p className="avatar-loading-status-text">AI 에이전트 생성중</p>
        </div>
        {isAvatarPreloading && avatarModelUrl && (
          <div className="avatar-background-preloader" aria-hidden="true">
            <AvatarThreeViewer
              className="avatar-background-preloader-viewer"
              src={avatarModelUrl}
              alt="avatar preload"
              variant="avatar"
              distanceMultiplier={1.82}
              initialYaw={0}
              onReady={handleAvatarBackgroundPreloadReady}
            />
          </div>
        )}
        {isAvatarLoadingExit && <div className="avatar-transition-overlay is-exiting" aria-hidden="true" />}
      </main>
    )
  }

  if (stage === 'avatarIntro') {
    return (
      <>
        <TutorialDesign
          initialId={9}
          avatarUrl={avatarModelUrl}
          avatarInitialYaw={0}
          externalName={nicknameValue}
          avatarIntroTextStartDelay={650}
          onAvatarRotationChange={handleAvatarPreviewRotationChange}
          onAvatarReady={null}
          onAvatarProfileImageReady={handleAvatarProfileImageReady}
          onNameSubmit={(name) => handleNicknameClaim(name, null)}
          onStartQuestions={() => setStage('persona')}
        />
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
      <section
        className="persona-stage"
        aria-label="페르소나 인터뷰 화면"
        style={{ '--persona-logo-bg': `url(${logo1Src})` }}
      >
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
              {answeredHistory.length > 0 || selectedOptionIds.length > 0 || isPersonaCustomInputOpen || personaInput.trim() ? (
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
              {(canSubmitSelection || isQuestionTransitionLoading) && (
                <button
                  className="nav-btn next-btn is-active"
                  type="button"
                  onClick={handleNextClick}
                  disabled={personaLoading || isQuestionTransitionLoading || !canSubmitSelection}
                >
                  {isQuestionTransitionLoading ? '분석 중...' : '다음으로'}
                </button>
              )}
            </nav>
          )}

          {isQuestionTransitionLoading && isFinalPersonaQuestion && (
            <div className="persona-analysis-status-layer" aria-live="polite">
              <p className="persona-analysis-status-text">답변 분석중</p>
            </div>
          )}

        </section>
    </div>
  )
}

function RandomAgentPage() {
  const [payload, setPayload] = useState(null)
  const [status, setStatus] = useState('creating')
  const [error, setError] = useState('')

  const create = useCallback(async () => {
    setStatus('creating')
    setError('')
    try {
      const nextPayload = await createRandomAgent()
      setPayload(nextPayload)
      setStatus('rendering')
    } catch (createError) {
      setStatus('error')
      setError(createError instanceof Error ? createError.message : 'random agent failed')
    }
  }, [])

  useEffect(() => {
    void create()
  }, [create])

  const handleAvatarReady = useCallback(() => {
    setStatus('ready')
  }, [])

  const modelUrl = avatarAssetUrl(payload?.avatar?.modelUrl || '')
  const statusText = status === 'creating'
    ? '랜덤 에이전트 생성 중'
    : status === 'rendering'
      ? '아바타 렌더링 중'
      : status === 'ready'
        ? '랜덤 에이전트 생성 완료'
        : error || '문제가 발생했습니다'

  return (
    <main className="random-agent-page" data-status={status}>
      <section className="random-agent-view">
        {modelUrl ? (
          <Suspense fallback={<div className="random-agent-viewer" />}>
            <AvatarThreeViewer
              className="random-agent-viewer"
              src={modelUrl}
              alt="랜덤 에이전트 아바타"
              variant="avatar"
              distanceMultiplier={1.45}
              fitFullBounds
              onReady={handleAvatarReady}
            />
          </Suspense>
        ) : (
          <div className="random-agent-viewer" />
        )}
      </section>
      <aside className="random-agent-panel">
        <img src={logo1Src} alt="TERARiUM" />
        <p>{statusText}</p>
        {payload ? (
          <>
            <strong>{payload.nickname}</strong>
            <small>{payload.agentId}</small>
            <a href={payload.enterUrl}>입장</a>
          </>
        ) : null}
        <button type="button" onClick={() => void create()} disabled={status === 'creating'}>
          다시 랜덤 생성
        </button>
      </aside>
    </main>
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
      setModelUrl(avatarAssetUrl(explicitModelUrl))
      return
    }
    if (!agentId) {
      setError('agentId is required')
      setStatus('error')
      return
    }

    let cancelled = false
    fetchAvatarRecipe(agentId)
      .then((payload) => {
        if (!cancelled) setModelUrl(avatarAssetUrl(payload?.recipe?.modelUrl))
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
        <Suspense fallback={<div className="avatar-profile-capture-viewer" />}>
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
        </Suspense>
      ) : null}
      {status !== 'ready' && <span className="avatar-profile-capture-status">{error || status}</span>}
    </main>
  )
}

export default App
