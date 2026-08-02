const rowsEl = document.getElementById('rows');
const bannerEl = document.getElementById('banner');
const createForm = document.getElementById('create-form');
const newName = document.getElementById('new-name');
const newPrice = document.getElementById('new-price');
const newDescription = document.getElementById('new-description');
const createError = document.getElementById('create-error');
const rowTemplate = document.getElementById('row-template');
const editRowTemplate = document.getElementById('edit-row-template');

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

let bannerTimer = null;
function showBanner(message, kind = 'success') {
  bannerEl.textContent = message;
  bannerEl.className = `banner ${kind}`;
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => bannerEl.classList.add('hidden'), 3500);
}

async function fetchProducts() {
  const res = await fetch('/api/products');
  if (!res.ok) throw new Error('Failed to load products.');
  return res.json();
}

function buildRow(product) {
  const fragment = rowTemplate.content.cloneNode(true);
  const tr = fragment.querySelector('tr');
  tr.dataset.id = product.id;
  tr.querySelector('.cell-name').textContent = product.name;
  tr.querySelector('.cell-price').textContent = currency.format(product.price);
  tr.querySelector('.cell-description').textContent = product.description || '—';
  tr.querySelector('.btn-edit').addEventListener('click', () => enterEditMode(tr, product));
  tr.querySelector('.btn-delete').addEventListener('click', () => handleDelete(product));
  return tr;
}

function renderRows(products) {
  rowsEl.innerHTML = '';
  if (!products.length) {
    rowsEl.innerHTML = '<tr><td colspan="4" class="empty">No products yet. Add your first one above.</td></tr>';
    return;
  }
  for (const product of products) {
    rowsEl.appendChild(buildRow(product));
  }
}

async function refresh() {
  try {
    const products = await fetchProducts();
    renderRows(products);
  } catch (err) {
    rowsEl.innerHTML = '<tr><td colspan="4" class="empty">Could not load products.</td></tr>';
    showBanner(err.message, 'error');
  }
}

function enterEditMode(tr, product) {
  const fragment = editRowTemplate.content.cloneNode(true);
  const editTr = fragment.querySelector('tr');
  editTr.dataset.id = product.id;

  const nameInput = editTr.querySelector('.edit-name');
  const priceInput = editTr.querySelector('.edit-price');
  const descriptionInput = editTr.querySelector('.edit-description');
  nameInput.value = product.name;
  priceInput.value = product.price;
  descriptionInput.value = product.description || '';

  editTr.querySelector('.btn-cancel').addEventListener('click', () => {
    editTr.replaceWith(buildRow(product));
  });
  editTr.querySelector('.btn-save').addEventListener('click', () =>
    handleSave(product.id, editTr, { nameInput, priceInput, descriptionInput })
  );

  tr.replaceWith(editTr);
  nameInput.focus();
}

async function handleSave(id, editTr, { nameInput, priceInput, descriptionInput }) {
  const payload = {
    name: nameInput.value.trim(),
    price: parseFloat(priceInput.value),
    description: descriptionInput.value.trim(),
  };

  try {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save product.');

    editTr.replaceWith(buildRow(data));
    showBanner('Product updated.');
  } catch (err) {
    showBanner(err.message, 'error');
  }
}

async function handleDelete(product) {
  if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;

  try {
    const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete product.');
    }
    showBanner('Product deleted.');
    await refresh();
  } catch (err) {
    showBanner(err.message, 'error');
  }
}

createForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  createError.classList.add('hidden');

  const payload = {
    name: newName.value.trim(),
    price: parseFloat(newPrice.value),
    description: newDescription.value.trim(),
  };

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add product.');

    createForm.reset();
    showBanner('Product added.');
    await refresh();
  } catch (err) {
    createError.textContent = err.message;
    createError.classList.remove('hidden');
  }
});

refresh();
