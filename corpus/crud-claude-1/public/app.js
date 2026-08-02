const tableBody = document.getElementById('product-table-body');
const alertBox = document.getElementById('alert');
const modalBackdrop = document.getElementById('modal-backdrop');
const modalTitle = document.getElementById('modal-title');
const form = document.getElementById('product-form');
const idField = document.getElementById('product-id');
const nameField = document.getElementById('name');
const priceField = document.getElementById('price');
const descriptionField = document.getElementById('description');

document.getElementById('add-btn').addEventListener('click', () => openModal());
document.getElementById('cancel-btn').addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) closeModal();
});
form.addEventListener('submit', handleSubmit);

function showAlert(message, type) {
  alertBox.textContent = message;
  alertBox.className = `alert ${type}`;
  setTimeout(() => alertBox.classList.add('hidden'), 4000);
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

function openModal(product) {
  form.reset();
  if (product) {
    modalTitle.textContent = 'Edit Product';
    idField.value = product.id;
    nameField.value = product.name;
    priceField.value = product.price;
    descriptionField.value = product.description || '';
  } else {
    modalTitle.textContent = 'Add Product';
    idField.value = '';
  }
  modalBackdrop.classList.remove('hidden');
  nameField.focus();
}

function closeModal() {
  modalBackdrop.classList.add('hidden');
}

async function loadProducts() {
  tableBody.innerHTML = '<tr><td colspan="4" class="empty-state">Loading products…</td></tr>';
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Failed to load products.');
    const products = await res.json();
    renderTable(products);
  } catch (err) {
    tableBody.innerHTML = '<tr><td colspan="4" class="empty-state">Could not load products.</td></tr>';
    showAlert(err.message, 'error');
  }
}

function renderTable(products) {
  if (products.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="4" class="empty-state">No products yet. Add one to get started.</td></tr>';
    return;
  }

  tableBody.innerHTML = '';
  for (const product of products) {
    const row = document.createElement('tr');

    const nameCell = document.createElement('td');
    nameCell.textContent = product.name;

    const priceCell = document.createElement('td');
    priceCell.textContent = formatPrice(product.price);

    const descCell = document.createElement('td');
    descCell.textContent = product.description || '';

    const actionsCell = document.createElement('td');
    actionsCell.className = 'actions';

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'btn btn-secondary';
    editBtn.addEventListener('click', () => openModal(product));

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.addEventListener('click', () => deleteProduct(product.id));

    actionsCell.append(editBtn, deleteBtn);
    row.append(nameCell, priceCell, descCell, actionsCell);
    tableBody.appendChild(row);
  }
}

async function handleSubmit(e) {
  e.preventDefault();

  const payload = {
    name: nameField.value.trim(),
    price: parseFloat(priceField.value),
    description: descriptionField.value.trim(),
  };

  const id = idField.value;
  const isEdit = Boolean(id);
  const url = isEdit ? `/api/products/${id}` : '/api/products';
  const method = isEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');

    closeModal();
    showAlert(isEdit ? 'Product updated.' : 'Product added.', 'success');
    loadProducts();
  } catch (err) {
    showAlert(err.message, 'error');
  }
}

async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;

  try {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete product.');
    }
    showAlert('Product deleted.', 'success');
    loadProducts();
  } catch (err) {
    showAlert(err.message, 'error');
  }
}

loadProducts();
