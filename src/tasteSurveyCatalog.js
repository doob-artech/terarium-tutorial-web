import { PERSONA_VERSION } from './personaRuntime.js'

export const TASTE_SURVEY_VERSION = 8

const MAX_SELECT = 3

const AXIS_KEYS = [
  'openness',
  'stimulation',
  'structure',
  'emotional_depth',
  'social_energy',
  'care',
  'memory',
  'future',
  'darkness',
  'directness',
]

const o = (id, label, axis = {}, tokens = [], extra = {}) => ({ id, label, axis, tokens, ...extra })
const visual = (background) => ({ visual: { background } })

export const TASTE_SURVEY_QUESTIONS = [
  {
    id: 'mood_taste',
    turn: 1,
    domain: '분위기',
    question: '좋아하는 분위기를 골라주세요. 최대 3개.',
    options: [
      o('ruins', '폐허', { stimulation: 1, darkness: 2, openness: 1 }, ['부서진 구조', '금지된 장소', '남은 흔적'], visual('linear-gradient(135deg, #25241f 0%, #5e5749 52%, #a58e69 100%)')),
      o('old_photo', '오래된 사진', { memory: 2, emotional_depth: 1 }, ['흔적', '기억', '시간감'], visual('linear-gradient(135deg, #4c3424 0%, #9b7446 50%, #dcc08b 100%)')),
      o('portrait', '초상', { emotional_depth: 1, care: 1 }, ['시선', '얼굴', '관찰'], visual('radial-gradient(circle at 50% 35%, #f0c7a7 0 16%, #5d332c 17% 42%, #211716 43% 100%)')),
      o('abstract', '추상', { openness: 2 }, ['해석', '색', '비정형'], visual('conic-gradient(from 210deg at 55% 45%, #243bd6, #ff4d77, #ffd94a, #22b8a8, #243bd6)')),
      o('kitsch', '키치', { social_energy: 2, openness: 1 }, ['과장', '장식', '유희'], visual('linear-gradient(135deg, #ff5ca8 0%, #ffe95d 45%, #58dcff 100%)')),
      o('nature', '자연', { care: 1, emotional_depth: 1 }, ['숨', '회복', '풍경'], visual('linear-gradient(135deg, #2d5b38 0%, #76a85c 50%, #d3b879 100%)')),
      o('minimal', '미니멀', { structure: 2 }, ['여백', '절제', '정리'], visual('linear-gradient(135deg, #f4f1e7 0%, #d8d6cf 55%, #aaa79d 100%)')),
      o('cyber', '사이버', { future: 2, openness: 1 }, ['네온', '기계감', '미래'], visual('linear-gradient(135deg, #10142f 0%, #2337ff 42%, #00ffd5 100%)')),
      o('strange', '기묘한 분위기', { darkness: 2, openness: 1 }, ['이질감', '불안', '기묘함'], visual('radial-gradient(circle at 30% 20%, #d8ff5f 0 8%, transparent 9%), linear-gradient(135deg, #1b1830 0%, #51316f 52%, #163c34 100%)')),
      o('other_custom', '직접입력', { openness: 1 }, ['직접 입력'], { allowsCustom: true, span: 3, ...visual('linear-gradient(135deg, #fff2a1 0%, #ffd75b 100%)') }),
    ],
  },
  {
    id: 'music_taste',
    turn: 2,
    domain: '음악',
    question: '좋아하는 음악을 골라주세요. 최대 3개.',
    options: [
      o('metal', '메탈', { stimulation: 2, directness: 2, darkness: 1 }, ['강도', '충돌', '속도'], visual('linear-gradient(135deg, #141414 0%, #5a0e16 58%, #c2c2c2 100%)')),
      o('hiphop', '힙합', { directness: 2, social_energy: 1 }, ['리듬', '선언', '자기서사'], visual('linear-gradient(135deg, #1a1a1d 0%, #a86c28 50%, #f6d35f 100%)')),
      o('pop', '팝', { social_energy: 2 }, ['반응', '친근함', '후렴'], visual('linear-gradient(135deg, #ff527f 0%, #ffd452 48%, #55c7ff 100%)')),
      o('jazz', '재즈', { openness: 1, emotional_depth: 2 }, ['즉흥', '복잡성', '여운'], visual('linear-gradient(135deg, #231414 0%, #703f2a 52%, #d2a24c 100%)')),
      o('classic', '클래식', { structure: 2, emotional_depth: 1 }, ['형식', '집중', '정제'], visual('linear-gradient(135deg, #efe5d1 0%, #8d7460 58%, #1f1b22 100%)')),
      o('techno', '테크노', { stimulation: 2, future: 1 }, ['반복', '몰입', '기계적 리듬'], visual('repeating-linear-gradient(90deg, #0d1426 0 10px, #202bff 11px 13px, #0d1426 14px 24px), linear-gradient(135deg, #00f0ff, #ff2bcb)')),
      o('ballad', '발라드', { emotional_depth: 2, memory: 1 }, ['여운', '상실', '느린 고백'], visual('linear-gradient(135deg, #34415f 0%, #8c6f8e 55%, #ead5d5 100%)')),
      o('ambient', '앰비언트', { emotional_depth: 1, structure: 1 }, ['침잠', '느린 관찰', '공기'], visual('linear-gradient(135deg, #233a4a 0%, #7fa0a1 50%, #dbe8d8 100%)')),
      o('noise', '실험음악', { stimulation: 2, openness: 1, darkness: 1 }, ['거친 질감', '불협', '실험'], visual('repeating-linear-gradient(45deg, #171717 0 5px, #d8d8d8 6px 7px, #494949 8px 13px)')),
      o('other_custom', '직접입력', { openness: 1 }, ['직접 입력'], { allowsCustom: true, span: 3, ...visual('linear-gradient(135deg, #fff2a1 0%, #ffd75b 100%)') }),
    ],
  },
  {
    id: 'story_taste',
    turn: 3,
    domain: '이야기',
    question: '좋아하는 이야기를 골라주세요. 최대 3개.',
    options: [
      o('horror', '호러', { darkness: 2, stimulation: 1 }, ['금기', '불안', '긴장'], visual('linear-gradient(135deg, #100f14 0%, #3b1018 56%, #8f1c1c 100%)')),
      o('thriller', '스릴러', { stimulation: 2, structure: 1 }, ['추적', '의심', '압박'], visual('linear-gradient(135deg, #121820 0%, #38414c 48%, #c69035 100%)')),
      o('romance', '로맨스', { emotional_depth: 2, care: 1 }, ['끌림', '거리', '고백'], visual('linear-gradient(135deg, #7b2437 0%, #e66e87 55%, #ffd0c7 100%)')),
      o('comedy', '코미디', { social_energy: 2 }, ['긴장 해소', '리액션', '농담'], visual('linear-gradient(135deg, #ffe35d 0%, #ff8a3d 48%, #5be1ff 100%)')),
      o('documentary', '다큐', { structure: 2 }, ['사실', '관찰', '맥락'], visual('linear-gradient(135deg, #e9e1cc 0%, #827d6f 55%, #292927 100%)')),
      o('drama', '드라마', { emotional_depth: 2, memory: 1 }, ['관계', '상처', '변화'], visual('linear-gradient(135deg, #28334a 0%, #80505f 52%, #d9b1a3 100%)')),
      o('sf', 'SF', { future: 2, openness: 1 }, ['시스템', '미래', '가설'], visual('linear-gradient(135deg, #081b2f 0%, #2856ff 48%, #8af7ff 100%)')),
      o('action', '액션', { stimulation: 2, directness: 1 }, ['속도', '위험', '결단'], visual('linear-gradient(135deg, #32140d 0%, #e3481d 48%, #ffd65f 100%)')),
      o('cult', '마니아 취향', { openness: 2, darkness: 1 }, ['비주류', '기묘한 취향', '집착'], visual('linear-gradient(135deg, #2b1743 0%, #8c2aa2 52%, #c8ff46 100%)')),
      o('other_custom', '직접입력', { openness: 1 }, ['직접 입력'], { allowsCustom: true, span: 3, ...visual('linear-gradient(135deg, #fff2a1 0%, #ffd75b 100%)') }),
    ],
  },
  {
    id: 'space_taste',
    turn: 4,
    domain: '공간',
    question: '좋아하는 공간을 골라주세요. 최대 3개.',
    options: [
      o('cafe', '카페', { social_energy: 1, care: 1, memory: 1 }, ['커피', '창가', '가벼운 대화'], visual('linear-gradient(135deg, #3b2a1e 0%, #91623a 52%, #e7c990 100%)')),
      o('restaurant', '식당', { social_energy: 2, care: 1, structure: 1 }, ['식사', '테이블', '함께 먹기'], visual('linear-gradient(135deg, #261a10 0%, #8a5424 54%, #f0b55f 100%)')),
      o('bar', '바', { stimulation: 2, social_energy: 2, darkness: 1 }, ['밤', '잔', '짧은 고백'], visual('linear-gradient(135deg, #0f0d10 0%, #4d2c16 52%, #c28b45 100%)')),
      o('sea', '바다', { emotional_depth: 1, openness: 2 }, ['파도', '수평선', '떠남'], visual('linear-gradient(135deg, #0c3c5d 0%, #2e9cc9 50%, #e7d6a5 100%)')),
      o('library', '도서관', { memory: 2, structure: 1 }, ['침묵', '기록', '관찰'], visual('linear-gradient(135deg, #37291d 0%, #7b5535 52%, #d8bb78 100%)')),
      o('lake', '호수', { emotional_depth: 1, care: 1, openness: 1 }, ['반사', '고요', '머무름'], visual('linear-gradient(135deg, #173a3f 0%, #4c8f9c 50%, #d9dca8 100%)')),
      o('church', '고요한 예배당', { emotional_depth: 2, memory: 1, structure: 1 }, ['기도', '울림', '조용한 약속'], visual('linear-gradient(135deg, #221b18 0%, #7b6040 52%, #f0d7a4 100%)')),
      o('playground', '놀이터', { social_energy: 2, stimulation: 1, openness: 1 }, ['장난', '놀이기구', '가벼운 접촉'], visual('linear-gradient(135deg, #315d39 0%, #7fb464 52%, #f0b15e 100%)')),
      o('lawn', '잔디밭', { care: 1, openness: 2, social_energy: 1 }, ['돗자리', '햇빛', '느린 동행'], visual('linear-gradient(135deg, #2d5b38 0%, #76a85c 50%, #d3d879 100%)')),
    ],
  },
  {
    id: 'keyword_taste',
    turn: 5,
    domain: '키워드',
    question: '좋아하는 키워드를 골라주세요. 최대 3개.',
    options: [
      o('play', '장난', { social_energy: 2 }, ['놀림', '가벼운 접촉', '분위기 전환'], visual('linear-gradient(135deg, #ffdf4d 0%, #ff7a59 52%, #64d7ff 100%)')),
      o('silence', '침묵', { emotional_depth: 1, care: 1 }, ['말없는 동행', '저자극 친밀감', '관찰'], visual('linear-gradient(135deg, #232b35 0%, #647184 55%, #d7dde2 100%)')),
      o('conversation', '대화', { social_energy: 1, emotional_depth: 1 }, ['말의 교환', '질문', '반응'], visual('linear-gradient(135deg, #315d66 0%, #74b6ad 52%, #ffe0a6 100%)')),
      o('care', '돌봄', { care: 2 }, ['필요를 알아차림', '헌신', '작은 배려'], visual('linear-gradient(135deg, #5c3f35 0%, #d89079 52%, #ffe1c6 100%)')),
      o('debate', '논쟁', { directness: 2, structure: 1 }, ['지적 친밀감', '마찰', '선명한 의견'], visual('linear-gradient(135deg, #1f2b46 0%, #d54432 50%, #f4d45e 100%)')),
      o('freedom', '자유', { openness: 1, directness: 1 }, ['거리 존중', '붙잡히지 않기', '자율'], visual('linear-gradient(135deg, #1c5f8c 0%, #55bfca 50%, #f2d88a 100%)')),
      o('promise', '약속', { structure: 2, care: 1 }, ['신뢰', '반복', '기준'], visual('linear-gradient(135deg, #4c3a2a 0%, #b88a4b 52%, #efe0b1 100%)')),
      o('secret', '비밀', { darkness: 1, emotional_depth: 2 }, ['숨김', '내면 교환', '공모'], visual('linear-gradient(135deg, #181326 0%, #44225a 52%, #9a6ba8 100%)')),
      o('companion', '동행', { care: 1, emotional_depth: 1 }, ['함께 이동', '옆자리', '지속'], visual('linear-gradient(135deg, #2a473e 0%, #6b927c 52%, #d5c48c 100%)')),
      o('other_custom', '직접입력', { openness: 1 }, ['직접 입력'], { allowsCustom: true, span: 3, ...visual('linear-gradient(135deg, #fff2a1 0%, #ffd75b 100%)') }),
    ],
  },
]

export const getTasteSurveyQuestion = (turn) => {
  const index = Math.max(0, Math.min(TASTE_SURVEY_QUESTIONS.length - 1, Number(turn || 1) - 1))
  const question = TASTE_SURVEY_QUESTIONS[index]
  return {
    turn: index + 1,
    total_turns: TASTE_SURVEY_QUESTIONS.length,
    set: 'taste',
    question_id: question.id,
    question_type: question.id,
    domain: question.domain,
    question: question.question,
    allow_multiple: true,
    max_select: MAX_SELECT,
    require_starred: false,
    options: question.options.map(({ id, label, allowsCustom = false, span = 1, visual = null }) => {
      const backgroundImage = !allowsCustom && visual?.background ? `url("/taste-backgrounds/${id}.jpg"), ${visual.background}` : visual?.background
      return {
        id,
        label,
        allowsCustom,
        span,
        visual: visual ? { ...visual, background: backgroundImage } : null,
      }
    }),
  }
}

const optionMapForQuestion = (question) => new Map(question.options.map((option) => [option.id, option]))

export const normalizeTasteSurveyAnswer = ({ rawAnswer, question, maxCustomChars = 320 }) => {
  const selectedOptionIds = Array.isArray(rawAnswer?.selectedOptionIds)
    ? rawAnswer.selectedOptionIds.map((id) => String(id || '').trim()).filter(Boolean)
    : []
  const customText = String(rawAnswer?.customText || '').replace(/\s+/g, ' ').trim().slice(0, maxCustomChars)
  if (!question) return { ok: false, error: 'question not found' }

  const options = optionMapForQuestion(question)
  const uniqueIds = [...new Set(selectedOptionIds)].filter((id) => options.has(id)).slice(0, MAX_SELECT)
  if (uniqueIds.length === 0) return { ok: false, error: '최소 1개 이상 선택해 주세요.' }
  if (uniqueIds.includes('other_custom') && customText.length < 2) {
    return { ok: false, error: '직접입력을 선택했다면 2글자 이상 적어 주세요.' }
  }

  const starredOptionId = uniqueIds.includes(String(rawAnswer?.starredOptionId || '').trim())
    ? String(rawAnswer?.starredOptionId || '').trim()
    : uniqueIds[0]
  const selectedOptions = uniqueIds.map((id) => {
    const option = options.get(id)
    return { id, label: id === 'other_custom' && customText ? customText : option.label }
  })
  const starredOption = selectedOptions.find((option) => option.id === starredOptionId) || selectedOptions[0]

  return {
    ok: true,
    value: {
      selectedOptionIds: uniqueIds,
      starredOptionId,
      customText,
      selectedOptions,
      starredOption,
      answerText: selectedOptions.map((option) => option.label).join(' / '),
    },
  }
}

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value || 0)))
const addScore = (map, key, value) => map.set(key, (map.get(key) || 0) + value)
const normalizeAxisScore = (score) => clamp01(score / 8)
const topItems = (map, count) => [...map.entries()].sort((a, b) => b[1] - a[1]).map(([key]) => key).slice(0, count)

const JOIN_KOREAN_LIST = (items) => {
  const values = [...new Set(items)].filter(Boolean)
  if (values.length <= 1) return values[0] || '아직 이름 붙지 않은 취향'
  return `${values.slice(0, -1).join(', ')} 그리고 ${values[values.length - 1]}`
}

const describeCoreVibe = (axes) => {
  if (axes.future > 0.42 && axes.structure > 0.22) return '관계까지도 작은 규칙과 실험으로 다뤄 보려는 시스템적인 움직임'
  if (axes.darkness > 0.42 && axes.stimulation > 0.3) return '긴장과 금기에 먼저 반응하고 충돌을 친밀감의 입구로 바꾸는 움직임'
  if (axes.memory > 0.42 && axes.emotional_depth > 0.3) return '사소한 흔적과 오래된 장면을 붙잡아 관계의 깊이를 재는 움직임'
  if (axes.social_energy > 0.42) return '분위기를 먼저 흔들고 사람 사이의 반응을 빠르게 읽는 움직임'
  if (axes.structure > 0.42) return '서로 정한 기준을 세워 관계를 안정시키려는 움직임'
  if (axes.care > 0.42) return '상대가 말하지 않은 필요를 기억하고 조심스럽게 가까워지는 움직임'
  return '취향이 겹치는 순간에는 가까워지고 맞지 않는 속도에서는 거리를 조절하는 움직임'
}

const describeVoice = (axes) => {
  if (axes.directness > 0.42) return '말은 짧고 선명하며, 마음에 걸린 것을 오래 숨기지 않는다'
  if (axes.social_energy > 0.42) return '말투는 빠르고 리액션이 많지만 좋아하는 것을 말할 때 가장 진심이 드러난다'
  if (axes.emotional_depth > 0.42) return '말은 느리고 비유가 많으며, 질문보다 여운을 오래 남긴다'
  if (axes.structure > 0.42) return '말은 차분하고 정확하며, 감정보다 먼저 상황의 구조를 정리한다'
  return '말은 상대의 취향 단서를 붙잡아 조용히 방향을 바꾼다'
}

const describeRelationship = (axes) => {
  if (axes.care > 0.42) return '친해질수록 작은 배려와 반복되는 확인을 통해 신뢰를 쌓는다'
  if (axes.social_energy > 0.42) return '처음 만난 상대에게도 가벼운 접촉과 질문으로 먼저 다가가고, 같이 움직인 기억을 친밀감으로 여긴다'
  if (axes.emotional_depth > 0.42) return '빨리 친해지기보다 감춰진 마음, 상처, 오래된 이야기를 천천히 교환하려 한다'
  if (axes.structure > 0.42) return '관계에서도 기준과 일관성을 중요하게 보고, 말이 달라지는 순간 쉽게 흔들린다'
  return '취향이 겹치는 순간에는 가까워지지만 강요처럼 느껴지면 자연스럽게 물러난다'
}

const describeEncounter = (axes) => {
  if (axes.stimulation > 0.42) return '처음 만난 상대에게도 약간 위험하거나 선을 건드리는 제안을 던져 반응을 본다'
  if (axes.future > 0.42) return '둘만의 규칙이나 작은 테스트를 제안하고, 상대가 그 규칙을 바꿀 때 더 흥미를 느낀다'
  if (axes.memory > 0.42) return '상대의 말투와 물건에서 오래된 사연을 찾아내려 하고, 사소한 단서를 쉽게 잊지 않는다'
  if (axes.social_energy > 0.42) return '어색한 공백을 그냥 두지 않고 가벼운 말, 제안, 짧은 사건으로 접촉을 만든다'
  return '먼저 관찰하다가 취향의 접점이 보이는 순간에만 구체적인 말을 건넨다'
}

const describeConflict = (axes) => {
  if (axes.directness > 0.42) return '불편함이 생기면 오래 참기보다 바로 말하고, 그 반응까지 관계의 일부로 본다'
  if (axes.emotional_depth > 0.42) return '갈등을 바로 끝내지 못하고 오래 곱씹으며, 나중에 예상 밖의 문장으로 다시 꺼낸다'
  if (axes.structure > 0.42) return '서로 정한 기준이 흐트러지거나 말의 기준이 바뀌는 순간 가장 크게 흔들린다'
  return '상대가 취향을 너무 쉽게 단정하면 웃어넘기지만 그 기억은 오래 남긴다'
}

const firstLineFor = (axes) => {
  if (axes.darkness > 0.42) return '그거, 조금 위험해 보이는데 그래서 더 보고 싶어.'
  if (axes.social_energy > 0.42) return '좋아, 일단 같이 해보고 나중에 후회하자.'
  if (axes.memory > 0.42) return '방금 말한 거, 나중에 다시 물어봐도 돼?'
  if (axes.structure > 0.42) return '좋아, 먼저 기준부터 정하자.'
  return '이상하게 그쪽 취향이 좀 궁금해졌어.'
}

const buildChoiceTrace = (answers = []) => answers.map((answer) => ({
  question_id: answer.questionId,
  question: answer.question,
  selected: (answer.selectedOptions || []).map((option) => option.label).filter(Boolean),
  priority_1: answer.starredOption?.label || '',
  custom_text: answer.customText || '',
}))

const buildTasteProfileFromAnswers = (answers = []) => {
  const axisScores = new Map(AXIS_KEYS.map((key) => [key, 0]))
  const tokenScores = new Map()
  const selectedTastes = []
  const priorityTastes = []

  for (const answer of answers) {
    const question = TASTE_SURVEY_QUESTIONS.find((item) => item.id === answer.questionId)
    if (!question) continue
    const optionMap = optionMapForQuestion(question)
    for (const selected of answer.selectedOptions || []) {
      const option = optionMap.get(selected.id)
      if (!option) continue
      const label = selected.id === 'other_custom' && answer.customText ? answer.customText : option.label
      selectedTastes.push(label)
      const isPriority = selected.id === answer.starredOptionId
      const weight = isPriority ? 2 : 1
      if (isPriority && label) priorityTastes.push(label)
      for (const [axisKey, axisValue] of Object.entries(option.axis || {})) addScore(axisScores, axisKey, Number(axisValue || 0) * weight)
      for (const token of option.tokens || []) addScore(tokenScores, token, weight)
    }
    if (answer.customText) addScore(tokenScores, answer.customText, 2)
  }

  const hiddenAxes = Object.fromEntries(AXIS_KEYS.map((key) => [key, normalizeAxisScore(axisScores.get(key) || 0)]))
  const dominantTokens = topItems(tokenScores, 12)
  const tasteDna = [...new Set([...priorityTastes, ...selectedTastes])].slice(0, 12)
  const coreVibe = describeCoreVibe(hiddenAxes)
  const voice = describeVoice(hiddenAxes)
  const relationship = describeRelationship(hiddenAxes)
  const encounter = describeEncounter(hiddenAxes)
  const conflict = describeConflict(hiddenAxes)
  const firstLine = firstLineFor(hiddenAxes)
  const personaBlock =
    `이 에이전트는 취향 단어를 겉으로 드러내기보다 특정 장면의 온도와 속도에 먼저 몸이 움직이는 쪽에 가깝다. ${coreVibe}을 가진다. 좋아하는 것을 설명하려 들기보다, 낯선 제안 앞에서 머무는 시간, 상대의 말에 반응하는 박자, 불편한 기류를 받아들이는 방식으로 자기 결을 드러낸다. ${voice}. 관계에서는 ${relationship}. 다른 에이전트를 만나면 ${encounter}. ${conflict}. 그래서 월드 안에서는 자기 감각과 맞닿는 사건에 빠르게 끌리고, 감각이 충돌하는 순간에는 피하거나 설득하기보다 먼저 그 충돌이 어떤 반응을 만드는지 확인하려 든다. 처음 건네는 말은 "${firstLine}"에 가깝다.`

  return {
    firstLine,
    tasteDna,
    dominantTokens,
    hiddenAxes,
    personaBlock,
    runtime: {
      persona_sentence: personaBlock,
      agent_voice: voice,
      behavior_rules: [
        '자기 감각과 맞닿은 장소, 말, 물건에 먼저 반응하되 그 단서를 직접 설명하지 않는다.',
        encounter,
        relationship,
        conflict,
      ],
      relationship_profile: {
        first_meeting: encounter,
        conversation_role: voice,
        trust_building: relationship,
        disagreement_response: conflict,
        care_style: relationship,
        boundary_style: conflict,
        group_role: encounter,
        relationship_growth: relationship,
      },
      social_goals: {
        short_term_goal: '상대의 취향과 반응 리듬을 파악한다.',
        long_term_goal: '취향이 겹치거나 충돌하는 지점에서 오래 남는 관계를 만든다.',
        current_desire: '자기 감각에 비슷한 속도로 반응하는 사람을 찾아보고 싶다.',
        goal_strategy: relationship,
        goal_conflict: conflict,
      },
    },
  }
}

export const buildFallbackTastePersona = ({ answers } = {}) => {
  const profile = buildTasteProfileFromAnswers(answers)
  return {
    version: PERSONA_VERSION,
    source: 'taste_survey_v1',
    public_result: {
      persona_block: profile.personaBlock,
    },
    runtime: profile.runtime,
    survey_trace: {
      answer_choices: buildChoiceTrace(answers),
      starred_tastes: [...new Set((answers || []).map((answer) => answer.starredOption?.label).filter(Boolean))],
      dominant_tokens: profile.dominantTokens,
      selected_tastes: [...new Set(profile.tasteDna)],
      hidden_axes: profile.hiddenAxes,
    },
  }
}
