#!/usr/bin/env node
/**
 * parse-curriculum.mjs
 *
 * Reads CURRICULUM.md and regenerates client/src/data/trainingData.ts
 *
 * Usage:
 *   node scripts/parse-curriculum.mjs
 *
 * The script is intentionally verbose in its parsing so that CURRICULUM.md
 * remains the single source of truth. Edit the markdown, run this script,
 * and the TypeScript data file is updated automatically.
 *
 * ─── CURRICULUM.md format rules this parser depends on ───────────────────────
 *
 * MODULE HEADER (starts a new Day/Module):
 *   ## DAY N — Title
 *   **Subtitle:** ...
 *   **Duration:** ...
 *   **Description:** ...
 *
 * SLIDE HEADER:
 *   ### Slide N — Title
 *   (type is inferred from content; see SLIDE TYPE DETECTION below)
 *
 * SLIDE TYPE DETECTION (in priority order):
 *   1. Contains "**Label:**" / "**Script:**" pairs  → type: 'script'
 *   2. Contains "✅ DO" / "❌ DON'T" lines          → type: 'dosdonts'
 *   3. Contains "**Prompt:**" / "**Answer:**" pairs → type: 'recall'
 *   4. Contains "**Objection:**" / "**Response:**"  → type: 'objection'
 *   5. Everything else                              → type: 'text'
 *
 * BLOCKQUOTE (> ...) → highlight field on the slide
 * ITALIC BLOCKQUOTE (> *"..."*) → also highlight
 *
 * QUIZ:
 *   ### Day N Quiz
 *   **Q1.** Question text
 *   - A) option text
 *   - B) ✅ correct option text   ← ✅ marks the correct answer
 *   *Explanation: ...*
 *
 * ASSIGNMENT:
 *   ### Day N Assignment — Title
 *   Description paragraphs
 *   **Include:** or numbered list → stored in description
 *   **Score yourself honestly...** checklist → rubric array
 *   - [ ] rubric item
 *
 * FINAL READINESS TEST:
 *   ## FINAL READINESS TEST
 *   **F1.** Question text
 *   - A) option  - B) ✅ correct  etc.
 *   *Explanation: ...*
 *
 * SAFETY MODULE:
 *   ## SAFETY & FIELD PROTOCOL
 *   (treated as a special module with id 'safety')
 *
 * SHIFT 1 DEBRIEF:
 *   ## SHIFT 1 DEBRIEF
 *   (treated as a special section, not a training module)
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
    .replace(/\*\*(.*?)\*\*/g, '$1')  // bold
    .replace(/\*(.*?)\*/g, '$1')       // italic
    .replace(/`(.*?)`/g, '$1')         // code
    .trim();
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function escapeTs(str) {
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

function ts(str) {
  return '`' + escapeTs(str) + '`';
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
    if (labelMatch) { label = labelMatch[1].trim(); continue; }
    const scriptMatch = line.match(/^\*\*Script:\*\*\s+(.+)/);
    if (scriptMatch && label) {
      // Strip surrounding quotes if present
      let text = scriptMatch[1].trim().replace(/^[""]|[""]$/g, '');
      scripts.push({ label, text });
      label = null;
    }
  }
  return scripts;
}

function parseDosDonts(lines) {
  const items = [];
  for (const line of lines) {
    const doMatch = line.match(/^✅\s+DO(?:\s+Say)?:\s+"?(.+?)"?$/);
    if (doMatch) { items.push({ bad: false, label: 'DO', text: doMatch[1].trim() }); continue; }
    const dontMatch = line.match(/^❌\s+DON'T(?:\s+Say)?:\s+"?(.+?)"?$/);
    if (dontMatch) { items.push({ bad: true, label: "DON'T", text: dontMatch[1].trim() }); }
  }
  return items;
}

function parseRecallPrompts(lines) {
  const prompts = [];
  let prompt = null;
  for (const line of lines) {
    const pMatch = line.match(/^\*\*Prompt:\*\*\s+(.+)/);
    if (pMatch) { prompt = pMatch[1].trim(); continue; }
    const aMatch = line.match(/^\*\*Answer:\*\*\s+(.+)/);
    if (aMatch && prompt) {
      prompts.push({ prompt, answer: aMatch[1].trim() });
      prompt = null;
    }
  }
  return prompts;
}

function parseHighlight(lines) {
  for (const line of lines) {
    const bqMatch = line.match(/^>\s+\*?\*?\*?Key Callout:\*?\*?\*?\s+(.*)/);
    if (bqMatch) return bqMatch[1].replace(/\*+/g, '').trim();
    const bqGeneral = line.match(/^>\s+\*?"?(.+?)"?\*?$/);
    if (bqGeneral) return bqGeneral[1].trim();
  }
  return null;
}

function parseContent(lines) {
  return lines
    .filter(l => l.trim() && !l.startsWith('>') && !l.startsWith('**Label:') && !l.startsWith('**Script:') && !l.startsWith('**Prompt:') && !l.startsWith('**Answer:') && !l.startsWith('✅') && !l.startsWith('❌') && !l.startsWith('-') && !l.match(/^\*Explanation:/))
    .map(l => stripInlineMarkdown(l))
    .filter(Boolean);
}

function detectSlideType(lines) {
  const joined = lines.join('\n');
  if (joined.includes('**Label:**') && joined.includes('**Script:**')) return 'script';
  if (joined.includes('✅ DO') || joined.includes("❌ DON'T")) return 'dosdonts';
  if (joined.includes('**Prompt:**') && joined.includes('**Answer:**')) return 'recall';
  if (joined.includes('**Objection:**') && joined.includes('**Response:**')) return 'objection';
  return 'text';
}

function buildSlide(title, lines) {
  const type = detectSlideType(lines);
  const highlight = parseHighlight(lines);
  const slide = { title, type };

  if (type === 'script') {
    const content = parseContent(lines);
    if (content.length) slide.content = content;
    slide.scripts = parseScripts(lines);
  } else if (type === 'dosdonts') {
    slide.items = parseDosDonts(lines);
  } else if (type === 'recall') {
    slide.type = 'recall';
    slide.recallPrompts = parseRecallPrompts(lines);
  } else if (type === 'objection') {
    slide.scripts = parseScripts(lines);
  } else {
    const content = parseContent(lines);
    if (content.length) slide.content = content;
    if (type === 'text') delete slide.type; // text is the default, omit for cleanliness
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
    .filter(l => l.trim() && !l.match(/^-\s+\[[ x]\]/) && !l.match(/^\*\*Score yourself/))
    .map(l => stripInlineMarkdown(l))
    .filter(Boolean);

  // Determine type: if title mentions "Roleplay" or "Recording" → roleplay, else text
  const type = /roleplay|recording/i.test(title) ? 'roleplay' : 'text';
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
  let inFinalTest = false;
  let inSafety = false;
  let inShiftDebrief = false;
  let quizLines = [];
  let inQuiz = false;
  let assignmentLines = [];
  let assignmentTitle = '';
  let inAssignment = false;

  function flushSlide() {
    if (!currentSlideTitle || !currentModule) return;
    currentModule.slides.push(buildSlide(currentSlideTitle, currentSlideLines));
    currentSlideTitle = null;
    currentSlideLines = [];
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
      flushSlide();
      flushQuiz();
      flushAssignment();
      inFinalTest = true;
      inSafety = false;
      inShiftDebrief = false;
      currentModule = null;
      continue;
    }

    // ── Shift 1 Debrief ──
    if (line.match(/^## SHIFT 1 DEBRIEF/)) {
      flushSlide();
      flushQuiz();
      flushAssignment();
      inShiftDebrief = true;
      inFinalTest = false;
      currentModule = null;
      continue;
    }

    if (inFinalTest) {
      finalTestLines.push(line);
      continue;
    }

    if (inShiftDebrief) continue; // skip debrief lines

    // ── New Module (## DAY N or ## SAFETY) ──
    const moduleMatch = line.match(/^## (DAY \d+[^\n]*|SAFETY[^#]*)/iu);
    if (moduleMatch) {
      flushSlide();
      flushQuiz();
      flushAssignment();

      const headerText = moduleMatch[1].trim();
      const dayMatch = headerText.match(/DAY (\d+)\s*[\u2014\u2013-]\s*(.+)/i);
      // Only treat as safety module if the header starts with SAFETY (not Day 3 which mentions Safety in the title)
      const isSafety = /^SAFETY/i.test(headerText);

      if (dayMatch || isSafety) {
        let subtitle = '', duration = '', description = '';
        // Peek ahead for metadata lines
        let j = i + 1;
        while (j < lines.length && !lines[j].startsWith('##') && !lines[j].startsWith('###')) {
          const sl = lines[j];
          const subMatch = sl.match(/^\*\*Subtitle:\*\*\s+(.+)/);
          const durMatch = sl.match(/^\*\*Duration:\*\*\s+(.+)/);
          const descMatch = sl.match(/^\*\*Description:\*\*\s+(.+)/);
          if (subMatch) subtitle = subMatch[1].trim();
          if (durMatch) duration = durMatch[1].trim();
          if (descMatch) description = descMatch[1].trim();
          j++;
        }

        const id = isSafety ? 'safety' : `day${dayMatch[1]}`;
        const title = isSafety ? headerText.replace(/^SAFETY\s*[—&]\s*/i, '').trim() : dayMatch[2].trim();
        const day = isSafety ? 99 : parseInt(dayMatch[1]);

        currentModule = { id, day, title, subtitle, duration, description, slides: [], quiz: [], assignment: null };
        modules.push(currentModule);
        inSafety = isSafety;
        inQuiz = false;
        inAssignment = false;
      }
      continue;
    }

    if (!currentModule) continue;

    // ── Quiz section ──
    const quizHeaderMatch = line.match(/^### Day \d+ Quiz|^### Safety Quiz/i);
    if (quizHeaderMatch) {
      flushSlide();
      inQuiz = true;
      inAssignment = false;
      continue;
    }

    // ── Assignment section ──
    const assignMatch = line.match(/^### Day \d+ Assignment\s*[—-]\s*(.+)|^### Safety Assignment\s*[—-]\s*(.+)/i);
    if (assignMatch) {
      flushSlide();
      flushQuiz();
      inAssignment = true;
      inQuiz = false;
      assignmentTitle = (assignMatch[1] || assignMatch[2] || '').trim();
      continue;
    }

    // ── Slide header ──
    const slideMatch = line.match(/^### Slide \d+\s*[—-]\s*(.+)/);
    if (slideMatch) {
      flushSlide();
      flushQuiz();
      flushAssignment();
      currentSlideTitle = slideMatch[1].trim();
      currentSlideLines = [];
      inQuiz = false;
      inAssignment = false;
      continue;
    }

    // ── Accumulate lines ──
    if (inQuiz) { quizLines.push(line); continue; }
    if (inAssignment) { assignmentLines.push(line); continue; }
    if (currentSlideTitle) { currentSlideLines.push(line); }
  }

  // Flush any remaining
  flushSlide();
  flushQuiz();
  flushAssignment();

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
  lines.push(`export interface RecallPrompt { prompt: string; answer: string; }`);
  lines.push(`export interface ScriptItem { label: string; text: string; }`);
  lines.push(`export interface DosDontsItem { bad: boolean; label: string; text: string; }`);
  lines.push(`export interface Slide {`);
  lines.push(`  title: string;`);
  lines.push(`  type?: 'text' | 'script' | 'objection' | 'dosdonts' | 'recall';`);
  lines.push(`  content?: string[];`);
  lines.push(`  scripts?: ScriptItem[];`);
  lines.push(`  items?: DosDontsItem[];`);
  lines.push(`  recallPrompts?: RecallPrompt[];`);
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

  function emitStr(s) { return ts(s); }
  function emitStrArr(arr) {
    if (!arr || !arr.length) return '[]';
    return `[\n${arr.map(s => `    ${ts(s)},`).join('\n')}\n  ]`;
  }

  function emitSlide(slide) {
    const parts = [];
    parts.push(`    title: ${ts(slide.title)}`);
    if (slide.type) parts.push(`    type: ${ts(slide.type)}`);
    if (slide.content && slide.content.length) {
      parts.push(`    content: [\n${slide.content.map(s => `      ${ts(s)},`).join('\n')}\n    ]`);
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
  console.log(`  Day ${m.day}: ${m.title} — ${m.slides.length} slides, ${m.quiz.length} quiz Qs, assignment: ${m.assignment ? m.assignment.type : 'none'}`);
}
console.log(`  Final test bank: ${parsed.finalReadinessTestBank.length} questions`);

const ts_output = emitTs(parsed);
writeFileSync(OUTPUT_PATH, ts_output, 'utf8');
console.log(`\nWrote ${OUTPUT_PATH}`);
