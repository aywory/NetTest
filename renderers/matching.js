function renderMatching(q, container) {
  const rightOrder = q.rightOrder || q.pairs.map((_, i) => i);
  const rights = rightOrder.map((origIndex) => ({
    text: q.pairs[origIndex].right,
    origIndex
  }));

  container.innerHTML = `
    <div class="question-text">${q.question}</div>
    <div class="matching-layout">
      <div class="matching-col left-col">
        ${q.pairs.map((p, i) => `
          <div class="match-left-item" data-index="${i}">
            <span>${p.left}</span>
            <div class="match-drop-zone" data-target="${i}"
                 ondragover="allowDrop(event)" ondrop="dropMatch(event, ${i})">
              <span class="drop-placeholder">Перетащи сюда</span>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="matching-col right-col" id="right-col-${q.id}">
        ${rights.map((r, i) => `
          <div class="match-right-item" draggable="true"
               data-orig="${r.origIndex}" id="right-${q.id}-${i}"
               ondragstart="dragStart(event)" ondragend="dragEnd(event)">
            ${r.text}
          </div>
        `).join('')}
      </div>
    </div>
    <button class="btn-submit" id="btn-submit-${q.id}">Проверить</button>
    <div class="answer-explanation" id="explanation-${q.id}"></div>
  `;

  document.getElementById(`btn-submit-${q.id}`).addEventListener('click',
    () => submitMatching(q.id, q.pairs.length, q.explanation)
  );
}

function allowDrop(e) { e.preventDefault(); }

function dragStart(e) {
  e.dataTransfer.setData('text/plain', e.target.id);
  e.target.classList.add('dragging');
}

function dragEnd(e) { e.target.classList.remove('dragging'); }

function dropMatch(e, targetIndex) {
  e.preventDefault();
  const draggedId = e.dataTransfer.getData('text/plain');
  const draggedEl = document.getElementById(draggedId);
  if (!draggedEl) return;

  const zone = document.querySelector(`.match-drop-zone[data-target="${targetIndex}"]`);

  // If zone already has a card, send it back to right col
  const existing = zone.querySelector('.match-right-item');
  if (existing) {
    const layout = zone.closest('.matching-layout');
    const rightCol = layout.querySelector('.right-col');
    rightCol.appendChild(existing);
  }

  const placeholder = zone.querySelector('.drop-placeholder');
  if (placeholder) placeholder.remove();
  zone.appendChild(draggedEl);
}

function submitMatching(qId, pairCount, explanation = '') {
  const zones = document.querySelectorAll('.match-drop-zone');
  let allFilled = true;

  zones.forEach(zone => {
    if (!zone.querySelector('.match-right-item')) allFilled = false;
  });

  if (!allFilled) { showToast('Заполни все поля'); return; }

  let correct = 0;
  zones.forEach(zone => {
    const targetIdx = parseInt(zone.dataset.target);
    const card = zone.querySelector('.match-right-item');
    const origIdx = parseInt(card.dataset.orig);
    const isRight = origIdx === targetIdx;
    zone.classList.add(isRight ? 'match-correct' : 'match-wrong');
    card.classList.add(isRight ? 'correct' : 'wrong');
    if (isRight) correct++;
  });

  document.getElementById(`btn-submit-${qId}`).disabled = true;
  document.querySelectorAll('.match-right-item').forEach(el => el.setAttribute('draggable', false));
  const isCorrect = correct === pairCount;
  renderAnswerExplanation(qId, isCorrect, explanation);
  recordAnswer(isCorrect);
}
