/**
 * Alerts, Notifications & Safety Warning Engine
 */

const alerts = {
  summary: null,

  async init() {
    await this.loadAlerts();
  },

  async loadAlerts() {
    try {
      const data = await api.get('/alerts/summary');
      this.summary = data;
      this.updateHeaderBadge(data.total_count);
      this.renderAlertsView(data);
    } catch (err) {
      console.error('Failed to load alerts summary:', err);
    }
  },

  updateHeaderBadge(count) {
    const badge = document.getElementById('header-alert-badge');
    if (!badge) return;

    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  },

  renderAlertsView(data) {
    // 1. Expired Medicines
    const expiredContainer = document.getElementById('alerts-expired-container');
    const expiredCountBadge = document.getElementById('alerts-expired-count');
    if (expiredCountBadge) expiredCountBadge.textContent = data.expired.length;

    if (expiredContainer) {
      if (data.expired.length === 0) {
        expiredContainer.innerHTML = `<div class="p-6 text-center text-slate-400 text-sm">No expired medicines detected. Inventory is clean.</div>`;
      } else {
        expiredContainer.innerHTML = data.expired.map(m => `
          <div class="p-3 bg-red-50/50 border border-red-200 rounded-lg flex items-center justify-between gap-3 mb-2 text-xs">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-md bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              </div>
              <div>
                <h5 class="font-semibold text-zinc-900">${m.name}</h5>
                <p class="text-[11px] text-red-700">Batch: <span class="font-mono font-medium">${m.batch_number}</span> • Expired <span class="font-bold">${m.days_expired} days ago</span> (${formatDate(m.expiry_date)})</p>
                <p class="text-[10px] text-zinc-400 mt-0.5">Stock in inventory: ${m.stock} units</p>
              </div>
            </div>
            <div>
              <button onclick="inventory.archiveMedicine(${m.id}, '${m.name.replace(/'/g, "\\'")}')" class="px-2.5 py-1 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-md shadow-xs transition">
                Quarantine
              </button>
            </div>
          </div>
        `).join('');
      }
    }

    // 2. Expiring Soon (< 60 Days)
    const expiringContainer = document.getElementById('alerts-expiring-container');
    const expiringCountBadge = document.getElementById('alerts-expiring-count');
    if (expiringCountBadge) expiringCountBadge.textContent = data.expiring_soon.length;

    if (expiringContainer) {
      if (data.expiring_soon.length === 0) {
        expiringContainer.innerHTML = `<div class="p-6 text-center text-slate-400 text-sm">No medicines expiring in the next 60 days.</div>`;
      } else {
        expiringContainer.innerHTML = data.expiring_soon.map(m => `
          <div class="p-3 bg-amber-50/50 border border-amber-200 rounded-lg flex items-center justify-between gap-3 mb-2 text-xs">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div>
                <h5 class="font-semibold text-zinc-900">${m.name}</h5>
                <p class="text-[11px] text-amber-800">Batch: <span class="font-mono font-medium">${m.batch_number}</span> • Expires in <span class="font-bold">${m.days_left} days</span> (${formatDate(m.expiry_date)})</p>
                <p class="text-[10px] text-zinc-400 mt-0.5">Remaining Stock: ${m.stock} units (First-expiry priority)</p>
              </div>
            </div>
            <div>
              <span class="inline-block px-2 py-0.5 text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-200 rounded">
                Priority Dispense
              </span>
            </div>
          </div>
        `).join('');
      }
    }

    // 3. Low Stock & Out of Stock
    const lowStockContainer = document.getElementById('alerts-lowstock-container');
    const lowStockCountBadge = document.getElementById('alerts-lowstock-count');
    const combinedLowStock = [...data.out_of_stock, ...data.low_stock];
    if (lowStockCountBadge) lowStockCountBadge.textContent = combinedLowStock.length;

    if (lowStockContainer) {
      if (combinedLowStock.length === 0) {
        lowStockContainer.innerHTML = `<div class="p-6 text-center text-slate-400 text-sm">All medicines have healthy stock levels above threshold.</div>`;
      } else {
        lowStockContainer.innerHTML = combinedLowStock.map(m => `
          <div class="p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between gap-3 mb-2 text-xs">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-md ${m.stock === 0 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'} flex items-center justify-center shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
              </div>
              <div>
                <h5 class="font-semibold text-zinc-900">${m.name}</h5>
                <p class="text-[11px] ${m.stock === 0 ? 'text-red-600 font-bold' : 'text-amber-700 font-medium'}">
                  ${m.stock === 0 ? 'OUT OF STOCK' : `Low Stock: Only ${m.stock} units left (Threshold: ${m.min_stock})`}
                </p>
                <p class="text-[10px] text-zinc-400 font-mono mt-0.5">Batch: ${m.batch_number}</p>
              </div>
            </div>
            <div>
              <button onclick="alerts.quickReorder(${m.id})" class="px-2.5 py-1 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-50 rounded-md shadow-xs transition">
                + Reorder Inward
              </button>
            </div>
          </div>
        `).join('');
      }
    }
  },

  quickReorder(medId) {
    if (typeof app.switchTab === 'function') {
      app.switchTab('purchases');
      setTimeout(() => {
        purchases.openAddModal();
      }, 100);
    }
  }
};
