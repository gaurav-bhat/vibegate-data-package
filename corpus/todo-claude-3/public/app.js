const viewAuth = document.getElementById('view-auth');
const viewApp = document.getElementById('view-app');

const formLogin = document.getElementById('form-login');
const formSignup = document.getElementById('form-signup');
const authError = document.getElementById('auth-error');

const whoEmail = document.getElementById('who-email');
const btnLogout = document.getElementById('btn-logout');
const formAdd = document.getElementById('form-add');
const addInput = document.getElementById('add-input');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const taskError = document.getElementById('task-error');
const progressFill = document.getElementById('progress-fill');
const progressLabel = document.getElementById('progress-label');

function flash(el, message) {
  el.textContent = message;
  el.classList.remove('hidden');
}

function clearFlash(el) {
  el.classList.add('hidden');
}

document.querySelectorAll('[data-target]').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    clearFlash(authError);
    const showSignup = link.dataset.target === 'signup';
    formSignup.classList.toggle('hidden', !showSignup);
    formLogin.classList.toggle('hidden', showSignup);
  });
});

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    // 204s and similar have no body
  }
  if (!res.ok) {
    throw new Error((body && body.error) || 'Something went wrong.');
  }
  return body;
}

function enterApp(email) {
  viewAuth.classList.add('hidden');
  viewApp.classList.remove('hidden');
  whoEmail.textContent = email;
}

function enterAuth() {
  viewApp.classList.add('hidden');
  viewAuth.classList.remove('hidden');
  taskList.innerHTML = '';
}

formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFlash(authError);
  try {
    const user = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value,
      }),
    });
    formLogin.reset();
    enterApp(user.email);
    await refreshTasks();
  } catch (err) {
    flash(authError, err.message);
  }
});

formSignup.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFlash(authError);
  try {
    const user = await api('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: document.getElementById('signup-email').value,
        password: document.getElementById('signup-password').value,
      }),
    });
    formSignup.reset();
    enterApp(user.email);
    await refreshTasks();
  } catch (err) {
    flash(authError, err.message);
  }
});

btnLogout.addEventListener('click', async () => {
  try {
    await api('/api/auth/logout', { method: 'POST' });
  } catch {
    // clear the client view regardless of network hiccups
  }
  enterAuth();
});

function updateProgress(tasks) {
  const done = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  progressFill.style.width = total ? `${Math.round((done / total) * 100)}%` : '0%';
  progressLabel.textContent = `${done} of ${total} done`;
}

function buildTaskRow(task) {
  const li = document.createElement('li');
  li.className = 'task-item' + (task.completed ? ' done' : '');

  const check = document.createElement('button');
  check.type = 'button';
  check.className = 'task-check' + (task.completed ? ' checked' : '');
  check.textContent = task.completed ? '✓' : '';
  check.addEventListener('click', () => toggleTask(task.id, !task.completed));

  const label = document.createElement('span');
  label.className = 'task-label';
  label.textContent = task.label;

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'task-remove';
  remove.textContent = '✕';
  remove.title = 'Delete task';
  remove.addEventListener('click', () => removeTask(task.id));

  li.append(check, label, remove);
  return li;
}

function renderTasks(tasks) {
  taskList.innerHTML = '';
  emptyState.classList.toggle('hidden', tasks.length > 0);
  tasks.forEach((task) => taskList.appendChild(buildTaskRow(task)));
  updateProgress(tasks);
}

async function refreshTasks() {
  clearFlash(taskError);
  try {
    renderTasks(await api('/api/tasks'));
  } catch (err) {
    flash(taskError, err.message);
  }
}

formAdd.addEventListener('submit', async (e) => {
  e.preventDefault();
  const label = addInput.value.trim();
  if (!label) return;
  clearFlash(taskError);
  try {
    await api('/api/tasks', { method: 'POST', body: JSON.stringify({ label }) });
    addInput.value = '';
    await refreshTasks();
  } catch (err) {
    flash(taskError, err.message);
  }
});

async function toggleTask(id, completed) {
  clearFlash(taskError);
  try {
    await api(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed }),
    });
    await refreshTasks();
  } catch (err) {
    flash(taskError, err.message);
  }
}

async function removeTask(id) {
  clearFlash(taskError);
  try {
    await api(`/api/tasks/${id}`, { method: 'DELETE' });
    await refreshTasks();
  } catch (err) {
    flash(taskError, err.message);
  }
}

(async function bootstrap() {
  try {
    const user = await api('/api/auth/session');
    enterApp(user.email);
    await refreshTasks();
  } catch {
    enterAuth();
  }
})();
