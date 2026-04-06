import { useCallback, useEffect, useRef, useState } from 'react'
import mascotSvg from './assets/image-10.svg'
import cameraButtonSvg from './assets/camera-button.svg'
import emojiVSvg from './assets/emoji-v.svg'
import speechBubbleSvg from './assets/speech-bubble.svg'
import './App.css'

const TEST_MODE_SKIP_CAPTURE_ANALYSIS = true

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
  const [cameraError, setCameraError] = useState('')
  const [analysisStatus, setAnalysisStatus] = useState('idle')
  const [analysisResult, setAnalysisResult] = useState(null)
  const [analysisError, setAnalysisError] = useState('')
  const [bubbleVisible, setBubbleVisible] = useState(true)
  const [personaSessionId, setPersonaSessionId] = useState('')
  const [personaQuestion, setPersonaQuestion] = useState(null)
  const [personaLoading, setPersonaLoading] = useState(false)
  const [personaError, setPersonaError] = useState('')
  const [personaInput, setPersonaInput] = useState('')
  const [personaResult, setPersonaResult] = useState(null)
  const timeoutIdsRef = useRef([])
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const bubbleText =
    analysisStatus === 'analyzing' ? '분석 중...' : analysisStatus === 'success' ? '분석 완료!' : '준비되면 가운데 카메라 버튼을 눌러주세요'

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
    setPersonaSessionId('')
    setPersonaQuestion(null)
    setPersonaLoading(false)
    setPersonaError('')
    setPersonaInput('')
    setPersonaResult(null)
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
    setAnalysisError('')

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
      setAnalysisError('')
      console.log('Appearance JSON:', payload.result)
    } catch (error) {
      setAnalysisStatus('error')
      setAnalysisResult(null)
      setAnalysisError(error instanceof Error ? error.message : 'Unknown error during analysis.')
    }
  }

  const startPersonaInterview = useCallback(async () => {
    setPersonaLoading(true)
    setPersonaError('')

    try {
      const response = await fetch('/api/persona/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appearance: analysisResult ?? MOCK_APPEARANCE_RESULT,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Persona start request failed.')
      }

      if (!payload?.sessionId || !payload?.question) {
        throw new Error('Server returned an invalid persona start response.')
      }

      setPersonaSessionId(payload.sessionId)
      setPersonaQuestion(payload.question)
      setPersonaResult(null)
      setPersonaInput('')
      setPersonaError('')
    } catch (error) {
      setPersonaError(error instanceof Error ? error.message : 'Unknown error while starting persona interview.')
    } finally {
      setPersonaLoading(false)
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
        setCameraError('이 브라우저에서는 웹캠을 지원하지 않습니다.')
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
        setCameraError('웹캠 권한을 허용해주세요.')
      }
    }

    startCamera()

    return () => {
      canceled = true
      stopCamera()
    }
  }, [stage])

  useEffect(() => {
    if (stage !== 'persona' || personaQuestion || personaSessionId || personaResult || personaLoading || personaError) {
      return
    }

    void startPersonaInterview()
  }, [stage, personaQuestion, personaSessionId, personaResult, personaLoading, personaError, startPersonaInterview])

  const handleStart = () => {
    if (stage !== 'idle') {
      return
    }

    clearTimers()
    resetPersonaSession()
    setAnalysisStatus('idle')
    setAnalysisResult(null)
    setAnalysisError('')
    setStage('expanding')

    const expandTimer = window.setTimeout(() => {
      setStage('webcam')
    }, 800)

    timeoutIdsRef.current.push(expandTimer)
  }

  const handleCapture = () => {
    if (stage !== 'webcam' || countdown !== null || flashOn) {
      return
    }

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

      if (TEST_MODE_SKIP_CAPTURE_ANALYSIS) {
        setAnalysisStatus('success')
        setAnalysisResult(MOCK_APPEARANCE_RESULT)
        setAnalysisError('')
      } else {
        if (!imageDataUrl) {
          setAnalysisStatus('error')
          setAnalysisError('Camera frame capture failed. Try again.')
          return
        }

        void analyzePhotoWithOpenAI(imageDataUrl)
      }

      const personaStageTimer = window.setTimeout(() => setStage('persona'), 850)
      timeoutIdsRef.current.push(personaStageTimer)
    }, 3000)

    const flashOffTimer = window.setTimeout(() => setFlashOn(false), 3300)
    const shutterOffTimer = window.setTimeout(() => setShowShutterText(false), 3800)

    timeoutIdsRef.current.push(countTwoTimer, countOneTimer, flashTimer, flashOffTimer, shutterOffTimer)
  }

  const submitPersonaAnswer = async (answerText, answerMode = 'suggested') => {
    if (!personaQuestion || !personaSessionId || personaResult || personaLoading) {
      return
    }

    const trimmedInput = typeof answerText === 'string' ? answerText.trim() : ''
    if (!trimmedInput) {
      return
    }

    setPersonaLoading(true)
    setPersonaError('')

    try {
      const response = await fetch('/api/persona/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: personaSessionId,
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
        setPersonaResult(payload.result ?? null)
        setPersonaQuestion(null)
        return
      }

      if (!payload?.question) {
        throw new Error('Server returned an invalid next-question response.')
      }

      setPersonaQuestion(payload.question)
    } catch (error) {
      setPersonaError(error instanceof Error ? error.message : 'Unknown error while processing persona answer.')
    } finally {
      setPersonaLoading(false)
    }
  }

  const handlePersonaOptionClick = (option) => {
    void submitPersonaAnswer(option, 'suggested')
  }

  const handlePersonaInputChange = (event) => {
    setPersonaInput(event.target.value)
  }

  const handlePersonaSubmit = (event) => {
    event.preventDefault()
    void submitPersonaAnswer(personaInput, 'custom')
  }

  const currentQuestion = personaQuestion
  const personaQuestionText = personaQuestion?.question ?? ''
  const personaTurnKey = personaResult ? 'persona-result' : `persona-turn-${personaQuestion?.turn ?? 0}`

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

          <p className="description">튜토리얼을 시청하려면 시작버튼을 클릭해주세요</p>
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
              <button className="capture-button" type="button" onClick={handleCapture} aria-label="촬영 카운트 시작">
                <img src={cameraButtonSvg} alt="" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      )}

      {stage === 'persona' && (
        <section className="persona-stage" aria-label="페르소나 인터뷰 화면">
          <header className="persona-top">
            <img className="persona-emoji-top" src={emojiVSvg} alt="" aria-hidden="true" />
            <p className="persona-brand">TERARIUM</p>
          </header>

          <section className="persona-board" aria-live="polite">
            <div key={personaTurnKey} className="persona-turn-block">
              <p className="persona-question">
                {personaResult
                  ? '페르소나 분석이 완료되었습니다.'
                  : personaQuestionText || (personaLoading ? '질문을 생성하고 있습니다...' : '질문을 불러오는 중 문제가 발생했습니다.')}
              </p>

              {personaResult ? (
                <article className="persona-result-card">
                  <p className="persona-result-title">페르소나 결과 JSON</p>
                  <pre className="persona-result-json">{JSON.stringify(personaResult, null, 2)}</pre>
                </article>
              ) : !currentQuestion ? (
                <article className="persona-status-card">
                  <p className="persona-status-text">
                    {personaLoading ? '다음 질문을 생성하고 있습니다...' : personaError || '질문을 다시 불러와주세요.'}
                  </p>
                  {!personaLoading && (
                    <button className="persona-retry-button" type="button" onClick={() => void startPersonaInterview()}>
                      다시 생성
                    </button>
                  )}
                </article>
              ) : (
                <section className="persona-options" aria-label="선택지">
                  {personaError && <p className="persona-inline-error">{personaError}</p>}

                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={`persona-option-${currentQuestion.turn}-${index}`}
                      type="button"
                      className="persona-option"
                      style={{ animationDelay: `${0.1 + index * 0.07}s` }}
                      onClick={() => handlePersonaOptionClick(option)}
                      disabled={personaLoading}
                    >
                      <span className="persona-option-text">{option}</span>
                    </button>
                  ))}

                  <form className="persona-option persona-option-input" style={{ animationDelay: '0.38s' }} onSubmit={handlePersonaSubmit}>
                    <input
                      className="persona-option-custom-input"
                      type="text"
                      value={personaInput}
                      onChange={handlePersonaInputChange}
                      placeholder="직접 입력해서 답변"
                      disabled={personaLoading}
                    />
                  </form>
                </section>
              )}
            </div>

            <aside className="persona-json-float" aria-live="polite">
              <p className="persona-json-float-title">GPT JSON</p>
              {analysisStatus === 'error' ? (
                <p className="analysis-error">{analysisError}</p>
              ) : (
                <pre className="persona-json-float-body">{JSON.stringify(analysisResult ?? MOCK_APPEARANCE_RESULT, null, 2)}</pre>
              )}
            </aside>
          </section>
        </section>
      )}

      {stage === 'webcam' && countdown !== null && (
        <section className="countdown-overlay" aria-live="polite">
          <p className="countdown-text">{countdown}</p>
        </section>
      )}

      {stage === 'webcam' && showShutterText && <p className="shutter-text">찰칵!</p>}

      {stage === 'webcam' && flashOn && <div className="flash-overlay" aria-hidden="true" />}
    </div>
  )
}

export default App
