import character1 from './assets/animation/greeting.webp';
import standingTalk from './assets/animation/standing_talk.webp';
import sittingTalk from './assets/animation/sitting_talk.webp';
import avatar from './assets/avatar.png';

export const CHARACTER_PRESETS = {
  guide: {
    src: character1,
    alt: '관리자 d00b',
    style: {
      bottom: '23vh',
      left: '0',
      width: '37vw',
      transform: 'none',
    },
  },
  curious: {
    src: standingTalk,
    alt: 'guide curious',
    style: {
      bottom: '1vh',
      left: '50%',
      width: '35vw',
      translate: '-50% 0',
      transform: 'none',
    },
  },
  responseGuide: {
    src: standingTalk,
    alt: 'guide response',
    style: {
      bottom: '8vh',
      left: '50%',
      width: '45vw',
      translate: '-50% 0',
      transform: 'none',
    },
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
    src: sittingTalk,
    alt: 'guide bubble',
    layerClass: 'is-front',
    style: {
      bottom: '34vh',
      left: '4vw',
      width: '27vw',
      transform: 'none',
    },
  },
  inputGuide: {
    src: sittingTalk,
    alt: 'guide input',
    layerClass: 'is-front',
    style: {
      bottom: '4vh',
      right: '5vw',
      width: '18vw',
      transform: 'none',
    },
  },
};
