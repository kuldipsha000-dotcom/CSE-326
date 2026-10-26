/**
 * Purchase Orders & Stock Inward Management
 */

const purchases = {
  list: [],
  suppliersList: [],
  medicinesList: [],
  purchaseItems: [],

  async init() {
    await this.loadPurchases();
    await this.loadSuppliersDropdown();
    await this.loadMedicinesDropdown();
  },

  async loadPurchases() {
    try {
      const data = await api.get('/purchases');
      this.list = data;
      this.renderTable(data);
    } catch (err) {
      console.error('Failed to load purchases:', err);
    }
  },

  async loadSuppliersDropdown() {
    try {
      const data = await api.get('/suppliers');
      this.suppliersList = data;
      const select = document.getElementById('po-form-supplier');
      if (select) {
        select.innerHTML = `<option value="">Select Supplier...</option>` +
          data.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
      }
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    }
  },

  async loadMedicinesDropdown() {
    try {
      const data = await api.get('/medicines');
      this.medicinesList = data;
    } catch (err) {
      console.error('Failed to load medicines:', err);
    }
  },

  renderTable(data) {
    const tbody = document.getElementById('purchases-table-tbody');
    const countEl = document.getElementById('purchases-total-count');
    if (countEl) countEl.textContent = `${data.length} purchase orders`;
    if (!tbody) return;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-slate-400">No stock inward records found.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(po => `
      <tr class="border-b border-zinc-100 hover:bg-zinc-50/70 transition text-xs">
        <td class="py-2.5 px-3 font-mono font-semibold text-zinc-900">
          ${po.invoice_number}
        </td>
        <td class="py-2.5 px-3 font-medium text-zinc-900">
          ${po.supplier_name}
        </td>
        <td class="py-2.5 px-3 text-[11px] text-zinc-500">
          ${formatDate(po.purchase_date)}
        </td>
        <td class="py-2.5 px-3 text-zinc-600">
          ${po.items.map(it => `<span class="inline-block bg-zinc-100 border border-zinc-200 px-1.5 py-0.2 rounded text-[10px] mr-1 mb-1 font-medium text-zinc-700">${it.medicine_name} (+${it.quantity})</span>`).join('')}
        </td>
        <td class="py-2.5 px-3 text-right font-bold text-zinc-900 tabular-nums">
          ${formatCurrency(po.total_amount)}
        </td>
        <td class="py-2.5 px-3 text-center">
          <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            ${po.payment_status}
          </span>
        </td>
      </tr>
    `).join('');
  },

  openAddModal() {
    document.getElementById('purchase-form').reset();
    this.purchaseItems = [];
    this.addPurchaseRow();

    const modal = document.getElementById('purchase-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  closeModal() {
    const modal = document.getElementById('purchase-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  },

  addPurchaseRow() {
    const container = document.getElementById('po-items-container');
    if (!container) return;

    const rowId = 'po-row-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);

    const rowHtml = `
      <div id="${rowId}" class="po-item-row p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
        <div class="md:col-span-4">
          <label class="block text-[11px] font-semibold text-slate-600 mb-1">Medicine *</label>
          <select class="po-row-med w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500" required onchange="purchases.onMedSelect('${rowId}')">
            <option value="">Select Medicine...</option>
            ${this.medicinesList.map(m => `<option value="${m.id}" data-cost="${m.purchase_price}" data-batch="${m.batch_number}" data-exp="${m.expiry_date}">${m.name} (${m.batch_number})</option>`).join('')}
          </select>
        </div>

        <div class="md:col-span-2">
          <label class="block text-[11px] font-semibold text-slate-600 mb-1">Quantity *</label>
          <input type="number" min="1" value="10" class="po-row-qty w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-center font-bold" required oninput="purchases.calcRow('${rowId}')">
        </div>

        <div class="md:col-span-2">
          <label class="block text-[11px] font-semibold text-slate-600 mb-1">Unit Cost (₹) *</label>
          <input type="number" step="0.01" min="0" value="0.00" class="po-row-cost w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-right font-medium" required oninput="purchases.calcRow('${rowId}')">
        </div>

        <div class="md:col-span-2">
          <label class="block text-[11px] font-semibold text-slate-600 mb-1">Batch #</label>
          <input type="text" placeholder="Batch" class="po-row-batch w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg">
        </div>

        <div class="md:col-span-1 text-center pt-4">
          <button type="button" onclick="document.getElementById('${rowId}').remove(); purchases.updateSummary();" class="p-1.5 text-slate-400 hover:text-red-500 rounded" title="Remove Item">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', rowHtml);
  },

  onMedSelect(rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;

    const select = row.querySelector('.po-row-med');
    const selectedOpt = select.options[select.selectedIndex];
    if (selectedOpt && selectedOpt.value) {
      row.querySelector('.po-row-cost').value = selectedOpt.dataset.cost || '0.00';
      row.querySelector('.po-row-batch').value = selectedOpt.dataset.batch || '';
    }
    this.calcRow(rowId);
  },

  calcRow(rowId) {
    this.updateSummary();
  },

  updateSummary() {
    let total = 0;
    const rows = document.querySelectorAll('.po-item-row');
    rows.forEach(r => {
      const qty = parseFloat(r.querySelector('.po-row-qty')?.value) || 0;
      const cost = parseFloat(r.querySelector('.po-row-cost')?.value) || 0;
      total += qty * cost;
    });

    const sumEl = document.getElementById('po-total-display');
    if (sumEl) sumEl.textContent = formatCurrency(total);
  },

  async savePurchase(e) {
    e.preventDefault();
    const supplierId = parseInt(document.getElementById('po-form-supplier').value, 10);
    const invoiceNumber = document.getElementById('po-form-invoice').value.trim();
    const purchaseDate = document.getElementById('po-form-date').value || null;
    const paymentStatus = document.getElementById('po-form-payment').value || 'Paid';
    const notes = document.getElementById('po-form-notes').value.trim() || null;

    if (!supplierId) {
      showToast('Please select a supplier', 'warning');
      return;
    }

    const rows = document.querySelectorAll('.po-item-row');
    const items = [];

    rows.forEach(r => {
      const medId = parseInt(r.querySelector('.po-row-med')?.value, 10);
      const qty = parseInt(r.querySelector('.po-row-qty')?.value, 10);
      const unitCost = parseFloat(r.querySelector('.po-row-cost')?.value) || 0;
      const batch = r.querySelector('.po-row-batch')?.value.trim() || null;

      if (medId && qty > 0) {
        items.push({
          medicine_id: medId,
          quantity: qty,
          unit_cost: unitCost,
          batch_number: batch
        });
      }
    });

    if (items.length === 0) {
      showToast('Add at least one medicine to the purchase order', 'warning');
      return;
    }

    const payload = {
      supplier_id: supplierId,
      invoice_number: invoiceNumber,
      purchase_date: purchaseDate,
      payment_status: paymentStatus,
      notes: notes,
      items: items
    };

    try {
      await api.post('/purchases', payload);
      showToast('Stock inward recorded successfully! Inventory updated.', 'success');
      this.closeModal();

      await this.loadPurchases();
      if (typeof inventory.loadMedicines === 'function') {
        inventory.loadMedicines();
      }
      if (typeof dashboard.loadMetrics === 'function') {
        dashboard.loadMetrics();
      }
    } catch (err) {
      showToast(err.message || 'Failed to record stock inward', 'error');
    }
  }
};
