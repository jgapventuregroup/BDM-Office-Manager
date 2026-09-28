const KEY='bdm-office-manager-v1';
let data=JSON.parse(localStorage.getItem(KEY)||'{"tasks":[],"followups":[],"projects":[],"notes":[],"learning":[]}');
let view='today';
const save=()=>localStorage.setItem(KEY,JSON.stringify(data));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
document.getElementById('todayDate').textContent=new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'});
document.getElementById('nav').onclick=e=>{if(e.target.dataset.view){view=e.target.dataset.view;render()}};
document.querySelector('.quick').onclick=e=>{if(e.target.dataset.add) form(e.target.dataset.add)};
function render(){document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));const c=document.getElementById('content'); if(view==='today')today(c); else list(c,view)}
function today(c){
 const open=data.tasks.filter(x=>!x.done), fu=data.followups.filter(x=>!x.done);
 c.innerHTML='<h2>Today</h2><div class="grid">'+
 card('Things I Need To Do Today',open.slice(0,6).map(x=>'<div class="item">'+esc(x.title)+(x.due?' <span class="muted">· '+esc(x.due)+'</span>':'')+'</div>').join('')||empty())+
 card('Follow Ups',fu.slice(0,6).map(x=>'<div class="item"><b>'+esc(x.person)+'</b> — '+esc(x.what)+'</div>').join('')||empty())+
 card('Quick Notes',data.notes.slice(0,4).map(x=>'<div class="item">'+esc(x.text)+'</div>').join('')||empty())+'</div>';
}
function card(t,b){return '<section class="card"><h3>'+t+'</h3>'+b+'</section>'}
function empty(){return '<div class="muted">Nothing here yet.</div>'}
function list(c,v){
 const map={tasks:['Tasks','task'],followups:['Follow Ups','followup'],projects:['Projects','project'],notes:['Notes','note'],learning:["Things I'm Learning",'learning']};
 const [title,type]=map[v]; let arr=data[v];
 c.innerHTML='<h2>'+title+'</h2><div class="actions"><button onclick="form(\''+type+'\')">+ Add</button></div><div style="margin-top:14px">'+(arr.length?arr.map((x,i)=>row(v,x,i)).join(''): '<div class="empty">Nothing here yet. Add your first one.</div>')+'</div>';
}
function row(v,x,i){
 if(v==='tasks')return '<div class="card item"><input class="check" type="checkbox" '+(x.done?'checked':'')+' onchange="toggleTask('+i+')"><b>'+esc(x.title)+'</b>'+(x.due?' <span class="muted">· Due '+esc(x.due)+'</span>':'')+' <button onclick="removeItem(\''+v+'\','+i+')">Delete</button></div>';
 if(v==='followups')return '<div class="card item"><b>'+esc(x.person)+'</b><br>'+esc(x.what)+' '+(x.when?'<span class="muted">· '+esc(x.when)+'</span>':'')+'<br><button onclick="removeItem(\''+v+'\','+i+')">Delete</button></div>';
 if(v==='projects')return '<div class="card item"><b>'+esc(x.customer)+'</b> — '+esc(x.project)+(x.address?'<br><span class="muted">'+esc(x.address)+'</span>':'')+(x.next?'<br>Next: '+esc(x.next):'')+'<br><button onclick="removeItem(\''+v+'\','+i+')">Delete</button></div>';
 return '<div class="card item">'+esc(x.text)+(x.title?'<br><b>'+esc(x.title)+'</b>':'')+'<br><button onclick="removeItem(\''+v+'\','+i+')">Delete</button></div>';
}
function form(type){
 const c=document.getElementById('content'); const configs={
 task:['Task','title','What needs to be done?','due','Due date'],
 followup:['Follow Up','person','Who?','what','What do I need to follow up about?','when','When?'],
 project:['Project','customer','Customer','address','Address','project','Project','next',"What's next?"],
 note:['Note','text','Write your note...'],
 learning:['Learning','text','What am I learning?']
 };
 const a=configs[type]; let fields=''; for(let i=1;i<a.length;i+=2) fields+='<label>'+a[i+1]+'</label><input id="f'+i+'" '+(a[i]==='due'||a[i]==='when'?'type="date"':'')+'>'; 
 c.innerHTML='<div class="form"><h2>Add '+a[0]+'</h2>'+fields+'<div class="actions"><button onclick="saveForm(\''+type+'\')">Save</button><button onclick="render()">Cancel</button></div></div>';
}
function saveForm(type){
 const configs={task:['title','due'],followup:['person','what','when'],project:['customer','address','project','next'],note:['text'],learning:['text']};
 const o={}; configs[type].forEach((k,i)=>o[k]=document.getElementById('f'+(i*2+1))?.value.trim()||''); if(type==='task')o.done=false; const v=type==='task'?'tasks':type==='followup'?'followups':type==='project'?'projects':type==='note'?'notes':'learning'; data[v].unshift(o);save();view=v;render();
}
function toggleTask(i){data.tasks[i].done=!data.tasks[i].done;save();render()}
function removeItem(v,i){data[v].splice(i,1);save();render()}
render();