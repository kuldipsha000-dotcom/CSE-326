/**
 * Sales History & Invoicing Management
 */

const sales = {
  salesList: [],

  async init() {
    await this.loadSales();
    this.bindEvents();
  },

  bindEvents() {
    const search = document.getElementById('sales-search-input');
    if (search) {
      let timeout;
      search.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => this.loadSales(), 300);
      });
    }

    const methodFilter = document.getElementById('sales-payment-filter');
    if (methodFilter) {
      methodFilter.addEventListener('change', () => this.loadSales());
    }

    const statusFilter = document.getElementById('sales-status-filter');
    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.loadSales());
    }
  },

  async loadSales() {
    const q = document.getElementById('sales-search-input')?.value || '';
    const paymentMethod = document.getElementById('sales-payment-filter')?.value || '';
    const paymentStatus = document.getElementById('sales-status-filter')?.value || '';

    const params = {};
    if (q) params.q = q;
    if (paymentMethod && paymentMethod !== 'All') params.payment_method = paymentMethod;
    if (paymentStatus && paymentStatus !== 'All') params.payment_status = paymentStatus;

    try {
      const data = await api.get('/sales', params);
      this.salesList = data;
      this.renderTable(data);
    } catch (err) {
      showToast('Failed to load sales: ' + err.message, 'error');
    }
  },

  renderTable(list) {
    const tbody = document.getElementById('sales-table-tbody');
    const countEl = document.getElementById('sales-total-count');
    if (countEl) countEl.textContent = `${list.length} invoices found`;
    if (!tbody) return;

    if (!list || list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-12 text-slate-400">
            <p class="font-medium text-slate-600">No sales transactions found</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map(s => `
      <tr class="border-b border-zinc-100 hover:bg-zinc-50/70 transition text-xs">
        <td class="py-2.5 px-3 font-mono font-semibold text-zinc-900">
          ${s.invoice_number}
        </td>
        <td class="py-2.5 px-3">
          <div class="font-medium text-zinc-900">${s.customer_name || 'Walk-in'}</div>
          <div class="text-[11px] text-zinc-400 font-mono">${s.customer_phone || ''}</div>
        </td>
        <td class="py-2.5 px-3 text-[11px] text-zinc-500">
          ${new Date(s.created_at).toLocaleDateString()} ${new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </td>
        <td class="py-2.5 px-3">
          <span class="inline-flex items-center px-1.5 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-[10px] font-medium text-zinc-700">
            ${s.payment_method}
          </span>
        </td>
        <td class="py-2.5 px-3">
          <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
            s.payment_status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }">
            ${s.payment_status}
          </span>
        </td>
        <td class="py-2.5 px-3 text-right font-bold text-zinc-900 tabular-nums">
          ${formatCurrency(s.total_amount)}
        </td>
        <td class="py-2.5 px-3 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button onclick="sales.viewInvoice(${s.id})" class="p-1 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-md transition" title="View / Print">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            </button>
            ${s.payment_status === 'Completed' ? `
              <button onclick="sales.refundSale(${s.id}, '${s.invoice_number}')" class="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition" title="Refund & Restock">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  },

  async viewInvoice(saleId) {
    try {
      const sale = await api.get(`/sales/${saleId}`);
      pos.showInvoiceModal(sale);
    } catch (err) {
      showToast('Error loading invoice: ' + err.message, 'error');
    }
  },

  async refundSale(saleId, invoiceNumber) {
    if (!confirm(`Are you sure you want to process a full refund for invoice '${invoiceNumber}'? This will restore medicine stocks to inventory.`)) {
      return;
    }

    try {
      const res = await api.post(`/sales/${saleId}/refund`);
      showToast(res.message, 'success');
      await this.loadSales();
      if (typeof dashboard.loadMetrics === 'function') {
        dashboard.loadMetrics();
      }
      if (typeof inventory.loadMedicines === 'function') {
        inventory.loadMedicines();
      }
    } catch (err) {
      showToast(err.message || 'Refund failed', 'error');
    }
  }
};
