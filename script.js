const BOOKS = [
["Matthew",28],["Mark",16],["Luke",24],["John",21],["Acts",28],
["Romans",16],["1 Corinthians",16],["2 Corinthians",13],["Galatians",6],["Ephesians",6],
["Philippians",4],["Colossians",4],["1 Thessalonians",5],["2 Thessalonians",3],["1 Timothy",6],
["2 Timothy",4],["Titus",3],["Philemon",1],["Hebrews",13],["James",5],
["1 Peter",5],["2 Peter",3],["1 John",5],["2 John",1],["3 John",1],["Jude",1],["Revelation",22]
];
const KEY="chapterByChapterNT_v1";
let data={completed:{},dates:{},notes:{},goal:3,theme:"light",userName:""};
let active={book:"Matthew",chapter:1};
const $=id=>document.getElementById(id);
const key=(b,c)=>`${b}|${c}`;
const total=260;
function load(){try{const saved=JSON.parse(localStorage.getItem(KEY)||"null");if(saved)data={...data,...saved};}catch(e){console.warn("Could not read saved tracker data",e)}}
function save(){localStorage.setItem(KEY,JSON.stringify(data));}
function allChapters(){return BOOKS.flatMap(([book,count])=>Array.from({length:count},(_,i)=>({book,chapter:i+1})))}
function isDone(b,c){return !!data.completed[key(b,c)]}
function countBook(b){return BOOKS.find(x=>x[0]===b)[1]}
function renderBooks(){
 const grid=$("booksGrid");grid.innerHTML="";
 const selectedBook=$("progressBook")?.value;
 const visibleBooks=selectedBook?BOOKS.filter(([book])=>book===selectedBook):BOOKS;
 visibleBooks.forEach(([book,count])=>{
  const idx=BOOKS.findIndex(([name])=>name===book);
  const done=Array.from({length:count},(_,i)=>isDone(book,i+1)).filter(Boolean).length;
  const card=document.createElement("article");card.className="book-card";
  const head=document.createElement("div");head.className="book-head";
  const title=document.createElement("h3");title.textContent=book;
  const amount=document.createElement("span");amount.textContent=`${done} / ${count} chapters`;
  head.append(title,amount);
  const meta=document.createElement("div");meta.className="book-meta";meta.innerHTML=`<span>${idx+1} of 27</span><span>${Math.round(done/count*100)}% complete</span>`;
  const chapters=document.createElement("div");chapters.className="chapter-grid";
  for(let c=1;c<=count;c++){
   const btn=document.createElement("button");btn.className="chapter"+(isDone(book,c)?" done":"")+(data.notes[key(book,c)]?" has-note":"");
   btn.textContent=c;btn.title=`${book} ${c}${isDone(book,c)?" — completed":""}${data.notes[key(book,c)]?" — note saved":""}`;
   btn.setAttribute("aria-label",`${book} chapter ${c}${isDone(book,c)?", completed":""}`);
   btn.addEventListener("click",()=>openChapter(book,c));chapters.append(btn);
  }
  const bar=document.createElement("div");bar.className="book-progress";const fill=document.createElement("span");fill.style.width=`${done/count*100}%`;bar.append(fill);
  card.append(head,meta,chapters,bar);grid.append(card);
 });
}
function streaks(){
 const days=[...new Set(Object.entries(data.dates).filter(([k,v])=>data.completed[k]&&v).map(([,v])=>v))].sort();
 const set=new Set(days);let best=0,run=0,prev=null;
 days.forEach(d=>{const dt=new Date(d+"T12:00:00");if(prev){const diff=(dt-prev)/86400000;run=diff===1?run+1:1}else run=1;best=Math.max(best,run);prev=dt;});
 let current=0;const today=new Date();today.setHours(12,0,0,0);
 const todayStr=today.toISOString().slice(0,10);const yesterday=new Date(today);yesterday.setDate(yesterday.getDate()-1);
 let cursor=set.has(todayStr)?today:set.has(yesterday.toISOString().slice(0,10))?yesterday:null;
 while(cursor){const s=cursor.toISOString().slice(0,10);if(!set.has(s))break;current++;cursor.setDate(cursor.getDate()-1);}
 return {current,best};
}
function renderDashboard(){
 const read=Object.values(data.completed).filter(Boolean).length;
 const books=BOOKS.filter(([b,n])=>Array.from({length:n},(_,i)=>isDone(b,i+1)).every(Boolean)).length;
 const pct=Math.round(read/total*100),st=streaks();
 $("percent").textContent=pct+"%";$("donut").style.setProperty("--progress",pct*3.6+"deg");
 $("readCount").textContent=read;$("chaptersRead").textContent=read;$("chaptersLeft").textContent=total-read;
 $("booksDone").textContent=books;$("booksFinished").textContent=books;$("dailyGoal").textContent=data.goal;
 $("streak").textContent=st.current;$("bestStreak").textContent=st.best;$("overallRead").textContent=read;
 $("remainingText").textContent=`${total-read} chapters remaining`;$("overallBar").style.width=pct+"%";
}
function renderNotes(){
 const notes=Object.entries(data.notes).filter(([,v])=>v&&v.trim()).sort((a,b)=>(data.dates[a[0]]||"").localeCompare(data.dates[b[0]]||""));
 const list=$("notesList");list.innerHTML="";
 if(!notes.length){list.innerHTML='<div class="empty">No notes saved yet. Select a chapter or write a note above.</div>';return}
 notes.slice(-5).reverse().forEach(([k,v])=>{const [book,ch]=k.split("|");const item=document.createElement("div");item.className="note-item";const body=document.createElement("div");const strong=document.createElement("strong");strong.textContent=`${book} ${ch}`;const p=document.createElement("p");p.textContent=v;body.append(strong,p);const date=document.createElement("small");date.textContent=data.dates[k]||"No date";item.append(body,date);list.append(item);});
}
function render(){renderBooks();renderDashboard();renderNotes();save()}
function openChapter(book,chapter){
 active={book,chapter};const k=key(book,chapter);
 const today=new Date().toISOString().slice(0,10);
 $("dialogBook").textContent=book;$("dialogTitle").textContent=`${book} ${chapter}`;
 $("chapterDate").value=data.dates[k]||today;
 $("chapterNote").value=data.notes[k]||"";
 $("chapterPopupHint").textContent=isDone(book,chapter)
  ?"This chapter is completed. Choose Done to save any changes, or Not done to mark it unread."
  :"Choose Done to record this chapter as read, or Not done to leave it incomplete. Add an optional note before choosing Done.";
 $("deleteChapterNote").style.display=data.notes[k]?"inline-block":"none";
 $("markDoneBtn").classList.remove("selected");
 $("markNotDoneBtn").classList.remove("selected");
 $("chapterDialog").showModal();
}
function saveChapterAsDone(){
 const k=key(active.book,active.chapter);
 data.completed[k]=true;
 data.dates[k]=$("chapterDate").value||new Date().toISOString().slice(0,10);
 const note=$("chapterNote").value.trim();
 if(note)data.notes[k]=note;else delete data.notes[k];
 save();$("chapterDialog").close();render();
}
function markChapterNotDone(){
 const k=key(active.book,active.chapter);
 delete data.completed[k];
 delete data.dates[k];
 // Keep any previously saved note; choosing Not done changes reading status only.
 save();$("chapterDialog").close();render();
}
$("markDoneBtn").addEventListener("click",saveChapterAsDone);
$("markNotDoneBtn").addEventListener("click",markChapterNotDone);
$("deleteChapterNote").addEventListener("click",e=>{
 e.preventDefault();const k=key(active.book,active.chapter);
 delete data.notes[k];$("chapterNote").value="";save();render();
 $("deleteChapterNote").style.display="none";
});

function workbook(reportOnly=false){
 if(typeof XLSX==="undefined"){alert("Excel tools are not available. Check your internet connection and try again.");return}
 const wb=XLSX.utils.book_new(),chapters=allChapters();
 const read=chapters.filter(x=>isDone(x.book,x.chapter)).length,st=streaks();
 const summary=[["NEW TESTAMENT READING SUMMARY",""],["Tracker name",data.userName||"Not provided"],["Generated",new Date().toLocaleDateString()],["Books in plan",27],["Total chapters",260],["Chapters completed",read],["Chapters remaining",260-read],["Completion",`${(read/260*100).toFixed(1)}%`],["Books completed",BOOKS.filter(([b,n])=>Array.from({length:n},(_,i)=>isDone(b,i+1)).every(Boolean)).length],["Daily goal",data.goal],["Current streak (days)",st.current],["Best streak (days)",st.best],[],["Reading order","Matthew through Revelation"]];
 XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(summary),"Reading Summary");
 const tracker=[["Order","Book","Chapter","Status","Reading Date","Has Note"]];
 chapters.forEach((x,i)=>{const k=key(x.book,x.chapter);tracker.push([i+1,x.book,x.chapter,isDone(x.book,x.chapter)?"Completed":"Not started",data.dates[k]||"",data.notes[k]?"Yes":"No"]);});
 XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(tracker),"Chapter Tracker");
 const notes=[["Book","Chapter","Date","Personal Note"]];
 chapters.forEach(x=>{const k=key(x.book,x.chapter);if(data.notes[k])notes.push([x.book,x.chapter,data.dates[k]||"",data.notes[k]]);});
 XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(notes),"Personal Notes");
 [summary,tracker,notes].forEach((rows,i)=>{const ws=wb.Sheets[["Reading Summary","Chapter Tracker","Personal Notes"][i]];ws["!cols"]=i===0?[{wch:30},{wch:28}]:i===1?[{wch:10},{wch:22},{wch:10},{wch:16},{wch:16},{wch:12}]:[{wch:22},{wch:10},{wch:16},{wch:70}];});
 const safeName=(data.userName||"").trim().replace(/[^a-z0-9_-]+/gi,"_").replace(/^_+|_+$/g,"");
 const suffix=safeName?`_${safeName}`:"";
 const name=(reportOnly?"NT_Progress_Report":"NT_Reading_Backup")+suffix+".xlsx";XLSX.writeFile(wb,name);
}
$("exportBtn").onclick=()=>workbook(false);$("backupBtn").onclick=()=>workbook(false);$("reportBtn").onclick=()=>workbook(true);
$("printBtn").onclick=()=>window.print();
$("goalSelect").onchange=e=>{data.goal=Number(e.target.value);renderDashboard();save()};
$("trackerName").value=data.userName||"";
$("trackerName").addEventListener("input",e=>{data.userName=e.target.value;save()});
$("goalSelect").value=String(data.goal||3);
$("importInput").addEventListener("change",async e=>{
 const file=e.target.files[0];if(!file)return;
 if(typeof XLSX==="undefined"){alert("Excel tools are unavailable. Check your internet connection.");e.target.value="";return}
 try{const wb=XLSX.read(await file.arrayBuffer(),{type:"array"});const ws=wb.Sheets["Chapter Tracker"];if(!ws)throw new Error("This workbook has no 'Chapter Tracker' sheet.");
 const rows=XLSX.utils.sheet_to_json(ws,{defval:""});const imported={completed:{},dates:{},notes:{},goal:data.goal,theme:data.theme};
 rows.forEach(r=>{const b=String(r.Book||"");const c=Number(r.Chapter);if(!BOOKS.some(x=>x[0]===b)||!Number.isInteger(c)||c<1||c>countBook(b))return;const k=key(b,c);if(String(r.Status).toLowerCase()==="completed")imported.completed[k]=true;if(r["Reading Date"])imported.dates[k]=String(r["Reading Date"]).slice(0,10);});
 const noteSheet=wb.Sheets["Personal Notes"];if(noteSheet)XLSX.utils.sheet_to_json(noteSheet,{defval:""}).forEach(r=>{const b=String(r.Book||""),c=Number(r.Chapter);if(BOOKS.some(x=>x[0]===b)&&c>=1&&c<=countBook(b)&&r["Personal Note"]) {const k=key(b,c);imported.notes[k]=String(r["Personal Note"]);if(r.Date)imported.dates[k]=String(r.Date).slice(0,10);}});
 const summary=wb.Sheets["Reading Summary"];if(summary){const rows2=XLSX.utils.sheet_to_json(summary,{header:1});const goalRow=rows2.find(r=>r[0]==="Daily goal");if(goalRow&&Number(goalRow[1])>0)imported.goal=Number(goalRow[1]);const nameRow=rows2.find(r=>r[0]==="Tracker name");if(nameRow&&nameRow[1])imported.userName=String(nameRow[1]);}
 if(!confirm("Import this backup and replace the reading data currently saved in this browser?"))return;
 data=imported;save();$("goalSelect").value=String(data.goal);$("trackerName").value=data.userName||"";render();alert("Reading data imported successfully.");
 }catch(err){alert("Could not import this workbook: "+err.message)}finally{e.target.value=""}
});
function showInfo(title,body){$("infoTitle").textContent=title;$("infoBody").innerHTML=body;$("infoDialog").showModal()}
$("howBtn").onclick=()=>showInfo("How to Use / Giya sa Paggamit",'<h3>English</h3><p>1. Choose a chapter number in the Reading Progress section. Select <b>Done</b> to mark it completed, record the reading date, and save your optional reflection. Select <b>Not done</b> to leave it incomplete.</p><p>2. Use Quick Chapter Selection to choose a book and chapter, then add a shortcut below the tracker so you can open it without scrolling through every book.</p><p>3. Your progress and notes are saved in this browser. Export an Excel backup regularly. Importing a backup replaces the current local tracker data after confirmation.</p><hr><h3>Bisaya (Cebuano)</h3><p>1. Pilia ang numero sa kapitulo sa Reading Progress. Pilia ang <b>Done</b> kung nahuman na nimo ang pagbasa. Awtomatikong marekord ang petsa, ug mahimo kang mosulat og mubo nga pagsabot o personal nga pahinumdom. Pilia ang <b>Not done</b> kung wala pa nimo nahuman.</p><p>2. Gamita ang Quick Chapter Selection aron mopili og libro ug kapitulo. Idugang ang shortcut sa ubos sa tracker aron dali ra nimo kini maablihan nga dili na kinahanglan mag-scroll sa tanang libro.</p><p>3. Ang imong progreso ug mga nota matipigan sa browser nga imong gigamit. I-export kanunay ang Excel backup. Kung mag-import ka og backup, pulihan niini ang kasamtangang datos human sa imong kumpirmasyon.</p>');
$("studyBtn").onclick=()=>{const items=allChapters().filter(x=>data.notes[key(x.book,x.chapter)]);showInfo("Study list",items.length?items.map(x=>`<p><b>${x.book} ${x.chapter}</b> — ${escapeHtml(data.notes[key(x.book,x.chapter)])}</p>`).join(""):'<p>No study notes yet. Add a note from any chapter to build your study list.</p>')};
$("allNotesBtn").onclick=()=>{const entries=allChapters().filter(x=>data.notes[key(x.book,x.chapter)]);showInfo("All personal notes",entries.length?entries.map(x=>`<p><b>${x.book} ${x.chapter}</b><br>${escapeHtml(data.notes[key(x.book,x.chapter)])}</p>`).join(""):"<p>No notes saved yet.</p>")};
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
$("themeBtn").onclick=()=>{document.body.classList.toggle("dark");data.theme=document.body.classList.contains("dark")?"dark":"light";$("themeBtn").textContent=data.theme==="dark"?"☀":"☾";save()};
$("resetBtn").onclick=()=>{if(confirm("This will permanently clear all progress and notes saved in this browser. Export a backup first if you want to keep them. Continue?")){data={completed:{},dates:{},notes:{},goal:3,theme:data.theme,userName:data.userName||""};$("goalSelect").value="3";render();}};
$("noteBook").innerHTML=BOOKS.map(([b])=>`<option>${b}</option>`).join("");
$("noteDate").value=new Date().toISOString().slice(0,10);
$("saveNoteBtn").onclick=()=>{const b=$("noteBook").value,c=Number($("noteChapter").value),note=$("noteText").value.trim();if(!Number.isInteger(c)||c<1||c>countBook(b)){alert(`Enter a chapter from 1 to ${countBook(b)} for ${b}.`);return}if(!note){alert("Write a note before saving.");return}const k=key(b,c);data.notes[k]=note;if($("noteDate").value)data.dates[k]=$("noteDate").value;render();$("noteText").value="";};

// Reading Progress book selector filters the tracker to one book to save space.
$("progressBook").innerHTML=BOOKS.map(([b])=>`<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join("");
$("progressBook").addEventListener("change",renderBooks);

load();if(data.theme==="dark")document.body.classList.add("dark");$("themeBtn").textContent=data.theme==="dark"?"☀":"☾";$("goalSelect").value=String(data.goal||3);render();
