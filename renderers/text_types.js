// ── fill_blank ─────────────────────────────────────────────────────────────
function renderFillBlank(q, container) {
  container.innerHTML = `
    <div class="question-text">${q.question}</div>
    <div class="input-row">
      <input type="text" id="input-${q.id}" class="text-input" placeholder="Введи ответ...">
      <button class="btn-submit" id="btn-submit-${q.id}">Ответить</button>
    </div>
    <div class="answer-feedback" id="feedback-${q.id}"></div>
  `;

  const doSubmit = () => submitFillBlank(q.id, q.accept_variants, q.answer);
  document.getElementById(`input-${q.id}`).addEventListener('keydown', e => {
    if (e.key === 'Enter') doSubmit();
  });
  document.getElementById(`btn-submit-${q.id}`).addEventListener('click', doSubmit);
  setTimeout(() => document.getElementById(`input-${q.id}`)?.focus(), 50);
}

function submitFillBlank(qId, variants, correctAnswer) {
  const input = document.getElementById(`input-${qId}`);
  const val = input.value.trim().toLowerCase();
  if (!val) { showToast('Введи ответ'); return; }

  const isCorrect = variants.some(v => v.toLowerCase() === val);
  const fb = document.getElementById(`feedback-${qId}`);

  input.disabled = true;
  document.getElementById(`btn-submit-${qId}`).disabled = true;

  if (isCorrect) {
    input.classList.add('input-correct');
    fb.className = 'answer-feedback feedback-correct';
    fb.textContent = '✓ Верно!';
  } else {
    input.classList.add('input-wrong');
    fb.className = 'answer-feedback feedback-wrong';
    fb.innerHTML = `✗ Неверно. Правильный ответ: <strong>${correctAnswer}</strong>`;
  }

  recordAnswer(isCorrect);
}

// ── numeric ────────────────────────────────────────────────────────────────
function renderNumeric(q, container) {
  container.innerHTML = `
    <div class="question-text">${q.question}</div>
    ${q.hint && showHints ? `<div class="hint-text">Подсказка: ${q.hint}</div>` : ''}
    <div class="input-row">
      <input type="number" id="input-${q.id}" class="text-input numeric-input" placeholder="Число...">
      <button class="btn-submit" id="btn-submit-${q.id}">Ответить</button>
    </div>
    <div class="answer-feedback" id="feedback-${q.id}"></div>
  `;

  const doSubmit = () => submitNumeric(q.id, q.answer);
  document.getElementById(`input-${q.id}`).addEventListener('keydown', e => {
    if (e.key === 'Enter') doSubmit();
  });
  document.getElementById(`btn-submit-${q.id}`).addEventListener('click', doSubmit);
  setTimeout(() => document.getElementById(`input-${q.id}`)?.focus(), 50);
}

function submitNumeric(qId, correctAnswer) {
  const input = document.getElementById(`input-${qId}`);
  const val = parseFloat(input.value);
  if (isNaN(val)) { showToast('Введи число'); return; }

  const isCorrect = val === correctAnswer;
  const fb = document.getElementById(`feedback-${qId}`);

  input.disabled = true;
  document.getElementById(`btn-submit-${qId}`).disabled = true;

  if (isCorrect) {
    input.classList.add('input-correct');
    fb.className = 'answer-feedback feedback-correct';
    fb.textContent = '✓ Верно!';
  } else {
    input.classList.add('input-wrong');
    fb.className = 'answer-feedback feedback-wrong';
    fb.innerHTML = `✗ Неверно. Правильный ответ: <strong>${correctAnswer}</strong>`;
  }

  recordAnswer(isCorrect);
}

// ── find_error — самооценка ────────────────────────────────────────────────
function renderFindError(q, container) {
  const escaped = q.code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  container.innerHTML = `
    <div class="question-text">${q.question}</div>
    <pre class="code-block">${escaped}</pre>
    <textarea id="input-${q.id}" class="textarea-input" placeholder="Опиши найденную ошибку..." rows="3"></textarea>
    <button class="btn-submit" id="btn-submit-${q.id}">Проверить</button>
    <div class="answer-feedback" id="feedback-${q.id}"></div>
  `;

  document.getElementById(`btn-submit-${q.id}`).addEventListener('click',
    () => revealSelfAssess(q.id, q.answer)
  );
}

// ── scenario — самооценка ──────────────────────────────────────────────────
function renderScenario(q, container) {
  container.innerHTML = `
    <div class="scenario-badge">🔍 Сценарий</div>
    <div class="question-text">${q.question}</div>
    <textarea id="input-${q.id}" class="textarea-input" placeholder="Опиши причину и решение..." rows="4"></textarea>
    <button class="btn-submit" id="btn-submit-${q.id}">Проверить</button>
    <div class="answer-feedback" id="feedback-${q.id}"></div>
  `;

  document.getElementById(`btn-submit-${q.id}`).addEventListener('click',
    () => revealSelfAssess(q.id, q.answer)
  );
}

// ── самооценка: показать эталон и кнопки ✓ / ✗ ───────────────────────────
function revealSelfAssess(qId, correctAnswer) {
  const el = document.getElementById(`input-${qId}`);
  const val = el.value.trim();
  if (!val) { showToast('Напиши ответ перед проверкой'); return; }

  el.disabled = true;
  document.getElementById(`btn-submit-${qId}`).disabled = true;

  const fb = document.getElementById(`feedback-${qId}`);
  fb.className = 'answer-feedback feedback-reveal';
  fb.innerHTML = `
    <div class="selfassess-label">Эталонный ответ:</div>
    <div class="selfassess-answer">${correctAnswer}</div>
    <div class="selfassess-label" style="margin-top:.9rem">Твой ответ совпадает по смыслу?</div>
    <div class="selfassess-buttons">
      <button class="btn-selfassess btn-yes" id="sa-yes-${qId}">✓ Да, верно</button>
      <button class="btn-selfassess btn-no"  id="sa-no-${qId}">✗ Нет, ошибся</button>
    </div>
  `;

  document.getElementById(`sa-yes-${qId}`).addEventListener('click', () => finishSelfAssess(qId, true));
  document.getElementById(`sa-no-${qId}`).addEventListener('click',  () => finishSelfAssess(qId, false));
}

function finishSelfAssess(qId, isCorrect) {
  document.getElementById(`sa-yes-${qId}`).disabled = true;
  document.getElementById(`sa-no-${qId}`).disabled = true;

  const fb = document.getElementById(`feedback-${qId}`);
  fb.classList.add(isCorrect ? 'selfassess-confirmed-correct' : 'selfassess-confirmed-wrong');

  recordAnswer(isCorrect);
}
