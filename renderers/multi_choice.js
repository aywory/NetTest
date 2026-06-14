function renderMultiChoice(q, container) {
  container.innerHTML = `
    <div class="question-text">${q.question}</div>
    <div class="hint-text">Можно выбрать несколько вариантов</div>
    <div class="options-list" id="options-${q.id}">
      ${q.options.map((opt, i) => `
        <label class="option-label" data-index="${i}">
          <input type="checkbox" name="q${q.id}" value="${i}" class="option-checkbox">
          <span class="option-text">${opt}</span>
        </label>
      `).join('')}
    </div>
    <button class="btn-submit" id="btn-submit-${q.id}">Ответить</button>
  `;

  document.getElementById(`btn-submit-${q.id}`).addEventListener('click',
    () => submitMultiChoice(q.id, q.answers)
  );
}

function submitMultiChoice(qId, correctAnswers) {
  const checked = Array.from(document.querySelectorAll(`input[name="q${qId}"]:checked`))
    .map(el => parseInt(el.value));

  if (checked.length === 0) { showToast('Выбери хотя бы один вариант'); return; }

  const isCorrect =
    checked.length === correctAnswers.length &&
    checked.every(v => correctAnswers.includes(v));

  const labels = document.querySelectorAll(`#options-${qId} .option-label`);
  labels.forEach((label, i) => {
    label.classList.remove('correct', 'wrong');
    if (correctAnswers.includes(i)) label.classList.add('correct');
    else if (checked.includes(i)) label.classList.add('wrong');
    label.querySelector('input').disabled = true;
  });

  document.getElementById(`btn-submit-${qId}`).disabled = true;
  recordAnswer(isCorrect);
}
