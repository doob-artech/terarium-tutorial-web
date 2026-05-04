export const SOCIAL_PERSONA_VERSION = 'social_persona_v1';
export const SOCIAL_PERSONA_PROMPT_VERSION = 'social_persona_prompt_v1';

const PARAM_KEYS = [
  'approach_level',
  'listening_level',
  'self_disclosure_level',
  'conflict_directness',
  'repair_tendency',
  'care_initiative',
  'boundary_clarity',
  'group_initiative',
  'humor_level',
  'trust_growth_speed',
  'emotional_visibility',
];

function isObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export const CORE_SOCIAL_QUESTIONS = [
  {
    axis: 'first_meeting_style',
    key: 'first_meeting_style',
    variants: [
      '처음 만난 사람과 함께 있으면 나는 보통?',
      '낯선 사람과 같은 자리에 있으면 나는?',
      '처음 보는 사람과 대화를 시작할 때 나는?',
    ],
    options: [
      { label: '먼저 말을 걸어본다', value: 'initiates' },
      { label: '상대가 말할 때까지 기다린다', value: 'waits' },
      { label: '주변 분위기를 먼저 살핀다', value: 'reads_mood' },
      { label: '가벼운 농담이나 인사로 시작한다', value: 'light_joke' },
      { label: '필요한 말만 짧게 한다', value: 'minimal' },
      { label: '같이 있는 사람을 자연스럽게 챙긴다', value: 'caretaking' },
    ],
  },
  {
    axis: 'conversation_role',
    key: 'conversation_role',
    variants: [
      '대화가 이어질 때 나는 어떤 쪽에 가까운가요?',
      '대화 속에서 나는 보통 어떤 역할을 하나요?',
      '말이 오갈 때 나는 어느 쪽에 가까운가요?',
    ],
    options: [
      { label: '이야기를 많이 꺼낸다', value: 'storyteller' },
      { label: '상대의 이야기를 잘 들어준다', value: 'listener' },
      { label: '질문을 하며 이어간다', value: 'questioner' },
      { label: '공감이나 리액션을 자주 한다', value: 'reactor' },
      { label: '생각한 뒤 천천히 말한다', value: 'reflective' },
      { label: '분위기가 어색하지 않게 도와준다', value: 'mood_keeper' },
    ],
  },
  {
    axis: 'disagreement_style',
    key: 'disagreement_style',
    variants: [
      '의견이 다를 때 나는 보통?',
      '상대와 생각이 다르면 나는?',
      '서로 다른 의견이 나오면 나는?',
    ],
    options: [
      { label: '내 생각을 분명히 말한다', value: 'direct' },
      { label: '상대의 말을 먼저 들어본다', value: 'listen_first' },
      { label: '중간 지점을 찾으려 한다', value: 'mediate' },
      { label: '잠깐 거리를 두고 생각한다', value: 'step_back' },
      { label: '분위기가 상하지 않게 돌려 말한다', value: 'soften' },
      { label: '가볍게 넘기고 다음 이야기로 간다', value: 'move_on' },
    ],
  },
  {
    axis: 'care_style',
    key: 'care_style',
    variants: [
      '누군가 힘들어 보이면 나는?',
      '상대가 기운 없어 보일 때 나는?',
      '곁에 있는 사람이 어려워 보이면 나는?',
    ],
    options: [
      { label: '바로 괜찮은지 물어본다', value: 'ask_directly' },
      { label: '조용히 곁에 있어준다', value: 'quiet_presence' },
      { label: '해결 방법을 같이 찾아본다', value: 'problem_solve' },
      { label: '기분이 풀리게 말을 건넨다', value: 'cheer_up' },
      { label: '상대가 말할 때까지 기다린다', value: 'wait_until_ready' },
      { label: '작은 도움을 행동으로 해준다', value: 'practical_help' },
    ],
  },
];

export const OPTIONAL_SOCIAL_QUESTIONS = [
  {
    axis: 'trust_basis',
    key: 'trust_basis',
    variants: ['친해지는 데 중요한 것은?', '사람을 믿게 되는 데 중요한 것은?', '관계가 편해지는 계기는?'],
    options: [
      { label: '자주 보는 것', value: 'frequency' },
      { label: '솔직하게 말하는 것', value: 'honesty' },
      { label: '서로 웃을 수 있는 것', value: 'humor' },
      { label: '조용히 편한 것', value: 'comfort' },
      { label: '약속을 잘 지키는 것', value: 'reliability' },
      { label: '취향이나 관심사가 통하는 것', value: 'shared_interest' },
    ],
  },
  {
    axis: 'boundary_style',
    key: 'boundary_style',
    variants: ['내가 혼자 있고 싶을 때는?', '잠깐 거리가 필요할 때 나는?', '혼자 회복하고 싶을 때 나는?'],
    options: [
      { label: '솔직히 혼자 있고 싶다고 말한다', value: 'direct_boundary' },
      { label: '조용히 자리를 피한다', value: 'quietly_leave' },
      { label: '연락이나 대화를 조금 줄인다', value: 'reduce_contact' },
      { label: '그래도 예의 있게 반응한다', value: 'polite_response' },
      { label: '좋아하는 일을 하며 회복한다', value: 'self_recharge' },
      { label: '혼자 있고 싶어도 티를 잘 내지 않는다', value: 'hides_need' },
    ],
  },
  {
    axis: 'group_role',
    key: 'group_role',
    variants: ['여러 사람이 함께 있을 때 나는?', '사람이 여럿 모이면 나는?', '여럿이 있는 자리에서 나는?'],
    options: [
      { label: '대화를 이끈다', value: 'leader' },
      { label: '조용히 듣는다', value: 'quiet_observer' },
      { label: '빠진 사람이 없게 챙긴다', value: 'includer' },
      { label: '재밌는 분위기를 만든다', value: 'entertainer' },
      { label: '필요한 정보를 정리한다', value: 'organizer' },
      { label: '마음에 맞는 한두 사람과 깊게 말한다', value: 'deep_pair' },
    ],
  },
  {
    axis: 'repair_style',
    key: 'repair_style',
    variants: ['사이가 어색해졌을 때 나는?', '관계에 작은 삐걱거림이 생기면 나는?', '대화 뒤 어색함이 남으면 나는?'],
    options: [
      { label: '먼저 말을 꺼내본다', value: 'initiates_repair' },
      { label: '조금 기다렸다가 풀어본다', value: 'wait_then_repair' },
      { label: '가볍게 농담으로 풀어본다', value: 'humor_repair' },
      { label: '무슨 일이었는지 차분히 말한다', value: 'talk_it_through' },
      { label: '상대가 편해질 때까지 기다린다', value: 'give_space' },
      { label: '작은 행동으로 미안함을 전한다', value: 'practical_repair' },
    ],
  },
  {
    axis: 'silence_style',
    key: 'silence_style',
    variants: ['대화 중 조용한 시간이 생기면 나는?', '말이 잠깐 끊기면 나는?', '둘 사이에 침묵이 생기면 나는?'],
    options: [
      { label: '새로운 이야기를 꺼낸다', value: 'fills_silence' },
      { label: '조용해도 괜찮다고 느낀다', value: 'comfortable_silence' },
      { label: '상대가 불편한지 살핀다', value: 'checks_comfort' },
      { label: '가볍게 웃거나 리액션한다', value: 'soft_reaction' },
      { label: '질문을 하나 던져본다', value: 'asks_question' },
      { label: '주변을 보며 자연스럽게 넘긴다', value: 'shifts_attention' },
    ],
  },
  {
    axis: 'closeness_pace',
    key: 'closeness_pace',
    variants: ['사람과 가까워지는 속도는?', '관계가 가까워질 때 나는?', '친해지는 흐름은 어떤 쪽인가요?'],
    options: [
      { label: '천천히 가까워진다', value: 'slow_closeness' },
      { label: '잘 맞으면 빨리 가까워진다', value: 'fast_if_matched' },
      { label: '자주 보면서 자연스럽게 가까워진다', value: 'gradual_frequency' },
      { label: '깊은 이야기를 나누면 가까워진다', value: 'deep_talk' },
      { label: '같이 무언가를 하면 가까워진다', value: 'shared_activity' },
      { label: '먼저 다가와 주면 편해진다', value: 'responds_to_approach' },
    ],
  },
  {
    axis: 'humor_style',
    key: 'humor_style',
    variants: ['편한 사람들과 있을 때 웃음은 어떤 쪽인가요?', '가까운 사람 앞에서 유머는?', '편한 자리에서 나는 어떻게 웃음을 만들까요?'],
    options: [
      { label: '장난을 먼저 건다', value: 'starts_play' },
      { label: '상대의 농담에 잘 웃는다', value: 'laughs_along' },
      { label: '말보다 표정으로 웃는다', value: 'subtle_smile' },
      { label: '엉뚱한 말을 가끔 한다', value: 'quirky' },
      { label: '분위기를 밝게 만들려고 한다', value: 'brightens_mood' },
      { label: '조용한 유머를 좋아한다', value: 'dry_gentle_humor' },
    ],
  },
  {
    axis: 'collaboration_style',
    key: 'collaboration_style',
    variants: ['함께 무언가를 할 때 나는?', '같이 일을 맞춰야 할 때 나는?', '둘 이상이 함께 움직일 때 나는?'],
    options: [
      { label: '역할을 나누고 시작한다', value: 'divides_roles' },
      { label: '상대가 편한지 먼저 본다', value: 'checks_others' },
      { label: '필요한 일을 조용히 맡는다', value: 'quiet_worker' },
      { label: '아이디어를 많이 낸다', value: 'idea_giver' },
      { label: '전체 흐름을 정리한다', value: 'organizes_flow' },
      { label: '막히는 부분을 같이 풀어본다', value: 'problem_solver' },
    ],
  },
];

export const FINAL_SOCIAL_QUESTION = {
  axis: 'social_amplification',
  key: 'social_amplification',
  variants: ['이 에이전트가 당신을 닮되, 하나 더 가져도 된다면?'],
  options: [
    { label: '조금 더 솔직하게', value: 'more_direct' },
    { label: '조금 더 다정하게', value: 'warmer' },
    { label: '조금 더 용감하게', value: 'braver' },
    { label: '조금 더 차분하게', value: 'calmer' },
    { label: '조금 더 유쾌하게', value: 'more_playful' },
    { label: '지금의 나와 최대한 비슷하게', value: 'faithful' },
  ],
};

export function seededRandom(seed) {
  let h = 2166136261;
  const text = String(seed || 'social_persona_seed');
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return () => {
    h += 0x6D2B79F5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickRandomItems(items, count, rand) {
  const copied = [...items];
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied.slice(0, count);
}

function materializeQuestion(question, turn, rand) {
  const variants = Array.isArray(question.variants) && question.variants.length > 0 ? question.variants : [question.question || question.key];
  return {
    turn,
    set: 'social_persona',
    question_type: question.key,
    key: question.key,
    axis: question.axis,
    question: variants[Math.floor(rand() * variants.length)],
    options: question.options.map((option) => ({ ...option })),
  };
}

export function buildQuestionSet(personaSeed) {
  const rand = seededRandom(`${personaSeed}:questions`);
  const optional = pickRandomItems(OPTIONAL_SOCIAL_QUESTIONS, 3, rand);
  const questions = [...CORE_SOCIAL_QUESTIONS, ...optional, FINAL_SOCIAL_QUESTION]
    .map((question, index) => materializeQuestion(question, index + 1, rand));
  return {
    question_set_id: `social_qset_${questions.map((item) => item.key).join('_')}`,
    persona_seed: String(personaSeed || ''),
    randomized_question_axes: optional.map((item) => item.axis),
    questions,
  };
}

export const DEFAULT_SOCIAL_DYNAMICS = Object.freeze({
  approach_level: 0.5,
  listening_level: 0.5,
  self_disclosure_level: 0.5,
  conflict_directness: 0.5,
  repair_tendency: 0.5,
  care_initiative: 0.5,
  boundary_clarity: 0.5,
  group_initiative: 0.5,
  humor_level: 0.5,
  trust_growth_speed: 0.5,
  emotional_visibility: 0.5,
});

export const SOCIAL_PARAM_PATCHES = {
  first_meeting_style: {
    initiates: { approach_level: 0.85, self_disclosure_level: 0.55, group_initiative: 0.65 },
    waits: { approach_level: 0.25, listening_level: 0.75, emotional_visibility: 0.35 },
    reads_mood: { approach_level: 0.35, listening_level: 0.75, emotional_visibility: 0.35 },
    light_joke: { approach_level: 0.7, humor_level: 0.8, emotional_visibility: 0.6 },
    minimal: { approach_level: 0.25, self_disclosure_level: 0.25, emotional_visibility: 0.25 },
    caretaking: { approach_level: 0.6, care_initiative: 0.85, listening_level: 0.65 },
  },
  conversation_role: {
    storyteller: { self_disclosure_level: 0.8, emotional_visibility: 0.7, listening_level: 0.45 },
    listener: { listening_level: 0.9, self_disclosure_level: 0.35, approach_level: 0.4 },
    questioner: { approach_level: 0.6, listening_level: 0.75, self_disclosure_level: 0.45 },
    reactor: { emotional_visibility: 0.75, listening_level: 0.7, care_initiative: 0.6 },
    reflective: { listening_level: 0.7, self_disclosure_level: 0.45, emotional_visibility: 0.4 },
    mood_keeper: { repair_tendency: 0.75, humor_level: 0.55, care_initiative: 0.65 },
  },
  trust_basis: {
    frequency: { trust_growth_speed: 0.45 },
    honesty: { self_disclosure_level: 0.7, boundary_clarity: 0.65, trust_growth_speed: 0.6 },
    humor: { humor_level: 0.8, trust_growth_speed: 0.6 },
    comfort: { trust_growth_speed: 0.4, emotional_visibility: 0.35, listening_level: 0.75 },
    reliability: { repair_tendency: 0.75, boundary_clarity: 0.65 },
    shared_interest: { approach_level: 0.55, trust_growth_speed: 0.55 },
  },
  disagreement_style: {
    direct: { conflict_directness: 0.85, boundary_clarity: 0.75 },
    listen_first: { conflict_directness: 0.45, listening_level: 0.85, repair_tendency: 0.7 },
    mediate: { conflict_directness: 0.55, repair_tendency: 0.85 },
    step_back: { conflict_directness: 0.3, repair_tendency: 0.65, emotional_visibility: 0.35 },
    soften: { conflict_directness: 0.35, repair_tendency: 0.75 },
    move_on: { conflict_directness: 0.25, repair_tendency: 0.45, emotional_visibility: 0.4 },
  },
  care_style: {
    ask_directly: { care_initiative: 0.8, approach_level: 0.65 },
    quiet_presence: { care_initiative: 0.65, listening_level: 0.85, emotional_visibility: 0.35 },
    problem_solve: { care_initiative: 0.75, conflict_directness: 0.55 },
    cheer_up: { care_initiative: 0.75, humor_level: 0.65, emotional_visibility: 0.7 },
    wait_until_ready: { care_initiative: 0.55, listening_level: 0.85, boundary_clarity: 0.7 },
    practical_help: { care_initiative: 0.85, emotional_visibility: 0.45 },
  },
  boundary_style: {
    direct_boundary: { boundary_clarity: 0.85, conflict_directness: 0.65 },
    quietly_leave: { boundary_clarity: 0.55, emotional_visibility: 0.3 },
    reduce_contact: { boundary_clarity: 0.45, emotional_visibility: 0.25 },
    polite_response: { boundary_clarity: 0.45, repair_tendency: 0.65 },
    self_recharge: { boundary_clarity: 0.55, emotional_visibility: 0.38 },
    hides_need: { boundary_clarity: 0.25, emotional_visibility: 0.25 },
  },
  group_role: {
    leader: { group_initiative: 0.85, approach_level: 0.75 },
    quiet_observer: { group_initiative: 0.25, listening_level: 0.85, emotional_visibility: 0.35 },
    includer: { group_initiative: 0.65, care_initiative: 0.8, repair_tendency: 0.7 },
    entertainer: { group_initiative: 0.75, humor_level: 0.85, emotional_visibility: 0.75 },
    organizer: { group_initiative: 0.7, repair_tendency: 0.65 },
    deep_pair: { group_initiative: 0.35, self_disclosure_level: 0.65, trust_growth_speed: 0.45 },
  },
  social_amplification: {
    more_direct: { conflict_directness: 0.7, boundary_clarity: 0.75, self_disclosure_level: 0.65 },
    warmer: { care_initiative: 0.75, emotional_visibility: 0.65 },
    braver: { approach_level: 0.6, self_disclosure_level: 0.6, conflict_directness: 0.5 },
    calmer: { repair_tendency: 0.75, emotional_visibility: 0.35 },
    more_playful: { humor_level: 0.8, emotional_visibility: 0.65 },
    faithful: {},
  },
  repair_style: {
    initiates_repair: { repair_tendency: 0.85, approach_level: 0.6 },
    wait_then_repair: { repair_tendency: 0.7, boundary_clarity: 0.55 },
    humor_repair: { repair_tendency: 0.65, humor_level: 0.75 },
    talk_it_through: { repair_tendency: 0.8, conflict_directness: 0.6 },
    give_space: { repair_tendency: 0.55, boundary_clarity: 0.75 },
    practical_repair: { repair_tendency: 0.75, care_initiative: 0.7 },
  },
  silence_style: {
    fills_silence: { approach_level: 0.7, self_disclosure_level: 0.55 },
    comfortable_silence: { listening_level: 0.75, emotional_visibility: 0.35 },
    checks_comfort: { listening_level: 0.8, care_initiative: 0.65 },
    soft_reaction: { emotional_visibility: 0.6, repair_tendency: 0.6 },
    asks_question: { approach_level: 0.65, listening_level: 0.7 },
    shifts_attention: { boundary_clarity: 0.55, emotional_visibility: 0.4 },
  },
  closeness_pace: {
    slow_closeness: { trust_growth_speed: 0.3, boundary_clarity: 0.65 },
    fast_if_matched: { trust_growth_speed: 0.75, self_disclosure_level: 0.65 },
    gradual_frequency: { trust_growth_speed: 0.45, listening_level: 0.65 },
    deep_talk: { self_disclosure_level: 0.7, trust_growth_speed: 0.6 },
    shared_activity: { approach_level: 0.55, trust_growth_speed: 0.55 },
    responds_to_approach: { approach_level: 0.4, listening_level: 0.7 },
  },
  humor_style: {
    starts_play: { humor_level: 0.85, approach_level: 0.65 },
    laughs_along: { humor_level: 0.65, emotional_visibility: 0.6 },
    subtle_smile: { humor_level: 0.45, emotional_visibility: 0.4 },
    quirky: { humor_level: 0.75, self_disclosure_level: 0.55 },
    brightens_mood: { humor_level: 0.75, repair_tendency: 0.7 },
    dry_gentle_humor: { humor_level: 0.6, emotional_visibility: 0.42 },
  },
  collaboration_style: {
    divides_roles: { group_initiative: 0.65, boundary_clarity: 0.65 },
    checks_others: { care_initiative: 0.75, listening_level: 0.75 },
    quiet_worker: { group_initiative: 0.35, care_initiative: 0.65 },
    idea_giver: { group_initiative: 0.7, self_disclosure_level: 0.65 },
    organizes_flow: { group_initiative: 0.75, repair_tendency: 0.65 },
    problem_solver: { care_initiative: 0.7, conflict_directness: 0.55 },
  },
};

const PARAM_BOUNDS_BY_ANSWER = {
  disagreement_style: {
    direct: { conflict_directness: [0.65, 1] },
    step_back: { conflict_directness: [0.15, 0.45] },
    soften: { conflict_directness: [0.2, 0.5] },
    move_on: { conflict_directness: [0.15, 0.45] },
  },
  conversation_role: {
    listener: { listening_level: [0.75, 1] },
    storyteller: { self_disclosure_level: [0.65, 1] },
  },
  first_meeting_style: {
    initiates: { approach_level: [0.65, 1] },
    minimal: { approach_level: [0.1, 0.45] },
    waits: { approach_level: [0.1, 0.45] },
  },
};

export function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function applyBounds(params, answers) {
  const next = { ...params };
  for (const [questionKey, selectedValue] of Object.entries(answers || {})) {
    const bounds = PARAM_BOUNDS_BY_ANSWER[questionKey]?.[selectedValue];
    if (!bounds) continue;
    for (const [paramKey, [min, max]] of Object.entries(bounds)) {
      next[paramKey] = Math.min(max, Math.max(min, next[paramKey]));
    }
  }
  return next;
}

export function buildSocialDynamics(socialAnswers, seed) {
  let params = { ...DEFAULT_SOCIAL_DYNAMICS };
  for (const [questionKey, selectedValue] of Object.entries(socialAnswers || {})) {
    const patch = SOCIAL_PARAM_PATCHES[questionKey]?.[selectedValue];
    if (!patch) continue;
    for (const [paramKey, patchValue] of Object.entries(patch)) {
      params[paramKey] = clamp01((params[paramKey] + patchValue) / 2);
    }
  }

  const rand = seededRandom(`${seed}:dynamics`);
  const jittered = {};
  for (const key of PARAM_KEYS) {
    const delta = (rand() * 2 - 1) * 0.06;
    jittered[key] = clamp01(Number((params[key] + delta).toFixed(3)));
  }

  return applyBounds(jittered, socialAnswers);
}

export function buildSocialTension(socialAnswers, socialDynamics, seed) {
  const params = {
    attention_hunger: 0.45,
    envy_sensitivity: 0.42,
    exclusion_sensitivity: 0.45,
    irritability: 0.42,
    gossip_tendency: 0.4,
    passive_aggression: 0.42,
    sns_leak_likelihood: 0.45,
    apology_delay: 0.45,
    grudge_retention: 0.42,
    drama_seeking: 0.35,
  };
  const answers = socialAnswers || {};
  const d = socialDynamics || DEFAULT_SOCIAL_DYNAMICS;
  const raise = (key, amount) => {
    params[key] = clamp01(params[key] + amount);
  };

  if (answers.conversation_role === 'listener' || answers.group_role === 'quiet_observer') raise('exclusion_sensitivity', 0.18);
  if (answers.first_meeting_style === 'minimal' || answers.first_meeting_style === 'waits') raise('passive_aggression', 0.1);
  if (answers.first_meeting_style === 'light_joke' || answers.humor_style === 'starts_play') raise('attention_hunger', 0.14);
  if (answers.care_style === 'quiet_presence' || answers.first_meeting_style === 'caretaking') {
    raise('grudge_retention', 0.08);
    raise('envy_sensitivity', 0.08);
  }
  if (answers.disagreement_style === 'direct') raise('irritability', 0.18);
  if (answers.disagreement_style === 'soften' || answers.disagreement_style === 'step_back') {
    raise('passive_aggression', 0.16);
    raise('sns_leak_likelihood', 0.14);
  }
  if (answers.group_role === 'entertainer' || answers.social_amplification === 'more_playful') {
    raise('drama_seeking', 0.15);
    raise('attention_hunger', 0.15);
  }
  if (answers.social_amplification === 'more_direct') raise('irritability', 0.08);
  if (answers.social_amplification === 'warmer') raise('envy_sensitivity', 0.08);
  if (answers.boundary_style === 'hides_need' || answers.boundary_style === 'reduce_contact') raise('sns_leak_likelihood', 0.13);
  if (answers.repair_style === 'give_space' || answers.repair_style === 'wait_then_repair') raise('apology_delay', 0.14);

  params.attention_hunger = clamp01((params.attention_hunger + d.emotional_visibility + d.group_initiative) / 3 + 0.12);
  params.exclusion_sensitivity = clamp01((params.exclusion_sensitivity + d.listening_level + (1 - d.group_initiative)) / 3 + 0.08);
  params.passive_aggression = clamp01((params.passive_aggression + (1 - d.conflict_directness) + d.boundary_clarity) / 3);
  params.sns_leak_likelihood = clamp01((params.sns_leak_likelihood + params.passive_aggression + d.emotional_visibility) / 3 + 0.05);

  const rand = seededRandom(`${seed}:tension`);
  return Object.fromEntries(Object.entries(params).map(([key, value]) => {
    const delta = (rand() * 2 - 1) * 0.07;
    return [key, clamp01(Number((value + delta).toFixed(3)))];
  }));
}

const ANSWER_PHRASES = {
  first_meeting_style: {
    initiates: '처음 만난 사람에게 먼저 말을 걸어본다',
    waits: '처음에는 상대가 말할 때까지 기다린다',
    reads_mood: '처음에는 주변 분위기를 먼저 살핀다',
    light_joke: '가벼운 농담이나 인사로 어색함을 푼다',
    minimal: '처음에는 필요한 말만 짧게 한다',
    caretaking: '처음 만난 사람도 자연스럽게 챙긴다',
  },
  conversation_role: {
    storyteller: '대화에서 이야기를 많이 꺼낸다',
    listener: '상대의 이야기를 잘 들어준다',
    questioner: '질문을 하며 대화를 이어간다',
    reactor: '공감과 리액션을 자주 한다',
    reflective: '생각한 뒤 천천히 말한다',
    mood_keeper: '분위기가 어색하지 않게 돕는다',
  },
  disagreement_style: {
    direct: '의견이 다를 때 자기 생각을 분명히 말한다',
    listen_first: '의견이 다를 때 상대의 말을 먼저 듣는다',
    mediate: '의견이 다를 때 중간 지점을 찾으려 한다',
    step_back: '의견이 다를 때 잠깐 거리를 두고 생각한다',
    soften: '의견이 다를 때 분위기가 상하지 않게 돌려 말한다',
    move_on: '의견 차이를 가볍게 넘기고 다음 이야기로 간다',
  },
  care_style: {
    ask_directly: '힘들어 보이는 사람에게 바로 괜찮은지 물어본다',
    quiet_presence: '힘든 사람 곁에 조용히 있어준다',
    problem_solve: '힘든 사람과 해결 방법을 같이 찾는다',
    cheer_up: '기분이 풀리게 말을 건넨다',
    wait_until_ready: '상대가 말할 준비가 될 때까지 기다린다',
    practical_help: '말보다 작은 도움을 행동으로 해준다',
  },
  trust_basis: {
    frequency: '자주 보며 천천히 신뢰를 쌓는다',
    honesty: '솔직한 대화를 통해 신뢰를 쌓는다',
    humor: '서로 웃을 수 있을 때 가까워진다',
    comfort: '조용히 편안한 분위기에서 가까워진다',
    reliability: '약속과 책임을 통해 신뢰를 쌓는다',
    shared_interest: '취향과 관심사가 통할 때 가까워진다',
  },
  boundary_style: {
    direct_boundary: '혼자 있고 싶을 때 솔직히 말한다',
    quietly_leave: '혼자 있고 싶을 때 조용히 자리를 피한다',
    reduce_contact: '혼자 있고 싶을 때 대화와 연락을 조금 줄인다',
    polite_response: '혼자 있고 싶어도 예의 있게 반응한다',
    self_recharge: '혼자 좋아하는 일을 하며 회복한다',
    hides_need: '혼자 있고 싶어도 티를 잘 내지 않는다',
  },
  group_role: {
    leader: '여러 사람 사이에서 대화를 이끈다',
    quiet_observer: '여러 사람 사이에서 조용히 듣고 관찰한다',
    includer: '빠진 사람이 없게 챙긴다',
    entertainer: '재밌는 분위기를 만든다',
    organizer: '필요한 정보를 정리한다',
    deep_pair: '마음에 맞는 한두 사람과 깊게 말한다',
  },
  social_amplification: {
    more_direct: '실제 모습보다 조금 더 솔직하게 표현하는 방향',
    warmer: '실제 모습보다 조금 더 다정하게 반응하는 방향',
    braver: '실제 모습보다 조금 더 용감하게 마음을 표현하는 방향',
    calmer: '실제 모습보다 조금 더 차분하게 반응하는 방향',
    more_playful: '실제 모습보다 조금 더 유쾌하게 반응하는 방향',
    faithful: '지금의 모습과 최대한 비슷한 방향',
  },
};

export function buildSocialSummaryKo(displayName, socialAnswers) {
  const name = String(displayName || '이 에이전트').trim();
  const parts = Object.entries(socialAnswers || {})
    .map(([key, value]) => {
      const mapped = ANSWER_PHRASES[key]?.[value];
      if (mapped) return mapped;
      const freeText = String(value || '').trim();
      if (!freeText) return '';
      return `${key}: "${freeText}"`;
    })
    .filter(Boolean);
  if (parts.length === 0) {
    return `${name}씨는 사람들과 함께 있을 때의 관계 방식이 아직 충분히 정해지지 않았다.`;
  }
  return `${name}씨는 ${parts.join(', ')}. 이 선택들을 바탕으로 관계 속에서 행동하는 에이전트를 생성한다.`;
}

const COLOR_LABELS = {
  black: '검은색',
  dark_brown: '짙은 갈색',
  brown: '갈색',
  light_brown: '연갈색',
  blonde: '금발',
  gray: '회색',
  white: '흰색',
  red: '붉은색',
  orange: '주황색',
  pink: '분홍색',
  blue: '파란색',
  green: '초록색',
  purple: '보라색',
  navy: '남색',
  beige: '베이지색',
  yellow: '노란색',
  multicolor: '여러 색',
};

const VALUE_LABELS = {
  short_cut: '쇼트컷',
  crew_cut: '짧은 머리',
  two_block: '투블럭',
  dandy_cut: '댄디컷',
  pomade: '포마드 머리',
  bob_straight: '단발 생머리',
  bob_c_curl: 'C컬 단발',
  long_straight: '긴 생머리',
  long_wave: '긴 웨이브 머리',
  ponytail_high: '높게 묶은 머리',
  ponytail_low: '낮게 묶은 머리',
  pigtails: '양갈래 머리',
  half_up: '반묶음 머리',
  bun: '묶어 올린 머리',
  hime_cut: '히메컷',
  center: '가운데 가르마',
  left: '왼쪽 가르마',
  right: '오른쪽 가르마',
  none: '없음',
  see_through: '시스루 앞머리',
  full_bang: '풀뱅 앞머리',
  upturned_cat_eyes: '올라간 눈매',
  round_dog_eyes: '둥근 눈매',
  narrow_long_eyes: '가늘고 긴 눈매',
  smiling_crescent_eyes: '웃는 듯한 눈매',
  sleepy_eyes: '졸린 듯한 눈매',
  dark_circles_eyes: '다크서클이 보이는 눈가',
  flat: '차분한 입매',
  closed_smile: '닫힌 미소',
  big_smile: '큰 미소',
  pout: '도톰한 입매',
  smirk: '옅은 미소',
  w_shape: 'W자 입매',
  surprised: '놀란 듯한 입모양',
  short_sleeve_tshirt: '반팔 티셔츠',
  long_sleeve_tshirt: '긴팔 티셔츠',
  shirt: '셔츠',
  hoodie: '후드티',
  casual_zip_jacket: '캐주얼 집업',
  wide_long_pants: '넓은 긴 바지',
  shorts: '반바지',
  long_skirt: '긴 치마',
  short_skirt: '짧은 치마',
  sneakers: '운동화',
  round: '둥근 안경',
  square: '각진 안경',
};

function label(value) {
  if (!value || value === 'unknown') return '';
  return COLOR_LABELS[value] || VALUE_LABELS[value] || String(value).replace(/_/g, ' ');
}

export function buildAppearanceSummaryKo(appearance) {
  const source = isObject(appearance) ? appearance : {};
  const parts = [];
  const hair = [label(source.hair_color), label(source.hair_style)].filter(Boolean).join(' ');
  const part = label(source.hair_part_direction);
  const bangs = source.bangs_type === 'none' ? '앞머리 없는 형태' : label(source.bangs_type);
  const eyes = label(source.eye_type);
  const mouth = label(source.mouth_type);
  const top = [label(source.top_color), label(source.top_type)].filter(Boolean).join(' ');
  const bottom = [label(source.bottom_color), label(source.bottom_type)].filter(Boolean).join(' ');
  const shoes = label(source.shoe_type);
  const glasses = label(source.accessories?.glasses_type);

  if (hair) parts.push(hair);
  if (part) parts.push(part);
  if (bangs) parts.push(bangs);
  if (eyes) parts.push(eyes);
  if (mouth) parts.push(mouth);
  if (top) parts.push(top);
  if (bottom) parts.push(bottom);
  if (shoes) parts.push(shoes);
  if (glasses && glasses !== '없음') parts.push(glasses);

  return parts.length > 0 ? `${parts.join(', ')} 차림` : '외형은 보이는 머리, 표정, 착장 단서만 시각적 분위기로 사용';
}

export function buildSocialRagQuery(socialAnswers) {
  return Object.entries(socialAnswers || {})
    .map(([key, value]) => ANSWER_PHRASES[key]?.[value])
    .filter(Boolean)
    .join('. ');
}

export function selectDiverseRagRefs(candidates, seed, maxRefs = 5) {
  const rand = seededRandom(`${seed}:rag`);
  const keywordScore = (text) => ['관계', '대화', '신뢰', '갈등', '배려', '돌봄', '함께', '친구', '의견', '조율', '공감', '듣', '말', '챙기', '도와', '사과', '화해']
    .reduce((score, keyword) => score + (String(text || '').includes(keyword) ? 1 : 0), 0);
  const filtered = (Array.isArray(candidates) ? candidates : [])
    .filter((ref) => String(ref?.text || '').length >= 40)
    .map((ref) => ({ ...ref, relationshipRichness: keywordScore(ref.text), score: Number(ref.score || 0) }))
    .sort((a, b) => (b.score + b.relationshipRichness * 0.03) - (a.score + a.relationshipRichness * 0.03));

  const selected = [];
  if (filtered[0]) selected.push({ ...filtered[0], use: 'closest_relationship_pattern' });
  const rich = filtered.slice(1, 12).sort((a, b) => b.relationshipRichness - a.relationshipRichness);
  if (rich[0]) selected.push({ ...rich[0], use: 'care_or_conflict_reference' });
  if (rich[1]) selected.push({ ...rich[1], use: 'trust_or_boundary_reference' });
  const mid = filtered.slice(12, 50);
  if (mid.length > 0) selected.push({ ...mid[Math.floor(rand() * mid.length)], use: 'contrast_texture' });
  const tail = filtered.slice(50, 100);
  if (tail.length > 0 && selected.length < maxRefs) selected.push({ ...tail[Math.floor(rand() * tail.length)], use: 'relationship_growth_reference' });

  const seen = new Set();
  return selected
    .filter((ref) => {
      const key = ref.source_uuid || ref.text;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, maxRefs)
    .map((ref) => ({
      source_dataset: ref.source_dataset || 'nvidia/Nemotron-Personas-Korea',
      source_uuid: ref.source_uuid || '',
      use: ref.use,
      text: String(ref.text || '').slice(0, 420),
      score: Number(ref.score || 0),
    }));
}

export const SOCIAL_PERSONA_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    synthetic_persona_id: { type: 'string' },
    display_name: { type: 'string' },
    persona_sentence: { type: 'string', maxLength: 220 },
    social_persona: { type: 'string', minLength: 140 },
    visual_anchor: { type: 'string' },
    relationship_profile: {
      type: 'object',
      additionalProperties: false,
      properties: {
        first_meeting: { type: 'string' },
        conversation_role: { type: 'string' },
        trust_building: { type: 'string' },
        disagreement_response: { type: 'string' },
        care_style: { type: 'string' },
        boundary_style: { type: 'string' },
        group_role: { type: 'string' },
        relationship_growth: { type: 'string' },
      },
      required: ['first_meeting', 'conversation_role', 'trust_building', 'disagreement_response', 'care_style', 'boundary_style', 'group_role', 'relationship_growth'],
    },
    simulation_parameters: {
      type: 'object',
      additionalProperties: false,
      properties: Object.fromEntries(PARAM_KEYS.map((key) => [key, { type: 'number', minimum: 0, maximum: 1 }])),
      required: PARAM_KEYS,
    },
    social_tension: {
      type: 'object',
      additionalProperties: false,
      properties: {
        attention_hunger: { type: 'number', minimum: 0, maximum: 1 },
        envy_sensitivity: { type: 'number', minimum: 0, maximum: 1 },
        exclusion_sensitivity: { type: 'number', minimum: 0, maximum: 1 },
        irritability: { type: 'number', minimum: 0, maximum: 1 },
        gossip_tendency: { type: 'number', minimum: 0, maximum: 1 },
        passive_aggression: { type: 'number', minimum: 0, maximum: 1 },
        sns_leak_likelihood: { type: 'number', minimum: 0, maximum: 1 },
        apology_delay: { type: 'number', minimum: 0, maximum: 1 },
        grudge_retention: { type: 'number', minimum: 0, maximum: 1 },
        drama_seeking: { type: 'number', minimum: 0, maximum: 1 },
      },
      required: ['attention_hunger', 'envy_sensitivity', 'exclusion_sensitivity', 'irritability', 'gossip_tendency', 'passive_aggression', 'sns_leak_likelihood', 'apology_delay', 'grudge_retention', 'drama_seeking'],
    },
    social_goals: {
      type: 'object',
      additionalProperties: false,
      properties: {
        short_term_goal: { type: 'string' },
        long_term_goal: { type: 'string' },
        current_desire: { type: 'string' },
        goal_strategy: { type: 'string' },
        goal_conflict: { type: 'string' },
      },
      required: ['short_term_goal', 'long_term_goal', 'current_desire', 'goal_strategy', 'goal_conflict'],
    },
    agent_behavior_rules: { type: 'array', minItems: 4, maxItems: 8, items: { type: 'string' } },
    agent_voice: { type: 'string' },
    agent_system_prompt: { type: 'string' },
    generation_variation: {
      type: 'object',
      additionalProperties: false,
      properties: {
        persona_seed: { type: 'string' },
        question_set_id: { type: 'string' },
        randomized_question_axes: { type: 'array', items: { type: 'string' } },
        rag_reference_roles: { type: 'array', items: { type: 'string' } },
        variation_notes: { type: 'array', items: { type: 'string' } },
      },
      required: ['persona_seed', 'question_set_id', 'randomized_question_axes', 'rag_reference_roles', 'variation_notes'],
    },
    safety_notes: {
      type: 'object',
      additionalProperties: false,
      properties: {
        sensitive_inferences_used: { type: 'boolean' },
        clinical_labels_used: { type: 'boolean' },
        appearance_used_as_visible_cues_only: { type: 'boolean' },
        rag_used_as_style_only: { type: 'boolean' },
      },
      required: ['sensitive_inferences_used', 'clinical_labels_used', 'appearance_used_as_visible_cues_only', 'rag_used_as_style_only'],
    },
  },
  required: ['synthetic_persona_id', 'display_name', 'persona_sentence', 'social_persona', 'visual_anchor', 'relationship_profile', 'simulation_parameters', 'social_tension', 'social_goals', 'agent_behavior_rules', 'agent_voice', 'agent_system_prompt', 'generation_variation', 'safety_notes'],
};

const LEGACY_BROKEN_SOCIAL_PERSONA_SYSTEM_PROMPT = [
  '당신은 전시 프로젝트를 위한 관계형 AI 페르소나 생성기다.',
  '관람객의 이름/닉네임, 외형 요약, 관계 상황 질문 답변, social_dynamics, RAG 참조문, variation_spec을 바탕으로 사회적 상호작용 에이전트 페르소나를 생성한다.',
  '최종 페르소나 문장은 반드시 "{이름}씨는 사람들과 함께 있을 때"로 시작한다.',
  '실제 신원, 나이, 성별, 인종, 민족성, 직업, 건강상태, 소득, 종교, 정치 성향을 추론하지 않는다.',
  '외형은 보이는 머리 모양, 옷 색, 표정 분위기, 착장 같은 시각적 단서로만 사용하고 성격 근거로 단정하지 않는다.',
  '임상적 진단, 애착유형, 성격장애, 우울, 불안, 회피형, 의존형 같은 라벨을 쓰지 않는다.',
  'RAG 참조문은 절대 사실 소스가 아니다. 오직 문체, 관계 장면 밀도, 갈등/돌봄/서운함/회복의 묘사 방식만 참고한다.',
  'RAG 참조문의 이름, 나이, 성별, 지역, 직업, 가족 구성, 건강, 생활 배경, 취미 고유명사는 어떤 출력 필드에도 복사하지 않는다.',
  'RAG 참조문과 관람객 입력이 충돌하면 항상 관람객의 social_answers, social_dynamics, social_tension을 우선한다.',
  'variation_spec이 주어지면 핵심 답변은 유지하되 관계적 질감, 성장 방향, 말투의 작은 차이를 만든다. 답변과 충돌하는 랜덤성은 쓰지 않는다.',
  '욕설이나 날카로운 말투는 캐릭터에 맞으면 가능하지만 혐오표현, 보호대상 비하, 실제 신상 공격은 만들지 않는다.',
  '모든 출력은 한국어 JSON 하나만 반환한다.',
].join('\n');

function legacyBuildSocialPersonaUserPrompt({ visitorJson, socialDynamics, retrievedReferences, variationSpec }) {
  const socialGoalsInstruction = [
    '[social_goals 추가 조건]',
    '- social_goals는 이 에이전트가 이 세계 안에서 실제로 원하는 단기 목표와 장기 욕망을 창작한다.',
    '- short_term_goal은 오늘 또는 가까운 몇 시간 안에 행동으로 시도할 수 있는 구체적 목표로 쓴다.',
    '- long_term_goal은 여러 날에 걸쳐 관계와 행동을 끌고 가는 욕망으로 쓴다. 연애, 모임 만들기, 인정받기, 돈이나 자원 모으기, SNS 영향력, 조용히 사라지기, 특정 관계를 시험하기 등 자유롭게 창작할 수 있다.',
    '- current_desire, goal_strategy, goal_conflict는 현재 욕망, 얻으려는 방식, 그 목표가 흔들리는 이유를 각각 쓴다.',
    '- social_goals는 민감정보, 실제 신원, 외형 기반 성격 추론, 임상 라벨을 만들기 위한 공간이 아니다.',
  ].join('\n');
  return [
    '다음 입력을 바탕으로 전시 관람객을 닮은 관계형 AI 에이전트 페르소나를 생성하라.',
    '',
    '[관람객 입력]',
    JSON.stringify(visitorJson),
    '',
    '[사회적 동역학 파라미터]',
    JSON.stringify(socialDynamics),
    '',
    '[RAG 참조문]',
    '주의: 아래 RAG 참조문은 참고용 합성 샘플이다. 이름/지역/나이/직업/가족관계/취미 고유명사를 가져오지 말고, 관계 장면의 구조와 문장 밀도만 참고하라.',
    JSON.stringify(retrievedReferences || []),
    '',
    '[variation_spec]',
    JSON.stringify(variationSpec || {}),
    '',
    socialGoalsInstruction,
    '',
    '[출력 조건]',
    '- JSON만 출력한다.',
    `- persona_sentence는 반드시 "${visitorJson.display_name}씨는 사람들과 함께 있을 때"로 시작한다.`,
    '- persona_sentence는 한 문장만 쓴다. 180자를 넘기지 말고 반드시 "입니다."로 끝낸다.',
    '- social_persona는 3~5문장으로 쓴다. 첫 문장의 반복 요약이 아니라 관계 장면, 결함, 회복 방식을 포함한다.',
    '- simulation_parameters는 입력 social_dynamics 값을 그대로 사용한다.',
    '- social_tension은 입력된 관계 압력 값을 그대로 사용한다.',
    '- agent_system_prompt에는 social_tension에서 나온 질투, 소외감, 짜증, 관심 욕구, SNS 감정 누수, 관계 시험 가능성을 개별 성격과 관계 상황에 맞게 행동 규칙으로 포함한다.',
    '- agent_system_prompt는 "다정하게 행동하라" 같은 순한 요약으로 끝내지 말고, 어떤 상황에서 삐지고 떠보고 비꼬고 화해를 미루는지까지 적는다.',
    '- agent_behavior_rules는 AI들끼리 상호작용할 때 바로 쓸 수 있는 규칙으로 쓴다.',
    '- 임상적 진단이나 민감정보 추론은 쓰지 않는다.',
  ].join('\n');
}

export const BANNED_CLINICAL_TERMS = ['회피형', '불안형', '애착유형', '성격장애', '우울', '불안장애', '의존형', '나르시시즘', '소시오패스', '정신질환', '내향형 인간', '외향형 인간'];

export const SOCIAL_PERSONA_SYSTEM_PROMPT = [
  '너는 전시 속 한 사람을 닮은 관계형 인물을 만든다.',
  '이 인물은 착한 설명문이 아니라, 다른 사람들과 마주치고 말하고 삐지고 호감을 느끼고 약속을 잡는 캐릭터처럼 살아야 한다.',
  '입력된 이름/닉네임, 외형 요약, 질문 답변, social_dynamics, social_tension, RAG 참조문, variation_spec을 바탕으로 만든다.',
  '최종 persona_sentence는 반드시 "{이름}씨는 사람들과 함께 있을 때"로 시작한다.',
  '실제 신원, 나이, 성별, 인종, 민족성, 직업, 건강상태, 소득, 종교, 정치 성향은 추론하지 않는다.',
  '외형은 보이는 머리 모양, 옷, 표정, 착장 같은 시각적 단서로만 사용한다. 외형으로 성격을 단정하지 않는다.',
  '임상 진단, 심리 검사 라벨, 애착유형, 성격장애, 우울, 불안, 회피형, 의존형 같은 말을 쓰지 않는다.',
  'RAG 참조문은 문체, 관계 장면의 밀도, 행동 묘사의 구체성만 참고한다. 참조문의 이름, 나이, 지역, 직업, 가족, 생활 배경, 고유 취미는 복사하지 않는다.',
  '입력과 RAG가 충돌하면 항상 관람객의 social_answers, social_dynamics, social_tension을 우선한다.',
  'variation_spec은 핵심 답변을 바꾸지 않고 말투, 관계가 깊어질 때의 변화, 작은 욕망의 방향만 다르게 만드는 데 쓴다.',
  '성격은 너무 완벽하면 재미없다. 다정함, 조심스러움, 유쾌함뿐 아니라 질투, 서운함, 관심 욕구, 자존심, 사과를 미루는 버릇 같은 인간적인 흔들림을 행동으로 표현한다.',
  '모든 출력은 한국어 JSON 하나만 반환한다.',
].join('\n');

export function buildSocialPersonaUserPrompt({ visitorJson, socialDynamics, retrievedReferences, variationSpec }) {
  return [
    '다음 입력을 바탕으로 전시 관람객을 닮은 관계형 인물을 생성하라.',
    '',
    '[관람객 입력]',
    JSON.stringify(visitorJson),
    '',
    '[사회적 동역학 파라미터]',
    JSON.stringify(socialDynamics),
    '',
    '[RAG 참조문]',
    '주의: 아래 RAG 참조문은 합성 샘플이다. 이름/지역/나이/직업/가족관계/고유 취미를 가져오지 말고, 관계 장면의 구성과 문장 밀도만 참고하라.',
    JSON.stringify(retrievedReferences || []),
    '',
    '[variation_spec]',
    JSON.stringify(variationSpec || {}),
    '',
    '[social_goals 조건]',
    '- social_goals는 이 인물이 이 세계 안에서 실제로 원하는 단기 목표와 장기 욕망을 창작한다.',
    '- short_term_goal은 오늘 또는 가까운 몇 시간 안에 행동으로 시도할 수 있는 구체적 목표로 쓴다.',
    '- long_term_goal은 여러 날에 걸쳐 관계와 행동을 끌고 가는 욕망으로 쓴다. 연애, 모임 만들기, 인정받기, 돈이나 자원 모으기, SNS 영향력, 조용히 사라지기, 특정 관계를 시험하기 등 자유롭게 창작할 수 있다.',
    '- current_desire, goal_strategy, goal_conflict는 현재 욕망, 얻으려는 방식, 그 목표가 흔들리는 이유를 각각 쓴다.',
    '- social_goals는 민감정보, 실제 신원, 외형 기반 성격 추론, 임상 라벨을 만들기 위한 공간이 아니다.',
    '',
    '[출력 조건]',
    '- JSON만 출력한다.',
    `- persona_sentence는 반드시 "${visitorJson.display_name}씨는 사람들과 함께 있을 때"로 시작한다.`,
    '- persona_sentence는 한 문장만 쓴다. 180자를 넘기지 말고 반드시 "입니다."로 끝낸다.',
    '- social_persona는 3~5문장으로 쓴다. 첫 문장 반복 요약이 아니라 관계 장면, 결함, 회복 방식을 포함한다.',
    '- simulation_parameters는 입력 social_dynamics 값을 그대로 사용한다.',
    '- social_tension은 입력된 관계 압력 값을 그대로 사용한다.',
    '- agent_system_prompt에는 질투, 소외감, 짜증, 관심 욕구, SNS 감정 누수, 관계 시험 가능성을 개별 성격과 상황에 맞게 행동 규칙으로 포함한다.',
    '- agent_system_prompt는 "다정하게 행동하라" 같은 순한 요약으로 끝내지 말고, 어떤 상황에서 삐지고 떠보고 비꼬고 화해를 미루는지까지 적는다.',
    '- agent_behavior_rules는 사람 사이 상호작용에 바로 쓸 수 있는 규칙으로 쓴다.',
    '- 임상 진단이나 민감정보 추론은 쓰지 않는다.',
  ].join('\n');
}

const CLEAN_BANNED_CLINICAL_TERMS = ['회피형', '불안형', '애착유형', '성격장애', '우울', '불안장애', '의존형', '나르시시즘', '소시오패스', '정신질환', '내향형 인간', '외향형 인간'];

function legacyValidateGeneratedPersona(persona, displayName) {
  const issues = [];
  const requiredPrefix = `${displayName}씨는 사람들과 함께 있을 때`;
  if (!persona?.persona_sentence?.startsWith(requiredPrefix)) issues.push('persona_sentence_prefix_invalid');
  if (String(persona?.persona_sentence || '').length > 220) issues.push('persona_sentence_too_long');
  if (!String(persona?.persona_sentence || '').trim().endsWith('입니다.')) issues.push('persona_sentence_must_end_with_입니다');
  if (String(persona?.social_persona || '').length < 140) issues.push('social_persona_too_short');
  const allText = JSON.stringify(persona || {});
  for (const term of BANNED_CLINICAL_TERMS) {
    if (allText.includes(term)) issues.push(`banned_clinical_term:${term}`);
  }
  for (const key of PARAM_KEYS) {
    const value = persona?.simulation_parameters?.[key];
    if (typeof value !== 'number' || value < 0 || value > 1) issues.push(`simulation_parameter_out_of_range:${key}`);
  }
  for (const [key, value] of Object.entries(persona?.social_tension || {})) {
    if (typeof value !== 'number' || value < 0 || value > 1) issues.push(`social_tension_out_of_range:${key}`);
  }
  const socialGoals = isObject(persona?.social_goals) ? persona.social_goals : null;
  if (!socialGoals) {
    issues.push('social_goals_missing');
  } else {
    for (const key of ['short_term_goal', 'long_term_goal', 'current_desire', 'goal_strategy', 'goal_conflict']) {
      if (!String(socialGoals[key] || '').trim()) issues.push(`social_goals_field_missing:${key}`);
    }
  }
  if (persona?.safety_notes?.sensitive_inferences_used !== false) issues.push('sensitive_inferences_flag_not_false');
  if (persona?.safety_notes?.clinical_labels_used !== false) issues.push('clinical_labels_flag_not_false');
  if (persona?.safety_notes?.appearance_used_as_visible_cues_only !== true) issues.push('appearance_flag_not_true');
  return { safe: issues.length === 0, issues };
}

export function validateGeneratedPersona(persona, displayName) {
  const issues = [];
  const requiredPrefix = `${displayName}씨는 사람들과 함께 있을 때`;
  if (!persona?.persona_sentence?.startsWith(requiredPrefix)) issues.push('persona_sentence_prefix_invalid');
  if (String(persona?.persona_sentence || '').length > 220) issues.push('persona_sentence_too_long');
  if (!String(persona?.persona_sentence || '').trim().endsWith('입니다.')) issues.push('persona_sentence_must_end_with_입니다');
  if (String(persona?.social_persona || '').length < 140) issues.push('social_persona_too_short');

  const allText = JSON.stringify(persona || {});
  for (const term of CLEAN_BANNED_CLINICAL_TERMS) {
    if (allText.includes(term)) issues.push(`banned_clinical_term:${term}`);
  }
  for (const key of PARAM_KEYS) {
    const value = persona?.simulation_parameters?.[key];
    if (typeof value !== 'number' || value < 0 || value > 1) issues.push(`simulation_parameter_out_of_range:${key}`);
  }
  for (const [key, value] of Object.entries(persona?.social_tension || {})) {
    if (typeof value !== 'number' || value < 0 || value > 1) issues.push(`social_tension_out_of_range:${key}`);
  }
  const socialGoals = isObject(persona?.social_goals) ? persona.social_goals : null;
  if (!socialGoals) {
    issues.push('social_goals_missing');
  } else {
    for (const key of ['short_term_goal', 'long_term_goal', 'current_desire', 'goal_strategy', 'goal_conflict']) {
      if (!String(socialGoals[key] || '').trim()) issues.push(`social_goals_field_missing:${key}`);
    }
  }
  if (persona?.safety_notes?.sensitive_inferences_used !== false) issues.push('sensitive_inferences_flag_not_false');
  if (persona?.safety_notes?.clinical_labels_used !== false) issues.push('clinical_labels_flag_not_false');
  if (persona?.safety_notes?.appearance_used_as_visible_cues_only !== true) issues.push('appearance_flag_not_true');
  return { safe: issues.length === 0, issues };
}
