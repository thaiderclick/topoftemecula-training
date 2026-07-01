#!/usr/bin/env node
/**
 * parse-curriculum.mjs
 *
 * Reads CURRICULUM.md and regenerates client/src/data/trainingData.ts
 *
 * Usage:
 *   node scripts/parse-curriculum.mjs
 *
 * CURRICULUM.md is the single source of truth. Edit the markdown, run this
 * script, and the TypeScript data file is updated automatically.
 *
 * ─── Supported markdown blocks ───────────────────────────────────────────────
 *
 * MODULE HEADER (starts a new Day/Module) — single or double #:
 *   # DAY N — Title      (or ## DAY N — Title)
 *   **Subtitle:** ... / **Duration:** ... / **Description:** ...
 *
 * RUN-OF-DAY (facilitator pacing table, one per day):
 *   ### Run-of-Day ...
 *   | Block | Activity | Time |  (markdown table)
 *
 * SLIDE HEADER:  ### Slide N — Title   (type inferred from content)
 *   Slide type detection (priority order):
 *     1. **Scenario:** + **Script:**            → 'scenarios'
 *     2. **Label:** + **Script:**               → 'script'
 *     3. ✅ DO / ❌ DON'T                         → 'dosdonts'
 *     4. **Prompt:** + **Answer:**              → 'recall'
 *     5. **Objection:** + **Response:**         → 'objection'
 *     6. everything else                        → 'text'
 *   Text/script slides keep paragraphs, ordered/unordered lists, and tables.
 *   Embed a video with a line:  @video <youtube-url> | <optional caption>
 *
 * ACTIVITY BLOCK:  ### Activity NX — Title
 *   **Activity:** / **Time:** / **Goal:** / **Steps:** (list) / **Template:** (```code```) / **Done when:** / **Rubric...:** (list)
 *
 * DRILL BLOCK:  ### Drill NX — Title
 *   **Drill:** / **Time:** / **How:** + lists / etc.
 *
 * FIELD SCENARIO CARDS (inside a slide):  **Scenario:** / **Rung:** / **Script:**
 *
 * FACILITATOR NOTES:  > **Facilitator:** ...   → excluded (not trainee-facing)
 * KEY CALLOUT:        > **Key Callout:** ...   → slide.highlight
 *
 * QUIZ:  ### Day N Quiz  → **Q1.** ... / - A) option / - B) ✅ correct / *Explanation: ...*
 * ASSIGNMENT:  ### Day N Assignment — Title
 * FINAL TEST:  ## FINAL READINESS TEST   |   SHIFT DEBRIEF: ## SHIFT 1 DEBRIEF (skipped)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CURRICULUM_PATH = resolve(ROOT, 'CURRICULUM.md');
const OUTPUT_PATH = resolve(ROOT, 'client/src/data/trainingData.ts');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripInlineMarkdown(text) {
  return text
    .replace(/^#{1,6}\s+/, '')         // leading heading hashes
    .replace(/\*\*(.*?)\*\*/g, '$1')   // bold
    .replace(/\*(.*?)\*/g, '$1')       // italic
    .replace(/`(.*?)`/g, '$1')         // code
    .trim();
}

function stripQuotes(text) {
  return text.replace(/^[""“”]+|[""“”]+$/g, '').trim();
}

function escapeTs(str) {
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

function ts(str) {
  return '`' + escapeTs(str) + '`';
}

// Extract an 11-char YouTube video id from watch/youtu.be/embed URLs (or a bare id).
function parseYouTubeId(url) {
  const u = url.trim();
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,        // watch?v=ID
    /youtu\.be\/([A-Za-z0-9_-]{11})/,   // youtu.be/ID
    /\/embed\/([A-Za-z0-9_-]{11})/,     // /embed/ID
  ];
  for (const p of patterns) {
    const m = u.match(p);
    if (m) return m[1];
  }
  if (/^[A-Za-z0-9_-]{11}$/.test(u)) return u; // bare id
  return null;
}

// ─── Line-level parsers ───────────────────────────────────────────────────────

function parseQuizBlock(lines) {
  const questions = [];
  let current = null;

  for (const line of lines) {
    const qMatch = line.match(/^\*\*[QF]\d+\.\*\*\s+(.+)/);
    if (qMatch) {
      if (current) questions.push(current);
      current = { id: `q${questions.length + 1}`, text: stripInlineMarkdown(qMatch[1]), options: [], correctAnswer: 0, explanation: '' };
      continue;
    }
    if (!current) continue;

    const optMatch = line.match(/^-\s+[A-Z]\)\s+(.*)/);
    if (optMatch) {
      const raw = optMatch[1];
      const isCorrect = raw.includes('✅');
      const text = raw.replace('✅', '').trim();
      if (isCorrect) current.correctAnswer = current.options.length;
      current.options.push(text);
      continue;
    }

    const expMatch = line.match(/^\*Explanation:\s+(.*)\*$/);
    if (expMatch) {
      current.explanation = expMatch[1].trim();
    }
  }
  if (current) questions.push(current);
  return questions;
}

function parseScripts(lines) {
  const scripts = [];
  let label = null;
  for (const line of lines) {
    const labelMatch = line.match(/^\*\*Label:\*\*\s+(.+)/);
    if (labelMatch) { label = stripInlineMarkdown(labelMatch[1]); continue; }
    const scriptMatch = line.match(/^\*\*Script:\*\*\s+(.+)/);
    if (scriptMatch && label) {
      const text = stripQuotes(stripInlineMarkdown(scriptMatch[1]));
      scripts.push({ label, text });
      label = null;
    }
  }
  return scripts;
}

function parseScenarios(lines) {
  const cards = [];
  let cur = null;
  for (const line of lines) {
    const s = line.match(/^\*\*Scenario:\*\*\s+(.+)/);
    if (s) {
      if (cur) cards.push(cur);
      const rawScenario = stripInlineMarkdown(s[1]).replace(/^"(.+?)"\s*/, '$1 ').trim();
      cur = { scenario: stripQuotes(rawScenario), rung: '', script: '' };
      continue;
    }
    if (!cur) continue;
    const r = line.match(/^\*\*Rung:\*\*\s+(.+)/);
    if (r) { cur.rung = stripInlineMarkdown(r[1]); continue; }
    const sc = line.match(/^\*\*Script:\*\*\s+(.+)/);
    if (sc) { cur.script = stripQuotes(stripInlineMarkdown(sc[1])); }
  }
  if (cur) cards.push(cur);
  return cards;
}

function parseDosDonts(lines) {
  const items = [];
  for (const line of lines) {
    const doMatch = line.match(/^✅\s+DO(?:\s+Say)?:\s+"?(.+?)"?$/);
    if (doMatch) { items.push({ bad: false, label: 'DO', text: stripInlineMarkdown(doMatch[1]) }); continue; }
    const dontMatch = line.match(/^❌\s+DON'T(?:\s+Say)?:\s+"?(.+?)"?$/);
    if (dontMatch) { items.push({ bad: true, label: "DON'T", text: stripInlineMarkdown(dontMatch[1]) }); }
  }
  return items;
}

function parseRecallPrompts(lines) {
  const prompts = [];
  let prompt = null;
  for (const line of lines) {
    const pMatch = line.match(/^\*\*Prompt:\*\*\s+(.+)/);
    if (pMatch) { prompt = stripInlineMarkdown(pMatch[1]); continue; }
    const aMatch = line.match(/^\*\*Answer:\*\*\s+(.+)/);
    if (aMatch && prompt) {
      prompts.push({ prompt, answer: stripInlineMarkdown(aMatch[1]) });
      prompt = null;
    }
  }
  return prompts;
}

function parseHighlight(lines) {
  let fallback = null;
  for (const raw of lines) {
    const t = raw.trim();
    if (!t.startsWith('>')) continue;
    if (/\*\*Facilitator/i.test(t)) continue; // facilitator notes are not trainee-facing
    const key = t.match(/^>\s+\*?\*?\*?Key Callout:\*?\*?\*?\s+(.*)/i);
    if (key) return stripInlineMarkdown(key[1]);
    if (!fallback) {
      const gen = t.match(/^>\s+(.+?)\s*$/);
      if (gen) fallback = stripQuotes(stripInlineMarkdown(gen[1]));
    }
  }
  return fallback;
}

// Pull markdown tables out of a block of lines. Returns { tables, rest }.
function isTableSeparator(cells) {
  return cells.length > 0 && cells.every(c => /^:?-{1,}:?$/.test(c.trim()));
}

function parseTableLines(tableLines) {
  const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map(c => stripInlineMarkdown(c).trim());
  const rows = tableLines.map(cells).filter(r => !isTableSeparator(r));
  if (rows.length < 1) return null;
  const headers = rows[0];
  const body = rows.slice(1);
  return { headers, rows: body };
}

function extractTables(lines) {
  const tables = [];
  const rest = [];
  let buf = [];
  const flush = () => {
    if (buf.length) {
      const t = parseTableLines(buf);
      if (t) tables.push(t);
      buf = [];
    }
  };
  for (const l of lines) {
    if (l.trim().startsWith('|')) buf.push(l);
    else { flush(); rest.push(l); }
  }
  flush();
  return { tables, rest };
}

// Rich content: ordered list of paragraph / list / code blocks.
function parseContent(lines) {
  const blocks = [];
  let para = [];
  let list = null;
  let inCode = false;
  let codeLines = [];
  const flushPara = () => { if (para.length) { blocks.push({ kind: 'p', text: para.join(' ') }); para = []; } };
  const flushList = () => { if (list) { blocks.push({ kind: 'list', items: list.items, ordered: list.ordered }); list = null; } };

  for (const raw of lines) {
    if (raw.trim().startsWith('```')) {
      if (!inCode) { flushPara(); flushList(); inCode = true; codeLines = []; }
      else { inCode = false; blocks.push({ kind: 'code', text: codeLines.join('\n') }); }
      continue;
    }
    if (inCode) { codeLines.push(raw); continue; }

    const l = raw.trim();
    if (!l) { flushPara(); flushList(); continue; }
    const vid = l.match(/^@video\s+(\S+)(?:\s*\|\s*(.+))?$/i);
    if (vid) {
      flushPara(); flushList();
      const videoId = parseYouTubeId(vid[1]);
      if (videoId) {
        const block = { kind: 'video', videoId };
        if (vid[2]) block.title = vid[2].trim();
        blocks.push(block);
      }
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(l)) { flushPara(); flushList(); continue; } // horizontal rule
    if (l.startsWith('>') || l.startsWith('|')) { flushPara(); flushList(); continue; }
    if (/^\*\*(Label|Script|Prompt|Answer|Scenario|Rung):/.test(l) || l.startsWith('✅') || l.startsWith('❌') || /^\*Explanation:/.test(l)) {
      flushPara(); flushList();
      continue;
    }
    const num = l.match(/^\d+\.\s+(.*)/);
    const bul = l.match(/^[-*]\s+(?:\[[ xX]\]\s+)?(.*)/);
    if (num) { flushPara(); if (!list || !list.ordered) { flushList(); list = { ordered: true, items: [] }; } list.items.push(stripInlineMarkdown(num[1])); continue; }
    if (bul) { flushPara(); if (!list || list.ordered) { flushList(); list = { ordered: false, items: [] }; } list.items.push(stripInlineMarkdown(bul[1])); continue; }
    flushList();
    para.push(stripInlineMarkdown(l));
  }
  flushPara();
  flushList();
  return blocks.filter(b => {
    if (b.kind === 'p') return b.text;
    if (b.kind === 'code') return b.text;
    if (b.kind === 'video') return b.videoId;
    return b.items.length;
  });
}

// Activity / Drill: an ordered list of labelled fields, each with text, list items, or a code block.
function parsePracticeBlock(lines) {
  const fields = [];
  let current = null;
  let inCode = false;
  let codeLines = [];

  for (const raw of lines) {
    if (raw.trim().startsWith('```')) {
      if (!inCode) { inCode = true; codeLines = []; }
      else { inCode = false; if (current) current.code = codeLines.join('\n'); }
      continue;
    }
    if (inCode) { codeLines.push(raw); continue; }

    const l = raw.trim();
    if (!l) continue;
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(l)) { current = null; continue; } // horizontal rule ends a block
    if (l.startsWith('>')) continue; // facilitator notes

    const fieldMatch = l.match(/^\*\*(.+?):\*\*\s*(.*)$/);
    if (fieldMatch) {
      const label = fieldMatch[1].trim();
      const inline = stripInlineMarkdown(fieldMatch[2]).trim();
      current = { label, text: inline || undefined, items: [] };
      fields.push(current);
      continue;
    }
    if (!current) continue;

    const num = l.match(/^\d+\.\s+(.*)/);
    const bul = l.match(/^[-*]\s+(?:\[[ xX]\]\s+)?(.*)/);
    if (num) { current.items.push(stripInlineMarkdown(num[1])); continue; }
    if (bul) { current.items.push(stripInlineMarkdown(bul[1])); continue; }
    current.text = (current.text ? current.text + ' ' : '') + stripInlineMarkdown(l);
  }

  // Drop the redundant **Activity:** / **Drill:** name field (the slide title already shows it).
  return fields
    .filter(f => !/^(Activity|Drill)$/i.test(f.label))
    .map(f => {
      const out = { label: f.label };
      if (f.text) out.text = f.text;
      if (f.items && f.items.length) out.items = f.items;
      if (f.code) out.code = f.code;
      return out;
    });
}

function detectSlideType(lines) {
  const joined = lines.join('\n');
  if (joined.includes('**Scenario:**') && joined.includes('**Script:**')) return 'scenarios';
  if (joined.includes('**Label:**') && joined.includes('**Script:**')) return 'script';
  if (joined.includes('✅ DO') || joined.includes("❌ DON'T")) return 'dosdonts';
  if (joined.includes('**Prompt:**') && joined.includes('**Answer:**')) return 'recall';
  if (joined.includes('**Objection:**') && joined.includes('**Response:**')) return 'objection';
  return 'text';
}

function buildSlide(title, lines, forcedType) {
  const highlight = parseHighlight(lines);

  // Forced facilitator-block slides
  if (forcedType === 'runofday') {
    const { tables } = extractTables(lines);
    const slide = { title, type: 'runofday' };
    if (tables.length) slide.table = tables[0];
    return slide;
  }
  if (forcedType === 'activity' || forcedType === 'drill') {
    const slide = { title, type: forcedType, block: { fields: parsePracticeBlock(lines) } };
    if (highlight) slide.highlight = highlight;
    return slide;
  }

  const type = detectSlideType(lines);
  const slide = { title, type };

  if (type === 'script') {
    const { tables, rest } = extractTables(lines);
    const content = parseContent(rest);
    if (content.length) slide.content = content;
    if (tables.length) slide.tables = tables;
    slide.scripts = parseScripts(lines);
  } else if (type === 'scenarios') {
    const { rest } = extractTables(lines);
    const content = parseContent(rest);
    if (content.length) slide.content = content;
    slide.scenarios = parseScenarios(lines);
  } else if (type === 'dosdonts') {
    slide.items = parseDosDonts(lines);
  } else if (type === 'recall') {
    slide.recallPrompts = parseRecallPrompts(lines);
  } else if (type === 'objection') {
    slide.scripts = parseScripts(lines);
  } else {
    const { tables, rest } = extractTables(lines);
    const content = parseContent(rest);
    if (content.length) slide.content = content;
    if (tables.length) slide.tables = tables;
    delete slide.type; // text is the default, omit for cleanliness
  }

  if (highlight) slide.highlight = highlight;
  return slide;
}

function parseRubric(lines) {
  return lines
    .filter(l => l.match(/^-\s+\[[ x]\]/))
    .map(l => l.replace(/^-\s+\[[ x]\]\s+/, '').replace(/\*\*(.*?)\*\*/g, '$1').trim())
    .filter(Boolean);
}

function parseAssignment(lines, title) {
  const rubric = parseRubric(lines);
  const descLines = lines
    .filter(l => l.trim() && !l.match(/^-\s+\[[ x]\]/) && !l.match(/^\*\*Score yourself/) && !/^(-{3,}|\*{3,}|_{3,})$/.test(l.trim()))
    .map(l => stripInlineMarkdown(l))
    .filter(Boolean);

  const type = /roleplay|record/i.test(title) ? 'roleplay' : 'text';
  const placeholder = type === 'roleplay'
    ? 'Paste your Google Drive, YouTube, or Loom link here...'
    : 'Type your response here...';

  return { title, description: descLines.join(' '), type, placeholder, rubric };
}

// ─── Main parser ──────────────────────────────────────────────────────────────

function parseCurriculum(md) {
  const lines = md.split('\n');
  const modules = [];
  const finalTestLines = [];
  let currentModule = null;
  let currentSlideLines = [];
  let currentSlideTitle = null;
  let currentSlideForcedType = null;
  let inFinalTest = false;
  let inShiftDebrief = false;
  let quizLines = [];
  let inQuiz = false;
  let assignmentLines = [];
  let assignmentTitle = '';
  let inAssignment = false;

  function flushSlide() {
    if (!currentSlideTitle || !currentModule) return;
    currentModule.slides.push(buildSlide(currentSlideTitle, currentSlideLines, currentSlideForcedType));
    currentSlideTitle = null;
    currentSlideLines = [];
    currentSlideForcedType = null;
  }

  function flushQuiz() {
    if (!currentModule || !quizLines.length) return;
    currentModule.quiz = parseQuizBlock(quizLines);
    quizLines = [];
    inQuiz = false;
  }

  function flushAssignment() {
    if (!currentModule || !assignmentLines.length) return;
    currentModule.assignment = parseAssignment(assignmentLines, assignmentTitle);
    assignmentLines = [];
    assignmentTitle = '';
    inAssignment = false;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // ── Final Readiness Test ──
    if (line.match(/^## FINAL READINESS TEST/)) {
      flushSlide(); flushQuiz(); flushAssignment();
      inFinalTest = true;
      inShiftDebrief = false;
      currentModule = null;
      continue;
    }

    // ── Shift 1 Debrief ──
    if (line.match(/^## SHIFT 1 DEBRIEF/)) {
      flushSlide(); flushQuiz(); flushAssignment();
      inShiftDebrief = true;
      inFinalTest = false;
      currentModule = null;
      continue;
    }

    if (inFinalTest) { finalTestLines.push(line); continue; }
    if (inShiftDebrief) continue;

    // ── New Module (# DAY N / ## DAY N / FOUNDATIONS / SAFETY) ──
    const moduleMatch = line.match(/^#{1,2} (DAY \d+[^\n]*|FOUNDATIONS[^#]*|SAFETY[^#]*)/iu);
    if (moduleMatch) {
      flushSlide(); flushQuiz(); flushAssignment();

      const headerText = moduleMatch[1].trim();
      const dayMatch = headerText.match(/DAY (\d+)\s*[—–-]\s*(.+)/i);
      const isSafety = /^SAFETY/i.test(headerText);
      const isFoundations = /^FOUNDATIONS/i.test(headerText);

      if (dayMatch || isSafety || isFoundations) {
        let subtitle = '', duration = '', description = '';
        let j = i + 1;
        while (j < lines.length && !/^#{1,3} /.test(lines[j])) {
          const sl = lines[j];
          const subMatch = sl.match(/^\*\*Subtitle:\*\*\s+(.+)/);
          const durMatch = sl.match(/^\*\*Duration:\*\*\s+(.+)/);
          const descMatch = sl.match(/^\*\*Description:\*\*\s+(.+)/);
          if (subMatch) subtitle = stripInlineMarkdown(subMatch[1]);
          if (durMatch) duration = stripInlineMarkdown(durMatch[1]);
          if (descMatch) description = stripInlineMarkdown(descMatch[1]);
          j++;
        }

        const id = isSafety ? 'safety' : isFoundations ? 'foundations' : `day${dayMatch[1]}`;
        const title = isSafety
          ? headerText.replace(/^SAFETY\s*[—&]\s*/i, '').trim()
          : isFoundations
            ? headerText.replace(/^FOUNDATIONS\s*[—–-]\s*/i, '').trim()
            : dayMatch[2].trim();
        const day = isSafety ? 99 : isFoundations ? 0 : parseInt(dayMatch[1]);

        currentModule = { id, day, title, subtitle, duration, description, slides: [], quiz: [], assignment: null };
        modules.push(currentModule);
        inQuiz = false;
        inAssignment = false;
      }
      continue;
    }

    if (!currentModule) continue;

    // ── Quiz section ──
    if (line.match(/^### Day \d+ Quiz|^### Safety Quiz|^### Foundations Quiz/i)) {
      flushSlide();
      inQuiz = true; inAssignment = false;
      continue;
    }

    // ── Assignment section ──
    const assignMatch = line.match(/^### Day \d+ Assignment\s*[—–-]\s*(.+)|^### Safety Assignment\s*[—–-]\s*(.+)|^### Foundations Assignment\s*[—–-]\s*(.+)/i);
    if (assignMatch) {
      flushSlide(); flushQuiz();
      inAssignment = true; inQuiz = false;
      assignmentTitle = (assignMatch[1] || assignMatch[2] || assignMatch[3] || '').trim();
      continue;
    }

    // ── Run-of-Day block ──
    if (line.match(/^### Run-of-Day\b/i)) {
      flushSlide(); flushQuiz(); flushAssignment();
      currentSlideTitle = 'Run of Day';
      currentSlideForcedType = 'runofday';
      currentSlideLines = [];
      inQuiz = false; inAssignment = false;
      continue;
    }

    // ── Activity block ──
    const actMatch = line.match(/^### (Activity\b.+)/i);
    if (actMatch) {
      flushSlide(); flushQuiz(); flushAssignment();
      currentSlideTitle = actMatch[1].trim();
      currentSlideForcedType = 'activity';
      currentSlideLines = [];
      inQuiz = false; inAssignment = false;
      continue;
    }

    // ── Drill block ──
    const drillMatch = line.match(/^### (Drill\b.+)/i);
    if (drillMatch) {
      flushSlide(); flushQuiz(); flushAssignment();
      currentSlideTitle = drillMatch[1].trim();
      currentSlideForcedType = 'drill';
      currentSlideLines = [];
      inQuiz = false; inAssignment = false;
      continue;
    }

    // ── Slide header ──
    const slideMatch = line.match(/^### Slide \d+\s*[—-]\s*(.+)/);
    if (slideMatch) {
      flushSlide(); flushQuiz(); flushAssignment();
      currentSlideTitle = slideMatch[1].trim();
      currentSlideForcedType = null;
      currentSlideLines = [];
      inQuiz = false; inAssignment = false;
      continue;
    }

    // ── Accumulate lines ──
    if (inQuiz) { quizLines.push(line); continue; }
    if (inAssignment) { assignmentLines.push(line); continue; }
    if (currentSlideTitle) { currentSlideLines.push(line); }
  }

  flushSlide(); flushQuiz(); flushAssignment();

  const finalReadinessTestBank = parseQuizBlock(finalTestLines);

  return { modules, finalReadinessTestBank };
}

// ─── TypeScript emitter ───────────────────────────────────────────────────────

function emitTs({ modules, finalReadinessTestBank }) {
  const lines = [];

  lines.push(`// ─────────────────────────────────────────────────────────────────────────────`);
  lines.push(`// AUTO-GENERATED by scripts/parse-curriculum.mjs`);
  lines.push(`// DO NOT EDIT THIS FILE DIRECTLY.`);
  lines.push(`// Edit CURRICULUM.md and run: node scripts/parse-curriculum.mjs`);
  lines.push(`// ─────────────────────────────────────────────────────────────────────────────`);
  lines.push(``);
  lines.push(`export type ContentBlock =`);
  lines.push(`  | { kind: 'p'; text: string }`);
  lines.push(`  | { kind: 'list'; items: string[]; ordered?: boolean }`);
  lines.push(`  | { kind: 'code'; text: string }`);
  lines.push(`  | { kind: 'video'; videoId: string; title?: string };`);
  lines.push(`export interface RecallPrompt { prompt: string; answer: string; }`);
  lines.push(`export interface ScriptItem { label: string; text: string; }`);
  lines.push(`export interface DosDontsItem { bad: boolean; label: string; text: string; }`);
  lines.push(`export interface ScenarioCard { scenario: string; rung: string; script: string; }`);
  lines.push(`export interface TableBlock { headers: string[]; rows: string[][]; }`);
  lines.push(`export interface BlockField { label: string; text?: string; items?: string[]; code?: string; }`);
  lines.push(`export interface PracticeBlock { fields: BlockField[]; }`);
  lines.push(`export interface Slide {`);
  lines.push(`  title: string;`);
  lines.push(`  type?: 'text' | 'script' | 'objection' | 'dosdonts' | 'recall' | 'activity' | 'drill' | 'runofday' | 'scenarios';`);
  lines.push(`  content?: ContentBlock[];`);
  lines.push(`  scripts?: ScriptItem[];`);
  lines.push(`  items?: DosDontsItem[];`);
  lines.push(`  recallPrompts?: RecallPrompt[];`);
  lines.push(`  scenarios?: ScenarioCard[];`);
  lines.push(`  block?: PracticeBlock;`);
  lines.push(`  table?: TableBlock;`);
  lines.push(`  tables?: TableBlock[];`);
  lines.push(`  highlight?: string;`);
  lines.push(`}`);
  lines.push(`export interface Question {`);
  lines.push(`  id: string;`);
  lines.push(`  text: string;`);
  lines.push(`  options: string[];`);
  lines.push(`  correctAnswer: number;`);
  lines.push(`  explanation: string;`);
  lines.push(`}`);
  lines.push(`export interface Assignment {`);
  lines.push(`  title: string;`);
  lines.push(`  description: string;`);
  lines.push(`  type: 'text' | 'roleplay';`);
  lines.push(`  placeholder: string;`);
  lines.push(`  rubric?: string[];`);
  lines.push(`}`);
  lines.push(`export interface Module {`);
  lines.push(`  id: string;`);
  lines.push(`  day: number;`);
  lines.push(`  title: string;`);
  lines.push(`  subtitle: string;`);
  lines.push(`  duration: string;`);
  lines.push(`  description: string;`);
  lines.push(`  slides: Slide[];`);
  lines.push(`  quiz: Question[];`);
  lines.push(`  assignment: Assignment | null;`);
  lines.push(`}`);
  lines.push(``);

  function emitContent(blocks) {
    const parts = blocks.map(b => {
      if (b.kind === 'list') {
        const items = b.items.map(it => `        ${ts(it)},`).join('\n');
        return `      { kind: 'list',${b.ordered ? ' ordered: true,' : ''} items: [\n${items}\n      ] },`;
      }
      if (b.kind === 'code') {
        return `      { kind: 'code', text: ${ts(b.text)} },`;
      }
      if (b.kind === 'video') {
        const title = b.title ? `, title: ${ts(b.title)}` : '';
        return `      { kind: 'video', videoId: ${ts(b.videoId)}${title} },`;
      }
      return `      { kind: 'p', text: ${ts(b.text)} },`;
    }).join('\n');
    return `[\n${parts}\n    ]`;
  }

  function emitTable(t) {
    const headers = `[${t.headers.map(ts).join(', ')}]`;
    const rows = t.rows.map(r => `        [${r.map(ts).join(', ')}],`).join('\n');
    return `{ headers: ${headers}, rows: [\n${rows}\n      ] }`;
  }

  function emitField(f) {
    const inner = [`label: ${ts(f.label)}`];
    if (f.text) inner.push(`text: ${ts(f.text)}`);
    if (f.items && f.items.length) inner.push(`items: [${f.items.map(ts).join(', ')}]`);
    if (f.code) inner.push(`code: ${ts(f.code)}`);
    return `      { ${inner.join(', ')} },`;
  }

  function emitSlide(slide) {
    const parts = [];
    parts.push(`    title: ${ts(slide.title)}`);
    if (slide.type) parts.push(`    type: ${ts(slide.type)}`);
    if (slide.content && slide.content.length) {
      parts.push(`    content: ${emitContent(slide.content)}`);
    }
    if (slide.scripts && slide.scripts.length) {
      parts.push(`    scripts: [\n${slide.scripts.map(s => `      { label: ${ts(s.label)}, text: ${ts(s.text)} },`).join('\n')}\n    ]`);
    }
    if (slide.items && slide.items.length) {
      parts.push(`    items: [\n${slide.items.map(it => `      { bad: ${it.bad}, label: ${ts(it.label)}, text: ${ts(it.text)} },`).join('\n')}\n    ]`);
    }
    if (slide.recallPrompts && slide.recallPrompts.length) {
      parts.push(`    recallPrompts: [\n${slide.recallPrompts.map(rp => `      { prompt: ${ts(rp.prompt)}, answer: ${ts(rp.answer)} },`).join('\n')}\n    ]`);
    }
    if (slide.scenarios && slide.scenarios.length) {
      parts.push(`    scenarios: [\n${slide.scenarios.map(s => `      { scenario: ${ts(s.scenario)}, rung: ${ts(s.rung)}, script: ${ts(s.script)} },`).join('\n')}\n    ]`);
    }
    if (slide.block && slide.block.fields.length) {
      parts.push(`    block: { fields: [\n${slide.block.fields.map(emitField).join('\n')}\n    ] }`);
    }
    if (slide.table) {
      parts.push(`    table: ${emitTable(slide.table)}`);
    }
    if (slide.tables && slide.tables.length) {
      parts.push(`    tables: [\n${slide.tables.map(t => `      ${emitTable(t)},`).join('\n')}\n    ]`);
    }
    if (slide.highlight) parts.push(`    highlight: ${ts(slide.highlight)}`);
    return `  {\n${parts.join(',\n')}\n  }`;
  }

  function emitQuestion(q) {
    return `  {\n    id: ${ts(q.id)},\n    text: ${ts(q.text)},\n    options: [\n${q.options.map(o => `      ${ts(o)},`).join('\n')}\n    ],\n    correctAnswer: ${q.correctAnswer},\n    explanation: ${ts(q.explanation)},\n  }`;
  }

  function emitAssignment(a) {
    if (!a) return 'null';
    const rubricStr = a.rubric && a.rubric.length
      ? `,\n  rubric: [\n${a.rubric.map(r => `    ${ts(r)},`).join('\n')}\n  ]`
      : '';
    return `{\n  title: ${ts(a.title)},\n  description: ${ts(a.description)},\n  type: ${ts(a.type)},\n  placeholder: ${ts(a.placeholder)}${rubricStr}\n}`;
  }

  lines.push(`export const trainingModules: Module[] = [`);
  for (const mod of modules) {
    lines.push(`  {`);
    lines.push(`    id: ${ts(mod.id)},`);
    lines.push(`    day: ${mod.day},`);
    lines.push(`    title: ${ts(mod.title)},`);
    lines.push(`    subtitle: ${ts(mod.subtitle)},`);
    lines.push(`    duration: ${ts(mod.duration)},`);
    lines.push(`    description: ${ts(mod.description)},`);
    lines.push(`    slides: [`);
    for (const slide of mod.slides) {
      lines.push(emitSlide(slide) + ',');
    }
    lines.push(`    ],`);
    lines.push(`    quiz: [`);
    for (const q of mod.quiz) {
      lines.push(emitQuestion(q) + ',');
    }
    lines.push(`    ],`);
    lines.push(`    assignment: ${emitAssignment(mod.assignment)},`);
    lines.push(`  },`);
  }
  lines.push(`];`);
  lines.push(``);
  lines.push(`export const finalReadinessTestBank: Question[] = [`);
  for (const q of finalReadinessTestBank) {
    lines.push(emitQuestion(q) + ',');
  }
  lines.push(`];`);
  lines.push(``);

  return lines.join('\n');
}

// ─── Run ──────────────────────────────────────────────────────────────────────

const md = readFileSync(CURRICULUM_PATH, 'utf8');
const parsed = parseCurriculum(md);

console.log(`Parsed ${parsed.modules.length} modules:`);
for (const m of parsed.modules) {
  const counts = m.slides.reduce((acc, s) => { acc[s.type || 'text'] = (acc[s.type || 'text'] || 0) + 1; return acc; }, {});
  console.log(`  Day ${m.day}: ${m.title}`);
  console.log(`    ${m.slides.length} slides ${JSON.stringify(counts)}, ${m.quiz.length} quiz Qs, assignment: ${m.assignment ? m.assignment.type : 'none'}`);
}
console.log(`  Final test bank: ${parsed.finalReadinessTestBank.length} questions`);

const ts_output = emitTs(parsed);
writeFileSync(OUTPUT_PATH, ts_output, 'utf8');
console.log(`\nWrote ${OUTPUT_PATH}`);
