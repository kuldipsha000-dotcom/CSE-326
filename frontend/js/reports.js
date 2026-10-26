/**
 * Reports & Financial Analytics Component
 */

const reports = {
  async init() {
    await this.loadValuation();
    await this.loadSalesAnalysis();
  },

  async loadValuation() {
    try {
      const data = await api.get('/reports/inventory-valuation');
      if (!data) return;

      document.getElementById('rep-val-items').textContent = data.total_items;
      document.getElementById('rep-val-units').textContent = data.total_units.toLocaleString();
      document.getElementById('rep-val-cost').textContent = formatCurrency(data.total_cost_valuation);
      document.getElementById('rep-val-retail').textContent = formatCurrency(data.total_retail_valuation);
      document.getElementById('rep-val-profit').textContent = formatCurrency(data.potential_profit);
      document.getElementById('rep-val-margin').textContent = `${data.profit_margin_percent}%`;
    } catch (err) {
      console.error('Failed to load valuation report:', err);
    }
  },

  async loadSalesAnalysis() {
    try {
      const data = await api.get('/reports/dashboard');
      if (!data) return;

      // Render payment breakdown
      const payContainer = document.getElementById('rep-payment-methods');
      if (payContainer && data.payment_breakdown) {
        payContainer.innerHTML = data.payment_breakdown.map(p => `
          <div class="flex items-center justify-between p-2.5 border border-zinc-200 bg-white rounded-lg text-xs">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-zinc-900"></span>
              <span class="font-medium text-zinc-900">${p.method}</span>
              <span class="text-[11px] text-zinc-400 font-mono">(${p.count} orders)</span>
            </div>
            <span class="font-semibold text-zinc-900 tabular-nums">${formatCurrency(p.amount)}</span>
          </div>
        `).join('');
      }

      // Render Top Products Table
      const topTbody = document.getElementById('rep-top-products-tbody');
      if (topTbody && data.top_medicines) {
        topTbody.innerHTML = data.top_medicines.map((m, idx) => `
          <tr class="border-b border-zinc-100 text-xs">
            <td class="py-2 px-3 font-semibold text-zinc-900">#${idx + 1}</td>
            <td class="py-2 px-3 font-medium text-zinc-800">${m.name}</td>
            <td class="py-2 px-3 text-center font-semibold text-zinc-700 tabular-nums">${m.units_sold}</td>
            <td class="py-2 px-3 text-right font-bold text-zinc-900 tabular-nums">${formatCurrency(m.total_sales)}</td>
          </tr>
        `).join('');
      }
    } catch (err) {
      console.error('Failed to load sales analysis:', err);
    }
  },

  async exportSalesReport() {
    try {
      const salesData = await api.get('/sales?limit=500');
      if (!salesData || salesData.length === 0) {
        showToast('No sales data to export', 'warning');
        return;
      }

      const headers = ['Invoice Number', 'Date', 'Customer Name', 'Customer Phone', 'Doctor', 'Cashier', 'Subtotal', 'Discount', 'Tax', 'Grand Total', 'Payment Method', 'Status'];
      const rows = salesData.map(s => [
        s.invoice_number,
        `"${new Date(s.created_at).toLocaleString()}"`,
        `"${(s.customer_name || 'Walk-in').replace(/"/g, '""')}"`,
        s.customer_phone || '',
        `"${(s.doctor_name || '').replace(/"/g, '""')}"`,
        `"${s.cashier_name}"`,
        s.subtotal,
        s.discount_amount,
        s.tax_amount,
        s.total_amount,
        s.payment_method,
        s.payment_status
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `sales_audit_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Sales Report CSV downloaded successfully!', 'success');
    } catch (err) {
      showToast('Export failed: ' + err.message, 'error');
    }
  }
};
