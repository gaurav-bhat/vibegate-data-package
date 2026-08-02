const rowsEl = document.getElementById('rows');
const toastEl = document.getElementById('toast');
const overlay = document.getElementById('overlay');
const dialogTitle = document.getElementById('dialog-title');
const form = document.getElementById('product-form');
const idField = document.getElementById('product-id');
const nameField = document.getElementById('name');
const priceField = document.getElementById('price');
const descriptionField = document.getElementById('description');
const formError = document.getElementById('form-error');
const saveBtn = document.getElementById('save-btn');

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

document.getElementById('add-btn').addEventListener('click', () => openDialog());
document.getElementById('cancel-btn').addEventListener('click', closeDialog);
overlay.addEventListener('click', (e) => {
  if (e.target === overlay) closeDialog();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !overlay.classList.contains('hidden')) closeDialog();
});
form.addEventListener('submit', handleSubmit);

let toastTimer = null;
function showToast(message, kind = 'success') {
  toastEl.textContent = message;
  toastEl.className = `toast ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 3500);
}

function openDialog(product = null) {
  form.reset();
  formError.classList.add('hidden');
  if (product) {
    dialogTitle.textContent = 'Edit product';
    idField.value = product.id;
    nameField.value = product.name;
    priceField.value = product.price;
    descriptionField.value = product.description || '';
    saveBtn.textContent = 'Save changes';
  } else {
    dialogTitle.textContent = 'Add product';
    idField.value = '';
    saveBtn.textContent = 'Add product';
  }
  overlay.classList.remove('hidden');
  nameField.focus();
}

function closeDialog() {
  overlay.classList.add('hidden');
}

async function fetchProducts() {
  const res = await fetch('/api/products');
  if (!res.ok) throw new Error('Failed to load products.');
  return res.json();
}

function renderRows(products) {
  if (!products.length) {
    rowsEl.innerHTML = '<tr><td colspan="4" class="empty">No products yet. Add your first one.</td></tr>';
    return;
  }

  rowsEl.innerHTML = '';
  for (const product of products) {
    const tr = document.createElement('tr');

    const nameTd = document.createElement('td');
    nameTd.textContent = product.name;

    const priceTd = document.createElement('td');
    priceTd.textContent = currency.format(product.price);

    const descTd = document.createElement('td');
    descTd.textContent = product.description || '—';
    descTd.className = 'description-cell';

    const actionsTd = document.createElement('td');
    actionsTd.className = 'row-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn btn-ghost btn-small';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => openDialog(product));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn-danger btn-small';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => handleDelete(product));

    actionsTd.append(editBtn, deleteBtn);
    tr.append(nameTd, priceTd, descTd, actionsTd);
    rowsEl.appendChild(tr);
  }
}

async function refresh() {
  try {
    const products = await fetchProducts();
    renderRows(products);
  } catch (err) {
    rowsEl.innerHTML = '<tr><td colspan="4" class="empty">Could not load products.</td></tr>';
    showToast(err.message, 'error');
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  formError.classList.add('hidden');

  const payload = {
    name: nameField.value.trim(),
    price: parseFloat(priceField.value),
    description: descriptionField.value.trim(),
  };

  const id = idField.value;
  const isEdit = Boolean(id);
  const url = isEdit ? `/api/products/${id}` : '/api/products';
  const method = isEdit ? 'PUT' : 'POST';

  saveBtn.disabled = true;
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');

    closeDialog();
    showToast(isEdit ? 'Product updated.' : 'Product added.');
    await refresh();
  } catch (err) {
    formError.textContent = err.message;
    formError.classList.remove('hidden');
  } finally {
    saveBtn.disabled = false;
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
    showToast('Product deleted.');
    await refresh();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

refresh();
