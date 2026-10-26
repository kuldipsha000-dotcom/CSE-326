/**
 * Customer & Patient Management
 */

const customers = {
  list: [],
  selectedCustomer: null,

  async init() {
    await this.loadCustomers();
    this.bindEvents();
  },

  bindEvents() {
    const search = document.getElementById('customers-search-input');
    if (search) {
      let timeout;
      search.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => this.loadCustomers(), 300);
      });
    }
  },

  async loadCustomers() {
    const q = document.getElementById('customers-search-input')?.value || '';
    try {
      const data = await api.get('/customers', q ? { q } : {});
      this.list = data;
      this.renderTable(data);
    } catch (err) {
      showToast('Failed to load customers: ' + err.message, 'error');
    }
  },

  renderTable(data) {
    const tbody = document.getElementById('customers-table-tbody');
    const countEl = document.getElementById('customers-total-count');
    if (countEl) countEl.textContent = `${data.length} customers registered`;
    if (!tbody) return;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-slate-400">No customers found.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(c => `
      <tr class="border-b border-zinc-100 hover:bg-zinc-50/70 transition text-xs">
        <td class="py-2.5 px-3">
          <div class="font-semibold text-zinc-900">${c.name}</div>
          <div class="text-[11px] text-zinc-400 font-mono">${c.email || ''}</div>
        </td>
        <td class="py-2.5 px-3 font-mono text-zinc-700">
          ${c.phone}
        </td>
        <td class="py-2.5 px-3 max-w-[220px]">
          ${c.medical_notes 
            ? `<span class="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] block truncate font-medium">${c.medical_notes}</span>` 
            : '<span class="text-zinc-400">None specified</span>'}
        </td>
        <td class="py-2.5 px-3 text-center">
          <span class="inline-flex items-center px-1.5 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-[10px] font-medium text-zinc-700 tabular-nums">
            ${c.total_orders} visits
          </span>
        </td>
        <td class="py-2.5 px-3 text-right font-bold text-zinc-900 tabular-nums">
          ${formatCurrency(c.total_spent)}
        </td>
        <td class="py-2.5 px-3 text-center">
          <button onclick="customers.viewProfile(${c.id})" class="p-1 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-md transition" title="Patient Record">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          </button>
        </td>
      </tr>
    `).join('');
  },

  openAddModal() {
    document.getElementById('customer-form').reset();
    document.getElementById('cust-form-id').value = '';
    const modal = document.getElementById('customer-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  closeModal() {
    const modal = document.getElementById('customer-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  },

  async saveCustomer(e) {
    e.preventDefault();
    const id = document.getElementById('cust-form-id').value;

    const payload = {
      name: document.getElementById('cust-form-name').value.trim(),
      phone: document.getElementById('cust-form-phone').value.trim(),
      email: document.getElementById('cust-form-email').value.trim() || null,
      address: document.getElementById('cust-form-address').value.trim() || null,
      medical_notes: document.getElementById('cust-form-notes').value.trim() || null
    };

    try {
      if (id) {
        await api.put(`/customers/${id}`, payload);
        showToast(`Customer '${payload.name}' updated`, 'success');
      } else {
        await api.post('/customers', payload);
        showToast(`Customer '${payload.name}' created`, 'success');
      }

      this.closeModal();
      await this.loadCustomers();
      if (typeof pos.loadCustomers === 'function') {
        pos.loadCustomers();
      }
      if (typeof dashboard.loadMetrics === 'function') {
        dashboard.loadMetrics();
      }
    } catch (err) {
      showToast(err.message || 'Failed to save customer', 'error');
    }
  },

  async viewProfile(id) {
    try {
      const cust = await api.get(`/customers/${id}`);
      this.selectedCustomer = cust;

      document.getElementById('cust-profile-name').textContent = cust.name;
      document.getElementById('cust-profile-phone').textContent = cust.phone;
      document.getElementById('cust-profile-email').textContent = cust.email || 'No email registered';
      document.getElementById('cust-profile-notes').textContent = cust.medical_notes || 'No allergies or chronic alerts noted.';
      document.getElementById('cust-profile-total-orders').textContent = cust.total_orders;
      document.getElementById('cust-profile-total-spent').textContent = formatCurrency(cust.total_spent);

      // Render sales
      const salesList = document.getElementById('cust-profile-sales');
      if (salesList) {
        if (!cust.recent_sales || cust.recent_sales.length === 0) {
          salesList.innerHTML = `<div class="p-3 text-xs text-slate-400">No past orders.</div>`;
        } else {
          salesList.innerHTML = cust.recent_sales.map(s => `
            <div class="flex items-center justify-between p-2 border-b border-slate-100 text-xs">
              <span class="font-mono text-teal-700 font-bold">${s.invoice_number}</span>
              <span class="text-slate-500">${formatDate(s.created_at)}</span>
              <span class="font-bold text-slate-900">${formatCurrency(s.total_amount)}</span>
            </div>
          `).join('');
        }
      }

      const modal = document.getElementById('customer-profile-modal');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    } catch (err) {
      showToast('Error loading customer profile: ' + err.message, 'error');
    }
  },

  closeProfileModal() {
    const modal = document.getElementById('customer-profile-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }
};
