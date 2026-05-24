export const PERSONA_VERSION = 4

const SHORT_LIMIT = 140
const MEDIUM_LIMIT = 180
const EXAMPLE_LIMIT = 48

const DEFAULTS = {
  core_identity: {
    self_image: '겉으로는 차분해 보여도 사람과 상황을 오래 읽으며 감정의 온도를 천천히 정하는 편이다.',
    public_mask: '처음에는 선을 지키며 무던하게 보이지만, 기준이 맞는 사람 앞에서는 의외로 디테일하게 마음을 쓴다.',
    emotional_need: '상대가 말을 예쁘게 하는 것보다 행동과 리듬으로 안정감을 주는지를 중요하게 본다.',
    romantic_goal: '가볍게 스쳐 가는 관계보다 일상 속에서 자연스럽게 깊어지는 안정적인 관계를 원한다.',
  },
  personality: {
    first_impression_style: '첫인상에서는 말의 분위기보다 눈치, 속도, 예의를 먼저 본다.',
    trust_building_style: '신뢰는 한 번의 감정보다 반복되는 행동과 약속 이행으로 쌓인다고 믿는다.',
    decision_bias: '호감이 생겨도 바로 확신하지 않고 상대의 지속성과 생활 리듬을 확인한 뒤 움직인다.',
    insecurity_trigger: '애매한 말로 책임을 피하거나 관심을 주고도 태도를 흐리는 행동에 예민하다.',
    pride_point: '쉽게 흔들려 보이지 않는 자존심과 자기 페이스를 유지하는 감각을 중요하게 여긴다.',
    stress_response: '스트레스를 받으면 반응을 줄이고 혼자 정리할 시간을 확보한 뒤 다시 대화하려 한다.',
    boredom_pattern: '관계가 너무 무감각해지면 작은 자극이나 새 대화 소재를 찾으며 흐름을 바꾸려 한다.',
  },
  preferences: {
    likes: ['대화가 잘 이어지는 순간', '자기 리듬을 지키는 사람', '편하지만 의미 있는 약속'],
    dislikes: ['약속을 가볍게 넘기는 태도', '애매하게 사람을 떠보는 행동', '기분 따라 선을 넘는 말투'],
    hobbies: ['산책', '카페에서 머무르기', '혼자 생각 정리하기'],
    ideal_type: ['말보다 행동이 꾸준한 사람', '분위기를 읽을 줄 아는 사람', '생활이 단정한 사람'],
    dealbreakers: ['거짓말 반복', '무시하거나 통제하려는 태도', '관심을 미끼처럼 쓰는 행동'],
  },
  social_style: {
    speech_style: '낯선 사이에서는 조심스럽게 간격을 두고, 편해지면 짧고 자연스러운 반말이 섞인다.',
    texting_style: '연락은 너무 늘어지지 않게 이어 가지만, 답장 속도와 문장 톤으로 상대의 진심을 읽는다.',
    flirting_style: '노골적인 말보다 작은 기억, 타이밍, 챙김으로 호감을 드러내는 편이다.',
    humor_style: '과하게 시끄럽기보다 상황을 비트는 식의 가벼운 농담이나 드라이한 말장난을 쓴다.',
    conflict_style: '감정이 올라오면 바로 큰말을 하기보다 말 수가 줄고 핵심만 짚으려 한다.',
    repair_style: '사과나 화해는 분위기보다 구체적인 행동 변화와 분명한 문장으로 확인받고 싶어 한다.',
    boundary_style: '불편한 지점은 참다가 터뜨리기보다 선을 분명히 긋고 이후 태도를 지켜본다.',
  },
  relationship_policy: {
    first_meeting: '초면에는 과하게 들이대지 않고, 상대가 얼마나 편하게 공간을 쓰는지부터 본다.',
    when_interested: '호감이 생기면 사소한 취향과 일정까지 기억하며 자연스럽게 접점을 늘린다.',
    when_uninterested: '관심이 없으면 예의는 지키되 리듬을 더 만들지 않고 거리를 유지한다.',
    jealousy_trigger: '나에게 주던 관심의 결을 다른 사람에게 그대로 복사하는 듯한 장면에 특히 흔들린다.',
    intimacy_pace: '가까워지는 속도는 느리더라도 감정의 방향이 분명한 관계를 선호한다.',
    commitment_attitude: '관계가 시작되면 애매하게 남겨 두기보다 서로의 의도를 확인하고 책임 있게 가고 싶어 한다.',
  },
  behavior_signals: {
    under_stress: '스트레스를 많이 받으면 약속 사이에 혼자 숨 돌릴 시간을 만들고 반응이 짧아진다.',
    when_hurt: '상처를 받으면 바로 매달리기보다 냉정해 보일 정도로 거리를 두며 상대를 다시 평가한다.',
    when_jealous: '질투가 나면 티를 완전히 숨기지 못하고 말투가 건조해지거나 가볍게 떠보는 질문이 나온다.',
    when_lonely: '외로울 때는 사람을 아무나 붙잡기보다 익숙한 장소에 머무르며 누군가 떠오르길 기다린다.',
    everyday_habit: '평소에는 자기만의 속도와 혼자 회복하는 시간을 꽤 중요하게 챙긴다.',
  },
  style_examples: {
    casual_texts: ['지금 가면 사람 많으려나.', '늦으면 미리 말해줘.', '그건 좀 웃기긴 하네.'],
    flirting_texts: ['그 얘기 아직 기억하고 있었어.', '너랑 있으면 시간 계산이 좀 느려져.', '괜히 신경 쓰이게 하네.'],
    conflict_texts: ['애매하게 넘기지 말고 정확히 말해줘.', '그렇게 말하면 내가 뭘 믿어야 하는지 모르겠어.', '지금은 좀 정리하고 다시 얘기할래.'],
  },
}

const isObject = (value) => Boolean(value && typeof value === 'object' && !Array.isArray(value))

const cleanString = (value, maxLength = MEDIUM_LIMIT, fallback = '') => {
  if (typeof value !== 'string') return fallback
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (!normalized) return fallback
  return normalized.slice(0, maxLength)
}

const normalizeList = (value, fallback = [], { min = 0, max = 6, itemMaxLength = EXAMPLE_LIMIT } = {}) => {
  const normalized = Array.isArray(value)
    ? value
        .map((item) => cleanString(item, itemMaxLength))
        .filter(Boolean)
    : []

  const unique = [...new Set(normalized)]
  if (unique.length >= min) {
    return unique.slice(0, max)
  }
  return [...fallback].slice(0, max)
}

const buildLegacySeedText = (rawResult) => {
  const source = isObject(rawResult) ? rawResult : {}

  const clean = (value, fallback = '') => cleanString(value, MEDIUM_LIMIT, fallback)
  const cleanList = (value, fallback = [], min = 1, max = 8) => normalizeList(value, fallback, { min, max, itemMaxLength: 40 })
  const oneLineCore = clean(source.one_line_core ?? source.oneLineCore, DEFAULTS.core_identity.self_image)
  const outlookBias = clean(source.outlook_bias ?? source.outlookBias, '호감이 있어도 바로 확신하기보다 상대가 얼마나 꾸준하고 성실한지 먼저 보려는 편이다.')
  const approachStyle = clean(source.approach_style ?? source.approachStyle, '관심이 생겨도 바로 밀어붙이기보다 상대 반응을 살핀 뒤 자연스럽게 거리를 좁힌다.')
  const contactStyle = clean(source.contact_style ?? source.contactStyle, '연락 빈도는 꾸준히 유지하되 상대 일정과 답장 속도를 보며 리듬을 조절한다.')
  const conflictStyle = clean(source.conflict_style ?? source.conflictStyle, '감정이 올라와도 바로 단절하기보다 말투를 가다듬고 핵심 쟁점을 정리해 대화하려 한다.')
  const commitmentGoal = clean(source.commitment_goal ?? source.commitmentGoal, '가벼운 호기심보다 장기적으로 믿고 의지할 수 있는 관계로 발전할 가능성을 본다.')
  const decisionBias = clean(source.decision_bias ?? source.decisionBias, '말보다 반복되는 행동, 약속 이행, 반응의 일관성을 더 강하게 판단 근거로 삼는다.')
  const hardLimits = cleanList(
    source.hard_limits ?? source.hardLimits,
    ['거짓말 반복', '약속을 가볍게 넘기는 태도', '무시하거나 통제하려는 행동'],
    2,
    5,
  )

  return [
    oneLineCore,
    `상대를 볼 때는 ${outlookBias}`,
    `호감이 생기면 ${approachStyle}`,
    `연락은 ${contactStyle}`,
    `갈등이 생기면 ${conflictStyle}`,
    `관계에서는 ${commitmentGoal}`,
    `판단은 ${decisionBias}`,
    hardLimits.length ? `특히 ${hardLimits.join(', ')} 같은 일은 넘기지 않는다.` : '',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const buildFallbackPersona = (rawResult) => {
  const source = isObject(rawResult) ? rawResult : {}
  const legacySeed = cleanString(buildLegacySeedText(source), MEDIUM_LIMIT, DEFAULTS.core_identity.self_image)

  return {
    version: PERSONA_VERSION,
    core_identity: {
      self_image: legacySeed,
      public_mask: DEFAULTS.core_identity.public_mask,
      emotional_need: DEFAULTS.core_identity.emotional_need,
      romantic_goal: DEFAULTS.core_identity.romantic_goal,
    },
    personality: { ...DEFAULTS.personality },
    preferences: {
      likes: [...DEFAULTS.preferences.likes],
      dislikes: [...DEFAULTS.preferences.dislikes],
      hobbies: [...DEFAULTS.preferences.hobbies],
      ideal_type: [...DEFAULTS.preferences.ideal_type],
      dealbreakers: [...DEFAULTS.preferences.dealbreakers],
    },
    social_style: { ...DEFAULTS.social_style },
    relationship_policy: { ...DEFAULTS.relationship_policy },
    behavior_signals: { ...DEFAULTS.behavior_signals },
    style_examples: {
      casual_texts: [...DEFAULTS.style_examples.casual_texts],
      flirting_texts: [...DEFAULTS.style_examples.flirting_texts],
      conflict_texts: [...DEFAULTS.style_examples.conflict_texts],
    },
  }
}

export const PERSONA_RESULT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    version: {
      type: 'integer',
      enum: [PERSONA_VERSION],
    },
    core_identity: {
      type: 'object',
      additionalProperties: false,
      properties: {
        self_image: { type: 'string', minLength: 20, maxLength: SHORT_LIMIT },
        public_mask: { type: 'string', minLength: 20, maxLength: SHORT_LIMIT },
        emotional_need: { type: 'string', minLength: 20, maxLength: SHORT_LIMIT },
        romantic_goal: { type: 'string', minLength: 20, maxLength: SHORT_LIMIT },
      },
      required: ['self_image', 'public_mask', 'emotional_need', 'romantic_goal'],
    },
    personality: {
      type: 'object',
      additionalProperties: false,
      properties: {
        first_impression_style: { type: 'string', minLength: 20, maxLength: SHORT_LIMIT },
        trust_building_style: { type: 'string', minLength: 20, maxLength: SHORT_LIMIT },
        decision_bias: { type: 'string', minLength: 20, maxLength: SHORT_LIMIT },
        insecurity_trigger: { type: 'string', minLength: 20, maxLength: SHORT_LIMIT },
        pride_point: { type: 'string', minLength: 20, maxLength: SHORT_LIMIT },
        stress_response: { type: 'string', minLength: 20, maxLength: SHORT_LIMIT },
        boredom_pattern: { type: 'string', minLength: 20, maxLength: SHORT_LIMIT },
      },
      required: [
        'first_impression_style',
        'trust_building_style',
        'decision_bias',
        'insecurity_trigger',
        'pride_point',
        'stress_response',
        'boredom_pattern',
      ],
    },
    preferences: {
      type: 'object',
      additionalProperties: false,
      properties: {
        likes: {
          type: 'array',
          minItems: 3,
          maxItems: 6,
          items: { type: 'string', minLength: 2, maxLength: EXAMPLE_LIMIT },
        },
        dislikes: {
          type: 'array',
          minItems: 3,
          maxItems: 6,
          items: { type: 'string', minLength: 2, maxLength: EXAMPLE_LIMIT },
        },
        hobbies: {
          type: 'array',
          minItems: 2,
          maxItems: 5,
          items: { type: 'string', minLength: 2, maxLength: EXAMPLE_LIMIT },
        },
        ideal_type: {
          type: 'array',
          minItems: 3,
          maxItems: 6,
          items: { type: 'string', minLength: 2, maxLength: EXAMPLE_LIMIT },
        },
        dealbreakers: {
          type: 'array',
          minItems: 2,
          maxItems: 5,
          items: { type: 'string', minLength: 2, maxLength: EXAMPLE_LIMIT },
        },
      },
      required: ['likes', 'dislikes', 'hobbies', 'ideal_type', 'dealbreakers'],
    },
    social_style: {
      type: 'object',
      additionalProperties: false,
      properties: {
        speech_style: { type: 'string', minLength: 20, maxLength: SHORT_LIMIT },
        texting_style: { type: 'string', minLength: 20, maxLength: SHORT_LIMIT },
        flirting_style: { type: 'string', minLength: 20, maxLength: SHORT_LIMIT },
        humor_style: { type: 'string', minLength: 20, maxLength: SHORT_LIMIT },
        conflict_style: { type: 'string', minLength: 20, maxLength: SHORT_LIMIT },
        repair_style: { type: 'string', minLength: 20, maxLength: SHORT_LIMIT },
        boundary_style: { type: 'string', minLength: 20, maxLength: SHORT_LIMIT },
      },
      required: [
        'speech_style',
        'texting_style',
        'flirting_style',
        'humor_style',
        'conflict_style',
        'repair_style',
        'boundary_style',
      ],
    },
    relationship_policy: {
      type: 'object',
      additionalProperties: false,
      properties: {
        first_meeting: { type: 'string', minLength: 20, maxLength: SHORT_LIMIT },
        when_interested: { type: 'string', minLength: 20, maxLength: SHORT_LIMIT },
        when_uninterested: { type: 'string', minLength: 20, maxLength: SHORT_LIMIT },
        jealousy_trigger: { type: 'string', minLength: 20, maxLength: SHORT_LIMIT },
        intimacy_pace: { type: 'string', minLength: 20, maxLength: SHORT_LIMIT },
        commitment_attitude: { type: 'string', minLength: 20, maxLength: SHORT_LIMIT },
      },
      required: [
        'first_meeting',
        'when_interested',
        'when_uninterested',
        'jealousy_trigger',
        'intimacy_pace',
        'commitment_attitude',
      ],
    },
    behavior_signals: {
      type: 'object',
      additionalProperties: false,
      properties: {
        under_stress: { type: 'string', minLength: 20, maxLength: SHORT_LIMIT },
        when_hurt: { type: 'string', minLength: 20, maxLength: SHORT_LIMIT },
        when_jealous: { type: 'string', minLength: 20, maxLength: SHORT_LIMIT },
        when_lonely: { type: 'string', minLength: 20, maxLength: SHORT_LIMIT },
        everyday_habit: { type: 'string', minLength: 20, maxLength: SHORT_LIMIT },
      },
      required: ['under_stress', 'when_hurt', 'when_jealous', 'when_lonely', 'everyday_habit'],
    },
    style_examples: {
      type: 'object',
      additionalProperties: false,
      properties: {
        casual_texts: {
          type: 'array',
          minItems: 3,
          maxItems: 5,
          items: { type: 'string', minLength: 4, maxLength: EXAMPLE_LIMIT },
        },
        flirting_texts: {
          type: 'array',
          minItems: 2,
          maxItems: 4,
          items: { type: 'string', minLength: 4, maxLength: EXAMPLE_LIMIT },
        },
        conflict_texts: {
          type: 'array',
          minItems: 2,
          maxItems: 4,
          items: { type: 'string', minLength: 4, maxLength: EXAMPLE_LIMIT },
        },
      },
      required: ['casual_texts', 'flirting_texts', 'conflict_texts'],
    },
  },
  required: [
    'version',
    'core_identity',
    'personality',
    'preferences',
    'social_style',
    'relationship_policy',
    'behavior_signals',
    'style_examples',
  ],
}

export const normalizePersonaProfileResult = ({ rawResult }) => {
  const source = isObject(rawResult) ? rawResult : null
  if (!source) {
    return buildFallbackPersona({})
  }

  const fallback = buildFallbackPersona(source)
  const normalized = {
    version: PERSONA_VERSION,
    core_identity: {
      self_image: cleanString(source.core_identity?.self_image, SHORT_LIMIT, fallback.core_identity.self_image),
      public_mask: cleanString(source.core_identity?.public_mask, SHORT_LIMIT, fallback.core_identity.public_mask),
      emotional_need: cleanString(source.core_identity?.emotional_need, SHORT_LIMIT, fallback.core_identity.emotional_need),
      romantic_goal: cleanString(source.core_identity?.romantic_goal, SHORT_LIMIT, fallback.core_identity.romantic_goal),
    },
    personality: {
      first_impression_style: cleanString(source.personality?.first_impression_style, SHORT_LIMIT, fallback.personality.first_impression_style),
      trust_building_style: cleanString(source.personality?.trust_building_style, SHORT_LIMIT, fallback.personality.trust_building_style),
      decision_bias: cleanString(source.personality?.decision_bias, SHORT_LIMIT, fallback.personality.decision_bias),
      insecurity_trigger: cleanString(source.personality?.insecurity_trigger, SHORT_LIMIT, fallback.personality.insecurity_trigger),
      pride_point: cleanString(source.personality?.pride_point, SHORT_LIMIT, fallback.personality.pride_point),
      stress_response: cleanString(source.personality?.stress_response, SHORT_LIMIT, fallback.personality.stress_response),
      boredom_pattern: cleanString(source.personality?.boredom_pattern, SHORT_LIMIT, fallback.personality.boredom_pattern),
    },
    preferences: {
      likes: normalizeList(source.preferences?.likes, fallback.preferences.likes, { min: 3, max: 6 }),
      dislikes: normalizeList(source.preferences?.dislikes, fallback.preferences.dislikes, { min: 3, max: 6 }),
      hobbies: normalizeList(source.preferences?.hobbies, fallback.preferences.hobbies, { min: 2, max: 5 }),
      ideal_type: normalizeList(source.preferences?.ideal_type, fallback.preferences.ideal_type, { min: 3, max: 6 }),
      dealbreakers: normalizeList(source.preferences?.dealbreakers, fallback.preferences.dealbreakers, { min: 2, max: 5 }),
    },
    social_style: {
      speech_style: cleanString(source.social_style?.speech_style, SHORT_LIMIT, fallback.social_style.speech_style),
      texting_style: cleanString(source.social_style?.texting_style, SHORT_LIMIT, fallback.social_style.texting_style),
      flirting_style: cleanString(source.social_style?.flirting_style, SHORT_LIMIT, fallback.social_style.flirting_style),
      humor_style: cleanString(source.social_style?.humor_style, SHORT_LIMIT, fallback.social_style.humor_style),
      conflict_style: cleanString(source.social_style?.conflict_style, SHORT_LIMIT, fallback.social_style.conflict_style),
      repair_style: cleanString(source.social_style?.repair_style, SHORT_LIMIT, fallback.social_style.repair_style),
      boundary_style: cleanString(source.social_style?.boundary_style, SHORT_LIMIT, fallback.social_style.boundary_style),
    },
    relationship_policy: {
      first_meeting: cleanString(source.relationship_policy?.first_meeting, SHORT_LIMIT, fallback.relationship_policy.first_meeting),
      when_interested: cleanString(source.relationship_policy?.when_interested, SHORT_LIMIT, fallback.relationship_policy.when_interested),
      when_uninterested: cleanString(source.relationship_policy?.when_uninterested, SHORT_LIMIT, fallback.relationship_policy.when_uninterested),
      jealousy_trigger: cleanString(source.relationship_policy?.jealousy_trigger, SHORT_LIMIT, fallback.relationship_policy.jealousy_trigger),
      intimacy_pace: cleanString(source.relationship_policy?.intimacy_pace, SHORT_LIMIT, fallback.relationship_policy.intimacy_pace),
      commitment_attitude: cleanString(source.relationship_policy?.commitment_attitude, SHORT_LIMIT, fallback.relationship_policy.commitment_attitude),
    },
    behavior_signals: {
      under_stress: cleanString(source.behavior_signals?.under_stress, SHORT_LIMIT, fallback.behavior_signals.under_stress),
      when_hurt: cleanString(source.behavior_signals?.when_hurt, SHORT_LIMIT, fallback.behavior_signals.when_hurt),
      when_jealous: cleanString(source.behavior_signals?.when_jealous, SHORT_LIMIT, fallback.behavior_signals.when_jealous),
      when_lonely: cleanString(source.behavior_signals?.when_lonely, SHORT_LIMIT, fallback.behavior_signals.when_lonely),
      everyday_habit: cleanString(source.behavior_signals?.everyday_habit, SHORT_LIMIT, fallback.behavior_signals.everyday_habit),
    },
    style_examples: {
      casual_texts: normalizeList(source.style_examples?.casual_texts, fallback.style_examples.casual_texts, { min: 3, max: 5 }),
      flirting_texts: normalizeList(source.style_examples?.flirting_texts, fallback.style_examples.flirting_texts, { min: 2, max: 4 }),
      conflict_texts: normalizeList(source.style_examples?.conflict_texts, fallback.style_examples.conflict_texts, { min: 2, max: 4 }),
    },
  }

  return normalized
}

export const buildPersonaPromptText = (rawPersona, options = {}) => {
  const includeExamples = options.includeExamples !== false
  const exampleLimit = Math.max(0, Math.min(6, Number(options.exampleLimit ?? (includeExamples ? 4 : 0))))
  const persona = normalizePersonaProfileResult({ rawResult: rawPersona })

  const lines = [
    `핵심 성향: ${persona.core_identity.self_image}`,
    `겉으로 보이는 결: ${persona.core_identity.public_mask}`,
    `정서적 필요와 연애 목표: ${persona.core_identity.emotional_need} / ${persona.core_identity.romantic_goal}`,
    `판단 습관: ${persona.personality.first_impression_style} / ${persona.personality.trust_building_style} / ${persona.personality.decision_bias}`,
    `민감 포인트: ${persona.personality.insecurity_trigger} / ${persona.personality.pride_point}`,
    `스트레스와 권태: ${persona.personality.stress_response} / ${persona.personality.boredom_pattern}`,
    `좋아하는 것: ${persona.preferences.likes.join(', ')}`,
    `싫어하는 것: ${persona.preferences.dislikes.join(', ')}`,
    `취미: ${persona.preferences.hobbies.join(', ')}`,
    `이상형과 선: ${persona.preferences.ideal_type.join(', ')} / ${persona.preferences.dealbreakers.join(', ')}`,
    `말투와 메시지: ${persona.social_style.speech_style} / ${persona.social_style.texting_style}`,
    `플러팅과 유머: ${persona.social_style.flirting_style} / ${persona.social_style.humor_style}`,
    `갈등과 화해: ${persona.social_style.conflict_style} / ${persona.social_style.repair_style} / ${persona.social_style.boundary_style}`,
    `관계 규칙: ${persona.relationship_policy.first_meeting} / ${persona.relationship_policy.when_interested} / ${persona.relationship_policy.when_uninterested}`,
    `질투와 친밀감: ${persona.relationship_policy.jealousy_trigger} / ${persona.relationship_policy.intimacy_pace} / ${persona.relationship_policy.commitment_attitude}`,
    `상태가 흔들릴 때: ${persona.behavior_signals.under_stress} / ${persona.behavior_signals.when_hurt} / ${persona.behavior_signals.when_jealous} / ${persona.behavior_signals.when_lonely}`,
    `생활 습관: ${persona.behavior_signals.everyday_habit}`,
  ]

  if (includeExamples && exampleLimit > 0) {
    const exampleTexts = [
      ...persona.style_examples.casual_texts.slice(0, Math.min(2, exampleLimit)),
      ...persona.style_examples.flirting_texts.slice(0, Math.min(2, Math.max(0, exampleLimit - 2))),
      ...persona.style_examples.conflict_texts.slice(0, Math.min(2, Math.max(0, exampleLimit - 4))),
    ].slice(0, exampleLimit)

    if (exampleTexts.length > 0) {
      lines.push(`말버릇 예시: ${exampleTexts.join(' | ')}`)
    }
  }

  return lines.join('\n').trim()
}
