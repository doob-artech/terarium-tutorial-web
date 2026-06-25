import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import TutorialDesign from './tutorialDesign/TutorialDesign.jsx'
import { assetUrl } from './apiBase.js'
import {
  abandonPersonaSession,
  buildAvatar,
  claimNickname,
  createRandomAgent,
  fetchAvatarRecipe,
  personaSessionAbandonUrl,
  renameAvatar,
  runAppearancePipeline,
  startPersona,
  synthesizePersona,
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
const TEST_MODE_RANDOM_AVATAR_ON_EMPTY_CAPTURE =
  import.meta.env.DEV ||
  import.meta.env.VITE_RANDOM_AVATAR_ON_EMPTY_CAPTURE === 'true' ||
  import.meta.env.VITE_BASIC_AVATAR_ON_EMPTY_CAPTURE === 'true'
const TEST_MODE_RELAXED_NICKNAME = import.meta.env.DEV || import.meta.env.VITE_ALLOW_DUPLICATE_NICKNAME === 'true'
const TEST_MODE_RANDOM_AGENT_SHORTCUT = import.meta.env.DEV || import.meta.env.VITE_ENABLE_RANDOM_AGENT_SHORTCUT === 'true'
const PERSONA_TOTAL_TURNS = 4
const CLICK_SOUND_FALLBACK_MS = 320
const CLICK_SOUND_TAIL_GAP_MS = 40
const LOADING_BASE_AVATAR_URL = assetUrl('/model/source/avatar_v2.glb')
const keywordOptions = (category, categoryLabel, labels) => labels.map((label) => ({
  id: `${category}:${label}`,
  label,
  category,
  categoryLabel,
}))
const PERSONA_KEYWORD_QUESTION_CATALOG = [
  {
    turn: 1,
    total_turns: PERSONA_TOTAL_TURNS,
    category: 'negative',
    categoryLabel: '부정',
    question: '자신에게 해당하는 성격 키워드를 골라주세요. (1~6개 선택 가능)',
    maxSelections: 6,
    options: keywordOptions('negative', '부정', [
      '이기적인',
      '방어적인',
      '의존적인',
      '계산적인',
      '배타적인',
      '지배적인',
      '무책임한',
      '우유부단한',
      '고집스러운',
      '충동적인',
      '변덕스러운',
      '산만한',
      '수동적인',
      '비관적인',
      '예민한',
      '소심한',
      '자격지심이 있는',
      '강박적인',
      '무기력한',
      '냉소적인',
      '다혈질인',
      '가식적인',
      '위압적인',
    ]),
  },
  {
    turn: 2,
    total_turns: PERSONA_TOTAL_TURNS,
    category: 'positive',
    categoryLabel: '긍정',
    question: '자신에게 해당하는 성격 키워드를 골라주세요. (1~6개 선택 가능)',
    maxSelections: 6,
    options: keywordOptions('positive', '긍정', [
      '다정다감한',
      '배려심 깊은',
      '친화력 있는',
      '공감 능력이 좋은',
      '포용력 넓은',
      '솔직 담백한',
      '협동적인',
      '경청하는',
      '책임감 강한',
      '성실한',
      '주도적인',
      '꼼꼼한',
      '계획적인',
      '융통성 있는',
      '끈기 있는',
      '결단력 있는',
      '센스 있는',
      '회복 탄력성이 좋은',
      '차분한',
      '겸손한',
      '독립적인',
      '적응력 빠른',
      '여유로운',
      '신중한',
      '활기찬',
      '열정적인',
      '명랑한',
      '유머러스한',
      '호기심 많은',
      '진취적인',
    ]),
  },
  {
    turn: 3,
    total_turns: PERSONA_TOTAL_TURNS,
    category: 'unusual',
    categoryLabel: '특이',
    question: '자신에게 해당하는 성격 키워드를 골라주세요. (1~6개 선택 가능)',
    maxSelections: 6,
    options: keywordOptions('unusual', '특이', [
      '관찰자적인',
      '마이웨이인',
      '예측 불허한',
      '고립을 즐기는',
      '직관적인',
      '선택적 완벽주의인',
      '몽상가적인',
      '비정형적인',
      '철학적인',
      '초연한',
      '양면적인',
      '자기 객관화가 뚜렷한',
      '자유영혼인',
      '신비로운',
      '반항적인',
      '너드미가 있는',
    ]),
  },
  {
    turn: 4,
    total_turns: PERSONA_TOTAL_TURNS,
    category: 'wish',
    categoryLabel: '목표',
    question: '당신이 TERARiUM에 간다면 무엇을 하고 싶은가요?',
    maxSelections: 0,
    options: [],
  },
]
const PERSONA_KEYWORD_QUESTIONS = [
  PERSONA_KEYWORD_QUESTION_CATALOG[1],
  PERSONA_KEYWORD_QUESTION_CATALOG[0],
  ...PERSONA_KEYWORD_QUESTION_CATALOG.slice(2),
].map((question, index) => ({ ...question, turn: index + 1 }))
const PERSONA_KEYWORD_OPTIONS = PERSONA_KEYWORD_QUESTIONS.flatMap((question) => question.options)
const WISH_GOAL_MAX_SELECTIONS = 2
const WISH_GOAL_OPTIONS = [
  '연애를 하고',
  '친구를 만들고',
  '쉬고',
  '비밀을 찾고',
  '천재가 되고',
  '인기스타가 되고',
  '맛집을 찾아다니고',
  '탐험을 하고',
  '라이벌을 만들고',
  '장난을 치고',
  '일탈을 하고',
].map((label, index) => ({
  id: `wish-goal-${index + 1}`,
  label,
}))

const buildWishGoalSentence = (optionIds) => {
  const selectedLabels = optionIds
    .map((optionId) => WISH_GOAL_OPTIONS.find((option) => option.id === optionId)?.label)
    .filter(Boolean)

  return selectedLabels.length ? `나는 이곳에서 ${selectedLabels.join(', ')} 싶다` : ''
}
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
    hair_mesh: debugAssetToSemantic.hair_mesh[selection.hair] || selection.hair,
    top_mesh: debugAssetToSemantic.top_mesh[selection.top] || selection.top,
    bottom_mesh: debugAssetToSemantic.bottom_mesh[selection.bottom] || selection.bottom,
    outfit_mesh: debugAssetToSemantic.outfit_mesh[selection.outfit] || selection.outfit,
    shoe_mesh: debugAssetToSemantic.shoe_mesh[selection.shoes] || selection.shoes,
    glasses_mesh: selection.glasses,
    necklace_mesh: selection.necklace,
    earring_mesh: debugAssetToSemantic.earring_mesh[selection.earrings] || selection.earrings,
  },
})

const debugAssetToSemantic = {
  hair_mesh: {
    bun_hair: 'bun_without_bangs',
    bangs_bun_hair: 'bun_with_bangs',
    bangs_bobbed_hair: 'bob_with_bangs',
    bobbed_hair: 'bob_without_bangs',
    permed_hair: 'short_permed_hair',
    half_ponytail: 'half_up_hair',
    bangs_long_wave_hair: 'long_wave_with_bangs',
    long_wave_hair: 'long_wave_without_bangs',
    bangs_straight_hair: 'long_straight_with_bangs',
    straight_hair: 'long_straight_without_bangs',
    twin_braids: 'twin_braids',
    high_ponytail: 'high_ponytail_without_bangs',
    bangs_high_ponytail: 'high_ponytail_with_bangs',
    low_ponytail: 'low_ponytail_without_bangs',
    bangs_low_ponytail: 'low_ponytail_with_bangs',
    bowl_cut: 'bowl_cut',
    gael_cut_1: 'short_side_part_swept_left',
    gael_cut_2: 'short_side_part_swept_right',
    wolf_cut: 'wolf_cut',
    crop_cut: 'crop_cut',
    pompadour_cut: 'slicked_back_pompadour',
    dandy_cut: 'soft_dandy_cut',
  },
  top_mesh: {
    long_Tshirt: 'long_sleeve_tshirt',
    short_Tshirt: 'short_sleeve_tshirt',
    shirts: 'collared_button_shirt',
    leather_jacket: 'leather_jacket',
  },
  bottom_mesh: {
    short_pants: 'shorts',
    long_pants: 'long_pants',
    short_skirt: 'short_skirt',
    long_skirt: 'long_skirt',
  },
  outfit_mesh: {
    none: 'none',
    onepiece_1: 'short_dress',
    onepiece_2: 'long_dress',
  },
  shoe_mesh: {
    shoes: 'sneakers',
    sandals: 'sandals',
  },
  earring_mesh: {
    none: 'none',
    Earring01: 'hoop_earrings',
    Earring02: 'small_stud_earrings',
  },
}

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

const AVATAR_EDIT_COLOR_CONTROLS = [
  { key: 'hair', param: 'hairColor', label: '머리카락', fallback: '#101010' },
  { key: 'top', param: 'topColor', label: '상의', fallback: '#777777' },
  { key: 'bottom', param: 'bottomColor', label: '하의', fallback: '#777777' },
]
const AVATAR_EDIT_COLOR_FALLBACKS = AVATAR_EDIT_COLOR_CONTROLS.reduce((acc, control) => {
  acc[control.key] = control.fallback
  return acc
}, {})
const HEX_COLOR_PARAM_PATTERN = /^#[0-9a-f]{6}$/i

const normalizeHexColorParam = (value) => {
  const color = String(value || '').trim()
  return HEX_COLOR_PARAM_PATTERN.test(color) ? color.toLowerCase() : ''
}

const readAvatarColorParams = (params) => {
  const colors = {}
  for (const control of AVATAR_EDIT_COLOR_CONTROLS) {
    const color = normalizeHexColorParam(params.get(control.param))
    if (color) colors[control.key] = color
  }
  return colors
}

const hasAvatarColorOverrides = (colors) => Object.values(colors || {}).some(Boolean)

const getRandomOptionValue = (options) => options[Math.floor(Math.random() * options.length)]?.[0] || ''
const TEST_RANDOM_COLOR_OPTIONS = [
  ['black'],
  ['dark_brown'],
  ['brown'],
  ['light_brown'],
  ['beige'],
  ['gray'],
  ['white'],
  ['red'],
  ['orange'],
  ['yellow'],
  ['green'],
  ['blue'],
  ['navy'],
  ['purple'],
  ['pink'],
  ['multicolor'],
]

const createRandomTestAppearance = () => {
  const hairColor = getRandomOptionValue(TEST_RANDOM_COLOR_OPTIONS)
  const topColor = getRandomOptionValue(TEST_RANDOM_COLOR_OPTIONS)
  const bottomColor = getRandomOptionValue(TEST_RANDOM_COLOR_OPTIONS)
  const shoeColor = getRandomOptionValue(TEST_RANDOM_COLOR_OPTIONS)
  const outfit = getRandomOptionValue(DEBUG_AVATAR_OPTIONS.outfit)

  return {
    hair_color: hairColor,
    eye_color: 'dark_brown',
    top_color: topColor,
    bottom_color: outfit !== 'none' ? topColor : bottomColor,
    shoe_color: shoeColor,
    asset_tags: {
      skin_texture: getRandomOptionValue(DEBUG_AVATAR_OPTIONS.skin),
      eye_texture: getRandomOptionValue(DEBUG_AVATAR_OPTIONS.eye),
      mouth_texture: getRandomOptionValue(DEBUG_AVATAR_OPTIONS.mouth),
      hair_mesh: getRandomOptionValue(DEBUG_AVATAR_OPTIONS.hair),
      top_mesh: getRandomOptionValue(DEBUG_AVATAR_OPTIONS.top),
      bottom_mesh: getRandomOptionValue(DEBUG_AVATAR_OPTIONS.bottom),
      outfit_mesh: outfit,
      shoe_mesh: getRandomOptionValue(DEBUG_AVATAR_OPTIONS.shoes),
      glasses_mesh: getRandomOptionValue(DEBUG_AVATAR_OPTIONS.glasses),
      necklace_mesh: getRandomOptionValue(DEBUG_AVATAR_OPTIONS.necklace),
      earring_mesh: getRandomOptionValue(DEBUG_AVATAR_OPTIONS.earrings),
    },
  }
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
  const [personaKeywordStep, setPersonaKeywordStep] = useState(0)
  const [selectedWishOptionIds, setSelectedWishOptionIds] = useState([])
  const randomAgentShortcutCountRef = useRef(0)
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
    selectedOptionIds,
    setSelectedOptionIds,
    starredOptionId,
    setStarredOptionId,
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
    rearVideoRef,
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
    if (stage !== 'persona') {
      setPersonaKeywordStep(0)
      setSelectedWishOptionIds([])
    }
  }, [stage])

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
    avatarTransitionFinishingRef.current = false
    avatarPreloadReadyRef.current = false
    resetProfileImageUpload()
    setSelectedWishOptionIds([])
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

  const runPhotoAppearancePipeline = async (cameraFrames, captureSessionId) => {
    try {
      const payload = await runAppearancePipeline({
        agentId: `tutorial:${crypto.randomUUID()}`,
        frontImageDataUrl: cameraFrames?.frontImageDataUrl || cameraFrames?.imageDataUrl || '',
        rearImageDataUrl: cameraFrames?.rearImageDataUrl || '',
      })
      if (captureSessionId !== captureSessionIdRef.current) {
        return null
      }
      const result = payload.result
      setAnalysisResult(result)
      return payload
    } catch (error) {
      console.error('[tutorial-appearance] pipeline failed:', error)
      if (captureSessionId === captureSessionIdRef.current) {
        setAnalysisResult(null)
      }
      return null
    }
  }

  const startPersonaInterview = useCallback(async (appearanceOverride = null, agentIdOverride = '') => {
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
      const payload = await startPersona({ agentId: agentIdOverride, appearance: appearancePayload })

      if (requestId !== startInterviewRequestIdRef.current) {
        return
      }

      setPersonaAgentId(payload.agentId)
      setPersonaQuestion(payload.question)
      setPersonaResult(null)
      setPersonaInput('')
      setPersonaError('')
      setSelectedOptionIds([])
      setSelectedWishOptionIds([])
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

  const handleRandomAgentShortcutClick = () => {
    randomAgentShortcutCountRef.current += 1
    if (randomAgentShortcutCountRef.current >= 5) {
      window.location.assign('/random-agent')
    }
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

      setCountdown(null)
      const analysisFrames = {
        frontImageDataUrl: cameraFrames.frontImageDataUrl || '',
        rearImageDataUrl: cameraFrames.rearImageDataUrl || '',
      }
      const hasAnyCaptureFrame = Boolean(analysisFrames.frontImageDataUrl || analysisFrames.rearImageDataUrl)
      const shouldUseRandomAvatarFallback =
        TEST_MODE_RANDOM_AVATAR_ON_EMPTY_CAPTURE &&
        !hasAnyCaptureFrame

      if (!hasAnyCaptureFrame && !shouldUseRandomAvatarFallback) {
        setPersonaError('촬영에 실패했습니다. 다시 촬영해 주세요.')
        setCaptureLocked(false)
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
          let appearancePayload = null
          if (TEST_MODE_SKIP_CAPTURE_ANALYSIS || shouldUseRandomAvatarFallback) {
            if (shouldUseRandomAvatarFallback) {
              console.info('[tutorial-camera] empty capture; using random avatar fallback for local testing.')
            }
            appearanceResult = createRandomTestAppearance()
            setAnalysisResult(appearanceResult)
          } else if (hasAnyCaptureFrame) {
            appearancePayload = await runPhotoAppearancePipeline(analysisFrames, captureSessionId)
            appearanceResult = appearancePayload?.result || null
          }

          if (captureSessionId !== captureSessionIdRef.current) {
            return null
          }

          if (!appearanceResult && shouldUseRandomAvatarFallback) {
            console.info('[tutorial-camera] appearance analysis unavailable; using random avatar fallback for local testing.')
            appearanceResult = createRandomTestAppearance()
            setAnalysisResult(appearanceResult)
          }

          if (!appearanceResult) {
            throw new Error('외형 분석에 실패했습니다. 다시 촬영해 주세요.')
          }

          const avatarAppearance = appearanceResult
          const personaPayload = await startPersonaInterview(avatarAppearance, appearancePayload?.agentId || '')
          if (captureSessionId !== captureSessionIdRef.current) {
            return null
          }
          let avatarPayload = appearancePayload?.avatar || null
          if (personaPayload?.agentId) {
            if (!avatarPayload?.modelUrl) {
              avatarPayload = await buildAvatarModel({
                agentId: personaPayload.agentId,
                appearance: avatarAppearance,
              })
              if (captureSessionId !== captureSessionIdRef.current) {
                return null
              }
            }
            if (!avatarPayload?.modelUrl) {
              throw new Error('아바타 생성에 실패했습니다. 다시 촬영해 주세요.')
            }
            setAvatarModelUrl(avatarAssetUrl(avatarPayload.modelUrl))
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
    if (!personaAgentId || personaResult || personaLoading) {
      return
    }

    const safePayload = answerPayload && typeof answerPayload === 'object' ? answerPayload : null
    const trimmedAnswerText = typeof answerText === 'string' ? answerText.trim() : ''
    if (!safePayload || !canSubmitSelection || !trimmedAnswerText) {
      return
    }

    setPersonaLoading(true)
    setPersonaError('')
    const submittedAnswerRecord = {
      positiveKeywords: safePayload.positiveKeywords,
      negativeKeywords: safePayload.negativeKeywords,
      unusualKeywords: safePayload.unusualKeywords,
      terariumWish: safePayload.terariumWish,
    }

    try {
      const payload = await synthesizePersona({
        agentId: personaAgentId,
        appearance: analysisResult,
        positiveKeywords: safePayload.positiveKeywords,
        negativeKeywords: safePayload.negativeKeywords,
        unusualKeywords: safePayload.unusualKeywords,
        terariumWish: safePayload.terariumWish,
      })

      setPersonaInput('')

      if (payload?.done) {
        personaCompletedRef.current = true
        if (payload.enterUrl) {
          setEnterUrl(payload.enterUrl)
        }
        const finalNickname = (nicknameValueRef.current || nicknameInputRef.current || '').trim()
        const didCommitNickname = await commitNicknameToServer(finalNickname, personaAgentId)
        if (!didCommitNickname) {
          setPersonaError('이름 저장에 실패했습니다. 다른 이름으로 다시 시도해 주세요.')
          setIsQuestionTransitionLoading(false)
          return
        }

        setAnsweredHistory((prev) => [
          ...prev,
          {
            question: { turn: 1, question: '키워드와 TERARiUM wish' },
            answerText: trimmedAnswerText,
            answerMode: 'keyword_persona',
            answerPayload: submittedAnswerRecord,
          },
        ])
        setPersonaResult(payload.result ?? null)
        setPersonaQuestion(null)
        setIsQuestionTransitionLoading(false)
        setStage('finalDesign')
        return
      }

      throw new Error('Server returned an invalid persona synthesis response.')
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
        return next
      }

      const optionCategory = option.category || displayQuestion?.category || ''
      const selectedInCategory = prev.filter((id) => id.startsWith(`${optionCategory}:`)).length
      if (selectedInCategory >= (displayQuestion?.maxSelections || displayQuestion?.max_select || 6)) {
        return prev
      }

      const next = [...prev, optionId]
      setStarredOptionId(next[0] || '')
      return next
    })
  }

  const handleWishGoalOptionClick = (optionId) => {
    if (!optionId) return
    playPersonaClickSound()

    setSelectedWishOptionIds((prev) => {
      const next = prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : prev.length >= WISH_GOAL_MAX_SELECTIONS
          ? prev
          : [...prev, optionId]

      setPersonaInput(buildWishGoalSentence(next))
      return next
    })
  }

  const handleWishGoalCustomInputChange = (event) => {
    setSelectedWishOptionIds([])
    setPersonaInput(event.target.value)
  }

  const handleNextClick = () => {
    if (!isFinalPersonaQuestion) {
      if (currentStepSelectionCount > 0) {
        setPersonaKeywordStep((step) => Math.min(step + 1, PERSONA_KEYWORD_QUESTIONS.length - 1))
      }
      return
    }

    if (canSubmitSelection) {
      setIsQuestionTransitionLoading(true)
      void submitPersonaAnswer(
        {
          positiveKeywords: selectedKeywordGroups.positive,
          negativeKeywords: selectedKeywordGroups.negative,
          unusualKeywords: selectedKeywordGroups.unusual,
          terariumWish: personaInput.trim(),
        },
        selectedAnswerText,
      )
    }
  }

  const handlePrevClick = () => {
    if (personaResult) {
      return
    }

    if (personaLoading || isQuestionTransitionLoading) {
      return
    }

    if (personaKeywordStep > 0) {
      setPersonaKeywordStep((step) => Math.max(0, step - 1))
    }
  }

  const handlePersonaCategoryTabClick = (targetIndex) => {
    if (personaResult || personaLoading || isQuestionTransitionLoading) {
      return
    }

    setPersonaKeywordStep(Math.max(0, Math.min(targetIndex, PERSONA_KEYWORD_QUESTIONS.length - 1)))
  }

  const renderPersonaCategoryTabs = () => (
    <div className="persona-category-tabs" aria-label="성격 카테고리 진행 상황">
      {PERSONA_KEYWORD_QUESTIONS.map((question, questionIndex) => {
        const isActiveCategory = question.category === displayQuestion?.category
        const selectedCount = categorySelectionCounts[question.category] || 0
        return (
          <button
            key={question.category}
            type="button"
            className={`persona-category-tab${isActiveCategory ? ' is-active' : ''}${selectedCount > 0 ? ' has-selection' : ''}`}
            onClick={() => handlePersonaCategoryTabClick(questionIndex)}
            disabled={personaLoading || isQuestionTransitionLoading}
            aria-current={isActiveCategory ? 'step' : undefined}
          >
            <span>{question.categoryLabel}</span>
            <strong>{selectedCount}</strong>
          </button>
        )
      })}
    </div>
  )

  const displayQuestion = PERSONA_KEYWORD_QUESTIONS[personaKeywordStep] || PERSONA_KEYWORD_QUESTIONS[0]
  const personaQuestionText = displayQuestion?.category === 'wish'
    ? '나는 이곳에서 ______ 싶다. (최대 2개 선택)'
    : (displayQuestion?.question ?? '')
  const personaTotalTurns = Number(displayQuestion?.total_turns || displayQuestion?.totalTurns || PERSONA_TOTAL_TURNS) || PERSONA_TOTAL_TURNS
  const personaCurrentTurn = Number(displayQuestion?.turn || 0) || 0
  const isFinalPersonaQuestion = Boolean(displayQuestion && personaCurrentTurn >= personaTotalTurns)
  const isWishQuestion = displayQuestion?.category === 'wish'
  const personaTurnKey = personaResult ? 'persona-result' : `persona-turn-${displayQuestion?.turn ?? 0}`
  const displayOptions = Array.isArray(displayQuestion?.options) ? displayQuestion.options : []
  const optionLabelMap = new Map(PERSONA_KEYWORD_OPTIONS.map((option) => [option.id, option]))
  const currentStepSelectionCount = selectedOptionIds.filter((optionId) => {
    const option = optionLabelMap.get(optionId)
    return option?.category === displayQuestion?.category
  }).length
  const categorySelectionCounts = PERSONA_KEYWORD_QUESTIONS.reduce((counts, question) => ({
    ...counts,
    [question.category]: question.category === 'wish'
      ? selectedWishOptionIds.length
      : selectedOptionIds.filter((optionId) => optionLabelMap.get(optionId)?.category === question.category).length,
  }), {})
  const selectedOptionLabels = selectedOptionIds
    .map((optionId) => optionLabelMap.get(optionId))
    .filter(Boolean)
    .map((option) => `${option.categoryLabel}: ${option.label}`)
  const selectedKeywordChipOptions = selectedOptionIds
    .map((optionId) => optionLabelMap.get(optionId))
    .filter(Boolean)
  const selectedKeywordGroups = selectedOptionIds.reduce((groups, optionId) => {
    const option = optionLabelMap.get(optionId)
    if (!option) return groups
    return {
      ...groups,
      [option.category]: [...groups[option.category], option.label],
    }
  }, { positive: [], negative: [], unusual: [] })
  const selectedAnswerText = [
    ...selectedOptionLabels,
    personaInput.trim() ? `하고 싶은 일: ${personaInput.trim()}` : '',
  ].filter(Boolean).join(' / ')
  const selectedWishLabels = selectedWishOptionIds
    .map((optionId) => WISH_GOAL_OPTIONS.find((option) => option.id === optionId)?.label)
    .filter(Boolean)
  const customWishPreview = personaInput
    .trim()
    .replace(/^나는\s*이곳에서\s*/, '')
    .replace(/\s*싶다$/, '')
  const wishBlankText = selectedWishLabels.length ? selectedWishLabels.join(', ') : customWishPreview
  const hasAllKeywordGroups = selectedKeywordGroups.positive.length > 0
    && selectedKeywordGroups.negative.length > 0
    && selectedKeywordGroups.unusual.length > 0
  const canSubmitSelection = hasAllKeywordGroups && personaInput.trim().length >= 2
  const canContinueCurrentQuestion = isWishQuestion
    ? canSubmitSelection
    : currentStepSelectionCount > 0
  const personaKeywords = [
    ...(Array.isArray(personaResult?.keyword_input?.positive_keywords) ? personaResult.keyword_input.positive_keywords : []),
    ...(Array.isArray(personaResult?.keyword_input?.negative_keywords) ? personaResult.keyword_input.negative_keywords : []),
    ...(Array.isArray(personaResult?.keyword_input?.unusual_keywords) ? personaResult.keyword_input.unusual_keywords : []),
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
      <>
        <TutorialDesign
          onCameraStepEnter={handleEnterCameraDesignStep}
          onBeginCamera={handleEnterCameraDesignStep}
        />
        {TEST_MODE_RANDOM_AGENT_SHORTCUT && (
          <button
            type="button"
            className="random-agent-shortcut-hotspot"
            tabIndex={-1}
            aria-label="랜덤 캐릭터 테스트 화면 열기"
            onClick={handleRandomAgentShortcutClick}
          />
        )}
      </>
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
              <video
                ref={rearVideoRef}
                className="tutorial-rear-camera-preview-video"
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
          <p className={`persona-question${isWishQuestion && !personaResult && !isQuestionTransitionLoading ? ' is-wish-question' : ''}`}>
            {personaResult ? (
              '페르소나 분석이 완료되었습니다.'
            ) : isQuestionTransitionLoading ? (
              ''
            ) : isWishQuestion ? (
              <>
                <span>나는 이곳에서 ______ 싶다.</span>
                <span className="persona-question-guide">(최대 2개 선택)</span>
              </>
            ) : (
              personaQuestionText || (personaLoading ? '질문을 준비하고 있습니다...' : '질문을 불러오는 중 문제가 발생했습니다.')
            )}
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
                <section className={`persona-options${isWishQuestion ? '' : ' is-keyword-question'}`} aria-label="선택지">
                  {personaError && <p className="persona-inline-error">{personaError}</p>}

                  {!isWishQuestion && (
                    <div className="persona-keyword-layout">
                      {renderPersonaCategoryTabs()}

                      {selectedKeywordChipOptions.length > 0 && (
                        <div className="persona-selected-strip" aria-label="선택된 키워드">
                          {selectedKeywordChipOptions.map((option) => (
                            <span key={`selected-chip-${option.id}`} className="persona-selected-chip">
                              <small>{option.categoryLabel}</small>
                              {option.label}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="persona-category-panel">
                        <div className="persona-category-panel-head">
                          <strong>{displayQuestion.categoryLabel}</strong>
                          <span>{`${currentStepSelectionCount}/${displayQuestion?.maxSelections || displayQuestion?.max_select || 6}`}</span>
                        </div>
                        <div className="persona-option-grid">
                          {displayOptions.map((option, index) => {
                            const isSelected = selectedOptionIds.includes(option.id)
                            const currentCategorySelectionIds = selectedOptionIds.filter((optionId) => {
                              const selectedOption = optionLabelMap.get(optionId)
                              return selectedOption?.category === displayQuestion?.category
                            })
                            const selectionRank = currentCategorySelectionIds.indexOf(option.id) + 1
                            const isCustom = option.allowsCustom || option.id === 'other_custom'
                            return (
                              <button
                                key={`persona-option-${displayQuestion.turn}-${option.id || index}`}
                                type="button"
                                className={`persona-option ${isSelected ? 'is-selected' : ''} ${isCustom ? 'is-custom' : ''}`}
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
                        </div>
                      </div>
                    </div>
                  )}

                  {isWishQuestion && (
                    <div className="persona-wish-builder" style={{ animationDelay: '0.1s' }}>
                      {renderPersonaCategoryTabs()}
                      <div className="persona-wish-sentence" aria-live="polite">
                        <span className="persona-wish-prefix">나는 이곳에서</span>
                        <span className={`persona-wish-blank${wishBlankText ? ' is-filled' : ''}`}>
                          {wishBlankText}
                        </span>
                        <span className="persona-wish-suffix">싶다</span>
                      </div>
                      <div className="persona-wish-options" aria-label="테라리움 목표 선택">
                        {WISH_GOAL_OPTIONS.map((option, index) => {
                          const isSelected = selectedWishOptionIds.includes(option.id)
                          return (
                            <button
                              key={option.id}
                              type="button"
                              className={`persona-wish-option${isSelected ? ' is-selected' : ''}`}
                              style={{ animationDelay: `${0.1 + index * 0.035}s` }}
                              onClick={() => handleWishGoalOptionClick(option.id)}
                              disabled={personaLoading}
                            >
                              {option.label}
                            </button>
                          )
                        })}
                      </div>
                      <div className="persona-wish-custom-input">
                        <textarea
                          className="persona-custom-editor-textarea"
                          value={personaInput}
                          onChange={handleWishGoalCustomInputChange}
                          placeholder="직접 쓰고 싶은 목표를 적어줘"
                          disabled={personaLoading}
                          rows={2}
                          aria-label="테라리움 목표 직접 입력"
                        />
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>
          </section>

          {!personaResult && displayQuestion && (
            <nav className="persona-bottom-nav">
              {personaKeywordStep > 0 || currentStepSelectionCount > 0 || (isWishQuestion && personaInput.trim()) ? (
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
              {(canContinueCurrentQuestion || isQuestionTransitionLoading) && (
                <button
                  className="nav-btn next-btn is-active"
                  type="button"
                  onClick={handleNextClick}
                  disabled={personaLoading || isQuestionTransitionLoading || !canContinueCurrentQuestion}
                >
                  {isQuestionTransitionLoading ? '분석 중...' : '다음으로'}
                </button>
              )}
            </nav>
          )}

          {isQuestionTransitionLoading && isFinalPersonaQuestion && (
            <div className="persona-analysis-status-layer" aria-live="polite">
              <p className="persona-analysis-status-text">페르소나와 계획 생성 중</p>
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
      let nextPayload = null
      try {
        nextPayload = await createRandomAgent()
      } catch (serverError) {
        console.warn('[random-agent] server random-agent unavailable; using local test fallback:', serverError)
        const agentId = `random-test-${crypto.randomUUID()}`
        const avatarPayload = await buildAvatar({
          agentId,
          appearance: createRandomTestAppearance(),
        })
        nextPayload = {
          agentId,
          nickname: '랜덤 테스트',
          enterUrl: `https://terarium.team-doob.com/profile?agentId=${encodeURIComponent(agentId)}`,
          avatar: {
            modelUrl: avatarPayload.modelUrl,
          },
        }
      }
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
  const [editColorsEnabled, setEditColorsEnabled] = useState(false)
  const [colorInputs, setColorInputs] = useState(AVATAR_EDIT_COLOR_FALLBACKS)
  const [colorOverrides, setColorOverrides] = useState({})
  const [colorViewUrl, setColorViewUrl] = useState('')

  const updateColorViewUrl = useCallback((nextColors) => {
    const params = new URLSearchParams(window.location.search)
    params.set('editColors', '1')
    for (const control of AVATAR_EDIT_COLOR_CONTROLS) {
      const color = normalizeHexColorParam(nextColors?.[control.key])
      if (color) {
        params.set(control.param, color)
      } else {
        params.delete(control.param)
      }
    }
    const nextUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`
    window.history.replaceState(null, '', nextUrl)
    setColorViewUrl(nextUrl)
  }, [])

  const handleAvatarColorChange = useCallback((key, value) => {
    const color = normalizeHexColorParam(value)
    if (!color) return
    setColorInputs((prev) => ({ ...prev, [key]: color }))
    setColorOverrides((prev) => {
      const nextColors = { ...prev, [key]: color }
      updateColorViewUrl(nextColors)
      return nextColors
    })
  }, [updateColorViewUrl])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const agentId = String(params.get('agentId') || '').trim()
    const explicitModelUrl = String(params.get('modelUrl') || '').trim()
    const isColorEditor = params.get('editColors') === '1' || params.get('editColors') === 'true'
    const initialColors = readAvatarColorParams(params)
    setEditColorsEnabled(isColorEditor)
    setColorOverrides(initialColors)
    setColorInputs({ ...AVATAR_EDIT_COLOR_FALLBACKS, ...initialColors })
    if (isColorEditor || hasAvatarColorOverrides(initialColors)) {
      setColorViewUrl(window.location.href)
    }
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
            colorOverrides={hasAvatarColorOverrides(colorOverrides) ? colorOverrides : null}
            onReady={() => {
              setStatus('ready')
              window.__TERARIUM_AVATAR_PROFILE_CAPTURE_READY__ = true
            }}
          />
        </Suspense>
      ) : null}
      {editColorsEnabled ? (
        <section className="avatar-color-editor" aria-label="아바타 색상 편집">
          <div className="avatar-color-editor-title">컬러그램</div>
          <div className="avatar-color-editor-controls">
            {AVATAR_EDIT_COLOR_CONTROLS.map((control) => (
              <label className="avatar-color-control" key={control.key}>
                <span>{control.label}</span>
                <input
                  type="color"
                  value={colorInputs[control.key] || control.fallback}
                  onInput={(event) => handleAvatarColorChange(control.key, event.currentTarget.value)}
                  onChange={(event) => handleAvatarColorChange(control.key, event.target.value)}
                />
              </label>
            ))}
          </div>
          {colorViewUrl ? (
            <a className="avatar-color-editor-link" href={colorViewUrl}>
              색상 적용 URL
            </a>
          ) : null}
        </section>
      ) : null}
      {status !== 'ready' && <span className="avatar-profile-capture-status">{error || status}</span>}
    </main>
  )
}

export default App
