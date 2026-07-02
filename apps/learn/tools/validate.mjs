// Validates every lessons/*.js file: syntax, schema, and — critically — that each
// exercise's own solution passes its own checks (so every exercise is solvable).
// Usage: node tools/validate.mjs   (from apps/learn/)
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { types } from "node:util";
import vm from "node:vm";

const isRegExp = (v) => types.isRegExp(v); // instanceof fails across the vm realm

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lessonsDir = join(root, "lessons");
const files = readdirSync(lessonsDir).filter((f) => f.endsWith(".js")).sort();

const errors = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);

// Keep in sync with normalize() in app.js
function normalize(code) {
  return code
    .replace(/\/\/[^\n]*/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*([^\w\s])\s*/g, "$1")
    .trim();
}

const isBlocks = (v) => Array.isArray(v) && v.length > 0 && v.every((b) => typeof b === "string" && b.trim());

function checkStep(file, where, s, i) {
  const w = `${where} step[${i}]`;
  if (!s || typeof s !== "object") return err(file, `${w}: not an object`);
  switch (s.type) {
    case "text":
      if (!isBlocks(s.md)) err(file, `${w}: text.md must be a non-empty array of strings`);
      break;
    case "code":
      if (typeof s.source !== "string" || !s.source.trim()) err(file, `${w}: code.source missing`);
      break;
    case "quiz":
      if (typeof s.q !== "string") err(file, `${w}: quiz.q missing`);
      if (!Array.isArray(s.choices) || s.choices.length < 2) err(file, `${w}: quiz needs ≥2 choices`);
      if (!Number.isInteger(s.answer) || s.answer < 0 || s.answer >= (s.choices || []).length)
        err(file, `${w}: quiz.answer out of range`);
      break;
    case "exercise": {
      if (!isBlocks(s.prompt)) err(file, `${w}: exercise.prompt must be a non-empty array of strings`);
      if (typeof s.solution !== "string" || !s.solution.trim()) err(file, `${w}: exercise.solution missing`);
      if (!Array.isArray(s.checks) || !s.checks.length) { err(file, `${w}: exercise.checks missing`); break; }
      const n = normalize(s.solution || "");
      for (const [ci, rule] of (s.checks || []).entries()) {
        if (!(isRegExp(rule.re))) { err(file, `${w} checks[${ci}]: re must be a regex literal`); continue; }
        if (typeof rule.hint !== "string" || !rule.hint.trim()) err(file, `${w} checks[${ci}]: hint missing`);
        if (!rule.re.test(n)) err(file, `${w} checks[${ci}]: SOLUTION FAILS ITS OWN CHECK ${rule.re} — normalized solution: ${JSON.stringify(n)}`);
      }
      for (const [ci, rule] of (s.mustNot || []).entries()) {
        if (!(isRegExp(rule.re))) { err(file, `${w} mustNot[${ci}]: re must be a regex literal`); continue; }
        if (rule.re.test(n)) err(file, `${w} mustNot[${ci}]: solution MATCHES forbidden pattern ${rule.re}`);
      }
      // Starter shouldn't already pass (exercise would be a no-op)
      if (typeof s.starter === "string" && s.starter.trim()) {
        const ns = normalize(s.starter);
        const passes = (s.checks || []).every((r) => isRegExp(r.re) && r.re.test(ns)) &&
          !(s.mustNot || []).some((r) => isRegExp(r.re) && r.re.test(ns));
        if (passes) err(file, `${w}: the STARTER already passes all checks — nothing to do`);
      }
      break;
    }
    case "xcode":
      if (!Array.isArray(s.items) || !s.items.length) err(file, `${w}: xcode.items missing`);
      break;
    default:
      err(file, `${w}: unknown type ${JSON.stringify(s.type)}`);
  }
}

const seenModuleIds = new Set();
let moduleCount = 0, lessonCount = 0, stepCount = 0, exerciseCount = 0, quizCount = 0;

for (const file of files) {
  const src = readFileSync(join(lessonsDir, file), "utf8");

  // Heuristic: a plain (non-String.raw) template literal containing \( means
  // corrupted Swift interpolation — the backslash silently disappears. Strip
  // quoted strings and regex literals first so their backticks/\( don't false-positive.
  const stripped = src
    .replace(/re:\s*\/(?:[^\/\\\n[]|\\.|\[(?:[^\]\\]|\\.)*\])+\/[a-z]*/g, "re: /re/") // regex literals first — they may contain quotes
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''");
  const badTemplate = /(?<!String\.raw)`(?:[^`\\]|\\.)*?\\\((?:[^`\\]|\\.)*?`/s;
  if (badTemplate.test(stripped)) err(file, "contains \\( inside a plain template literal — use String.raw for Swift code");

  const sandbox = { window: { COURSE: [] } };
  try {
    vm.runInNewContext(src, sandbox, { filename: file, timeout: 5000 });
  } catch (e) {
    err(file, `does not execute: ${e.message}`);
    continue;
  }
  const mods = sandbox.window.COURSE;
  if (mods.length !== 1) { err(file, `must push exactly 1 module (pushed ${mods.length})`); continue; }
  const m = mods[0];
  moduleCount++;
  if (!m.id || !/^[a-z0-9-]+$/.test(m.id)) err(file, `module id ${JSON.stringify(m.id)} must be kebab-case`);
  if (seenModuleIds.has(m.id)) err(file, `duplicate module id ${m.id}`);
  seenModuleIds.add(m.id);
  if (!m.title) err(file, "module.title missing");
  if (!Array.isArray(m.lessons) || !m.lessons.length) { err(file, "module.lessons missing"); continue; }

  const seenLessons = new Set();
  for (const l of m.lessons) {
    lessonCount++;
    const where = `lesson "${l.id}"`;
    if (!l.id || seenLessons.has(l.id)) err(file, `${where}: missing or duplicate lesson id`);
    seenLessons.add(l.id);
    if (!l.title) err(file, `${where}: title missing`);
    if (!Array.isArray(l.steps) || !l.steps.length) { err(file, `${where}: steps missing`); continue; }
    l.steps.forEach((s, i) => {
      stepCount++;
      if (s && s.type === "exercise") exerciseCount++;
      if (s && s.type === "quiz") quizCount++;
      checkStep(file, where, s, i);
    });
    const last = l.steps[l.steps.length - 1];
    if (last && last.type === "text") err(file, `${where}: ends with a text step — end on a quiz, exercise, or xcode step`);
  }
}

console.log(`Checked ${files.length} files: ${moduleCount} modules, ${lessonCount} lessons, ${stepCount} steps (${exerciseCount} exercises, ${quizCount} quizzes).`);
if (errors.length) {
  console.error(`\n${errors.length} error(s):`);
  for (const e of errors) console.error("  ✗ " + e);
  process.exit(1);
}
console.log("✓ All lesson files valid.");
