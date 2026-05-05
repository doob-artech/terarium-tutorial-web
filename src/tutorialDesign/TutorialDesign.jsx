import React, { useState, useEffect, useRef } from 'react';
import { TUTORIAL_DATA } from './data';
import { CHARACTER_PRESETS } from './tutorialAssets';
import sceneDayVideo from './assets/SceneDAY.mp4';
import doobCloseUpVideo from './assets/DoobCloseUp.mp4';
import viewAllVideo from './assets/viewAll.mp4';
import characterBackground from './assets/character.jpg';
import qrImage from './assets/qr.png';
import '@google/model-viewer';
import './TutorialDesign.css';

const SKY_BACKGROUND = 'linear-gradient(180deg, #9FD1FC 0%, #FFF 100%)';

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

const SKY_BACKGROUND_STEPS = new Set([9, 10, 11, 12, 13]);
const DEFAULT_CHARACTER_EXCLUDED_STEPS = new Set([12, 15]);

const STEP_CHARACTERS = {
  3: 'responseGuide',
  4: 'responseGuide',
  9: 'avatar',
  10: 'avatarSmall',
  11: 'avatarResult',
};

const STEP_BACKGROUND_VIDEOS = {
  1: { src: doobCloseUpVideo, loop: false },
  2: { src: doobCloseUpVideo, loop: false },
  5: { src: viewAllVideo, loop: false },
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
  onComplete,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!text) {
      onCompleteRef.current?.();
      return;
    }

    if (forceComplete) {
      setDisplayedText(text);
      onCompleteRef.current?.();
      return;
    }

    setDisplayedText('');

    let index = 0;
    let timer;

    const nextTick = () => {
      index += 1;
      setDisplayedText(text.substring(0, index));

      if (index >= text.length) {
        onCompleteRef.current?.();
        if (repeat) {
          timer = setTimeout(() => {
            index = 0;
            setDisplayedText('');
            timer = setTimeout(nextTick, speed);
          }, repeatDelay);
        }
        return;
      }

      const currentChar = text[index - 1];
      const delay = currentChar === '\n' ? pauseTime : speed;

      timer = setTimeout(nextTick, delay);
    };

    timer = setTimeout(nextTick, speed);

    return () => clearTimeout(timer);
  }, [text, speed, pauseTime, repeat, repeatDelay, forceComplete]);

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
  keywords = [],
  enterUrl = '',
  backgroundSlot = null,
  onCameraStepEnter,
  onBeginCamera,
  onNameSubmit,
  onStartQuestions,
  onFinish,
}) => {
  const [currentId, setCurrentId] = useState(initialId);
  const [userName, setUserName] = useState(externalName);
  const [isTextDone, setIsTextDone] = useState(false);
  const [isNameIntroDone, setIsNameIntroDone] = useState(false);
  const [isWhiteLayerTransition, setIsWhiteLayerTransition] = useState(false);
  const [nameError, setNameError] = useState('');
  const [isNameSubmitting, setIsNameSubmitting] = useState(false);
  const [forceCompleteText, setForceCompleteText] = useState(false);

  const step =
    TUTORIAL_DATA.find((item) => item.id === currentId) || TUTORIAL_DATA[0];

  const hasExternalBackground = currentId === 8 && backgroundSlot;
  const stepBackgroundVideo = STEP_BACKGROUND_VIDEOS[currentId];
  const answerBackground = ANSWER_BACKGROUNDS[currentId];
  const characterImageBackground = `url(${characterBackground})`;
  const currentBackground =
    step.background ||
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
    step.character ||
    STEP_CHARACTERS[currentId] ||
    (currentId >= 5 && !DEFAULT_CHARACTER_EXCLUDED_STEPS.has(currentId)
      ? 'bubbleGuide'
      : null);
  const character = characterKey
    ? CHARACTER_PRESETS[characterKey]
    : null;
  const shouldRenderAvatarModel =
    avatarUrl && ['avatar', 'avatarSmall', 'avatarResult'].includes(characterKey);
  const qrCodeSrc = enterUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(enterUrl)}`
    : qrImage;

  useEffect(() => {
    setIsTextDone(false);
    setIsNameIntroDone(false);
    setNameError('');
    setForceCompleteText(false);
  }, [currentId]);

  useEffect(() => {
    setCurrentId(initialId);
  }, [initialId]);

  useEffect(() => {
    if (externalName) {
      setUserName(externalName);
    }
  }, [externalName]);

  useEffect(() => {
    if (step.type === 'CAMERA') {
      onCameraStepEnter?.();
    }
  }, [step.type, onCameraStepEnter]);

  const handleNext = async (nextId) => {
    if (step.type === 'CAMERA') {
      onBeginCamera?.();
      return;
    }

    if (currentId === 10) {
      const trimmedName = userName.trim();
      if (!trimmedName) {
        setNameError('??已????낆젾??雅뚯눘苑??');
        return;
      }

      setIsNameSubmitting(true);
      setNameError('');
      const ok = await onNameSubmit?.(trimmedName);
      setIsNameSubmitting(false);

      if (ok === false) {
        setNameError('??? ????餓λ쵐????已??곷퓠?? ??삘뀲 ??已????낆젾??雅뚯눘苑??');
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
    if (!isTextDone) {
      setForceCompleteText(true);
      setIsTextDone(true);
      return;
    }

    void handleNext(nextId);
  };

  const formatText = (text) =>
    text?.replace(/{{name}}/g, userName || externalName || '??已???곸벉');

  const nameHighlightProps = userName
    ? {
        highlightText: userName,
        highlightClassName: 'name-highlight',
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
      forceComplete={forceCompleteText}
      {...nameHighlightProps}
      {...typewriterProps}
    />
  );

  const handleTextComplete = () => {
    setIsTextDone(true);
  };

  const handleNameIntroComplete = () => {
    setTimeout(() => {
      setIsNameIntroDone(true);
    }, 450);
  };

  return (
    <div id="tutorial-container">
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

      <main className="ui-root">
        {step.type === 'INTRO' ? (
          <div className="intro-screen">
            <video
              className="intro-bg-video"
              autoPlay
              muted
              loop
              playsInline
              aria-hidden="true"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            >
              <source src={sceneDayVideo} type="video/mp4" />
            </video>
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
                className="start-btn"
                onClick={() => handleProgressiveNext(step.nextId)}
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
                  <model-viewer
                    class="character-img tutorial-avatar-model"
                    src={avatarUrl}
                    alt={character.alt || 'avatar'}
                    style={character.style}
                    camera-controls
                    disable-zoom
                    auto-rotate
                    auto-rotate-delay="0"
                    rotation-per-second="24deg"
                    shadow-intensity="0.65"
                    exposure="1"
                    camera-orbit="0deg 76deg 2.8m"
                    field-of-view="28deg"
                  />
                ) : (
                  <img
                    src={character.src}
                    alt={character.alt || 'character'}
                    className="character-img"
                    style={character.style}
                  />
                )}
              </div>
            )}

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
              {currentId === 12 ? (
                <div className="stack-layout">
                  <section className="stack-head-box">
                    <p className="main-desc">
                      {renderTypewriter(step.text, {
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

                      <div className="action-row show">
                        <button
                          className="primary-next-btn"
                          onClick={() => handleProgressiveNext(step.nextId)}
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
                      <img src={qrCodeSrc} alt="QR code" className="qr-image" />
                    </a>
                  ) : (
                    <img src={qrCodeSrc} alt="QR code" className="qr-image" />
                  )}

                  <div className="action-row show">
                    <button
                      className="primary-next-btn"
                      onClick={() => handleProgressiveNext(step.nextId)}
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
                      <div className="selection-row show">
                        {step.options.map((opt, i) => (
                          <button
                            key={i}
                            className={`opt-btn ${opt.label}`}
                            onClick={() => handleProgressiveNext(opt.nextId)}
                          >
                            <span className="lbl-top">{opt.label}</span>
                            <span className="lbl-sub">{opt.subText}</span>
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
                    <div className="action-row show">
                      <button
                        className="primary-next-btn"
                        onClick={() => handleProgressiveNext(step.nextId)}
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

