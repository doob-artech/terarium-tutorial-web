import { useCallback, useEffect, useRef, useState } from 'react'
import mascotSvg from './assets/image-10.svg'
import cameraButtonSvg from './assets/camera-button.svg'
import emojiVSvg from './assets/emoji-v.svg'
import speechBubbleSvg from './assets/speech-bubble.svg'
import { TUTORIAL_DATA } from './data'
import { CHARACTER_PRESETS } from './tutorialAssets'
import doobCloseUpVideo from './assets/DoobCloseUp.mp4'
import viewAllVideo from './assets/viewAll.mp4'
import characterBackground from './assets/character.jpg'
import './App.css'

const TEST_MODE_SKIP_CAPTURE_ANALYSIS = import.meta.env.VITE_SKIP_CAPTURE_ANALYSIS === 'true'
const PERSONA_TOTAL_TURNS = 8

const MOCK_APPEARANCE_RESULT = {
  hair_style: 'short_cut',
  hair_part_direction: 'center',
  bangs_type: 'none',
  hair_color: 'black',
  eye_type: 'round_dog_eyes',
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

const SPECTRUM_OPTION_ORDER = {
  first_meeting_style: ['minimal', 'waits', 'reads_mood', 'caretaking', 'light_joke', 'initiates'],
  conversation_role: ['reflective', 'listener', 'reactor', 'questioner', 'mood_keeper', 'storyteller'],
  disagreement_style: ['move_on', 'step_back', 'soften', 'listen_first', 'mediate', 'direct'],
  care_style: ['wait_until_ready', 'quiet_presence', 'cheer_up', 'ask_directly', 'practical_help', 'problem_solve'],
  trust_basis: ['comfort', 'frequency', 'shared_interest', 'humor', 'reliability', 'honesty'],
  boundary_style: ['hides_need', 'reduce_contact', 'quietly_leave', 'polite_response', 'self_recharge', 'direct_boundary'],
  group_role: ['quiet_observer', 'deep_pair', 'organizer', 'includer', 'entertainer', 'leader'],
  repair_style: ['give_space', 'wait_then_repair', 'practical_repair', 'humor_repair', 'talk_it_through', 'initiates_repair'],
  silence_style: ['comfortable_silence', 'shifts_attention', 'soft_reaction', 'checks_comfort', 'asks_question', 'fills_silence'],
  closeness_pace: ['slow_closeness', 'responds_to_approach', 'gradual_frequency', 'shared_activity', 'deep_talk', 'fast_if_matched'],
  humor_style: ['subtle_smile', 'dry_gentle_humor', 'laughs_along', 'quirky', 'brightens_mood', 'starts_play'],
  collaboration_style: ['quiet_worker', 'checks_others', 'divides_roles', 'organizes_flow', 'problem_solver', 'idea_giver'],
  social_amplification: ['faithful', 'calmer', 'warmer', 'braver', 'more_playful', 'more_direct'],
}

const getOptionValue = (option) => (typeof option === 'object' ? option.value : option)
const getOptionLabel = (option) => (typeof option === 'object' ? option.label : option)

const orderSpectrumOptions = (question, options) => {
  const values = SPECTRUM_OPTION_ORDER[question?.key || question?.question_type] || []
  if (!values.length) return options
  const optionByValue = new Map(options.map((option) => [getOptionValue(option), option]))
  const ordered = values.map((value) => optionByValue.get(value)).filter(Boolean)
  const leftovers = options.filter((option) => !values.includes(getOptionValue(option)))
  return [...ordered, ...leftovers]
}

const TUTORIAL_SKY_BACKGROUND = 'linear-gradient(180deg, #9FD1FC 0%, #FFF 100%)'
const TUTORIAL_ANSWER_BACKGROUNDS = {
  3: { label: 'YES', background: 'linear-gradient(0deg, #FFF 0%, #5D9CEC 73.08%)' },
  4: { label: 'NO', background: 'linear-gradient(0deg, #FFF 0%, #FF8C5A 73.08%)' },
}
const TUTORIAL_SKY_STEPS = new Set([9, 10, 11, 12, 13])
const TUTORIAL_BACKGROUND_VIDEOS = {
  1: { src: doobCloseUpVideo, loop: false },
  2: { src: doobCloseUpVideo, loop: false },
  5: { src: viewAllVideo, loop: false },
}
const TUTORIAL_STEP_CHARACTERS = {
  3: 'responseGuide',
  4: 'responseGuide',
  9: 'avatar',
  10: 'avatarSmall',
  11: 'avatarResult',
}

function TutorialPrelude({ onBeginCapture }) {
  const [currentId, setCurrentId] = useState(0)
  const [userName, setUserName] = useState('')
  const step = TUTORIAL_DATA.find((item) => item.id === currentId) || TUTORIAL_DATA[0]
  const backgroundVideo = TUTORIAL_BACKGROUND_VIDEOS[currentId]
  const answerBackground = TUTORIAL_ANSWER_BACKGROUNDS[currentId]
  const currentBackground =
    step.background ||
    answerBackground?.background ||
    (TUTORIAL_SKY_STEPS.has(currentId) ? TUTORIAL_SKY_BACKGROUND : null)
  const characterKey = step.character || TUTORIAL_STEP_CHARACTERS[currentId] || (currentId >= 5 && currentId !== 12 ? 'bubbleGuide' : null)
  const character = characterKey ? CHARACTER_PRESETS[characterKey] : null
  const text = Array.isArray(step.textList) ? step.textList.join('\n\n') : (step.textList || step.text || '')
  const formattedText = String(text).replace(/{{name}}/g, userName || '이름 없음')

  const goNext = (nextId) => {
    if (nextId === 'START_QUESTION' || step.type === 'CAMERA') {
      onBeginCapture()
      return
    }
    if (nextId === 'FINISH_ALL') {
      setCurrentId(0)
      setUserName('')
      return
    }
    setCurrentId(nextId)
  }

  if (step.type === 'INTRO') {
    return (
      <div id="tutorial-container" className="tutorial-prelude">
        <div className="tutorial-layer-bg">
          <video className="tutorial-bg-video" autoPlay muted loop playsInline>
            <source src={doobCloseUpVideo} type="video/mp4" />
          </video>
          <div className="tutorial-intro-overlay" />
        </div>
        <main className="tutorial-ui-root tutorial-intro-content">
          <h1 className="tutorial-intro-title">TERARIUM</h1>
          <p className="tutorial-intro-subtitle">{formattedText}</p>
          <button className="tutorial-start-btn" type="button" onClick={() => goNext(step.nextId)}>
            {step.buttonText || '시작'}
          </button>
        </main>
      </div>
    )
  }

  return (
    <div id="tutorial-container" className="tutorial-prelude">
      <div
        className="tutorial-layer-bg"
        style={currentBackground ? { background: currentBackground } : { backgroundImage: `url(${characterBackground})` }}
      >
        {backgroundVideo && (
          <video key={backgroundVideo.src} className="tutorial-bg-video" autoPlay muted loop={backgroundVideo.loop} playsInline>
            <source src={backgroundVideo.src} type="video/mp4" />
          </video>
        )}
        {answerBackground?.label && <span className="tutorial-answer-bg-text">{answerBackground.label}</span>}
      </div>
      {character && (
        <img className={`tutorial-character ${character.layerClass || ''}`} src={character.src} alt={character.alt || ''} style={character.style} />
      )}
      <main className="tutorial-ui-root">
        <section className={`tutorial-card step-${currentId}`}>
          <p className="tutorial-card-text">{formattedText}</p>
          {step.type === 'SELECT' && (
            <div className="tutorial-select-grid">
              {step.options.map((option) => (
                <button key={option.label} className="tutorial-select-btn" type="button" onClick={() => goNext(option.nextId)}>
                  <strong>{option.label}</strong>
                  <span>{option.subText}</span>
                </button>
              ))}
            </div>
          )}
          {step.type === 'INPUT' && (
            <div className="tutorial-name-row">
              <label>{step.questionText}</label>
              <input value={userName} placeholder={step.placeholder} onChange={(event) => setUserName(event.target.value)} />
            </div>
          )}
          {step.type === 'AUTO_STACK' && (
            <div className="tutorial-stack-list">
              {step.stackList.map((item, index) => <span key={`${item.text}-${index}`}>{item.text}</span>)}
            </div>
          )}
          {step.type !== 'SELECT' && (
            <button
              className="tutorial-next-btn"
              type="button"
              onClick={() => goNext(step.nextId)}
              disabled={step.type === 'INPUT' && userName.trim().length < 2}
            >
              {step.type === 'CAMERA' ? '촬영하러 가기' : step.buttonText || '다음'}
            </button>
          )}
        </section>
      </main>
    </div>
  )
}

function App() {
  const [stage, setStage] = useState('tutorial')
  const [countdown, setCountdown] = useState(null)
  const [flashOn, setFlashOn] = useState(false)
  const [showShutterText, setShowShutterText] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [analysisStatus, setAnalysisStatus] = useState('idle')
  const [analysisResult, setAnalysisResult] = useState(null)
  const [bubbleVisible, setBubbleVisible] = useState(true)
  const [personaAgentId, setPersonaAgentId] = useState('')
  const [personaQuestion, setPersonaQuestion] = useState(null)
  const [personaLoading, setPersonaLoading] = useState(false)
  const [personaError, setPersonaError] = useState('')
  const [personaInput, setPersonaInput] = useState('')
  const [personaResult, setPersonaResult] = useState(null)
  const [nicknameInput, setNicknameInput] = useState('')
  const [nicknameError, setNicknameError] = useState('')
  const [nicknameStatus, setNicknameStatus] = useState('idle')
  const [nicknameValue, setNicknameValue] = useState('')
  const [enterUrl, setEnterUrl] = useState('')
  const [isPersonaCustomInputOpen, setIsPersonaCustomInputOpen] = useState(false)
  const [selectedOption, setSelectedOption] = useState(null)
  const [selectedAnswerMode, setSelectedAnswerMode] = useState('suggested')
  const [answeredHistory, setAnsweredHistory] = useState([])
  const [historyViewIndex, setHistoryViewIndex] = useState(null)
  const [captureLocked, setCaptureLocked] = useState(false)
  const [isQuestionTransitionLoading, setIsQuestionTransitionLoading] = useState(false)
  const [isCaptureProcessing, setIsCaptureProcessing] = useState(false)
  const timeoutIdsRef = useRef([])
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const startInterviewInFlightRef = useRef(false)
  const startInterviewRequestIdRef = useRef(0)
  const syncedAppearanceAgentRef = useRef('')

  const bubbleText =
    isCaptureProcessing
      ? '분석과 질문을 준비하고 있습니다...'
      : analysisStatus === 'analyzing'
        ? '분석 중입니다...'
        : analysisStatus === 'success'
          ? '분석 완료!'
          : '준비되면 가운데 카메라 버튼을 눌러주세요.'

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
    syncedAppearanceAgentRef.current = ''
    setPersonaAgentId('')
    setPersonaQuestion(null)
    setPersonaLoading(false)
    setPersonaError('')
    setPersonaInput('')
    setPersonaResult(null)
    setNicknameInput('')
    setNicknameError('')
    setNicknameStatus('idle')
    setNicknameValue('')
    setEnterUrl('')
    setAnsweredHistory([])
    setHistoryViewIndex(null)
    setSelectedAnswerMode('suggested')
    setSelectedOption(null)
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

  const analyzePhotoWithOpenAI = async (imageDataUrl) => {
    setAnalysisStatus('analyzing')

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
      setAnalysisStatus('success')
      return payload.result
    } catch {
      setAnalysisStatus('error')
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
      setSelectedOption(null)
      setSelectedAnswerMode('suggested')
      setAnsweredHistory([])
      setHistoryViewIndex(null)
      return true
    } catch (error) {
      if (requestId === startInterviewRequestIdRef.current) {
        setPersonaError(error instanceof Error ? error.message : 'Unknown error while starting persona interview.')
      }
      return false
    } finally {
      if (requestId === startInterviewRequestIdRef.current) {
        setPersonaLoading(false)
      }
      startInterviewInFlightRef.current = false
    }
  }, [analysisResult])

  useEffect(() => {
    return () => {
      clearTimers()
      stopCamera()
    }
  }, [])

  useEffect(() => {
    if (stage !== 'webcam') {
      return
    }

    setBubbleVisible(true)

    let canceled = false

    const startCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('??釉뚮씪?곗??먯꽌???뱀틺??吏?먰븯吏 ?딆뒿?덈떎.')
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
        }
        setCameraError('')
      } catch {
        setCameraError('?뱀틺 沅뚰븳???덉슜?댁＜?몄슂.')
      }
    }

    startCamera()

    return () => {
      canceled = true
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

  const handleStart = () => {
    if (!['idle', 'tutorial'].includes(stage)) {
      return
    }

    clearTimers()
    resetPersonaSession()
    setCaptureLocked(false)
    setIsQuestionTransitionLoading(false)
    setIsCaptureProcessing(false)
    setAnalysisStatus('idle')
    setAnalysisResult(null)
    setStage('expanding')

    const expandTimer = window.setTimeout(() => {
      setStage('webcam')
    }, 800)

    timeoutIdsRef.current.push(expandTimer)
  }

  const handleCapture = () => {
    if (stage !== 'webcam' || countdown !== null || flashOn || captureLocked || isCaptureProcessing) {
      return
    }

    setCaptureLocked(true)
    clearTimers()
    setBubbleVisible(false)
    setShowShutterText(false)
    setCountdown(3)

    const countTwoTimer = window.setTimeout(() => setCountdown(2), 1000)
    const countOneTimer = window.setTimeout(() => setCountdown(1), 2000)

    const flashTimer = window.setTimeout(() => {
      const imageDataUrl = captureCurrentFrame()

      setCountdown(null)
      setFlashOn(true)
      setShowShutterText(true)
      setIsCaptureProcessing(true)
      setStage('nickname')

      void (async () => {
        void startPersonaInterview()

        if (TEST_MODE_SKIP_CAPTURE_ANALYSIS) {
          setAnalysisStatus('success')
          setAnalysisResult(MOCK_APPEARANCE_RESULT)
        } else {
          if (!imageDataUrl) {
            setAnalysisStatus('error')
          } else {
            await analyzePhotoWithOpenAI(imageDataUrl)
          }
        }

        setIsCaptureProcessing(false)
      })()
    }, 3000)

    const flashOffTimer = window.setTimeout(() => setFlashOn(false), 3300)
    const shutterOffTimer = window.setTimeout(() => setShowShutterText(false), 3800)

    timeoutIdsRef.current.push(countTwoTimer, countOneTimer, flashTimer, flashOffTimer, shutterOffTimer)
  }

  const submitPersonaAnswer = async (answerText, answerMode = 'suggested') => {
    if (!personaQuestion || !personaAgentId || personaResult || personaLoading) {
      return
    }

    const trimmedInput = typeof answerText === 'string' ? answerText.trim() : ''
    if (!trimmedInput) {
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
          answer: trimmedInput,
          answerMode,
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
              answerText: trimmedInput,
              answerMode,
            },
          ])
        }
        setPersonaResult(payload.result ?? null)
        if (payload.enterUrl) {
          setEnterUrl(payload.enterUrl)
        }
        setPersonaQuestion(null)
        setIsQuestionTransitionLoading(false)
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
            answerText: trimmedInput,
            answerMode,
          },
        ])
      }

      setPersonaQuestion(payload.question)
      setSelectedOption(null)
      setSelectedAnswerMode('suggested')
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

    setIsPersonaCustomInputOpen(false)
    setSelectedAnswerMode('suggested')
    if (selectedOption === option) {
      setSelectedOption(null)
    } else {
      setSelectedOption(option)
    }
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

    if (isPersonaCustomInputOpen && personaInput.trim().length >= 3) {
      setIsQuestionTransitionLoading(true)
      void submitPersonaAnswer(personaInput.trim(), 'custom')
      return
    }

    if (selectedOption) {
      setIsQuestionTransitionLoading(true)
      void submitPersonaAnswer(selectedOption, selectedAnswerMode)
    }
  }

  const resetCurrentSelection = () => {
    setSelectedOption(null)
    setSelectedAnswerMode('suggested')
    setIsPersonaCustomInputOpen(false)
    setPersonaInput('')
  }

  const openCustomInput = () => {
    if (personaLoading || isQuestionTransitionLoading) {
      return
    }
    setSelectedOption(null)
    setSelectedAnswerMode('custom')
    setIsPersonaCustomInputOpen(true)
    setPersonaError('')
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

    if (selectedOption || isPersonaCustomInputOpen || personaInput.trim()) {
      resetCurrentSelection()
    }
  }

  const currentQuestion = personaQuestion
  const viewingHistoryEntry = historyViewIndex !== null ? answeredHistory[historyViewIndex] ?? null : null
  const displayQuestion = viewingHistoryEntry?.question ?? currentQuestion
  const personaQuestionText = displayQuestion?.question ?? ''
  const personaTurnKey = personaResult ? 'persona-result' : `persona-turn-${displayQuestion?.turn ?? 0}`
  const isViewingHistory = historyViewIndex !== null
  const canSubmitCustomInput = isPersonaCustomInputOpen && personaInput.trim().length >= 3
  const displayOptions = Array.isArray(displayQuestion?.options) ? displayQuestion.options : []
  const spectrumOptions = orderSpectrumOptions(displayQuestion, displayOptions)
  const fallbackSpectrumIndex = Math.max(0, Math.floor((spectrumOptions.length - 1) / 2))
  const selectedSpectrumIndex = Math.max(
    0,
    spectrumOptions.findIndex((option) => getOptionValue(option) === selectedOption),
  )
  const activeSpectrumIndex = selectedOption ? selectedSpectrumIndex : fallbackSpectrumIndex
  const activeSpectrumOption = selectedOption ? spectrumOptions[activeSpectrumIndex] : null
  const canSubmitSelection = Boolean(selectedOption)
  const canSubmitNickname = /^[A-Za-z0-9가-힣 ]{2,12}$/.test(nicknameInput.trim())
  const qrImageUrl = enterUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(enterUrl)}` : ''
  const isNicknameStage = stage === 'nickname'

  const handleNicknameClaim = async () => {
    if (!canSubmitNickname || nicknameStatus === 'checking' || nicknameStatus === 'success') {
      return
    }

    if (!personaAgentId) {
      setNicknameError('吏덈Ц??以鍮꾪븯怨??덉뒿?덈떎. ?좎떆留?湲곕떎??二쇱꽭??')
      return
    }

    setNicknameStatus('checking')
    setNicknameError('')

    try {
      const response = await fetch('/api/nickname/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: personaAgentId,
          nickname: nicknameInput.trim(),
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error ?? '?됰꽕????μ뿉 ?ㅽ뙣?덉뒿?덈떎.')
      }

      setEnterUrl(payload.enterUrl ?? '')
      setNicknameValue(nicknameInput.trim())
      setNicknameStatus('success')
      setStage('persona')
    } catch (error) {
      setNicknameStatus('error')
      setNicknameError(error instanceof Error ? error.message : '?됰꽕????μ뿉 ?ㅽ뙣?덉뒿?덈떎.')
    }
  }

  if (stage === 'tutorial') {
    return <TutorialPrelude onBeginCapture={handleStart} />
  }

  return (
    <div
      className={`start-screen phase-${stage} ${stage !== 'idle' ? 'is-started' : ''} ${flashOn ? 'is-flashing' : ''}`}
      role="application"
      aria-label="테라리움 튜토리얼 시작 화면"
    >
      <img className="mascot" src={mascotSvg} alt="테라리움 캐릭터" />

      <main className="start-panel">
        <div className="panel-content">
          <h1 className="brand-title">TERARIUM</h1>

          <button className="start-button" type="button" aria-label="튜토리얼 시작" onClick={handleStart}>
            시작
          </button>

          <p className="description">튜토리얼을 시작하려면 시작 버튼을 눌러주세요.</p>
        </div>
      </main>

      {stage === 'webcam' && (
        <section className="webcam-stage" aria-label="웹캠 화면">
          {!cameraError ? (
            <video ref={videoRef} className="webcam-view" autoPlay playsInline muted />
          ) : (
            <div className="webcam-fallback">{cameraError}</div>
          )}

          <div className="webcam-ui">
            {bubbleVisible && (
              <div className="speech-bubble-wrap" aria-live="polite">
                <img className="speech-bubble-bg" src={speechBubbleSvg} alt="" aria-hidden="true" />
                <p className="speech-bubble-text">{bubbleText}</p>
              </div>
            )}
            <img className="emoji-badge" src={emojiVSvg} alt="" aria-hidden="true" />

            <div className="capture-panel">
              <button
                className={`capture-button ${captureLocked ? 'is-locked' : ''}`}
                type="button"
                onClick={handleCapture}
                aria-label="촬영 시작"
                disabled={captureLocked || isCaptureProcessing}
              >
                <img src={cameraButtonSvg} alt="" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      )}

      {(stage === 'nickname' || stage === 'persona') && (
        <section className="persona-stage" aria-label="페르소나 인터뷰 화면">
          <div className="persona-brand-bg">TERARiUM</div>

          <header className="persona-header">
            <div className="persona-question-meta">
              <span className="persona-meta-label">{isNicknameStage ? 'Profile' : 'Question'}</span>
              <span className="persona-meta-count">{isNicknameStage ? '이름' : `${displayQuestion ? displayQuestion.turn : 1}/${PERSONA_TOTAL_TURNS}`}</span>
            </div>
            <p className="persona-question">
              {isNicknameStage
                ? '프로필에 사용할 이름을 정해주세요.'
                : personaResult
                ? '페르소나 분석이 완료되었습니다.'
                : isQuestionTransitionLoading
                  ? ''
                : personaQuestionText || (personaLoading ? '질문을 준비하고 있습니다...' : '질문을 불러오는 중 문제가 발생했습니다.')}
            </p>
            {!isNicknameStage && isQuestionTransitionLoading && <div className="persona-question-loading" aria-hidden="true" />}
            <img className="persona-header-emoji" src={emojiVSvg} alt="" aria-hidden="true" />
          </header>

          <section className="persona-board" aria-live="polite">
            <div key={personaTurnKey} className="persona-turn-block">

              {isNicknameStage ? (
                <article className="persona-result-card">
                  <div className="nickname-card">
                    <input
                      className="nickname-input"
                      type="text"
                      inputMode="text"
                      autoComplete="off"
                      placeholder="이름"
                      value={nicknameInput}
                      onChange={(event) => {
                        setNicknameInput(event.target.value)
                        setNicknameError('')
                        setNicknameStatus('idle')
                      }}
                      disabled={nicknameStatus === 'checking'}
                    />
                    {nicknameError && <p className="nickname-error">{nicknameError}</p>}
                    <button
                      className="nickname-submit-btn"
                      type="button"
                      onClick={() => void handleNicknameClaim()}
                      disabled={!canSubmitNickname || nicknameStatus === 'checking'}
                    >
                      {nicknameStatus === 'checking' ? '이름 확인 중...' : personaLoading ? '질문 준비 중...' : '다음으로'}
                    </button>
                  </div>
                </article>
              ) : personaResult ? (
                <article className="persona-result-card">
                  <div className="nickname-card">
                    {enterUrl ? (
                      <div className="nickname-qr-wrap">
                        <p className="nickname-card-title">{nicknameValue || nicknameInput.trim()}님의 개인 입장 QR입니다.</p>
                        <p className="nickname-card-copy">모바일로 스캔하면 로그인된 상태로 테라리움에 들어갑니다.</p>
                        <img className="nickname-qr-image" src={qrImageUrl} alt="개인 입장 QR 코드" />
                        <a className="nickname-link" href={enterUrl} target="_blank" rel="noreferrer">
                          {enterUrl}
                        </a>
                      </div>
                    ) : (
                      <p className="nickname-card-copy">링크를 준비하고 있습니다.</p>
                    )}
                  </div>
                </article>
              ) : !displayQuestion ? (
                <article className="persona-status-card">
                  <p className="persona-status-text">
                    {personaLoading ? '다음 질문을 준비하고 있습니다...' : personaError || '질문을 다시 불러와 주세요.'}
                  </p>
                  {!personaLoading && (
                    <button className="persona-retry-button" type="button" onClick={() => void startPersonaInterview()}>
                      다시 생성
                    </button>
                  )}
                </article>
              ) : isQuestionTransitionLoading ? (
                <section className="persona-options" aria-label="다음 질문 생성 중">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`persona-option-skeleton-${index}`}
                      className="persona-option-skeleton"
                      style={{ animationDelay: `${index * 0.08}s` }}
                    />
                  ))}
                  <div className="persona-custom-skeleton" />
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

                  {!isPersonaCustomInputOpen && spectrumOptions.length > 0 && (
                    <article className={`persona-spectrum ${selectedOption ? 'has-selection' : ''}`}>
                      <p className="persona-spectrum-current">
                        {activeSpectrumOption ? getOptionLabel(activeSpectrumOption) : '슬라이더를 움직여 선택해 주세요'}
                      </p>
                      <input
                        className="persona-spectrum-slider"
                        type="range"
                        min="0"
                        max={Math.max(0, spectrumOptions.length - 1)}
                        step="1"
                        value={activeSpectrumIndex}
                        onChange={(event) => {
                          const nextOption = spectrumOptions[Number(event.target.value)]
                          if (nextOption) {
                            handlePersonaOptionClick(getOptionValue(nextOption))
                          }
                        }}
                        disabled={personaLoading}
                        aria-label="답변 스펙트럼"
                      />
                      <div className="persona-spectrum-ticks" aria-hidden="true">
                        {spectrumOptions.map((option, index) => (
                          <span
                            key={`persona-spectrum-tick-${displayQuestion.turn}-${getOptionValue(option)}`}
                            className={activeSpectrumIndex === index && selectedOption ? 'is-active' : ''}
                          />
                        ))}
                      </div>
                      <div className="persona-spectrum-labels">
                        {spectrumOptions.map((option, index) => (
                          <button
                            key={`persona-spectrum-label-${displayQuestion.turn}-${getOptionValue(option)}`}
                            type="button"
                            className={`persona-spectrum-label ${activeSpectrumIndex === index && selectedOption ? 'is-active' : ''}`}
                            onClick={() => handlePersonaOptionClick(getOptionValue(option))}
                            disabled={personaLoading}
                          >
                            {getOptionLabel(option)}
                          </button>
                        ))}
                      </div>
                    </article>
                  )}

                  {isPersonaCustomInputOpen ? (
                    <div className="persona-custom-editor">
                      <div className="persona-custom-editor-inner">
                        <textarea
                          className="persona-custom-editor-textarea"
                          value={personaInput}
                          placeholder="선택지에 딱 맞지 않으면, 당신의 방식으로 짧게 적어주세요."
                          maxLength={180}
                          onChange={(event) => {
                            setPersonaInput(event.target.value)
                            setPersonaError('')
                          }}
                          disabled={personaLoading}
                          autoFocus
                        />
                        <div className="persona-custom-editor-actions">
                          <button
                            className="persona-custom-action-btn btn-cancel"
                            type="button"
                            onClick={resetCurrentSelection}
                            disabled={personaLoading}
                          >
                            취소
                          </button>
                          <button
                            className="persona-custom-action-btn btn-confirm"
                            type="button"
                            onClick={handleNextClick}
                            disabled={!canSubmitCustomInput || personaLoading}
                          >
                            입력 완료
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      className={`persona-custom-trigger ${selectedOption ? 'is-dimmed' : ''}`}
                      type="button"
                      style={{ animationDelay: '0.38s' }}
                      onClick={openCustomInput}
                      disabled={personaLoading}
                    >
                      직접 입력
                    </button>
                  )}
                </section>
              )}
            </div>
          </section>

          {!isNicknameStage && !personaResult && displayQuestion && (
            <nav className="persona-bottom-nav">
              {isViewingHistory || answeredHistory.length > 0 || selectedOption || isPersonaCustomInputOpen || personaInput.trim() ? (
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
              {(canSubmitSelection || canSubmitCustomInput || isQuestionTransitionLoading || isViewingHistory) && (
                <button
                  className="nav-btn next-btn is-active"
                  type="button"
                  onClick={handleNextClick}
                  disabled={personaLoading || isQuestionTransitionLoading || (!canSubmitSelection && !canSubmitCustomInput && !isViewingHistory)}
                >
                  {isQuestionTransitionLoading ? '다음 질문 생성 중...' : '다음으로'}
                </button>
              )}
            </nav>
          )}

        </section>
      )}

      {stage === 'webcam' && countdown !== null && (
        <section className="countdown-overlay" aria-live="polite">
          <p className="countdown-text">{countdown}</p>
        </section>
      )}

      {stage === 'webcam' && showShutterText && <p className="shutter-text">찰칵!</p>}

      {stage === 'webcam' && flashOn && <div className="flash-overlay" aria-hidden="true" />}

      {stage === 'webcam' && isCaptureProcessing && (
        <section className="capture-processing-overlay" aria-live="polite">
          <div className="capture-processing-pill">
            <span className="capture-processing-dot" />
            <p className="capture-processing-text">분석과 질문 생성 중...</p>
          </div>
        </section>
      )}
    </div>
  )
}

export default App

