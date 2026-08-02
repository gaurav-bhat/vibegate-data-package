const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const authAlert = document.getElementById('auth-alert');
const showSignupLink = document.getElementById('show-signup');
const showLoginLink = document.getElementById('show-login');

const userEmailEl = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const addTaskForm = document.getElementById('add-task-form');
const newTaskInput = document.getElementById('new-task-input');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const taskAlert = document.getElementById('task-alert');

function showAlert(el, message) {
  el.textContent = message;
  el.classList.remove('hidden');
}

function hideAlert(el) {
  el.classList.add('hidden');
}

function showAuthScreen() {
  appScreen.classList.add('hidden');
  authScreen.classList.remove('hidden');
}

function showAppScreen(email) {
  authScreen.classList.add('hidden');
  appScreen.classList.remove('hidden');
  userEmailEl.textContent = email;
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body (e.g. 204)
  }
  if (!res.ok) {
    throw new Error((data && data.error) || 'Something went wrong.');
  }
  return data;
}

// --- Auth ---

showSignupLink.addEventListener('click', (e) => {
  e.preventDefault();
  hideAlert(authAlert);
  loginForm.classList.add('hidden');
  signupForm.classList.remove('hidden');
});

showLoginLink.addEventListener('click', (e) => {
  e.preventDefault();
  hideAlert(authAlert);
  signupForm.classList.add('hidden');
  loginForm.classList.remove('hidden');
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert(authAlert);
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  try {
    const user = await api('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    loginForm.reset();
    showAppScreen(user.email);
    await loadTasks();
  } catch (err) {
    showAlert(authAlert, err.message);
  }
});

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert(authAlert);
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  try {
    const user = await api('/api/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    signupForm.reset();
    showAppScreen(user.email);
    await loadTasks();
  } catch (err) {
    showAlert(authAlert, err.message);
  }
});

logoutBtn.addEventListener('click', async () => {
  try {
    await api('/api/logout', { method: 'POST' });
  } catch {
    // ignore - clear client state regardless
  }
  taskList.innerHTML = '';
  showAuthScreen();
});

// --- Tasks ---

function renderTasks(tasks) {
  taskList.innerHTML = '';
  emptyState.classList.toggle('hidden', tasks.length > 0);

  for (const task of tasks) {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.done ? ' done' : '');
    li.dataset.id = task.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !!task.done;
    checkbox.addEventListener('change', () => toggleTask(task.id, checkbox.checked));

    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = task.title;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-icon';
    deleteBtn.textContent = '✕';
    deleteBtn.title = 'Delete task';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    li.append(checkbox, title, deleteBtn);
    taskList.appendChild(li);
  }
}

async function loadTasks() {
  hideAlert(taskAlert);
  try {
    const tasks = await api('/api/tasks');
    renderTasks(tasks);
  } catch (err) {
    showAlert(taskAlert, err.message);
  }
}

addTaskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = newTaskInput.value.trim();
  if (!title) return;
  hideAlert(taskAlert);
  try {
    await api('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
    newTaskInput.value = '';
    await loadTasks();
  } catch (err) {
    showAlert(taskAlert, err.message);
  }
});

async function toggleTask(id, done) {
  hideAlert(taskAlert);
  try {
    await api(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ done }),
    });
    await loadTasks();
  } catch (err) {
    showAlert(taskAlert, err.message);
  }
}

async function deleteTask(id) {
  hideAlert(taskAlert);
  try {
    await api(`/api/tasks/${id}`, { method: 'DELETE' });
    await loadTasks();
  } catch (err) {
    showAlert(taskAlert, err.message);
  }
}

// --- Bootstrap ---

(async function init() {
  try {
    const user = await api('/api/me');
    showAppScreen(user.email);
    await loadTasks();
  } catch {
    showAuthScreen();
  }
})();
