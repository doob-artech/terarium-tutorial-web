import 'dotenv/config'
import express from 'express'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const OPENAI_MODEL = 'gpt-4.1-mini'
const PERSONA_TOTAL_TURNS = 6
const PERSONA_SESSION_TTL_MS = 30 * 60 * 1000

const PERSONA_TURN_SCHEDULE = {
  1: { set: 'set_1_daily_energy', questionType: 'main' },
  2: { set: 'set_1_daily_energy', questionType: 'follow_up' },
  3: { set: 'set_2_crisis_and_judgment', questionType: 'main' },
  4: { set: 'set_2_crisis_and_judgment', questionType: 'follow_up' },
  5: { set: 'set_3_sns_and_social_awareness', questionType: 'main' },
  6: { set: 'set_3_sns_and_social_awareness', questionType: 'follow_up' },
}

const PERSONA_INTERVIEW_SYSTEM_PROMPT = `
[역할]
너는 전시회에 방문한 관람객의 숨겨진 본성과 페르소나를 예리하게 파악해내는 '수석 프로파일러 AI'야. 너의 말투는 지루하거나 기계적이지 않고, 마치 흥미로운 심리 테스트를 진행하는 게임 마스터처럼 유쾌하고 통찰력 있어야 해.

[목표]
사용자와의 대화를 통해 아래의 페르소나 요소들을 완벽하게 파악해야 해.
- 말투 및 평소 텍스트 작성 습관
- SNS 업로드 스타일 (과시형, 기록형, 눈팅족 등)
- 상황 인지 및 대처 성향 (당황함, 침착함, 회피 등)
- 판단 성향 (감정적 공감 vs 이성적 해결)
- 심리 지표 (외향/내향, 감각/직관, 사고/감정, 판단/인식)
※ 단, 질문에서 "당신은 T인가요 F인가요?" 같은 노골적인 MBTI 단어나 심리학 전문 용어는 절대 사용하지 마. 철저히 '구체적인 상황'과 '행동 묘사'로 숨겨서 파악해.

[진행 규칙]
1. 대화는 반드시 한 번에 하나의 질문만 출력하며, 총 6번의 턴(질문 6개)으로 진행돼.
2. 전체 흐름은 [메인 상황 질문 -> 사용자의 답변 -> 그 답변을 물고 늘어지는 꼬리 질문]의 한 세트를 총 3번 반복하는 구조야.
- 1번 질문(메인), 3번 질문(메인), 5번 질문(메인)은 새로운 상황을 제시해.
- 2번 질문(꼬리), 4번 질문(꼬리), 6번 질문(꼬리)은 직전 답변을 바탕으로 "아, OOO을 선택하셨군요! 그렇다면..." 식으로 더 깊은 TMI와 본성을 찌르는 돌발 상황을 제시해.
3. 모든 질문(1~6번)에는 반드시 관람객이 선택할 수 있는 '명확한 행동이 묘사된 추천 답변(선택지) 4개'를 함께 제시해.
4. 선택지 4개는 각각 성향이 확연히 다르게 나뉘도록 작성해. 단, 너무 극단적이거나 작위적인 예시보다는 현실에서 충분히 있을 법한 현실적인 행동들을 적절히 섞어줘.

[질문 세트 가이드 (총 3세트 / 6턴)]
- [세트 1] 일상 및 에너지 방향 (1, 2번 질문): 가벼운 여행, 휴일, 약속 등의 상황. (외향/내향, 계획/즉흥 파악)
- [세트 2] 위기 상황 대처 및 판단 (3, 4번 질문): 갑작스러운 문제 발생, 친구와의 갈등 등. (사고/감정, 이성적 해결/감정적 공감, 대처 성향 파악)
- [세트 3] SNS 및 타인 의식 (5, 6번 질문): 기가 막힌 뷰포인트 발견, 남들이 다 하는 트렌드 등. (SNS 업로드 스타일, 타인 의식 성향 파악)

[표현 가이드]
- 질문 문장은 관람객이 바로 상상할 수 있게 구체적인 장면으로 시작해.
- 꼬리 질문(2,4,6번)은 "그렇다면,"으로 시작하고 직전 답변을 과하게 해석하지 말고 중립적으로 이어가.
- 꼬리 질문에서 "아, OOO군요" 같은 과한 코멘트나 심리 추정 문장은 쓰지 마.
- 매 턴 질문의 상황 장치(장소/인물관계/시간압박/돌발변수)를 최소 2개 이상 섞어, 질문이 단조롭게 반복되지 않게 해.
- 직전 질문과 동일한 소재·명사·문장 시작 패턴을 반복하지 마. (예: 계속 "친구가 연락"으로 시작 금지)
- 선택지 4개는 각각 다른 행동 전략이 분명히 드러나야 해. (예: 통제형/유연형/회피형/관계중심형)
- 선택지는 현실적인 문장으로 작성하고, 길이는 너무 길지 않게 유지해.
- MBTI/심리학 용어를 직접 쓰지 말고 행동 묘사로만 성향을 드러내.
- 말투는 흥미롭고 게임 마스터처럼 리드하되 과장되거나 유치하지 않게 유지해.

[중요]
- 출력 형식(번호, JSON 포맷, 필드 구조)은 호출한 시스템이 따로 지정한다.
- 너는 위 규칙에 맞는 질문 내용과 선택지의 품질에만 집중해.
`.trim()

const HAIR_COLOR_ENUM = [
  'black',
  'dark_brown',
  'brown',
  'light_brown',
  'blonde',
  'gray',
  'white',
  'red',
  'orange',
  'pink',
  'blue',
  'green',
  'purple',
  'multicolor',
  'unknown',
]

const EYE_COLOR_ENUM = ['black', 'dark_brown', 'brown', 'hazel', 'green', 'blue', 'gray', 'amber', 'unknown']

const APPEARANCE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    hair_style: {
      type: 'string',
      enum: [
        'short_cut',
        'crew_cut',
        'two_block',
        'dandy_cut',
        'pomade',
        'bob_straight',
        'bob_c_curl',
        'long_straight',
        'long_wave',
        'ponytail_high',
        'ponytail_low',
        'pigtails',
        'half_up',
        'bun',
        'braid_one_side',
        'braids_both',
        'hime_cut',
        'unknown',
      ],
      description: 'Main visible hair style. Korean taxonomy: 숏컷/크루컷/투블럭/댄디컷/포마드/단발(스트레이트)/단발(C컬)/장발(스트레이트)/장발(웨이브)/포니테일(높음)/포니테일(낮음)/양갈래/반묶음/번헤어/땋은 머리(한쪽)/땋은 머리(양쪽)/히메컷',
    },
    hair_part_direction: {
      type: 'string',
      enum: ['none', 'center', 'left', 'right', 'unknown'],
      description: 'Hair part direction. Korean taxonomy: 없음/중앙/좌측/우측',
    },
    bangs_type: {
      type: 'string',
      enum: ['none', 'see_through', 'full_bang', 'unknown'],
      description: 'Bangs style. Korean taxonomy: 없음/시스루/풀뱅',
    },
    hair_color: {
      type: 'string',
      enum: HAIR_COLOR_ENUM,
      description: 'Main visible hair color.',
    },
    eye_type: {
      type: 'string',
      enum: [
        'upturned_cat_eyes',
        'round_dog_eyes',
        'narrow_long_eyes',
        'smiling_crescent_eyes',
        'sleepy_eyes',
        'dark_circles_eyes',
        'unknown',
      ],
      description: 'Eye style. Korean taxonomy: 올라간 눈/둥근 눈/가늘고 긴 눈/웃는 눈/졸린 눈/다크서클 있는 눈',
    },
    eye_color: {
      type: 'string',
      enum: EYE_COLOR_ENUM,
      description: 'Main visible iris/eye color.',
    },
    mouth_type: {
      type: 'string',
      enum: ['flat', 'closed_smile', 'big_smile', 'pout', 'smirk', 'w_shape', 'surprised', 'unknown'],
      description: 'Mouth style. Korean taxonomy: 일자 입/미소(닫힌 입)/활짝 웃는 입/삐진 입/한쪽 올라간 입/W형 입/놀란 입',
    },
    top_type: {
      type: 'string',
      enum: ['short_sleeve_tshirt', 'long_sleeve_tshirt', 'shirt', 'hoodie', 'casual_zip_jacket', 'unknown'],
      description: 'Top clothing type. Korean taxonomy: 반팔 티셔츠/긴팔 티셔츠/셔츠/후드티/캐주얼 자켓(얇은 집업)',
    },
    bottom_type: {
      type: 'string',
      enum: ['wide_long_pants', 'shorts', 'long_skirt', 'short_skirt', 'unknown'],
      description: 'Bottom clothing type. Korean taxonomy: 와이드 긴바지/반바지/롱 스커트/숏 스커트',
    },
    accessories: {
      type: 'object',
      additionalProperties: false,
      properties: {
        glasses_type: {
          type: 'string',
          enum: ['none', 'round', 'square', 'unknown'],
          description: 'Glasses type. Korean taxonomy: 안경 없음/안경(둥근)/안경(사각)',
        },
        has_necklace: {
          type: 'boolean',
          description: 'Whether necklace is visible.',
        },
        has_earrings: {
          type: 'boolean',
          description: 'Whether earrings are visible.',
        },
      },
      required: ['glasses_type', 'has_necklace', 'has_earrings'],
      description: 'Accessory attributes.',
    },
  },
  required: [
    'hair_style',
    'hair_part_direction',
    'bangs_type',
    'hair_color',
    'eye_type',
    'eye_color',
    'mouth_type',
    'top_type',
    'bottom_type',
    'accessories',
  ],
}

const PERSONA_QUESTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    turn: {
      type: 'integer',
      minimum: 1,
      maximum: PERSONA_TOTAL_TURNS,
    },
    set: {
      type: 'string',
      enum: [
        'set_1_daily_energy',
        'set_2_crisis_and_judgment',
        'set_3_sns_and_social_awareness',
      ],
    },
    question_type: {
      type: 'string',
      enum: ['main', 'follow_up'],
    },
    question: {
      type: 'string',
      minLength: 1,
    },
    options: {
      type: 'array',
      minItems: 4,
      maxItems: 4,
      items: {
        type: 'string',
        minLength: 1,
      },
    },
  },
  required: ['turn', 'set', 'question_type', 'question', 'options'],
}

const PERSONA_RESULT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    persona_title: {
      type: 'string',
      minLength: 1,
    },
    one_line_summary: {
      type: 'string',
      minLength: 1,
    },
    tone_text_habit: {
      type: 'string',
      enum: ['직설·간결형', '구조·설명형', '맥락·공감형', '가벼운·캐주얼형', '신중·절제형'],
    },
    sns_upload_style: {
      type: 'string',
      enum: ['과시형', '기록형', '눈팅형', '트렌드참여형', '소수공유형'],
    },
    situation_response_tendency: {
      type: 'string',
      enum: ['침착_구조형', '즉시_행동형', '회피_지연형', '감정_안정형', '경계_보호형'],
    },
    judgment_tendency: {
      type: 'string',
      enum: ['해결_우선형', '공감_우선형', '균형_조율형'],
    },
    core_traits: {
      type: 'array',
      minItems: 3,
      maxItems: 6,
      items: {
        type: 'string',
        minLength: 1,
      },
    },
    confidence: {
      type: 'integer',
      minimum: 0,
      maximum: 100,
    },
    evidence: {
      type: 'array',
      minItems: 3,
      maxItems: 6,
      items: {
        type: 'string',
        minLength: 1,
      },
    },
  },
  required: [
    'persona_title',
    'one_line_summary',
    'tone_text_habit',
    'sns_upload_style',
    'situation_response_tendency',
    'judgment_tendency',
    'core_traits',
    'confidence',
    'evidence',
  ],
}

const personaSessions = new Map()

const extractStructuredText = (payload) => {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim()
  }

  if (!Array.isArray(payload?.output)) {
    return null
  }

  for (const outputItem of payload.output) {
    const contents = Array.isArray(outputItem?.content) ? outputItem.content : []

    for (const contentItem of contents) {
      if (contentItem?.type === 'output_text' && typeof contentItem?.text === 'string' && contentItem.text.trim()) {
        return contentItem.text.trim()
      }
    }
  }

  return null
}

const extractStructuredJson = (payload) => {
  const structuredText = extractStructuredText(payload)

  if (!structuredText) {
    throw new Error('No structured JSON was returned by the model.')
  }

  try {
    return JSON.parse(structuredText)
  } catch {
    throw new Error('Model returned non-JSON output unexpectedly.')
  }
}

const requestStructuredJson = async ({ apiKey, schemaName, schema, input, maxOutputTokens = 700 }) => {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input,
      text: {
        format: {
          type: 'json_schema',
          name: schemaName,
          strict: true,
          schema,
        },
      },
      max_output_tokens: maxOutputTokens,
    }),
  })

  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload?.error?.message || 'OpenAI request failed.')
  }

  return extractStructuredJson(payload)
}

const getTurnMeta = (turn) => PERSONA_TURN_SCHEDULE[turn] ?? PERSONA_TURN_SCHEDULE[1]

const cleanupExpiredPersonaSessions = () => {
  const now = Date.now()
  for (const [sessionId, session] of personaSessions.entries()) {
    if (now - session.updatedAt > PERSONA_SESSION_TTL_MS) {
      personaSessions.delete(sessionId)
    }
  }
}

const personaCleanupInterval = setInterval(cleanupExpiredPersonaSessions, 5 * 60 * 1000)
personaCleanupInterval.unref()

const serializePersonaHistory = (answers) =>
  answers.map((entry) => ({
    turn: entry.turn,
    questionType: entry.questionType,
    question: entry.question,
    suggestedOptions: entry.options,
    answer: entry.answer,
    answerMode: entry.answerMode,
  }))

const generatePersonaQuestion = async ({ apiKey, session, turn }) => {
  const turnMeta = getTurnMeta(turn)
  const previousEntry = session.answers[session.answers.length - 1] ?? null
  const interviewHistory = serializePersonaHistory(session.answers)
  const recentQuestions = session.answers.slice(-3).map((entry) => entry.question)

  const generated = await requestStructuredJson({
    apiKey,
    schemaName: `persona_turn_${turn}`,
    schema: PERSONA_QUESTION_SCHEMA,
    maxOutputTokens: 700,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: PERSONA_INTERVIEW_SYSTEM_PROMPT,
          },
          {
            type: 'input_text',
            text:
              'You are generating one interview turn as strict JSON for a frontend parser. Never output markdown. Keep language Korean. Do not include numbering markers like [1/6] or "1.". The frontend already renders list items.',
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: [
              `Generate turn ${turn} of ${PERSONA_TOTAL_TURNS}.`,
              `This turn must be: ${turnMeta.questionType}.`,
              `This turn belongs to set: ${turnMeta.set}.`,
              'Rules:',
              '- Return one question and exactly 4 option texts.',
              '- All options should be realistic and behavior-specific.',
              '- The 4 options must clearly separate tendencies (planful, adaptive, avoidant, social-aware etc.) without becoming cartoonish.',
              '- If question_type is follow_up, start the question with "그렇다면,".',
              '- For follow_up, do not write evaluative lead-ins like "아, ...군요", and do not over-interpret motives.',
              '- For follow_up, reference previous answer briefly and neutrally, then move to the new scenario immediately.',
              '- If question_type is main, start a fresh scenario and do not mention previous answer.',
              '- Use varied context details: place, relationship, time pressure, and surprise events.',
              '- Avoid repeating nouns and opening patterns from recent questions.',
              '- Avoid generating generic "추천 답변" style placeholders; all option text must be concrete.',
              '- No MBTI jargon and no psychology terms directly.',
              '',
              `Previous answer (for follow_up context): ${previousEntry ? previousEntry.answer : 'none'}`,
              `Recent question texts to avoid repeating: ${JSON.stringify(recentQuestions)}`,
              `Interview history JSON: ${JSON.stringify(interviewHistory)}`,
              `Appearance hint JSON (optional context): ${JSON.stringify(session.appearance ?? null)}`,
            ].join('\n'),
          },
        ],
      },
    ],
  })

  return {
    turn,
    set: turnMeta.set,
    question_type: turnMeta.questionType,
    question: typeof generated.question === 'string' ? generated.question.trim() : '',
    options: Array.isArray(generated.options) ? generated.options.map((option) => String(option).trim()) : [],
  }
}

const generatePersonaResult = async ({ apiKey, session }) => {
  const interviewHistory = serializePersonaHistory(session.answers)

  return requestStructuredJson({
    apiKey,
    schemaName: 'persona_final_result',
    schema: PERSONA_RESULT_SCHEMA,
    maxOutputTokens: 900,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: PERSONA_INTERVIEW_SYSTEM_PROMPT,
          },
          {
            type: 'input_text',
            text:
              'You are now finishing the 6-turn interview. Output only strict JSON that follows the schema. All text and enum values must be in Korean. Do not include any psych_indicator field.',
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: [
              'Create final persona analysis from the transcript.',
              'Use all 6 turns to infer style robustly.',
              'Store result in Korean values only.',
              'Interview transcript JSON:',
              JSON.stringify(interviewHistory),
              'Appearance JSON (secondary context):',
              JSON.stringify(session.appearance ?? null),
            ].join('\n'),
          },
        ],
      },
    ],
  })
}

const app = express()
const port = Number(process.env.PORT || 8787)

app.use(express.json({ limit: '15mb' }))

app.get('/api/persona-system-prompt', (req, res) => {
  res.json({ systemPrompt: PERSONA_INTERVIEW_SYSTEM_PROMPT })
})

app.post('/api/persona/start', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    res.status(500).json({ error: 'OPENAI_API_KEY is not configured on the server.' })
    return
  }

  cleanupExpiredPersonaSessions()

  const sessionId = randomUUID()
  const appearance = req.body?.appearance && typeof req.body.appearance === 'object' ? req.body.appearance : null
  const now = Date.now()

  const session = {
    id: sessionId,
    createdAt: now,
    updatedAt: now,
    appearance,
    answers: [],
    currentTurn: 1,
    currentQuestion: null,
    result: null,
  }

  try {
    const firstQuestion = await generatePersonaQuestion({ apiKey, session, turn: 1 })
    session.currentQuestion = firstQuestion
    personaSessions.set(sessionId, session)

    res.json({
      sessionId,
      question: firstQuestion,
    })
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to start persona interview.' })
  }
})

app.post('/api/persona/answer', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY
  const sessionId = typeof req.body?.sessionId === 'string' ? req.body.sessionId.trim() : ''
  const answer = typeof req.body?.answer === 'string' ? req.body.answer.trim() : ''
  const answerModeRaw = typeof req.body?.answerMode === 'string' ? req.body.answerMode.trim() : 'suggested'
  const answerMode = answerModeRaw === 'custom' ? 'custom' : 'suggested'

  if (!apiKey) {
    res.status(500).json({ error: 'OPENAI_API_KEY is not configured on the server.' })
    return
  }

  if (!sessionId) {
    res.status(400).json({ error: 'sessionId is required.' })
    return
  }

  if (!answer) {
    res.status(400).json({ error: 'answer is required.' })
    return
  }

  cleanupExpiredPersonaSessions()

  const session = personaSessions.get(sessionId)

  if (!session) {
    res.status(404).json({ error: 'Persona session not found or expired.' })
    return
  }

  if (session.result) {
    res.json({
      done: true,
      result: session.result,
    })
    return
  }

  const currentQuestion = session.currentQuestion

  if (!currentQuestion) {
    res.status(409).json({ error: 'Session state is invalid. Current question not found.' })
    return
  }

  session.answers.push({
    turn: currentQuestion.turn,
    set: currentQuestion.set,
    questionType: currentQuestion.question_type,
    question: currentQuestion.question,
    options: currentQuestion.options,
    answer,
    answerMode,
  })
  session.updatedAt = Date.now()

  try {
    if (currentQuestion.turn >= PERSONA_TOTAL_TURNS) {
      const result = await generatePersonaResult({ apiKey, session })
      session.result = result
      session.currentQuestion = null
      session.updatedAt = Date.now()

      res.json({
        done: true,
        result,
      })
      return
    }

    const nextTurn = currentQuestion.turn + 1
    const nextQuestion = await generatePersonaQuestion({ apiKey, session, turn: nextTurn })

    session.currentTurn = nextTurn
    session.currentQuestion = nextQuestion
    session.updatedAt = Date.now()

    res.json({
      done: false,
      question: nextQuestion,
    })
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate next persona turn.' })
  }
})

app.post('/api/analyze-appearance', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY
  const imageDataUrl = req.body?.imageDataUrl

  if (!apiKey) {
    res.status(500).json({ error: 'OPENAI_API_KEY is not configured on the server.' })
    return
  }

  if (typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:image/')) {
    res.status(400).json({ error: 'Invalid imageDataUrl.' })
    return
  }

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: 'You classify visible appearance attributes from one photo. Return only valid JSON that strictly follows the schema and enum values.',
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: 'Analyze the person in this image and output the requested fields. Use enum values exactly as defined in the schema. Include hair_color and eye_color from visible evidence. If uncertain, use unknown.',
              },
              {
                type: 'input_image',
                image_url: imageDataUrl,
              },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'appearance_attributes',
            strict: true,
            schema: APPEARANCE_SCHEMA,
          },
        },
        max_output_tokens: 500,
      }),
    })

    const payload = await response.json()

    if (!response.ok) {
      res.status(response.status).json({ error: payload?.error?.message || 'OpenAI request failed.' })
      return
    }

    const structuredText = extractStructuredText(payload)
    if (!structuredText) {
      res.status(502).json({ error: 'No structured JSON was returned by the model.' })
      return
    }

    let parsed
    try {
      parsed = JSON.parse(structuredText)
    } catch {
      res.status(502).json({ error: 'Model returned non-JSON output unexpectedly.' })
      return
    }

    res.json({ result: parsed })
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown server error.' })
  }
})

if (process.env.NODE_ENV === 'production') {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const distPath = path.join(__dirname, 'dist')

  app.use(express.static(distPath))
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})
