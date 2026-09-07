/* EDUGLOBAL LTD — shared front-end behaviour */

(function navToggle(){
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if(!toggle || !nav) return;
  toggle.addEventListener('click', function(){
    var open = nav.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){
      nav.classList.remove('open');
      toggle.classList.remove('open');
    });
  });
})();

(function activeLink(){
  var here = (location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.main-nav a').forEach(function(a){
    var href = a.getAttribute('href');
    if(href === here || (here === '' && href === 'index.html')){
      a.classList.add('active');
    }
  });
})();

(function footerYear(){
  var el = document.getElementById('year');
  if(el) el.textContent = new Date().getFullYear();
})();

/* ---------------------------------------------------------------------
   Ongoing Projects data layer
   Stored in the visitor's browser (localStorage) under one key.
   A starter set ships so the Projects page is never empty on first load.
--------------------------------------------------------------------- */
var EG_STORE_KEY = 'eduglobal_projects_v1';

var EG_SEED_PROJECTS = [
  {
    id: 'seed-1',
    title: 'Digital Skills for Rural Educators',
    headline: 'Building classroom-ready digital literacy across 40 schools',
    description: 'A training and mentoring programme equipping primary and secondary school teachers with practical digital skills, lesson-planning tools, and ongoing coaching support.',
    date: '2026-06-01'
  },
  {
    id: 'seed-2',
    title: 'Community Needs Assessment Study',
    headline: 'Evidence gathering to guide a district development plan',
    description: 'A mixed-methods research study collecting and analysing data on education, livelihoods, and access to services to inform local government planning decisions.',
    date: '2026-07-14'
  },
  {
    id: 'seed-3',
    title: 'AI Adoption Readiness Programme',
    headline: 'Helping three partner organisations plan responsible AI use',
    description: 'A consultancy and training engagement supporting organisational leaders to assess readiness, build staff AI literacy, and design responsible adoption roadmaps.',
    date: '2026-08-02'
  }
];

function egGetProjects(){
  try{
    var raw = localStorage.getItem(EG_STORE_KEY);
    if(!raw){
      localStorage.setItem(EG_STORE_KEY, JSON.stringify(EG_SEED_PROJECTS));
      return EG_SEED_PROJECTS.slice();
    }
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  }catch(e){
    console.error('Could not read saved projects', e);
    return [];
  }
}

function egSaveProjects(list){
  try{
    localStorage.setItem(EG_STORE_KEY, JSON.stringify(list));
    return true;
  }catch(e){
    console.error('Could not save projects', e);
    return false;
  }
}

function egFormatDate(iso){
  try{
    var d = new Date(iso + 'T00:00:00');
    if(isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { year:'numeric', month:'long', day:'numeric' });
  }catch(e){ return iso; }
}

function egEscape(str){
  var div = document.createElement('div');
  div.textContent = str == null ? '' : str;
  return div.innerHTML;
}

/* ---- Render projects on projects.html ---- */
function egRenderProjects(){
  var grid = document.getElementById('projects-grid');
  var empty = document.getElementById('projects-empty');
  if(!grid) return;

  var projects = egGetProjects().slice().sort(function(a,b){
    return new Date(b.date) - new Date(a.date);
  });

  if(projects.length === 0){
    grid.style.display = 'none';
    if(empty) empty.style.display = 'block';
    return;
  }
  if(empty) empty.style.display = 'none';
  grid.style.display = 'grid';

  grid.innerHTML = projects.map(function(p){
    return (
      '<article class="project-card">' +
        '<span class="tag">Ongoing Project</span>' +
        '<h3>' + egEscape(p.title) + '</h3>' +
        '<div class="headline">' + egEscape(p.headline) + '</div>' +
        '<p class="desc">' + egEscape(p.description) + '</p>' +
        '<div class="meta">Posted ' + egEscape(egFormatDate(p.date)) + '</div>' +
      '</article>'
    );
  }).join('');
}

/* ---- Admin page logic ---- */
var EG_ADMIN_SESSION_KEY = 'eduglobal_admin_session_v1';
var EG_ADMIN_PASSCODE = 'EduGlobal2026'; // change this before you go live

function egAdminIsUnlocked(){
  return sessionStorage.getItem(EG_ADMIN_SESSION_KEY) === 'granted';
}

function egInitAdmin(){
  var lockView = document.getElementById('admin-lock');
  var panelView = document.getElementById('admin-panel');
  var lockForm = document.getElementById('admin-lock-form');
  var lockError = document.getElementById('admin-lock-error');
  var logoutBtn = document.getElementById('admin-logout');
  if(!lockView || !panelView) return;

  function showPanel(){
    lockView.style.display = 'none';
    panelView.style.display = 'block';
    egRenderAdminList();
  }
  function showLock(){
    panelView.style.display = 'none';
    lockView.style.display = 'block';
  }

  if(egAdminIsUnlocked()){ showPanel(); } else { showLock(); }

  lockForm && lockForm.addEventListener('submit', function(e){
    e.preventDefault();
    var val = document.getElementById('admin-passcode').value.trim();
    if(val === EG_ADMIN_PASSCODE){
      sessionStorage.setItem(EG_ADMIN_SESSION_KEY, 'granted');
      lockError.classList.remove('show');
      showPanel();
    } else {
      lockError.classList.add('show');
    }
  });

  logoutBtn && logoutBtn.addEventListener('click', function(){
    sessionStorage.removeItem(EG_ADMIN_SESSION_KEY);
    showLock();
  });

  var form = document.getElementById('project-form');
  var success = document.getElementById('project-form-success');
  form && form.addEventListener('submit', function(e){
    e.preventDefault();
    var title = document.getElementById('p-title').value.trim();
    var headline = document.getElementById('p-headline').value.trim();
    var description = document.getElementById('p-description').value.trim();
    if(!title || !headline || !description) return;

    var list = egGetProjects();
    list.push({
      id: 'p-' + Date.now(),
      title: title,
      headline: headline,
      description: description,
      date: new Date().toISOString().slice(0,10)
    });
    egSaveProjects(list);
    form.reset();
    success.classList.add('show');
    setTimeout(function(){ success.classList.remove('show'); }, 3500);
    egRenderAdminList();
  });
}

function egRenderAdminList(){
  var list = document.getElementById('admin-list');
  if(!list) return;
  var projects = egGetProjects().slice().sort(function(a,b){
    return new Date(b.date) - new Date(a.date);
  });

  if(projects.length === 0){
    list.innerHTML = '<p style="color:var(--ink-faint); font-size:0.9rem;">No projects posted yet. Use the form above to add the first one.</p>';
    return;
  }

  list.innerHTML = projects.map(function(p){
    return (
      '<div class="admin-list-item">' +
        '<div>' +
          '<h4>' + egEscape(p.title) + '</h4>' +
          '<p>' + egEscape(p.headline) + '</p>' +
        '</div>' +
        '<button class="link-danger" data-id="' + egEscape(p.id) + '">Delete</button>' +
      '</div>'
    );
  }).join('');

  list.querySelectorAll('.link-danger').forEach(function(btn){
    btn.addEventListener('click', function(){
      var id = btn.getAttribute('data-id');
      var updated = egGetProjects().filter(function(p){ return p.id !== id; });
      egSaveProjects(updated);
      egRenderAdminList();
    });
  });
}

document.addEventListener('DOMContentLoaded', function(){
  egRenderProjects();
  egInitAdmin();
});
