"use strict";

(() => {
  const $ = (id) => document.getElementById(id);
  const scale = (labels) => labels.map((label, i) => ({ value: i + 1, label }));
  const questions = [
    { id: "q1", type: "scale", title: "Как ты себя чувствуешь?", subtitle: "Выбери то, что ближе всего к твоему настроению сейчас.", options: scale(["Очень тяжело", "Не очень", "Нормально", "Хорошо", "Отлично"]) },
    { id: "q2", type: "scale", title: "Сколько у тебя энергии?", subtitle: "Можно быть на паузе. Здесь нет правильных ответов.", options: scale(["Совсем нет", "Мало", "Средне", "Достаточно", "Очень много"]) },
    { id: "q3", type: "scale", title: "Как ты спал(а)?", subtitle: "Вспомни последний сон и то, как чувствовал(а) себя после него.", options: scale(["Очень плохо", "Плохо", "Обычно", "Хорошо", "Отлично"]) },
    { id: "q4", type: "scale", title: "Насколько спокойно у тебя внутри?", subtitle: "Оцени ощущение спокойствия в этот момент.", options: scale(["Совсем не спокойно", "Скорее тревожно", "По-разному", "Довольно спокойно", "Очень спокойно"]) },
    { id: "q5", type: "scale", title: "Легко ли тебе сосредоточиться?", subtitle: "Например, на разговоре, книге или небольшом деле.", options: scale(["Очень трудно", "Трудно", "По-разному", "Довольно легко", "Очень легко"]) },
    { id: "q6", type: "scale", title: "Чувствуешь ли ты поддержку?", subtitle: "От близких, друзей или людей, которым доверяешь.", options: scale(["Совсем нет", "Скорее нет", "Иногда", "Да", "Очень сильную"]) },
    { id: "q7", type: "scale", title: "Как чувствует себя твоё тело?", subtitle: "Прислушайся к ощущениям: усталость, лёгкость, напряжение.", options: scale(["Очень плохо", "Не очень", "Обычно", "Хорошо", "Отлично"]) },
    { id: "q8", type: "scale", title: "Было ли сегодня что-то приятное?", subtitle: "Даже маленькая радость считается.", options: scale(["Совсем ничего", "Почти ничего", "Немного", "Да, несколько моментов", "Много хорошего"]) },
    { id: "q9", type: "choice", title: "Чего тебе сейчас хочется?", subtitle: "Выбери то, что могло бы сделать день чуть лучше.", options: [
      { value: "rest", label: "Отдохнуть" }, { value: "company", label: "Побыть с кем-то" },
      { value: "movement", label: "Прогуляться" }, { value: "focus", label: "Заняться делом" }, { value: "nothing", label: "Пока ничего" },
    ] },
    { id: "q10", type: "text", title: "Хочешь добавить пару слов?", subtitle: "Мысль, маленькое событие или то, что важно именно тебе. Можно пропустить.", options: [] },
  ];
  // Answers live only in memory for the current survey.
  const state = { step: 0, answers: {} };
  const supportLabels = { rest: "Отдохнуть и выдохнуть", company: "Побыть с кем-то рядом", movement: "Прогуляться", focus: "Заняться своим делом", nothing: "Просто побыть" };
  const supportIcons = { rest: "☁", company: "♡", movement: "✿", focus: "✧", nothing: "☕" };
  const kickers = ["ПРО ТВОЁ НАСТРОЕНИЕ", "ПРО ТВОЮ ЭНЕРГИЮ", "ПРО ТВОЙ ОТДЫХ", "ПРО ВНУТРЕННЕЕ СПОКОЙСТВИЕ", "ПРО ТВОЁ ВНИМАНИЕ", "ПРО ЛЮДЕЙ РЯДОМ", "ПРО ОЩУЩЕНИЯ", "ПРО МАЛЕНЬКИЕ РАДОСТИ", "ПРО ТО, ЧТО ТЕБЕ НУЖНО", "МЕСТО ДЛЯ ТВОИХ СЛОВ"];
  const svgIcon = (name) => `<svg class="icon" aria-hidden="true"><use href="#icon-${name}"/></svg>`;
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function showView(name) {
    for (const id of ["landing", "survey", "result"]) $(`${id}-view`).hidden = name !== id;
    document.title = name === "survey" ? `Вопрос ${state.step + 1} из 10 — Как ты?` : name === "result" ? "Твой итог — Как ты?" : "Как ты? — маленькая пауза для себя";
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function clearAnswers() {
    // Also clear rendered values: hidden fields and result text must not retain answers.
    const text = $("answer-text");
    if (text) text.value = "";
    $("answer-options").replaceChildren();
    state.answers = {};
    state.step = 0;
    $("result-note-text").textContent = "";
    $("result-support").textContent = "";
    $("result-score").textContent = "0";
    $("result-title").textContent = "Ты услышал себя.";
    $("result-message").textContent = "";
    $("score-ring-value").setAttribute("stroke-dasharray", "0 622");
    $("form-error").textContent = "";
    $("form-error").hidden = true;
    $("next-button").disabled = true;
  }

  function goHome() {
    clearAnswers();
    showView("landing");
    $("start-button").focus({ preventScroll: true });
  }

  function startSurvey() {
    clearAnswers();
    showView("survey");
    renderQuestion();
  }

  function faceSvg(value) {
    const mouths = ["M16 30q8-8 16 0", "M17 29q7-5 14 0", "M17 27h14", "M16 26q8 9 16 0", "M15 25q9 14 18 0Z"];
    const eyes = value === 5 ? '<path d="m15 19 3-3 3 3m6 0 3-3 3 3"/>' : '<circle cx="17" cy="19" r="1" fill="currentColor"/><circle cx="31" cy="19" r="1" fill="currentColor"/>';
    return `<svg class="face-icon" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20"/>${eyes}<path d="${mouths[value - 1] || mouths[2]}" fill="${value === 5 ? "currentColor" : "none"}"/></svg>`;
  }

  function renderQuestion() {
    const q = questions[state.step];
    $("question-number").textContent = `Вопрос ${String(state.step + 1).padStart(2, "0")}`;
    $("progress-caption").textContent = `из ${questions.length}`;
    $("progress-track").innerHTML = questions.map((_, i) => `<span class="progress-segment${i < state.step ? " is-done" : i === state.step ? " is-current" : ""}"></span>`).join("");
    $("question-kicker").textContent = kickers[state.step];
    $("question-title").textContent = q.title;
    $("question-description").textContent = q.subtitle;
    $("answer-legend").textContent = q.title;
    $("form-error").hidden = true;
    $("back-button").disabled = state.step === 0;
    $("next-label").textContent = state.step === 9 ? "Посмотреть итог" : "Дальше";
    $("keyboard-hint").hidden = q.type === "text";
    $("question-hint").textContent = q.type === "scale" ? "Любое твоё ощущение сейчас — в порядке." : q.type === "choice" ? "Выбирай то, что ближе тебе именно сейчас." : "Этот вопрос необязательный. Иногда слов не нужно.";
    const options = $("answer-options");
    options.className = q.type === "scale" ? "scale-options" : q.type === "choice" ? "choice-options" : "textarea-wrap";
    if (q.type === "text") {
      options.innerHTML = '<label class="sr-only" for="answer-text">Твои слова о сегодняшнем дне, необязательный ответ</label><textarea id="answer-text" class="answer-textarea" name="q10" autocomplete="off" maxlength="2000" rows="5" placeholder="Например, сегодня меня порадовало…"></textarea><span class="text-count" id="text-count" aria-hidden="true">0 / 2000</span>';
      const text = $("answer-text");
      text.value = state.answers[q.id] || "";
      updateTextCount();
      text.addEventListener("input", () => {
        state.answers[q.id] = text.value;
        $("form-error").hidden = true;
        updateTextCount();
      });
    } else {
      options.innerHTML = q.options.map((option, i) => {
        const selected = state.answers[q.id] != null && String(state.answers[q.id]) === String(option.value);
        const icon = q.type === "scale" ? faceSvg(Number(option.value)) : `<span class="choice-icon" aria-hidden="true">${supportIcons[option.value]}</span>`;
        return `<label class="answer-option"><input type="radio" name="${q.id}" value="${escapeHtml(option.value)}"${selected ? " checked" : ""}><span class="answer-card"><span class="answer-key" aria-hidden="true">${i + 1}</span>${icon}<span class="answer-label">${escapeHtml(option.label)}</span><span class="selected-dot" aria-hidden="true">${svgIcon("check")}</span></span></label>`;
      }).join("");
      options.querySelectorAll("input").forEach((input) => input.addEventListener("change", () => {
        state.answers[q.id] = q.type === "scale" ? Number(input.value) : input.value;
        $("form-error").hidden = true;
        updateNextAvailability();
      }));
    }
    updateNextAvailability();
    document.title = `Вопрос ${state.step + 1} из 10 — Как ты?`;
    $("question-title").focus({ preventScroll: true });
  }

  function updateTextCount() {
    $("text-count").textContent = `${$("answer-text").value.length} / 2000`;
    $("text-count").classList.toggle("is-full", $("answer-text").value.length >= 1900);
  }

  function hasAnswer() {
    const q = questions[state.step];
    return q.type === "text" || q.options.some((option) => String(option.value) === String(state.answers[q.id]));
  }

  function updateNextAvailability() {
    $("next-button").disabled = !hasAnswer();
  }

  function nextStep(event) {
    if (event) event.preventDefault();
    if (!hasAnswer()) return;
    if (state.step < questions.length - 1) {
      state.step++;
      renderQuestion();
      return;
    }
    renderResult();
  }

  function renderResult() {
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      const q = questions[i];
      if (!q.options.some((option) => String(option.value) === String(state.answers[q.id]))) {
        state.step = i;
        renderQuestion();
        $("form-error").textContent = "Кажется, этот вопрос остался без ответа. Выбери свой вариант.";
        $("form-error").hidden = false;
        return;
      }
      if (i < 8) sum += Number(state.answers[q.id]);
    }
    const score = Math.round(((sum / 8) - 1) / 4 * 100);
    const descriptions = score >= 75
      ? ["В твоём дне есть свет.", "Похоже, сегодня у тебя есть энергия и приятные моменты. Заметь, что помогает тебе чувствовать себя так, и дай этому немного места."]
      : score >= 50
        ? ["Есть на что опереться.", "В твоём дне смешались разные ощущения. Можно заметить и то, что радует, и то, что забирает силы. Для обоих есть место."]
        : score >= 25
          ? ["Чуть больше мягкости.", "Похоже, день требует от тебя немало сил. Позволь себе выбрать что-то небольшое и приятное, без новых ожиданий от себя."]
          : ["Можно замедлиться.", "Судя по ответам, сейчас тебе непросто. Спасибо, что заметил это и уделил себе время. Один небольшой шаг для себя уже имеет значение."];
    $("result-title").textContent = descriptions[0];
    $("result-message").textContent = descriptions[1];
    $("result-score").textContent = score;
    $("result-support").textContent = supportLabels[state.answers.q9];
    const note = String(state.answers.q10 || "").trim();
    $("result-note-text").textContent = note || "Сегодня без слов. Иногда просто прислушаться к себе — уже достаточно.";
    $("result-note-text").classList.toggle("is-empty", !note);
    $("score-ring-value").setAttribute("stroke-dasharray", `${score / 100 * 622} 622`);
    // Remove the hidden question fields; the result is only visible in this view.
    const text = $("answer-text");
    if (text) text.value = "";
    $("answer-options").replaceChildren();
    showView("result");
    $("result-title").focus({ preventScroll: true });
  }

  $("start-button").addEventListener("click", startSurvey);
  $("home-button").addEventListener("click", goHome);
  $("pause-button").addEventListener("click", goHome);
  $("result-home").addEventListener("click", goHome);
  $("result-restart").addEventListener("click", startSurvey);
  $("survey-form").addEventListener("submit", nextStep);
  $("back-button").addEventListener("click", () => {
    if (state.step > 0) { state.step--; renderQuestion(); }
  });
  $("about-button").addEventListener("click", () => $("about-dialog").showModal());
  $("close-about").addEventListener("click", () => $("about-dialog").close());
  $("about-dialog").addEventListener("click", (event) => {
    if (event.target !== $("about-dialog")) return;
    const rect = $("about-dialog").getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) $("about-dialog").close();
  });
  document.addEventListener("keydown", (event) => {
    if ($("survey-view").hidden || $("about-dialog").open || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    const target = event.target;
    if (target instanceof HTMLTextAreaElement || (target instanceof HTMLInputElement && target.type !== "radio") || target.isContentEditable) return;
    const q = questions[state.step];
    if (/^[1-5]$/.test(event.key) && q.type !== "text") {
      const input = $("answer-options").querySelectorAll("input")[Number(event.key) - 1];
      if (input) { event.preventDefault(); input.checked = true; input.dispatchEvent(new Event("change", { bubbles: true })); input.focus({ preventScroll: true }); }
    } else if (event.key === "ArrowLeft" && target.tagName !== "INPUT" && state.step > 0) {
      event.preventDefault(); state.step--; renderQuestion();
    } else if ((event.key === "Enter" && target.tagName !== "BUTTON") || (event.key === "ArrowRight" && target.tagName !== "BUTTON" && target.tagName !== "INPUT")) {
      event.preventDefault(); nextStep();
    }
  });
  window.addEventListener("pagehide", clearAnswers);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) { clearAnswers(); showView("landing"); }
  });
  clearAnswers();
  showView("landing");
})();
