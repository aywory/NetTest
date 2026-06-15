function renderMultiChoice(q, container) {
  const optionOrder = q.optionOrder || q.options.map((_, i) => i);

  container.innerHTML = `
    <div class="question-text">${q.question}</div>
    <div class="hint-text">Можно выбрать несколько вариантов</div>
    <div class="options-list" id="options-${q.id}">
      ${optionOrder.map((origIndex) => `
        <label class="option-label" data-index="${origIndex}">
          <input type="checkbox" name="q${q.id}" value="${origIndex}" class="option-checkbox">
          <span class="option-text">${q.options[origIndex]}</span>
        </label>
      `).join('')}
    </div>
    <button class="btn-submit" id="btn-submit-${q.id}">Ответить</button>
    <div class="answer-explanation" id="explanation-${q.id}"></div>
  `;

  document.getElementById(`btn-submit-${q.id}`).addEventListener('click',
    () => submitMultiChoice(q.id, q.answers, q.explanation)
  );
}

function submitMultiChoice(qId, correctAnswers, explanation = '') {
  const checked = Array.from(document.querySelectorAll(`input[name="q${qId}"]:checked`))
    .map(el => parseInt(el.value));

  if (checked.length === 0) { showToast('Выбери хотя бы один вариант'); return; }

  const isCorrect =
    checked.length === correctAnswers.length &&
    checked.every(v => correctAnswers.includes(v));

  const labels = document.querySelectorAll(`#options-${qId} .option-label`);
  labels.forEach((label) => {
    const origIndex = parseInt(label.dataset.index);
    const isChecked = checked.includes(origIndex);
    const shouldBeChecked = correctAnswers.includes(origIndex);

    label.classList.remove('correct', 'wrong');
    if (shouldBeChecked && isChecked) label.classList.add('correct');
    else if (shouldBeChecked || isChecked) label.classList.add('wrong');
    label.querySelector('input').disabled = true;
  });

  document.getElementById(`btn-submit-${qId}`).disabled = true;
  renderAnswerExplanation(qId, isCorrect, explanation);
  recordAnswer(isCorrect);
}
