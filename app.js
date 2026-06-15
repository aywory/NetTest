// ══════════════════════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════════════════════
let questions = [];
let shuffled  = [];
let current   = 0;
let results   = [];   // true/false per question
let startTime = null;
let answered  = false;
let showHints = false;
let currentMode = 'full';
const STORAGE_KEY = 'net_quiz_sessions';
const ACTIVE_STORAGE_KEY = 'net_quiz_active_session';

const TEST_MODES = {
  full: {
    title: 'Полный банк',
    description: 'Все вопросы: лабораторные и термины',
    filter: () => true
  },
  labs: {
    title: 'Лабы 1-8',
    description: 'Практика по пройденным лабораторным',
    filter: q => q.topic !== 'Термины и определения'
  },
  terms: {
    title: 'Термины',
    description: 'Определения, уровни, протоколы, устройства',
    filter: q => q.topic === 'Термины и определения'
  }
};

// ══════════════════════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════════════════════
async function init() {
  try {
    const res = await fetch('questions.json');
    questions = await res.json();
    updateModeStats();
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
    if (el) el.textContent = getModeQuestions(modeId).length;
  });

  const totalEl = document.getElementById('q-total');
  if (totalEl) totalEl.textContent = getModeQuestions(currentMode).length;
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
    document.getElementById('btn-next').textContent = 'Завершить →';
  }
}

// ══════════════════════════════════════════════════════════════
//  NEXT
// ══════════════════════════════════════════════════════════════
function nextQuestion() {
  current++;
  if (current >= shuffled.length) {
    showResults();
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
