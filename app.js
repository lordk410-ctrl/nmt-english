(() => {
"use strict";
const VERSION="1.11.0", QUESTIONS=Array.isArray(window.NMT_QUESTIONS)?window.NMT_QUESTIONS:[], STORAGE_KEY="nmt-english-pwa-v1";
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
function load(){try{const s=JSON.parse(localStorage.getItem(STORAGE_KEY));if(s&&s.session){if(s.session.date!==today())s.session=freshSession(today());s.records=s.records||[];s.days=s.days||[];s.vocabulary=s.vocabulary||{};s.lessonProgress=s.lessonProgress||{};return s;}}catch(e){}return{session:freshSession(today()),records:[],days:[],vocabulary:{},lessonProgress:{}};}
let state=load(), selected=null, submitted=false, practice={ids:[],index:0,selected:null,submitted:false};
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function question(id){return QUESTIONS.find(q=>q.id===id);}
function activate(view){if("speechSynthesis"in window)window.speechSynthesis.cancel();document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.view===view));document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===`view-${view}`));if(view==="bank")renderBank();if(view==="practice")renderPractice();if(view==="home")renderHome();if(view==="learn")renderLearn();window.scrollTo({top:0,behavior:"smooth"});}
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
  const open=(e)=>{e.stopPropagation();if(!window.getSelection()?.toString().trim())openDictionary(el.textContent);};
  el.addEventListener("click",open);
  el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();e.stopPropagation();openDictionary(el.textContent);}});
 });
 area.querySelectorAll("[data-dict-option]").forEach(el=>el.addEventListener("click",e=>{e.stopPropagation();openDictionary(el.dataset.dictOption);}));
 const translate=area.querySelector("[data-translate-selection]");
 if(translate)translate.addEventListener("click",()=>{
  const selection=window.getSelection(),value=selection?.toString().trim();
  if(value){openDictionary(value);selection.removeAllRanges();}
  else dictionaryField("dict-status","Сначала выдели английское слово или фразу в тексте вопроса.");
 });
}
function renderQuestion(area,q,n,total,chosen,done,mode){if(!q){area.innerHTML='<p class="empty-state">Вопросы не найдены. Проверь, загружен ли questions.js.</p>';return;}
const opts=q.o.map((v,i)=>{let c="option";if(chosen===i)c+=" selected";if(done&&i===q.a)c+=" correct";else if(done&&i===chosen)c+=" wrong";return `<button class="${c}" data-choice="${i}"><span class="option-letter">${"ABCD"[i]}</span><span class="option-text">${wordMarkup(v)}</span></button>`;}).join("");
const feedback=done?`<div class="feedback show"><h3>${chosen===q.a?"Верно!":"Разберём ответ"}</h3><p class="answer-line">Правильный ответ: ${wordMarkup(q.o[q.a])}</p><p>${chosen===q.a?wordMarkup(q.e):`Твой вариант «${wordMarkup(q.o[chosen])}» не подходит. ${wordMarkup(q.e)}`}</p></div>`:"";
area.innerHTML=`<article class="question-card"><div class="question-meta"><span class="topic-tag">${esc(q.topic)}</span><span class="level-tag">Уровень ${q.level} · ${n}/${total}</span></div><h2 class="question-text">${wordMarkup(q.q)}</h2><p class="dict-help">Нажми на слово или выдели фразу и нажми «Перевести выделенное».</p><button type="button" class="dict-selection-button" data-translate-selection>📖 Перевести выделенное</button><div class="options">${opts}</div>${feedback}<button class="primary-button" id="answerAction" ${!done&&chosen===null?"disabled":""}>${done?(mode==="daily"?"Следующее задание":"Следующий вопрос"):"Проверить ответ"}</button></article>`;
bindDictionary(area);
area.querySelectorAll("[data-choice]").forEach(b=>b.addEventListener("click",()=>{if(done)return;if(mode==="daily"){selected=+b.dataset.choice;renderDaily();}else{practice.selected=+b.dataset.choice;renderPractice();}}));
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
 "identify pollution sources":["выявить источники загрязнения","/aɪˈdentɪfaɪ pəˈluːʃən ˈsɔːsɪz/","Найти причины или места, откуда поступают загрязняющие вещества."],
 "travel":["путешествие; поездка; путешествовать; ездить","/ˈtræv.əl/","Как существительное означает поездку или путешествие; как глагол — путешествовать или перемещаться."],
 "light":["свет; лампа; лёгкий; светлый; зажигать","/laɪt/","Может обозначать освещение, источник света, небольшой вес или светлый оттенок; как глагол — зажигать."],
 "charge":["плата; стоимость; заряд; обвинение; заряжать; поручать","/tʃɑːdʒ/","Значение зависит от контекста: деньги за услугу, электрический заряд, официальное обвинение или действие по зарядке."],
 "view":["вид; взгляд; мнение; смотреть; рассматривать","/vjuː/","Как существительное означает то, что видно, или точку зрения; как глагол — смотреть или рассматривать."],
 "occasion":["случай; событие; повод","/əˈkeɪ.ʒən/","Определённый случай, событие или обстоятельство, по которому что-либо происходит."],
 "damage":["ущерб; повреждение; вред; повреждать","/ˈdæm.ɪdʒ/","Вред или физическое повреждение; как глагол — причинять вред."],
 "goal":["цель; задача; гол","/ɡəʊl/","Результат, которого хотят достичь; в спорте — гол."],
 "herbs":["травы; зелень; лекарственные травы","/hɜːbz/","Растения, используемые в кулинарии, медицине или для аромата."]
};
const QUESTION_VOCAB={};
QUESTIONS.forEach(q=>{
 const v=q.vocab;
 if(Array.isArray(v)&&v.length>=2&&typeof v[0]==="string"&&typeof v[1]==="string"&&/[A-Za-z]/.test(v[0])){
  const key=v[0].toLowerCase().trim();
  if(key&&!QUESTION_VOCAB[key])QUESTION_VOCAB[key]=v.slice(1).filter(x=>typeof x==="string").join("; ");
 }
});
let dictionaryRequest=0;
function closeDictionary(){const dlg=$("dictionaryDialog");if(dlg.open)dlg.close();}
function dictionaryField(id,value){$(id).textContent=value||"Нет данных";}
async function openDictionary(raw){
 const term=String(raw||"").replace(/\s+/g," ").trim().slice(0,180);if(!term)return;
 dictionaryCurrentTerm=term;
 const dlg=$("dictionaryDialog");dictionaryField("dict-term",term);dictionaryField("dict-translation",QUESTION_VOCAB[term.toLowerCase()]||"Ищем варианты перевода…");dictionaryField("dict-ipa","Загружаем транскрипцию…");dictionaryField("dict-definition","Подбираем объяснение…");dictionaryField("dict-status","Для новых слов требуется интернет. Значения показываются с учётом доступных словарных данных.");
 setDictSaveButton();if(!state.vocabulary?.[term.toLowerCase()])$("dict-save").disabled=true;if(!dlg.open)dlg.showModal();const request=++dictionaryRequest;
 const local=DICT_LOCAL[term.toLowerCase()];
 if(local){dictionaryField("dict-translation",local[0]);dictionaryField("dict-ipa",local[1]);dictionaryField("dict-definition",local[2]);dictionaryField("dict-status","Встроенный словарь · доступно без интернета");setDictSaveButton();return;}
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);
 const fetchJson=(url)=>fetch(url,{signal:controller.signal}).then(r=>r.ok?r.json():null).catch(()=>null);
 try{
  const words=(term.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)||[]).slice(0,8);
  const singleWord=words.length===1&&/^[A-Za-z]+(?:['’-][A-Za-z]+)*$/.test(term);
  const translationPromise=fetchJson(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(term)}&langpair=en%7Cru`);
  const dictPromises=words.map(w=>fetchJson(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`));
  const datamusePromise=singleWord?fetchJson(`https://api.datamuse.com/words?sp=${encodeURIComponent(term)}&md=r&max=1`):Promise.resolve(null);
  const [tr,dictResults,datamuse]=await Promise.all([translationPromise,Promise.all(dictPromises),datamusePromise]);
  if(request!==dictionaryRequest||!dlg.open)return;
  const translations=[];
  const addTranslation=value=>{if(typeof value!=="string")return;value=value.replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();if(value&&value.toLowerCase()!==term.toLowerCase()&&!translations.some(x=>x.toLowerCase()===value.toLowerCase()))translations.push(value);};
  addTranslation(QUESTION_VOCAB[term.toLowerCase()]);
  addTranslation(tr?.responseData?.translatedText);
  (tr?.matches||[]).sort((a,b)=>(Number(b.match)||0)-(Number(a.match)||0)).forEach(m=>addTranslation(m.translation));
  dictionaryField("dict-translation",translations.length?translations.slice(0,7).join("; "):"Перевод не найден");
  const entries=dictResults.map(x=>Array.isArray(x)?x[0]:null).filter(Boolean);
  const phonetics=[];
  entries.forEach((entry,i)=>{const p=entry.phonetic||entry.phonetics?.find(x=>x.text)?.text;if(p)phonetics.push(words[i]&&words.length>1?`${words[i]} ${p}`:p);});
  if(!phonetics.length&&Array.isArray(datamuse)&&datamuse[0]?.tags){const pron=datamuse[0].tags.find(x=>x.startsWith("pron:"));if(pron)phonetics.push(pron.slice(5));}
  dictionaryField("dict-ipa",phonetics.length?phonetics.join(" · "):(singleWord?"Транскрипция не найдена в доступных словарях":"Транскрипция отдельных слов не найдена"));
  const definitions=[];
  entries.forEach(entry=>(entry.meanings||[]).forEach(meaning=>(meaning.definitions||[]).slice(0,2).forEach(d=>{if(d.definition&&!definitions.includes(d.definition))definitions.push(d.definition);})));
  let explanation=definitions.slice(0,3).join(" ");
  if(explanation){
   const defTr=await fetchJson(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(explanation.slice(0,450))}&langpair=en%7Cru`);
   if(request!==dictionaryRequest||!dlg.open)return;
   explanation=defTr?.responseData?.translatedText||explanation+" (объяснение на английском)";
   dictionaryField("dict-definition",explanation);
  }else dictionaryField("dict-definition","Подробное объяснение для этой фразы пока недоступно.");
  dictionaryField("dict-status",translations.length?"Словарная база NotiTest и онлайн-источники · проверь значение по контексту":"Нет результата перевода. Проверь интернет или попробуй выделить слово отдельно.");
  setDictSaveButton();
 }catch(e){if(request===dictionaryRequest){dictionaryField("dict-translation",QUESTION_VOCAB[term.toLowerCase()]||"Перевод временно недоступен");dictionaryField("dict-ipa","Транскрипция временно недоступна без словарного источника");dictionaryField("dict-definition","Попробуй подключиться к интернету, чтобы получить объяснение.");dictionaryField("dict-status","Онлайн-источник временно недоступен. Если перевод есть в банке заданий, его можно сохранить.");setDictSaveButton();}}finally{clearTimeout(timeout);}
}
$("dict-close").addEventListener("click",closeDictionary);
$("dict-save").addEventListener("click",saveCurrentDictionaryWord);$("dict-speak").addEventListener("click",()=>speakEnglish(dictionaryCurrentTerm));
$("dictionaryDialog").addEventListener("close",()=>{dictionaryRequest++;if("speechSynthesis"in window)window.speechSynthesis.cancel();});
$("dictionaryDialog").addEventListener("click",e=>{if(e.target===$("dictionaryDialog"))closeDictionary();});

const GRAMMAR_LESSONS=[
{id:"present-simple",title:"Present Simple",level:"A1",subtitle:"Привычки, факты и регулярные действия",theory:["Используй Present Simple для привычек, расписаний и общеизвестных фактов.","В утверждении с he / she / it обычно добавляй -s или -es к смысловому глаголу.","В вопросах и отрицаниях используй do / does; после does глагол возвращается к начальной форме."],examples:[["I study English every day.","Я изучаю английский каждый день."],["She works in a library.","Она работает в библиотеке."],["Does he like coffee?","Он любит кофе?"]],items:[
{q:"My brother ___ football every Saturday.",o:["play","plays","is play","playing"],a:1,e:"С подлежащим my brother (he) в Present Simple к глаголу добавляется -s."},
{q:"___ they live near the school?",o:["Does","Are","Do","Is"],a:2,e:"С подлежащим they в вопросе Present Simple используется do."},
{q:"Anna doesn't ___ meat.",o:["eats","eating","ate","eat"],a:3,e:"После doesn't используется начальная форма глагола без -s."}]},
{id:"present-continuous",title:"Present Continuous",level:"A1–A2",subtitle:"Действия, происходящие сейчас",theory:["Present Continuous описывает действие, происходящее сейчас или в текущий период.","Формула: am / is / are + глагол с окончанием -ing.","Не забывай выбирать форму be по подлежащему."],examples:[["I am reading now.","Я сейчас читаю."],["They are studying for an exam.","Они готовятся к экзамену."],["Is she sleeping?","Она спит?"]],items:[
{q:"Look! The children ___ in the garden.",o:["play","plays","are playing","is playing"],a:2,e:"The children означает they, поэтому нужна форма are + playing."},
{q:"I ___ my homework at the moment.",o:["do","am doing","does","did"],a:1,e:"At the moment указывает на действие сейчас: am doing."},
{q:"He ___ TV now.",o:["isn't watching","don't watch","aren't watching","not watches"],a:0,e:"С he используется isn't + глагол с -ing."}]},
{id:"past-simple",title:"Past Simple",level:"A2",subtitle:"Завершённые действия в прошлом",theory:["Past Simple используется для завершённых действий в прошлом.","Правильные глаголы обычно получают окончание -ed; неправильные имеют отдельную форму.","В вопросах и отрицаниях используй did, а после did ставь начальную форму глагола."],examples:[["We visited London last year.","Мы посетили Лондон в прошлом году."],["She went home early.","Она рано пошла домой."],["Did you see him?","Ты видел его?"]],items:[
{q:"They ___ the museum yesterday.",o:["visit","visited","have visited","are visiting"],a:1,e:"Yesterday обозначает завершённое действие в прошлом; visited это Past Simple."},
{q:"Did you ___ the message?",o:["received","receiving","receive","receives"],a:2,e:"После did используется начальная форма receive."},
{q:"He ___ to school last Monday.",o:["doesn't go","didn't went","not go","didn't go"],a:3,e:"Отрицание Past Simple: didn't + начальная форма go."}]},
{id:"present-perfect",title:"Present Perfect",level:"B1",subtitle:"Опыт и результат, связанный с настоящим",theory:["Present Perfect связывает прошлое с настоящим: важен опыт или результат сейчас.","Формула: have / has + третья форма глагола (V3).","Не используй Present Perfect с завершённым временем вроде yesterday или last year."],examples:[["I have lost my keys.","Я потерял ключи (и сейчас их нет)."],["She has never been to Spain.","Она никогда не была в Испании."],["We saw him yesterday.","Мы видели его вчера."]],items:[
{q:"She ___ already finished her project.",o:["have","has","is","did"],a:1,e:"С she используется has; Present Perfect строится has + V3."},
{q:"I ___ this film twice.",o:["saw","have seen","am seeing","see"],a:1,e:"Опыт без указания завершённого времени: have seen."},
{q:"We ___ to Kyiv last weekend.",o:["have gone","go","went","has gone"],a:2,e:"Last weekend это завершённое время в прошлом, поэтому нужен Past Simple went."}]},
{id:"articles",title:"Артикли a, an и the",level:"A1–B1",subtitle:"Как говорить о предметах и людях",theory:["A / an употребляются с исчисляемым существительным в единственном числе, когда предмет упоминается впервые или не конкретизирован.","An ставится перед гласным звуком, а не просто перед гласной буквой.","The указывает на конкретный или уже известный собеседникам предмет."],examples:[["I saw a dog. The dog was friendly.","Я увидел собаку. Эта собака была дружелюбной."],["She is an engineer.","Она инженер."],["The sun is bright.","Солнце яркое."]],items:[
{q:"I need ___ umbrella because it is raining.",o:["a","an","the","no article"],a:1,e:"Umbrella начинается с гласного звука, поэтому нужен an."},
{q:"I bought a book. ___ book is about space.",o:["A","An","The","No article"],a:2,e:"При повторном упоминании уже известной книги используется the."},
{q:"My sister is ___ doctor.",o:["a","an","the","no article"],a:0,e:"Профессия с исчисляемым существительным в единственном числе обычно требует a."}]},
{id:"prepositions",title:"Предлоги времени: in, on, at",level:"A2",subtitle:"Выбираем предлог для даты и времени",theory:["At используется с точным временем: at 7 o'clock, at noon.","On используется с днями и конкретными датами: on Monday, on 5 May.","In используется с месяцами, годами, сезонами и длительными периодами: in July, in 2026."],examples:[["at 8:30","в 8:30"],["on Friday","в пятницу"],["in September","в сентябре"]],items:[
{q:"Our lesson starts ___ 9 o'clock.",o:["in","on","at","by"],a:2,e:"С точным временем используется at."},
{q:"My birthday is ___ May.",o:["at","in","on","to"],a:1,e:"С месяцами используется in."},
{q:"We have a meeting ___ Tuesday.",o:["on","at","in","for"],a:0,e:"С днями недели используется on."}]},
{id:"some-any",title:"Some и any",level:"A2",subtitle:"Количество в вопросах и утверждениях",theory:["Some обычно используется в утвердительных предложениях.","Any часто используется в вопросах и отрицаниях.","Some также возможно в предложениях-вопросах, когда мы предлагаем что-либо или ожидаем согласия."],examples:[["There are some apples.","Есть несколько яблок."],["We don't have any milk.","У нас нет молока."],["Would you like some tea?","Хотите чаю?"]],items:[
{q:"There are ___ biscuits on the plate.",o:["any","some","much","a"],a:1,e:"В обычном утвердительном предложении с исчисляемым множественным числом обычно используется some."},
{q:"We haven't got ___ eggs.",o:["some","a","any","many of"],a:2,e:"В отрицательном предложении используется any."},
{q:"Would you like ___ coffee?",o:["some","any","many","an"],a:0,e:"В предложении-предложении вежливо используется some."}]},
{id:"modals",title:"Must и have to",level:"B1",subtitle:"Обязанность и необходимость",theory:["Must часто выражает сильную обязанность или личное убеждение говорящего.","Have to часто описывает необходимость, связанную с правилами или обстоятельствами.","Mustn't означает запрет, а don't have to означает отсутствие необходимости. Это разные значения."],examples:[["You must wear a seat belt.","Ты обязан пристегнуть ремень."],["I have to get up early for work.","Мне приходится рано вставать на работу."],["You don't have to come early.","Тебе необязательно приходить рано."]],items:[
{q:"You ___ smoke here. It is forbidden.",o:["don't have to","mustn't","must","have to"],a:1,e:"Mustn't выражает запрет."},
{q:"We ___ wear a uniform at this school; it is a rule.",o:["has to","mustn't","have to","doesn't have to"],a:2,e:"С we используется have to для обязанности по правилу."},
{q:"You ___ bring food. We have plenty.",o:["mustn't","don't have to","has to","must"],a:1,e:"Don't have to означает, что необходимости нет."}]}
];

const LISTENING_TASKS=[
{id:"cafe",level:"A1",title:"At the café",text:"Good morning. Could I have a cheese sandwich and a cup of tea, please? Of course. Would you like anything else? No, thank you. How much is it? It is six pounds.",question:"What does the customer order?",options:["A cheese sandwich and tea","A chicken salad and coffee","A cake and orange juice","Two cups of tea"],answer:0,explain:"The customer asks for a cheese sandwich and a cup of tea."},
{id:"station",level:"A2",title:"At the train station",text:"Attention, please. The ten fifteen train to Oxford will now leave from platform four. The train is delayed by twenty minutes. We apologise for the inconvenience.",question:"Which platform should passengers use?",options:["Platform two","Platform three","Platform four","Platform five"],answer:2,explain:"The announcement says that the train to Oxford will leave from platform four."},
{id:"weekend",level:"A2",title:"Weekend plans",text:"Hi, Emma. Are you free this weekend? On Saturday, I am going to visit the city museum with my cousin. On Sunday, I will stay at home and help my grandmother in the garden.",question:"What is the speaker planning to do on Saturday?",options:["Visit a city museum","Work in the garden","Stay at home","Meet a teacher"],answer:0,explain:"The speaker says that the museum visit is planned for Saturday."},
{id:"library",level:"B1",title:"A message from the library",text:"Hello, this is a reminder from Green Street Library. The books you borrowed are due back this Friday. You can return them using the box near the main entrance. The library will be closed on Sunday.",question:"When should the books be returned?",options:["On Thursday","On Friday","On Saturday","On Sunday"],answer:1,explain:"The reminder says that the books are due back this Friday."},
{id:"weather",level:"B1",title:"Weather report",text:"Tomorrow will start bright and cool. By lunchtime, clouds will move in from the west, and there may be heavy rain in the afternoon. If you are going out later, remember to take an umbrella.",question:"What does the speaker advise people to take?",options:["A warm hat","Sunglasses","An umbrella","A bottle of water"],answer:2,explain:"The weather report advises people to take an umbrella because rain is expected."}
];
const SPEAKING_PROMPTS=[
{level:"A1",title:"Приветствие",text:"Hello, my name is Alex."},
{level:"A1",title:"О себе",text:"I am learning English every day."},
{level:"A2",title:"Планы",text:"I would like to visit London next year."},
{level:"A2",title:"Свободное время",text:"In my free time, I enjoy reading books."},
{level:"B1",title:"Мнение",text:"I think learning a language takes time and practice."},
{level:"B1",title:"Опыт",text:"Last weekend, I went to the park with my friends."},
{level:"B1",title:"Цели",text:"My goal is to speak English more confidently."}
];
let listeningIndex=0,listeningSelected=null,listeningSubmitted=false,speakingIndex=0,speakingRecognition=null,speakingStatus="",speakingTranscript="";
let listeningStats={completed:0,correct:0};

let learnSection="vocab", reviewQueue=[], reviewIndex=0, reviewRevealed=false, lessonState=null, dictionaryCurrentTerm="";
function ensureLearningState(){
 state.vocabulary=state.vocabulary&&typeof state.vocabulary==="object"?state.vocabulary:{};
 state.lessonProgress=state.lessonProgress&&typeof state.lessonProgress==="object"?state.lessonProgress:{};
 state.listeningProgress=state.listeningProgress&&typeof state.listeningProgress==="object"?state.listeningProgress:{completed:0,correct:0};
 state.speakingProgress=state.speakingProgress&&typeof state.speakingProgress==="object"?state.speakingProgress:{attempts:0};
}
function dayKeyPlus(key,days){const [y,m,d]=key.split("-").map(Number),dt=new Date(Date.UTC(y,m-1,d+days));return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,"0")}-${String(dt.getUTCDate()).padStart(2,"0")}`;}
function isDueWord(w){return !w.dueAt||w.dueAt<=Date.now();}
function wordCount(){return Object.keys(state.vocabulary).length;}
function dueWords(){return Object.values(state.vocabulary).filter(isDueWord).sort((a,b)=>(a.dueAt||0)-(b.dueAt||0));}
function addVocabularyWord(term,translation,ipa,definition){
 ensureLearningState();const key=String(term||"").toLowerCase().trim();if(!key)return false;
 if(state.vocabulary[key])return false;
 state.vocabulary[key]={term,translation:translation||"Перевод уточняется",ipa:ipa||"Транскрипция уточняется",definition:definition||"Объяснение пока не добавлено.",createdAt:Date.now(),dueAt:Date.now(),interval:0,reps:0,lapses:0,lastRating:null};
 save();return true;
}
function renderLearn(){
 ensureLearningState();
 const tabs=[["vocab","Мой словарь"],["review","Повторение"],["grammar","Грамматика"],["listening","Аудирование"],["speaking","Произношение"]];
 $("learn-subnav").innerHTML=tabs.map(([id,label])=>`<button class="learn-subtab ${learnSection===id?"active":""}" data-learn-section="${id}">${label}</button>`).join("");
 $("learn-subnav").querySelectorAll("[data-learn-section]").forEach(b=>b.addEventListener("click",()=>{learnSection=b.dataset.learnSection;renderLearn();}));
 if(learnSection==="vocab")renderVocabulary();
 else if(learnSection==="review")renderReview();
 else if(learnSection==="listening")renderListening();
 else if(learnSection==="speaking")renderSpeaking();
 else renderGrammar();
}
function renderVocabulary(){
 const words=Object.values(state.vocabulary).sort((a,b)=>b.createdAt-a.createdAt),due=dueWords().length;
 $("learn-content").innerHTML=`<div class="learn-summary"><div><strong>${words.length}</strong><span>слов сохранено</span></div><div><strong>${due}</strong><span>пора повторить</span></div></div><div class="learn-actions"><button class="primary-button" id="startWordReview" ${due?"":"disabled"}>Повторить слова · ${due}</button></div>${words.length?`<div class="vocab-list">${words.map(w=>`<article class="vocab-item"><button class="vocab-open" data-vocab-open="${esc(w.term)}"><strong>${esc(w.term)}</strong><span>${esc(w.translation)}</span><small>${esc(w.ipa)}</small></button><button class="audio-button vocab-audio" data-speak="${esc(w.term)}" aria-label="Прослушать ${esc(w.term)}">🔊</button><button class="vocab-delete" data-vocab-delete="${esc(w.term)}" aria-label="Удалить ${esc(w.term)}">×</button></article>`).join("")}</div>`:'<div class="empty-state">Здесь пока пусто. Открой словарь у любого английского слова и нажми «Добавить в мой словарь».</div>'}`;
 $("startWordReview").addEventListener("click",startWordReview);
 $("learn-content").querySelectorAll("[data-vocab-open]").forEach(b=>b.addEventListener("click",()=>openDictionary(b.dataset.vocabOpen)));
 $("learn-content").querySelectorAll("[data-speak]").forEach(b=>b.addEventListener("click",()=>speakEnglish(b.dataset.speak)));
 $("learn-content").querySelectorAll("[data-vocab-delete]").forEach(b=>b.addEventListener("click",()=>{delete state.vocabulary[b.dataset.vocabDelete.toLowerCase()];save();renderVocabulary();}));
}
function startWordReview(){reviewQueue=dueWords().map(w=>w.term.toLowerCase());reviewIndex=0;reviewRevealed=false;learnSection="review";renderLearn();}
function renderReview(){
 const content=$("learn-content");
 if(!reviewQueue.length){const due=dueWords();if(!due.length){content.innerHTML=`<div class="empty-state">Все слова повторены. Новые карточки появятся здесь по расписанию.</div><button class="secondary-button" id="backToVocab">Мой словарь</button>`;content.querySelector("#backToVocab").onclick=()=>{learnSection="vocab";renderLearn();};return;}reviewQueue=due.map(w=>w.term.toLowerCase());reviewIndex=0;}
 if(reviewIndex>=reviewQueue.length){content.innerHTML=`<article class="completion-card"><div class="completion-icon">✓</div><h2>Повторение завершено</h2><p class="muted">Карточек обработано: ${reviewQueue.length}</p><button class="primary-button" id="reviewAgain">Вернуться к словарю</button></article>`;content.querySelector("#reviewAgain").onclick=()=>{reviewQueue=[];learnSection="vocab";renderLearn();};return;}
 const w=state.vocabulary[reviewQueue[reviewIndex]];
 if(!w){reviewIndex++;renderReview();return;}
 content.innerHTML=`<article class="review-card"><div class="review-meta"><span>КАРТОЧКА ${reviewIndex+1} ИЗ ${reviewQueue.length}</span><span>${w.reps||0} повторений</span></div><h2>${esc(w.term)}</h2><button class="audio-button" id="reviewSpeak">🔊 Прослушать слово</button><p class="review-ipa">${esc(w.ipa)}</p>${reviewRevealed?`<div class="review-answer"><h3>${esc(w.translation)}</h3><p>${esc(w.definition)}</p></div>`:'<p class="muted">Вспомни перевод, затем открой ответ.</p>'}<button class="secondary-button full" id="revealWord" ${reviewRevealed?"hidden":""}>Показать ответ</button>${reviewRevealed?`<div class="rating-buttons"><button data-rating="again">Не помню</button><button data-rating="hard">Трудно</button><button data-rating="good">Хорошо</button><button data-rating="easy">Легко</button></div>`:""}</article>`;
 content.querySelector("#reviewSpeak").onclick=()=>speakEnglish(w.term);const reveal=content.querySelector("#revealWord");if(reveal)reveal.onclick=()=>{reviewRevealed=true;renderReview();};
 content.querySelectorAll("[data-rating]").forEach(b=>b.addEventListener("click",()=>rateWord(w.term,b.dataset.rating)));
}
function rateWord(term,rating){
 const key=term.toLowerCase(),w=state.vocabulary[key];if(!w)return;
 const now=Date.now();w.reps=(w.reps||0)+1;w.lastRating=rating;
 if(rating==="again"){w.lapses=(w.lapses||0)+1;w.interval=0;w.dueAt=now+10*60*1000;}
 else if(rating==="hard"){w.interval=Math.max(1,Math.round((w.interval||1)*1.2));w.dueAt=now+w.interval*86400000;}
 else if(rating==="good"){w.interval=w.interval?Math.max(2,Math.round(w.interval*2.2)):1;w.dueAt=now+w.interval*86400000;}
 else{w.interval=w.interval?Math.max(4,Math.round(w.interval*2.8)):4;w.dueAt=now+w.interval*86400000;}
 save();reviewIndex++;reviewRevealed=false;renderReview();
}

function speakEnglish(text,rate=0.88){
 if(!("speechSynthesis" in window)){alert("Озвучивание не поддерживается этим браузером.");return;}
 window.speechSynthesis.cancel();
 const utterance=new SpeechSynthesisUtterance(String(text||""));
 utterance.lang="en-US";utterance.rate=rate;utterance.pitch=1;
 const voices=window.speechSynthesis.getVoices();
 const voice=voices.find(v=>/^en-GB/i.test(v.lang))||voices.find(v=>/^en-US/i.test(v.lang))||voices.find(v=>/^en/i.test(v.lang));
 if(voice)utterance.voice=voice;
 window.speechSynthesis.speak(utterance);
}
function renderListening(){
 const content=$("learn-content"),task=LISTENING_TASKS[listeningIndex];
 if(!task){content.innerHTML='<p class="empty-state">Аудиотренировка пока недоступна.</p>';return;}
 const stats=state.listeningProgress||{completed:0,correct:0};
 content.innerHTML=`<div class="audio-overview"><div><strong>${stats.completed||0}</strong><span>прослушиваний завершено</span></div><div><strong>${stats.completed?Math.round((stats.correct||0)/stats.completed*100):0}%</strong><span>точность ответов</span></div></div><article class="audio-lesson-card"><div class="audio-card-top"><span class="lesson-level">${task.level}</span><span class="muted small">АУДИРОВАНИЕ · ${listeningIndex+1}/${LISTENING_TASKS.length}</span></div><h2>${esc(task.title)}</h2><p class="muted">Послушай запись и ответь на вопрос. Текст появится после проверки.</p><button class="primary-button full audio-play" id="listenPlay">▶ Прослушать запись</button><div class="audio-secondary-actions"><button class="secondary-button" id="listenSlow">🐢 Медленнее</button><button class="secondary-button" id="listenAgain">↻ Повторить</button></div>${listeningSubmitted?`<div class="listening-transcript"><strong>Текст аудио</strong><p>${esc(task.text)}</p></div>`:""}<div class="listening-question"><h3>${esc(task.question)}</h3><div class="lesson-options">${task.options.map((o,i)=>`<button class="lesson-option ${listeningSubmitted&&i===task.answer?"correct":""} ${listeningSubmitted&&listeningSelected===i&&i!==task.answer?"wrong":""}" data-listen-choice="${i}" ${listeningSubmitted?"disabled":""}>${esc(o)}</button>`).join("")}</div>${listeningSubmitted?`<div class="feedback show"><p>${esc(task.explain)}</p><p>${listeningSelected===task.answer?"Отлично, ты понял запись!":"Попробуй ещё раз позже и обрати внимание на ключевые слова."}</p></div>`:""}<button class="primary-button full" id="listenAction" ${listeningSelected===null&&!listeningSubmitted?"disabled":""}>${listeningSubmitted?(listeningIndex===LISTENING_TASKS.length-1?"Завершить раздел":"Следующая запись"):"Проверить ответ"}</button></div></article>`;
 content.querySelector("#listenPlay").onclick=()=>speakEnglish(task.text,0.9);
 content.querySelector("#listenAgain").onclick=()=>speakEnglish(task.text,0.9);
 content.querySelector("#listenSlow").onclick=()=>speakEnglish(task.text,0.72);
 content.querySelectorAll("[data-listen-choice]").forEach(b=>b.onclick=()=>{if(listeningSubmitted)return;listeningSelected=Number(b.dataset.listenChoice);renderListening();});
 content.querySelector("#listenAction").onclick=()=>{
  if(!listeningSubmitted&&listeningSelected!==null){
   listeningSubmitted=true;const p=state.listeningProgress||{completed:0,correct:0};p.completed=(p.completed||0)+1;if(listeningSelected===task.answer)p.correct=(p.correct||0)+1;state.listeningProgress=p;save();renderListening();
  }else if(listeningSubmitted){
   if(listeningIndex<LISTENING_TASKS.length-1){listeningIndex++;listeningSelected=null;listeningSubmitted=false;renderListening();}
   else{content.innerHTML=`<article class="completion-card"><div class="completion-icon">🎧</div><h2>Аудирование завершено</h2><p class="muted">Ты прошёл все ${LISTENING_TASKS.length} записи. Можно повторить раздел, чтобы закрепить понимание на слух.</p><button class="primary-button full" id="listenRestart">Повторить аудирование</button></article>`;content.querySelector("#listenRestart").onclick=()=>{listeningIndex=0;listeningSelected=null;listeningSubmitted=false;renderListening();};}
  }
 };
}
function normalizeSpeech(s){return String(s||"").toLowerCase().replace(/[^a-z0-9'\s]/g," ").replace(/\s+/g," ").trim();}
function renderSpeaking(){
 const content=$("learn-content"),item=SPEAKING_PROMPTS[speakingIndex];
 content.innerHTML=`<div class="audio-overview"><div><strong>${state.speakingProgress?.attempts||0}</strong><span>попыток произношения</span></div><div><strong>${speakingIndex+1}/${SPEAKING_PROMPTS.length}</strong><span>фраз в тренировке</span></div></div><article class="speaking-card"><span class="lesson-level">${item.level}</span><p class="muted small">ПРОИЗНОШЕНИЕ · ПОВТОРИ ВСЛУХ</p><h2>${esc(item.title)}</h2><p class="speaking-target">${esc(item.text)}</p><button class="secondary-button full" id="speakModel">🔊 Послушать пример</button><button class="primary-button full" id="startSpeech">🎙 Начать запись</button><p class="speech-status" id="speechStatus">${esc(speakingStatus||"Нажми запись и произнеси фразу на английском.")}</p>${speakingTranscript?`<div class="speech-result"><strong>Распознано браузером</strong><p>${esc(speakingTranscript)}</p><span>${normalizeSpeech(speakingTranscript)===normalizeSpeech(item.text)?"Фраза распознана полностью.":"Сравни распознанный текст с образцом и попробуй ещё раз."}</span></div>`:""}<div class="audio-secondary-actions"><button class="secondary-button" id="speechPrev" ${speakingIndex===0?"disabled":""}>← Предыдущая</button><button class="secondary-button" id="speechNext">${speakingIndex===SPEAKING_PROMPTS.length-1?"Начать сначала":"Следующая фраза →"}</button></div><p class="muted small">Распознавание зависит от браузера и может потребовать разрешение на микрофон. Результат показывает распознанный текст, а не точную оценку акцента.</p></article>`;
 content.querySelector("#speakModel").onclick=()=>speakEnglish(item.text,0.82);
 content.querySelector("#startSpeech").onclick=()=>{
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Recognition){speakingStatus="Этот браузер не поддерживает распознавание речи. Послушай пример и повтори фразу вслух самостоятельно.";renderSpeaking();return;}
  if(speakingRecognition){try{speakingRecognition.abort();}catch(e){}}
  speakingTranscript="";speakingStatus="Слушаю… произнеси фразу после сигнала браузера.";renderSpeaking();
  const recognition=new Recognition();speakingRecognition=recognition;recognition.lang="en-US";recognition.interimResults=false;recognition.maxAlternatives=1;
  recognition.onresult=e=>{speakingTranscript=e.results?.[0]?.[0]?.transcript||"";speakingStatus="Готово. Сравни результат с образцом.";state.speakingProgress=state.speakingProgress||{attempts:0};state.speakingProgress.attempts++;save();renderSpeaking();};
  recognition.onerror=e=>{speakingStatus=e.error==="not-allowed"?"Нет доступа к микрофону. Разреши его в настройках браузера.":`Не удалось распознать речь (${e.error}). Попробуй ещё раз.`;renderSpeaking();};
  recognition.onend=()=>{if(speakingStatus==="Слушаю… произнеси фразу после сигнала браузера."){speakingStatus="Запись завершена. Если текст не появился, попробуй ещё раз.";renderSpeaking();}};
  try{recognition.start();}catch(e){speakingStatus="Не удалось начать запись. Попробуй ещё раз.";renderSpeaking();}
 };
 content.querySelector("#speechPrev").onclick=()=>{if(speakingIndex>0)speakingIndex--;speakingTranscript="";speakingStatus="";renderSpeaking();};
 content.querySelector("#speechNext").onclick=()=>{speakingIndex=speakingIndex===SPEAKING_PROMPTS.length-1?0:speakingIndex+1;speakingTranscript="";speakingStatus="";renderSpeaking();};
}

function renderGrammar(){
 const content=$("learn-content");
 if(lessonState){renderLesson();return;}
 content.innerHTML=`<div class="lesson-intro"><h2>Мини-уроки грамматики</h2><p class="muted">Короткое объяснение, примеры и три упражнения после каждого урока.</p></div><div class="lesson-list">${GRAMMAR_LESSONS.map(l=>{const p=state.lessonProgress[l.id];return `<button class="lesson-card" data-lesson="${l.id}"><span class="lesson-level">${l.level}</span><strong>${l.title}</strong><span>${l.subtitle}</span><small>${p?`Последний результат: ${p.correct}/${p.total}`:"3 практических задания"}</small></button>`;}).join("")}</div>`;
 content.querySelectorAll("[data-lesson]").forEach(b=>b.addEventListener("click",()=>{lessonState={id:b.dataset.lesson,index:-1,selected:null,answers:[]};renderGrammar();}));
}
function renderLesson(){
 const l=GRAMMAR_LESSONS.find(x=>x.id===lessonState.id),content=$("learn-content");
 if(lessonState.index===-1){
  content.innerHTML=`<button class="text-back" id="lessonBack">← Все уроки</button><article class="lesson-detail"><span class="lesson-level">${l.level}</span><h2>${l.title}</h2><p class="muted">${l.subtitle}</p><h3>Коротко о правиле</h3><ul>${l.theory.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><h3>Примеры</h3><div class="lesson-examples">${l.examples.map(([en,ru])=>`<div><strong>${esc(en)}</strong><span>${esc(ru)}</span></div>`).join("")}</div><button class="primary-button full" id="beginLesson">Перейти к упражнениям</button></article>`;
  content.querySelector("#lessonBack").onclick=()=>{lessonState=null;renderGrammar();};content.querySelector("#beginLesson").onclick=()=>{lessonState.index=0;lessonState.selected=null;renderLesson();};return;
 }
 if(lessonState.index>=l.items.length){
  const correct=lessonState.answers.filter(Boolean).length;state.lessonProgress[l.id]={correct,total:l.items.length,completedAt:Date.now()};save();
  content.innerHTML=`<article class="completion-card"><div class="completion-icon">✓</div><h2>Урок завершён</h2><div class="score">${correct} / ${l.items.length}</div><p class="muted">Правильных ответов</p><button class="primary-button full" id="lessonFinish">К списку уроков</button></article>`;
  content.querySelector("#lessonFinish").onclick=()=>{lessonState=null;renderGrammar();};return;
 }
 const item=l.items[lessonState.index],answered=lessonState.selected!==null;
 content.innerHTML=`<button class="text-back" id="lessonBack">← К уроку</button><div class="lesson-progress"><span>Упражнение ${lessonState.index+1} из ${l.items.length}</span><div class="mini-track"><div class="mini-fill" style="width:${(lessonState.index+1)/l.items.length*100}%"></div></div></div><article class="lesson-exercise"><h2>${esc(item.q)}</h2><div class="lesson-options">${item.o.map((o,i)=>`<button class="lesson-option ${answered&&lessonState.selected===i?"selected":""} ${answered&&i===item.a?"correct":""} ${answered&&lessonState.selected===i&&i!==item.a?"wrong":""}" data-lesson-choice="${i}" ${answered?"disabled":""}>${esc(o)}</button>`).join("")}</div>${answered?`<div class="feedback show"><p>${esc(item.e)}</p></div>`:""}<button class="primary-button full" id="lessonAction" ${answered?"":"disabled"}>${lessonState.index===l.items.length-1?"Завершить урок":"Следующее упражнение"}</button></article>`;
 content.querySelector("#lessonBack").onclick=()=>{lessonState.index=-1;lessonState.selected=null;renderLesson();};
 content.querySelectorAll("[data-lesson-choice]").forEach(b=>b.onclick=()=>{lessonState.selected=Number(b.dataset.lessonChoice);lessonState.answers[lessonState.index]=lessonState.selected===item.a;renderLesson();});
 content.querySelector("#lessonAction").onclick=()=>{lessonState.index++;lessonState.selected=null;renderLesson();};
}
function setDictSaveButton(){
 const button=$("dict-save");if(!button)return;
 const saved=!!state.vocabulary?.[dictionaryCurrentTerm.toLowerCase()];
 button.textContent=saved?"✓ В моём словаре":"＋ Добавить в мой словарь";
 button.disabled=saved;
}
function saveCurrentDictionaryWord(){
 const term=dictionaryCurrentTerm;if(!term)return;
 const ok=addVocabularyWord(term,$("dict-translation").textContent,$("dict-ipa").textContent,$("dict-definition").textContent);
 setDictSaveButton();
 dictionaryField("dict-status",ok?"Слово добавлено в личный словарь.":"Это слово уже есть в личном словаре.");
}

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
document.addEventListener("visibilitychange",()=>{if(!document.hidden){checkDailyRollover();scheduleFact();}else if("speechSynthesis"in window){window.speechSynthesis.cancel();}});
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