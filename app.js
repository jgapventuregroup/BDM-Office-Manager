const KEY='bdm-office-manager-v2';
const blank={tasks:[],followups:[],projects:[],notes:[],learning:[],appointments:[],calls:[],reminders:[]};
let data=JSON.parse(localStorage.getItem(KEY)||'null')||blank;
Object.keys(blank).forEach(k=>{if(!Array.isArray(data[k]))data[k]=[]});
let view='today';
const save=()=>localStorage.setItem(KEY,JSON.stringify(data));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=new Date().toISOString().slice(0,10);
document.getElementById('todayDate').textContent=new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'});
document.getElementById('nav').onclick=e=>{const b=e.target.closest('[data-view]');if(b){view=b.dataset.view;render()}};
document.querySelector('.quick').onclick=e=>{const b=e.target.closest('[data-add]');if(b)form(b.dataset.add)};
function render(){document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));const c=document.getElementById('content');if(view==='today')todayView(c);else list(c,view)}
function todayView(c){
 const open=data.tasks.filter(x=>!x.done).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));
 const fu=data.followups.filter(x=>!x.done).sort((a,b)=>(a.when||'9999').localeCompare(b.when||'9999'));
 const ap=data.appointments.filter(x=>x.date===today&&!x.done).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
 const calls=data.calls.filter(x=>!x.done);
 const rem=data.reminders.filter(x=>!x.done).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));
 const overdue=open.filter(x=>x.due&&x.due<today).length;

 c.innerHTML='<div class="summary"><div class="stat"><b>'+open.length+'</b><span>Open Tasks</span></div><div class="stat"><b>'+fu.length+'</b><span>Follow Ups</span></div><div class="stat"><b>'+ap.length+'</b><span>Appointments Today</span></div><div class="stat"><b>'+calls.length+'</b><span>Calls To Make</span></div></div>'+
 '<div class="grid">'+card('Things I Need To Do Today',open.slice(0,8).map((x,i)=>'<div class="item"><input class="check" type="checkbox" onchange="completeTaskByTitle('+JSON.stringify(x.title)+')"><b>'+esc(x.title)+'</b>'+(x.due?'<span class="'+(x.due<today?'overdue':'muted')+'"> · '+(x.due<today?'OVERDUE · ':'Due ')+esc(x.due)+'</span>':'')+'</div>').join('')||empty())+
 card('Appointments',ap.slice(0,6).map((x,i)=>'<div class="item"><b>'+esc(x.time||'')+'</b> '+esc(x.title)+(x.person?' — '+esc(x.person):'')+(x.location?'<span class="muted"> · '+esc(x.location)+'</span>':'')+'</div>').join('')||empty())+
 card('Calls To Make',calls.slice(0,6).map(x=>'<div class="item"><b>'+esc(x.person)+'</b>'+(x.phone?' <span class="muted">· '+esc(x.phone)+'</span>':'')+'<br>'+esc(x.reason)+'</div>').join('')||empty())+
 card('Follow Ups',fu.slice(0,6).map(x=>'<div class="item"><b>'+esc(x.person)+'</b> — '+esc(x.what)+(x.when?'<span class="muted"> · '+esc(x.when)+'</span>':'')+'</div>').join('')||empty())+
 card('Important Reminders',rem.slice(0,6).map(x=>'<div class="item">'+esc(x.text)+(x.date?'<span class="'+(x.date<today?'overdue':'muted')+'"> · '+(x.date<today?'OVERDUE · ':'')+esc(x.date)+'</span>':'')+'</div>').join('')||empty())+
 card('Quick Notes',data.notes.slice(0,4).map(x=>'<div class="item">'+esc(x.text)+'</div>').join('')||empty())+'</div>'+(overdue?'<div class="alert">⚠ You have '+overdue+' overdue task'+(overdue===1?'':'s')+'.</div>':'');
}
function card(t,b){return '<section class="card"><h3>'+t+'</h3>'+b+'</section>'}
function empty(){return '<div class="muted">Nothing here yet.</div>'}
function list(c,v){
 const map={tasks:['Tasks','task'],followups:['Follow Ups','followup'],appointments:['Appointments','appointment'],calls:['Calls To Make','call'],reminders:['Important Reminders','reminder'],projects:['Projects','project'],notes:['Notes','note'],learning:["Things I'm Learning",'learning']};
 const [title,type]=map[v];let arr=data[v]||[];
 c.innerHTML='<h2>'+title+'</h2><div class="actions"><button onclick="form(\''+type+'\')">+ Add</button></div><div class="list">'+(arr.length?arr.map((x,i)=>row(v,x,i)).join(''):'<div class="empty">Nothing here yet. Add your first one.</div>')+'</div>';
}
function row(v,x,i){
 let body='';
 if(v==='tasks')body='<input class="check" type="checkbox" '+(x.done?'checked':'')+' onchange="toggle(\'tasks\','+i+')"><b>'+esc(x.title)+'</b>'+(x.due?' <span class="muted">· Due '+esc(x.due)+'</span>':'');
 else if(v==='followups')body='<b>'+esc(x.person)+'</b><br>'+esc(x.what)+(x.when?'<br><span class="muted">Follow up: '+esc(x.when)+'</span>':'');
 else if(v==='projects')body='<b>'+esc(x.customer)+'</b> — '+esc(x.project)+(x.address?'<br><span class="muted">'+esc(x.address)+'</span>':'')+(x.next?'<br>Next: '+esc(x.next):'');
 else if(v==='appointments')body='<b>'+esc(x.date)+' '+esc(x.time)+'</b> — '+esc(x.title)+(x.person?' · '+esc(x.person):'')+(x.location?'<br><span class="muted">'+esc(x.location)+'</span>':'');
 else if(v==='calls')body='<b>'+esc(x.person)+'</b>'+(x.phone?' · '+esc(x.phone):'')+'<br>'+esc(x.reason);
 else if(v==='reminders')body='<b>'+esc(x.text)+'</b>'+(x.date?' · '+esc(x.date):'');
 else body=esc(x.text)+(x.title?'<br><b>'+esc(x.title)+'</b>':'');
 return '<div class="card item row">'+body+'<button onclick="removeItem(\''+v+'\','+i+')">Delete</button></div>';
}
function form(type){
 const defs={
 task:['Task',[['title','What needs to be done?'],['due','Due date','date']]],
 followup:['Follow Up',[['person','Who?'],['what','What do I need to follow up about?'],['when','When?','date']]],
 project:['Project',[['customer','Customer'],['address','Address'],['project','Project'],['next',"What's next?"]]],
 note:['Note',[['text','Write your note...','textarea']]],
 learning:['Learning',[['text','What am I learning?','textarea']]],
 appointment:['Appointment',[['title','Appointment / Event'],['person','Who?'],['date','Date','date'],['time','Time','time'],['location','Location']]],
 call:['Call',[['person','Who?'],['phone','Phone'],['reason','What do I need to call about?']]],
 reminder:['Reminder',[['text','Reminder'],['date','Date','date']]]
 };
 const [title,fields]=defs[type];let html='<div class="form"><h2>Add '+title+'</h2>';
 fields.forEach((f,i)=>{html+='<label>'+f[1]+'</label>'+(f[2]==='textarea'?'<textarea id="f'+i+'"></textarea>':'<input id="f'+i+'" type="'+(f[2]||'text')+'">')});
 html+='<div class="actions"><button onclick="saveForm(\''+type+'\')">Save</button><button onclick="render()">Cancel</button></div></div>';document.getElementById('content').innerHTML=html;
}
function saveForm(type){
 const defs={task:['title','due'],followup:['person','what','when'],project:['customer','address','project','next'],note:['text'],learning:['text'],appointment:['title','person','date','time','location'],call:['person','phone','reason'],reminder:['text','date']};
 const o={};(defs[type]||[]).forEach((k,i)=>o[k]=document.getElementById('f'+i)?.value.trim()||'');if(type==='task'||type==='appointment'||type==='call'||type==='reminder')o.done=false;
 const v={task:'tasks',followup:'followups',project:'projects',note:'notes',learning:'learning',appointment:'appointments',call:'calls',reminder:'reminders'}[type];
 data[v].unshift(o);save();view=v;render();
}
function completeTaskByTitle(title){const x=data.tasks.find(t=>t.title===title&&!t.done);if(x){x.done=true;save();render()}}
function toggle(v,i){data[v][i].done=!data[v][i].done;save();render()}
function removeItem(v,i){data[v].splice(i,1);save();render()}
render();