function renderSingleChoice(q, container) {
  const optionOrder = q.optionOrder || q.options.map((_, i) => i);

  container.innerHTML = `
    <div class="question-text">${q.question}</div>
    <div class="options-list" id="options-${q.id}">
      ${optionOrder.map((origIndex) => `
        <label class="option-label" data-index="${origIndex}">
          <input type="radio" name="q${q.id}" value="${origIndex}" class="option-radio">
          <span class="option-text">${q.options[origIndex]}</span>
        </label>
      `).join('')}
    </div>
    <button class="btn-submit" id="btn-submit-${q.id}">Ответить</button>
    <div class="answer-explanation" id="explanation-${q.id}"></div>
  `;

  document.getElementById(`btn-submit-${q.id}`).addEventListener('click',
    () => submitSingleChoice(q.id, q.answer, q.explanation)
  );
}

function submitSingleChoice(qId, correctAnswer, explanation = '') {
  const selected = document.querySelector(`input[name="q${qId}"]:checked`);
  if (!selected) { showToast('Выбери вариант ответа'); return; }

  const val = parseInt(selected.value);
  const isCorrect = val === correctAnswer;
  const labels = document.querySelectorAll(`#options-${qId} .option-label`);

  labels.forEach((label) => {
    const origIndex = parseInt(label.dataset.index);
    label.classList.remove('correct', 'wrong');
    if (origIndex === correctAnswer) label.classList.add('correct');
    else if (origIndex === val && !isCorrect) label.classList.add('wrong');
    label.querySelector('input').disabled = true;
  });

  document.getElementById(`btn-submit-${qId}`).disabled = true;
  renderAnswerExplanation(qId, isCorrect, explanation);
  recordAnswer(isCorrect);
}
