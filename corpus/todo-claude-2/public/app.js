const authView = document.getElementById('auth-view');
const appView = document.getElementById('app-view');

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const authError = document.getElementById('auth-error');

const accountEmail = document.getElementById('account-email');
const logoutBtn = document.getElementById('logout-btn');

const addForm = document.getElementById('add-form');
const addInput = document.getElementById('add-input');
const taskError = document.getElementById('task-error');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const taskSummary = document.getElementById('task-summary');

function setBanner(el, message) {
  if (!message) {
    el.classList.add('hidden');
    el.textContent = '';
    return;
  }
  el.textContent = message;
  el.classList.remove('hidden');
}

function switchAuthForm(target) {
  setBanner(authError, null);
  loginForm.classList.toggle('hidden', target !== 'login');
  signupForm.classList.toggle('hidden', target !== 'signup');
}

document.querySelectorAll('[data-switch]').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    switchAuthForm(link.dataset.switch);
  });
});

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let body = null;
  try {
    body = await response.json();
  } catch {
    // e.g. 204 No Content
  }
  if (!response.ok) {
    throw new Error((body && body.error) || 'Something went wrong. Please try again.');
  }
  return body;
}

function showAuthView() {
  appView.classList.add('hidden');
  authView.classList.remove('hidden');
  loginForm.reset();
  signupForm.reset();
  switchAuthForm('login');
}

function showAppView(email) {
  authView.classList.add('hidden');
  appView.classList.remove('hidden');
  accountEmail.textContent = email;
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  setBanner(authError, null);
  try {
    const user = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value,
      }),
    });
    showAppView(user.email);
    await refreshTasks();
  } catch (err) {
    setBanner(authError, err.message);
  }
});

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  setBanner(authError, null);
  try {
    const user = await apiRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: document.getElementById('signup-email').value,
        password: document.getElementById('signup-password').value,
      }),
    });
    showAppView(user.email);
    await refreshTasks();
  } catch (err) {
    setBanner(authError, err.message);
  }
});

logoutBtn.addEventListener('click', async () => {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' });
  } catch {
    // clear client state regardless of server response
  }
  showAuthView();
});

function renderTasks(tasks) {
  taskList.innerHTML = '';
  emptyState.classList.toggle('hidden', tasks.length > 0);
  taskSummary.classList.toggle('hidden', tasks.length === 0);

  if (tasks.length > 0) {
    const remaining = tasks.filter((t) => !t.done).length;
    taskSummary.textContent = `${remaining} of ${tasks.length} remaining`;
  }

  for (const task of tasks) {
    const item = document.createElement('li');
    item.className = 'task-item' + (task.done ? ' done' : '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.done;
    checkbox.addEventListener('change', () => setTaskDone(task.id, checkbox.checked));

    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = task.title;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-delete';
    deleteBtn.textContent = '✕';
    deleteBtn.title = 'Delete task';
    deleteBtn.addEventListener('click', () => removeTask(task.id));

    item.append(checkbox, title, deleteBtn);
    taskList.appendChild(item);
  }
}

async function refreshTasks() {
  setBanner(taskError, null);
  try {
    const tasks = await apiRequest('/api/tasks');
    renderTasks(tasks);
  } catch (err) {
    setBanner(taskError, err.message);
  }
}

addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = addInput.value.trim();
  if (!title) return;
  setBanner(taskError, null);
  try {
    await apiRequest('/api/tasks', { method: 'POST', body: JSON.stringify({ title }) });
    addInput.value = '';
    await refreshTasks();
  } catch (err) {
    setBanner(taskError, err.message);
  }
});

async function setTaskDone(id, done) {
  setBanner(taskError, null);
  try {
    await apiRequest(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ done }) });
    await refreshTasks();
  } catch (err) {
    setBanner(taskError, err.message);
  }
}

async function removeTask(id) {
  setBanner(taskError, null);
  try {
    await apiRequest(`/api/tasks/${id}`, { method: 'DELETE' });
    await refreshTasks();
  } catch (err) {
    setBanner(taskError, err.message);
  }
}

(async function bootstrap() {
  try {
    const user = await apiRequest('/api/auth/me');
    showAppView(user.email);
    await refreshTasks();
  } catch {
    showAuthView();
  }
})();
