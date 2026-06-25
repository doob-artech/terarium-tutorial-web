import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { TUTORIAL_DATA } from './data';
import { CHARACTER_PRESETS } from './tutorialAssets';
import sceneDayVideo from './assets/SceneDAY.mp4';
import viewAllVideo from './assets/viewAll.mp4';
import picnicVideo from './assets/picnic.mp4';
import characterBackground from './assets/character.jpg';
import qrImage from './assets/qr.png';
import cameraBubbleImage from './assets/bubble.png';
import cameraButtonImage from './assets/camera.png';
import questionImage from './assets/question.png';
import typingSoundSrc from './assets/talking.ogg';
import introBgmSrc from './assets/bgm1.wav';
import clickSoundSrc from './assets/click1.mp3';
import './TutorialDesign.css';

const SKY_BACKGROUND = 'linear-gradient(180deg, #9FD1FC 0%, #FFF 100%)';
const AvatarThreeViewer = lazy(() => import('./AvatarThreeViewer'));

const ANSWER_BACKGROUNDS = {
  3: {
    label: 'YES',
    background: 'linear-gradient(0deg, #FFF 0%, #5D9CEC 73.08%)',
  },
  4: {
    label: 'NO',
    background: 'linear-gradient(0deg, #FFF 0%, #FF8C5A 73.08%)',
  },
};

const STEP_BACKGROUNDS = {
  7: 'radial-gradient(50% 50% at 50% 50%, #FFF 0.48%, #9FD1FC 60.1%)',
  12: 'linear-gradient(180deg, #b9ddfb 0%, #dff1ff 56%, #fff 100%)',
};

const SKY_BACKGROUND_STEPS = new Set([9, 10, 11, 12]);
const DEFAULT_CHARACTER_EXCLUDED_STEPS = new Set([10, 12, 15]);
const CAMERA_ASSET_PRELOAD_STEPS = new Set([6, 7]);
const SCENE_ONE_SWITCH_MS = 3200;
const PREVIEW_AVATAR_URL = '';
const DUPLICATE_NAME_ERROR = '그 이름은 이미 누군가 사용하고 있어. 다시 입력해줄래?';
const CAMERA_STEP_ASSETS = [cameraBubbleImage, cameraButtonImage];

let cameraStepAssetPreloadPromise = null;

const preloadImageAsset = (src) => {
  if (typeof document === 'undefined' || !src) {
    return Promise.resolve();
  }

  const selector = `link[data-terarium-preload-image="${src}"]`;
  if (!document.querySelector(selector)) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    link.dataset.terariumPreloadImage = src;
    document.head.appendChild(link);
  }

  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      if (typeof image.decode === 'function') {
        void image.decode().then(resolve).catch(resolve);
        return;
      }
      resolve();
    };
    image.onerror = resolve;
    image.src = src;
  });
};

const preloadCameraStepAssets = () => {
  if (!cameraStepAssetPreloadPromise) {
    cameraStepAssetPreloadPromise = Promise.all(CAMERA_STEP_ASSETS.map(preloadImageAsset)).then(() => undefined);
  }
  return cameraStepAssetPreloadPromise;
};
const DUPLICATE_NAME_NOTICE =
  '다른 친구가 이미 쓰고 있는 이름은 사용할 수 없으니, 너만의 유일무이한 이름을 입력해 줘!';
const ANSWER_SELECTION_NOTICE = '답변은 좋아하는 순서대로 3개까지 선택할 수 있어.';

const STEP_SCENE_CHARACTERS = {
  2: 'scene2',
  3: 'scene3',
  4: 'scene4',
  7: 'scene7',
  8: 'scene8',
  12: 'defaultStand',
  14: 'scene14',
  15: 'scene15',
};

const STEP_SPECIAL_CHARACTERS = {
  9: 'avatar',
  10: 'avatarSmall',
  11: 'avatarResult',
};

const STEP_BACKGROUND_VIDEOS = {
  0: { src: sceneDayVideo, loop: true },
  1: { src: sceneDayVideo, loop: true },
  2: { src: sceneDayVideo, loop: true },
  5: { src: viewAllVideo, loop: false },
  6: { src: picnicVideo, loop: true },
};

let typingAudioPool = [];
let typingAudioPoolIndex = 0;
let clickAudioPool = [];
let clickAudioPoolIndex = 0;
let typingAudioBlockedUntil = 0;
let typingSoundStopTimer = 0;
let lastTypingSoundAt = 0;
const TYPING_SOUND_CLIP_MS = 74;
const TYPING_SOUND_MIN_GAP_MS = 58;
const CLICK_SOUND_FALLBACK_MS = 320;
const CLICK_SOUND_TAIL_GAP_MS = 40;

const getTypingAudioPool = () => {
  if (typeof window === 'undefined') {
    return [];
  }

  if (typingAudioPool.length === 0) {
    typingAudioPool = Array.from({ length: 4 }, () => {
      const audio = new Audio(typingSoundSrc);
      audio.preload = 'auto';
      audio.volume = 1;
      return audio;
    });
  }

  return typingAudioPool;
};

const playTypingSound = (char) => {
  if (!char || /\s/.test(char)) {
    return;
  }

  const now = Date.now();
  if (now < typingAudioBlockedUntil) {
    return;
  }
  if (now - lastTypingSoundAt < TYPING_SOUND_MIN_GAP_MS) {
    return;
  }
  lastTypingSoundAt = now;

  const pool = getTypingAudioPool();
  if (pool.length === 0) {
    return;
  }

  const audio = pool[typingAudioPoolIndex];
  typingAudioPoolIndex = (typingAudioPoolIndex + 1) % pool.length;
  window.clearTimeout(typingSoundStopTimer);
  typingAudioPool.forEach((item) => {
    if (item !== audio) {
      item.pause();
      item.currentTime = 0;
    }
  });
  audio.currentTime = 0;
  void audio.play().catch(() => {});
  typingSoundStopTimer = window.setTimeout(() => {
    audio.pause();
    audio.currentTime = 0;
  }, TYPING_SOUND_CLIP_MS);
};

const stopTypingSounds = () => {
  window.clearTimeout(typingSoundStopTimer);
  typingAudioPool.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
};

const getClickAudioPool = () => {
  if (typeof window === 'undefined') {
    return [];
  }

  if (clickAudioPool.length === 0) {
    clickAudioPool = Array.from({ length: 3 }, () => {
      const audio = new Audio(clickSoundSrc);
      audio.preload = 'auto';
      audio.volume = 1;
      return audio;
    });
  }

  return clickAudioPool;
};

const playClickSound = () => {
  const pool = getClickAudioPool();
  if (pool.length === 0) {
    return;
  }

  const audio = pool[clickAudioPoolIndex];
  clickAudioPoolIndex = (clickAudioPoolIndex + 1) % pool.length;
  const clickDurationMs =
    Number.isFinite(audio.duration) && audio.duration > 0
      ? audio.duration * 1000
      : CLICK_SOUND_FALLBACK_MS;
  typingAudioBlockedUntil = Math.max(
    typingAudioBlockedUntil,
    Date.now() + clickDurationMs + CLICK_SOUND_TAIL_GAP_MS,
  );
  audio.currentTime = 0;
  void audio.play().catch(() => {});
};

const getTypingStartDelay = (baseDelay) => {
  const remainingClickMs = typingAudioBlockedUntil - Date.now();
  return Math.max(baseDelay, remainingClickMs > 0 ? remainingClickMs : 0);
};

const getTypingSchedule = (value, speed, pauseTime) => {
  const chars = Array.from(value);
  let elapsed = 0;
  return chars.map((char) => {
    elapsed += char === '\n' ? pauseTime : speed;
    return elapsed;
  });
};

const Typewriter = ({
  text,
  speed = 150,
  pauseTime = 1000,
  repeat = false,
  repeatDelay = 1200,
  highlightText = '',
  highlightClassName = '',
  forceComplete = false,
  startDelay = 0,
  onComplete,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!text) {
      stopTypingSounds();
      onCompleteRef.current?.();
      return;
    }

    if (forceComplete) {
      stopTypingSounds();
      setDisplayedText(text);
      onCompleteRef.current?.();
      return;
    }

    setDisplayedText('');

    const chars = Array.from(text);
    const schedule = getTypingSchedule(text, speed, pauseTime);
    const startDelayMs = getTypingStartDelay(Math.max(speed, startDelay));
    let startedAt = performance.now() + startDelayMs;
    let timer = 0;
    let completed = false;
    let lastDisplayedIndex = 0;

    const scheduleNextTick = () => {
      if (completed) return;
      const now = performance.now();
      const nextAt = schedule[lastDisplayedIndex] ?? schedule[schedule.length - 1] ?? speed;
      const delay = Math.max(0, startedAt + nextAt - now);
      timer = window.setTimeout(updateTick, delay);
    };

    const updateTick = () => {
      const now = performance.now();
      const elapsed = now - startedAt;
      let nextIndex = lastDisplayedIndex;

      while (nextIndex < schedule.length && elapsed >= schedule[nextIndex]) {
        nextIndex += 1;
      }

      if (nextIndex !== lastDisplayedIndex) {
        const addedChars = chars.slice(lastDisplayedIndex, nextIndex);
        setDisplayedText(chars.slice(0, nextIndex).join(''));
        playTypingSound(addedChars.find((char) => !/\s/.test(char)));
        lastDisplayedIndex = nextIndex;
      }

      if (lastDisplayedIndex >= chars.length) {
        if (completed) return;
        completed = true;
        stopTypingSounds();
        onCompleteRef.current?.();
        if (repeat) {
          timer = window.setTimeout(() => {
            completed = false;
            lastDisplayedIndex = 0;
            startedAt = performance.now() + speed;
            setDisplayedText('');
            scheduleNextTick();
          }, repeatDelay);
        }
        return;
      }

      scheduleNextTick();
    };

    scheduleNextTick();

    return () => {
      window.clearTimeout(timer);
      stopTypingSounds();
    };
  }, [text, speed, pauseTime, repeat, repeatDelay, forceComplete, startDelay]);

  if (!highlightText) {
    return <>{displayedText}</>;
  }

  const escapedHighlightText = highlightText.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&',
  );
  const parts = displayedText.split(new RegExp(`(${escapedHighlightText})`, 'g'));

  return (
    <>
      {parts.map((part, index) =>
        part === highlightText ? (
          <span key={index} className={highlightClassName}>
            {part}
          </span>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        ),
      )}
    </>
  );
};

const TutorialDesign = ({
  initialId = 0,
  externalName = '',
  avatarUrl = '',
  avatarReveal = false,
  avatarColorOverrides = null,
  avatarInitialYaw = 0,
  keywords = [],
  enterUrl = '',
  backgroundSlot = null,
  hideUi = false,
  avatarColorEditorSlot = null,
  onCameraStepEnter,
  onBeginCamera,
  onNameSubmit,
  onAvatarRotationChange,
  onAvatarReady,
  onAvatarConfirm,
  onAvatarProfileImageReady,
  onStartQuestions,
  onFinish,
  avatarIntroTextStartDelay = 0,
}) => {
  const [currentId, setCurrentId] = useState(initialId);
  const [userName, setUserName] = useState(externalName);
  const [isTextDone, setIsTextDone] = useState(false);
  const [isNameIntroDone, setIsNameIntroDone] = useState(false);
  const [isWhiteLayerTransition, setIsWhiteLayerTransition] = useState(false);
  const [nameError, setNameError] = useState('');
  const [isNameSubmitting, setIsNameSubmitting] = useState(false);
  const [forceCompleteText, setForceCompleteText] = useState(false);
  const [isSceneOneLooping, setIsSceneOneLooping] = useState(false);
  const [isIntroBgmPlaying, setIsIntroBgmPlaying] = useState(false);
  const cameraSkipClickRef = useRef({ count: 0, startedAt: 0 });
  const cameraStepEnterNotifiedRef = useRef(false);
  const introBgmRef = useRef(null);

  const step =
    TUTORIAL_DATA.find((item) => item.id === currentId) || TUTORIAL_DATA[0];

  const hasExternalBackground = currentId === 8 && backgroundSlot;
  const stepBackgroundVideo = STEP_BACKGROUND_VIDEOS[currentId];
  const answerBackground = ANSWER_BACKGROUNDS[currentId];
  const characterImageBackground = `url(${characterBackground})`;
  const currentBackground =
    step.background ||
    STEP_BACKGROUNDS[currentId] ||
    answerBackground?.background ||
    (SKY_BACKGROUND_STEPS.has(currentId) || currentId >= 14
      ? SKY_BACKGROUND
      : null);
  const answerBackgroundText = answerBackground?.label;
  const layerBackgroundStyle = hasExternalBackground
    ? { background: '#000' }
    : currentBackground
    ? { background: currentBackground }
    : { backgroundImage: characterImageBackground };
  const shouldShowWhiteLayer =
    isWhiteLayerTransition || currentId === 2;

  const characterKey =
    currentId === 1
      ? isSceneOneLooping
        ? 'scene1OnlyHi'
        : 'scene1'
      : STEP_SCENE_CHARACTERS[currentId] ||
    STEP_SPECIAL_CHARACTERS[currentId] ||
    (currentId >= 5 && !DEFAULT_CHARACTER_EXCLUDED_STEPS.has(currentId)
      ? 'bubbleGuide'
      : step.character || null);
  const character = characterKey
    ? CHARACTER_PRESETS[characterKey]
    : null;
  const supplementalCharacter =
    currentId === 10 && nameError === DUPLICATE_NAME_ERROR
      ? CHARACTER_PRESETS.scene9One
      : currentId === 9 || currentId === 11
        ? CHARACTER_PRESETS.scene9
        : null;
  const avatarPreviewUrl = avatarUrl || PREVIEW_AVATAR_URL;
  const shouldRenderAvatarModel =
    ['avatar', 'avatarSmall', 'avatarResult'].includes(characterKey);
  const qrCodeSrc = enterUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(enterUrl)}`
    : qrImage;

  useEffect(() => {
    setIsTextDone(false);
    setIsNameIntroDone(false);
    setNameError('');
    setForceCompleteText(false);
    setIsSceneOneLooping(false);
    cameraStepEnterNotifiedRef.current = false;
  }, [currentId]);

  useEffect(() => {
    if (currentId !== 1) {
      return undefined;
    }

    const loopImage = new Image();
    loopImage.src = CHARACTER_PRESETS.scene1OnlyHi.src;

    const timer = setTimeout(() => {
      setIsSceneOneLooping(true);
    }, SCENE_ONE_SWITCH_MS);

    return () => clearTimeout(timer);
  }, [currentId]);

  useEffect(() => {
    setCurrentId(initialId);
  }, [initialId]);

  useEffect(() => {
    if (!CAMERA_ASSET_PRELOAD_STEPS.has(currentId)) {
      return undefined;
    }

    const preload = () => {
      void preloadCameraStepAssets();
    };
    const idleCallback = window.requestIdleCallback?.(preload, { timeout: 700 });
    if (idleCallback) {
      return () => window.cancelIdleCallback?.(idleCallback);
    }

    const timer = window.setTimeout(preload, 0);
    return () => window.clearTimeout(timer);
  }, [currentId]);

  useEffect(() => {
    if (externalName) {
      setUserName(externalName);
    }
  }, [externalName]);

  useEffect(() => {
    const introBgm = introBgmRef.current;
    if (!introBgm) {
      return;
    }

    if (currentId === 0) {
      introBgm.volume = 1;
      void introBgm
        .play()
        .then(() => setIsIntroBgmPlaying(true))
        .catch(() => setIsIntroBgmPlaying(false));
      return;
    }

    introBgm.pause();
    introBgm.currentTime = 0;
    setIsIntroBgmPlaying(false);
  }, [currentId]);

  useEffect(() => {
    if (step.type === 'CAMERA' && !cameraStepEnterNotifiedRef.current) {
      cameraStepEnterNotifiedRef.current = true;
      onCameraStepEnter?.();
    }
  }, [step.type, onCameraStepEnter]);

  const handleNext = async (nextId) => {
    if (step.type === 'CAMERA') {
      playClickSound();
      if (onBeginCamera) {
        onBeginCamera();
        return;
      }
      setCurrentId(nextId);
      return;
    }

    if (currentId === 10) {
      const trimmedName = userName.trim();
      if (!trimmedName) {
        setNameError('이름을 입력해주세요.');
        return;
      }

      setIsNameSubmitting(true);
      setNameError('');
      const ok = await onNameSubmit?.(trimmedName);
      setIsNameSubmitting(false);

      if (ok === false) {
        setNameError(DUPLICATE_NAME_ERROR);
        return;
      }
    }

    if (currentId === 1 && nextId === 2) {
      setIsWhiteLayerTransition(true);
      setTimeout(() => {
        setCurrentId(nextId);
        setIsWhiteLayerTransition(false);
      }, 650);
      return;
    }

    if (currentId === 9) {
      await onAvatarConfirm?.();
    }

    if (nextId === 'FINISH_ALL') {
      setCurrentId(0);
      setUserName('');
      onFinish?.();
      return;
    }

    if (nextId === 'START_QUESTION') {
      onStartQuestions?.();
      return;
    }

    setCurrentId(nextId);
  };

  const handleProgressiveNext = (nextId) => {
    playClickSound();

    if (currentId === 0) {
      void introBgmRef.current?.play().catch(() => {});
    }

    if (!isTextDone) {
      setForceCompleteText(true);
      setIsTextDone(true);
      return;
    }

    void handleNext(nextId);
  };

  const formatText = (text) =>
    text?.replace(/{{name}}/g, userName || externalName || '아바타');

  const nameHighlightProps = userName
    ? {
        highlightText: userName,
        highlightClassName: 'name-highlight',
      }
    : {};
  const answerSelectionHighlightProps =
    currentId === 12
      ? {
          highlightText: ANSWER_SELECTION_NOTICE,
          highlightClassName: 'answer-selection-highlight',
        }
      : {};

  const renderTypewriter = (
    text,
    { key = text, speed = 25, ...typewriterProps } = {},
  ) => (
    <Typewriter
      key={key}
      text={formatText(text)}
      speed={speed}
      startDelay={typewriterProps.startDelay ?? (currentId === 9 ? avatarIntroTextStartDelay : 0)}
      forceComplete={forceCompleteText}
      {...nameHighlightProps}
      {...typewriterProps}
    />
  );

  const handleTextComplete = () => {
    setIsTextDone(true);
  };

  const handleCameraSkipClick = () => {
    if (currentId !== 0) {
      return;
    }

    const now = Date.now();
    const previous = cameraSkipClickRef.current;
    const count = now - previous.startedAt > 2500 ? 1 : previous.count + 1;
    cameraSkipClickRef.current = { count, startedAt: count === 1 ? now : previous.startedAt };

    if (count >= 5) {
      cameraSkipClickRef.current = { count: 0, startedAt: 0 };
      onCameraStepEnter?.();
    }
  };

  const handleIntroBgmToggle = () => {
    const introBgm = introBgmRef.current;
    if (!introBgm) {
      return;
    }

    if (isIntroBgmPlaying) {
      introBgm.pause();
      setIsIntroBgmPlaying(false);
      return;
    }

    introBgm.volume = 1;
    void introBgm
      .play()
      .then(() => setIsIntroBgmPlaying(true))
      .catch(() => setIsIntroBgmPlaying(false));
  };

  const handleNameIntroComplete = () => {
    setTimeout(() => {
      setIsNameIntroDone(true);
    }, 450);
  };

  return (
    <div id="tutorial-container" className={hideUi ? 'is-ui-hidden' : ''}>
      <audio ref={introBgmRef} src={introBgmSrc} loop preload="auto" />
      {currentId === 0 && (
        <button
          type="button"
          className={`intro-bgm-toggle ${isIntroBgmPlaying ? 'is-playing' : ''}`}
          onClick={handleIntroBgmToggle}
          aria-label={isIntroBgmPlaying ? '배경음 끄기' : '배경음 켜기'}
        >
          {isIntroBgmPlaying ? '소리 끄기' : '소리 켜기'}
        </button>
      )}
      {currentId === 0 && (
        <button
          type="button"
          className="camera-skip-hotspot"
          aria-label="카메라 단계로 건너뛰기"
          onClick={handleCameraSkipClick}
        />
      )}
      <div
        className="layer-bg"
        style={layerBackgroundStyle}
      >
        {hasExternalBackground && backgroundSlot}
        {!hasExternalBackground && stepBackgroundVideo && (
          <video
            key={stepBackgroundVideo.src}
            className="background-video"
            autoPlay
            muted
            preload="metadata"
            loop={stepBackgroundVideo.loop}
            playsInline
            aria-hidden="true"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          >
            <source src={stepBackgroundVideo.src} type="video/mp4" />
          </video>
        )}
        {answerBackgroundText && (
          <span className="answer-bg-text">{answerBackgroundText}</span>
        )}
      </div>
      <div
        className={`white-layer-transition ${
          shouldShowWhiteLayer ? 'show' : ''
        }`}
      />
      {currentId === 12 && (
        <img
          src={questionImage}
          alt=""
          className="question-background-image"
          aria-hidden="true"
          decoding="async"
        />
      )}

      <main className="ui-root">
        {step.type === 'INTRO' ? (
          <div className="intro-screen">
            <div className="intro-overlay" />

            <div className="intro-content">
              <h1 className="intro-title" data-text="TERARIUM">TERARIUM</h1>

              <p className="intro-subtitle">
                {renderTypewriter(step.text, {
                  speed: 34,
                  pauseTime: 360,
                  onComplete: handleTextComplete,
                })}
              </p>

              <button
                className={`start-btn ${isTextDone ? 'show' : ''}`}
                onClick={() => handleProgressiveNext(step.nextId)}
                disabled={!isTextDone}
              >
                {step.buttonText}
              </button>
            </div>
          </div>
        ) : (
          <>
            {character && (
              <div
                key={`character-${currentId}`}
                className={`character-layer ${
                  currentId === 2 ? 'is-front' : ''
                } ${character.layerClass || ''} step-character-${currentId}`}
              >
                {shouldRenderAvatarModel ? (
                  <Suspense fallback={<div className="character-img tutorial-avatar-model" />}>
                    <AvatarThreeViewer
                      className={`character-img tutorial-avatar-model ${
                        currentId === 10 || currentId === 11 ? 'is-name-input-avatar' : ''
                      }`}
                      src={avatarPreviewUrl}
                      alt={character.alt || 'avatar'}
                      style={currentId === 10 || currentId === 11 ? null : character.style}
                      variant={currentId === 10 || currentId === 11 ? 'staticFront' : currentId === 9 && avatarReveal ? 'avatarReveal' : 'avatar'}
                      distanceMultiplier={currentId === 10 || currentId === 11 ? 1.26 : 1.82}
                      colorOverrides={avatarColorOverrides}
                      initialYaw={currentId === 9 ? avatarInitialYaw : 0}
                      idleSway={currentId === 9 || currentId === 11}
                      onRotationChange={currentId === 9 ? onAvatarRotationChange : null}
                      onReady={currentId === 9 ? onAvatarReady : currentId === 11 ? onAvatarProfileImageReady : null}
                    />
                  </Suspense>
                ) : (
                  <img
                    src={character.src}
                    alt={character.alt || 'character'}
                    className={`character-img ${
                      currentId === 1 ? 'scene-one-img' : ''
                    }`}
                    style={character.style}
                    decoding="async"
                  />
                )}
              </div>
            )}
            {supplementalCharacter && (
              <div
                key={`supplemental-character-${currentId}`}
                className={`character-layer ${
                  supplementalCharacter.layerClass || ''
                } step-character-${currentId}-supplemental`}
              >
                <img
                  src={supplementalCharacter.src}
                  alt={supplementalCharacter.alt || 'character'}
                  className="character-img"
                  style={supplementalCharacter.style}
                  decoding="async"
                />
              </div>
            )}
            {currentId === 9 && avatarColorEditorSlot}

            {currentId !== 12 && (step.type === 'AUTO_STACK' ||
              step.type === 'RESULT_DISPLAY') && (
              <div key={`floating-${currentId}`} className="floating-layer">
                {step.stackList?.map((item, i) => (
                  <div
                    key={i}
                    className="floating-bubble"
                    style={item.position}
                  >
                    <Typewriter text={item.text} speed={25} />
                  </div>
                ))}

                {step.keywordSlots?.map((slot, i) => (
                  <div
                    key={i}
                    className="keyword-slot"
                    style={{
                      ...slot.position,
                      ...slot.style,
                      animationDelay: `${slot.delay || i * 300}ms`,
                    }}
                  >
                    {keywords[i] || `KEYWORD #${slot.id}`}
                  </div>
                ))}
              </div>
            )}

            <div
              key={`card-${currentId}`}
              className={`glass-bubble-card type-${step.type} step-${step.id}`}
            >
              {currentId === 8 ? (
                <div className="camera-step-layout">
                  <div className="camera-step-bottom-bar" aria-hidden="true" />
                  <div className="camera-step-bubble-wrap">
                    <img
                      src={cameraBubbleImage}
                      alt=""
                      className="camera-step-bubble-img"
                      aria-hidden="true"
                      decoding="async"
                    />
                    <p className="camera-step-bubble-text">
                      {renderTypewriter(step.text, {
                        onComplete: handleTextComplete,
                      })}
                    </p>
                  </div>

                  <button
                    className={`camera-step-button ${isTextDone ? 'show' : ''}`}
                    type="button"
                    aria-label={step.buttonText}
                    onClick={() => {
                      void handleNext(step.nextId);
                    }}
                    disabled={!isTextDone}
                  >
                    <img src={cameraButtonImage} alt="" aria-hidden="true" decoding="async" />
                  </button>
                </div>
              ) : window.__ENABLE_LEGACY_STACK_LAYOUT__ === true && currentId === 12 ? (
                <div className="stack-layout">
                  <section className="stack-head-box">
                    <p className="main-desc">
                      {renderTypewriter(step.text, {
                        ...answerSelectionHighlightProps,
                        onComplete: handleTextComplete,
                      })}
                    </p>
                  </section>

                  {isTextDone && (
                    <>
                      <div className="stack-card-row">
                        {step.stackList?.map((item, i) => (
                          <section
                            key={i}
                            className="stack-choice-card"
                            style={{ animationDelay: `${i * 0.35}s` }}
                          >
                            <p className="stack-choice-text">
                              {formatText(item.text)}
                            </p>
                            <div className="stack-face" aria-hidden="true">
                              &gt;0&lt;
                            </div>
                          </section>
                        ))}
                      </div>

                      <div className="stack-action-row">
                        <button
                          className="primary-next-btn"
                          onClick={() => handleProgressiveNext(step.nextId)}
                          disabled={isNameSubmitting}
                        >
                          {isNameSubmitting ? '확인 중...' : step.buttonText}
                        </button>
                        {nameError && <p className="name-error">{nameError}</p>}
                      </div>
                    </>
                  )}
                </div>
              ) : currentId === 10 ? (
                <div className="name-layout">
                  <section className="name-info-box">
                    {typeof step.textList === 'string' && (
                      <p className="main-desc">
                        {renderTypewriter(step.textList, {
                          highlightText: DUPLICATE_NAME_NOTICE,
                          highlightClassName: 'duplicate-name-highlight',
                          onComplete: handleTextComplete,
                        })}
                      </p>
                    )}
                  </section>

                  {isTextDone && (
                    <section className="name-input-box">
                      <div className="input-row show">
                        <p className="q-label">{step.questionText}</p>

                        <input
                          type="text"
                          placeholder={step.placeholder}
                          value={userName}
                          onChange={(e) => {
                            setUserName(e.target.value);
                            setNameError('');
                          }}
                          disabled={isNameSubmitting}
                          autoFocus
                        />
                        {nameError && <p className="name-error">{nameError}</p>}
                      </div>

                      <div className="action-row show">
                        <button
                          className="primary-next-btn"
                          onClick={() => handleProgressiveNext(step.nextId)}
                          disabled={isNameSubmitting}
                        >
                          {isNameSubmitting ? '확인 중...' : step.buttonText}
                        </button>
                      </div>
                    </section>
                  )}
                </div>
              ) : currentId === 11 ? (
                <div className="name-result-layout">
                  <section className="name-result-intro-box">
                    <p className="main-desc">
                      {renderTypewriter(step.textList[0], {
                        onComplete: handleNameIntroComplete,
                      })}
                    </p>
                  </section>

                  {isNameIntroDone && (
                    <section className="name-result-next-box">
                      <p className="main-desc">
                        {renderTypewriter(step.textList[1], {
                          onComplete: handleTextComplete,
                        })}
                      </p>

                      <div className={`action-row ${isTextDone ? 'show' : ''}`}>
                        <button
                          className="primary-next-btn"
                          onClick={() => handleProgressiveNext(step.nextId)}
                          disabled={!isTextDone}
                        >
                          {step.buttonText}
                        </button>
                      </div>
                    </section>
                  )}
                </div>
              ) : currentId === 15 ? (
                <div className="qr-layout">
                  <p className="main-desc">
                    {renderTypewriter(step.text, {
                      onComplete: handleTextComplete,
                    })}
                  </p>

                  {enterUrl ? (
                    <a href={enterUrl} target="_blank" rel="noreferrer">
                      <img src={qrCodeSrc} alt="QR code" className="qr-image" decoding="async" />
                    </a>
                  ) : (
                    <img src={qrCodeSrc} alt="QR code" className="qr-image" decoding="async" />
                  )}

                  <div className={`action-row ${isTextDone ? 'show' : ''}`}>
                    <button
                      className="primary-next-btn"
                      onClick={() => handleProgressiveNext(step.nextId)}
                      disabled={!isTextDone}
                    >
                      {step.buttonText}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="content-wrapper">
                    <div className="text-section">
                      {step.text && (
                        <p className="main-desc">
                          {renderTypewriter(step.text, {
                            ...answerSelectionHighlightProps,
                            onComplete: handleTextComplete,
                          })}
                        </p>
                      )}

                      {Array.isArray(step.textList) &&
                        step.textList.map((t, i) => (
                          <p key={i} className="main-desc">
                            {renderTypewriter(t, {
                              onComplete:
                                i === step.textList.length - 1
                                  ? handleTextComplete
                                  : undefined,
                            })}
                          </p>
                        ))}

                      {typeof step.textList === 'string' && (
                        <p className="main-desc">
                          {renderTypewriter(step.textList, {
                            onComplete: handleTextComplete,
                          })}
                        </p>
                      )}
                    </div>

                    {step.type === 'SELECT' && (
                      <div className={`selection-row ${isTextDone ? 'show' : ''}`}>
                        {step.options.map((opt, i) => (
                          <button
                            key={i}
                            className={`opt-btn ${opt.className || opt.backgroundLabel || opt.label}`}
                            onClick={() => handleProgressiveNext(opt.nextId)}
                            disabled={!isTextDone}
                          >
                            <span className="lbl-top">{opt.backgroundLabel || opt.label}</span>
                            <span className="lbl-sub">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {step.type === 'INPUT' && isTextDone && (
                      <div className={`input-row ${isTextDone ? 'show' : ''}`}>
                        <p className="q-label">{step.questionText}</p>

                        <input
                          type="text"
                          placeholder={step.placeholder}
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          autoFocus
                        />
                      </div>
                    )}
                  </div>

                  {step.type !== 'SELECT' && (
                    <div className={`action-row ${isTextDone ? 'show' : ''}`}>
                      <button
                        className="primary-next-btn"
                        onClick={() => handleProgressiveNext(step.nextId)}
                        disabled={!isTextDone}
                      >
                        {step.buttonText}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default TutorialDesign;
