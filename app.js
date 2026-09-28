const KEY='bdm-office-manager-v2';
const blank={tasks:[],followups:[],projects:[],notes:[],learning:[],appointments:[],calls:[],reminders:[]};
let data=JSON.parse(localStorage.getItem(KEY)||'null')||blank;
Object.keys(blank).forEach(k=>{if(!Array.isArray(data[k]))data[k]=[]});
let view='today';
const save=()=>localStorage.setItem(KEY,JSON.stringify(data));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function localDate(d=new Date()){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return y+'-'+m+'-'+day}
const today=localDate();
document.getElementById('todayDate').textContent=new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'});
document.getElementById('nav').onclick=e=>{const b=e.target.closest('[data-view]');if(b){view=b.dataset.view;render()}};
document.querySelector('.quick').onclick=e=>{const b=e.target.closest('[data-add]');if(b)form(b.dataset.add)};
document.getElementById('searchBtn').onclick=globalSearch;
document.getElementById('globalSearch').addEventListener('keydown',e=>{if(e.key==='Enter')globalSearch()});
function globalSearch(){
 const q=document.getElementById('globalSearch').value.trim().toLowerCase();
 if(!q){render();return}
 const sources=[['Tasks','tasks'],['Follow Ups','followups'],['Appointments','appointments'],['Calls','calls'],['Reminders','reminders'],['Projects','projects'],['Notes','notes'],['Things I\'m Learning','learning']];
 const hits=[];
 sources.forEach(([label,key])=>(data[key]||[]).forEach((x,i)=>{
   if(JSON.stringify(x).toLowerCase().includes(q))hits.push({label,key,x,i});
 }));
 const c=document.getElementById('content');
 c.innerHTML='<h2>Search Results</h2><div class="muted search-count">'+hits.length+' result'+(hits.length===1?'':'s')+' for “'+esc(q)+'”</div>'+
 (hits.length?'<div class="list">'+hits.map(h=>'<div class="card search-result"><span class="tag">'+h.label+'</span><div>'+searchText(h.key,h.x)+'</div><button onclick="jumpToResult(\''+h.key+'\','+h.i+')">Open</button></div>').join('')+'</div>':'<div class="empty">No matching information found.</div>');
}
function searchText(k,x){
 if(k==='projects')return '<b>'+esc(x.customer)+'</b> — '+esc(x.project)+(x.address?' · '+esc(x.address):'');
 if(k==='followups')return '<b>'+esc(x.person)+'</b> — '+esc(x.what);
 if(k==='appointments')return '<b>'+esc(x.title)+'</b> · '+esc(x.date||'')+' '+esc(x.time||'');
 if(k==='calls')return '<b>'+esc(x.person)+'</b> — '+esc(x.reason);
 if(k==='notes')return '<b>'+esc(x.title||'Note')+'</b> — '+esc(x.text);
 if(k==='learning')return '<b>'+esc(x.question)+'</b> — '+esc(x.answer);
 return '<b>'+esc(x.title||x.text)+'</b>';
}
function jumpToResult(k,i){view=k;render()}

function render(){document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));const c=document.getElementById('content');if(view==='today')todayView(c);else list(c,view)}
function todayView(c){
 const open=data.tasks.filter(x=>!x.done).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));
 const fu=data.followups.filter(x=>!x.done).sort((a,b)=>(a.when||'9999').localeCompare(b.when||'9999'));
 const ap=data.appointments.filter(x=>x.date===today&&!x.done).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
 const calls=data.calls.filter(x=>!x.done);
 const rem=data.reminders.filter(x=>!x.done).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));
 const overdueTasks=open.filter(x=>x.due&&x.due<today).length;
 const overdueFU=fu.filter(x=>x.when&&x.when<today).length;
 const overdueRem=rem.filter(x=>x.date&&x.date<today).length;
 const urgent=overdueTasks+overdueFU+overdueRem;
 const upcoming=rem.filter(x=>x.date&&x.date>today).slice(0,3);
 c.innerHTML=
 '<div class="morning-panel"><div><h2>Today</h2><div class="muted">'+(urgent?'There are '+urgent+' overdue item'+(urgent===1?'':'s')+' that need attention.':'You are caught up. Here is what is on the schedule.')+'</div></div><button onclick="form(\'task\')">+ Add Task</button></div>'+
 '<div class="summary"><div class="stat"><b>'+open.length+'</b><span>Open Tasks</span></div><div class="stat"><b>'+fu.length+'</b><span>Follow Ups</span></div><div class="stat"><b>'+ap.length+'</b><span>Appointments Today</span></div><div class="stat"><b>'+calls.length+'</b><span>Calls To Make</span></div></div>'+
 '<div class="grid">'+
 card('Tasks',open.slice(0,6).map((x)=>'<div class="item"><input class="check" type="checkbox" onchange="completeTaskByTitle('+JSON.stringify(x.title)+')"><b>'+esc(x.title)+'</b>'+(x.due?'<span class="'+(x.due<today?'overdue':'muted')+'"> · '+(x.due<today?'OVERDUE · ':'Due ')+esc(x.due)+'</span>':'')+'</div>').join('')||empty())+
 card('Appointments',ap.slice(0,6).map(x=>'<div class="item"><b>'+esc(x.time||'No time')+'</b> — '+esc(x.title)+(x.person?' · '+esc(x.person):'')+(x.location?'<div class="muted">📍 '+esc(x.location)+'</div>':'')+'</div>').join('')||empty())+
 card('Follow Ups',fu.slice(0,6).map((x,i)=>'<div class="item"><input class="check" type="checkbox" onchange="completeFollowUpByIndex('+i+')"><b>'+esc(x.person)+'</b> — '+esc(x.what)+(x.when?'<span class="'+(x.when<today?'overdue':'muted')+'"> · '+(x.when<today?'OVERDUE · ':'Follow up ')+esc(x.when)+'</span>':'')+'</div>').join('')||empty())+
 card('Calls',calls.slice(0,6).map(x=>'<div class="item"><b>'+esc(x.person)+'</b>'+(x.phone?' · '+esc(x.phone):'')+'<br>'+esc(x.reason)+'</div>').join('')||empty())+
 card('Important Reminders',rem.slice(0,6).map(x=>'<div class="item">'+esc(x.text)+(x.date?'<span class="'+(x.date<today?'overdue':'muted')+'"> · '+(x.date<today?'OVERDUE · ':'')+esc(x.date)+'</span>':'')+'</div>').join('')||empty())+
 card('Quick Notes',data.notes.slice(0,4).map(x=>'<div class="item"><b>'+esc(x.title||'Note')+'</b><div class="note-preview">'+esc(x.text)+'</div></div>').join('')||empty())+
 (upcoming.length?card('Coming Up',upcoming.map(x=>'<div class="item"><b>'+esc(x.text)+'</b><span class="muted"> · '+esc(x.date)+'</span></div>').join(''):'')+
 '</div>';
}
function card(t,b){return '<section class="card"><h3>'+t+'</h3>'+b+'</section>'}
function empty(){return '<div class="muted">Nothing here yet.</div>'}
function list(c,v){
 if(v==='reminders'){reminderList(c);return}
function reminderList(c){
 const arr=[...(data.reminders||[])].filter(x=>!x.done).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));
 c.innerHTML='<h2>Important Reminders</h2><div class="task-help muted">Use reminders for important things you do not want to lose track of.</div><div class="actions"><button onclick="form(\'reminder\')">+ Add Reminder</button></div><div class="list">'+
 (arr.length?arr.map(x=>'<div class="card reminder-card"><div><b>'+esc(x.text)+'</b>'+(x.date?'<div class="'+(x.date<today?'overdue':'muted')+'">'+(x.date<today?'OVERDUE · ':'Due ')+esc(x.date)+'</div>':'')+'</div><button onclick="completeReminder('+data.reminders.indexOf(x)+')">Mark Done</button></div>').join(''):'<div class="empty">No important reminders right now.</div>')+
 '</div>';
}
function completeReminder(i){if(data.reminders[i]){data.reminders[i].done=true;save();render()}}
function list(c,v){
 if(v==='reminders'){reminderList(c);return}
function list(c,v){
 if(v==='calls'){callList(c);return}
function callList(c){
 const arr=[...(data.calls||[])].filter(x=>!x.done);
 c.innerHTML='<h2>Calls To Make</h2><div class="task-help muted">Keep the reason for the call here so nothing important gets missed.</div><div class="actions"><button onclick="form(\'call\')">+ Add Call</button></div><div class="list">'+
 (arr.length?arr.map((x)=>'<div class="card call-card"><div class="call-main"><div><b>'+esc(x.person)+'</b>'+(x.phone?' <span class="muted">· '+esc(x.phone)+'</span>':'')+'</div><div>'+esc(x.reason)+'</div></div><button onclick="completeCall('+data.calls.indexOf(x)+')">Mark Done</button></div>').join(''):'<div class="empty">No calls waiting. Add a call when something needs attention.</div>')+
 '</div>';
}
function completeCall(i){if(data.calls[i]){data.calls[i].done=true;save();render()}}
function list(c,v){
 if(v==='calls'){callList(c);return}
function list(c,v){
 if(v==='appointments'){appointmentList(c);return}
function list(c,v){
 if(v==='appointments'){appointmentList(c);return}

 const map={tasks:['Tasks','task'],followups:['Follow Ups','followup'],appointments:['Appointments','appointment'],calls:['Calls To Make','call'],reminders:['Important Reminders','reminder'],projects:['Projects','project'],notes:['Notes','note'],learning:["Things I'm Learning",'learning']};
 const [title,type]=map[v];let arr=data[v]||[];
 c.innerHTML='<h2>'+title+'</h2>'+(v==='tasks'?'<div class="task-help muted">Check a task when it is finished. Overdue tasks are marked automatically.</div>':'')+'<div class="actions"><button onclick="form(\''+type+'\')">+ Add</button></div><div class="list">'+(arr.length?arr.map((x,i)=>row(v,x,i)).join(''):'<div class="empty">Nothing here yet. Add your first one.</div>')+'</div>';
}
function row(v,x,i){
 let body='';
 if(v==='tasks')body='<input class="check" type="checkbox" '+(x.done?'checked':'')+' onchange="toggle(\'tasks\','+i+')"><b>'+esc(x.title)+'</b>'+(x.due?'<span class="'+(x.due<today&&!x.done?'overdue':'muted')+'"> · '+(x.due<today&&!x.done?'OVERDUE · ':'Due ')+esc(x.due)+'</span>':'');
 else if(v==='followups')body='<b>'+esc(x.person)+'</b><br>'+esc(x.what)+(x.when?'<br><span class="muted">Follow up: '+esc(x.when)+'</span>':'');
 else if(v==='projects')body='<div class="project-head"><b>'+esc(x.customer)+'</b><span class="status '+esc((x.status||'Active').toLowerCase().replace(/[^a-z]/g,''))+'">'+esc(x.status||'Active')+'</span></div> — '+esc(x.project)+(x.address?'<br><span class="muted">'+esc(x.address)+'</span>':'')+(x.next?'<br><strong>Next:</strong> '+esc(x.next):'')+(x.note?'<br><span class="muted">'+esc(x.note)+'</span>':'');
 else if(v==='appointments')body='<b>'+esc(x.date)+' '+esc(x.time)+'</b> — '+esc(x.title)+(x.person?' · '+esc(x.person):'')+(x.location?'<br><span class="muted">'+esc(x.location)+'</span>':'');
 else if(v==='calls')body='<b>'+esc(x.person)+'</b>'+(x.phone?' · '+esc(x.phone):'')+'<br>'+esc(x.reason);
 else if(v==='reminders')body='<b>'+esc(x.text)+'</b>'+(x.date?' · '+esc(x.date):'');
 else if(v==='notes')body='<b>'+esc(x.title||'Office Note')+'</b>'+(x.category?'<span class="tag">'+esc(x.category)+'</span>':'')+'<div class="note-preview">'+esc(x.text)+'</div>';
else if(v==='learning')body='<div class="learning-head"><b>'+esc(x.question||'Learning Note')+'</b>'+(x.category?'<span class="tag">'+esc(x.category)+'</span>':'')</div><div class="note-preview"><strong>What I learned:</strong> '+esc(x.answer)+'</div>'+(x.remember?'<div class="muted"><strong>Remember:</strong> '+esc(x.remember)+'</div>':'');
else body=esc(x.text)+(x.title?'<br><b>'+esc(x.title)+'</b>':'');
 return '<div class="card item row">'+body+'<button onclick="removeItem(\''+v+'\','+i+')">Delete</button></div>';
}
function form(type){
 const defs={
 task:['Task',[['title','What needs to be done?'],['due','Due date','date']]],
 followup:['Follow Up',[['person','Who?'],['what','What do I need to follow up about?'],['when','When?','date']]],
 project:['Project',[['customer','Customer'],['address','Address'],['project','Project'],['status','Status'],['next',"What's next?"],['note','Important note','textarea']]],
 note:['Note',[['title','Title'],['category','Category'],['text','Write your note...','textarea']]],
 learning:['Learning',[['question','What was my question?'],['category','Category'],['answer','What did I learn?','textarea'],['remember','What should I remember?','textarea']]],
 appointment:['Appointment',[['title','Appointment / Event'],['person','Who?'],['date','Date','date'],['time','Time','time'],['location','Location']]],
 call:['Call',[['person','Who?'],['phone','Phone'],['reason','What do I need to call about?']]],
 reminder:['Reminder',[['text','Reminder'],['date','Date','date']]]
 };
 const [title,fields]=defs[type];let html='<div class="form"><h2>Add '+title+'</h2>';
 fields.forEach((f,i)=>{html+='<label>'+f[1]+'</label>'+(f[2]==='textarea'?'<textarea id="f'+i+'"></textarea>':f[0]==='status'?'<select id="f'+i+'"><option>Active</option><option>Waiting</option><option>Scheduled</option><option>Completed</option><option>On Hold</option></select>':'<input id="f'+i+'" type="'+(f[2]||'text')+'">')});
 html+='<div class="actions"><button onclick="saveForm(\''+type+'\')">Save</button><button onclick="render()">Cancel</button></div></div>';document.getElementById('content').innerHTML=html;
}
function saveForm(type){
 const defs={task:['title','due'],followup:['person','what','when'],project:['customer','address','project','status','next','note'],note:['title','category','text'],learning:['question','category','answer','remember'],appointment:['title','person','date','time','location'],call:['person','phone','reason'],reminder:['text','date']};
 const o={};(defs[type]||[]).forEach((k,i)=>o[k]=document.getElementById('f'+i)?.value.trim()||'');if(type==='task'||type==='appointment'||type==='call'||type==='reminder')o.done=false;
 const v={task:'tasks',followup:'followups',project:'projects',note:'notes',learning:'learning',appointment:'appointments',call:'calls',reminder:'reminders'}[type];
 data[v].unshift(o);save();view=v;render();
}
function completeTaskByTitle(title){const x=data.tasks.find(t=>t.title===title&&!t.done);if(x){x.done=true;save();render()}}
function completeFollowUpByIndex(i){const pending=data.followups.filter(x=>!x.done);if(pending[i]){pending[i].done=true;save();render()}}
function toggle(v,i){data[v][i].done=!data[v][i].done;save();render()}
function removeItem(v,i){data[v].splice(i,1);save();render()}
render();