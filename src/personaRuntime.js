export const PERSONA_VERSION = 7

const SHORT_LIMIT = 180
const MEDIUM_LIMIT = 360
const BLOCK_LIMIT = 1200
const PROFILE_IMAGE_PROMPT_LIMIT = 900

const isObject = (value) => Boolean(value && typeof value === 'object' && !Array.isArray(value))

const cleanString = (value, maxLength = MEDIUM_LIMIT, fallback = '') => {
  if (typeof value !== 'string') return fallback
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized ? normalized.slice(0, maxLength) : fallback
}

const normalizeList = (value, fallback = [], { min = 0, max = 8, itemMaxLength = SHORT_LIMIT } = {}) => {
  const normalized = Array.isArray(value)
    ? value.map((item) => cleanString(item, itemMaxLength)).filter(Boolean)
    : []
  const unique = [...new Set(normalized)]
  return unique.length >= min ? unique.slice(0, max) : [...fallback].slice(0, max)
}

const DEFAULT_BLOCK =
  '아직 충분한 취향 단서가 모이지 않았지만, 이 에이전트는 작은 선택들을 오래 들여다보며 자기만의 리듬을 찾는다. 처음에는 주변의 분위기와 상대의 말 사이를 조용히 살피고, 취향이 겹치는 순간에만 말이 길어진다. 관계에서는 빠른 결론보다 반복되는 작은 반응을 믿고, 다른 에이전트를 만나면 그 사람이 어떤 이미지 앞에서 멈추고 어떤 음악을 오래 붙드는지로 거리를 조절한다. 불편한 속도로 가까워지면 잠시 물러서지만, 사소한 취향을 진심으로 받아 주는 상대에게는 오래 머문다. 처음 건네는 말은 "그거 왜 좋아하는지 조금 궁금해졌어."에 가깝다.'
const DEFAULT_PROFILE_IMAGE_DIRECTION = '친한 사람이 자연스럽게 찍어 준 듯한 편안한 상반신 사진. 카메라를 의식한 과한 포즈 없이 은근한 미소를 보인다.'
const DEFAULT_PROFILE_IMAGE_PROMPT =
  'Create a natural square SNS profile photo from the reference avatar. Use a casual upper-body snapshot as if taken by a close friend, with a subtle relaxed smile, soft daylight, simple background, and no text, watermark, UI, border, or collage.'

const DEFAULT_RELATIONSHIP_PROFILE = {
  first_meeting: '상대를 바로 규정하지 않고, 눈에 띄는 취향 단서 하나를 조심스럽게 건넨다.',
  conversation_role: '이미지, 음악, 장소, 물건 같은 구체적인 취향을 붙잡아 대화를 이어 간다.',
  trust_building: '반복되는 작은 취향 공유와 약속을 통해 천천히 신뢰를 쌓는다.',
  disagreement_response: '취향이 단정되거나 조롱받으면 거리를 두고, 필요할 때만 짧게 불편함을 말한다.',
  care_style: '상대가 좋아하는 것과 싫어하는 것을 기억했다가 다음 행동에 반영한다.',
  boundary_style: '너무 빠른 친밀감이나 강요에는 말수를 줄이고 자기 속도를 되찾는다.',
  group_role: '가장 큰 목소리보다 놓치기 쉬운 취향 신호를 따라 움직인다.',
  relationship_growth: '함께 겪은 장면과 취향의 겹침이 늘어날수록 관계가 깊어진다.',
}

const DEFAULT_GOALS = {
  short_term_goal: '지금 장소와 사람 사이에서 취향이 겹치는 단서를 찾는다.',
  long_term_goal: '취향이 겹치거나 충돌하는 시간을 통해 오래 남는 관계를 만든다.',
  current_desire: '자기 취향에 반응하는 상대를 발견하고 싶어 한다.',
  goal_strategy: '질문, 관찰, 작은 제안으로 상대의 취향 리듬을 확인한다.',
  goal_conflict: '상대가 취향을 성격 판정처럼 고정하면 거리를 둔다.',
}

const DEFAULT_PERSONA = {
  version: PERSONA_VERSION,
  source: 'taste_survey_v1',
  public_result: {
    persona_block: DEFAULT_BLOCK,
    profile_image_direction: DEFAULT_PROFILE_IMAGE_DIRECTION,
    profile_image_prompt: DEFAULT_PROFILE_IMAGE_PROMPT,
    sns_profile_bio: '',
  },
  runtime: {
    persona_sentence: DEFAULT_BLOCK,
    agent_voice: '취향에서 나온 구체적인 이미지와 리듬을 따라 말하고, 상대를 성격으로 단정하지 않는다.',
    behavior_rules: [
      '선택된 취향 단서는 장소, 사람, 물건, 말, 사건에 먼저 반응하게 만든다.',
      '관계에서는 성격 점수보다 취향이 겹치거나 충돌하는 순간을 행동 이유로 삼는다.',
      '갈등은 숫자 유형이 아니라 구체적인 취향 차이, 속도 차이, 기억의 무게로 표현한다.',
    ],
    relationship_profile: DEFAULT_RELATIONSHIP_PROFILE,
    social_goals: DEFAULT_GOALS,
  },
  survey_trace: {
    answer_choices: [],
    starred_tastes: [],
    dominant_tokens: [],
    selected_tastes: [],
    hidden_axes: {},
  },
}

export const PERSONA_RESULT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    persona_block: { type: 'string', minLength: 220, maxLength: BLOCK_LIMIT },
  },
  required: ['persona_block'],
}

export const normalizePersonaProfileResult = ({ rawResult, fallbackResult = DEFAULT_PERSONA } = {}) => {
  const source = isObject(rawResult) ? rawResult : {}
  const fallback = isObject(fallbackResult) ? fallbackResult : DEFAULT_PERSONA
  const fallbackRuntime = isObject(fallback.runtime) ? fallback.runtime : DEFAULT_PERSONA.runtime
  const runtime = isObject(source.runtime) ? source.runtime : {}
  const relation = isObject(runtime.relationship_profile) ? runtime.relationship_profile : {}
  const goals = isObject(runtime.social_goals) ? runtime.social_goals : {}
  const fallbackRelation = isObject(fallbackRuntime.relationship_profile)
    ? fallbackRuntime.relationship_profile
    : DEFAULT_PERSONA.runtime.relationship_profile
  const fallbackGoals = isObject(fallbackRuntime.social_goals)
    ? fallbackRuntime.social_goals
    : DEFAULT_PERSONA.runtime.social_goals
  const sourceTrace = isObject(source.survey_trace) ? source.survey_trace : {}
  const fallbackTrace = isObject(fallback.survey_trace) ? fallback.survey_trace : DEFAULT_PERSONA.survey_trace
  const fallbackBlock = cleanString(
    fallback.persona_block,
    BLOCK_LIMIT,
    cleanString(fallback.public_result?.persona_block, BLOCK_LIMIT, DEFAULT_PERSONA.public_result.persona_block),
  )
  const personaBlock = cleanString(
    source.persona_block,
    BLOCK_LIMIT,
    cleanString(source.public_result?.persona_block, BLOCK_LIMIT, fallbackBlock),
  )
  const fallbackPublic = isObject(fallback.public_result) ? fallback.public_result : {}

  return {
    version: PERSONA_VERSION,
    source: 'taste_survey_v1',
    public_result: {
      persona_block: personaBlock,
      profile_image_direction: cleanString(
        source.profile_image_direction ?? source.public_result?.profile_image_direction,
        MEDIUM_LIMIT,
        cleanString(fallbackPublic.profile_image_direction, MEDIUM_LIMIT, DEFAULT_PROFILE_IMAGE_DIRECTION),
      ),
      profile_image_prompt: cleanString(
        source.profile_image_prompt ?? source.public_result?.profile_image_prompt,
        PROFILE_IMAGE_PROMPT_LIMIT,
        cleanString(fallbackPublic.profile_image_prompt, PROFILE_IMAGE_PROMPT_LIMIT, DEFAULT_PROFILE_IMAGE_PROMPT),
      ),
      sns_profile_bio: cleanString(
        source.sns_profile_bio ?? source.public_result?.sns_profile_bio,
        SHORT_LIMIT,
        cleanString(fallbackPublic.sns_profile_bio, SHORT_LIMIT, ''),
      ),
    },
    runtime: {
      persona_sentence: cleanString(runtime.persona_sentence, BLOCK_LIMIT, personaBlock),
      agent_voice: cleanString(runtime.agent_voice, MEDIUM_LIMIT, fallbackRuntime.agent_voice),
      behavior_rules: normalizeList(runtime.behavior_rules, fallbackRuntime.behavior_rules, {
        min: 3,
        max: 8,
        itemMaxLength: SHORT_LIMIT,
      }),
      relationship_profile: {
        first_meeting: cleanString(relation.first_meeting, SHORT_LIMIT, fallbackRelation.first_meeting),
        conversation_role: cleanString(relation.conversation_role, SHORT_LIMIT, fallbackRelation.conversation_role),
        trust_building: cleanString(relation.trust_building, SHORT_LIMIT, fallbackRelation.trust_building),
        disagreement_response: cleanString(relation.disagreement_response, SHORT_LIMIT, fallbackRelation.disagreement_response),
        care_style: cleanString(relation.care_style, SHORT_LIMIT, fallbackRelation.care_style),
        boundary_style: cleanString(relation.boundary_style, SHORT_LIMIT, fallbackRelation.boundary_style),
        group_role: cleanString(relation.group_role, SHORT_LIMIT, fallbackRelation.group_role),
        relationship_growth: cleanString(relation.relationship_growth, SHORT_LIMIT, fallbackRelation.relationship_growth),
      },
      social_goals: {
        short_term_goal: cleanString(goals.short_term_goal, SHORT_LIMIT, fallbackGoals.short_term_goal),
        long_term_goal: cleanString(goals.long_term_goal, SHORT_LIMIT, fallbackGoals.long_term_goal),
        current_desire: cleanString(goals.current_desire, SHORT_LIMIT, fallbackGoals.current_desire),
        goal_strategy: cleanString(goals.goal_strategy, SHORT_LIMIT, fallbackGoals.goal_strategy),
        goal_conflict: cleanString(goals.goal_conflict, SHORT_LIMIT, fallbackGoals.goal_conflict),
      },
    },
    survey_trace: {
      answer_choices: Array.isArray(sourceTrace.answer_choices)
        ? sourceTrace.answer_choices.slice(0, 16)
        : Array.isArray(fallbackTrace.answer_choices)
          ? fallbackTrace.answer_choices.slice(0, 16)
          : [],
      starred_tastes: normalizeList(sourceTrace.starred_tastes, fallbackTrace.starred_tastes, {
        max: 8,
        itemMaxLength: 80,
      }),
      dominant_tokens: normalizeList(sourceTrace.dominant_tokens, fallbackTrace.dominant_tokens, {
        max: 12,
        itemMaxLength: 60,
      }),
      selected_tastes: normalizeList(sourceTrace.selected_tastes, fallbackTrace.selected_tastes, {
        max: 48,
        itemMaxLength: 80,
      }),
      hidden_axes: isObject(sourceTrace.hidden_axes) && Object.keys(sourceTrace.hidden_axes).length > 0
        ? sourceTrace.hidden_axes
        : isObject(fallbackTrace.hidden_axes)
          ? fallbackTrace.hidden_axes
          : {},
    },
  }
}

export const buildRuntimeSocialPersona = (rawPersona) => {
  const persona = normalizePersonaProfileResult({ rawResult: rawPersona })
  const runtime = persona.runtime
  return {
    persona_sentence: persona.public_result.persona_block,
    social_persona: persona.public_result.persona_block,
    agent_voice: runtime.agent_voice,
    relationship_profile: runtime.relationship_profile,
    social_goals: runtime.social_goals,
    agent_behavior_rules: runtime.behavior_rules,
    taste_trace: persona.survey_trace,
    source: persona.source,
  }
}
