/* =====================================================
   Study & Class Planner — app.js
   Full Application Controller
   ===================================================== */

'use strict';

// ===================== DEFAULT DATA =====================

const DEFAULT_SUBJECTS = [
  { id: 's1', code: 'SFT', name: 'Science for Technology', teacher: '', color: '#10b981', progress: 35 },
  { id: 's2', code: 'ICT', name: 'Information & Communication Technology', teacher: '', color: '#06b6d4', progress: 50 },
  { id: 's3', code: 'ET',  name: 'Engineering Technology', teacher: '', color: '#8b5cf6', progress: 20 },
];

const DEFAULT_EVENTS = [
  // 0=Mon 1=Tue 2=Wed 3=Thu 4=Fri 5=Sat 6=Sun
  { id: 'e1', type:'CLASS', subjectId:'s2', title:'AL – Revision', day:0, start:'08:00', end:'11:00', notes:'', status:'pending' },
  { id: 'e2', type:'CLASS', subjectId:'s1', title:'SFT Rounding', day:1, start:'09:00', end:'11:00', notes:'', status:'pending' },
  { id: 'e3', type:'STUDY', subjectId:'s1', title:'sft reading',  day:1, start:'12:00', end:'12:30', notes:'', status:'pending' },
  { id: 'e4', type:'STUDY', subjectId:'s2', title:'sft reading',  day:2, start:'12:00', end:'12:30', notes:'', status:'pending' },
  { id: 'e5', type:'STUDY', subjectId:'s1', title:'sft solid modules', day:2, start:'15:00', end:'17:00', notes:'', status:'pending' },
  { id: 'e6', type:'STUDY', subjectId:'s3', title:'ET rec or lesson', day:2, start:'15:00', end:'17:00', notes:'', status:'pending' },
  { id: 'e7', type:'CLASS', subjectId:'s2', title:'ICT3017 AL – Revision', day:3, start:'10:00', end:'14:30', notes:'', status:'pending' },
  { id: 'e8', type:'CLASS', subjectId:'s2', title:'ET 2027 AL – Revision', day:4, start:'09:30', end:'14:30', notes:'', status:'pending' },
  { id: 'e9', type:'STUDY', subjectId:'s3', title:'bst recording', day:4, start:'16:00', end:'18:00', notes:'', status:'pending' },
  { id:'e10', type:'CLASS', subjectId:'s1', title:'ET 2027 AL – Theory', day:6, start:'08:00', end:'10:30', notes:'', status:'pending' },
];

const DEFAULT_WEEKS = Array.from({length:52}, (_,i)=>({
  week: i+1, goal: '', milestone: '', completed: false
}));

const DEFAULT_SETTINGS = {
  theme: 'dark',
  examDate: '',
  examLabel: 'A/L 2027',
  pomodoroFocus: 25,
  pomodoroShort: 5,
  pomodoroLong: 15,
};

const QUOTES = [
  '"Small steps every day lead to big results."',
  '"Discipline is choosing between what you want now and what you want most."',
  '"The secret of getting ahead is getting started."',
  '"Push yourself, because no one else is going to do it for you."',
  '"Success is the sum of small efforts repeated day in and day out."',
  '"Don\'t watch the clock; do what it does. Keep going."',
  '"Study hard now, shine brighter later."',
  '"Every expert was once a beginner."',
  '"Winners focus on winning. Losers focus on winners."',
  '"One today is worth two tomorrows."',
];

const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DAY_SHORT = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
const TIMETABLE_START = 7; // 07:00
const TIMETABLE_END   = 23; // 23:00
const HOUR_PX = 60;

// ===================== STATE =====================
let state = {
  subjects: [],
  events: [],
  recordings: [],
  papers: [],
  tasks: [],
  weeks: [],
  settings: {},
  streak: 0,
  studyDays: [],
};

// ===================== PERSISTENCE =====================
function loadState() {
  try {
    const raw = localStorage.getItem('studyplanner_v2');
    if (raw) {
      const saved = JSON.parse(raw);
      state = { ...state, ...saved };
    } else {
      state.subjects  = JSON.parse(JSON.stringify(DEFAULT_SUBJECTS));
      state.events    = JSON.parse(JSON.stringify(DEFAULT_EVENTS));
      state.weeks     = JSON.parse(JSON.stringify(DEFAULT_WEEKS));
      state.settings  = { ...DEFAULT_SETTINGS };
      state.recordings = [];
      state.papers     = [];
      state.tasks      = [];
      state.studyDays  = [];
    }
  } catch(e) {
    state.subjects  = JSON.parse(JSON.stringify(DEFAULT_SUBJECTS));
    state.events    = JSON.parse(JSON.stringify(DEFAULT_EVENTS));
    state.weeks     = JSON.parse(JSON.stringify(DEFAULT_WEEKS));
    state.settings  = { ...DEFAULT_SETTINGS };
    state.recordings = [];
    state.papers     = [];
    state.tasks      = [];
    state.studyDays  = [];
  }
}

function saveState() {
  try { localStorage.setItem('studyplanner_v2', JSON.stringify(state)); }
  catch(e) { console.warn('Save failed', e); }
}

// ===================== UTILS =====================
function uid() { return '_' + Math.random().toString(36).substr(2,9); }

function showToast(msg, duration=2500) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function getSubjectById(id) { return state.subjects.find(s => s.id === id) || null; }

function timeToMinutes(t) {
  const [h,m] = t.split(':').map(Number);
  return h*60 + m;
}

function minutesToTime(m) {
  const h = Math.floor(m/60).toString().padStart(2,'0');
  const min = (m%60).toString().padStart(2,'0');
  return `${h}:${min}`;
}

function getDayOfWeek() {
  // Returns 0=Mon .. 6=Sun
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

function getCurrentWeek() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
}

function gradeFromScore(score) {
  if (score >= 75) return { grade:'A', color:'#10b981' };
  if (score >= 65) return { grade:'B', color:'#06b6d4' };
  if (score >= 50) return { grade:'C', color:'#f59e0b' };
  if (score >= 35) return { grade:'S', color:'#8b5cf6' };
  return { grade:'F', color:'#ef4444' };
}

function formatDate(d) {
  return d.toLocaleDateString('en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}

// ===================== VIEW SWITCHER =====================
let currentView = 'dashboard';

function switchView(view) {
  currentView = view;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const el = document.getElementById(`view-${view}`);
  if (el) el.classList.add('active');

  const titles = {
    dashboard:'Dashboard', timetable:'Timetable', studywork:'Study Work',
    performance:'Performance', weeks52:'52 Weeks', subjects:'Subjects', settings:'Data & Settings'
  };
  document.getElementById('viewTitle').textContent = titles[view] || view;
  renderView(view);
}

function renderView(view) {
  switch(view) {
    case 'dashboard':  renderDashboard(); break;
    case 'timetable':  renderTimetable(); break;
    case 'studywork':  renderStudyWork(); break;
    case 'performance': renderPerformance(); break;
    case 'weeks52':    renderWeeks52(); break;
    case 'subjects':   renderSubjects(); break;
    case 'settings':   renderSettings(); break;
  }
}

// ===================== LIVE BANNER =====================
function updateLiveBanner() {
  const now = new Date();
  const todayDay = getDayOfWeek();
  const currentMins = now.getHours()*60 + now.getMinutes();
  const todayEvents = state.events.filter(e => e.day === todayDay && e.status !== 'cancelled');

  let current = null, next = null;
  for (const e of todayEvents) {
    const s = timeToMinutes(e.start);
    const en = timeToMinutes(e.end);
    if (currentMins >= s && currentMins < en) { current = e; break; }
  }
  if (!current) {
    const future = todayEvents.filter(e => timeToMinutes(e.start) > currentMins)
      .sort((a,b) => timeToMinutes(a.start) - timeToMinutes(b.start));
    if (future.length) next = future[0];
  }

  const banner = document.getElementById('liveBanner');
  const bannerText = document.getElementById('liveBannerText');
  if (current) {
    const subj = getSubjectById(current.subjectId);
    banner.style.display = 'flex';
    bannerText.textContent = `🟢 NOW: ${current.type} — ${current.title}${subj ? ' ('+subj.code+')' : ''} | ${current.start} – ${current.end}`;
  } else if (next) {
    const subj = getSubjectById(next.subjectId);
    banner.style.display = 'flex';
    bannerText.textContent = `⏳ NEXT: ${next.title}${subj ? ' ('+subj.code+')' : ''} starts at ${next.start}`;
    banner.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(6,182,212,0.08))';
    banner.style.borderColor = 'rgba(99,102,241,0.3)';
    banner.style.color = 'var(--primary-light)';
  } else {
    banner.style.display = 'none';
  }
}

// ===================== EXAM COUNTDOWN =====================
function updateExamCountdown() {
  const { examDate, examLabel } = state.settings;
  const el = document.getElementById('countdownValue');
  const lbl = document.getElementById('examCountdown').querySelector('.countdown-label');
  if (!examDate) { el.textContent = 'Set date'; return; }
  const now = new Date();
  const exam = new Date(examDate);
  const diff = exam - now;
  if (diff <= 0) { el.textContent = 'Exam day! 🎉'; return; }
  const days = Math.floor(diff / 86400000);
  const hrs  = Math.floor((diff % 86400000) / 3600000);
  lbl.textContent = examLabel || 'A/L Exam';
  el.textContent = `${days}d ${hrs}h`;
}

// ===================== DASHBOARD =====================
function renderDashboard() {
  renderDateDisplay();
  renderStreak();
  renderWeekHours();
  renderTodaySchedule();
  renderUpcoming();
  renderCompletedToday();
  renderPendingTasks();
  drawMiniChart();
}

function renderDateDisplay() {
  document.getElementById('currentDateDisplay').textContent = formatDate(new Date());
}

function renderStreak() {
  const streak = calcStreak();
  document.getElementById('streakCount').textContent = streak;
}

function calcStreak() {
  const days = state.studyDays || [];
  let streak = 0;
  const today = new Date(); today.setHours(0,0,0,0);
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (days.includes(key)) streak++;
    else break;
  }
  return streak;
}

function renderWeekHours() {
  const todayDay = getDayOfWeek();
  // Count hours of completed sessions this week
  let mins = 0;
  state.events.filter(e => e.status === 'done').forEach(e => {
    mins += timeToMinutes(e.end) - timeToMinutes(e.start);
  });
  const hrs = (mins/60).toFixed(1);
  document.getElementById('weekHours').textContent = `${hrs}h`;
}

function renderCompletedToday() {
  const todayDay = getDayOfWeek();
  const done = state.events.filter(e => e.day === todayDay && e.status === 'done').length;
  document.getElementById('completedToday').textContent = done;
}

function renderPendingTasks() {
  const pending = state.tasks.filter(t => !t.done).length;
  document.getElementById('pendingTasks').textContent = pending;
}

function renderTodaySchedule() {
  const todayDay = getDayOfWeek();
  const events = state.events
    .filter(e => e.day === todayDay)
    .sort((a,b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  const container = document.getElementById('todaySchedule');

  if (!events.length) {
    container.innerHTML = '<p class="empty-msg">No sessions scheduled for today. 🎉</p>';
    return;
  }
  container.innerHTML = events.map(e => {
    const subj = getSubjectById(e.subjectId);
    const color = subj ? subj.color : '#6366f1';
    const badge = `<span class="today-item-badge type-${e.type}" style="background:${color}22;color:${color}">${e.type}</span>`;
    return `<div class="today-item ${e.status}" style="border-left-color:${color}">
      <div class="today-item-time">${e.start}<br/>${e.end}</div>
      <div class="today-item-info">
        <div class="today-item-title">${e.status === 'done' ? '✅ ' : ''}${e.title}</div>
        <div class="today-item-sub">${subj ? subj.code : '—'}</div>
      </div>
      <div style="display:flex;gap:6px;align-items:center;">
        ${badge}
        <button class="tt-action-btn done-btn today-act-btn" title="${e.status === 'done' ? 'Mark Pending' : 'Mark Done'}" data-id="${e.id}" data-action="done" style="width:24px;height:24px;">✓</button>
      </div>
    </div>`;
  }).join('');

  container.querySelectorAll('.today-act-btn').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      handleEventAction(btn.dataset.id, 'done');
    });
  });
}

function renderUpcoming() {
  const todayDay = getDayOfWeek();
  const now = new Date();
  const currentMins = now.getHours()*60 + now.getMinutes();
  const upcoming = state.events
    .filter(e => {
      if (e.day === todayDay) return timeToMinutes(e.start) > currentMins;
      return e.day > todayDay;
    })
    .sort((a,b) => {
      if (a.day !== b.day) return a.day - b.day;
      return timeToMinutes(a.start) - timeToMinutes(b.start);
    })
    .slice(0,5);

  const container = document.getElementById('upcomingSessions');
  if (!upcoming.length) { container.innerHTML = '<p class="empty-msg">Nothing upcoming this week.</p>'; return; }
  container.innerHTML = upcoming.map(e => {
    const subj = getSubjectById(e.subjectId);
    const color = subj ? subj.color : '#6366f1';
    const dayLabel = e.day === todayDay ? 'Today' : DAY_SHORT[e.day];
    return `<div class="today-item" style="border-left-color:${color}">
      <div class="today-item-time">${dayLabel}<br/>${e.start}</div>
      <div class="today-item-info">
        <div class="today-item-title">${e.title}</div>
        <div class="today-item-sub">${subj ? subj.code : '—'}</div>
      </div>
      <span class="today-item-badge" style="background:${color}22;color:${color}">${e.type}</span>
    </div>`;
  }).join('');
}

function drawMiniChart() {
  const canvas = document.getElementById('miniChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const days = DAY_SHORT;
  const data = days.map((_, i) => {
    const events = state.events.filter(e => e.day === i && e.status === 'done');
    let mins = 0;
    events.forEach(e => mins += timeToMinutes(e.end) - timeToMinutes(e.start));
    return +(mins/60).toFixed(1);
  });

  const W = canvas.width = canvas.offsetWidth || 400;
  const H = 160;
  canvas.height = H;
  ctx.clearRect(0,0,W,H);

  const pad = 36; const barW = (W - pad*2) / 7;
  const maxVal = Math.max(...data, 1);
  const todayIdx = getDayOfWeek();

  const isLight = document.documentElement.getAttribute('data-theme') === 'light';

  data.forEach((val, i) => {
    const x = pad + i * barW + barW*0.15;
    const bw = barW * 0.7;
    const bh = Math.max(((val / maxVal) * (H - 50)), val > 0 ? 4 : 0);
    const y = H - 24 - bh;

    const isToday = i === todayIdx;
    const grad = ctx.createLinearGradient(x, y, x, H-24);
    if (isToday) {
      grad.addColorStop(0, '#6366f1');
      grad.addColorStop(1, '#22d3ee40');
    } else {
      grad.addColorStop(0, isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)');
      grad.addColorStop(1, isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, bw, bh, 5);
    else ctx.rect(x, y, bw, bh);
    ctx.fill();

    // Glow for today
    if (isToday && bh > 4) {
      ctx.shadowColor = '#6366f1';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = isToday ? (isLight ? '#4f46e5' : '#f1f5f9') : (isLight ? '#64748b' : '#4b5a70');
    ctx.font = '500 10px Inter, Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText(days[i], x + bw/2, H - 8);

    if (val > 0) {
      ctx.fillStyle = isToday ? (isLight ? '#4f46e5' : '#a5b4fc') : (isLight ? '#64748b' : '#4b5a70');
      ctx.font = '600 10px Inter, Segoe UI';
      ctx.fillText(val+'h', x + bw/2, y - 4);
    }
  });
}

// ===================== TIMETABLE =====================
let ttFilter = 'all';
let ttSubjectFilter = '';

function renderTimetable() {
  populateSubjectFilter();
  buildTimetableGrid();
}

function populateSubjectFilter() {
  const sel = document.getElementById('subjectFilter');
  sel.innerHTML = '<option value="">All Subjects</option>';
  state.subjects.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.code;
    sel.appendChild(opt);
  });
}

function buildTimetableGrid() {
  const grid = document.getElementById('timetableGrid');
  grid.innerHTML = '';
  const todayDay = getDayOfWeek();
  const hours = TIMETABLE_END - TIMETABLE_START; // 16

  // Header row
  const timeHeader = document.createElement('div');
  timeHeader.className = 'tt-day-header time-header';
  timeHeader.textContent = 'TIME';
  grid.appendChild(timeHeader);

  DAY_NAMES.forEach((name, i) => {
    const h = document.createElement('div');
    h.className = 'tt-day-header' + (i === todayDay ? ' today-col' : '');
    h.textContent = name + (i === todayDay ? ' ★' : '');
    grid.appendChild(h);
  });

  // Time label column + Day columns
  for (let hr = 0; hr < hours; hr++) {
    const hour = TIMETABLE_START + hr;
    const label = document.createElement('div');
    label.className = 'tt-time-label';
    label.textContent = `${String(hour).padStart(2,'0')}:00`;
    grid.appendChild(label);

    for (let d = 0; d < 7; d++) {
      const cell = document.createElement('div');
      cell.className = 'tt-day-col';
      cell.style.height = HOUR_PX + 'px';
      cell.dataset.day = d;
      cell.dataset.hour = hour;
      // Hour line
      const line = document.createElement('div');
      line.className = 'tt-hour-line';
      cell.appendChild(line);
      // Click to add event quickly
      cell.addEventListener('click', (e) => {
        if (e.target === cell || e.target === line) {
          openAddEventModal(d, hour);
        }
      });
      grid.appendChild(cell);
    }
  }

  // Now place events
  let filteredEvents = state.events;
  if (ttFilter !== 'all') filteredEvents = filteredEvents.filter(e => e.type === ttFilter);
  if (ttSubjectFilter) filteredEvents = filteredEvents.filter(e => e.subjectId === ttSubjectFilter);

  filteredEvents.forEach(ev => placeEvent(ev, grid));
}

function placeEvent(ev, grid) {
  const subj = getSubjectById(ev.subjectId);
  const color = subj ? subj.color : '#6366f1';
  const startM = timeToMinutes(ev.start);
  const endM = timeToMinutes(ev.end);
  const startHr = Math.floor(startM / 60);
  const topOffset = ((startM - TIMETABLE_START*60) / 60) * HOUR_PX + ((ev.day+1) >= 0 ? 0 : 0); // relative to grid

  // Find the day column cells for this event
  // We use absolute positioning within the container
  const dayCol = grid.querySelectorAll(`.tt-day-col[data-day="${ev.day}"]`);
  if (!dayCol.length) return;

  // We'll place inside the grid container with absolute positioning
  // Calculate top relative to grid (after header row)
  const topPx = ((startM - TIMETABLE_START*60) / 60) * HOUR_PX;
  const heightPx = Math.max(((endM - startM) / 60) * HOUR_PX - 4, 84);

  // Use the first day-col cell as a reference container
  const container = dayCol[0].closest('.tt-day-col') || dayCol[0];

  // Find the correct column using grid position
  // We place in a wrapper approach instead
  const block = document.createElement('div');
  block.className = `tt-event type-${ev.type} ${ev.status === 'done' ? 'done' : ''} ${ev.status === 'cancelled' ? 'cancelled' : ''}`;
  block.style.cssText = `
    top: ${topPx}px;
    height: ${heightPx}px;
    color: ${color};
    border-left-color: ${color};
    background: linear-gradient(135deg, ${color}18, ${color}08);
  `;

  const statusIcon = ev.status === 'done' ? '✅' : ev.status === 'cancelled' ? '❌' : '';

  block.innerHTML = `
    <div class="tt-card-top" style="display:flex;align-items:center;justify-content:space-between;gap:4px;margin-bottom:3px;">
      <span class="tt-event-badge" style="background:${color}28;color:${color}">${ev.type}</span>
      <span class="tt-event-time">${ev.start} – ${ev.end}</span>
    </div>
    <div class="tt-event-title">${statusIcon ? statusIcon + ' ' : ''}${ev.title}</div>
    <div class="tt-event-sub">${subj ? subj.code : ''}${ev.notes ? ' · ' + ev.notes : ''}</div>
    <div class="tt-event-actions">
      <button class="tt-action-btn done-btn" title="Mark Done" data-id="${ev.id}" data-action="done">✓</button>
      <button class="tt-action-btn cancel-btn" title="Cancel/Skip" data-id="${ev.id}" data-action="cancel">✕</button>
      <button class="tt-action-btn edit-btn" title="Edit" data-id="${ev.id}" data-action="edit">✎</button>
      <button class="tt-action-btn del-btn" title="Delete" data-id="${ev.id}" data-action="delete">🗑</button>
    </div>
  `;

  block.querySelectorAll('.tt-action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleEventAction(btn.dataset.id, btn.dataset.action);
    });
  });

  // Each day column has multiple cells stacked. Place event in the right spot.
  // We use a column-wrapper div approach — find cell at top row
  const allDayCells = Array.from(grid.querySelectorAll(`.tt-day-col[data-day="${ev.day}"]`));
  if (allDayCells.length > 0) {
    // place in first cell but use relative positioning across all cells
    allDayCells[0].style.position = 'relative';
    // Actually we need a column wrapper
    // Create a wrapper for this day if needed
    let wrapper = grid.querySelector(`.tt-col-wrapper[data-day="${ev.day}"]`);
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'tt-col-wrapper';
      wrapper.dataset.day = ev.day;
      wrapper.style.cssText = `
        position: absolute;
        top: 0; bottom: 0;
        pointer-events: none;
      `;
    }
    block.style.position = 'absolute';
    block.style.pointerEvents = 'all';
  }

  // Simpler: place directly in the first time-slot cell that matches and use absolute within that cell column
  // Find the cell where the event starts
  const startCellHr = startHr;
  const startCell = grid.querySelector(`.tt-day-col[data-day="${ev.day}"][data-hour="${startCellHr}"]`);
  if (!startCell) {
    // Outside display range
    // Use first cell and offset
    const firstCell = grid.querySelector(`.tt-day-col[data-day="${ev.day}"]`);
    if (firstCell) {
      firstCell.appendChild(block);
      block.style.position = 'absolute';
      block.style.top = topPx + 'px';
      block.style.height = heightPx + 'px';
    }
    return;
  }

  // Place in the appropriate cell, with top offset relative to that cell
  const cellTopMins = startCellHr * 60;
  const relativeTopPx = ((startM - cellTopMins) / 60) * HOUR_PX;
  block.style.position = 'absolute';
  block.style.top = relativeTopPx + 'px';
  block.style.height = heightPx + 'px';
  startCell.appendChild(block);
}

function handleEventAction(id, action) {
  const ev = state.events.find(e => e.id === id);
  if (!ev) return;

  if (action === 'done') {
    ev.status = ev.status === 'done' ? 'pending' : 'done';
    if (ev.status === 'done') markStudyDay();
    showToast(ev.status === 'done' ? '✅ Marked as done!' : 'Marked as pending');
  } else if (action === 'cancel') {
    ev.status = ev.status === 'cancelled' ? 'pending' : 'cancelled';
    showToast(ev.status === 'cancelled' ? '❌ Session cancelled' : 'Restored');
  } else if (action === 'edit') {
    openEditEventModal(ev);
    return;
  } else if (action === 'delete') {
    if (confirm(`Delete "${ev.title}"?`)) {
      state.events = state.events.filter(e => e.id !== id);
      showToast('🗑️ Event deleted');
    } else return;
  }
  saveState();
  renderTimetable();
  if (currentView === 'dashboard') renderDashboard();
}

function markStudyDay() {
  const today = new Date().toISOString().split('T')[0];
  if (!state.studyDays.includes(today)) {
    state.studyDays.push(today);
    saveState();
  }
}

// ===================== TIMETABLE FILTERS =====================
document.querySelectorAll('.tt-controls .filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tt-controls .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ttFilter = btn.dataset.filter || 'all';
    if (currentView === 'timetable') renderTimetable();
  });
});

document.getElementById('subjectFilter').addEventListener('change', (e) => {
  ttSubjectFilter = e.target.value;
  if (currentView === 'timetable') renderTimetable();
});

// ===================== ADD/EDIT EVENT MODAL =====================
let editingEventId = null;

function openAddEventModal(day=0, hour=8) {
  editingEventId = null;
  document.getElementById('eventModalTitle').textContent = 'Add Event';
  document.getElementById('eventType').value = 'STUDY';
  document.getElementById('eventDay').value = day;
  document.getElementById('eventStart').value = `${String(hour).padStart(2,'0')}:00`;
  document.getElementById('eventEnd').value = `${String(hour+2).padStart(2,'0')}:00`;
  document.getElementById('eventTitle').value = '';
  document.getElementById('eventNotes').value = '';
  populateEventSubjects();
  openModal('eventModal');
}

function openEditEventModal(ev) {
  editingEventId = ev.id;
  document.getElementById('eventModalTitle').textContent = 'Edit Event';
  document.getElementById('eventType').value = ev.type;
  document.getElementById('eventDay').value = ev.day;
  document.getElementById('eventStart').value = ev.start;
  document.getElementById('eventEnd').value = ev.end;
  document.getElementById('eventTitle').value = ev.title;
  document.getElementById('eventNotes').value = ev.notes || '';
  populateEventSubjects(ev.subjectId);
  openModal('eventModal');
}

function populateEventSubjects(selectedId='') {
  const sel = document.getElementById('eventSubject');
  sel.innerHTML = state.subjects.map(s =>
    `<option value="${s.id}" ${s.id===selectedId?'selected':''}>${s.code} – ${s.name}</option>`
  ).join('');
}

document.getElementById('saveEventBtn').addEventListener('click', () => {
  const type = document.getElementById('eventType').value;
  const subjectId = document.getElementById('eventSubject').value;
  const title = document.getElementById('eventTitle').value.trim();
  const day = parseInt(document.getElementById('eventDay').value);
  const start = document.getElementById('eventStart').value;
  const end = document.getElementById('eventEnd').value;
  const notes = document.getElementById('eventNotes').value.trim();

  if (!title) { showToast('⚠️ Please enter a title'); return; }
  if (timeToMinutes(start) >= timeToMinutes(end)) { showToast('⚠️ End time must be after start time'); return; }

  if (editingEventId) {
    const ev = state.events.find(e => e.id === editingEventId);
    if (ev) Object.assign(ev, { type, subjectId, title, day, start, end, notes });
    showToast('✏️ Event updated');
  } else {
    state.events.push({ id: uid(), type, subjectId, title, day, start, end, notes, status:'pending' });
    showToast('✅ Event added');
  }

  saveState();
  closeModal('eventModal');
  if (currentView === 'timetable') renderTimetable();
  if (currentView === 'dashboard') renderDashboard();
});

document.getElementById('addEventBtn').addEventListener('click', () => openAddEventModal());

// ===================== STUDY WORK =====================
function renderStudyWork() {
  renderRecordings();
  renderPapers();
  renderTasks();
  populateStudyWorkSubjects();
}

function populateStudyWorkSubjects() {
  ['recSubject','paperSubject','taskSubject'].forEach(selId => {
    const sel = document.getElementById(selId);
    sel.innerHTML = state.subjects.map(s =>
      `<option value="${s.id}">${s.code}</option>`
    ).join('');
  });
}

// Study Work Tabs
document.querySelectorAll('.sw-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.sw-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.sw-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('panel-' + tab.dataset.swtab).classList.add('active');
  });
});

// --- RECORDINGS ---
function renderRecordings() {
  const list = document.getElementById('recordingsList');
  if (!state.recordings.length) { list.innerHTML = '<p class="empty-msg">No recordings tracked yet.</p>'; return; }
  list.innerHTML = state.recordings.map(r => {
    const subj = getSubjectById(r.subjectId);
    const color = subj ? subj.color : '#6366f1';
    return `<div class="item-card ${r.watched ? 'done' : ''}">
      <div class="item-check ${r.watched ? 'checked' : ''}" data-id="${r.id}" data-type="rec">
        ${r.watched ? '✓' : ''}
      </div>
      <div class="item-info">
        <div class="item-title">${r.title}</div>
        <div class="item-sub" style="color:${color}">${subj ? subj.code : ''} · ${r.duration ? r.duration + ' min' : ''} ${r.notes ? '· ' + r.notes : ''}</div>
      </div>
      <button class="item-del-btn" data-id="${r.id}" data-type="rec">🗑</button>
    </div>`;
  }).join('');

  list.querySelectorAll('.item-check').forEach(el => {
    el.addEventListener('click', () => {
      const rec = state.recordings.find(r => r.id === el.dataset.id);
      if (rec) { rec.watched = !rec.watched; saveState(); renderRecordings(); }
    });
  });
  list.querySelectorAll('.item-del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Delete this recording?')) {
        state.recordings = state.recordings.filter(r => r.id !== btn.dataset.id);
        saveState(); renderRecordings();
      }
    });
  });
}

let editingRecId = null;
document.getElementById('addRecordingBtn').addEventListener('click', () => {
  editingRecId = null;
  document.getElementById('recordingModalTitle').textContent = 'Add Recording';
  document.getElementById('recTitle').value = '';
  document.getElementById('recDuration').value = '';
  document.getElementById('recNotes').value = '';
  populateStudyWorkSubjects();
  openModal('recordingModal');
});

document.getElementById('saveRecordingBtn').addEventListener('click', () => {
  const title = document.getElementById('recTitle').value.trim();
  if (!title) { showToast('⚠️ Title required'); return; }
  const rec = {
    id: uid(),
    title,
    subjectId: document.getElementById('recSubject').value,
    duration: document.getElementById('recDuration').value,
    notes: document.getElementById('recNotes').value.trim(),
    watched: false
  };
  state.recordings.push(rec);
  saveState();
  closeModal('recordingModal');
  renderRecordings();
  showToast('🎬 Recording added');
});

// --- PAPERS ---
function renderPapers() {
  const list = document.getElementById('papersList');
  if (!state.papers.length) { list.innerHTML = '<p class="empty-msg">No papers logged yet.</p>'; return; }
  list.innerHTML = state.papers.map(p => {
    const subj = getSubjectById(p.subjectId);
    const color = subj ? subj.color : '#6366f1';
    const mcq = parseInt(p.mcq) || 0;
    const essay = parseInt(p.essay) || 0;
    const total = mcq + essay;
    const pct = Math.round((total / 100) * 100);
    const { grade, color: gradeColor } = gradeFromScore(pct);
    const statusBadge = `<span class="item-badge badge-${p.status.replace(' ', '-')}">${p.status}</span>`;
    return `<div class="item-card">
      <div class="paper-score">
        <div class="paper-score-num" style="color:${gradeColor}">${pct}%</div>
        <div class="paper-score-grade" style="color:${gradeColor}">${grade}</div>
      </div>
      <div class="item-info">
        <div class="item-title">${p.name}</div>
        <div class="item-sub" style="color:${color}">${subj ? subj.code : ''} · MCQ: ${mcq}/40 · Essay: ${essay}/60</div>
      </div>
      ${statusBadge}
      <button class="item-del-btn" data-id="${p.id}">🗑</button>
    </div>`;
  }).join('');

  list.querySelectorAll('.item-del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Delete this paper?')) {
        state.papers = state.papers.filter(p => p.id !== btn.dataset.id);
        saveState(); renderPapers();
      }
    });
  });
}

document.getElementById('addPaperBtn').addEventListener('click', () => {
  document.getElementById('paperName').value = '';
  document.getElementById('paperMCQ').value = '';
  document.getElementById('paperEssay').value = '';
  document.getElementById('paperStatus').value = 'not-started';
  populateStudyWorkSubjects();
  openModal('paperModal');
});

document.getElementById('savePaperBtn').addEventListener('click', () => {
  const name = document.getElementById('paperName').value.trim();
  if (!name) { showToast('⚠️ Paper name required'); return; }
  state.papers.push({
    id: uid(),
    name,
    subjectId: document.getElementById('paperSubject').value,
    mcq: document.getElementById('paperMCQ').value,
    essay: document.getElementById('paperEssay').value,
    status: document.getElementById('paperStatus').value
  });
  saveState();
  closeModal('paperModal');
  renderPapers();
  showToast('📄 Paper logged');
});

// --- TASKS ---
let taskPriorityFilter = '';
function renderTasks() {
  let tasks = [...state.tasks];
  if (taskPriorityFilter) tasks = tasks.filter(t => t.priority === taskPriorityFilter);
  tasks.sort((a,b) => {
    const order = { urgent:0, high:1, normal:2 };
    return (order[a.priority]||2) - (order[b.priority]||2);
  });

  const list = document.getElementById('tasksList');
  if (!tasks.length) { list.innerHTML = '<p class="empty-msg">No tasks here. Great job! 🎉</p>'; return; }
  list.innerHTML = tasks.map(t => {
    const subj = getSubjectById(t.subjectId);
    const color = subj ? subj.color : '#6366f1';
    return `<div class="item-card ${t.done ? 'done' : ''}">
      <div class="item-check ${t.done ? 'checked' : ''}" data-id="${t.id}" data-type="task">
        ${t.done ? '✓' : ''}
      </div>
      <div class="item-info">
        <div class="item-title">${t.desc}</div>
        <div class="item-sub" style="color:${color}">${subj ? subj.code : '—'}${t.due ? ' · Due: ' + t.due : ''}</div>
      </div>
      <span class="item-badge badge-${t.priority}">${t.priority}</span>
      <button class="item-del-btn" data-id="${t.id}">🗑</button>
    </div>`;
  }).join('');

  list.querySelectorAll('.item-check').forEach(el => {
    el.addEventListener('click', () => {
      const task = state.tasks.find(t => t.id === el.dataset.id);
      if (task) { task.done = !task.done; saveState(); renderTasks(); renderDashboard(); }
    });
  });
  list.querySelectorAll('.item-del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Delete this task?')) {
        state.tasks = state.tasks.filter(t => t.id !== btn.dataset.id);
        saveState(); renderTasks(); renderDashboard();
      }
    });
  });
}

document.querySelectorAll('.task-filters .filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.task-filters .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    taskPriorityFilter = btn.dataset.priority;
    renderTasks();
  });
});

document.getElementById('addTaskBtn').addEventListener('click', () => {
  document.getElementById('taskDesc').value = '';
  document.getElementById('taskPriority').value = 'normal';
  document.getElementById('taskDue').value = '';
  populateStudyWorkSubjects();
  openModal('taskModal');
});

document.getElementById('saveTaskBtn').addEventListener('click', () => {
  const desc = document.getElementById('taskDesc').value.trim();
  if (!desc) { showToast('⚠️ Task description required'); return; }
  state.tasks.push({
    id: uid(),
    desc,
    subjectId: document.getElementById('taskSubject').value,
    priority: document.getElementById('taskPriority').value,
    due: document.getElementById('taskDue').value,
    done: false
  });
  saveState();
  closeModal('taskModal');
  renderTasks();
  renderDashboard();
  showToast('✏️ Task added');
});

// ===================== PERFORMANCE =====================
function renderPerformance() {
  drawDailyChart();
  drawSubjectChart();
  renderCompletionStats();
  renderStreakDisplay();
}

function drawDailyChart() {
  const canvas = document.getElementById('dailyChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 500;
  const H = 200;
  canvas.height = H;
  ctx.clearRect(0,0,W,H);

  const data = DAY_SHORT.map((_, i) => {
    let mins = 0;
    state.events.filter(e => e.day === i && e.status === 'done')
      .forEach(e => mins += timeToMinutes(e.end) - timeToMinutes(e.start));
    return +(mins/60).toFixed(1);
  });

  const pad = 42;
  const barW = (W - pad*2) / 7;
  const maxVal = Math.max(...data, 1);
  const todayIdx = getDayOfWeek();

  const isLight = document.documentElement.getAttribute('data-theme') === 'light';

  data.forEach((val, i) => {
    const x = pad + i * barW + barW*0.12;
    const bw = barW * 0.76;
    const bh = Math.max(((val / maxVal) * (H - 58)), val > 0 ? 5 : 0);
    const y = H - 32 - bh;
    const isToday = i === todayIdx;

    const grad = ctx.createLinearGradient(x, y, x, H - 32);
    if (isToday) {
      grad.addColorStop(0, '#6366f1');
      grad.addColorStop(1, '#22d3ee55');
    } else {
      grad.addColorStop(0, isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.09)');
      grad.addColorStop(1, isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, bw, bh, 6);
    else ctx.rect(x, y, bw, bh);
    ctx.fill();

    if (isToday && bh > 5) {
      ctx.shadowColor = '#6366f1';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = isToday ? (isLight ? '#4f46e5' : '#f1f5f9') : (isLight ? '#64748b' : '#4b5a70');
    ctx.font = '600 11px Inter, Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText(DAY_SHORT[i], x + bw/2, H - 12);

    if (val > 0) {
      ctx.fillStyle = isToday ? (isLight ? '#4f46e5' : '#a5b4fc') : (isLight ? '#64748b' : '#94a3b8');
      ctx.font = '600 11px Inter, Segoe UI';
      ctx.fillText(val + 'h', x + bw/2, y - 6);
    }
  });

  ctx.fillStyle = isLight ? '#64748b' : '#64748b';
  ctx.font = '500 11px Inter, Segoe UI';
  ctx.textAlign = 'left';
  ctx.fillText('Hours Studied', 4, 16);
}

function drawSubjectChart() {
  const canvas = document.getElementById('subjectChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 400;
  const H = 200;
  canvas.height = H;
  ctx.clearRect(0,0,W,H);

  const isLight = document.documentElement.getAttribute('data-theme') === 'light';

  const data = state.subjects.map(s => {
    let mins = 0;
    state.events.filter(e => e.subjectId === s.id && e.status === 'done')
      .forEach(e => mins += timeToMinutes(e.end) - timeToMinutes(e.start));
    return { code: s.code, hrs: +(mins/60).toFixed(1), color: s.color };
  });

  const total = data.reduce((a, b) => a + b.hrs, 0);
  if (total === 0) {
    ctx.fillStyle = '#64748b';
    ctx.font = '500 13px Inter, Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('No completed study sessions yet', W/2, H/2);
    document.getElementById('subjectLegend').innerHTML = '';
    return;
  }

  // Modern Donut chart
  const cx = W/2, cy = H/2, outerR = Math.min(W, H)/2 - 16, innerR = outerR * 0.62;
  let start = -Math.PI/2;
  data.forEach(d => {
    if (d.hrs <= 0) return;
    const slice = (d.hrs / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, start, start + slice);
    ctx.arc(cx, cy, innerR, start + slice, start, true);
    ctx.closePath();
    ctx.fillStyle = d.color;
    ctx.fill();
    ctx.strokeStyle = isLight ? '#ffffff' : '#080c14';
    ctx.lineWidth = 3;
    ctx.stroke();
    start += slice;
  });

  // Center text inside donut
  ctx.fillStyle = isLight ? '#0f172a' : '#f1f5f9';
  ctx.font = '700 16px Inter, Segoe UI';
  ctx.textAlign = 'center';
  ctx.fillText(total + 'h', cx, cy + 3);
  ctx.fillStyle = isLight ? '#64748b' : '#64748b';
  ctx.font = '500 10px Inter, Segoe UI';
  ctx.fillText('TOTAL', cx, cy + 17);

  // Legend
  const legend = document.getElementById('subjectLegend');
  legend.innerHTML = data.map(d => {
    const pct = total > 0 ? Math.round((d.hrs/total)*100) : 0;
    return `<div class="legend-item" style="background:rgba(255,255,255,0.03);padding:4px 10px;border-radius:20px;border:1px solid rgba(255,255,255,0.06);">
      <div class="legend-dot" style="background:${d.color}"></div>
      <span style="font-weight:600">${d.code}:</span> ${d.hrs}h (${pct}%)
    </div>`;
  }).join('');
}

function renderCompletionStats() {
  const total = state.events.length;
  const done = state.events.filter(e => e.status === 'done').length;
  const cancelled = state.events.filter(e => e.status === 'cancelled').length;
  const pct = total ? Math.round((done/total)*100) : 0;
  const cancelPct = total ? Math.round((cancelled/total)*100) : 0;

  document.getElementById('completionStats').innerHTML = `
    <div class="comp-row">
      <div class="comp-label"><span>Completed Sessions</span><span>${done}/${total} (${pct}%)</span></div>
      <div class="comp-bar"><div class="comp-fill" style="width:${pct}%"></div></div>
    </div>
    <div class="comp-row">
      <div class="comp-label"><span>Tasks Completed</span><span>${state.tasks.filter(t=>t.done).length}/${state.tasks.length}</span></div>
      <div class="comp-bar"><div class="comp-fill" style="width:${state.tasks.length ? Math.round((state.tasks.filter(t=>t.done).length/state.tasks.length)*100) : 0}%;background:linear-gradient(90deg,#10b981,#06b6d4)"></div></div>
    </div>
    <div class="comp-row">
      <div class="comp-label"><span>Recordings Watched</span><span>${state.recordings.filter(r=>r.watched).length}/${state.recordings.length}</span></div>
      <div class="comp-bar"><div class="comp-fill" style="width:${state.recordings.length ? Math.round((state.recordings.filter(r=>r.watched).length/state.recordings.length)*100) : 0}%;background:linear-gradient(90deg,#8b5cf6,#ec4899)"></div></div>
    </div>
    <div class="comp-row">
      <div class="comp-label"><span>Cancelled Sessions</span><span>${cancelled} (${cancelPct}%)</span></div>
      <div class="comp-bar"><div class="comp-fill" style="width:${cancelPct}%;background:linear-gradient(90deg,#ef4444,#f59e0b)"></div></div>
    </div>
  `;
}

function renderStreakDisplay() {
  const streak = calcStreak();
  document.getElementById('streakBig').textContent = streak;
  document.getElementById('streakFlame').textContent = streak > 0 ? '🔥' : '💤';

  // Last 14 days calendar
  const cal = document.getElementById('streakCalendar');
  cal.innerHTML = '';
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const active = state.studyDays.includes(key);
    const day = document.createElement('div');
    day.className = 'streak-day' + (active ? ' active' : '');
    day.title = key;
    day.textContent = d.getDate();
    cal.appendChild(day);
  }
}

// ===================== 52 WEEKS =====================
function renderWeeks52() {
  const grid = document.getElementById('weeksGrid');
  const currentWeek = getCurrentWeek();
  grid.innerHTML = state.weeks.map(w => {
    const milestoneIcons = { exam:'📝', revision:'🔄', papers:'📄', important:'⭐' };
    const icon = milestoneIcons[w.milestone] || '';
    const isCurrent = w.week === currentWeek;
    return `<div class="week-card ${w.completed?'completed':''} ${w.milestone?'milestone-'+w.milestone:''} ${isCurrent?'current-week':''}"
              data-week="${w.week}">
      ${icon ? `<div class="week-milestone-icon">${icon}</div>` : ''}
      <div class="week-num">${w.week}</div>
      <div class="week-goal-text">${w.goal || (isCurrent ? '← Now' : '')}</div>
      ${w.completed ? '<div class="week-check">✅</div>' : ''}
    </div>`;
  }).join('');

  grid.querySelectorAll('.week-card').forEach(card => {
    card.addEventListener('click', () => openWeekModal(parseInt(card.dataset.week)));
  });
}

let editingWeek = null;
function openWeekModal(weekNum) {
  editingWeek = weekNum;
  const w = state.weeks.find(w => w.week === weekNum);
  document.getElementById('weekModalTitle').textContent = `Week ${weekNum}`;
  document.getElementById('weekGoal').value = w ? w.goal : '';
  document.getElementById('weekMilestone').value = w ? w.milestone : '';
  document.getElementById('weekCompleted').value = w ? String(w.completed) : 'false';
  openModal('weekModal');
}

document.getElementById('saveWeekBtn').addEventListener('click', () => {
  const w = state.weeks.find(w => w.week === editingWeek);
  if (w) {
    w.goal = document.getElementById('weekGoal').value.trim();
    w.milestone = document.getElementById('weekMilestone').value;
    w.completed = document.getElementById('weekCompleted').value === 'true';
    saveState();
    closeModal('weekModal');
    renderWeeks52();
    showToast(`📅 Week ${editingWeek} updated`);
  }
});

// ===================== SUBJECTS =====================
function renderSubjects() {
  const grid = document.getElementById('subjectsGrid');
  if (!state.subjects.length) {
    grid.innerHTML = '<p class="empty-msg" style="grid-column:1/-1">No subjects added yet.</p>';
    return;
  }
  grid.innerHTML = state.subjects.map(s => `
    <div class="subject-card" style="border-left-color:${s.color}">
      <div class="subj-card-top">
        <div>
          <div class="subj-code" style="color:${s.color}">${s.code}</div>
          <div class="subj-name">${s.name}</div>
          ${s.teacher ? `<div class="subj-teacher">👨‍🏫 ${s.teacher}</div>` : ''}
        </div>
        <div class="subj-card-actions">
          <button class="icon-btn" data-id="${s.id}" data-action="edit" title="Edit">✎</button>
          <button class="icon-btn" data-id="${s.id}" data-action="delete" title="Delete">🗑</button>
        </div>
      </div>
      <div class="subj-progress-label">
        <span>Syllabus Progress</span>
        <span>${s.progress}%</span>
      </div>
      <div class="subj-progress-bar">
        <div class="subj-progress-fill" style="width:${s.progress}%;background:${s.color}"></div>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.icon-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.action === 'edit') openEditSubjectModal(btn.dataset.id);
      if (btn.dataset.action === 'delete') {
        if (confirm('Delete this subject? Events linked to it will lose their subject tag.')) {
          state.subjects = state.subjects.filter(s => s.id !== btn.dataset.id);
          saveState(); renderSubjects();
          showToast('🗑️ Subject deleted');
        }
      }
    });
  });
}

let editingSubjectId = null;
let selectedColor = '#06b6d4';

function openAddSubjectModal() {
  editingSubjectId = null;
  document.getElementById('subjectModalTitle').textContent = 'Add Subject';
  document.getElementById('subjectCode').value = '';
  document.getElementById('subjectName').value = '';
  document.getElementById('subjectTeacher').value = '';
  document.getElementById('subjectProgress').value = 0;
  document.getElementById('syllabusPct').textContent = '0';
  setSelectedColor('#06b6d4');
  openModal('subjectModal');
}

function openEditSubjectModal(id) {
  editingSubjectId = id;
  const s = state.subjects.find(s => s.id === id);
  if (!s) return;
  document.getElementById('subjectModalTitle').textContent = 'Edit Subject';
  document.getElementById('subjectCode').value = s.code;
  document.getElementById('subjectName').value = s.name;
  document.getElementById('subjectTeacher').value = s.teacher || '';
  document.getElementById('subjectProgress').value = s.progress;
  document.getElementById('syllabusPct').textContent = s.progress;
  setSelectedColor(s.color);
  openModal('subjectModal');
}

function setSelectedColor(color) {
  selectedColor = color;
  document.querySelectorAll('.color-swatch').forEach(sw => {
    sw.classList.toggle('selected', sw.dataset.color === color);
  });
}

document.querySelectorAll('.color-swatch').forEach(sw => {
  sw.addEventListener('click', () => setSelectedColor(sw.dataset.color));
});

document.getElementById('subjectProgress').addEventListener('input', (e) => {
  document.getElementById('syllabusPct').textContent = e.target.value;
});

document.getElementById('addSubjectBtn').addEventListener('click', openAddSubjectModal);

document.getElementById('saveSubjectBtn').addEventListener('click', () => {
  const code = document.getElementById('subjectCode').value.trim().toUpperCase();
  const name = document.getElementById('subjectName').value.trim();
  if (!code || !name) { showToast('⚠️ Code and name required'); return; }

  if (editingSubjectId) {
    const s = state.subjects.find(s => s.id === editingSubjectId);
    if (s) Object.assign(s, {
      code, name,
      teacher: document.getElementById('subjectTeacher').value.trim(),
      color: selectedColor,
      progress: parseInt(document.getElementById('subjectProgress').value)
    });
    showToast('✏️ Subject updated');
  } else {
    state.subjects.push({
      id: uid(), code, name,
      teacher: document.getElementById('subjectTeacher').value.trim(),
      color: selectedColor,
      progress: parseInt(document.getElementById('subjectProgress').value)
    });
    showToast('📚 Subject added');
  }
  saveState();
  closeModal('subjectModal');
  renderSubjects();
});

// ===================== SETTINGS =====================
function renderSettings() {
  document.getElementById('examDateInput').value = state.settings.examDate || '';
  document.getElementById('examLabelInput').value = state.settings.examLabel || 'A/L 2027';
  document.getElementById('pomodoroFocus').value = state.settings.pomodoroFocus || 25;
  document.getElementById('pomodoroShort').value = state.settings.pomodoroShort || 5;
  document.getElementById('pomodoroLong').value = state.settings.pomodoroLong || 15;
}

document.getElementById('saveExamDate').addEventListener('click', () => {
  state.settings.examDate  = document.getElementById('examDateInput').value;
  state.settings.examLabel = document.getElementById('examLabelInput').value.trim() || 'A/L 2027';
  saveState();
  updateExamCountdown();
  showToast('⏳ Exam date saved');
});

document.getElementById('savePomodoroSettings').addEventListener('click', () => {
  state.settings.pomodoroFocus = parseInt(document.getElementById('pomodoroFocus').value) || 25;
  state.settings.pomodoroShort = parseInt(document.getElementById('pomodoroShort').value) || 5;
  state.settings.pomodoroLong  = parseInt(document.getElementById('pomodoroLong').value) || 15;
  saveState();
  resetPomodoro();
  showToast('🍅 Timer settings saved');
});

document.getElementById('exportDataBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `study_planner_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📤 Data exported');
});

document.getElementById('importFileInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const imported = JSON.parse(ev.target.result);
      if (confirm('This will replace all current data. Continue?')) {
        state = { ...state, ...imported };
        saveState();
        init();
        showToast('📥 Data imported successfully!', 3000);
      }
    } catch { showToast('❌ Invalid backup file'); }
  };
  reader.readAsText(file);
  e.target.value = '';
});

document.getElementById('clearAllDataBtn').addEventListener('click', () => {
  if (confirm('⚠️ This will delete ALL your data permanently! Are you sure?')) {
    if (confirm('This cannot be undone. Confirm again to proceed.')) {
      localStorage.removeItem('studyplanner_v2');
      location.reload();
    }
  }
});

// ===================== POMODORO TIMER =====================
let pomState = {
  running: false,
  phase: 'focus', // 'focus' | 'short' | 'long'
  sessionCount: 1,
  remaining: 25 * 60,
  total: 25 * 60,
  interval: null
};

function getPomDuration(phase) {
  const s = state.settings;
  if (phase === 'focus') return (s.pomodoroFocus || 25) * 60;
  if (phase === 'short') return (s.pomodoroShort || 5) * 60;
  return (s.pomodoroLong || 15) * 60;
}

function resetPomodoro() {
  clearInterval(pomState.interval);
  pomState.running = false;
  pomState.phase = 'focus';
  pomState.remaining = pomState.total = getPomDuration('focus');
  pomState.sessionCount = 1;
  updatePomodoroUI();
}

function updatePomodoroUI() {
  const mins = Math.floor(pomState.remaining / 60);
  const secs = pomState.remaining % 60;
  document.getElementById('focusTime').textContent =
    `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;

  const phaseLabels = { focus:'Focus 🍅', short:'Short Break ☕', long:'Long Break 🛌' };
  document.getElementById('focusPhase').textContent = phaseLabels[pomState.phase];
  const iconEl = document.querySelector('#focusWidget .focus-icon');
  if (iconEl) iconEl.textContent = pomState.phase === 'focus' ? '🍅' : pomState.phase === 'short' ? '☕' : '🛌';
  document.getElementById('pomodoroCount').textContent = pomState.sessionCount;

  // Progress ring
  const circumference = 276.5;
  const progress = 1 - (pomState.remaining / pomState.total);
  const offset = circumference - (progress * circumference);
  const ring = document.getElementById('focusProgress');
  ring.style.strokeDashoffset = offset;

  const phaseColors = { focus:'#6366f1', short:'#10b981', long:'#06b6d4' };
  ring.style.stroke = phaseColors[pomState.phase];

  document.getElementById('focusStartBtn').style.display = pomState.running ? 'none' : 'flex';
  document.getElementById('focusPauseBtn').style.display = pomState.running ? 'flex' : 'none';
}

function startPomodoro() {
  if (pomState.running) return;
  pomState.running = true;
  pomState.interval = setInterval(() => {
    pomState.remaining--;
    if (pomState.remaining <= 0) {
      clearInterval(pomState.interval);
      pomState.running = false;
      playBeep();
      nextPomodoroPhase();
    }
    updatePomodoroUI();
  }, 1000);
  updatePomodoroUI();
}

function pausePomodoro() {
  clearInterval(pomState.interval);
  pomState.running = false;
  updatePomodoroUI();
}

function nextPomodoroPhase() {
  if (pomState.phase === 'focus') {
    pomState.sessionCount++;
    if (pomState.sessionCount % 4 === 1) {
      pomState.phase = 'long';
      showToast('🛌 Long break time! (15 min)', 4000);
    } else {
      pomState.phase = 'short';
      showToast('☕ Short break! (5 min)', 3000);
    }
  } else {
    pomState.phase = 'focus';
    showToast('🍅 Back to focus! Let\'s go!', 3000);
  }
  pomState.remaining = pomState.total = getPomDuration(pomState.phase);
  updatePomodoroUI();
}

function skipPomodoroPhase() {
  clearInterval(pomState.interval);
  pomState.running = false;
  nextPomodoroPhase();
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.5);
  } catch(e) {}
}

document.getElementById('focusStartBtn').addEventListener('click', startPomodoro);
document.getElementById('focusPauseBtn').addEventListener('click', pausePomodoro);
document.getElementById('focusResetBtn').addEventListener('click', resetPomodoro);
document.getElementById('focusSkipBtn').addEventListener('click', skipPomodoroPhase);

// Focus widget toggle
document.getElementById('focusToggle').addEventListener('click', () => {
  document.getElementById('focusWidget').classList.toggle('open');
});

// ===================== MODAL CLOSE =====================
document.querySelectorAll('.modal-close, [data-modal]').forEach(btn => {
  btn.addEventListener('click', () => {
    const modalId = btn.dataset.modal;
    if (modalId) closeModal(modalId);
  });
});
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ===================== NAV =====================
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

// Sidebar toggle
document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('collapsed');
});

// ===================== QUICK ACTIONS =====================
document.getElementById('quickAddSession').addEventListener('click', () => {
  openAddEventModal();
  openModal('eventModal');
  populateEventSubjects();
});
document.getElementById('quickStartPomodoro').addEventListener('click', () => {
  document.getElementById('focusWidget').classList.add('open');
  startPomodoro();
});
document.getElementById('quickAddTask').addEventListener('click', () => {
  document.getElementById('taskDesc').value = '';
  document.getElementById('taskPriority').value = 'normal';
  document.getElementById('taskDue').value = '';
  populateStudyWorkSubjects();
  openModal('taskModal');
});
document.getElementById('quickAddPaper').addEventListener('click', () => {
  document.getElementById('paperName').value = '';
  document.getElementById('paperMCQ').value = '';
  document.getElementById('paperEssay').value = '';
  document.getElementById('paperStatus').value = 'not-started';
  populateStudyWorkSubjects();
  openModal('paperModal');
});
document.getElementById('goToTimetableBtn').addEventListener('click', () => switchView('timetable'));

// ===================== QUOTES =====================
function updateQuote() {
  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  document.getElementById('quoteText').textContent = q;
}

// ===================== THEME CONTROLLER =====================
function applyTheme(theme) {
  if (!theme) theme = 'dark';
  state.settings.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.getElementById('themeIcon');
  const text = document.getElementById('themeText');
  if (icon && text) {
    if (theme === 'light') {
      icon.textContent = '☀️';
      text.textContent = 'Light';
    } else {
      icon.textContent = '🌙';
      text.textContent = 'Dark';
    }
  }
  // Refresh charts if on view with charts
  if (currentView === 'dashboard') drawMiniChart();
  if (currentView === 'performance') { drawDailyChart(); drawSubjectChart(); }
}

function toggleTheme() {
  const current = state.settings.theme || 'dark';
  const newTheme = current === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
  saveState();
  showToast(newTheme === 'light' ? '☀️ Light Mode activated' : '🌙 Dark Mode activated');
}

// Theme Event Listeners
const themeToggleBtn = document.getElementById('themeToggleBtn');
if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);

const setDarkBtn = document.getElementById('setDarkThemeBtn');
if (setDarkBtn) setDarkBtn.addEventListener('click', () => {
  applyTheme('dark');
  saveState();
  showToast('🌙 Dark Mode activated');
});

const setLightBtn = document.getElementById('setLightThemeBtn');
if (setLightBtn) setLightBtn.addEventListener('click', () => {
  applyTheme('light');
  saveState();
  showToast('☀️ Light Mode activated');
});

// ===================== INIT =====================
function init() {
  loadState();
  applyTheme(state.settings.theme || 'dark');
  updateQuote();
  updateExamCountdown();
  updateLiveBanner();
  switchView('dashboard');
  resetPomodoro();

  // Live updates every minute
  setInterval(() => {
    updateLiveBanner();
    updateExamCountdown();
    if (currentView === 'dashboard') renderDashboard();
  }, 60000);

  // Rotate quotes every 30s
  setInterval(updateQuote, 30000);

  // Resize charts on window resize
  window.addEventListener('resize', () => {
    if (currentView === 'dashboard') drawMiniChart();
    if (currentView === 'performance') { drawDailyChart(); drawSubjectChart(); }
  });
}

init();
