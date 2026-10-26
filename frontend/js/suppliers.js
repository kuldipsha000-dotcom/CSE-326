/**
 * Supplier Management Component
 */

const suppliers = {
  list: [],
  selectedSupplier: null,

  async init() {
    await this.loadSuppliers();
  },

  async loadSuppliers() {
    try {
      const data = await api.get('/suppliers');
      this.list = data;
      this.renderTable(data);
    } catch (err) {
      showToast('Failed to load suppliers: ' + err.message, 'error');
    }
  },

  renderTable(data) {
    const tbody = document.getElementById('suppliers-table-tbody');
    const countEl = document.getElementById('suppliers-total-count');
    if (countEl) countEl.textContent = `${data.length} suppliers registered`;
    if (!tbody) return;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-slate-400">No suppliers found.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(s => `
      <tr class="border-b border-zinc-100 hover:bg-zinc-50/70 transition text-xs">
        <td class="py-2.5 px-3 font-semibold text-zinc-900">${s.name}</td>
        <td class="py-2.5 px-3">
          <div class="font-medium text-zinc-800">${s.contact_person || 'N/A'}</div>
          <div class="text-[10px] text-zinc-400 font-mono">${s.tax_id || ''}</div>
        </td>
        <td class="py-2.5 px-3 text-zinc-600">
          <div class="font-mono">${s.phone}</div>
          <div class="text-[11px] text-zinc-400">${s.email || ''}</div>
        </td>
        <td class="py-2.5 px-3 text-zinc-500 max-w-[200px] truncate">
          ${s.address || 'N/A'}
        </td>
        <td class="py-2.5 px-3 text-right font-bold text-zinc-900 tabular-nums">
          ${formatCurrency(s.total_purchases)}
        </td>
        <td class="py-2.5 px-3 text-center">
          <button onclick="suppliers.editSupplier(${s.id})" class="p-1 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition" title="Edit">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </button>
        </td>
      </tr>
    `).join('');
  },

  openAddModal() {
    this.selectedSupplier = null;
    document.getElementById('supplier-modal-title').textContent = 'Add Pharmaceutical Supplier';
    document.getElementById('supplier-form').reset();
    document.getElementById('sup-form-id').value = '';

    const modal = document.getElementById('supplier-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  editSupplier(id) {
    const s = this.list.find(item => item.id === id);
    if (!s) return;

    this.selectedSupplier = s;
    document.getElementById('supplier-modal-title').textContent = `Edit Supplier: ${s.name}`;
    document.getElementById('sup-form-id').value = s.id;
    document.getElementById('sup-form-name').value = s.name;
    document.getElementById('sup-form-contact').value = s.contact_person || '';
    document.getElementById('sup-form-email').value = s.email || '';
    document.getElementById('sup-form-phone').value = s.phone;
    document.getElementById('sup-form-taxid').value = s.tax_id || '';
    document.getElementById('sup-form-address').value = s.address || '';
    document.getElementById('sup-form-notes').value = s.notes || '';

    const modal = document.getElementById('supplier-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  closeModal() {
    const modal = document.getElementById('supplier-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  },

  async saveSupplier(e) {
    e.preventDefault();
    const id = document.getElementById('sup-form-id').value;

    const payload = {
      name: document.getElementById('sup-form-name').value.trim(),
      contact_person: document.getElementById('sup-form-contact').value.trim() || null,
      email: document.getElementById('sup-form-email').value.trim() || null,
      phone: document.getElementById('sup-form-phone').value.trim(),
      tax_id: document.getElementById('sup-form-taxid').value.trim() || null,
      address: document.getElementById('sup-form-address').value.trim() || null,
      notes: document.getElementById('sup-form-notes').value.trim() || null
    };

    try {
      if (id) {
        await api.put(`/suppliers/${id}`, payload);
        showToast(`Supplier '${payload.name}' updated`, 'success');
      } else {
        await api.post('/suppliers', payload);
        showToast(`Supplier '${payload.name}' created`, 'success');
      }

      this.closeModal();
      await this.loadSuppliers();
      if (typeof purchases.loadSuppliersDropdown === 'function') {
        purchases.loadSuppliersDropdown();
      }
    } catch (err) {
      showToast(err.message || 'Failed to save supplier', 'error');
    }
  }
};
