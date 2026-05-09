import { useCallback, useEffect, useRef, useState } from 'react'
import TutorialDesign from './tutorialDesign/TutorialDesign.jsx'
import AvatarThreeViewer from './tutorialDesign/AvatarThreeViewer.jsx'
import './App.css'

const TEST_MODE_SKIP_CAPTURE_ANALYSIS = import.meta.env.VITE_SKIP_CAPTURE_ANALYSIS === 'true'
const TEST_MODE_RELAXED_NICKNAME = import.meta.env.DEV || import.meta.env.VITE_ALLOW_DUPLICATE_NICKNAME === 'true'
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

function App() {
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
  const [selectedOption, setSelectedOption] = useState(null)
  const [selectedAnswerMode, setSelectedAnswerMode] = useState('suggested')
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

          const avatarAppearance = appearanceResult ?? MOCK_APPEARANCE_RESULT
          if (!appearanceResult) {
            setAnalysisResult(avatarAppearance)
          }

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

  const handlePersonaOptionDoubleClick = (option) => {
    if (historyViewIndex !== null || personaLoading || isQuestionTransitionLoading || personaResult) {
      return
    }
    setIsPersonaCustomInputOpen(false)
    setSelectedAnswerMode('suggested')
    setSelectedOption(option)
    setIsQuestionTransitionLoading(true)
    void submitPersonaAnswer(option, 'suggested')
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
            <span className="persona-meta-count">{`${displayQuestion ? displayQuestion.turn : 1}/${PERSONA_TOTAL_TURNS}`}</span>
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
                  {Array.from({ length: 6 }).map((_, index) => (
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
                        onDoubleClick={() => handlePersonaOptionDoubleClick(option)}
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

          {!personaResult && displayQuestion && (
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
                  {isQuestionTransitionLoading ? '분석 중...' : '다음으로'}
                </button>
              )}
            </nav>
          )}

        </section>
    </div>
  )
}

export default App

