const QUESTIONS = window.NMT_QUESTIONS || [];
const STORAGE_KEY = "nmt-english-pwa-v1";
const TOPICS = ["Грамматика", "Лексика", "Use of English", "Чтение"];
const $ = id => document.getElementById(id);
let state = loadState();
let selectedAnswer = null, submitted = false, libraryLimit = 40, practiceQueue = [], practiceIndex = 0, practiceMode = "all";
function todayKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function hashString(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function shuffle(a,seed){let x=seed||1,r=()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function newSession(date){return {date,ids:shuffle(QUESTIONS.map(q=>q.id),hashString(date)).slice(0,20),index:0,answers:[]};}
function loadState(){
 try{
  const s=JSON.parse(localStorage.getItem(STORAGE_KEY))||{};
  const records=Array.isArray(s.records)?s.records:[];
  const days=Array.isArray(s.days)?s.days:[];
  let session=s.session;
  if(!session||session.date!==todayKey()||!Array.isArray(session.ids)||session.ids.some(id=>!QUESTIONS.some(q=>q.id===id))) session=newSession(todayKey());
  return {...s,session,records,days,theme:s.theme||"auto",hardIds:Array.isArray(s.hardIds)?s.hardIds:[]};
 }catch{return {session:newSession(todayKey()),records:[],days:[],theme:"auto",hardIds:[]};}
}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function applyTheme(){document.documentElement.dataset.theme=state.theme; $("themeSelect").value=state.theme;}
function switchView(name){
 document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.view===name));
 document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===`view-${name}`));
 if(name==="library")renderLibrary(); if(name==="practice")renderPracticeHome(); if(name==="progress")renderProgress();
}
function render(){
 if(state.session.date!==todayKey())state.session=newSession(todayKey());
 applyTheme();
 $("totalQuestions").textContent=QUESTIONS.length.toLocaleString("ru-RU");
 const done=state.session.index;
 $("progressCount").textContent=`${done} из 20`; $("progressFill").style.width=`${done/20*100}%`;
 $("progressCaption").textContent=done===20?"Все задания на сегодня выполнены.":`Осталось заданий: ${20-done}.`;
 $("todayDate").textContent=new Date().toLocaleDateString("ru-RU",{day:"numeric",month:"short"});
 renderDaily();renderStats();renderTopics();renderProgress();
}
function renderDaily(){
 const area=$("dailyQuiz");
 if(state.session.index>=20){const n=state.session.answers.filter(x=>x.correct).length;area.innerHTML=`<article class="completion-card"><div class="completion-icon">✦</div><h2>Тренировка завершена</h2><div class="score">${n} / 20</div><p class="muted">Правильных ответов сегодня</p><p class="muted small">Результаты сохранены. Новая ежедневная подборка появится завтра.</p></article>`;return;}
 const q=QUESTIONS.find(x=>x.id===state.session.ids[state.session.index]); renderQuestion(area,q,"daily",state.session.index+1);
}
function renderQuestion(area,q,mode,number){
 if(!q){area.innerHTML='<p class="empty-state">Вопрос не найден.</p>';return;}
 const options=q.o.map((o,i)=>{let c="option";if(selectedAnswer===i)c+=" selected";if(submitted&&i===q.a)c+=" correct";else if(submitted&&i===selectedAnswer)c+=" wrong";return `<button class="${c}" data-opt="${i}" ${submitted?"disabled":""}><span class="option-letter">${"ABCD"[i]}</span><span class="option-text">${esc(o)}</span></button>`;}).join("");
 const feedback=submitted?`<div class="feedback show"><h3>${selectedAnswer===q.a?"Верно!":"Разберём ответ"}</h3><p class="answer-line">Правильный ответ: ${esc(q.o[q.a])}</p><p>${esc(q.e)}</p></div>`:"";
 area.innerHTML=`<article class="question-card"><div class="question-meta"><span class="topic-tag">${esc(q.topic)}</span><span class="level-tag">Уровень ${q.level} · ${number||""}</span></div><h2 class="question-text">${esc(q.q).replace(/\n/g,"<br>")}</h2><div class="options">${options}</div>${feedback}${submitted?'<button class="primary-button" id="advance">Следующий вопрос</button>':'<button class="primary-button" id="check" disabled>Проверить ответ</button>'}</article>`;
 area.querySelectorAll("[data-opt]").forEach(b=>b.addEventListener("click",()=>{if(submitted)return;selectedAnswer=+b.dataset.opt;renderQuestion(area,q,mode,number);$("check").disabled=false;}));
 if(!submitted)$("check").addEventListener("click",()=>submit(mode,q));
 else $("advance").addEventListener("click",()=>advance(mode));
}
function submit(mode,q){
 if(selectedAnswer===null||submitted)return;submitted=true;
 const rec={questionId:q.id,topic:q.topic,selected:selectedAnswer,correct:selectedAnswer===q.a,date:todayKey(),mode};
 state.records.push(rec);
 if(mode==="daily"){
  state.session.answers.push(rec);
  const d=state.days.find(x=>x.date===todayKey()),a=state.session.answers;
  const day={date:todayKey(),answered:a.length,correct:a.filter(x=>x.correct).length,completed:a.length>=20};
  if(d)Object.assign(d,day);else state.days.push(day);
 }else if(mode==="practice"){
  if(!rec.correct&&!state.hardIds.includes(q.id))state.hardIds.push(q.id);
  if(rec.correct)state.hardIds=state.hardIds.filter(id=>id!==q.id);
 }
 save();renderStats();renderTopics();renderProgress();
 const area=mode==="daily"?$("dailyQuiz"):$("practiceQuiz");
 renderQuestion(area,q,mode,mode==="daily"?state.session.index+1:practiceIndex+1);
}
function advance(mode){
 selectedAnswer=null;submitted=false;
 if(mode==="daily"){state.session.index++;save();render();return;}
 practiceIndex++;
 if(practiceIndex>=practiceQueue.length){$("practiceQuiz").innerHTML=`<article class="completion-card"><div class="completion-icon">✦</div><h2>Практика завершена</h2><p class="muted">Ты ответил(а) на ${practiceQueue.length} вопросов.</p><button class="primary-button" id="backPractice">К выбору тренировки</button></article>`;$("backPractice").onclick=renderPracticeHome;return;}
 renderQuestion($("practiceQuiz"),practiceQueue[practiceIndex],"practice",practiceIndex+1);
}
function renderStats(){
 const r=state.records,c=r.filter(x=>x.correct).length;
 $("statAnswered").textContent=r.length;$("statCorrect").textContent=c;$("statAccuracy").textContent=r.length?`${Math.round(c/r.length*100)}%`:"0%";
 $("statToday").textContent=`${state.session.answers.length}/20`;
 const days=[...state.days].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,14);
 $("dayHistory").innerHTML=days.length?days.map(d=>`<div class="history-row"><div class="history-top"><span>${formatDate(d.date)}</span><strong>${d.correct}/${d.answered}</strong></div><div class="mini-track"><div class="mini-fill" style="width:${d.answered?d.correct/d.answered*100:0}%"></div></div></div>`).join(""):'<p class="empty-state">Статистика появится после первых ответов.</p>';
}
function renderTopics(){
 const html=TOPICS.map(t=>{const a=state.records.filter(r=>r.topic===t),c=a.filter(x=>x.correct).length,p=a.length?Math.round(c/a.length*100):0;return `<article class="topic-item"><div class="topic-top"><span>${t}</span><span class="topic-percent">${a.length?p+"%":"—"}</span></div><div class="mini-track" style="margin-top:10px"><div class="mini-fill" style="width:${p}%"></div></div><p>Ответов: ${a.length} · ${!a.length?"пока нет данных":p<60?"стоит повторить":p<80?"есть куда расти":"хороший результат"}</p></article>`;}).join("");
 $("topicList").innerHTML=html;
}
function renderLibrary(){
 const query=$("searchQuestions").value.trim().toLowerCase(),topic=$("filterTopic").value,level=$("filterLevel").value;
 const list=QUESTIONS.filter(q=>(topic==="all"||q.topic===topic)&&(level==="all"||String(q.level)===level)&&(!query||`${q.q} ${q.o.join(" ")} ${q.e}`.toLowerCase().includes(query)));
 $("libraryCount").textContent=`Показано ${Math.min(libraryLimit,list.length)} из ${list.length} вопросов · всего ${QUESTIONS.length}`;
 $("libraryList").innerHTML=list.slice(0,libraryLimit).map(q=>`<article class="library-card"><div class="question-meta"><span class="topic-tag">${esc(q.topic)}</span><span class="level-tag">Уровень ${q.level}</span></div><p>${esc(q.q).replace(/\n/g,"<br>")}</p><button class="secondary-button" data-train="${q.id}">Тренировать этот вопрос</button></article>`).join("")||'<p class="empty-state">По этому запросу ничего не найдено.</p>';
 $("loadMore").hidden=list.length<=libraryLimit;
 $("libraryList").querySelectorAll("[data-train]").forEach(b=>b.onclick=()=>startPractice([b.dataset.train]));
}
function startPractice(ids){
 practiceQueue=ids.map(id=>QUESTIONS.find(q=>q.id===id)).filter(Boolean);practiceIndex=0;selectedAnswer=null;submitted=false;
 switchView("practice");$("practiceHome").hidden=true;$("practiceQuiz").hidden=false;$("backToPractice").hidden=false;
 renderQuestion($("practiceQuiz"),practiceQueue[0],"practice",1);
}
function renderPracticeHome(){
 $("practiceHome").hidden=false;$("practiceQuiz").hidden=true;
 $("practiceSummary").textContent=`В базе ${QUESTIONS.length} вопросов. Свободная практика не расходует ежедневные 20 заданий.`;
}
function beginPractice(kind){
 let qs=QUESTIONS;
 if(kind==="wrong"){const ids=new Set(state.records.filter(x=>!x.correct).map(x=>x.questionId));qs=QUESTIONS.filter(q=>ids.has(q.id));}
 if(kind==="hard")qs=QUESTIONS.filter(q=>state.hardIds.includes(q.id));
 if(kind==="topic"){const t=$("practiceTopic").value;qs=QUESTIONS.filter(q=>q.topic===t);}
 if(!qs.length){$("practiceNotice").textContent="Пока нет вопросов для этого режима. Ответь на задания или выбери другую тему.";return;}
 const n=kind==="all"?qs.length:Math.min(qs.length,100);
 startPractice(shuffle(qs.map(q=>q.id),Date.now()).slice(0,n));
}
function streak(){
 const completed=new Set(state.days.filter(d=>d.completed).map(d=>d.date));let n=0,d=new Date();
 if(!completed.has(todayKey()))d.setDate(d.getDate()-1);
 while(completed.has(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`)){n++;d.setDate(d.getDate()-1);}
 return n;
}
function renderProgress(){
 const total=state.records.length,s=streak(),topicsDone=TOPICS.filter(t=>{const a=state.records.filter(r=>r.topic===t);return a.length>=10&&a.filter(r=>r.correct).length/a.length>=.8;}).length;
 $("streakValue").textContent=s;$("achievementList").innerHTML=[
 ["Первые шаги",total>=1,"Ответь на первый вопрос"],
 ["Разминка",total>=100,"100 ответов"],
 ["Сотня знаний",total>=500,"500 ответов"],
 ["Марафонец",total>=1000,"1000 ответов"],
 ["Три дня подряд",s>=3,"Заверши ежедневную тренировку 3 дня подряд"],
 ["Неделя практики",s>=7,"7 дней подряд"],
 ["Две недели",s>=14,"14 дней подряд"],
 ["Месяц дисциплины",s>=30,"30 дней подряд"],
 ["Мастер тем",topicsDone>=4,"Освой все четыре темы: минимум 10 ответов и 80% точности"]
 ].map(x=>`<article class="achievement ${x[1]?"earned":""}"><span class="medal">${x[1]?"★":"☆"}</span><div><strong>${x[0]}</strong><p>${x[2]}</p></div><span class="status">${x[1]?"Получено":"В процессе"}</span></article>`).join("");
}
function formatDate(k){const [y,m,d]=k.split("-").map(Number);return new Date(y,m-1,d).toLocaleDateString("ru-RU",{day:"numeric",month:"short",year:"numeric"});}
document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>switchView(t.dataset.view)));
$("searchQuestions").addEventListener("input",()=>{libraryLimit=40;renderLibrary();});
$("filterTopic").addEventListener("change",renderLibrary);$("filterLevel").addEventListener("change",renderLibrary);
$("loadMore").onclick=()=>{libraryLimit+=40;renderLibrary();};
$("themeSelect").addEventListener("change",()=>{state.theme=$("themeSelect").value;save();applyTheme();});
$("startAll").onclick=()=>beginPractice("all");$("startWrong").onclick=()=>beginPractice("wrong");$("startHard").onclick=()=>beginPractice("hard");$("startTopic").onclick=()=>beginPractice("topic");
$("backToPractice").onclick=()=>{selectedAnswer=null;submitted=false;renderPracticeHome();};
$("installHelp").onclick=()=>$("installDialog").showModal();$("closeInstall").onclick=()=>$("installDialog").close();$("doneInstall").onclick=()=>$("installDialog").close();
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(console.error));
render();renderLibrary();renderPracticeHome();
