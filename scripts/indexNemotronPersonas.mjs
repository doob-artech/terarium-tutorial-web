import 'dotenv/config';
import pg from 'pg';
import { createHash } from 'node:crypto';

const { Pool } = pg;

const DATASET = 'nvidia/Nemotron-Personas-Korea';
const CONFIG = process.env.NEMOTRON_CONFIG || 'default';
const SPLIT = process.env.NEMOTRON_SPLIT || 'train';
const LIMIT = Math.max(1, Number(process.env.NEMOTRON_LIMIT || process.argv[2] || 1000));
const OFFSET = Math.max(0, Number(process.env.NEMOTRON_OFFSET || process.argv[3] || 0));
const PAGE_SIZE = Math.max(1, Math.min(100, Number(process.env.NEMOTRON_PAGE_SIZE || 100)));
const PAGE_DELAY_MS = Math.max(0, Number(process.env.NEMOTRON_PAGE_DELAY_MS || 0));
const RETRY_DELAY_MS = Math.max(1000, Number(process.env.NEMOTRON_RETRY_DELAY_MS || 10000));

const PERSONA_FIELDS = [
  'persona',
  'family_persona',
  'professional_persona',
  'skills_and_expertise',
  'hobbies_and_interests',
  'career_goals_and_ambitions',
  'cultural_background',
  'arts_persona',
  'culinary_persona',
];

const RELATION_KEYWORDS = [
  '관계',
  '대화',
  '신뢰',
  '갈등',
  '배려',
  '돌봄',
  '함께',
  '친구',
  '가족',
  '동료',
  '의견',
  '조율',
  '협력',
  '공감',
  '듣',
  '말',
  '챙기',
  '도와',
  '사과',
  '화해',
  '질투',
  '서운',
  '친밀',
];

const SOCIAL_FRICTION_KEYWORDS = [
  '서운',
  '질투',
  '시샘',
  '짜증',
  '화',
  '뒷담',
  '오해',
  '비밀',
  '삐',
  '소외',
  '외로',
  '갈등',
  '말다툼',
  '투닥',
  '눈치',
  '비꼬',
  '사과',
  '화해',
  '상처',
  '침묵',
  '불만',
  '고집',
  '참다',
  '속마음',
  '혼자',
  '관심',
  '반응',
  'SNS',
  '단체 채팅',
];

const SOCIAL_INTERACTION_KEYWORDS = [
  '친구',
  '가족',
  '동료',
  '이웃',
  '모임',
  '대화',
  '함께',
  '챙기',
  '들어주',
  '말을',
  '분위기',
  '기분',
  '관계',
  '신뢰',
  '배려',
  '협력',
  '조율',
];

const pool = new Pool({
  host: process.env.POSTGRES_HOST || '127.0.0.1',
  port: Number(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER || 'terarium',
  password: process.env.POSTGRES_PASSWORD || '',
  database: process.env.POSTGRES_DB || 'terarium_memory',
  max: 4,
});

function hashText(value) {
  return createHash('sha1').update(String(value || '')).digest('hex');
}

function compactText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function selectPersonaFields(row) {
  const selected = {};
  for (const field of PERSONA_FIELDS) {
    const value = compactText(row?.[field]);
    if (value) selected[field] = value;
  }
  return selected;
}

function buildReferenceText(fields) {
  return PERSONA_FIELDS
    .map((field) => (fields[field] ? `[${field}] ${fields[field]}` : ''))
    .filter(Boolean)
    .join('\n')
    .slice(0, 2200);
}

function relationScore(text) {
  const relation = RELATION_KEYWORDS.reduce((score, keyword) => score + (text.includes(keyword) ? 1 : 0), 0);
  const interaction = SOCIAL_INTERACTION_KEYWORDS.reduce((score, keyword) => score + (text.includes(keyword) ? 1 : 0), 0);
  const friction = SOCIAL_FRICTION_KEYWORDS.reduce((score, keyword) => score + (text.includes(keyword) ? 1 : 0), 0);
  return relation + interaction + friction * 2;
}

function tagsFor(text) {
  const tags = [];
  if (/갈등|의견|화해|사과|서운|질투/.test(text)) tags.push('conflict');
  if (/돌봄|챙기|도와|배려|공감/.test(text)) tags.push('care');
  if (/신뢰|친밀|가까워|관계/.test(text)) tags.push('trust');
  if (/대화|말|듣|질문/.test(text)) tags.push('conversation');
  if (/함께|동료|친구|가족|협력/.test(text)) tags.push('group');
  if (/서운|질투|시샘|짜증|뒷담|오해|비밀|소외|외로|눈치|비꼬|상처|불만|고집|속마음/.test(text)) tags.push('social_friction');
  if (/SNS|단체 채팅|댓글|반응|관심/.test(text)) tags.push('sns_texture');
  return [...new Set(tags)];
}

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS nemotron_persona_refs (
      ref_id TEXT PRIMARY KEY,
      source_dataset TEXT NOT NULL,
      source_uuid TEXT,
      masked_text TEXT NOT NULL,
      persona_fields_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      relationship_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      relationship_score REAL NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE nemotron_persona_refs ADD COLUMN IF NOT EXISTS persona_fields_json JSONB NOT NULL DEFAULT '{}'::jsonb;
    CREATE INDEX IF NOT EXISTS idx_nemotron_persona_refs_tags ON nemotron_persona_refs USING GIN (relationship_tags);
    CREATE INDEX IF NOT EXISTS idx_nemotron_persona_refs_created_at ON nemotron_persona_refs(created_at DESC);
  `);
}

async function fetchRows(offset, length) {
  const url = new URL('https://datasets-server.huggingface.co/rows');
  url.searchParams.set('dataset', DATASET);
  url.searchParams.set('config', CONFIG);
  url.searchParams.set('split', SPLIT);
  url.searchParams.set('offset', String(offset));
  url.searchParams.set('length', String(length));

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(url);
    if (response.ok) {
      const payload = await response.json();
      return Array.isArray(payload.rows) ? payload.rows.map((item) => item.row || {}) : [];
    }
    const body = await response.text();
    if ((response.status === 429 || response.status >= 500) && attempt < 3) {
      await sleep(RETRY_DELAY_MS * attempt);
      continue;
    }
    throw new Error(`Hugging Face rows request failed: ${response.status} ${response.statusText} ${body}`);
  }
  return [];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function insertDocs(docs) {
  if (docs.length === 0) return 0;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const doc of docs) {
      await client.query(
        `
          INSERT INTO nemotron_persona_refs (
            ref_id,
            source_dataset,
            source_uuid,
            masked_text,
            persona_fields_json,
            relationship_tags,
            relationship_score,
            created_at
          )
          VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, NOW())
          ON CONFLICT (ref_id)
          DO UPDATE SET
            masked_text = EXCLUDED.masked_text,
            persona_fields_json = EXCLUDED.persona_fields_json,
            relationship_tags = EXCLUDED.relationship_tags,
            relationship_score = EXCLUDED.relationship_score
        `,
        [
          doc.ref_id,
          DATASET,
          doc.source_uuid,
          doc.reference_text,
          JSON.stringify(doc.persona_fields),
          JSON.stringify(doc.relationship_tags),
          doc.relationship_score,
        ],
      );
    }
    await client.query('COMMIT');
    return docs.length;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  await ensureTable();
  let inserted = 0;
  let seen = 0;
  for (let offset = OFFSET; seen < LIMIT; offset += PAGE_SIZE) {
    const length = Math.min(PAGE_SIZE, LIMIT - seen);
    const rows = await fetchRows(offset, length);
    if (rows.length === 0) break;
    seen += rows.length;

    const docs = rows
      .map((row) => {
        const persona_fields = selectPersonaFields(row);
        const reference_text = buildReferenceText(persona_fields);
        const relationship_score = relationScore(reference_text);
        const source_uuid = String(row.uuid || '').trim();
        return {
          ref_id: source_uuid || `nemotron_${hashText(reference_text)}`,
          source_uuid,
          persona_fields,
          reference_text,
          relationship_score,
          relationship_tags: tagsFor(reference_text),
        };
      })
      .filter((doc) => doc.reference_text.length >= 120 && doc.relationship_score >= 3);

    inserted += await insertDocs(docs);
    process.stdout.write(`\rseen=${seen}/${LIMIT} inserted_or_updated=${inserted}`);
    if (PAGE_DELAY_MS > 0) await sleep(PAGE_DELAY_MS);
  }
  process.stdout.write('\n');
  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  await pool.end().catch(() => {});
  process.exit(1);
});
