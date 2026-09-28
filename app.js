const KEY = 'bdm-office-manager-v2';

const blank = {
  tasks: [],
  followups: [],
  projects: [],
  notes: [],
  learning: [],
  appointments: [],
  calls: [],
  reminders: []
};

let data = JSON.parse(localStorage.getItem(KEY) || 'null') || structuredClone(blank);
Object.keys(blank).forEach(k => {
  if (!Array.isArray(data[k])) data[k] = [];
});

let view = 'today';

const save = () => localStorage.setItem(KEY, JSON.stringify(data));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

function localDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

const today = localDate();

const now = new Date();
const hour = now.getHours();
const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
document.querySelector('header h1').textContent = greeting;
document.getElementById('todayDate').textContent =
  now.toLocaleDateString(undefined, {
    weekday:'long', month:'long', day:'numeric', year:'numeric'
  });

document.getElementById('nav').addEventListener('click', e => {
  const b = e.target.closest('[data-view]');
  if (!b) return;
  view = b.dataset.view;
  render();
});

document.querySelector('.quick').addEventListener('click', e => {
  const b = e.target.closest('[data-add]');
  if (b) form(b.dataset.add);
});

document.getElementById('searchBtn').onclick = globalSearch;
document.getElementById('backupBtn').onclick = backupData;
document.getElementById('restoreBtn').onclick = () => document.getElementById('restoreFile').click();
document.getElementById('restoreFile').onchange = restoreData;
document.getElementById('globalSearch').addEventListener('keydown', e => {
  if (e.key === 'Enter') globalSearch();
});

function backupData() {
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'BDM-Office-Backup-' + localDate() + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

function restoreData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const restored = JSON.parse(reader.result);
      const required = Object.keys(blank);
      if (!required.every(k => Array.isArray(restored[k]))) throw new Error('Invalid backup');
      data = restored;
      save();
      render();
      alert('BDM backup restored successfully.');
    } catch {
      alert('That file is not a valid BDM backup.');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function globalSearch() {
  const q = document.getElementById('globalSearch').value.trim().toLowerCase();
  if (!q) {
    render();
    return;
  }

  const sources = [
    ['Tasks','tasks'], ['Follow Ups','followups'], ['Appointments','appointments'],
    ['Calls','calls'], ['Reminders','reminders'], ['Projects','projects'],
    ['Notes','notes'], ["Things I'm Learning",'learning']
  ];

  const hits = [];
  sources.forEach(([label,key]) => {
    (data[key] || []).forEach((x,i) => {
      if (JSON.stringify(x).toLowerCase().includes(q)) hits.push({label,key,x,i});
    });
  });

  const c = document.getElementById('content');
  c.innerHTML =
    '<h2>Search Results</h2>' +
    '<div class="muted search-count">' + hits.length + ' result' +
    (hits.length === 1 ? '' : 's') + ' for “' + esc(q) + '”</div>' +
    (hits.length
      ? '<div class="list">' + hits.map(h =>
          '<div class="card search-result">' +
          '<span class="tag">' + h.label + '</span>' +
          '<div>' + searchText(h.key,h.x) + '</div>' +
          '<button onclick="jumpToResult(\'' + h.key + '\')">Open</button>' +
          '</div>'
        ).join('') + '</div>'
      : '<div class="empty">No matching information found.</div>');
}

function searchText(k,x) {
  if (k === 'projects') return '<b>' + esc(x.customer) + '</b> — ' + esc(x.project) + (x.address ? ' · ' + esc(x.address) : '');
  if (k === 'followups') return '<b>' + esc(x.person) + '</b> — ' + esc(x.what);
  if (k === 'appointments') return '<b>' + esc(x.title) + '</b> · ' + esc(x.date || '') + ' ' + esc(x.time || '');
  if (k === 'calls') return '<b>' + esc(x.person) + '</b> — ' + esc(x.reason);
  if (k === 'notes') return '<b>' + esc(x.title || 'Note') + '</b> — ' + esc(x.text);
  if (k === 'learning') return '<b>' + esc(x.question) + '</b> — ' + esc(x.answer);
  return '<b>' + esc(x.title || x.text) + '</b>';
}

function jumpToResult(k) {
  view = k;
  render();
}

function render() {
  document.querySelectorAll('#nav button').forEach(b =>
    b.classList.toggle('active', b.dataset.view === view)
  );

  const c = document.getElementById('content');

  if (view === 'today') todayView(c);
  else if (view === 'appointments') appointmentList(c);
  else if (view === 'calls') callList(c);
  else if (view === 'reminders') reminderList(c);
  else list(c, view);
}

function todayView(c) {
  const open = data.tasks.filter(x => !x.done)
    .sort((a,b) => (a.due || '9999').localeCompare(b.due || '9999'));

  const fu = data.followups.filter(x => !x.done)
    .sort((a,b) => (a.when || '9999').localeCompare(b.when || '9999'));

  const ap = data.appointments.filter(x => x.date === today && !x.done)
    .sort((a,b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

  const calls = data.calls.filter(x => !x.done);

  const rem = data.reminders.filter(x => !x.done)
    .sort((a,b) => (a.date || '9999').localeCompare(b.date || '9999'));

  const overdueTasks = open.filter(x => x.due && x.due < today).length;
  const overdueFU = fu.filter(x => x.when && x.when < today).length;
  const overdueRem = rem.filter(x => x.date && x.date < today).length;
  const urgent = overdueTasks + overdueFU + overdueRem;

  const upcoming = rem.filter(x => x.date && x.date > today).slice(0,3);

  c.innerHTML =
    '<div class="morning-panel"><div><h2>Today</h2>' +
    '<div class="muted">' +
    (urgent
      ? 'There are ' + urgent + ' overdue item' + (urgent === 1 ? '' : 's') + ' that need attention.'
      : 'You are caught up. Here is what is on the schedule.') +
    '</div></div><button onclick="form(\'task\')">+ Add Task</button></div>' +

    '<div class="summary">' +
      stat(open.length,'Open Tasks') +
      stat(fu.length,'Follow Ups') +
      stat(ap.length,'Appointments Today') +
      stat(calls.length,'Calls To Make') +
    '</div>' +

    '<div class="grid">' +
      card('Tasks', open.slice(0,6).map(x =>
        '<div class="item"><input class="check" type="checkbox" onchange="completeTaskByTitle(' +
        JSON.stringify(x.title) + ')"><b>' + esc(x.title) + '</b>' +
        (x.due ? '<span class="' + (x.due < today ? 'overdue' : 'muted') + '"> · ' +
          (x.due < today ? 'OVERDUE · ' : 'Due ') + esc(x.due) + '</span>' : '') +
        '</div>'
      ).join('') || empty()) +

      card('Appointments', ap.slice(0,6).map(x =>
        '<div class="item"><b>' + esc(x.time || 'No time') + '</b> — ' +
        esc(x.title) + (x.person ? ' · ' + esc(x.person) : '') +
        (x.location ? '<div class="muted">📍 ' + esc(x.location) + '</div>' : '') +
        '</div>'
      ).join('') || empty()) +

      card('Follow Ups', fu.slice(0,6).map(x =>
        '<div class="item"><input class="check" type="checkbox" onchange="completeFollowUpByTitle(' +
        JSON.stringify(x.person) + ',' + JSON.stringify(x.what) + ')"><b>' +
        esc(x.person) + '</b> — ' + esc(x.what) +
        (x.when ? '<span class="' + (x.when < today ? 'overdue' : 'muted') + '"> · ' +
          (x.when < today ? 'OVERDUE · ' : 'Follow up ') + esc(x.when) + '</span>' : '') +
        '</div>'
      ).join('') || empty()) +

      card('Calls', calls.slice(0,6).map(x =>
        '<div class="item"><b>' + esc(x.person) + '</b>' +
        (x.phone ? ' · ' + esc(x.phone) : '') + '<br>' +
        esc(x.reason) + '</div>'
      ).join('') || empty()) +

      card('Important Reminders', rem.slice(0,6).map(x =>
        '<div class="item">' + esc(x.text) +
        (x.date ? '<span class="' + (x.date < today ? 'overdue' : 'muted') + '"> · ' +
          (x.date < today ? 'OVERDUE · ' : '') + esc(x.date) + '</span>' : '') +
        '</div>'
      ).join('') || empty()) +

      card('Quick Notes', data.notes.slice(0,4).map(x =>
        '<div class="item"><b>' + esc(x.title || 'Note') + '</b>' +
        '<div class="note-preview">' + esc(x.text) + '</div></div>'
      ).join('') || empty()) +

      (upcoming.length
        ? card('Coming Up', upcoming.map(x =>
            '<div class="item"><b>' + esc(x.text) + '</b>' +
            '<span class="muted"> · ' + esc(x.date) + '</span></div>'
          ).join(''))
        : '') +
    '</div>';
}

function stat(value,label) {
  return '<div class="stat"><b>' + value + '</b><span>' + label + '</span></div>';
}

function card(title, body) {
  return '<section class="card"><h3>' + title + '</h3>' + body + '</section>';
}

function empty() {
  return '<div class="muted">Nothing here yet.</div>';
}

function list(c,v) {
  const map = {
    tasks:['Tasks','task'],
    followups:['Follow Ups','followup'],
    projects:['Projects','project'],
    notes:['Notes','note'],
    learning:["Things I'm Learning",'learning']
  };

  const [title,type] = map[v] || [v,''];
  const arr = data[v] || [];

  c.innerHTML =
    '<h2>' + title + '</h2>' +
    (v === 'tasks'
      ? '<div class="task-help muted">Check a task when it is finished. Overdue tasks are marked automatically.</div>'
      : '') +
    '<div class="actions"><button onclick="form(\'' + type + '\')">+ Add</button></div>' +
    '<div class="list">' +
      (arr.length
        ? arr.map((x,i) => row(v,x,i)).join('')
        : '<div class="empty">Nothing here yet. Add your first one.</div>') +
    '</div>';
}

function appointmentList(c) {
  const arr = [...data.appointments].filter(x => !x.done)
    .sort((a,b) => ((a.date || '9999') + (a.time || '99:99'))
      .localeCompare((b.date || '9999') + (b.time || '99:99')));

  let lastDate = '';
  let html = '<h2>Appointments</h2>' +
    '<div class="task-help muted">Keep appointments here so the office schedule is easy to see.</div>' +
    '<div class="actions"><button onclick="form(\'appointment\')">+ Add Appointment</button></div><div class="list">';

  if (!arr.length) {
    html += '<div class="empty">No appointments scheduled.</div>';
  } else {
    arr.forEach(x => {
      if (x.date !== lastDate) {
        lastDate = x.date;
        html += '<h3 class="date-heading">' + esc(x.date || 'No date') +
          (x.date === today ? ' — TODAY' : '') + '</h3>';
      }
      const i = data.appointments.indexOf(x);
      html += '<div class="card item row">' +
        '<div><b>' + esc(x.time || 'No time') + '</b> — ' + esc(x.title) +
        (x.person ? '<br><span class="muted">Person: ' + esc(x.person) + '</span>' : '') +
        (x.location ? '<br><span class="muted">Location: ' + esc(x.location) + '</span>' : '') +
        '</div><button onclick="completeAppointment(' + i + ')">Mark Done</button></div>';
    });
  }

  c.innerHTML = html + '</div>';
}

function callList(c) {
  const arr = data.calls.filter(x => !x.done);

  c.innerHTML =
    '<h2>Calls To Make</h2>' +
    '<div class="task-help muted">Keep the reason for the call here so nothing important gets missed.</div>' +
    '<div class="actions"><button onclick="form(\'call\')">+ Add Call</button></div>' +
    '<div class="list">' +
      (arr.length
        ? arr.map(x => {
            const i = data.calls.indexOf(x);
            return '<div class="card call-card"><div class="call-main"><div><b>' +
              esc(x.person) + '</b>' + (x.phone ? ' <span class="muted">· ' + esc(x.phone) + '</span>' : '') +
              '</div><div>' + esc(x.reason) + '</div></div>' +
              '<button onclick="completeCall(' + i + ')">Mark Done</button></div>';
          }).join('')
        : '<div class="empty">No calls waiting. Add a call when something needs attention.</div>') +
    '</div>';
}

function reminderList(c) {
  const arr = data.reminders.filter(x => !x.done)
    .sort((a,b) => (a.date || '9999').localeCompare(b.date || '9999'));

  c.innerHTML =
    '<h2>Important Reminders</h2>' +
    '<div class="task-help muted">Use reminders for important things you do not want to lose track of.</div>' +
    '<div class="actions"><button onclick="form(\'reminder\')">+ Add Reminder</button></div>' +
    '<div class="list">' +
      (arr.length
        ? arr.map(x => {
            const i = data.reminders.indexOf(x);
            return '<div class="card reminder-card"><div><b>' + esc(x.text) + '</b>' +
              (x.date ? '<div class="' + (x.date < today ? 'overdue' : 'muted') + '">' +
                (x.date < today ? 'OVERDUE · ' : 'Due ') + esc(x.date) + '</div>' : '') +
              '</div><button onclick="completeReminder(' + i + ')">Mark Done</button></div>';
          }).join('')
        : '<div class="empty">No important reminders right now.</div>') +
    '</div>';
}

function row(v,x,i) {
  let body = '';

  if (v === 'tasks') {
    body = '<input class="check" type="checkbox" ' + (x.done ? 'checked' : '') +
      ' onchange="toggle(\'tasks\',' + i + ')"><b>' + esc(x.title) + '</b>' +
      (x.due ? '<span class="' + (x.due < today && !x.done ? 'overdue' : 'muted') + '"> · ' +
        (x.due < today && !x.done ? 'OVERDUE · ' : 'Due ') + esc(x.due) + '</span>' : '');
  } else if (v === 'followups') {
    body = '<b>' + esc(x.person) + '</b><br>' + esc(x.what) +
      (x.when ? '<br><span class="muted">Follow up: ' + esc(x.when) + '</span>' : '');
  } else if (v === 'projects') {
    body = '<div class="project-head"><b>' + esc(x.customer) + '</b>' +
      '<span class="status ' + esc((x.status || 'Active').toLowerCase().replace(/[^a-z]/g,'')) +
      '">' + esc(x.status || 'Active') + '</span></div> — ' + esc(x.project) +
      (x.address ? '<br><span class="muted">' + esc(x.address) + '</span>' : '') +
      (x.next ? '<br><strong>Next:</strong> ' + esc(x.next) : '') +
      (x.note ? '<br><span class="muted">' + esc(x.note) + '</span>' : '');
  } else if (v === 'notes') {
    body = '<b>' + esc(x.title || 'Office Note') + '</b>' +
      (x.category ? '<span class="tag">' + esc(x.category) + '</span>' : '') +
      '<div class="note-preview">' + esc(x.text) + '</div>';
  } else if (v === 'learning') {
    body = '<div class="learning-head"><b>' + esc(x.question || 'Learning Note') + '</b>' +
      (x.category ? '<span class="tag">' + esc(x.category) + '</span>' : '') +
      '</div><div class="note-preview"><strong>What I learned:</strong> ' +
      esc(x.answer) + '</div>' +
      (x.remember ? '<div class="muted"><strong>Remember:</strong> ' + esc(x.remember) + '</div>' : '');
  }

  return '<div class="card item row">' + body +
    '<button onclick="removeItem(\'' + v + '\',' + i + ')">Delete</button></div>';
}

function form(type) {
  const defs = {
    task:['Task',[['title','What needs to be done?'],['due','Due date','date']]],
    followup:['Follow Up',[['person','Who?'],['what','What do I need to follow up about?'],['when','When?','date']]],
    project:['Project',[['customer','Customer'],['address','Address'],['project','Project'],['status','Status'],['next',"What's next?"],['note','Important note','textarea']]],
    note:['Note',[['title','Title'],['category','Category'],['text','Write your note...','textarea']]],
    learning:['Learning',[['question','What was my question?'],['category','Category'],['answer','What did I learn?','textarea'],['remember','What should I remember?','textarea']]],
    appointment:['Appointment',[['title','Appointment / Event'],['person','Who?'],['date','Date','date'],['time','Time','time'],['location','Location']]],
    call:['Call',[['person','Who?'],['phone','Phone'],['reason','What do I need to call about?']]],
    reminder:['Reminder',[['text','Reminder'],['date','Date','date']]]
  };

  const def = defs[type];
  if (!def) return;

  const [title,fields] = def;
  let html = '<div class="form"><h2>Add ' + title + '</h2>';

  fields.forEach((f,i) => {
    html += '<label>' + f[1] + '</label>';
    if (f[2] === 'textarea') {
      html += '<textarea id="f' + i + '"></textarea>';
    } else if (f[0] === 'status') {
      html += '<select id="f' + i + '">' +
        '<option>Active</option><option>Waiting</option><option>Scheduled</option>' +
        '<option>Completed</option><option>On Hold</option></select>';
    } else {
      html += '<input id="f' + i + '" type="' + (f[2] || 'text') + '">';
    }
  });

  html += '<div class="actions"><button onclick="saveForm(\'' + type +
    '\')">Save</button><button onclick="render()">Cancel</button></div></div>';

  document.getElementById('content').innerHTML = html;
  const first = document.getElementById('f0');
  if (first) first.focus();
}

function saveForm(type) {
  const defs = {
    task:['title','due'],
    followup:['person','what','when'],
    project:['customer','address','project','status','next','note'],
    note:['title','category','text'],
    learning:['question','category','answer','remember'],
    appointment:['title','person','date','time','location'],
    call:['person','phone','reason'],
    reminder:['text','date']
  };

  const o = {};
  (defs[type] || []).forEach((k,i) => {
    o[k] = document.getElementById('f' + i)?.value.trim() || '';
  });

  if (['task','appointment','call','reminder'].includes(type)) o.done = false;

  const v = {
    task:'tasks', followup:'followups', project:'projects', note:'notes',
    learning:'learning', appointment:'appointments', call:'calls', reminder:'reminders'
  }[type];

  if (!v) return;

  data[v].unshift(o);
  save();
  view = v === 'tasks' ? 'tasks' : v;
  render();
}

function completeTaskByTitle(title) {
  const x = data.tasks.find(t => t.title === title && !t.done);
  if (x) {
    x.done = true;
    save();
    render();
  }
}

function completeFollowUpByTitle(person, what) {
  const x = data.followups.find(f => !f.done && f.person === person && f.what === what);
  if (x) {
    x.done = true;
    save();
    render();
  }
}

function completeAppointment(i) {
  if (data.appointments[i]) {
    data.appointments[i].done = true;
    save();
    render();
  }
}

function completeCall(i) {
  if (data.calls[i]) {
    data.calls[i].done = true;
    save();
    render();
  }
}

function completeReminder(i) {
  if (data.reminders[i]) {
    data.reminders[i].done = true;
    save();
    render();
  }
}

function toggle(v,i) {
  if (data[v]?.[i]) {
    data[v][i].done = !data[v][i].done;
    save();
    render();
  }
}

function removeItem(v,i) {
  if (!data[v]?.[i]) return;
  if (!confirm('Delete this item?')) return;
  data[v].splice(i,1);
  save();
  render();
}

render();
