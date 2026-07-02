/* PawWalk Academy engine — no dependencies. Lesson data: see lessons/FORMAT.md */
(function () {
  "use strict";

  const COURSE = window.COURSE || [];
  const STORE_KEY = window.STORE_KEY || "pawwalk-academy-v1";

  // ---------- Progress state ----------
  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch { return {}; }
  }
  const state = loadState();
  state.done = state.done || {};       // stepKey -> true | "help" | "skip"
  state.reveal = state.reveal || {};   // "mid/lid" -> number of revealed steps
  state.checks = state.checks || {};   // "stepKey/i" -> true (xcode checklist items)
  state.code = state.code || {};       // stepKey -> learner's editor text
  function save() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

  const sk = (m, l, s) => `${m.id}/${l.id}/${s}`;
  const lk = (m, l) => `${m.id}/${l.id}`;
  const gates = (step) => step.type === "quiz" || step.type === "exercise" || step.type === "xcode";
  const stepDone = (m, l, i) => !!state.done[sk(m, l, i)];
  const lessonDone = (m, l) => (state.reveal[lk(m, l)] || 0) > l.steps.length - 1 &&
    l.steps.every((s, i) => !gates(s) || stepDone(m, l, i));
  const lessonComplete = (m, l) => (state.reveal[lk(m, l)] || 0) >= l.steps.length && lessonDone(m, l);

  // ---------- Tiny helpers ----------
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };

  // ---------- Mini markdown (per block) ----------
  function mdInline(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }
  function mdBlock(block) {
    const lines = block.split("\n");
    if (block.startsWith("### ")) return `<h4>${mdInline(block.slice(4))}</h4>`;
    if (block.startsWith("## ")) return `<h3>${mdInline(block.slice(3))}</h3>`;
    if (lines.every((ln) => ln.startsWith("- ")))
      return `<ul>${lines.map((ln) => `<li>${mdInline(ln.slice(2))}</li>`).join("")}</ul>`;
    if (lines.every((ln) => /^\d+\. /.test(ln)))
      return `<ol>${lines.map((ln) => `<li>${mdInline(ln.replace(/^\d+\. /, ""))}</li>`).join("")}</ol>`;
    if (lines.every((ln) => ln.startsWith("> ")))
      return `<blockquote><p>${lines.map((ln) => mdInline(ln.slice(2))).join("<br>")}</p></blockquote>`;
    return `<p>${mdInline(block).replace(/\n/g, "<br>")}</p>`;
  }
  const md = (blocks) => (blocks || []).map(mdBlock).join("");

  // ---------- Swift + Kotlin syntax highlighting (shared keyword set) ----------
  const KW = new Set(("func var let if else guard return switch case default for while in do catch try throw throws " +
    "async await import struct class enum protocol extension init deinit self Self super static final private public " +
    "internal fileprivate open lazy weak unowned mutating nonmutating override required convenience some any nil true false " +
    "as is where defer break continue fallthrough repeat typealias associatedtype indirect inout get set willSet didSet actor " +
    "fun val when object data sealed suspend package companion by null vararg out constructor interface " +
    "abstract lateinit crossinline reified inline").split(" "));
  function highlight(src) {
    const out = [];
    const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*")|(@\w+)|(#\w+)|\b(\d[\d_]*(?:\.\d[\d_]*)?)\b|\b([A-Za-z_]\w*)\b/g;
    let last = 0, mt;
    while ((mt = re.exec(src))) {
      out.push(esc(src.slice(last, mt.index)));
      last = re.lastIndex;
      const [full, com, str, attr, hash, num, word] = mt;
      if (com) out.push(`<span class="tok-com">${esc(com)}</span>`);
      else if (str) out.push(`<span class="tok-str">${esc(str)}</span>`);
      else if (attr || hash) out.push(`<span class="tok-attr">${esc(full)}</span>`);
      else if (num) out.push(`<span class="tok-num">${esc(num)}</span>`);
      else if (word && KW.has(word)) out.push(`<span class="tok-kw">${esc(word)}</span>`);
      else if (word && /^[A-Z]/.test(word)) out.push(`<span class="tok-type">${esc(word)}</span>`);
      else out.push(esc(full));
    }
    out.push(esc(src.slice(last)));
    return out.join("");
  }
  function codeBlock(source, title) {
    const wrap = el("div", "codeblock");
    if (title) wrap.appendChild(el("div", "code-title", `<span>⌘</span> ${esc(title)}`));
    const pre = el("pre");
    pre.innerHTML = highlight(source.replace(/^\n+|\s+$/g, ""));
    wrap.appendChild(pre);
    return wrap;
  }

  // ---------- Code checking ----------
  // Keep in sync with tools/validate.mjs
  function normalize(code) {
    return code
      .replace(/\/\/[^\n]*/g, " ")          // strip line comments
      .replace(/\/\*[\s\S]*?\*\//g, " ")    // strip block comments
      .replace(/\s+/g, " ")                 // collapse whitespace
      .replace(/\s*([^\w\s])\s*/g, "$1")    // drop spaces around punctuation
      .trim();
  }
  function runChecks(step, code) {
    const n = normalize(code);
    for (const rule of step.mustNot || []) {
      if (rule.re.test(n)) return { pass: false, hint: rule.hint };
    }
    for (const rule of step.checks || []) {
      if (!rule.re.test(n)) return { pass: false, hint: rule.hint };
    }
    return { pass: true };
  }

  // ---------- Step renderers ----------
  function renderText(step) {
    return el("div", "step", md(step.md));
  }

  function renderCode(step) {
    const wrap = el("div", "step");
    wrap.appendChild(codeBlock(step.source, step.title));
    if (step.caption) wrap.appendChild(el("p", null, mdInline(step.caption)));
    return wrap;
  }

  // Deterministic per-quiz shuffle so the correct answer's position carries no signal.
  function choiceOrder(n, seedStr) {
    let h = 2166136261;
    for (const c of seedStr) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    const idx = Array.from({ length: n }, (_, k) => k);
    for (let i = n - 1; i > 0; i--) {
      h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
      const j = Math.abs(h) % (i + 1);
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  }

  function renderQuiz(step, m, l, i) {
    const key = sk(m, l, i);
    const card = el("div", "card step" + (state.done[key] ? " done" : ""));
    card.appendChild(el("div", "card-tag", `<span class="dot"></span><span class="mono-caption">Quick check</span>`));
    card.appendChild(el("h4", null, mdInline(step.q)));
    const choices = el("div", "choices");
    const feedback = el("div");
    choiceOrder(step.choices.length, key).forEach((ci) => {
      const c = step.choices[ci];
      const b = el("button", "choice", mdInline(c));
      if (state.done[key]) {
        b.disabled = true;
        if (ci === step.answer) b.classList.add("correct");
      } else {
        b.onclick = () => {
          if (ci === step.answer) {
            state.done[key] = true;
            save();
            choices.querySelectorAll("button").forEach((x) => (x.disabled = true));
            b.classList.add("correct");
            card.classList.add("done");
            feedback.innerHTML = `<div class="feedback ok">✓ Correct. ${mdInline(step.explain || "")}</div>`;
            refreshChrome(m, l);
          } else {
            b.classList.add("wrong");
            b.disabled = true;
            feedback.innerHTML = `<div class="feedback bad"><span class="fb-label">Not quite</span>${mdInline(step.nudge || "Think about it and try another answer.")}</div>`;
          }
        };
      }
      choices.appendChild(b);
    });
    card.appendChild(choices);
    if (state.done[key] && step.explain) {
      feedback.innerHTML = `<div class="feedback ok">✓ ${mdInline(step.explain)}</div>`;
    }
    card.appendChild(feedback);
    return card;
  }

  function renderExercise(step, m, l, i) {
    const key = sk(m, l, i);
    const card = el("div", "card step" + (state.done[key] ? " done" : ""));
    card.appendChild(el("div", "card-tag", `<span class="dot"></span><span class="mono-caption">Write the code</span>`));
    if (step.title) card.appendChild(el("h4", null, esc(step.title)));
    card.appendChild(el("div", null, md(step.prompt)));

    const editor = el("textarea", "editor");
    editor.spellcheck = false;
    editor.value = state.code[key] != null ? state.code[key] : (step.starter || "");
    editor.rows = Math.max(4, (editor.value.split("\n").length + 2));
    editor.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const { selectionStart: s, selectionEnd: en } = editor;
        editor.value = editor.value.slice(0, s) + "    " + editor.value.slice(en);
        editor.selectionStart = editor.selectionEnd = s + 4;
      }
    });
    editor.addEventListener("input", () => { state.code[key] = editor.value; save(); });
    card.appendChild(editor);

    const actions = el("div", "ex-actions");
    const feedback = el("div");
    const solutionSlot = el("div", "solution-reveal");
    const checkBtn = el("button", "btn", "Check my code");
    const resetBtn = el("button", "btn secondary", "Reset");
    const revealBtn = el("button", "linkish", "I'm stuck — show the solution");
    revealBtn.style.display = "none";
    let fails = 0;

    function markDone(how) {
      state.done[key] = how;
      save();
      card.classList.add("done");
      refreshChrome(m, l);
    }
    checkBtn.onclick = () => {
      const result = runChecks(step, editor.value);
      if (result.pass) {
        feedback.innerHTML = `<div class="feedback ok">✓ ${esc(step.success || "That's exactly right. On to the next step!")}</div>`;
        markDone(solutionSlot.childElementCount ? "help" : true);
      } else {
        fails++;
        feedback.innerHTML = `<div class="feedback bad"><span class="fb-label">Not yet</span>${mdInline(result.hint || "Compare your code with the instructions again.")}</div>`;
        if (fails >= 2) revealBtn.style.display = "";
      }
    };
    resetBtn.onclick = () => {
      editor.value = step.starter || "";
      state.code[key] = editor.value;
      save();
      feedback.innerHTML = "";
    };
    revealBtn.onclick = () => {
      solutionSlot.innerHTML = "";
      solutionSlot.appendChild(codeBlock(step.solution, "Solution"));
      const hint = el("p", null, "Type it out yourself (don't paste) — then hit <strong>Check my code</strong>. Typing is how it sticks.");
      solutionSlot.appendChild(hint);
      revealBtn.style.display = "none";
    };
    actions.append(checkBtn, resetBtn, revealBtn);
    card.append(actions, feedback, solutionSlot);
    if (state.done[key]) {
      feedback.innerHTML = `<div class="feedback ok">✓ Completed${state.done[key] === "help" ? " (with the solution's help)" : ""}.</div>`;
    }
    return card;
  }

  function renderXcode(step, m, l, i) {
    const key = sk(m, l, i);
    const card = el("div", "card xcode step" + (state.done[key] ? " done" : ""));
    card.appendChild(el("div", "card-tag", `<span class="dot"></span><span class="mono-caption">Over to Xcode</span>`));
    if (step.title) card.appendChild(el("h4", null, esc(step.title)));
    if (step.intro) card.appendChild(el("div", null, md(step.intro)));
    const list = el("div");
    function syncDone() {
      const all = step.items.every((_, ci) => state.checks[`${key}/${ci}`]);
      if (all && !state.done[key]) { state.done[key] = true; save(); card.classList.add("done"); refreshChrome(m, l); }
    }
    step.items.forEach((item, ci) => {
      const ck = `${key}/${ci}`;
      const row = el("label", "check-item" + (state.checks[ck] ? " checked" : ""));
      const box = document.createElement("input");
      box.type = "checkbox";
      box.checked = !!state.checks[ck];
      box.onchange = () => {
        state.checks[ck] = box.checked;
        row.classList.toggle("checked", box.checked);
        save();
        syncDone();
      };
      row.append(box, el("span", null, mdInline(item)));
      list.appendChild(row);
    });
    card.appendChild(list);
    const skip = el("button", "linkish", "I'll do this on my Mac later — continue anyway");
    skip.onclick = () => { state.done[key] = "skip"; save(); card.classList.add("done"); refreshChrome(m, l); render(); };
    if (!state.done[key]) card.appendChild(skip);
    return card;
  }

  function renderStep(step, m, l, i) {
    switch (step.type) {
      case "text": return renderText(step);
      case "code": return renderCode(step);
      case "quiz": return renderQuiz(step, m, l, i);
      case "exercise": return renderExercise(step, m, l, i);
      case "xcode": return renderXcode(step, m, l, i);
      default: return el("div", "step", `<p>Unknown step type: ${esc(String(step.type))}</p>`);
    }
  }

  // ---------- Lesson page ----------
  let continueRow = null;
  function refreshChrome(m, l) {
    // Re-evaluate the continue button + sidebar without re-rendering (keeps editor state).
    if (continueRow) updateContinue(m, l, continueRow);
    renderSidebar(m, l);
    renderOverall();
  }

  function updateContinue(m, l, row) {
    row.innerHTML = "";
    const revealed = Math.min(state.reveal[lk(m, l)] || 1, l.steps.length);
    const lastIdx = revealed - 1;
    const lastStep = l.steps[lastIdx];
    const blocked = gates(lastStep) && !stepDone(m, l, lastIdx);
    if (revealed >= l.steps.length && !blocked) {
      row.style.display = "none";
      showCompletion(m, l);
      return;
    }
    row.style.display = "";
    const btn = el("button", "btn", "Continue ↓");
    btn.disabled = blocked;
    btn.onclick = () => {
      state.reveal[lk(m, l)] = revealed + 1;
      save();
      render(true);
    };
    row.appendChild(btn);
    if (blocked) row.appendChild(el("span", "hintline", "Finish the step above to keep going"));
  }

  function showCompletion(m, l) {
    if (document.querySelector(".complete-card")) return;
    const { next } = neighbors(m, l);
    const cardHost = document.getElementById("complete-slot");
    const card = el("div", "complete-card");
    card.appendChild(el("div", "big", "🐾"));
    card.appendChild(el("h3", null, `Lesson complete: ${esc(l.title)}`));
    card.appendChild(el("p", null, next ? "Nice work. Keep the streak going." : "That was the last lesson. You built the whole app!"));
    if (next) {
      const btn = el("button", "btn", `Next: ${esc(next.l.title)} →`);
      btn.onclick = () => { location.hash = `#/${next.m.id}/${next.l.id}`; };
      card.appendChild(btn);
    }
    cardHost.appendChild(card);
    renderSidebar(m, l);
    renderOverall();
  }

  function neighbors(m, l) {
    const flat = [];
    COURSE.forEach((mod) => mod.lessons.forEach((les) => flat.push({ m: mod, l: les })));
    const idx = flat.findIndex((x) => x.m.id === m.id && x.l.id === l.id);
    return { prev: flat[idx - 1] || null, next: flat[idx + 1] || null };
  }

  function renderLesson(m, l, keepScroll) {
    const content = document.getElementById("content");
    const prevScroll = keepScroll ? window.scrollY : 0;
    content.innerHTML = "";
    const wrap = el("div", "lesson-wrap");
    const mi = COURSE.indexOf(m), li = m.lessons.indexOf(l);
    wrap.appendChild(el("div", "crumbs mono-caption", `Module ${String(mi).padStart(2, "0")} · ${esc(m.title)} — Lesson ${li + 1} of ${m.lessons.length}`));
    wrap.appendChild(el("h2", "lesson-title", esc(l.title)));

    const revealed = Math.max(1, Math.min(state.reveal[lk(m, l)] || 1, l.steps.length));
    state.reveal[lk(m, l)] = Math.max(state.reveal[lk(m, l)] || 1, 1);
    for (let i = 0; i < revealed; i++) wrap.appendChild(renderStep(l.steps[i], m, l, i));

    continueRow = el("div", "continue-row");
    wrap.appendChild(continueRow);
    wrap.appendChild(el("div", null)).id = "complete-slot";
    if ((state.reveal[lk(m, l)] || 1) >= l.steps.length && lessonDone(m, l)) {
      continueRow.style.display = "none";
      content.appendChild(wrap);
      showCompletion(m, l);
    } else {
      updateContinue(m, l, continueRow);
      content.appendChild(wrap);
    }

    if (keepScroll) {
      window.scrollTo(0, prevScroll);
      const steps = wrap.querySelectorAll(".step");
      const lastStep = steps[steps.length - 1];
      if (lastStep) lastStep.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo(0, 0);
    }
  }

  // ---------- Sidebar ----------
  function renderSidebar(activeM, activeL) {
    const host = document.getElementById("module-list");
    host.innerHTML = "";
    COURSE.forEach((m, mi) => {
      const doneCount = m.lessons.filter((l) => lessonComplete(m, l)).length;
      const mod = el("div", "mod" + ((activeM && m.id === activeM.id) ? " open" : ""));
      const head = el("button", "mod-head");
      head.innerHTML = `<span class="emoji">${m.emoji || "📘"}</span><span>${String(mi).padStart(2, "0")} · ${esc(m.title)}</span>` +
        `<span class="count${doneCount === m.lessons.length ? " done" : ""}">${doneCount}/${m.lessons.length}</span>`;
      head.onclick = () => mod.classList.toggle("open");
      mod.appendChild(head);
      const list = el("div", "mod-lessons");
      m.lessons.forEach((l) => {
        const a = el("a", "lesson-link" + ((activeL && activeM && m.id === activeM.id && l.id === activeL.id) ? " active" : ""));
        a.href = `#/${m.id}/${l.id}`;
        a.innerHTML = `<span class="tick">${lessonComplete(m, l) ? "✓" : ""}</span><span>${esc(l.title)}</span>`;
        list.appendChild(a);
      });
      mod.appendChild(list);
      host.appendChild(mod);
    });
  }

  function renderOverall() {
    const total = COURSE.reduce((n, m) => n + m.lessons.length, 0);
    const done = COURSE.reduce((n, m) => n + m.lessons.filter((l) => lessonComplete(m, l)).length, 0);
    const pct = total ? Math.round((done / total) * 100) : 0;
    document.getElementById("overall-fill").style.width = pct + "%";
    document.getElementById("overall-label").textContent = `${pct}%`;
  }

  // ---------- Routing ----------
  function currentRoute() {
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    let m = COURSE.find((x) => x.id === parts[0]);
    let l = m && m.lessons.find((x) => x.id === parts[1]);
    if (!m || !l) {
      // First lesson that isn't complete, else the very first.
      outer: for (const mod of COURSE) {
        for (const les of mod.lessons) {
          if (!lessonComplete(mod, les)) { m = mod; l = les; break outer; }
        }
      }
      if (!m) { m = COURSE[0]; l = m && m.lessons[0]; }
    }
    return { m, l };
  }

  function render(keepScroll) {
    if (!COURSE.length) {
      document.getElementById("content").innerHTML = "<p style='padding:40px'>No lessons loaded — check the script tags in index.html.</p>";
      return;
    }
    const { m, l } = currentRoute();
    renderSidebar(m, l);
    renderOverall();
    renderLesson(m, l, keepScroll);
    document.body.classList.remove("menu-open");
  }

  window.addEventListener("hashchange", () => render(false));
  document.getElementById("menu-toggle").onclick = () => document.body.classList.toggle("menu-open");
  document.getElementById("reset-progress").onclick = () => {
    if (confirm("Reset all course progress? This can't be undone.")) {
      localStorage.removeItem(STORE_KEY);
      location.reload();
    }
  };

  render(false);
})();
