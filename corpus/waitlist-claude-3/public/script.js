const form = document.getElementById('waitlist-form');
const emailInput = document.getElementById('email');
const message = document.getElementById('form-message');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = '';
  message.removeAttribute('data-state');

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  try {
    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailInput.value }),
    });

    const data = await res.json();

    if (!res.ok) {
      message.textContent = data.error || 'Something went wrong. Please try again.';
      message.dataset.state = 'error';
      return;
    }

    message.textContent = data.message;
    message.dataset.state = 'success';
    form.reset();
  } catch (err) {
    message.textContent = 'Network error. Please try again.';
    message.dataset.state = 'error';
  } finally {
    submitButton.disabled = false;
  }
});
