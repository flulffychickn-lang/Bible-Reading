const BOOKS=[
["Matthew",28],["Mark",16],["Luke",24],["John",21],["Acts",28],["Romans",16],["1 Corinthians",16],["2 Corinthians",13],["Galatians",6],["Ephesians",6],["Philippians",4],["Colossians",4],["1 Thessalonians",5],["2 Thessalonians",3],["1 Timothy",6],["2 Timothy",4],["Titus",3],["Philemon",1],["Hebrews",13],["James",5],["1 Peter",5],["2 Peter",3],["1 John",5],["2 John",1],["3 John",1],["Jude",1],["Revelation",22]
];
const KEY="chapterByChapterNT_v1";
let data={completed:{},dates:{},goal:3,theme:"dark",userName:"",lectures:[]};
let activeChapter={book:"Matthew",chapter:1}, editingLectureId=null, selectedLectureId=null;
let sharedViewerMode=false, sharedViewerLectures=[], selectedSharedLecture=null;
const $=id=>document.getElementById(id), chapterKey=(b,c)=>`${b}|${c}`;
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
function load(){try{const saved=JSON.parse(localStorage.getItem(KEY)||"null");if(saved)data={...data,...saved};if(!Array.isArray(data.lectures))data.lectures=[];}catch(e){console.warn(e)}}
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function countBook(book){return BOOKS.find(x=>x[0]===book)?.[1]||0}
function isDone(book,chapter){return !!data.completed[chapterKey(book,chapter)]}
function renderReading(){
 const book=$("progressBook").value||BOOKS[0][0], count=countBook(book);
 $("selectedBookTitle").textContent=book;
 let done=0;const grid=$("booksGrid");grid.innerHTML="";
 for(let c=1;c<=count;c++){if(isDone(book,c))done++;
  const btn=document.createElement("button");btn.type="button";btn.className="chapter"+(isDone(book,c)?" done":"");btn.textContent=c;
  btn.setAttribute("aria-label",`${book}, chapter ${c}, ${isDone(book,c)?"Done":"Not done"}`);btn.title=`${book} ${c}: ${isDone(book,c)?"Done":"Not done"}`;
  btn.addEventListener("click",()=>openChapter(book,c));grid.append(btn);
 }
 $("bookProgressText").textContent=`${done} of ${count} chapters read`;
 $("bookProgressBar").style.width=`${done/count*100}%`;
 const totalDone=Object.values(data.completed).filter(Boolean).length;
 $("chaptersRead").textContent=totalDone;$("overallBar").style.width=`${totalDone/260*100}%`;$("percent").textContent=`${Math.round(totalDone/260*100)}%`;
}
function openChapter(book,chapter){
 activeChapter={book,chapter};const k=chapterKey(book,chapter);
 $("dialogTitle").textContent=`${book} — Chapter ${chapter}`;$("chapterDate").value=data.dates[k]||today();
 $("markDoneBtn").textContent=isDone(book,chapter)?"✓ Done (saved)":"✓ Done";
 $("chapterDialog").showModal();
}
function markDone(){
 const k=chapterKey(activeChapter.book,activeChapter.chapter);
 data.completed[k]=true;data.dates[k]=$("chapterDate").value||today();save();$("chapterDialog").close();renderReading();
}
function markNotDone(){
 const k=chapterKey(activeChapter.book,activeChapter.chapter);
 delete data.completed[k];delete data.dates[k];save();$("chapterDialog").close();renderReading();
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function renderLectures(){
 const host=$("lectureCards");host.innerHTML="";
 const lectures=[...data.lectures].sort((a,b)=>(b.date||"").localeCompare(a.date||""));
 $("emptyLectures").hidden=lectures.length>0;
 lectures.forEach(item=>{
  const card=document.createElement("button");card.type="button";card.className="lecture-card";
  const title=document.createElement("strong");title.textContent=item.title;
  const date=document.createElement("time");date.textContent=item.date||"No date";
  const excerpt=document.createElement("p");excerpt.textContent=item.learning.length>140?item.learning.slice(0,140)+"…":item.learning;
  card.append(title,date,excerpt);card.addEventListener("click",()=>openLectureDetail(item.id));host.append(card);
 });
}
function openLectureForm(item=null){
 editingLectureId=item?.id||null;$("lectureDialogHeading").textContent=item?"Edit Lecture":"Add Lecture";
 $("lectureTitle").value=item?.title||"";$("lectureDate").value=item?.date||today();$("lectureLearning").value=item?.learning||"";
 $("lectureDialog").showModal();
}
function saveLecture(){
 const title=$("lectureTitle").value.trim(),learning=$("lectureLearning").value.trim();
 if(!title){alert("Please enter a lecture title.");$("lectureTitle").focus();return}
 if(!learning){alert("Please enter what you learned.");$("lectureLearning").focus();return}
 if(editingLectureId){const item=data.lectures.find(x=>x.id===editingLectureId);if(item){item.title=title;item.date=$("lectureDate").value||today();item.learning=learning}}
 else data.lectures.push({id:`${Date.now()}-${Math.random().toString(16).slice(2)}`,title,date:$("lectureDate").value||today(),learning});
 save();renderLectures();$("lectureDialog").close();
}
function openLectureDetail(id){
 selectedLectureId=id;const item=data.lectures.find(x=>x.id===id);if(!item)return;
 $("lectureDetailTitle").textContent=item.title;$("lectureDetailDate").textContent=item.date||"No date";$("lectureDetailBody").textContent=item.learning;
 $("lectureDetailDialog").showModal();
}
$("editLectureBtn").onclick=()=>{const item=data.lectures.find(x=>x.id===selectedLectureId);$("lectureDetailDialog").close();if(item)openLectureForm(item)};
function buildShareUrl(param,payload){
 const encoded=btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
 const url=new URL(window.location.href);url.search="";url.hash="";
 url.searchParams.set(param,encoded);return url.toString();
}
async function offerShareLink(title,shareUrl){
 if(navigator.share){
  try{await navigator.share({title,text:title,url:shareUrl});return}catch(err){if(err&&err.name==="AbortError")return}
 }
 if(navigator.clipboard&&navigator.clipboard.writeText){
  try{await navigator.clipboard.writeText(shareUrl);alert("Share link copied. Send it to the person you want to share this with.");return}catch(err){}
 }
 prompt("Copy this share link:",shareUrl);
}
function shareLectureOnline(){
 const item=data.lectures.find(x=>x.id===selectedLectureId);if(!item)return;
 offerShareLink(item.title,buildShareUrl("sharedLecture",{title:item.title,date:item.date||"",learning:item.learning||""}));
}
async function shareAllLectures(){
 if(!data.lectures.length){alert("Add a lecture first before sharing your lecture collection.");return}
 const payload=data.lectures.map(x=>({title:x.title,date:x.date||"",learning:x.learning||""}));
 await offerShareLink("Shared Bible Lectures",buildShareUrl("sharedLectures",payload));
}
$("shareLectureBtn").onclick=shareLectureOnline;
$("copyLectureBtn").onclick=async()=>{
 const item=data.lectures.find(x=>x.id===selectedLectureId);if(!item)return;
 const text=`${item.title}${item.date?"\\n"+item.date:""}\\n\\n${item.learning}`;
 try{await navigator.clipboard.writeText(text);alert("Lecture copied. You can paste it anywhere.");}
 catch(err){prompt("Copy the lecture text:",text)}
};
$("shareAllLecturesBtn").onclick=shareAllLectures;
$("deleteLectureBtn").onclick=()=>{if(!confirm("Delete this lecture?"))return;data.lectures=data.lectures.filter(x=>x.id!==selectedLectureId);save();renderLectures();$("lectureDetailDialog").close()};
$("addLectureBtn").onclick=()=>openLectureForm();$("saveLectureBtn").onclick=saveLecture;
$("cancelLectureBtn").onclick=()=>$("lectureDialog").close();
$("markDoneBtn").onclick=markDone;$("markNotDoneBtn").onclick=markNotDone;
$("progressBook").innerHTML=BOOKS.map(([b])=>`<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join("");
$("progressBook").onchange=renderReading;
document.querySelectorAll(".nav-button").forEach(btn=>btn.addEventListener("click",()=>{
 document.querySelectorAll(".nav-button").forEach(b=>b.classList.toggle("active",b===btn));
 document.querySelectorAll(".tab-view").forEach(view=>{const active=view.id===btn.dataset.tab;view.hidden=!active;view.classList.toggle("active",active)});
}));
$("themeBtn").onclick=()=>{document.body.classList.toggle("light");data.theme=document.body.classList.contains("light")?"light":"dark";save()};
function exportBackup(){
 if(typeof XLSX==="undefined"){alert("Excel backup needs an internet connection to load the Excel library.");return}
 const wb=XLSX.utils.book_new(),tracker=[["Book","Chapter","Status","Reading Date"]];
 BOOKS.forEach(([book,count])=>{for(let c=1;c<=count;c++){const k=chapterKey(book,c);tracker.push([book,c,isDone(book,c)?"Completed":"Not done",data.dates[k]||""])}})
 XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(tracker),"Chapter Tracker");
 const lectures=[["Title","Date","Learning"]];data.lectures.forEach(x=>lectures.push([x.title,x.date,x.learning]));
 XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(lectures),"Lectures");
 XLSX.writeFile(wb,"Bible_Reading_Backup.xlsx");
}
$("exportBtn").onclick=exportBackup;
$("importInput").addEventListener("change",async e=>{
 const file=e.target.files[0];if(!file)return;
 if(typeof XLSX==="undefined"){alert("Excel import needs an internet connection to load the Excel library.");e.target.value="";return}
 try{
  const wb=XLSX.read(await file.arrayBuffer(),{type:"array"}),sheet=wb.Sheets["Chapter Tracker"];
  if(!sheet)throw new Error("The workbook does not contain a Chapter Tracker sheet.");
  const imported={completed:{},dates:{},goal:data.goal,theme:data.theme,lectures:[]};
  XLSX.utils.sheet_to_json(sheet,{defval:""}).forEach(r=>{
   const book=String(r.Book||""),chapter=Number(r.Chapter);if(!countBook(book)||!Number.isInteger(chapter)||chapter<1||chapter>countBook(book))return;
   const k=chapterKey(book,chapter);if(String(r.Status).toLowerCase()==="completed"||String(r.Status).toLowerCase()==="done")imported.completed[k]=true;
   if(r["Reading Date"])imported.dates[k]=String(r["Reading Date"]).slice(0,10);
  });
  const lectureSheet=wb.Sheets["Lectures"];if(lectureSheet)XLSX.utils.sheet_to_json(lectureSheet,{defval:""}).forEach(r=>{if(String(r.Title||"").trim())imported.lectures.push({id:`${Date.now()}-${Math.random().toString(16).slice(2)}`,title:String(r.Title),date:String(r.Date||""),learning:String(r.Learning||"")})});
  if(!confirm("Import this backup and replace the reading progress and lectures saved in this browser?"))return;
  data={...data,...imported};save();renderReading();renderLectures();alert("Backup imported successfully.");
 }catch(err){alert("Could not import this workbook: "+err.message)}finally{e.target.value=""}
});
function currentVerseReference(){
 const book=$("verseBook").value,chapter=Number($("verseChapter").value),start=Number($("verseStart").value);
 if(!countBook(book)||!Number.isInteger(chapter)||chapter<1||chapter>countBook(book)){alert(`Choose a chapter from 1 to ${countBook(book)} for ${book}.`);return null}
 if(!Number.isInteger(start)||start<1){alert("Enter a valid starting verse.");return null}
 return `${book} ${chapter}:${start}`;
}
function insertAtCursor(textarea,text){
 const start=textarea.selectionStart??textarea.value.length,end=textarea.selectionEnd??textarea.value.length;
 const before=textarea.value.slice(0,start),after=textarea.value.slice(end);
 const prefix=before&& !before.endsWith("\\n")?"\\n":"";
 const suffix=after&& !after.startsWith("\\n")?"\\n":"";
 textarea.value=before+prefix+text+suffix+after;
 textarea.focus();const pos=(before+prefix+text).length;textarea.setSelectionRange(pos,pos);
}
$("verseBook").innerHTML=BOOKS.map(([b])=>`<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join("");
$("verseChapter").max=28;
$("verseBook").addEventListener("change",()=>{$("verseChapter").max=countBook($("verseBook").value);if(Number($("verseChapter").value)>countBook($("verseBook").value))$("verseChapter").value=1});
$("insertVerseBtn").onclick=()=>{const ref=currentVerseReference();if(ref)insertAtCursor($("lectureLearning"),ref)};
$("copyVerseBtn").onclick=async()=>{const ref=currentVerseReference();if(!ref)return;try{await navigator.clipboard.writeText(ref);alert(`${ref} copied.`)}catch(err){prompt("Copy this Bible reference:",ref)}};
const nivBookNames=BOOKS.map(([name])=>name);
function renderNivChapters(){
 const book=$("nivReaderBook").value||"Matthew";
 const chapters=window.NIV_NEW_TESTAMENT?.[book]||[];
 $("nivReaderChapter").innerHTML=chapters.map((_,i)=>`<option value="${i+1}">Chapter ${i+1}</option>`).join("");
 const requested=Number($("verseChapter").value)||1;
 $("nivReaderChapter").value=String(Math.min(requested,chapters.length)||1);
 renderNivChapter();
}
function renderNivChapter(){
 const book=$("nivReaderBook").value||"Matthew";
 const chapter=Number($("nivReaderChapter").value)||1;
 const verses=window.NIV_NEW_TESTAMENT?.[book]?.[chapter-1]||[];
 $("nivBookText").innerHTML=verses.map(v=>`<p class="niv-verse"><span class="niv-verse-text"><sup>${v.n}</sup> ${escapeHtml(v.t)}</span><button type="button" class="button niv-copy-verse" data-verse="${v.n}" title="Copy verse ${v.n}" aria-label="Copy verse ${v.n}">Copy</button></p>`).join("")||"No text available for this chapter.";
}
async function copyBibleText(text,label){
 try{await navigator.clipboard.writeText(text);}
 catch(err){const box=document.createElement("textarea");box.value=text;box.style.position="fixed";box.style.opacity="0";document.body.append(box);box.select();const ok=document.execCommand("copy");box.remove();if(!ok){prompt(`Copy ${label}:`,text);return;}}
 const button=document.activeElement;
 if(button&&button.tagName==="BUTTON"){const old=button.textContent;button.textContent="Copied!";setTimeout(()=>button.textContent=old,1200);}
}
$("nivBookText").addEventListener("click",e=>{
 const button=e.target.closest(".niv-copy-verse");if(!button)return;
 const book=$("nivReaderBook").value,chapter=Number($("nivReaderChapter").value),verseNo=Number(button.dataset.verse);
 const verse=window.NIV_NEW_TESTAMENT?.[book]?.[chapter-1]?.find(v=>v.n===verseNo);if(!verse)return;
 copyBibleText(`${book} ${chapter}:${verseNo} — ${verse.t}`,"verse text");
});
$("copyNivChapterBtn").addEventListener("click",()=>{
 const book=$("nivReaderBook").value,chapter=Number($("nivReaderChapter").value),verses=window.NIV_NEW_TESTAMENT?.[book]?.[chapter-1]||[];
 if(!verses.length)return;
 copyBibleText(`${book} ${chapter}\n\n${verses.map(v=>`${v.n} ${v.t}`).join("\n")}`,"chapter text");
});
$("nivReaderBook").innerHTML=nivBookNames.map(b=>`<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join("");
$("nivReaderBook").addEventListener("change",renderNivChapters);
$("nivReaderChapter").addEventListener("change",renderNivChapter);
$("verseBook").addEventListener("change",()=>{const b=$("verseBook").value;$("nivReaderBook").value=b;renderNivChapters()});
$("verseChapter").addEventListener("change",()=>{const max=countBook($("verseBook").value);const c=Math.max(1,Math.min(Number($("verseChapter").value)||1,max));$("verseChapter").value=c;$("nivReaderBook").value=$("verseBook").value;renderNivChapters();$("nivReaderChapter").value=String(c);renderNivChapter()});
renderNivChapters();
load();if(data.theme==="light")document.body.classList.add("light");$("progressBook").value="Matthew";renderReading();renderLectures();
function openSharedLectureDetail(item){
 selectedSharedLecture=item;selectedLectureId=null;
 $("lectureDetailTitle").textContent=item.title||"Untitled lecture";
 $("lectureDetailDate").textContent=item.date||"No date";
 $("lectureDetailBody").textContent=item.learning||"";
 $("copyLectureBtn").hidden=false;
 $("editLectureBtn").hidden=true;$("deleteLectureBtn").hidden=true;$("shareLectureBtn").hidden=true;
 $("lectureDetailDialog").showModal();
}
function renderSharedLectureCards(){
 const host=$("lectureCards");host.innerHTML="";
 $("emptyLectures").hidden=sharedViewerLectures.length>0;
 $("emptyLectures").textContent="No lecture cards were found in this shared link. Ask the sender to create a new share link.";
 sharedViewerLectures.forEach((item,index)=>{
  const card=document.createElement("button");card.type="button";card.className="lecture-card";
  const title=document.createElement("strong");title.textContent=item.title||"Untitled lecture";
  const date=document.createElement("time");date.textContent=item.date||"No date";
  const excerpt=document.createElement("p");const learning=String(item.learning||item.notes||"");excerpt.textContent=learning.length>180?learning.slice(0,180)+"…":learning;
  const hint=document.createElement("span");hint.className="shared-card-hint";hint.textContent="Tap to open lecture →";
  card.append(title,date,excerpt,hint);card.addEventListener("click",()=>openSharedLectureDetail(sharedViewerLectures[index]));host.append(card);
 });
}
function decodeSharedPayload(raw){
 if(!raw)return null;
 const attempts=[raw];
 try{attempts.push(decodeURIComponent(raw))}catch(e){}
 for(const candidate of attempts){
  for(const normalized of [candidate,candidate.replace(/ /g,"+")]){
   try{return JSON.parse(decodeURIComponent(escape(atob(normalized))))}catch(e){}
   try{return JSON.parse(atob(normalized))}catch(e){}
   try{return JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(normalized))))) }catch(e){}
  }
  try{return JSON.parse(candidate)}catch(e){}
 }
 return null;
}
(function openSharedLectureFromLink(){
 const params=new URLSearchParams(window.location.search);
 const single=params.get("sharedLecture"),multiple=params.get("sharedLectures");
 if(!single&&!multiple)return;
 const shared=decodeSharedPayload(single||multiple);
 enableSharedViewerMode();
 sharedViewerLectures=Array.isArray(shared)?shared:(shared&&Array.isArray(shared.lectures)?shared.lectures:(shared&&shared.title?[shared]:[]));
 sharedViewerLectures=sharedViewerLectures.filter(item=>item&&typeof item==="object"&&(item.title||item.learning||item.notes)).map(item=>({title:String(item.title||"Untitled lecture"),date:String(item.date||""),learning:String(item.learning||item.notes||"")}));
 renderSharedLectureCards();
})();;
