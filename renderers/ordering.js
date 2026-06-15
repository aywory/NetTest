function renderOrdering(q, container) {
  const itemOrder = q.itemOrder || q.items.map((_, i) => i);
  const shuffled = itemOrder.map((origIndex) => ({
    text: q.items[origIndex],
    origIndex
  }));

  container.innerHTML = `
    <div class="question-text">${q.question}</div>
    <div class="hint-text">Перетащи элементы в правильном порядке (сверху вниз)</div>
    <div class="ordering-list" id="ordering-${q.id}">
      ${shuffled.map((item, i) => `
        <div class="order-item" draggable="true" data-orig="${item.origIndex}" id="ord-${q.id}-${i}"
             ondragstart="orderDragStart(event)" ondragend="orderDragEnd(event)"
             ondragover="orderDragOver(event)" ondrop="orderDrop(event)">
          <span class="order-handle">⠿</span>
          <span class="order-text">${item.text}</span>
        </div>
      `).join('')}
    </div>
    <button class="btn-submit" id="btn-submit-${q.id}">Проверить</button>
    <div class="answer-explanation" id="explanation-${q.id}"></div>
  `;

  document.getElementById(`btn-submit-${q.id}`).addEventListener('click',
    () => submitOrdering(q.id, q.correct_order, q.explanation)
  );
}

let orderDragSrc = null;

function orderDragStart(e) {
  orderDragSrc = e.currentTarget;
  e.dataTransfer.effectAllowed = 'move';
  e.currentTarget.classList.add('dragging');
}

function orderDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.order-item').forEach(el => el.classList.remove('drag-over'));
}

function orderDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const target = e.currentTarget;
  if (target === orderDragSrc) return;
  document.querySelectorAll('.order-item').forEach(el => el.classList.remove('drag-over'));
  target.classList.add('drag-over');
}

function orderDrop(e) {
  e.preventDefault();
  const target = e.currentTarget;
  target.classList.remove('drag-over');
  if (!orderDragSrc || target === orderDragSrc) return;

  const list = target.parentNode;
  const items = [...list.querySelectorAll('.order-item')];
  const srcIdx = items.indexOf(orderDragSrc);
  const tgtIdx = items.indexOf(target);

  if (srcIdx < tgtIdx) list.insertBefore(orderDragSrc, target.nextSibling);
  else list.insertBefore(orderDragSrc, target);
}

function submitOrdering(qId, correctOrder, explanation = '') {
  const list = document.getElementById(`ordering-${qId}`);
  const items = [...list.querySelectorAll('.order-item')];
  const userOrder = items.map(el => parseInt(el.dataset.orig));

  const isCorrect = correctOrder.every((origIdx, pos) => userOrder[pos] === origIdx);

  items.forEach((el, pos) => {
    const origIdx = parseInt(el.dataset.orig);
    el.classList.add(origIdx === correctOrder[pos] ? 'correct' : 'wrong');
    el.setAttribute('draggable', false);
  });

  document.getElementById(`btn-submit-${qId}`).disabled = true;
  renderAnswerExplanation(qId, isCorrect, explanation);
  recordAnswer(isCorrect);
}
