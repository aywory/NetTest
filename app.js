// ══════════════════════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════════════════════
let questions = [];
let sortTrainers = [];
let sortTrainerState = null;
let shuffled  = [];
let current   = 0;
let results   = [];   // true/false per question
let startTime = null;
let answered  = false;
let showHints = false;
let currentMode = 'full';
let examSession = null;
const STORAGE_KEY = 'net_quiz_sessions';
const ACTIVE_STORAGE_KEY = 'net_quiz_active_session';
const EXAM_ROTATION_STORAGE_KEY = 'net_quiz_exam_rotation';
const EXAM_ROTATION_WINDOW = 6;

const TEST_MODES = {
  full: {
    title: 'Полный банк',
    description: 'Все вопросы: лабораторные и термины',
    filter: () => true
  },
  labs: {
    title: 'Лабы 1-8',
    description: 'Практика по пройденным лабораторным',
    filter: q => q.topic !== 'Термины и определения' && q.pack !== 'supplement' && q.pack !== 'topology_deep' && q.pack !== 'address_classes_deep'
  },
  terms: {
    title: 'Термины',
    description: 'Определения, уровни, протоколы, устройства',
    filter: q => q.topic === 'Термины и определения'
  },
  supplement: {
    title: 'Дополнение',
    description: 'Темы и формулировки, всплывшие после экзамена',
    filter: q => q.pack === 'supplement'
  },
  topologies: {
    title: 'Топологии',
    description: 'Шина, звезда, кольцо, mesh, дерево, STP, Wi-Fi и подвохи',
    filter: q => q.pack === 'topology_deep'
  },
  address_classes: {
    title: 'Классы IPv4',
    description: 'A/B/C/D/E, private, reserved, CIDR и адресные подвохи',
    filter: q => q.pack === 'address_classes_deep'
  },
  exam: {
    title: 'Экзамен',
    description: '15 одиночных, 4 множественных и задача',
    examSize: 20,
    filter: q => q.type === 'single_choice' || q.type === 'multi_choice'
  },
  exam_v2: {
    title: 'Экзамен v2',
    description: '15 одиночных, 4 множественных и таблицы маршрутизации',
    examSize: 20,
    filter: q => q.type === 'single_choice' || q.type === 'multi_choice'
  }
};

// ══════════════════════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════════════════════
async function init() {
  try {
    const [questionsRes, sortTrainersRes] = await Promise.all([
      fetch('questions.json'),
      fetch('sort_trainers.json')
    ]);
    questions = await questionsRes.json();
    sortTrainers = await sortTrainersRes.json();
    updateModeStats();
    updateSortTrainerStats();
    renderHistoryTable();
    if (!restoreActiveSession()) {
      showScreen('start-screen');
    }
  } catch(e) {
    document.body.innerHTML = `<div style="color:#ff4d4d;padding:2rem;font-family:monospace">
      Ошибка загрузки questions.json:<br>${e.message}</div>`;
  }
}

// ══════════════════════════════════════════════════════════════
//  SCREEN SWITCHING
// ══════════════════════════════════════════════════════════════
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ══════════════════════════════════════════════════════════════
//  QUIZ START
// ══════════════════════════════════════════════════════════════
function startQuiz(modeId = currentMode) {
  currentMode = TEST_MODES[modeId] ? modeId : 'full';
  if (currentMode === 'exam' || currentMode === 'exam_v2') {
    startExam(currentMode);
    return;
  }

  examSession = null;
  const pool = getModeQuestions(currentMode);
  if (!pool.length) {
    showToast('В этом режиме пока нет вопросов');
    return;
  }

  shuffled  = shuffle([...pool]).map(prepareQuestionForSession);
  current   = 0;
  results   = [];
  startTime = Date.now();
  answered  = false;
  showHints = Boolean(document.getElementById('show-hints')?.checked);

  buildProgressBar();
  saveActiveSession();
  showScreen('quiz-screen');
  renderQuestion();
}

function getModeQuestions(modeId) {
  const mode = TEST_MODES[modeId] || TEST_MODES.full;
  return questions.filter(mode.filter);
}

function selectMode(modeId) {
  if (!TEST_MODES[modeId]) return;
  currentMode = modeId;
  document.querySelectorAll('.mode-card').forEach(card => {
    card.classList.toggle('active', card.dataset.mode === modeId);
  });
  updateModeStats();
}

function updateModeStats() {
  Object.keys(TEST_MODES).forEach(modeId => {
    const el = document.getElementById(`mode-count-${modeId}`);
    if (el) el.textContent = TEST_MODES[modeId].examSize || getModeQuestions(modeId).length;
  });

  const totalEl = document.getElementById('q-total');
  if (totalEl) totalEl.textContent = TEST_MODES[currentMode]?.examSize || getModeQuestions(currentMode).length;
}

function startExam(modeId = 'exam') {
  const singleQuestions = questions.filter(q => q.type === 'single_choice');
  const multiQuestions = questions.filter(q => q.type === 'multi_choice');

  if (singleQuestions.length < 15 || multiQuestions.length < 4) {
    showToast('Недостаточно вопросов для режима экзамена');
    return;
  }

  const examRotation = getExamRotation();
  const singles = pickDistributedQuestions(singleQuestions, 15, examRotation);
  const multis = pickDistributedQuestions(multiQuestions, 4, examRotation);
  rememberExamQuestions([...singles, ...multis], examRotation);

  currentMode = modeId === 'exam_v2' ? 'exam_v2' : 'exam';
  shuffled = [...singles, ...multis].map(prepareQuestionForSession);
  current = 0;
  results = [];
  startTime = Date.now();
  answered = false;
  showHints = Boolean(document.getElementById('show-hints')?.checked);
  examSession = {
    startedAt: startTime,
    singleCount: 15,
    multiCount: 4,
    singlePoints: 4,
    multiPoints: 5,
    taskMode: currentMode === 'exam_v2' ? 'routing_v2' : 'subnet_v1',
    modeId: currentMode,
    taskPoints: null,
    saved: false,
    final: null
  };

  selectMode(currentMode);
  buildProgressBar();
  saveActiveSession();
  showScreen('quiz-screen');
  renderQuestion();
}

function pickDistributedQuestions(pool, count, rotation = null) {
  const groups = new Map();
  sortQuestionsForExam(pool, rotation).forEach(q => {
    if (!groups.has(q.topic)) groups.set(q.topic, []);
    groups.get(q.topic).push(q);
  });

  const topics = sortExamTopics(groups, rotation);
  const picked = [];
  while (picked.length < count && topics.length) {
    let moved = false;
    for (const topic of topics) {
      const group = groups.get(topic);
      if (group?.length) {
        picked.push(group.shift());
        moved = true;
        if (picked.length >= count) break;
      }
    }
    if (!moved) break;
  }

  if (picked.length < count) {
    const pickedIds = new Set(picked.map(q => q.id));
    const rest = sortQuestionsForExam(pool.filter(q => !pickedIds.has(q.id)), rotation);
    picked.push(...rest.slice(0, count - picked.length));
  }

  return picked;
}

function sortQuestionsForExam(pool, rotation) {
  return [...pool]
    .map(q => ({
      q,
      score: examQuestionRepeatScore(q, rotation) + Math.random()
    }))
    .sort((a, b) => a.score - b.score)
    .map(item => item.q);
}

function sortExamTopics(groups, rotation) {
  return [...groups.keys()]
    .map(topic => {
      const topicQuestions = groups.get(topic) || [];
      const bestQuestionScore = topicQuestions.length
        ? Math.min(...topicQuestions.map(q => examQuestionRepeatScore(q, rotation)))
        : 0;
      return { topic, score: bestQuestionScore + Math.random() };
    })
    .sort((a, b) => a.score - b.score)
    .map(item => item.topic);
}

function examQuestionRepeatScore(question, rotation) {
  if (!rotation) return 0;

  const id = String(question.id);
  const recentIndex = rotation.recent.findIndex(attempt => attempt.questionIds.includes(id));
  const recentPenalty = recentIndex >= 0
    ? (EXAM_ROTATION_WINDOW - recentIndex) * 1000
    : 0;
  const usagePenalty = (rotation.usage[id] || 0) * 25;
  return recentPenalty + usagePenalty;
}

function getExamRotation() {
  try {
    const parsed = JSON.parse(localStorage.getItem(EXAM_ROTATION_STORAGE_KEY));
    if (!parsed || parsed.version !== 1) throw new Error('Invalid rotation');

    const knownIds = new Set(questions.map(q => String(q.id)));
    const recent = Array.isArray(parsed.recent)
      ? parsed.recent
          .map(attempt => ({
            date: Number(attempt.date) || Date.now(),
            questionIds: Array.isArray(attempt.questionIds)
              ? attempt.questionIds.map(String).filter(id => knownIds.has(id))
              : []
          }))
          .filter(attempt => attempt.questionIds.length)
          .slice(0, EXAM_ROTATION_WINDOW)
      : [];

    const usage = {};
    if (parsed.usage && typeof parsed.usage === 'object') {
      Object.entries(parsed.usage).forEach(([id, count]) => {
        if (knownIds.has(String(id))) usage[String(id)] = Math.max(0, Number(count) || 0);
      });
    }

    return { version: 1, recent, usage };
  } catch {
    return { version: 1, recent: [], usage: {} };
  }
}

function rememberExamQuestions(selectedQuestions, rotation = getExamRotation()) {
  const questionIds = selectedQuestions.map(q => String(q.id));
  if (!questionIds.length) return;

  const usage = { ...rotation.usage };
  questionIds.forEach(id => {
    usage[id] = (usage[id] || 0) + 1;
  });

  const recent = [
    { date: Date.now(), questionIds },
    ...rotation.recent
  ].slice(0, EXAM_ROTATION_WINDOW);

  try {
    localStorage.setItem(EXAM_ROTATION_STORAGE_KEY, JSON.stringify({
      version: 1,
      recent,
      usage
    }));
  } catch {
    // Rotation memory is helpful, but the exam must still start if storage is full.
  }
}

function beginExamTask() {
  if (!examSession) {
    showResults();
    return;
  }

  examSession.quizResults = [...results];
  examSession.quizQuestionIds = shuffled.map(q => q.id);
  saveActiveSession();
  showToast('Тестовая часть завершена. Осталась задача на 20 баллов.');
  if (examSession.taskMode === 'routing_v2') {
    startRoutingTaskV2({ examMode: true });
  } else {
    startSubnetTask({ examMode: true });
  }
}

function finishExamFromTask(taskPoints, taskReview = null) {
  if (!examSession || examSession.saved) return null;

  const singleCorrect = results.slice(0, examSession.singleCount).filter(Boolean).length;
  const multiCorrect = results.slice(examSession.singleCount, examSession.singleCount + examSession.multiCount).filter(Boolean).length;
  const singleScore = singleCorrect * examSession.singlePoints;
  const multiScore = multiCorrect * examSession.multiPoints;
  const quizScore = singleScore + multiScore;
  const totalPoints = roundExamPoints(quizScore + taskPoints);
  const score = examGrade(totalPoints);
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const topicMap = {
    'Одиночный выбор': { ok: singleScore, total: 60 },
    'Множественный выбор': { ok: multiScore, total: 20 },
    [examSession.taskMode === 'routing_v2' ? 'Задача v2: таблицы маршрутизации' : 'Задача 8 лабы']: { ok: taskPoints, total: 20 }
  };

  examSession.taskPoints = taskPoints;
  examSession.saved = true;
  examSession.final = {
    singleCorrect,
    multiCorrect,
    singleScore,
    multiScore,
    quizScore,
    taskPoints,
    taskReview,
    totalPoints,
    score,
    elapsed,
    topicMap
  };

  saveSession({
    correct: totalPoints,
    total: 100,
    score,
    elapsed,
    topicMap,
    date: Date.now(),
    modeId: examSession.modeId || 'exam',
    modeName: TEST_MODES[examSession.modeId || 'exam']?.title || 'Экзамен',
    completed: true
  });
  clearActiveSession();
  renderHistoryTable();
  return examSession.final;
}

function showExamResultScreen() {
  if (!examSession?.final) return;
  const final = examSession.final;
  const modeTitle = TEST_MODES[examSession.modeId || currentMode]?.title || 'Экзамен';

  document.getElementById('res-score').textContent = final.score;
  document.getElementById('res-score').className = `score-display score-${scoreClass(final.score)}`;
  document.getElementById('res-comment').textContent =
    `${modeTitle}: ${final.totalPoints}/100 баллов. ${examComment(final.score)}`;
  document.getElementById('res-correct').textContent =
    `${final.singleCorrect}/15 + ${final.multiCorrect}/4`;
  document.getElementById('res-time').textContent = formatTime(final.elapsed);
  document.getElementById('res-percent').textContent = `${final.totalPoints}/100`;

  const topicEl = document.getElementById('res-topics');
  topicEl.innerHTML = Object.entries(final.topicMap).map(([topic, data]) => {
    const pct = Math.round(data.ok / data.total * 100);
    const cls = pct >= 80 ? 'topic-good' : pct >= 50 ? 'topic-mid' : 'topic-bad';
    return `<div class="topic-row ${cls}">
      <span class="topic-name">${topic}</span>
      <span class="topic-stat">${data.ok}/${data.total} (${pct}%)</span>
      <div class="topic-bar"><div class="topic-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');

  renderExamTaskReview(final.taskReview);

  const resSeg = document.getElementById('result-progress');
  resSeg.innerHTML = [
    ...results.map(r => `<div class="progress-seg ${r ? 'seg-correct' : 'seg-wrong'}"></div>`),
    `<div class="progress-seg ${final.taskPoints >= 12 ? 'seg-correct' : 'seg-wrong'}"></div>`
  ].join('');

  renderHistoryTable();
  showScreen('result-screen');
}

function renderExamTaskReview(review) {
  const el = document.getElementById('res-task-review');
  if (!el) return;

  if (!review) {
    el.innerHTML = '';
    return;
  }

  const messagesHtml = review.messages?.length
    ? `<ul>${review.messages.map(msg => `<li>${msg}</li>`).join('')}</ul>`
    : '<p>Ошибок в задаче нет.</p>';

  el.innerHTML = `
    <div class="section-title">Разбор задачи</div>
    <div class="exam-task-review">
      <div class="task-total-score">${review.total} / ${review.max}</div>
      <div class="task-score">
        ${review.breakdown.map(item => `
          <div class="task-score-item">
            <strong>${item.score}/${item.max}</strong>
            <span>${item.label}</span>
          </div>
        `).join('')}
      </div>
      <div class="task-feedback show ${review.messages?.length ? 'bad' : 'ok'}">
        ${messagesHtml}
      </div>
      ${review.solutionHtml || ''}
    </div>
  `;
}

function saveInterruptedExamSession() {
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const singleDone = Math.min(results.length, 15);
  const multiDone = Math.max(0, results.length - 15);
  const singleCorrect = results.slice(0, 15).filter(Boolean).length;
  const multiCorrect = results.slice(15, 19).filter(Boolean).length;
  const points = singleCorrect * 4 + multiCorrect * 5;

  saveSession({
    correct: points,
    total: 100,
    score: 0,
    elapsed,
    topicMap: {
      'Одиночный выбор': { ok: singleCorrect * 4, total: 60 },
      'Множественный выбор': { ok: multiCorrect * 5, total: 20 },
      'Задача 8 лабы': { ok: 0, total: 20 }
    },
    date: Date.now(),
    modeId: currentMode,
    modeName: `${TEST_MODES[currentMode]?.title || 'Экзамен'}: прерван (${singleDone + multiDone}/19 тестов)`,
    completed: false
  });
}

function exitExamToMenu() {
  if (results.length > 0) {
    const ok = confirm('Сохранить текущий прогресс экзамена как прерванный и выйти в меню?');
    if (!ok) return;
    saveInterruptedExamSession();
  }

  clearActiveSession();
  examSession = null;
  shuffled = [];
  current = 0;
  results = [];
  answered = false;
  renderHistoryTable();
  showScreen('start-screen');
}

function abortExamFromTask() {
  saveInterruptedExamSession();
  clearActiveSession();
  examSession = null;
  shuffled = [];
  current = 0;
  results = [];
  answered = false;
  renderHistoryTable();
  showScreen('start-screen');
}

function examGrade(points) {
  if (points >= 90) return 5;
  if (points >= 80) return 4;
  if (points >= 60) return 3;
  if (points >= 40) return 2;
  if (points > 0) return 1;
  return 0;
}

function examComment(score) {
  if (score >= 5) return 'Уровень уверенной пятёрки.';
  if (score === 4) return 'Уровень четвёрки: тестовая база закрыта, задача добавила баллы.';
  if (score === 3) return 'Минимальный проходной уровень: надо добрать слабые темы.';
  return 'Экзамен пока не закрыт, нужно повторить базу и адресацию.';
}

function roundExamPoints(value) {
  return Math.round(value * 10) / 10;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function prepareQuestionForSession(q, savedState = null) {
  const prepared = { ...q };

  if (Array.isArray(q.options)) {
    prepared.optionOrder = normalizeOrder(savedState?.optionOrder, q.options.length)
      || shuffle(q.options.map((_, i) => i));
  }

  if (Array.isArray(q.pairs)) {
    prepared.rightOrder = normalizeOrder(savedState?.rightOrder, q.pairs.length)
      || shuffle(q.pairs.map((_, i) => i));
  }

  if (Array.isArray(q.items)) {
    prepared.itemOrder = normalizeOrder(savedState?.itemOrder, q.items.length)
      || shuffle(q.items.map((_, i) => i));
  }

  return prepared;
}

function normalizeOrder(order, expectedLength) {
  if (!Array.isArray(order) || order.length !== expectedLength) return null;
  const nums = order.map(Number);
  const seen = new Set(nums);
  if (seen.size !== expectedLength) return null;
  for (let i = 0; i < expectedLength; i++) {
    if (!seen.has(i)) return null;
  }
  return nums;
}

// ══════════════════════════════════════════════════════════════
//  SORT TRAINERS
// ══════════════════════════════════════════════════════════════
function updateSortTrainerStats() {
  const countEl = document.getElementById('sort-trainer-count');
  if (countEl) countEl.textContent = sortTrainers.length;
}

function startSortTrainer(trainerId = null) {
  if (!sortTrainers.length) {
    showToast('Тренажёры соответствий не загружены');
    return;
  }

  const trainer = sortTrainers.find(item => item.id === trainerId) || sortTrainers[0];
  buildSortTrainerRound(trainer.id);
  showScreen('sort-trainer-screen');
}

function exitSortTrainer() {
  sortTrainerState = null;
  showScreen('start-screen');
}

function resetSortTrainerRound() {
  const trainerId = sortTrainerState?.trainerId || sortTrainers[0]?.id;
  if (trainerId) buildSortTrainerRound(trainerId);
}

function resetSortTrainerAnswers() {
  if (!sortTrainerState) return;
  sortTrainerState.checked = false;
  sortTrainerState.groups.forEach(group => {
    group.instances.forEach(instance => {
      instance.location = 'source';
    });
  });
  renderSortTrainer();
}

function checkSortTrainer() {
  if (!sortTrainerState) return;
  sortTrainerState.checked = true;
  renderSortTrainer();
}

function buildSortTrainerRound(trainerId) {
  const trainer = sortTrainers.find(item => item.id === trainerId);
  if (!trainer) return;

  const groups = trainer.groups.map(group => {
    const correctCards = trainer.cards.filter(card =>
      Array.isArray(card.correctGroups) && card.correctGroups.includes(group.id)
    );
    const correctIds = new Set(correctCards.map(card => card.id));
    const decoys = pickSortTrainerDecoys(trainer, group.id, correctIds);
    const instances = shuffle([...correctCards, ...decoys].map(card => ({
      id: `${group.id}__${card.id}`,
      cardId: card.id,
      groupId: group.id,
      location: 'source'
    })));

    return {
      ...group,
      instances,
      correctCount: correctCards.length
    };
  });

  sortTrainerState = {
    trainerId: trainer.id,
    trainer,
    cardById: Object.fromEntries(trainer.cards.map(card => [card.id, card])),
    groups,
    checked: false
  };

  renderSortTrainer();
}

function pickSortTrainerDecoys(trainer, groupId, correctIds) {
  const range = Array.isArray(trainer.decoyRange) ? trainer.decoyRange : [2, 4];
  const min = Math.max(0, Number(range[0]) || 0);
  const max = Math.max(min, Number(range[1]) || min);
  const targetCount = randomBetween(min, max);

  const trapCards = trainer.cards.filter(card =>
    !correctIds.has(card.id) && Array.isArray(card.trapFor) && card.trapFor.includes(groupId)
  );
  const fallbackCards = trainer.cards.filter(card =>
    !correctIds.has(card.id) && !trapCards.some(trap => trap.id === card.id)
  );

  const picked = sampleItems(trapCards, targetCount);
  if (picked.length < targetCount) {
    picked.push(...sampleItems(fallbackCards, targetCount - picked.length));
  }

  return picked;
}

function renderSortTrainer() {
  if (!sortTrainerState) return;

  const { trainer, groups, checked } = sortTrainerState;
  document.getElementById('sort-trainer-title').textContent = trainer.title;
  document.getElementById('sort-trainer-desc').textContent = trainer.description || '';

  renderSortTrainerTabs();
  renderSortTrainerSummary();

  const container = document.getElementById('sort-trainer-container');
  container.innerHTML = `
    <div class="sort-board ${checked ? 'sort-board-checked' : ''}">
      ${groups.map(group => renderSortTrainerGroup(group)).join('')}
    </div>
  `;
  attachSortTrainerEvents();
}

function renderSortTrainerTabs() {
  const tabsEl = document.getElementById('sort-trainer-tabs');
  tabsEl.innerHTML = sortTrainers.map(trainer => `
    <button
      class="trainer-tab ${trainer.id === sortTrainerState.trainerId ? 'active' : ''}"
      type="button"
      data-trainer-id="${escapeAttr(trainer.id)}"
    >
      ${escapeHtml(trainer.title)}
    </button>
  `).join('');

  tabsEl.querySelectorAll('.trainer-tab').forEach(button => {
    button.addEventListener('click', () => buildSortTrainerRound(button.dataset.trainerId));
  });
}

function renderSortTrainerSummary() {
  const summaryEl = document.getElementById('sort-trainer-summary');
  const result = getSortTrainerResult();

  if (!sortTrainerState.checked) {
    summaryEl.innerHTML = `
      <div class="sort-summary">
        <span>Правильных фактов: <strong>${result.totalCorrect}</strong></span>
        <span>Групп: <strong>${sortTrainerState.groups.length}</strong></span>
        <span>Ловушки каждый раз выбираются заново</span>
      </div>
    `;
    return;
  }

  const pct = result.totalCorrect
    ? Math.round(result.correctSelected / result.totalCorrect * 100)
    : 0;
  summaryEl.innerHTML = `
    <div class="sort-summary sort-summary-checked">
      <span>Верно выбрано: <strong>${result.correctSelected}/${result.totalCorrect}</strong> (${pct}%)</span>
      <span>Лишних: <strong>${result.wrongSelected}</strong></span>
      <span>Пропущено: <strong>${result.missed}</strong></span>
      <span>Групп без ошибок: <strong>${result.cleanGroups}/${sortTrainerState.groups.length}</strong></span>
    </div>
  `;
}

function renderSortTrainerGroup(group) {
  const source = group.instances.filter(instance => instance.location === 'source');
  const bucket = group.instances.filter(instance => instance.location === 'bucket');
  const review = sortTrainerState.checked ? renderSortTrainerGroupReview(group) : '';

  return `
    <section class="sort-group" data-group-id="${escapeAttr(group.id)}">
      <div class="sort-group-head">
        <div>
          <h3>${escapeHtml(group.title)}</h3>
          <p>${escapeHtml(group.subtitle || '')}</p>
        </div>
        <span>${group.correctCount} верных</span>
      </div>

      <div class="sort-zone-label">Кандидаты</div>
      <div class="sort-card-zone sort-source-zone" data-zone="source" data-group-id="${escapeAttr(group.id)}">
        ${source.map(instance => renderSortTrainerCard(group, instance)).join('') || '<div class="sort-empty">Все карточки перенесены</div>'}
      </div>

      <div class="sort-zone-label">Перетащи сюда только верные факты</div>
      <div class="sort-card-zone sort-bucket-zone" data-zone="bucket" data-group-id="${escapeAttr(group.id)}">
        ${bucket.map(instance => renderSortTrainerCard(group, instance)).join('') || '<div class="sort-empty">Пока пусто</div>'}
      </div>

      ${review}
    </section>
  `;
}

function renderSortTrainerCard(group, instance) {
  const card = sortTrainerState.cardById[instance.cardId];
  const isCorrect = isSortTrainerCardCorrect(group.id, card);
  const classes = ['sort-card'];

  if (sortTrainerState.checked) {
    if (instance.location === 'bucket' && isCorrect) classes.push('correct');
    if (instance.location === 'bucket' && !isCorrect) classes.push('wrong');
    if (instance.location === 'source' && isCorrect) classes.push('missed');
  }

  return `
    <button
      class="${classes.join(' ')}"
      type="button"
      draggable="${sortTrainerState.checked ? 'false' : 'true'}"
      data-instance-id="${escapeAttr(instance.id)}"
    >
      ${escapeHtml(card.text)}
    </button>
  `;
}

function renderSortTrainerGroupReview(group) {
  const missed = [];
  const wrong = [];

  group.instances.forEach(instance => {
    const card = sortTrainerState.cardById[instance.cardId];
    const correct = isSortTrainerCardCorrect(group.id, card);
    if (instance.location === 'source' && correct) missed.push(card);
    if (instance.location === 'bucket' && !correct) wrong.push(card);
  });

  if (!missed.length && !wrong.length) {
    return '<div class="sort-review sort-review-good">Группа собрана без ошибок.</div>';
  }

  return `
    <div class="sort-review">
      ${missed.length ? `<div><strong>Пропущено:</strong>${missed.map(renderSortReviewCard).join('')}</div>` : ''}
      ${wrong.length ? `<div><strong>Лишнее:</strong>${wrong.map(renderSortReviewCard).join('')}</div>` : ''}
    </div>
  `;
}

function renderSortReviewCard(card) {
  return `
    <p>
      <span>${escapeHtml(card.text)}</span>
      <small>${escapeHtml(card.explanation || 'Пояснение не указано.')}</small>
    </p>
  `;
}

function attachSortTrainerEvents() {
  const root = document.getElementById('sort-trainer-container');
  if (!root || !sortTrainerState || sortTrainerState.checked) return;

  root.querySelectorAll('.sort-card').forEach(cardEl => {
    cardEl.addEventListener('click', () => toggleSortTrainerCard(cardEl.dataset.instanceId));
    cardEl.addEventListener('dragstart', event => {
      event.dataTransfer.setData('text/plain', cardEl.dataset.instanceId);
      event.dataTransfer.effectAllowed = 'move';
      cardEl.classList.add('dragging');
    });
    cardEl.addEventListener('dragend', () => {
      cardEl.classList.remove('dragging');
    });
  });

  root.querySelectorAll('.sort-card-zone').forEach(zoneEl => {
    zoneEl.addEventListener('dragover', event => {
      event.preventDefault();
      zoneEl.classList.add('drag-over');
    });
    zoneEl.addEventListener('dragleave', () => {
      zoneEl.classList.remove('drag-over');
    });
    zoneEl.addEventListener('drop', event => {
      event.preventDefault();
      zoneEl.classList.remove('drag-over');
      moveSortTrainerCard(
        event.dataTransfer.getData('text/plain'),
        zoneEl.dataset.groupId,
        zoneEl.dataset.zone
      );
    });
  });
}

function toggleSortTrainerCard(instanceId) {
  const found = findSortTrainerInstance(instanceId);
  if (!found || sortTrainerState.checked) return;
  found.instance.location = found.instance.location === 'bucket' ? 'source' : 'bucket';
  renderSortTrainer();
}

function moveSortTrainerCard(instanceId, targetGroupId, targetZone) {
  const found = findSortTrainerInstance(instanceId);
  if (!found || sortTrainerState.checked) return;

  if (found.group.id !== targetGroupId) {
    showToast('Карточка относится к другому блоку кандидатов');
    return;
  }

  found.instance.location = targetZone === 'bucket' ? 'bucket' : 'source';
  renderSortTrainer();
}

function findSortTrainerInstance(instanceId) {
  if (!sortTrainerState) return null;

  for (const group of sortTrainerState.groups) {
    const instance = group.instances.find(item => item.id === instanceId);
    if (instance) return { group, instance };
  }

  return null;
}

function isSortTrainerCardCorrect(groupId, card) {
  return Array.isArray(card?.correctGroups) && card.correctGroups.includes(groupId);
}

function getSortTrainerResult() {
  const result = {
    totalCorrect: 0,
    correctSelected: 0,
    wrongSelected: 0,
    missed: 0,
    cleanGroups: 0
  };

  if (!sortTrainerState) return result;

  sortTrainerState.groups.forEach(group => {
    let groupWrong = 0;
    let groupMissed = 0;

    group.instances.forEach(instance => {
      const card = sortTrainerState.cardById[instance.cardId];
      const correct = isSortTrainerCardCorrect(group.id, card);

      if (correct) result.totalCorrect++;
      if (instance.location === 'bucket' && correct) result.correctSelected++;
      if (instance.location === 'bucket' && !correct) {
        result.wrongSelected++;
        groupWrong++;
      }
      if (instance.location === 'source' && correct) {
        result.missed++;
        groupMissed++;
      }
    });

    if (!groupWrong && !groupMissed) result.cleanGroups++;
  });

  return result;
}

function sampleItems(items, count) {
  return shuffle([...items]).slice(0, Math.max(0, count));
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

// ══════════════════════════════════════════════════════════════
//  PROGRESS BAR
// ══════════════════════════════════════════════════════════════
function buildProgressBar() {
  const bar = document.getElementById('progress-bar');
  bar.innerHTML = '';
  shuffled.forEach((_, i) => {
    const seg = document.createElement('div');
    seg.className = 'progress-seg';
    seg.id = `seg-${i}`;
    bar.appendChild(seg);
  });
  updateProgressBar();
}

function updateProgressBar() {
  shuffled.forEach((_, i) => {
    const seg = document.getElementById(`seg-${i}`);
    seg.className = 'progress-seg';
    if (i < results.length) {
      seg.classList.add(results[i] ? 'seg-correct' : 'seg-wrong');
    } else if (i === current) {
      seg.classList.add('seg-current');
    }
  });

  const correct = results.filter(Boolean).length;
  const accuracy = results.length ? Math.round(correct / results.length * 100) : 0;
  document.getElementById('progress-label').textContent =
    `${results.length} / ${shuffled.length} (${accuracy}% верно)`;
}

// ══════════════════════════════════════════════════════════════
//  RENDER QUESTION
// ══════════════════════════════════════════════════════════════
function renderQuestion() {
  answered = false;
  const q = shuffled[current];
  const container = document.getElementById('question-container');

  // topic badge
  document.getElementById('topic-badge').textContent = q.topic;
  document.getElementById('q-counter').textContent =
    `Вопрос ${current + 1} из ${shuffled.length}`;

  // hide next button
  const nextButton = document.getElementById('btn-next');
  nextButton.style.display = 'none';
  nextButton.textContent = 'Следующий →';

  container.innerHTML = '';
  container.className = `question-wrap type-${q.type}`;

  switch(q.type) {
    case 'single_choice': renderSingleChoice(q, container); break;
    case 'multi_choice':  renderMultiChoice(q, container);  break;
    case 'matching':      renderMatching(q, container);     break;
    case 'ordering':      renderOrdering(q, container);     break;
    case 'fill_blank':    renderFillBlank(q, container);    break;
    case 'numeric':       renderNumeric(q, container);      break;
    case 'find_error':    renderFindError(q, container);    break;
    case 'scenario':      renderScenario(q, container);     break;
    default:
      container.innerHTML = `<p style="color:#ff4d4d">Неизвестный тип: ${q.type}</p>`;
  }

  updateProgressBar();
}

// ══════════════════════════════════════════════════════════════
//  RECORD ANSWER (called by every renderer)
// ══════════════════════════════════════════════════════════════
function recordAnswer(isCorrect) {
  if (answered) return;
  answered = true;

  results.push(isCorrect);
  updateProgressBar();
  saveActiveSession(current + 1);

  // flash feedback
  const seg = document.getElementById(`seg-${current}`);
  seg.classList.add('seg-flash');

  document.getElementById('btn-next').style.display = 'inline-flex';

  if (current + 1 >= shuffled.length) {
    document.getElementById('btn-next').textContent =
      isExamMode(currentMode) ? 'Перейти к задаче →' : 'Завершить →';
  }
}

// ══════════════════════════════════════════════════════════════
//  NEXT
// ══════════════════════════════════════════════════════════════
function nextQuestion() {
  current++;
  if (current >= shuffled.length) {
    if (isExamMode(currentMode)) beginExamTask();
    else showResults();
  } else {
    saveActiveSession();
    renderQuestion();
  }
}

// ══════════════════════════════════════════════════════════════
//  RESULTS
// ══════════════════════════════════════════════════════════════
function showResults() {
  const elapsed   = Math.round((Date.now() - startTime) / 1000);
  const correct   = results.filter(Boolean).length;
  const total     = shuffled.length;
  const score     = calcScore(correct, total);
  const timeStr   = formatTime(elapsed);

  // Build topic breakdown
  const topicMap = {};
  shuffled.forEach((q, i) => {
    if (!topicMap[q.topic]) topicMap[q.topic] = { ok: 0, total: 0 };
    topicMap[q.topic].total++;
    if (results[i]) topicMap[q.topic].ok++;
  });

  // Save session
  saveSession({
    correct,
    total,
    score,
    elapsed,
    topicMap,
    date: Date.now(),
    modeId: currentMode,
    modeName: TEST_MODES[currentMode]?.title || 'Тест',
    completed: true
  });
  clearActiveSession();

  // Populate result screen
  document.getElementById('res-score').textContent       = score;
  document.getElementById('res-score').className         = `score-display score-${scoreClass(score)}`;
  document.getElementById('res-comment').textContent     = scoreComment(score);
  document.getElementById('res-correct').textContent     = `${correct} / ${total}`;
  document.getElementById('res-time').textContent        = timeStr;
  document.getElementById('res-percent').textContent     = `${Math.round(correct/total*100)}%`;
  const taskReviewEl = document.getElementById('res-task-review');
  if (taskReviewEl) taskReviewEl.innerHTML = '';

  // Topic breakdown
  const topicEl = document.getElementById('res-topics');
  topicEl.innerHTML = Object.entries(topicMap).map(([topic, data]) => {
    const pct = Math.round(data.ok / data.total * 100);
    const cls = pct >= 80 ? 'topic-good' : pct >= 50 ? 'topic-mid' : 'topic-bad';
    return `<div class="topic-row ${cls}">
      <span class="topic-name">${topic}</span>
      <span class="topic-stat">${data.ok}/${data.total} (${pct}%)</span>
      <div class="topic-bar"><div class="topic-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');

  // Render result progress bar
  const resSeg = document.getElementById('result-progress');
  resSeg.innerHTML = results.map(r =>
    `<div class="progress-seg ${r ? 'seg-correct' : 'seg-wrong'}"></div>`
  ).join('');

  renderHistoryTable();
  showScreen('result-screen');
}

function exitToMenu() {
  if (isExamMode(currentMode)) {
    exitExamToMenu();
    return;
  }

  if (results.length > 0) {
    const ok = confirm('Сохранить текущий результат и выйти в меню?');
    if (!ok) return;
    saveInterruptedSession();
  }

  clearActiveSession();
  shuffled = [];
  current = 0;
  results = [];
  answered = false;
  renderHistoryTable();
  showScreen('start-screen');
}

function saveInterruptedSession() {
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const correct = results.filter(Boolean).length;
  const total = results.length;
  const topicMap = {};

  shuffled.slice(0, results.length).forEach((q, i) => {
    if (!topicMap[q.topic]) topicMap[q.topic] = { ok: 0, total: 0 };
    topicMap[q.topic].total++;
    if (results[i]) topicMap[q.topic].ok++;
  });

  saveSession({
    correct,
    total,
    score: total ? calcScore(correct, total) : 0,
    elapsed,
    topicMap,
    date: Date.now(),
    modeId: currentMode,
    modeName: TEST_MODES[currentMode]?.title || 'Тест',
    completed: false
  });
}

function calcScore(correct, total) {
  const pct = correct / total;
  if (pct >= 0.91) return 5;
  if (pct >= 0.75) return 4;
  if (pct >= 0.55) return 3;
  if (pct >= 0.35) return 2;
  if (pct >= 0.15) return 1;
  return 0;
}

function scoreClass(s) {
  if (s >= 4) return 'excellent';
  if (s === 3) return 'good';
  if (s === 2) return 'ok';
  return 'bad';
}

function scoreComment(s) {
  const comments = {
    5: '🏆 Отлично! Материал усвоен на высшем уровне. Ты готов к экзамену.',
    4: '👍 Хорошо! Небольшие пробелы есть, но в целом знания крепкие.',
    3: '📚 Удовлетворительно. Повтори слабые темы и пройди ещё раз.',
    2: '⚠️ Слабовато. Не расстраивайся — прочитай теорию и попробуй снова.',
    1: '❌ Нужно серьёзно поработать над материалом. Начни с основ.',
    0: '💀 Начни с нуля. Прочитай весь теоретический материал.'
  };
  return comments[s] || '';
}

function renderAnswerExplanation(qId, isCorrect, explanation) {
  if (isCorrect || !explanation) return;
  const el = document.getElementById(`explanation-${qId}`);
  if (!el) return;
  el.className = 'answer-explanation show';
  el.innerHTML = `
    <div class="answer-explanation-label">Пояснение</div>
    <div>${explanation}</div>
  `;
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ══════════════════════════════════════════════════════════════
//  LOCAL STORAGE — SESSIONS
// ══════════════════════════════════════════════════════════════
function saveSession(session) {
  const sessions = getSessions();
  sessions.push(session);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function getSessions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function renderHistoryTable() {
  const sessions = getSessions();
  const tables = document.querySelectorAll('#history-table');
  if (!tables.length) return;

  if (!sessions.length) {
    tables.forEach(el => {
      el.innerHTML = '<p class="no-history">Сессий пока нет — пройди тест!</p>';
    });
    return;
  }

  const rows = [...sessions].reverse().slice(0, 10).map((s, i) => {
    const date = new Date(s.date).toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
    const completed = s.completed !== false;
    const scoreText = completed ? s.score : '—';
    const scoreClassName = completed ? scoreClass(s.score) : 'interrupted';
    return `<tr>
      <td>${sessions.length - i}</td>
      <td>${date}</td>
      <td>${s.modeName || 'Тест'}</td>
      <td><span class="score-pill score-${scoreClassName}">${scoreText}</span></td>
      <td>${s.correct}/${s.total}</td>
      <td>${completed ? 'Завершён' : 'Прерван'}</td>
      <td>${formatTime(s.elapsed)}</td>
    </tr>`;
  }).join('');

  const html = `
    <table class="history-tbl">
      <thead><tr><th>#</th><th>Дата</th><th>Режим</th><th>Оценка</th><th>Верно</th><th>Статус</th><th>Время</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
  tables.forEach(el => { el.innerHTML = html; });
}

function clearHistory() {
  if (!confirm('Удалить всю историю сессий?')) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(EXAM_ROTATION_STORAGE_KEY);
  renderHistoryTable();
}

function saveActiveSession(nextCurrent = current) {
  if (!shuffled.length) return;

  const questionState = {};
  shuffled.forEach(q => {
    questionState[q.id] = {
      optionOrder: q.optionOrder,
      rightOrder: q.rightOrder,
      itemOrder: q.itemOrder
    };
  });

  const session = {
    version: 2,
    sourceQuestionCount: questions.length,
    modeId: currentMode,
    questionIds: shuffled.map(q => q.id),
    questionState,
    current: Math.min(nextCurrent, shuffled.length),
    results,
    startTime,
    showHints,
    examSession: isExamMode(currentMode) ? examSession : null,
    savedAt: Date.now()
  };

  try {
    localStorage.setItem(ACTIVE_STORAGE_KEY, JSON.stringify(session));
  } catch {
    showToast('Не удалось сохранить текущую сессию');
  }
}

function restoreActiveSession() {
  const session = getActiveSession();
  if (!isActiveSessionValid(session)) {
    clearActiveSession();
    return false;
  }

  const questionById = new Map(questions.map(q => [q.id, q]));
  shuffled = session.questionIds.map(id =>
    prepareQuestionForSession(questionById.get(id), session.questionState?.[id])
  );
  results = Array.isArray(session.results) ? session.results.map(Boolean) : [];
  current = Math.min(Math.max(Number(session.current) || results.length, 0), shuffled.length);
  startTime = Number(session.startTime) || Date.now();
  showHints = Boolean(session.showHints);
  currentMode = TEST_MODES[session.modeId] ? session.modeId : 'full';
  examSession = (currentMode === 'exam' || currentMode === 'exam_v2') && session.examSession
    ? session.examSession
    : null;
  answered = false;

  const hintsToggle = document.getElementById('show-hints');
  if (hintsToggle) hintsToggle.checked = showHints;
  selectMode(currentMode);

  if (current >= shuffled.length) {
    clearActiveSession();
    return false;
  }

  buildProgressBar();
  showScreen('quiz-screen');
  renderQuestion();
  showToast('Сессия восстановлена');
  return true;
}

function getActiveSession() {
  try { return JSON.parse(localStorage.getItem(ACTIVE_STORAGE_KEY)); }
  catch { return null; }
}

function isActiveSessionValid(session) {
  if (!session || session.version !== 2) return false;
  if (session.sourceQuestionCount !== questions.length) return false;
  if (!TEST_MODES[session.modeId]) return false;
  if (!Array.isArray(session.questionIds) || session.questionIds.length < 1) return false;
  if (!Array.isArray(session.results) || session.results.length > session.questionIds.length) return false;

  const questionIds = new Set(questions.map(q => q.id));
  const sessionIds = new Set(session.questionIds);
  if (sessionIds.size !== session.questionIds.length) return false;

  const modeIds = new Set(getModeQuestions(session.modeId).map(q => q.id));
  return session.questionIds.every(id => questionIds.has(id) && modeIds.has(id));
}

function isExamMode(modeId) {
  return modeId === 'exam' || modeId === 'exam_v2';
}

function clearActiveSession() {
  localStorage.removeItem(ACTIVE_STORAGE_KEY);
}

// ══════════════════════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════════════════════
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('toast-show');
  setTimeout(() => t.classList.remove('toast-show'), 2200);
}

// ══════════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', init);
