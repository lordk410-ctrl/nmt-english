const QUESTIONS = [
  {id:"g01",topic:"Грамматика",level:1,q:"If I ___ more time, I would join the course.",o:["have","had","will have","would have"],a:1,e:"Во втором типе условных предложений после if используется Past Simple; в главной части обычно would + infinitive."},
  {id:"g02",topic:"Грамматика",level:1,q:"She ___ in Kyiv since 2021.",o:["lives","lived","has lived","is living"],a:2,e:"Since указывает на момент начала, а действие продолжается до настоящего. Нужен Present Perfect."},
  {id:"g03",topic:"Грамматика",level:1,q:"The documents ___ yesterday.",o:["sent","were sent","have sent","are sending"],a:1,e:"Это Passive Voice в Past Simple: was/were + past participle."},
  {id:"g04",topic:"Грамматика",level:2,q:"By the time we arrived, the film ___.",o:["starts","has started","had started","was starting"],a:2,e:"Более раннее из двух прошлых действий выражается Past Perfect."},
  {id:"g05",topic:"Грамматика",level:1,q:"There are ___ students in the library today.",o:["much","a little","many","any"],a:2,e:"Students является исчисляемым существительным во множественном числе, поэтому используется many."},
  {id:"g06",topic:"Грамматика",level:1,q:"You ___ submit the form by Friday. It is compulsory.",o:["might","must","could","would"],a:1,e:"Must выражает обязательство или необходимость."},
  {id:"g07",topic:"Грамматика",level:2,q:"I wish I ___ speak French fluently.",o:["can","could","will","am able"],a:1,e:"После I wish для нереального желания о настоящем используется форма Past Simple. Для can это could."},
  {id:"g08",topic:"Грамматика",level:2,q:"Neither of the answers ___ correct.",o:["are","were","is","be"],a:2,e:"Neither of обычно согласуется с глаголом в единственном числе в формальном английском."},
  {id:"g09",topic:"Грамматика",level:1,q:"She suggested ___ the museum on Sunday.",o:["visit","to visit","visiting","visited"],a:2,e:"После suggest используется герундий, то есть форма глагола с -ing."},
  {id:"g10",topic:"Грамматика",level:1,q:"This is the ___ route to the station.",o:["short","shorter","shortest","most short"],a:2,e:"Сравниваются все возможные маршруты, поэтому нужна превосходная степень: the shortest."},
  {id:"v01",topic:"Лексика",level:1,q:"Choose the closest meaning of 'rapid'.",o:["quiet","quick","careful","weak"],a:1,e:"Rapid означает «быстрый»; ближайший синоним из вариантов это quick."},
  {id:"v02",topic:"Лексика",level:1,q:"The opposite of 'generous' is ___.",o:["selfish","polite","honest","patient"],a:0,e:"Generous означает «щедрый», а selfish означает «эгоистичный»."},
  {id:"v03",topic:"Лексика",level:1,q:"Please ___ attention to the instructions.",o:["make","do","pay","take"],a:2,e:"Устойчивое словосочетание: pay attention."},
  {id:"v04",topic:"Лексика",level:2,q:"The meeting was ___ because the manager was ill.",o:["put off","look after","give up","find out"],a:0,e:"Put off означает «отложить». Остальные фразовые глаголы имеют другие значения."},
  {id:"v05",topic:"Лексика",level:1,q:"A person who designs buildings is an ___.",o:["accountant","architect","audience","engineer"],a:1,e:"Architect это архитектор, специалист по проектированию зданий."},
  {id:"v06",topic:"Лексика",level:1,q:"We need to ___ a decision before noon.",o:["do","make","take","have"],a:1,e:"Правильное устойчивое сочетание: make a decision."},
  {id:"v07",topic:"Лексика",level:1,q:"The instructions were so ___ that everyone understood them.",o:["confusing","clear","ordinary","narrow"],a:1,e:"По смыслу подходит clear: инструкции были понятными."},
  {id:"v08",topic:"Лексика",level:1,q:"Choose the word closest in meaning to 'purchase'.",o:["borrow","buy","lend","repair"],a:1,e:"Purchase означает «покупать» или «приобретать»."},
  {id:"u01",topic:"Use of English",level:2,q:"I am looking forward to ___ you again.",o:["see","seeing","saw","seen"],a:1,e:"В конструкции look forward to слово to является предлогом, поэтому далее используется герундий."},
  {id:"u02",topic:"Use of English",level:2,q:"Despite ___ tired, Mark finished the task.",o:["be","being","was","been"],a:1,e:"После предлога despite используется существительное или герундий."},
  {id:"u03",topic:"Use of English",level:1,q:"She is responsible ___ organising the event.",o:["for","of","to","with"],a:0,e:"Правильное сочетание: responsible for."},
  {id:"u04",topic:"Use of English",level:2,q:"Hardly had we arrived ___ it started to rain.",o:["than","when","then","while"],a:1,e:"Устойчивая конструкция: hardly ... when."},
  {id:"u05",topic:"Use of English",level:1,q:"The book was ___ interesting that I read it twice.",o:["such","so","too","enough"],a:1,e:"Используется конструкция so + adjective + that."},
  {id:"u06",topic:"Use of English",level:2,q:"He asked me where I ___.",o:["live","lived","do live","am living"],a:1,e:"В косвенном вопросе после глагола в прошедшем времени обычно происходит согласование времён: live становится lived."},
  {id:"u07",topic:"Use of English",level:3,q:"Not only ___ late, but he also forgot the tickets.",o:["he was","was he","he is","is he"],a:1,e:"После Not only в начале предложения используется инверсия: вспомогательный глагол перед подлежащим."},
  {id:"u08",topic:"Use of English",level:2,q:"The flight was cancelled ___ the heavy snow.",o:["because","because of","although","despite of"],a:1,e:"Because of употребляется перед существительным или именной группой. Здесь heavy snow это именная группа."},
  {id:"r01",topic:"Чтение",level:1,q:"Read: 'Mia cycles to work whenever the weather is fine. On rainy days, she takes the bus.' How does Mia travel on rainy days?",o:["By bicycle","By bus","On foot","By train"],a:1,e:"В тексте прямо сказано, что в дождливые дни Mia takes the bus."},
  {id:"r02",topic:"Чтение",level:1,q:"Read: 'The library closes at 6 p.m. on weekdays, but it stays open until 8 p.m. on Fridays.' When does the library close at 8 p.m.?",o:["On Mondays","On Wednesdays","On Fridays","Every weekday"],a:2,e:"В тексте указано, что до 8 p.m. библиотека работает по пятницам."},
  {id:"r03",topic:"Чтение",level:2,q:"Read: 'Although the train was delayed, the passengers remained calm.' What does 'although' express?",o:["A contrast","A reason","A result","A purpose"],a:0,e:"Although вводит уступку или контраст: поезд задержался, но пассажиры сохраняли спокойствие."},
  {id:"r04",topic:"Чтение",level:1,q:"Read: 'Tom borrowed a camera from his cousin and promised to return it on Monday.' Who owns the camera?",o:["Tom","Tom's cousin","The photographer","The shop"],a:1,e:"Tom borrowed the camera from his cousin, значит, камера принадлежит его двоюродному брату или сестре."},
  {id:"r05",topic:"Чтение",level:1,q:"Read: 'The workshop is free, but participants must register online in advance.' What must participants do?",o:["Pay at the door","Bring a laptop","Register before the event","Arrive one hour early"],a:2,e:"Register online in advance означает, что нужно зарегистрироваться заранее через интернет."}
];

const STORAGE_KEY = "nmt-english-pwa-v1";
const TOPICS = ["Грамматика", "Лексика", "Use of English", "Чтение"];
const $ = (id) => document.getElementById(id);
let state = loadState();
let selectedAnswer = null;
let submitted = false;

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function hashString(str) {
  let h = 2166136261;
  for (let i=0; i<str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function seededShuffle(items, seed) {
  let x = seed || 1;
  const arr = [...items];
  const rand = () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 4294967296; };
  for (let i=arr.length-1; i>0; i--) {
    const j = Math.floor(rand()*(i+1));
    [arr[i],arr[j]] = [arr[j],arr[i]];
  }
  return arr;
}
function newSession(date) {
  const ids = seededShuffle(QUESTIONS.map(q=>q.id), hashString(date)).slice(0,20);
  return { date, ids, index:0, answers:[] };
}
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && saved.session && saved.session.date === todayKey()) return saved;
    return { session:newSession(todayKey()), records:saved?.records || [], days:saved?.days || [] };
  } catch { return { session:newSession(todayKey()), records:[], days:[] }; }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function ensureToday() {
  if (state.session.date !== todayKey()) {
    state.session = newSession(todayKey());
    saveState();
  }
}
function currentQuestion() {
  const id = state.session.ids[state.session.index];
  return QUESTIONS.find(q=>q.id===id);
}
function render() {
  ensureToday();
  $("today-date").textContent = new Date().toLocaleDateString("ru-RU",{day:"numeric",month:"short"});
  const done = state.session.index;
  $("progress-count").textContent = `${done} из 20`;
  $("progress-fill").style.width = `${done/20*100}%`;
  $("progress-caption").textContent = done===20 ? "Все задания на сегодня выполнены." : `Осталось заданий: ${20-done}.`;
  renderQuiz();
  renderStats();
  renderTopics();
}
function renderQuiz() {
  const area = $("quiz-area");
  if (state.session.index >= 20) {
    const correct = state.session.answers.filter(a=>a.correct).length;
    area.innerHTML = `<article class="completion-card"><div class="completion-icon">✦</div><h2>Тренировка завершена</h2><div class="score">${correct} / 20</div><p class="muted">Правильных ответов сегодня</p><p class="muted small">Новая подборка появится завтра. Результаты сохранены на этом устройстве.</p></article>`;
    return;
  }
  const q = currentQuestion();
  if (!q) { area.innerHTML = '<p class="empty-state">Не удалось загрузить вопрос.</p>'; return; }
  const answer = state.session.answers.find(a=>a.questionId===q.id);
  const options = q.o.map((option,i)=>{
    let cls = "option";
    if (selectedAnswer===i) cls += " selected";
    if (submitted && i===q.a) cls += " correct";
    else if (submitted && i===selectedAnswer) cls += " wrong";
    return `<button class="${cls}" data-option="${i}" ${submitted?"disabled":""}><span class="option-letter">${"ABCD"[i]}</span><span class="option-text">${escapeHTML(option)}</span></button>`;
  }).join("");
  const feedback = submitted ? `<div class="feedback show"><h3>${selectedAnswer===q.a?"Верно!":"Разберём ответ"}</h3><p class="answer-line">Правильный ответ: ${escapeHTML(q.o[q.a])}</p><p>${selectedAnswer===q.a ? q.e : `Твой вариант «${escapeHTML(q.o[selectedAnswer])}» не подходит. ${q.e}`}</p></div>` : "";
  area.innerHTML = `<article class="question-card">
    <div class="question-meta"><span class="topic-tag">${q.topic}</span><span class="level-tag">Уровень ${q.level} · Вопрос ${state.session.index+1}/20</span></div>
    <h2 class="question-text">${escapeHTML(q.q)}</h2>
    <div class="options">${options}</div>
    ${feedback}
    ${submitted ? '<button class="primary-button" id="nextQuestion">Следующее задание</button>' : '<button class="primary-button" id="checkAnswer" disabled>Проверить ответ</button>'}
  </article>`;
  area.querySelectorAll("[data-option]").forEach(btn=>btn.addEventListener("click",()=>{
    if (submitted) return;
    selectedAnswer = Number(btn.dataset.option);
    renderQuiz();
    $("checkAnswer").disabled = false;
  }));
  if (!submitted) $("checkAnswer").addEventListener("click", submitAnswer);
  else $("nextQuestion").addEventListener("click", nextQuestion);
}
function submitAnswer() {
  if (selectedAnswer===null || submitted) return;
  submitted = true;
  const q = currentQuestion();
  const record = { questionId:q.id, topic:q.topic, selected:selectedAnswer, correct:selectedAnswer===q.a, date:todayKey() };
  state.session.answers.push(record);
  state.records.push(record);
  const existing = state.days.find(d=>d.date===todayKey());
  const todayAnswers = state.session.answers;
  const day = { date:todayKey(), answered:todayAnswers.length, correct:todayAnswers.filter(a=>a.correct).length };
  if (existing) Object.assign(existing,day); else state.days.push(day);
  saveState();
  render();
}
function nextQuestion() {
  state.session.index++;
  selectedAnswer = null;
  submitted = false;
  saveState();
  render();
}
function renderStats() {
  const records = state.records;
  const correct = records.filter(r=>r.correct).length;
  $("stat-answered").textContent = records.length;
  $("stat-correct").textContent = correct;
  $("stat-accuracy").textContent = records.length ? `${Math.round(correct/records.length*100)}%` : "0%";
  $("stat-today").textContent = `${state.session.answers.length}/20`;
  const days = [...state.days].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,14);
  $("day-history").innerHTML = days.length ? days.map(d=>`<div class="history-row"><div class="history-top"><span>${formatDate(d.date)}</span><strong>${d.correct}/${d.answered}</strong></div><div class="mini-track"><div class="mini-fill" style="width:${d.answered?d.correct/d.answered*100:0}%"></div></div></div>`).join("") : '<p class="empty-state">Статистика появится после первых ответов.</p>';
}
function renderTopics() {
  const data = TOPICS.map(topic=>{
    const list = state.records.filter(r=>r.topic===topic);
    const correct = list.filter(r=>r.correct).length;
    return {topic, attempts:list.length, accuracy:list.length?Math.round(correct/list.length*100):null};
  }).filter(x=>x.attempts).sort((a,b)=>a.accuracy-b.accuracy);
  $("topic-list").innerHTML = data.length ? data.map(x=>`<article class="topic-item"><div class="topic-top"><span>${x.topic}</span><span class="topic-percent">${x.accuracy}%</span></div><div class="mini-track" style="margin-top:10px"><div class="mini-fill" style="width:${x.accuracy}%"></div></div><p>Ответов: ${x.attempts} · ${x.accuracy<60?"стоит повторить":x.accuracy<80?"есть куда расти":"хороший результат"}</p></article>`).join("") : '<p class="empty-state">Пока недостаточно данных. Пройди несколько вопросов, и здесь появится анализ слабых тем.</p>';
}
function formatDate(key) {
  const [y,m,d]=key.split("-").map(Number);
  return new Date(y,m-1,d).toLocaleDateString("ru-RU",{day:"numeric",month:"short",year:"numeric"});
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
document.querySelectorAll(".tab").forEach(tab=>tab.addEventListener("click",()=>{
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t===tab));
  document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===`view-${tab.dataset.view}`));
}));
const installDialog = $("installDialog");
$("installHelp").addEventListener("click",()=>installDialog.showModal());
$("closeInstall").addEventListener("click",()=>installDialog.close());
$("doneInstall").addEventListener("click",()=>installDialog.close());

if ("serviceWorker" in navigator) {
  window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(console.error));
}
render();
