const form = document.getElementById('waitlist-form');
const emailInput = document.getElementById('email');
const message = document.getElementById('form-message');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = '';
  message.className = 'form-message';

  const email = emailInput.value.trim();

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      message.textContent = "You're on the list! We'll be in touch soon.";
      message.classList.add('success');
      form.reset();
    } else {
      message.textContent = data.error || 'Something went wrong. Please try again.';
      message.classList.add('error');
    }
  } catch (err) {
    message.textContent = 'Network error. Please try again.';
    message.classList.add('error');
  } finally {
    submitBtn.disabled = false;
  }
});
