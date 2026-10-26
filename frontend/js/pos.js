/**
 * Point of Sale (POS) & Billing Engine
 */

const pos = {
  catalog: [],
  cart: [],
  customers: [],
  selectedCustomerId: null,
  taxRate: 5.0, // 5% default VAT/Tax
  lastSaleInvoice: null,

  async init() {
    await this.loadCatalog();
    await this.loadCustomers();
    this.bindEvents();
    this.renderCart();
  },

  bindEvents() {
    const searchInput = document.getElementById('pos-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterCatalog(e.target.value);
      });
      // Barcode Enter key scanner trigger
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleBarcodeScan(searchInput.value.trim());
        }
      });
    }

    const custSelect = document.getElementById('pos-customer-select');
    if (custSelect) {
      custSelect.addEventListener('change', (e) => {
        this.selectedCustomerId = e.target.value ? parseInt(e.target.value, 10) : null;
        this.onCustomerSelected();
      });
    }

    const discountInput = document.getElementById('pos-discount-input');
    if (discountInput) {
      discountInput.addEventListener('input', () => this.updateTotals());
    }

    const taxInput = document.getElementById('pos-tax-input');
    if (taxInput) {
      taxInput.addEventListener('input', (e) => {
        this.taxRate = parseFloat(e.target.value) || 0;
        this.updateTotals();
      });
    }
  },

  async loadCatalog() {
    try {
      const data = await api.get('/medicines');
      this.catalog = data;
      this.renderCatalog(data);
    } catch (err) {
      console.error('Failed to load POS catalog:', err);
    }
  },

  async loadCustomers() {
    try {
      const data = await api.get('/customers');
      this.customers = data;
      const select = document.getElementById('pos-customer-select');
      if (select) {
        select.innerHTML = `<option value="">Walk-in Customer (General)</option>` +
          data.map(c => `<option value="${c.id}">${c.name} (${c.phone})</option>`).join('');
      }
    } catch (err) {
      console.error('Failed to load customers for POS:', err);
    }
  },

  filterCatalog(query) {
    if (!query) {
      this.renderCatalog(this.catalog);
      return;
    }
    const q = query.toLowerCase();
    const filtered = this.catalog.filter(m => 
      m.name.toLowerCase().includes(q) ||
      (m.generic_name && m.generic_name.toLowerCase().includes(q)) ||
      (m.barcode && m.barcode.includes(q)) ||
      m.batch_number.toLowerCase().includes(q)
    );
    this.renderCatalog(filtered);
  },

  handleBarcodeScan(code) {
    if (!code) return;
    const match = this.catalog.find(m => m.barcode === code || m.batch_number === code);
    if (match) {
      this.addToCart(match.id);
      document.getElementById('pos-search-input').value = '';
      this.renderCatalog(this.catalog);
      showToast(`Scanned: ${match.name}`, 'info');
    } else {
      showToast(`No medicine matched barcode "${code}"`, 'warning');
    }
  },

  renderCatalog(medicines) {
    const grid = document.getElementById('pos-catalog-grid');
    if (!grid) return;

    if (!medicines || medicines.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-12 text-center text-slate-400">
          <p class="text-sm">No medicines found</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = medicines.map(m => {
      const isExpired = m.expiry_status === 'expired';
      const isOutOfStock = m.stock_quantity === 0;
      const isExpiringSoon = m.expiry_status === 'expiring_soon';
      const disabled = isExpired || isOutOfStock;

      let statusBadge = '';
      if (isExpired) {
        statusBadge = `<span class="bg-red-50 text-red-700 border border-red-200 text-[10px] px-1.5 py-0.2 rounded font-medium">Expired</span>`;
      } else if (isOutOfStock) {
        statusBadge = `<span class="bg-zinc-100 text-zinc-600 border border-zinc-200 text-[10px] px-1.5 py-0.2 rounded font-medium">Out of Stock</span>`;
      } else if (isExpiringSoon) {
        statusBadge = `<span class="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] px-1.5 py-0.2 rounded font-medium">Exp: ${m.days_to_expiry}d</span>`;
      } else if (m.stock_quantity <= m.min_stock_alert) {
        statusBadge = `<span class="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-1.5 py-0.2 rounded font-medium">Low (${m.stock_quantity})</span>`;
      }

      return `
        <div onclick="${disabled ? '' : `pos.addToCart(${m.id})`}" 
             class="group relative p-3 rounded-lg border transition cursor-pointer select-none ${
               disabled 
                 ? 'bg-zinc-50/70 border-zinc-200 opacity-60 cursor-not-allowed' 
                 : 'bg-white border-zinc-200 hover:border-zinc-400 hover:shadow-xs'
             }">
          <div class="flex items-start justify-between gap-1 mb-1.5">
            <span class="text-[10px] font-medium text-zinc-600 bg-zinc-100 border border-zinc-200 px-1.5 py-0.2 rounded">
              ${m.category}
            </span>
            ${statusBadge}
          </div>

          <h4 class="font-semibold text-xs text-zinc-900 line-clamp-1 group-hover:text-zinc-950 transition">
            ${m.name}
          </h4>
          <p class="text-[11px] text-zinc-400 line-clamp-1 mb-2">
            ${m.generic_name || m.dosage_form || ''}
          </p>

          <div class="flex items-center justify-between pt-2 border-t border-zinc-100">
            <div>
              <div class="text-[11px] text-zinc-400">Stock: <span class="font-semibold text-zinc-700 tabular-nums">${m.stock_quantity}</span></div>
            </div>
            <div class="text-right">
              <span class="font-bold text-zinc-900 text-xs tabular-nums">
                ${formatCurrency(m.selling_price)}
              </span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  addToCart(medId) {
    const med = this.catalog.find(m => m.id === medId);
    if (!med) return;

    if (med.expiry_status === 'expired') {
      showToast(`Cannot sell '${med.name}'! Medicine has expired.`, 'error');
      return;
    }

    if (med.stock_quantity === 0) {
      showToast(`'${med.name}' is out of stock!`, 'error');
      return;
    }

    const existingIndex = this.cart.findIndex(item => item.id === medId);
    if (existingIndex > -1) {
      const item = this.cart[existingIndex];
      if (item.quantity + 1 > med.stock_quantity) {
        showToast(`Cannot add more. Only ${med.stock_quantity} units in stock.`, 'warning');
        return;
      }
      item.quantity += 1;
    } else {
      this.cart.push({
        id: med.id,
        name: med.name,
        batch_number: med.batch_number,
        unit_price: med.selling_price,
        quantity: 1,
        discount: 0.0,
        max_stock: med.stock_quantity,
        requires_prescription: med.requires_prescription
      });
    }

    this.renderCart();
  },

  updateQuantity(medId, delta) {
    const item = this.cart.find(i => i.id === medId);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      this.removeFromCart(medId);
      return;
    }

    if (newQty > item.max_stock) {
      showToast(`Max available stock is ${item.max_stock}`, 'warning');
      return;
    }

    item.quantity = newQty;
    this.renderCart();
  },

  removeFromCart(medId) {
    this.cart = this.cart.filter(i => i.id !== medId);
    this.renderCart();
  },

  clearCart() {
    this.cart = [];
    document.getElementById('pos-discount-input').value = '0';
    document.getElementById('pos-notes').value = '';
    document.getElementById('pos-doctor-input').value = '';
    this.renderCart();
  },

  renderCart() {
    const container = document.getElementById('pos-cart-items');
    const badge = document.getElementById('pos-cart-badge');
    if (badge) badge.textContent = this.cart.reduce((sum, item) => sum + item.quantity, 0);

    if (!container) return;

    if (this.cart.length === 0) {
      container.innerHTML = `
        <div class="py-16 text-center text-slate-400">
          <svg class="w-12 h-12 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          <p class="font-medium text-slate-600">Cart is empty</p>
          <p class="text-xs text-slate-400">Click medicines on the left to add items</p>
        </div>
      `;
      this.updateTotals();
      return;
    }

    container.innerHTML = this.cart.map(item => {
      const lineTotal = (item.unit_price * item.quantity) - item.discount;
      return `
        <div class="p-2.5 bg-white border border-zinc-200 rounded-lg flex items-center justify-between gap-2.5 shadow-xs transition">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5">
              <h5 class="text-xs font-semibold text-zinc-900 truncate">${item.name}</h5>
              ${item.requires_prescription ? '<span class="text-[9px] bg-red-50 text-red-700 border border-red-200 font-bold px-1 rounded">Rx</span>' : ''}
            </div>
            <div class="text-[11px] text-zinc-400">
              ${formatCurrency(item.unit_price)} × ${item.quantity} • <span class="font-mono text-[10px]">${item.batch_number}</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <div class="flex items-center border border-zinc-200 rounded-md overflow-hidden bg-zinc-50">
              <button onclick="pos.updateQuantity(${item.id}, -1)" class="px-2 py-0.5 text-zinc-600 hover:bg-zinc-200 transition font-bold text-xs">-</button>
              <span class="px-2 py-0.5 text-xs font-semibold text-zinc-800 bg-white min-w-[24px] text-center tabular-nums">${item.quantity}</span>
              <button onclick="pos.updateQuantity(${item.id}, 1)" class="px-2 py-0.5 text-zinc-600 hover:bg-zinc-200 transition font-bold text-xs">+</button>
            </div>

            <div class="text-right min-w-[60px]">
              <div class="text-xs font-bold text-zinc-900 tabular-nums">${formatCurrency(lineTotal)}</div>
            </div>

            <button onclick="pos.removeFromCart(${item.id})" class="text-zinc-400 hover:text-red-500 p-1 transition" title="Remove">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    this.updateTotals();
  },

  updateTotals() {
    let subtotal = 0;
    this.cart.forEach(item => {
      subtotal += (item.unit_price * item.quantity) - item.discount;
    });

    const discountPct = parseFloat(document.getElementById('pos-discount-input')?.value) || 0;
    const discountVal = (subtotal * discountPct) / 100.0;
    const taxable = Math.max(0, subtotal - discountVal);
    const taxVal = (taxable * this.taxRate) / 100.0;
    const total = taxable + taxVal;

    document.getElementById('pos-subtotal-val').textContent = formatCurrency(subtotal);
    document.getElementById('pos-discount-val').textContent = `-${formatCurrency(discountVal)}`;
    document.getElementById('pos-tax-val').textContent = formatCurrency(taxVal);
    document.getElementById('pos-total-val').textContent = formatCurrency(total);
  },

  onCustomerSelected() {
    if (!this.selectedCustomerId) {
      document.getElementById('pos-patient-notes-banner')?.classList.add('hidden');
      return;
    }
    const cust = this.customers.find(c => c.id === this.selectedCustomerId);
    const banner = document.getElementById('pos-patient-notes-banner');
    if (cust && cust.medical_notes && banner) {
      banner.classList.remove('hidden');
      document.getElementById('pos-patient-notes-text').textContent = cust.medical_notes;
    } else if (banner) {
      banner.classList.add('hidden');
    }
  },

  async checkout() {
    if (this.cart.length === 0) {
      showToast('Cannot complete sale: Cart is empty!', 'warning');
      return;
    }

    const paymentMethod = document.querySelector('input[name="pos_payment_mode"]:checked')?.value || 'Cash';
    const discountPct = parseFloat(document.getElementById('pos-discount-input')?.value) || 0;
    const doctorName = document.getElementById('pos-doctor-input')?.value.trim() || null;
    const notes = document.getElementById('pos-notes')?.value.trim() || null;

    let custName = 'Walk-in Customer';
    let custPhone = null;

    if (this.selectedCustomerId) {
      const cust = this.customers.find(c => c.id === this.selectedCustomerId);
      if (cust) {
        custName = cust.name;
        custPhone = cust.phone;
      }
    }

    const payload = {
      customer_id: this.selectedCustomerId,
      customer_name: custName,
      customer_phone: custPhone,
      doctor_name: doctorName,
      discount_percentage: discountPct,
      tax_rate_percent: this.taxRate,
      payment_method: paymentMethod,
      notes: notes,
      items: this.cart.map(item => ({
        medicine_id: item.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount
      }))
    };

    try {
      const sale = await api.post('/sales', payload);
      this.lastSaleInvoice = sale;
      showToast(`Sale recorded successfully! Invoice #${sale.invoice_number}`, 'success');

      // Clear cart
      this.clearCart();

      // Refresh catalog and dashboard metrics
      await this.loadCatalog();
      if (typeof dashboard.loadMetrics === 'function') {
        dashboard.loadMetrics();
      }
      if (typeof inventory.loadMedicines === 'function') {
        inventory.loadMedicines();
      }

      // Show printable invoice modal
      this.showInvoiceModal(sale);

    } catch (err) {
      showToast(err.message || 'Checkout failed', 'error');
    }
  },

  showInvoiceModal(sale) {
    const modal = document.getElementById('invoice-modal');
    if (!modal) return;

    document.getElementById('inv-number').textContent = sale.invoice_number;
    document.getElementById('inv-date').textContent = new Date(sale.created_at).toLocaleString();
    document.getElementById('inv-cashier').textContent = sale.cashier_name || 'Pharmacist';
    document.getElementById('inv-customer-name').textContent = sale.customer_name || 'Walk-in Customer';
    document.getElementById('inv-customer-phone').textContent = sale.customer_phone || 'N/A';
    document.getElementById('inv-doctor').textContent = sale.doctor_name || 'Over-the-Counter';
    document.getElementById('inv-payment-mode').textContent = sale.payment_method;

    const tbody = document.getElementById('inv-items-tbody');
    tbody.innerHTML = sale.items.map(it => `
      <tr class="border-b border-slate-100">
        <td class="py-2 text-left">
          <div class="font-bold text-slate-800 text-xs">${it.medicine_name}</div>
          <div class="text-[10px] text-slate-400 font-mono">Batch: ${it.batch_number || 'N/A'} • Exp: ${formatDate(it.expiry_date)}</div>
        </td>
        <td class="py-2 text-center text-xs text-slate-700">${it.quantity}</td>
        <td class="py-2 text-right text-xs text-slate-700">${formatCurrency(it.unit_price)}</td>
        <td class="py-2 text-right text-xs font-bold text-slate-900">${formatCurrency(it.total_price)}</td>
      </tr>
    `).join('');

    document.getElementById('inv-subtotal').textContent = formatCurrency(sale.subtotal);
    document.getElementById('inv-discount').textContent = `-${formatCurrency(sale.discount_amount)}`;
    document.getElementById('inv-tax').textContent = formatCurrency(sale.tax_amount);
    document.getElementById('inv-grand-total').textContent = formatCurrency(sale.total_amount);

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  closeInvoiceModal() {
    const modal = document.getElementById('invoice-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  printInvoice() {
    window.print();
  }
};
