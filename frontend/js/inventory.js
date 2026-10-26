/**
 * Medicine Inventory Management
 */

const inventory = {
  medicines: [],
  categories: [],
  selectedMedicine: null,

  async init() {
    await this.loadCategories();
    await this.loadMedicines();
    this.bindEvents();
  },

  bindEvents() {
    const searchInput = document.getElementById('inventory-search');
    if (searchInput) {
      let timeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => this.loadMedicines(), 300);
      });
    }

    const categorySelect = document.getElementById('inventory-category-filter');
    if (categorySelect) {
      categorySelect.addEventListener('change', () => this.loadMedicines());
    }

    const stockFilter = document.getElementById('inventory-stock-filter');
    if (stockFilter) {
      stockFilter.addEventListener('change', () => this.loadMedicines());
    }

    const expiryFilter = document.getElementById('inventory-expiry-filter');
    if (expiryFilter) {
      expiryFilter.addEventListener('change', () => this.loadMedicines());
    }
  },

  async loadCategories() {
    try {
      const data = await api.get('/medicines/categories');
      this.categories = data;

      const filterSelect = document.getElementById('inventory-category-filter');
      const formCatSelect = document.getElementById('med-form-category');

      if (filterSelect) {
        filterSelect.innerHTML = `<option value="All">All Categories (${data.reduce((a, b) => a + b.count, 0)})</option>` +
          data.map(c => `<option value="${c.category}">${c.category} (${c.count})</option>`).join('');
      }

      if (formCatSelect) {
        const standardCats = [
          "Antibiotics", "Analgesics & Antipyretics", "Cardiovascular", "Diabetic Care",
          "Respiratory", "Gastrointestinal", "Vitamins & Supplements", "Dermatology", "First Aid & Surgical"
        ];
        formCatSelect.innerHTML = standardCats.map(c => `<option value="${c}">${c}</option>`).join('');
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  },

  async loadMedicines() {
    const search = document.getElementById('inventory-search')?.value || '';
    const category = document.getElementById('inventory-category-filter')?.value || '';
    const stockStatus = document.getElementById('inventory-stock-filter')?.value || '';
    const expiryStatus = document.getElementById('inventory-expiry-filter')?.value || '';

    const params = {};
    if (search) params.q = search;
    if (category && category !== 'All') params.category = category;
    if (stockStatus && stockStatus !== 'All') params.stock_status = stockStatus;
    if (expiryStatus && expiryStatus !== 'All') params.expiry_status = expiryStatus;

    try {
      const data = await api.get('/medicines', params);
      this.medicines = data;
      this.renderTable(data);
    } catch (err) {
      showToast('Failed to load medicines: ' + err.message, 'error');
    }
  },

  renderTable(medicines) {
    const tbody = document.getElementById('inventory-table-tbody');
    const countEl = document.getElementById('inventory-total-count');
    if (countEl) countEl.textContent = `${medicines.length} products found`;
    if (!tbody) return;

    if (!medicines || medicines.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-12 text-slate-400">
            <svg class="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            <p class="text-base font-semibold text-slate-600">No medicines match your criteria</p>
            <p class="text-xs text-slate-400">Try adjusting your search or filters</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = medicines.map(m => {
      // Stock badge (shadcn outline badge style)
      let stockBadgeClass = 'bg-zinc-50 text-zinc-700 border-zinc-200 font-medium';
      let stockLabel = `${m.stock_quantity} in stock`;
      if (m.stock_quantity === 0) {
        stockBadgeClass = 'bg-red-50 text-red-700 border-red-200 font-semibold';
        stockLabel = 'Out of Stock';
      } else if (m.stock_quantity <= m.min_stock_alert) {
        stockBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200 font-medium';
        stockLabel = `Low: ${m.stock_quantity} left`;
      }

      // Expiry badge
      let expiryBadgeClass = 'text-zinc-600 bg-zinc-50 border border-zinc-200';
      let expiryLabel = formatDate(m.expiry_date);
      if (m.expiry_status === 'expired') {
        expiryBadgeClass = 'bg-red-50 text-red-700 border border-red-200 font-medium';
        expiryLabel = `Expired (${m.days_to_expiry * -1}d ago)`;
      } else if (m.expiry_status === 'expiring_soon') {
        expiryBadgeClass = 'bg-amber-50 text-amber-800 border border-amber-200 font-medium';
        expiryLabel = `Exp: ${m.days_to_expiry} days`;
      }

      return `
        <tr class="border-b border-zinc-100 hover:bg-zinc-50/70 transition text-xs">
          <td class="py-2.5 px-3">
            <div class="font-semibold text-zinc-900">${m.name}</div>
            <div class="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
              <span>${m.generic_name || 'Standard composition'}</span>
              ${m.requires_prescription ? '<span class="text-[9px] bg-red-50 text-red-700 border border-red-200 px-1 py-0.2 rounded font-bold">Rx</span>' : ''}
            </div>
          </td>
          <td class="py-2.5 px-3">
            <span class="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-50 text-zinc-700 border border-zinc-200">
              ${m.category}
            </span>
            <div class="text-[10px] text-zinc-400 mt-0.5 font-mono">${m.dosage_form || 'Tablet'} • ${m.strength || 'N/A'}</div>
          </td>
          <td class="py-2.5 px-3 font-mono text-zinc-600">
            <div>${m.batch_number}</div>
            <div class="text-[10px] text-zinc-400 font-sans">${m.storage_location || 'General Rack'}</div>
          </td>
          <td class="py-2.5 px-3">
            <span class="inline-flex items-center px-2 py-0.5 rounded-md border ${stockBadgeClass}">
              ${stockLabel}
            </span>
          </td>
          <td class="py-2.5 px-3">
            <span class="inline-flex items-center px-2 py-0.5 rounded-md ${expiryBadgeClass}">
              ${expiryLabel}
            </span>
          </td>
          <td class="py-2.5 px-3 text-right">
            <div class="font-bold text-zinc-900 tabular-nums">${formatCurrency(m.selling_price)}</div>
            <div class="text-[10px] text-zinc-400 tabular-nums">Cost: ${formatCurrency(m.purchase_price)}</div>
          </td>
          <td class="py-2.5 px-3 text-center">
            <div class="flex items-center justify-center gap-1">
              <button onclick="inventory.editMedicine(${m.id})" class="p-1 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition" title="Edit">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </button>
              <button onclick="inventory.archiveMedicine(${m.id}, '${m.name.replace(/'/g, "\\'")}')" class="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition" title="Archive">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  openAddModal() {
    this.selectedMedicine = null;
    document.getElementById('medicine-modal-title').textContent = 'Add New Medicine';
    document.getElementById('medicine-form').reset();
    document.getElementById('med-form-id').value = '';
    
    // Default expiry 1 year ahead
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    document.getElementById('med-form-expiry').value = nextYear.toISOString().split('T')[0];

    const modal = document.getElementById('medicine-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  editMedicine(id) {
    const med = this.medicines.find(m => m.id === id);
    if (!med) return;

    this.selectedMedicine = med;
    document.getElementById('medicine-modal-title').textContent = `Edit Medicine: ${med.name}`;
    document.getElementById('med-form-id').value = med.id;
    document.getElementById('med-form-name').value = med.name;
    document.getElementById('med-form-generic').value = med.generic_name || '';
    document.getElementById('med-form-category').value = med.category;
    document.getElementById('med-form-dosage').value = med.dosage_form || 'Tablet';
    document.getElementById('med-form-strength').value = med.strength || '';
    document.getElementById('med-form-manufacturer').value = med.manufacturer;
    document.getElementById('med-form-batch').value = med.batch_number;
    document.getElementById('med-form-barcode').value = med.barcode || '';
    document.getElementById('med-form-purchase-price').value = med.purchase_price;
    document.getElementById('med-form-selling-price').value = med.selling_price;
    document.getElementById('med-form-stock').value = med.stock_quantity;
    document.getElementById('med-form-min-stock').value = med.min_stock_alert;
    document.getElementById('med-form-expiry').value = med.expiry_date;
    document.getElementById('med-form-location').value = med.storage_location || '';
    document.getElementById('med-form-rx').checked = med.requires_prescription;
    document.getElementById('med-form-desc').value = med.description || '';

    const modal = document.getElementById('medicine-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  closeModal() {
    const modal = document.getElementById('medicine-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  },

  async saveMedicine(e) {
    e.preventDefault();
    const id = document.getElementById('med-form-id').value;

    const payload = {
      name: document.getElementById('med-form-name').value.trim(),
      generic_name: document.getElementById('med-form-generic').value.trim() || null,
      category: document.getElementById('med-form-category').value,
      dosage_form: document.getElementById('med-form-dosage').value,
      strength: document.getElementById('med-form-strength').value.trim() || null,
      manufacturer: document.getElementById('med-form-manufacturer').value.trim(),
      batch_number: document.getElementById('med-form-batch').value.trim(),
      barcode: document.getElementById('med-form-barcode').value.trim() || null,
      purchase_price: parseFloat(document.getElementById('med-form-purchase-price').value) || 0,
      selling_price: parseFloat(document.getElementById('med-form-selling-price').value) || 0,
      stock_quantity: parseInt(document.getElementById('med-form-stock').value, 10) || 0,
      min_stock_alert: parseInt(document.getElementById('med-form-min-stock').value, 10) || 15,
      expiry_date: document.getElementById('med-form-expiry').value,
      storage_location: document.getElementById('med-form-location').value.trim() || null,
      requires_prescription: document.getElementById('med-form-rx').checked,
      description: document.getElementById('med-form-desc').value.trim() || null
    };

    try {
      if (id) {
        await api.put(`/medicines/${id}`, payload);
        showToast(`Updated '${payload.name}' successfully`, 'success');
      } else {
        await api.post('/medicines', payload);
        showToast(`Added '${payload.name}' to inventory`, 'success');
      }

      this.closeModal();
      await this.loadCategories();
      await this.loadMedicines();
      if (typeof dashboard.loadMetrics === 'function') {
        dashboard.loadMetrics();
      }
    } catch (err) {
      showToast(err.message || 'Failed to save medicine', 'error');
    }
  },

  async archiveMedicine(id, name) {
    if (!confirm(`Are you sure you want to archive/remove '${name}' from active inventory?`)) {
      return;
    }

    try {
      await api.delete(`/medicines/${id}`);
      showToast(`Medicine '${name}' archived.`, 'info');
      await this.loadCategories();
      await this.loadMedicines();
      if (typeof dashboard.loadMetrics === 'function') {
        dashboard.loadMetrics();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete medicine', 'error');
    }
  },

  exportCSV() {
    if (!this.medicines || this.medicines.length === 0) {
      showToast('No medicines to export', 'warning');
      return;
    }

    const headers = ['ID', 'Name', 'Generic Name', 'Category', 'Dosage Form', 'Strength', 'Manufacturer', 'Batch #', 'Stock', 'Min Alert', 'Purchase Price', 'Selling Price', 'Expiry Date', 'Status'];
    const rows = this.medicines.map(m => [
      m.id,
      `"${m.name.replace(/"/g, '""')}"`,
      `"${(m.generic_name || '').replace(/"/g, '""')}"`,
      `"${m.category}"`,
      m.dosage_form,
      m.strength || '',
      `"${m.manufacturer}"`,
      m.batch_number,
      m.stock_quantity,
      m.min_stock_alert,
      m.purchase_price,
      m.selling_price,
      m.expiry_date,
      m.stock_status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pharmacy_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Inventory CSV exported successfully!', 'success');
  }
};
