const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

const messages = [
  { role: 'system', content: 'You are a helpful assistant.' },
];

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

  chatInput.value = '';
  chatInput.disabled = true;

  messages.push({ role: 'user', content: text });
  appendMessage('user', text);

  const pending = appendMessage('assistant pending', 'Thinking…');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });

    if (!res.ok) throw new Error('Request failed');

    const data = await res.json();
    pending.textContent = data.reply;
    pending.className = 'message assistant';
    messages.push({ role: 'assistant', content: data.reply });
  } catch (err) {
    pending.textContent = 'Sorry, something went wrong.';
    pending.className = 'message assistant';
  } finally {
    chatInput.disabled = false;
    chatInput.focus();
  }
});
