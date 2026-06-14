function renderSingleChoice(q, container) {
  container.innerHTML = `
    <div class="question-text">${q.question}</div>
    <div class="options-list" id="options-${q.id}">
      ${q.options.map((opt, i) => `
        <label class="option-label" data-index="${i}">
          <input type="radio" name="q${q.id}" value="${i}" class="option-radio">
          <span class="option-text">${opt}</span>
        </label>
      `).join('')}
    </div>
    <button class="btn-submit" id="btn-submit-${q.id}">Ответить</button>
  `;

  document.getElementById(`btn-submit-${q.id}`).addEventListener('click',
    () => submitSingleChoice(q.id, q.answer)
  );
}

function submitSingleChoice(qId, correctAnswer) {
  const selected = document.querySelector(`input[name="q${qId}"]:checked`);
  if (!selected) { showToast('Выбери вариант ответа'); return; }

  const val = parseInt(selected.value);
  const isCorrect = val === correctAnswer;
  const labels = document.querySelectorAll(`#options-${qId} .option-label`);

  labels.forEach((label, i) => {
    label.classList.remove('correct', 'wrong');
    if (i === correctAnswer) label.classList.add('correct');
    else if (i === val && !isCorrect) label.classList.add('wrong');
    label.querySelector('input').disabled = true;
  });

  document.getElementById(`btn-submit-${qId}`).disabled = true;
  recordAnswer(isCorrect);
}
