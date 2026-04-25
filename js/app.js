// ═══════════════════════════════════════════════════════════════
//  APP.JS — Exam Simulator Logic (Written Answer + Concept Based Final)
//  Ecología y Desarrollo Sostenible · USAT
// ═══════════════════════════════════════════════════════════════

const STATE = {
  currentExam: null,
  currentQ: 0,
  userAnswers: [],
  timerInterval: null,
  secondsLeft: 35 * 60,
  history: JSON.parse(localStorage.getItem('examHistory') || '{}')
};

const STOPWORDS = new Set([
  'a', 'ante', 'bajo', 'con', 'contra', 'de', 'desde', 'en', 'entre', 'hacia', 'hasta', 'para', 'por', 'segun', 'sin', 'so', 'sobre', 'tras',
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'e', 'o', 'u', 'que', 'es', 'son', 'ser', 'esta', 'este', 'estos', 'estas', 'lo', 
  'del', 'al', 'se', 'me', 'te', 'nos', 'sus', 'mi', 'tu', 'su', 'como', 'cuando', 'donde', 'quien', 'porque', 'para', 'que', 'cual'
]);

const NUMBER_MAP = {
  '0': ['cero', 'zero', 'null'],
  '1': ['uno', 'un', 'una', 'one', 'eins'],
  '2': ['dos', 'two', 'zwei'],
  '3': ['tres', 'three', 'drei'],
  '4': ['cuatro', 'four', 'vier'],
  '5': ['cinco', 'five', 'fünf', 'funf'],
  '6': ['seis', 'six', 'sechs'],
  '7': ['siete', 'seven', 'sieben'],
  '8': ['ocho', 'eight', 'acht'],
  '9': ['nueve', 'nine', 'neun'],
  '10': ['diez', 'ten', 'zehn'],
  '11': ['once', 'eleven', 'elf'],
  '12': ['doce', 'twelve', 'zwölf', 'zwolf'],
  '13': ['trece', 'thirteen', 'dreizehn'],
  '14': ['catorce', 'fourteen', 'vierzehn'],
  '15': ['quince', 'fifteen', 'fünfzehn', 'funfzehn'],
  '16': ['dieciseis', 'sixteen', 'sechzehn'],
  '17': ['diecisiete', 'seventeen', 'siebzehn'],
  '18': ['dieciocho', 'eighteen', 'achtzehn'],
  '19': ['diecinueve', 'nineteen', 'neunzehn'],
  '20': ['veinte', 'twenty', 'zwanzig']
};

const NOISE_WORDS = new Set([
  'dimension', 'dimensiones', 'punto', 'puntos', 'etapa', 'etapas', 'fase', 'fases', 'categoria', 'categorias',
  'nivel', 'niveles', 'tipo', 'tipos', 'año', 'años', 'ano', 'anos'
]);

const SEMANTIC_MAP = {
  'ambiente': ['entorno', 'medioambiente', 'naturaleza', 'ecosistema', 'environment'],
  'sostenible': ['sustentable', 'perdurable', 'sustainable'],
  'integral': ['completo', 'total', 'holistico', 'holistic'],
  'biotica': ['viva', 'viviente', 'biotico', 'biotic'],
  'abiotica': ['no viva', 'inerte', 'fisico', 'abiotico', 'abiotic'],
  'social': ['comunitario', 'sociedad'],
  'economico': ['financiero', 'monetario'],
  'pilar': ['base', 'fundamento', 'eje']
};

const $ = id => document.getElementById(id);
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(`screen-${name}`).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function saveHistory() {
  localStorage.setItem('examHistory', JSON.stringify(STATE.history));
}

function normalize(str) {
  if (!str) return '';
  return str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").replace(/\s+/g, " ");
}

function getKeywords(str) {
  const words = normalize(str).split(/\s+/);
  return words.filter(w => (w.length > 2 || /\d/.test(w)) && !STOPWORDS.has(w));
}

function getLevenshteinDistance(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[a.length][b.length];
}

function getFuzzySimilarity(a, b) {
  if (a === b) return 1.0;
  if (!a || !b) return 0;
  const distance = getLevenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  return (maxLength - distance) / maxLength;
}

function checkSimilarity(typed, expected) {
  if (!typed) return 0;
  const cleanTyped = normalize(typed);
  const cleanExpected = normalize(expected);
  
  if (cleanTyped === cleanExpected) return 1.0;

  // Function to extract numbers (including words)
  const extractNumbers = (str) => {
    const words = normalize(str).split(/\s+/);
    const nums = [];
    words.forEach(w => {
      if (/^\d+$/.test(w)) nums.push(w);
      else {
        for (const [val, aliases] of Object.entries(NUMBER_MAP)) {
          if (aliases.includes(w)) { nums.push(val); break; }
        }
      }
    });
    return nums;
  };

  const typedNums = extractNumbers(typed);
  const expectedNums = extractNumbers(expected);

  // If there's a numeric mismatch, it's likely wrong
  if (expectedNums.length > 0 && typedNums.length > 0) {
    const allMatch = expectedNums.every(n => typedNums.includes(n));
    if (allMatch && typedNums.length === expectedNums.length) {
      // If the answer is just the number, and it matches, it's correct
      if (normalize(typed).length < 5) return 1.0;
    }
  }

  const userWords = cleanTyped.split(/\s+/);
  const targetKeywords = getKeywords(expected);
  
  if (targetKeywords.length === 0) return getFuzzySimilarity(cleanTyped, cleanExpected);

  let matchCount = 0;
  let importantMatchCount = 0;
  
  targetKeywords.forEach(targetW => {
    const isNoise = NOISE_WORDS.has(targetW);
    
    // Determine numeric root if applicable
    let numericRoot = null;
    for (const [val, aliases] of Object.entries(NUMBER_MAP)) {
      if (targetW === val || aliases.includes(targetW)) { numericRoot = val; break; }
    }

    const hasMatch = userWords.some(userW => {
      // 1. Direct or Fuzzy Match
      if (userW === targetW || getFuzzySimilarity(userW, targetW) > 0.85) return true;
      
      // 2. Numeric Equivalence
      if (numericRoot) {
        if (userW === numericRoot || (NUMBER_MAP[numericRoot] && NUMBER_MAP[numericRoot].includes(userW))) return true;
      }

      // 3. Synonym Match
      for (const [key, aliases] of Object.entries(SEMANTIC_MAP)) {
        if ((targetW === key || aliases.includes(targetW)) && (userW === key || aliases.includes(userW))) return true;
      }

      return false;
    });

    if (hasMatch) {
      matchCount++;
      if (!isNoise) importantMatchCount++;
    }
  });

  const importantKeywords = targetKeywords.filter(w => !NOISE_WORDS.has(w));
  const importantScore = importantKeywords.length > 0 ? importantMatchCount / importantKeywords.length : 1.0;
  const keywordScore = matchCount / targetKeywords.length;
  
  // If all important words match, it's correct
  if (importantScore >= 0.99) return 1.0;
  
  const characterScore = getFuzzySimilarity(cleanTyped, cleanExpected);
  
  // Weighted blend
  const finalScore = (importantScore * 0.7) + (keywordScore * 0.2) + (characterScore * 0.1);
  return Math.min(1.0, finalScore);
}

function renderHome() {
  const grid = $('exams-grid');
  grid.innerHTML = '';
  const completed = Object.keys(STATE.history).length;
  $('stat-completed').textContent = completed;
  const scores = Object.values(STATE.history).map(h => h.score);
  $('stat-best').textContent = scores.length ? Math.max(...scores) : '—';
  EXAMS.forEach((exam, i) => {
    const hist = STATE.history[exam.id];
    const card = document.createElement('div');
    card.className = 'exam-card' + (hist ? ' completed' : '');
    card.innerHTML = `<div class="card-num">Examen ${String(exam.id).padStart(2, '0')}</div><div class="card-title">${exam.title}</div><div class="card-meta"><span>${hist ? `<span class="card-score">Nota: ${hist.score}/20</span>` : '20 preguntas'}</span><span class="card-arrow">→</span></div>`;
    card.addEventListener('click', () => startExam(i));
    grid.appendChild(card);
  });
}

function startExam(index) {
  STATE.currentExam = index;
  STATE.currentQ = 0;
  STATE.userAnswers = new Array(EXAMS[index].questions.length).fill('');
  STATE.secondsLeft = 35 * 60;
  $('exam-tag').textContent = `Examen ${String(EXAMS[index].id).padStart(2, '0')}`;
  showScreen('exam');
  renderQuestion(0);
  startTimer();
}

function renderQuestion(qIndex) {
  const exam = EXAMS[STATE.currentExam];
  const q = exam.questions[qIndex];
  const total = exam.questions.length;
  $('progress-bar').style.width = ((qIndex) / total) * 100 + '%';
  $('q-counter').textContent = `Pregunta ${qIndex + 1} de ${total}`;
  $('question-text').textContent = q.question || q.q;
  const input = $('user-input');
  input.value = STATE.userAnswers[qIndex] || '';
  const newInput = input.cloneNode(true);
  input.parentNode.replaceChild(newInput, input);
  newInput.focus();
  newInput.addEventListener('input', (e) => saveTypedAnswer(qIndex, e.target.value));
  newInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { const nextIdx = qIndex + 1; if (nextIdx < total) { STATE.currentQ = nextIdx; renderQuestion(nextIdx); } } });
  $('btn-prev').disabled = qIndex === 0;
  $('btn-prev').style.opacity = qIndex === 0 ? '0.4' : '1';
  $('btn-next').textContent = qIndex === total - 1 ? 'Última pregunta' : 'Siguiente →';
  const dotsRow = $('dots-row');
  dotsRow.innerHTML = '';
  exam.questions.forEach((_, di) => {
    const dot = document.createElement('span');
    const isAnswered = STATE.userAnswers[di] && STATE.userAnswers[di].trim() !== '';
    dot.className = 'dot' + (isAnswered ? ' answered' : '') + (di === qIndex ? ' current' : '');
    dot.addEventListener('click', () => { STATE.currentQ = di; renderQuestion(di); });
    dotsRow.appendChild(dot);
  });
  updateSubmitStatus();
}

function saveTypedAnswer(qIndex, text) {
  STATE.userAnswers[qIndex] = text;
  const dots = $('dots-row').querySelectorAll('.dot');
  if (dots[qIndex]) dots[qIndex].classList.toggle('answered', text.trim() !== '');
  updateSubmitStatus();
}

function updateSubmitStatus() {
  const answeredCount = STATE.userAnswers.filter(a => a && a.trim() !== '').length;
  $('btn-submit').style.opacity = answeredCount === 20 ? '1' : '0.5';
}

$('btn-prev').addEventListener('click', () => { if (STATE.currentQ > 0) { STATE.currentQ--; renderQuestion(STATE.currentQ); } });
$('btn-next').addEventListener('click', () => { if (STATE.currentQ < EXAMS[STATE.currentExam].questions.length - 1) { STATE.currentQ++; renderQuestion(STATE.currentQ); } });

$('btn-exit-exam').addEventListener('click', () => { $('modal-exit').style.display = 'flex'; });
$('modal-cancel').addEventListener('click', () => { $('modal-exit').style.display = 'none'; });
$('modal-confirm').addEventListener('click', () => { $('modal-exit').style.display = 'none'; stopTimer(); showScreen('home'); renderHome(); });

$('btn-submit').addEventListener('click', () => {
  const unanswered = STATE.userAnswers.filter(a => !a || a.trim() === '').length;
  if (unanswered > 0 && !confirm(`Tienes ${unanswered} pregunta(s) sin responder. ¿Quieres terminar de todas formas?`)) return;
  finishExam();
});

function startTimer() {
  stopTimer();
  updateTimerDisplay();
  STATE.timerInterval = setInterval(() => {
    STATE.secondsLeft--;
    updateTimerDisplay();
    if (STATE.secondsLeft <= 0) { stopTimer(); alert('⏰ ¡Tiempo agotado!'); finishExam(); }
  }, 1000);
}

function stopTimer() { if (STATE.timerInterval) { clearInterval(STATE.timerInterval); STATE.timerInterval = null; } }

function updateTimerDisplay() {
  const m = Math.floor(STATE.secondsLeft / 60), s = STATE.secondsLeft % 60;
  $('timer-display').textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  $('timer-wrap').classList.toggle('urgent', STATE.secondsLeft <= 300);
}

function finishExam() {
  stopTimer();
  const exam = EXAMS[STATE.currentExam];
  let correctCount = 0;
  exam.questions.forEach((q, i) => { if (checkSimilarity(STATE.userAnswers[i], q.opts[q.a]) >= 0.5) correctCount++; });
  STATE.history[exam.id] = { score: correctCount, correct: correctCount, wrong: exam.questions.length - correctCount, date: new Date().toISOString() };
  saveHistory();
  showResultsScreen(exam, correctCount, correctCount, exam.questions.length - correctCount);
}

function getScoreLabel(score) { return score >= 18 ? '🏆 ¡Excelente!' : score >= 14 ? '🎉 ¡Muy bien!' : score >= 11 ? '👍 Aprobado' : '📚 Sigue practicando'; }
function getScoreColor(score) { return score >= 14 ? '#00e5bc' : score >= 11 ? '#ffd166' : '#ff5a5a'; }

function showResultsScreen(exam, score, correct, wrong) {
  showScreen('results');
  $('result-score').textContent = score;
  $('result-title').textContent = getScoreLabel(score);
  $('result-exam-name').textContent = exam.title;
  $('result-correct').textContent = `✓ ${correct} Correctas`;
  $('result-wrong').textContent = `✗ ${wrong} Incorrectas`;
  const ring = $('ring-fill');
  ring.style.stroke = getScoreColor(score);
  ring.style.strokeDashoffset = 515 * (1 - score / 20);
  $('review-section').style.display = 'none';
}

$('btn-review').addEventListener('click', () => {
  const section = $('review-section');
  if (section.style.display === 'none') { renderReview(); section.style.display = 'block'; $('btn-review').textContent = '📋 Ocultar Revisión'; }
  else { section.style.display = 'none'; $('btn-review').textContent = '📋 Revisar Respuestas'; }
});

$('btn-retry').addEventListener('click', () => startExam(STATE.currentExam));
$('btn-home').addEventListener('click', () => { showScreen('home'); renderHome(); });

function renderReview() {
  const exam = EXAMS[STATE.currentExam], list = $('review-list');
  list.innerHTML = '';
  exam.questions.forEach((q, i) => {
    const correctText = q.opts[q.a], typed = STATE.userAnswers[i], similarity = checkSimilarity(typed, correctText), isCorrect = similarity >= 0.5;
    const studyBtn = q.ref ? `
      <button class="btn-learn" onclick="showStudyModal('${q.ref}')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a4 4 0 0 0-4-4H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a4 4 0 0 1 4-4h6z"/></svg>
        Ver Fundamento / Aprender
      </button>` : '';

    const item = document.createElement('div');
    item.className = `review-item ${isCorrect ? 'rv-correct' : 'rv-wrong'}`;
    item.innerHTML = `
      <div class="rv-header"><span class="rv-num">${i + 1}.</span><span class="rv-q">${q.question || q.q}</span></div>
      <div class="rv-answers">
        <div class="rv-ans"><span class="lbl">Tu respuesta:</span><span class="${isCorrect ? 'val-correct' : 'val-wrong'}">${typed || '(Sin respuesta)'}</span></div>
        ${!isCorrect ? `<div class="rv-ans"><span class="lbl">Respuesta aceptable:</span><span class="val-correct">✓ ${correctText}</span></div>` : ''}
        <div class="rv-ans"><span class="lbl">Afinidad Conceptual:</span><span class="val-muted" style="color:var(--text-muted); font-size: 0.7rem;">${Math.round(similarity * 100)}%</span></div>
        ${studyBtn}
      </div>`;
    list.appendChild(item);
  });
}

// ════════ STUDY MODAL ════════
function showStudyModal(refKey) {
  const data = STUDY_CONTENT[refKey];
  if (!data) return;
  $('study-title').textContent = data.title;
  $('study-source').textContent = data.source;
  $('study-content').textContent = data.content;
  $('modal-study').style.display = 'flex';
}
function closeStudyModal() { $('modal-study').style.display = 'none'; }


renderHome();
showScreen('home');

// Study Modal listeners
document.addEventListener('DOMContentLoaded', () => {
  $('study-close').onclick = closeStudyModal;
  $('study-btn-ok').onclick = closeStudyModal;
  $('modal-study').onclick = (e) => { if (e.target === $('modal-study')) closeStudyModal(); };
});
