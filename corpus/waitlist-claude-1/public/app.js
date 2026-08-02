const form = document.getElementById('waitlist-form');
const emailInput = document.getElementById('email');
const messageEl = document.getElementById('form-message');

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = `form-message ${type}`;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = emailInput.value.trim();

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();

    if (!res.ok) {
      showMessage(data.error || 'Something went wrong. Please try again.', 'error');
      return;
    }

    showMessage(data.message || "You're on the list!", 'success');
    form.reset();
  } catch (err) {
    showMessage('Network error. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
  }
});
