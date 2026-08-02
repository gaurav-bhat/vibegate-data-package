const form = document.getElementById('upload-form');
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const dropText = document.getElementById('drop-text');
const uploadBtn = document.getElementById('upload-btn');
const statusEl = document.getElementById('status');
const gallery = document.getElementById('gallery');
const emptyMessage = document.getElementById('empty-message');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');

async function loadGallery() {
  const res = await fetch('/api/images');
  const images = await res.json();
  gallery.innerHTML = '';
  emptyMessage.hidden = images.length > 0;
  for (const image of images) {
    const figure = document.createElement('figure');
    const img = document.createElement('img');
    img.src = image.url;
    img.alt = image.originalName || 'Uploaded image';
    figure.appendChild(img);
    figure.addEventListener('click', () => openLightbox(image.url, img.alt));
    gallery.appendChild(figure);
  }
}

function openLightbox(src, alt) {
  lightboxImg.src = src;
  lightboxImg.alt = alt;
  lightbox.hidden = false;
}

lightboxClose.addEventListener('click', () => {
  lightbox.hidden = true;
});
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) lightbox.hidden = true;
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) {
    dropText.textContent = fileInput.files[0].name;
  }
});

['dragover', 'dragleave', 'drop'].forEach((eventName) => {
  dropZone.addEventListener(eventName, (e) => e.preventDefault());
});
dropZone.addEventListener('dragover', () => dropZone.classList.add('dragover'));
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) {
    fileInput.files = e.dataTransfer.files;
    dropText.textContent = file.name;
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = fileInput.files[0];
  if (!file) {
    statusEl.textContent = 'Choose an image first.';
    return;
  }

  const formData = new FormData();
  formData.append('image', file);

  uploadBtn.disabled = true;
  statusEl.textContent = 'Uploading...';

  try {
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed.');
    statusEl.textContent = 'Uploaded!';
    form.reset();
    dropText.textContent = 'Click to choose an image or drag one here';
    await loadGallery();
  } catch (err) {
    statusEl.textContent = err.message;
  } finally {
    uploadBtn.disabled = false;
  }
});

loadGallery();
