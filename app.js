(() => {
"use strict";
const VERSION="1.9.0", QUESTIONS=Array.isArray(window.NMT_QUESTIONS)?window.NMT_QUESTIONS:[], STORAGE_KEY="nmt-english-pwa-v1";
const TOPICS=["Грамматика","Лексика","Use of English","Чтение"], $=id=>document.getElementById(id);
const freshSession=date=>({date,ids:shuffle(QUESTIONS.map(q=>q.id),hash(date)).slice(0,20),index:0,answers:[]});
// Учебные сутки идут по московскому времени: с 03:00 до 02:59 следующего дня.
function moscowParts(date=new Date()){
 const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Moscow",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",hourCycle:"h23"}).formatToParts(date);
 return Object.fromEntries(parts.filter(p=>p.type!=="literal").map(p=>[p.type,p.value]));
}
function today(){
 const p=moscowParts();let day=new Date(Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day)));
 if(Number(p.hour)<3)day.setUTCDate(day.getUTCDate()-1);
 return `${day.getUTCFullYear()}-${String(day.getUTCMonth()+1).padStart(2,"0")}-${String(day.getUTCDate()).padStart(2,"0")}`;
}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function shuffle(items,seed){let x=seed||1,a=[...items];const rand=()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function load(){try{const s=JSON.parse(localStorage.getItem(STORAGE_KEY));if(s&&s.session){if(s.session.date!==today())s.session=freshSession(today());s.records=s.records||[];s.days=s.days||[];return s;}}catch(e){}return{session:freshSession(today()),records:[],days:[]};}
let state=load(), selected=null, submitted=false, practice={ids:[],index:0,selected:null,submitted:false};
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function question(id){return QUESTIONS.find(q=>q.id===id);}
function activate(view){document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.view===view));document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===`view-${view}`));if(view==="bank")renderBank();if(view==="practice")renderPractice();if(view==="home")renderHome();window.scrollTo({top:0,behavior:"smooth"});}
const FACTS=[
"В английском алфавите 26 букв, но примерно 44 звука. Поэтому одна и та же буква может звучать по-разному.",
"Слово «queue» произносится почти как одна буква Q. Остальные буквы словно стоят в очереди.",
"«I am» — самое короткое полное предложение в английском языке: в нём есть подлежащее и сказуемое.",
"В слове «rhythm» нет ни одной из пяти обычных гласных букв A, E, I, O, U.",
"Английское «goodbye» исторически произошло от выражения «God be with ye».",
"Слово «bookkeeper» примечательно тем, что в нём подряд идут три пары одинаковых букв: oo, kk и ee.",
"«Dreamt» считается одним из самых известных английских слов, оканчивающихся на сочетание букв -mt.",
"В английском слово «set» имеет очень много значений. Их число зависит от того, какие формы и употребления считать отдельными.",
"«Uncopyrightable» можно написать без повторения букв. Это пример из английской лексики, где каждая буква встречается один раз.",
"В английском нет единственного правила, по которому читаются все сочетания букв. Поэтому произношение полезно учить вместе со словами.",
"«Alphabet» пришло через латинский из греческого: от названий первых двух букв, alpha и beta.",
"Точка над строчной буквой i или j называется по-английски «tittle»."
];
let currentFact=0,factTimer=null;
function scheduleFact(){if(factTimer)clearTimeout(factTimer);factTimer=setTimeout(()=>{if(!document.hidden)showFact(currentFact+1);else scheduleFact();},30000);}
function showFact(index){currentFact=(index+FACTS.length)%FACTS.length;const text=$("fact-text"),counter=$("fact-counter"),dots=$("fact-dots");if(!text||!counter||!dots)return;text.textContent=FACTS[currentFact];counter.textContent=`${currentFact+1} / ${FACTS.length}`;dots.innerHTML=FACTS.map((_,i)=>`<button class="fact-dot ${i===currentFact?"active":""}" data-fact="${i}" aria-label="Факт ${i+1}" aria-current="${i===currentFact?"true":"false"}"></button>`).join("");dots.querySelectorAll("[data-fact]").forEach(b=>b.addEventListener("click",()=>showFact(Number(b.dataset.fact))));const next=$("fact-next");if(next)next.onclick=()=>showFact(currentFact+1);scheduleFact();}
function renderHome(){const done=state.session.index>=20;const count=state.session.index;const days=streak();$("home-streak").textContent=`${days} ${plural(days,["день","дня","дней"])}`;$("home-daily-status").textContent=done?"Выполнено ✓":"Не выполнено";$("home-daily-detail").textContent=done?"Все 20 заданий завершены":`${count} из 20 заданий выполнено`;}

function render(){const done=state.session.index;renderHome();$("today-date").textContent=formatDate(today());$("progress-count").textContent=`${done} из 20`;$("progress-fill").style.width=`${done/20*100}%`;$("progress-caption").textContent=done===20?"Все задания на сегодня выполнены.":`Осталось заданий: ${20-done}.`;renderDaily();renderStats();}
function renderDaily(){const area=$("quiz-area");if(state.session.index>=20){area.innerHTML=`<article class="completion-card"><div class="completion-icon">✦</div><h2>Тренировка завершена</h2><div class="score">${state.session.answers.filter(a=>a.correct).length} / 20</div><p class="muted">Правильных ответов сегодня</p><p class="muted small">Новая подборка появится завтра. Свободная практика доступна без ограничений.</p></article>`;return;}renderQuestion(area,question(state.session.ids[state.session.index]),state.session.index+1,20,selected,submitted,"daily");}
function wordMarkup(value){return esc(value).replace(/([A-Za-z]+(?:[’'][A-Za-z]+)*)/g, (word)=>`<span class="dict-word" data-dict-word="${word.replace(/&/g,'&amp;')}" tabindex="0" role="button" aria-label="Перевести ${word}">${word}</span>`);}
function bindDictionary(area){
 area.querySelectorAll("[data-dict-word]").forEach(el=>{
  const open=()=>{if(!window.getSelection()?.toString().trim())openDictionary(el.textContent);};
  el.addEventListener("click",open);
  el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openDictionary(el.textContent);}});
 });
 area.querySelectorAll("[data-dict-option]").forEach(el=>el.addEventListener("click",e=>{e.stopPropagation();openDictionary(el.dataset.dictOption);}));
 const translate=area.querySelector("[data-translate-selection]");
 if(translate)translate.addEventListener("click",()=>{
  const selection=window.getSelection(),value=selection?.toString().trim();
  if(value){openDictionary(value);selection.removeAllRanges();}
  else openDictionary(area.querySelector(".question-text")?.textContent||"");
 });
}
function renderQuestion(area,q,n,total,chosen,done,mode){if(!q){area.innerHTML='<p class="empty-state">Вопросы не найдены. Проверь, загружен ли questions.js.</p>';return;}
const opts=q.o.map((v,i)=>{let c="option";if(chosen===i)c+=" selected";if(done&&i===q.a)c+=" correct";else if(done&&i===chosen)c+=" wrong";return `<button class="${c}" data-choice="${i}" ${done?"disabled":""}><span class="option-letter">${"ABCD"[i]}</span><span class="option-text">${esc(v)}</span><span class="dict-option-action" data-dict-option="${esc(v)}" role="button" tabindex="0" aria-label="Перевести вариант ${"ABCD"[i]}">📖</span></button>`;}).join("");
const feedback=done?`<div class="feedback show"><h3>${chosen===q.a?"Верно!":"Разберём ответ"}</h3><p class="answer-line">Правильный ответ: ${esc(q.o[q.a])}</p><p>${chosen===q.a?esc(q.e):`Твой вариант «${esc(q.o[chosen])}» не подходит. ${esc(q.e)}`}</p></div>`:"";
area.innerHTML=`<article class="question-card"><div class="question-meta"><span class="topic-tag">${esc(q.topic)}</span><span class="level-tag">Уровень ${q.level} · ${n}/${total}</span></div><h2 class="question-text">${wordMarkup(q.q)}</h2><p class="dict-help">Нажми на слово или выдели фразу и нажми «Перевести выделенное».</p><button type="button" class="dict-selection-button" data-translate-selection>📖 Перевести выделенное</button><div class="options">${opts}</div>${feedback}<button class="primary-button" id="answerAction" ${!done&&chosen===null?"disabled":""}>${done?(mode==="daily"?"Следующее задание":"Следующий вопрос"):"Проверить ответ"}</button></article>`;
bindDictionary(area);
area.querySelectorAll("[data-choice]").forEach(b=>b.addEventListener("click",()=>{if(mode==="daily"){selected=+b.dataset.choice;renderDaily();}else{practice.selected=+b.dataset.choice;renderPractice();}}));
$("answerAction").addEventListener("click",()=>{if(mode==="daily"){if(!submitted)submitDaily();else nextDaily();}else{if(!practice.submitted)submitPractice();else nextPractice();}});
}
const DICT_LOCAL={
 "marine":["морской","/məˈriːn/","Относится к морю и морской среде."],
 "research":["исследование","/rɪˈsɜːtʃ/","Изучение вопроса с помощью наблюдений и данных."],
 "project":["проект","/ˈprɒdʒekt/","Запланированная работа с определённой целью."],
 "coast":["побережье","/kəʊst/","Земля рядом с морем или океаном."],
 "university":["университет","/ˌjuːnɪˈvɜːsɪti/","Высшее учебное заведение."],
 "team":["команда","/tiːm/","Группа людей, работающих вместе."],
 "collected":["собрали","/kəˈlektɪd/","Прошедшая форма глагола collect: собирать."],
 "water":["вода","/ˈwɔːtə/","Жидкость; в сочетаниях может значить водный."],
 "samples":["образцы","/ˈsɑːmpəlz/","Небольшие количества материала для изучения."],
 "study":["изучать","/ˈstʌdi/","Исследовать или учиться."],
 "tiny":["крошечный","/ˈtaɪni/","Очень маленький."],
 "pieces":["кусочки","/ˈpiːsɪz/","Части чего-либо."],
 "plastic":["пластик","/ˈplæstɪk/","Искусственный полимерный материал."],
 "identify":["определить; выявить","/aɪˈdentɪfaɪ/","Установить, что или кто перед нами."],
 "possible":["возможный","/ˈpɒsəbəl/","То, что может произойти или существовать."],
 "sources":["источники","/ˈsɔːsɪz/","Места или причины происхождения чего-либо."],
 "pollution":["загрязнение","/pəˈluːʃən/","Попадание вредных веществ в окружающую среду."],
 "researchers":["исследователи","/rɪˈsɜːtʃəz/","Люди, проводящие исследования."],
 "findings":["результаты исследования","/ˈfaɪndɪŋz/","Выводы, полученные в ходе работы."],
 "public":["общественный; публичный","/ˈpʌblɪk/","Открытый для всех или относящийся к обществу."],
 "meeting":["встреча; собрание","/ˈmiːtɪŋ/","Событие, на котором люди собираются для обсуждения."],
 "welcomes":["приветствует; приглашает","/ˈwelkəmz/","Рад принять кого-либо или что-либо."],
 "scientists":["учёные","/ˈsaɪəntɪsts/","Люди, занимающиеся наукой."],
 "contacting":["связываясь","/ˈkɒntæktɪŋ/","Устанавливая связь с кем-либо."],
 "organisers":["организаторы","/ˈɔːɡənaɪzəz/","Люди, отвечающие за проведение мероприятия."],
 "improve":["улучшить","/ɪmˈpruːv/","Сделать что-либо лучше."],
 "understanding":["понимание","/ˌʌndəˈstændɪŋ/","Знание сути или смысла чего-либо."],
 "coastal":["прибрежный","/ˈkəʊstəl/","Расположенный у побережья."],
 "aims":["цели","/eɪmz/","То, чего стремятся достичь."],
 "courage":["смелость; мужество","/ˈkʌrɪdʒ/","Способность действовать несмотря на страх."],
 "take part":["принимать участие","/teɪk pɑːt/","Участвовать в событии или деятельности."],
 "last year":["в прошлом году","/lɑːst jɪə/","Год, предшествующий текущему."],
 "water samples":["пробы воды","/ˈwɔːtə ˈsɑːmpəlz/","Образцы воды, взятые для анализа."],
 "marine research":["морские исследования","/məˈriːn rɪˈsɜːtʃ/","Научное изучение моря."],
 "sources of pollution":["источники загрязнения","/ˈsɔːsɪz əv pəˈluːʃən/","Причины или места возникновения загрязнения."],
 "identify pollution sources":["выявить источники загрязнения","/aɪˈdentɪfaɪ pəˈluːʃən ˈsɔːsɪz/","Найти причины или места, откуда поступают загрязняющие вещества."]
};
let dictionaryRequest=0;
function closeDictionary(){const dlg=$("dictionaryDialog");if(dlg.open)dlg.close();}
function dictionaryField(id,value){$(id).textContent=value||"Нет данных";}
async function openDictionary(raw){
 const term=String(raw||"").replace(/\s+/g," ").trim().slice(0,180);if(!term)return;
 const dlg=$("dictionaryDialog");dictionaryField("dict-term",term);dictionaryField("dict-translation","Ищем перевод…");dictionaryField("dict-ipa","Загрузка…");dictionaryField("dict-definition","Загрузка…");dictionaryField("dict-status","Для новых слов нужен интернет. Перевод может зависеть от контекста.");
 if(!dlg.open)dlg.showModal();const request=++dictionaryRequest;
 const local=DICT_LOCAL[term.toLowerCase()];if(local){dictionaryField("dict-translation",local[0]);dictionaryField("dict-ipa",local[1]);dictionaryField("dict-definition",local[2]);dictionaryField("dict-status","Встроенный словарь · доступно без интернета");return;}
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8500);
 try{
  const promises=[fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(term)}&langpair=en%7Cru`,{signal:controller.signal}).then(r=>{if(!r.ok)throw Error("translate");return r.json();}).catch(()=>null)];
  if(/^[a-z]+(?:['’-][a-z]+)*$/i.test(term))promises.push(fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(term)}`,{signal:controller.signal}).then(r=>r.ok?r.json():null).catch(()=>null));
  const [tr,dict]=await Promise.all(promises);if(request!==dictionaryRequest||!dlg.open)return;
  const translation=tr?.responseData?.translatedText;dictionaryField("dict-translation",translation&&translation.toLowerCase()!==term.toLowerCase()?translation:"Перевод не найден");
  const entry=Array.isArray(dict)?dict[0]:null;dictionaryField("dict-ipa",entry?.phonetic||entry?.phonetics?.find(x=>x.text)?.text||"Транскрипция недоступна для этой фразы");
  const meaning=entry?.meanings?.[0];const definition=meaning?.definitions?.[0]?.definition;
  dictionaryField("dict-definition",definition?definition+" (объяснение на английском)":"Объяснение для этого выражения пока недоступно.");
  dictionaryField("dict-status",translation?"Онлайн-перевод · проверь значение по контексту":"Нет результата. Проверь интернет или попробуй другое выражение.");
 }catch(e){if(request===dictionaryRequest){dictionaryField("dict-translation","Не удалось получить перевод");dictionaryField("dict-ipa","Нет данных");dictionaryField("dict-definition","Подключись к интернету и попробуй ещё раз.");dictionaryField("dict-status","Онлайн-словарь временно недоступен.");}}finally{clearTimeout(timeout);}
}
$("dict-close").addEventListener("click",closeDictionary);
$("dictionaryDialog").addEventListener("close",()=>{dictionaryRequest++;});
$("dictionaryDialog").addEventListener("click",e=>{if(e.target===$("dictionaryDialog"))closeDictionary();});
function submitDaily(){if(checkDailyRollover())return;if(selected===null)return;submitted=true;const q=question(state.session.ids[state.session.index]);const r={questionId:q.id,topic:q.topic,selected,correct:selected===q.a,date:today(),mode:"daily"};state.session.answers.push(r);state.records.push(r);const d=state.days.find(x=>x.date===today());const summary={date:today(),answered:state.session.answers.length,correct:state.session.answers.filter(x=>x.correct).length};if(d)Object.assign(d,summary);else state.days.push(summary);save();render();}
function nextDaily(){if(checkDailyRollover())return;state.session.index++;selected=null;submitted=false;save();render();}
function fillTopicSelect(id){const el=$(id);el.innerHTML='<option value="">Все темы</option>'+TOPICS.map(t=>`<option>${esc(t)}</option>`).join("");}
function renderBank(){const search=($("bank-search").value||"").toLowerCase().trim(),topic=$("bank-topic").value,level=$("bank-level").value;const found=QUESTIONS.filter(q=>(!topic||q.topic===topic)&&(!level||String(q.level)===level)&&(!search||[q.q,...q.o,q.topic].join(" ").toLowerCase().includes(search)));$("bank-count").textContent=`Показано ${found.length} из ${QUESTIONS.length} вопросов`; $("bank-list").innerHTML=found.map(q=>`<article class="bank-item"><div class="question-meta"><span class="topic-tag">${esc(q.topic)}</span><span class="level-tag">Уровень ${q.level}</span></div><p>${esc(q.q)}</p><button class="secondary-button" data-practice-id="${esc(q.id)}">Тренировать этот вопрос</button></article>`).join("")||'<p class="empty-state">Ничего не найдено. Измени поиск или фильтры.</p>'; $("bank-list").querySelectorAll("[data-practice-id]").forEach(b=>b.addEventListener("click",()=>{practice.ids=[b.dataset.practiceId];practice.index=0;practice.selected=null;practice.submitted=false;activate("practice");renderPractice();}));}
function startPractice(){const topic=$("practice-topic").value,mode=$("practice-mode").value;let pool=QUESTIONS.filter(q=>!topic||q.topic===topic);if(mode==="wrong"){const wrong=new Set(state.records.filter(r=>!r.correct).map(r=>r.questionId));pool=pool.filter(q=>wrong.has(q.id));}if(mode==="hard")pool=pool.filter(q=>q.level>=3);practice.ids=shuffle(pool.map(q=>q.id),Date.now()).slice(0,30);practice.index=0;practice.selected=null;practice.submitted=false;renderPractice();}
function renderPractice(){const area=$("practice-area");if(!practice.ids.length){area.innerHTML='<p class="empty-state">Выбери тему и режим, затем нажми «Начать практику».</p><button class="primary-button" id="startPractice">Начать практику</button>';$("startPractice").addEventListener("click",startPractice);return;}if(practice.index>=practice.ids.length){area.innerHTML=`<article class="completion-card"><div class="completion-icon">✓</div><h2>Раунд завершён</h2><p class="muted">Ответы сохранены в общей статистике.</p><button class="primary-button" id="againPractice">Ещё раунд</button></article>`;$("againPractice").addEventListener("click",startPractice);return;}renderQuestion(area,question(practice.ids[practice.index]),practice.index+1,practice.ids.length,practice.selected,practice.submitted,"practice");}
function submitPractice(){if(practice.selected===null)return;practice.submitted=true;const q=question(practice.ids[practice.index]);state.records.push({questionId:q.id,topic:q.topic,selected:practice.selected,correct:practice.selected===q.a,date:today(),mode:"practice"});save();renderStats();renderPractice();}
function nextPractice(){practice.index++;practice.selected=null;practice.submitted=false;renderPractice();}
function shiftDateKey(key,amount){const [y,m,d]=key.split("-").map(Number),date=new Date(Date.UTC(y,m-1,d+amount));return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,"0")}-${String(date.getUTCDate()).padStart(2,"0")}`;}
function streak(){const completed=new Set(state.days.filter(d=>d.answered>=20).map(d=>d.date));let n=0,key=today();if(!completed.has(key))key=shiftDateKey(key,-1);while(completed.has(key)){n++;key=shiftDateKey(key,-1);}return n;}
function maxStreak(){const dates=[...new Set(state.days.filter(d=>d.answered>=20).map(d=>d.date))].sort();let best=0,run=0,prev=null;for(const key of dates){const cur=Date.parse(key+"T00:00:00Z");const expected=prev?Date.parse(prev+"T00:00:00Z"):null;if(!prev||Math.round((cur-expected)/86400000)===1)run++;else run=1;best=Math.max(best,run);prev=key;}return best;}
function renderStats(){const rs=state.records,correct=rs.filter(r=>r.correct).length;$("stat-answered").textContent=rs.length;$("stat-correct").textContent=correct;$("stat-accuracy").textContent=rs.length?`${Math.round(correct/rs.length*100)}%`:"0%";$("stat-today").textContent=`${state.session.answers.length}/20`;$("streak-count").textContent=`${streak()} ${plural(streak(),["день подряд","дня подряд","дней подряд"])}`;
const milestones=[3,7,14,30],best=maxStreak();$("achievements").innerHTML=milestones.map(n=>`<div class="achievement ${best>=n?"earned":""}"><span>${best>=n?"🏅":"🔒"}</span><strong>${n} дней</strong><small>${best>=n?"Получено навсегда":`Лучшая серия: ${best}`}</small></div>`).join("")+[[50,"50 ответов"],[100,"100 ответов"],[500,"500 ответов"],[1000,"1000 ответов"]].map(([n,t])=>`<div class="achievement ${rs.length>=n?"earned":""}"><span>${rs.length>=n?"⭐":"🔒"}</span><strong>${t}</strong><small>${Math.min(rs.length,n)}/${n}</small></div>`).join("")+TOPICS.map(t=>{const a=rs.filter(r=>r.topic===t),c=a.filter(r=>r.correct).length,earned=a.length>=10&&c/a.length>=.8;return `<div class="achievement ${earned?"earned":""}"><span>${earned?"🎓":"🔒"}</span><strong>${esc(t)}</strong><small>${earned?"Тема освоена":`${a.length}/10 ответов, точность от 80%`}</small></div>`;}).join("");
const days=[...state.days].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,14);$("day-history").innerHTML=days.length?days.map(d=>`<div class="history-row"><div class="history-top"><span>${formatDate(d.date)}</span><strong>${d.correct}/${d.answered}</strong></div><div class="mini-track"><div class="mini-fill" style="width:${d.answered/20*100}%"></div></div></div>`).join(""):'<p class="empty-state">История появится после ежедневных тренировок.</p>';
const topics=TOPICS.map(t=>{const a=rs.filter(r=>r.topic===t),c=a.filter(r=>r.correct).length;return{t,a:a.length,p:a.length?Math.round(c/a.length*100):0};});$("topic-list").innerHTML=topics.map(x=>`<div class="topic-item"><div class="topic-top"><span>${esc(x.t)}</span><span>${x.a?x.p+"%":"—"}</span></div><div class="mini-track" style="margin-top:9px"><div class="mini-fill" style="width:${x.p}%"></div></div><p>Ответов: ${x.a}</p></div>`).join("");}
function plural(n,forms){const x=n%100,y=n%10;return forms[x>10&&x<20?2:y>1&&y<5?1:y===1?0:2];}
function formatDate(k){const[y,m,d]=k.split("-").map(Number);return new Date(y,m-1,d).toLocaleDateString("ru-RU",{day:"numeric",month:"short",year:"numeric"});}
function setTheme(v){
 const theme=["system","light","dark"].includes(v)?v:"system";
 document.documentElement.dataset.theme=theme;
 document.documentElement.style.colorScheme=theme==="system"?"light dark":theme;
 try{localStorage.setItem("nmt-theme",theme);}catch(e){console.warn("Не удалось сохранить тему:",e);}
 const meta=document.querySelector('meta[name="theme-color"]');
 if(meta)meta.setAttribute("content",theme==="dark"?"#111827":theme==="light"?"#f5f6ff":"#6d5ce7");
}
document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>activate(t.dataset.view)));$("homeButton").addEventListener("click",()=>activate("home"));document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>activate(b.dataset.go)));showFact(0);
function checkDailyRollover(){const key=today();if(state.session.date!==key){state.session=freshSession(key);selected=null;submitted=false;save();render();return true;}return false;}
setInterval(checkDailyRollover,15000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden){checkDailyRollover();scheduleFact();}});
fillTopicSelect("bank-topic");fillTopicSelect("practice-topic");
["bank-search","bank-topic","bank-level"].forEach(id=>$(id).addEventListener(id==="bank-search"?"input":"change",renderBank));
let savedTheme="system";try{savedTheme=localStorage.getItem("nmt-theme")||"system";}catch(e){}
$("theme-select").value=["system","light","dark"].includes(savedTheme)?savedTheme:"system";
setTheme($("theme-select").value);$("theme-select").addEventListener("change",e=>setTheme(e.target.value));
const dlg=$("installDialog");$("installHelp").addEventListener("click",()=>dlg.showModal());$("closeInstall").addEventListener("click",()=>dlg.close());$("doneInstall").addEventListener("click",()=>dlg.close());
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(console.error));
if(!QUESTIONS.length){console.error("Банк вопросов не загрузился или пуст.");const count=$("bank-count");if(count)count.textContent="Не удалось загрузить базу вопросов. Обнови страницу при подключённом интернете.";}
render();
})();