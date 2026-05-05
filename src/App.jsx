import { useCallback, useEffect, useRef, useState } from 'react'
import TutorialDesign from './tutorialDesign/TutorialDesign.jsx'
import './App.css'

const TEST_MODE_SKIP_CAPTURE_ANALYSIS = import.meta.env.VITE_SKIP_CAPTURE_ANALYSIS === 'true'
const TEST_MODE_RELAXED_NICKNAME = import.meta.env.DEV || import.meta.env.VITE_ALLOW_DUPLICATE_NICKNAME === 'true'
const PERSONA_TOTAL_TURNS = 6

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

function App() {
  const [stage, setStage] = useState('idle')
  const [countdown, setCountdown] = useState(null)
  const [flashOn, setFlashOn] = useState(false)
  const [showShutterText, setShowShutterText] = useState(false)
  const [, setCameraError] = useState('')
  const [, setAnalysisStatus] = useState('idle')
  const [analysisResult, setAnalysisResult] = useState(null)
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
  const [avatarModelUrl, setAvatarModelUrl] = useState('')
  const [avatarManifestUrl, setAvatarManifestUrl] = useState('')
  const [, setAvatarBuildError] = useState('')
  const [isPersonaCustomInputOpen, setIsPersonaCustomInputOpen] = useState(false)
  const [selectedOption, setSelectedOption] = useState(null)
  const [selectedAnswerMode, setSelectedAnswerMode] = useState('suggested')
  const [answeredHistory, setAnsweredHistory] = useState([])
  const [historyViewIndex, setHistoryViewIndex] = useState(null)
  const [captureLocked, setCaptureLocked] = useState(false)
  const [autoCaptureRequested, setAutoCaptureRequested] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [isQuestionTransitionLoading, setIsQuestionTransitionLoading] = useState(false)
  const [isCaptureProcessing, setIsCaptureProcessing] = useState(false)
  const timeoutIdsRef = useRef([])
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const startInterviewInFlightRef = useRef(false)
  const startInterviewRequestIdRef = useRef(0)
  const syncedAppearanceAgentRef = useRef('')

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
    setAvatarModelUrl('')
    setAvatarManifestUrl('')
    setAvatarBuildError('')
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

  const buildAvatarModel = async ({ agentId, appearance }) => {
    if (!agentId || !appearance) {
      return null
    }

    setAvatarBuildError('')
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
      setAvatarManifestUrl(payload.manifestUrl ?? '')
      return payload
    } catch (error) {
      setAvatarBuildError(error instanceof Error ? error.message : 'Unknown error while building avatar.')
      return null
    }
  }

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
        setCameraError('')
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
        setCameraError('')
      } catch {
        setCameraError('')
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

  const handleStart = (shouldAutoCapture = false) => {
    if (stage !== 'idle') {
      return
    }

    clearTimers()
    resetPersonaSession()
    setCaptureLocked(false)
    setAutoCaptureRequested(Boolean(shouldAutoCapture))
    setCameraReady(false)
    setIsQuestionTransitionLoading(false)
    setIsCaptureProcessing(false)
    setAnalysisStatus('idle')
    setAnalysisResult(null)
    setStage(shouldAutoCapture ? 'cameraDesignCapture' : 'webcam')
  }

  const handleEnterCameraDesignStep = () => {
    if (stage !== 'idle') {
      return
    }

    clearTimers()
    resetPersonaSession()
    setAutoCaptureRequested(false)
    setCaptureLocked(false)
    setCountdown(null)
    setFlashOn(false)
    setShowShutterText(false)
    setCameraReady(false)
    setIsCaptureProcessing(false)
    setAnalysisStatus('idle')
    setAnalysisResult(null)
    setStage('cameraDesignCapture')
  }

  const handleCapture = () => {
    if (!['webcam', 'cameraDesignCapture'].includes(stage) || countdown !== null || flashOn || captureLocked || isCaptureProcessing) {
      return
    }

    setAutoCaptureRequested(false)
    setCaptureLocked(true)
    clearTimers()
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
      setStage('avatarLoading')

      void (async () => {
        let appearanceResult = null
        if (TEST_MODE_SKIP_CAPTURE_ANALYSIS) {
          setAnalysisStatus('success')
          setAnalysisResult(MOCK_APPEARANCE_RESULT)
          appearanceResult = MOCK_APPEARANCE_RESULT
        } else {
          if (!imageDataUrl) {
            setAnalysisStatus('error')
          } else {
            appearanceResult = await analyzePhotoWithOpenAI(imageDataUrl)
          }
        }

        const avatarAppearance = appearanceResult ?? MOCK_APPEARANCE_RESULT
        if (!appearanceResult) {
          setAnalysisResult(avatarAppearance)
        }

        const personaPayload = await startPersonaInterview(avatarAppearance)
        if (personaPayload?.agentId) {
          await buildAvatarModel({
            agentId: personaPayload.agentId,
            appearance: avatarAppearance,
          })
        }
        setIsCaptureProcessing(false)
        setStage('avatarIntro')
      })()
    }, 3000)

    const flashOffTimer = window.setTimeout(() => setFlashOn(false), 3300)
    const shutterOffTimer = window.setTimeout(() => setShowShutterText(false), 3800)

    timeoutIdsRef.current.push(countTwoTimer, countOneTimer, flashTimer, flashOffTimer, shutterOffTimer)
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
  const canSubmitSelection = Boolean(selectedOption)
  const canSubmitNickname = TEST_MODE_RELAXED_NICKNAME
    ? nicknameInput.trim().length > 0
    : /^[A-Za-z0-9가-힣 ]{2,12}$/.test(nicknameInput.trim())
  const qrImageUrl = enterUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(enterUrl)}` : ''
  const isNicknameStage = stage === 'nickname'
  const personaKeywords = [
    personaResult?.personality?.first_impression_style,
    personaResult?.personality?.trust_building_style,
    personaResult?.personality?.decision_bias,
    personaResult?.personality?.stress_response,
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

    const activeAgentId = personaAgentId || (TEST_MODE_RELAXED_NICKNAME ? `test-${Date.now()}` : '')
    if (!activeAgentId) {
      setNicknameError('질문을 준비하고 있습니다. 잠시만 기다려 주세요.')
      return false
    }
    if (!personaAgentId) {
      setPersonaAgentId(activeAgentId)
    }

    setNicknameStatus('checking')
    setNicknameError('')

    const acceptNickname = (payload = {}) => {
      setEnterUrl(payload.enterUrl ?? `https://terarium.team-doob.com/#agentId=${encodeURIComponent(activeAgentId)}`)
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
        setAvatarManifestUrl(avatarPayload.manifestUrl ?? avatarManifestUrl)
      }
      return acceptNickname(payload)
    } catch (error) {
      if (TEST_MODE_RELAXED_NICKNAME) {
        return acceptNickname()
      }
      setNicknameStatus('error')
      setNicknameError(error instanceof Error ? error.message : '닉네임 저장에 실패했습니다.')
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
      <main className="avatar-loading-screen" aria-live="polite">
        <p>loading</p>
      </main>
    )
  }

  if (stage === 'avatarIntro') {
    return (
      <TutorialDesign
        initialId={9}
        avatarUrl={avatarModelUrl}
        externalName={nicknameValue}
        onNameSubmit={(name) => handleNicknameClaim(name, null)}
        onStartQuestions={() => setStage('persona')}
      />
    )
  }

  if (stage === 'finalDesign') {
    return (
      <TutorialDesign
        initialId={14}
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
      className={`start-screen phase-${stage} ${stage !== 'idle' ? 'is-started' : ''} ${flashOn ? 'is-flashing' : ''}`}
      role="application"
      aria-label="테라리움 튜토리얼 시작 화면"
    >
      {stage === 'webcam' && (
        <section className="webcam-stage" aria-label="웹캠 화면">
          <video ref={videoRef} className="webcam-view" autoPlay playsInline muted />
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

                  {!isPersonaCustomInputOpen &&
                    displayOptions.map((option, index) => (
                      <button
                        key={`persona-option-${displayQuestion.turn}-${index}`}
                        type="button"
                        className={`persona-option ${selectedOption === option ? 'is-selected' : selectedOption ? 'is-dimmed' : ''}`}
                        style={{ animationDelay: `${0.1 + index * 0.07}s` }}
                        onClick={() => handlePersonaOptionClick(option)}
                        disabled={personaLoading}
                      >
                        <span className="persona-option-text">{option}</span>
                      </button>
                    ))}

                  {isPersonaCustomInputOpen ? (
                    <div className="persona-custom-editor" style={{ animationDelay: '0.1s' }}>
                      <div className="persona-custom-editor-inner">
                        <textarea
                          className="persona-custom-editor-textarea"
                          value={personaInput}
                          onChange={(e) => setPersonaInput(e.target.value)}
                          placeholder="직접 입력하세요. (3글자 이상)"
                          disabled={personaLoading}
                        />
                      </div>
                    </div>
                  ) : (
                    <button
                      className={`persona-custom-trigger ${selectedOption ? 'is-dimmed' : ''}`}
                      type="button"
                      style={{ animationDelay: '0.38s' }}
                      onClick={() => {
                        setIsPersonaCustomInputOpen(true)
                        setSelectedOption(null)
                        setSelectedAnswerMode('suggested')
                      }}
                      disabled={personaLoading}
                    >
                      직접 입력하기
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

