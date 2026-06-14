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

// ══════════════════════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════════════════════
async function init() {
  try {
    const res = await fetch('questions.json');
    questions = await res.json();
    const totalEl = document.getElementById('q-total');
    if (totalEl) totalEl.textContent = questions.length;
    showScreen('start-screen');
    renderHistoryTable();
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
function startQuiz() {
  shuffled  = shuffle([...questions]);
  current   = 0;
  results   = [];
  startTime = Date.now();
  answered  = false;
  showHints = Boolean(document.getElementById('show-hints')?.checked);

  buildProgressBar();
  showScreen('quiz-screen');
  renderQuestion();
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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

  const pct = Math.round((results.length / shuffled.length) * 100);
  document.getElementById('progress-label').textContent =
    `${results.length} / ${shuffled.length}`;
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
  document.getElementById('btn-next').style.display = 'none';

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
  saveSession({ correct, total, score, elapsed, topicMap, date: Date.now() });

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
const STORAGE_KEY = 'net_quiz_sessions';

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
  const el = document.getElementById('history-table');
  if (!sessions.length) {
    el.innerHTML = '<p class="no-history">Сессий пока нет — пройди тест!</p>';
    return;
  }

  const rows = [...sessions].reverse().slice(0, 10).map((s, i) => {
    const date = new Date(s.date).toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
    return `<tr>
      <td>${sessions.length - i}</td>
      <td>${date}</td>
      <td><span class="score-pill score-${scoreClass(s.score)}">${s.score}</span></td>
      <td>${s.correct}/${s.total}</td>
      <td>${formatTime(s.elapsed)}</td>
    </tr>`;
  }).join('');

  el.innerHTML = `
    <table class="history-tbl">
      <thead><tr><th>#</th><th>Дата</th><th>Оценка</th><th>Верно</th><th>Время</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function clearHistory() {
  if (!confirm('Удалить всю историю сессий?')) return;
  localStorage.removeItem(STORAGE_KEY);
  renderHistoryTable();
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
