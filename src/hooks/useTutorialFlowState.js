import { useCallback, useState } from 'react'

export function useTutorialFlowState() {
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

  const resetFlowState = useCallback(() => {
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
  }, [])

  return {
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
    historyViewIndex,
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
  }
}
