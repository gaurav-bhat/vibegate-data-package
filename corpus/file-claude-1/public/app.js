const form = document.getElementById('upload-form');
const fileInput = document.getElementById('file-input');
const status = document.getElementById('status');
const gallery = document.getElementById('gallery');

async function loadGallery() {
  const res = await fetch('/api/images');
  const images = await res.json();
  gallery.innerHTML = images
    .map((url) => `<div class="card"><img src="${url}" alt="Uploaded image" /></div>`)
    .join('');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = fileInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('image', file);

  status.textContent = 'Uploading...';
  try {
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed.');
    status.textContent = 'Uploaded!';
    form.reset();
    await loadGallery();
  } catch (err) {
    status.textContent = err.message;
  }
});

loadGallery();
