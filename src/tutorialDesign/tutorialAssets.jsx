import defaultCharacter from './assets/animation/default.webp';
import defaultStand from './assets/animation/defaultStand.webp';
import sceneOne from './assets/animation/scene1.webp';
import sceneOneOnlyHi from './assets/animation/scene1-onlyHI.webp';
import sceneTwo from './assets/animation/scene2.webp';
import sceneThree from './assets/animation/scene3.webp';
import sceneFour from './assets/animation/scene4.webp';
import sceneSeven from './assets/animation/scene7.webp';
import sceneEight from './assets/animation/scene8.webp';
import sceneNine from './assets/animation/scene9.webp';
import sceneNineOne from './assets/animation/scene9-1.webp';
import sceneTen from './assets/animation/scene10.webp';
import sceneFourteen from './assets/animation/scene14.webp';
import sceneFifteen from './assets/animation/scene15.webp';
import avatar from './assets/avatar.png';

const answerSceneStyle = {
  bottom: '25vh',
  left: '50%',
  width: '580px',
  translate: '-50% 0',
  transform: 'none',
};

const bubbleStyle = {
  bottom: '18vh',
  left: '4vw',
  width: '580px',
  transform: 'none',
};

const sceneFourteenStyle = {
  ...bubbleStyle,
  width: '400px',
};

const sceneFifteenStyle = {
  right: '4vw',
  bottom: '4vh',
  width: '580px',
  transform: 'none',
};

const bottomRightSceneStyle = {
  right: '-3vw',
  bottom: '-2vh',
  width: '580px',
  transform: 'none',
};

const sceneNineStyle = {
  right: '1vw',
  bottom: '0vh',
  width: '430px',
  transform: 'none',
};

const defaultStyle = {
  top: '57%',
  left: '50%',
  width: 'min(44vw, 760px)',
  translate: '-50% -50%',
  transform: 'none',
};

const defaultStandStyle = {
  bottom: '15.5vh',
  left: '0vw',
  width: '27vw',
  transform: 'none',
};

export const CHARACTER_PRESETS = {
  guide: {
    src: sceneOneOnlyHi,
    alt: 'guide d00b',
    style: {
      bottom: '23vh',
      left: '0',
      width: '580px',
      transform: 'none',
    },
  },
  curious: {
    src: sceneTwo,
    alt: 'guide curious',
    style: {
      bottom: '1vh',
      left: '50%',
      width: '580px',
      translate: '-50% 0',
      transform: 'none',
    },
  },
  scene1: {
    src: sceneOne,
    alt: 'guide scene 1',
    style: {
      bottom: '23vh',
      left: '0',
      width: '580px',
      transform: 'none',
    },
  },
  scene1OnlyHi: {
    src: sceneOneOnlyHi,
    alt: 'guide scene 1 hi',
    style: {
      bottom: '23vh',
      left: '0',
      width: '580px',
      transform: 'none',
    },
  },
  scene2: {
    src: sceneTwo,
    alt: 'guide scene 2',
    style: {
      bottom: '1vh',
      left: '50%',
      width: '580px',
      translate: '-50% 0',
      transform: 'none',
    },
  },
  scene3: {
    src: sceneThree,
    alt: 'guide scene 3',
    style: answerSceneStyle,
  },
  scene4: {
    src: sceneFour,
    alt: 'guide scene 4',
    style: answerSceneStyle,
  },
  scene7: {
    src: sceneSeven,
    alt: 'guide scene 7',
    layerClass: 'is-front',
    style: {
      top: '40%',
      left: '50%',
      width: '580px',
      translate: '-50% -50%',
      transform: 'none',
    },
  },
  scene8: {
    src: sceneEight,
    alt: 'guide scene 8',
    layerClass: 'is-front',
    style: {
      right: '0vw',
      bottom: '4vh',
      width: '400px',
      transform: 'none',
    },
  },
  scene9One: {
    src: sceneNineOne,
    alt: 'guide scene 9-1',
    layerClass: 'is-front',
    style: sceneNineStyle,
  },
  scene9: {
    src: sceneNine,
    alt: 'guide scene 9',
    layerClass: 'is-front',
    style: sceneNineStyle,
  },
  scene10: {
    src: sceneTen,
    alt: 'guide scene 10',
    layerClass: 'is-front',
    style: bottomRightSceneStyle,
  },
  scene14: {
    src: sceneFourteen,
    alt: 'guide scene 14',
    layerClass: 'is-front',
    style: sceneFourteenStyle,
  },
  scene15: {
    src: sceneFifteen,
    alt: 'guide scene 15',
    layerClass: 'is-front',
    style: sceneFifteenStyle,
  },
  defaultStand: {
    src: defaultStand,
    alt: 'guide standing',
    layerClass: 'is-front default-character-layer',
    style: defaultStandStyle,
  },
  avatar: {
    src: avatar,
    alt: 'avatar',
    layerClass: 'avatar-layer',
    style: {
      top: '47%',
      left: '50%',
      width: '28vw',
      translate: '-50% -50%',
      transform: 'none',
    },
  },
  avatarSmall: {
    src: avatar,
    alt: 'avatar',
    layerClass: 'avatar-layer',
    style: {
      right: '5vw',
      bottom: '1vh',
      width: '22vw',
      translate: '0 0',
      transform: 'none',
    },
  },
  avatarResult: {
    src: avatar,
    alt: 'avatar',
    layerClass: 'avatar-layer name-result-avatar',
    style: {
      right: '5vw',
      bottom: '2vh',
      width: '25vw',
      translate: '0 0',
      transform: 'none',
    },
  },
  bubbleGuide: {
    src: defaultCharacter,
    alt: 'guide bubble',
    layerClass: 'is-front default-character-layer',
    style: defaultStyle,
  },
};
