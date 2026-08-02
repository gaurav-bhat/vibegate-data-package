const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

const history = [];

function appendMessage(role, text) {
  const el = document.createElement('div');
  el.className = `message ${role}`;
  el.textContent = text;
  chatWindow.appendChild(el);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return el;
}

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  appendMessage('user', text);
  history.push({ role: 'user', content: text });
  chatInput.value = '';
  chatInput.disabled = true;

  const pending = appendMessage('assistant', '...');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history }),
    });
    const data = await res.json();

    if (!res.ok) {
      pending.remove();
      appendMessage('error', data.error || 'Something went wrong.');
    } else {
      pending.textContent = data.reply;
      history.push({ role: 'assistant', content: data.reply });
    }
  } catch (err) {
    pending.remove();
    appendMessage('error', 'Failed to reach the server.');
  } finally {
    chatInput.disabled = false;
    chatInput.focus();
  }
});
