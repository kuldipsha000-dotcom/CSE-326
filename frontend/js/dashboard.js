/**
 * Dashboard & Analytics Component
 */

const dashboard = {
  salesChart: null,
  categoryChart: null,

  async init() {
    await this.loadMetrics();
  },

  async loadMetrics() {
    try {
      const data = await api.get('/reports/dashboard');
      if (!data) return;

      const { metrics, sales_trend, top_medicines, category_distribution, recent_sales } = data;

      // Update KPI Cards
      document.getElementById('metric-total-rev').textContent = formatCurrency(metrics.total_revenue);
      document.getElementById('metric-today-rev').textContent = formatCurrency(metrics.today_revenue);
      document.getElementById('metric-today-sales').textContent = `${metrics.today_sales_count} Orders`;
      document.getElementById('metric-total-meds').textContent = metrics.total_medicines;
      document.getElementById('metric-low-stock').textContent = metrics.low_stock_count;
      document.getElementById('metric-expired').textContent = metrics.expired_count;
      document.getElementById('metric-expiring-soon').textContent = metrics.expiring_soon_count;
      document.getElementById('metric-total-customers').textContent = metrics.total_customers;

      // Render Charts
      this.renderSalesTrendChart(sales_trend);
      this.renderCategoryChart(category_distribution);

      // Render Top Selling Medicines
      this.renderTopSelling(top_medicines);

      // Render Recent Transactions
      this.renderRecentSales(recent_sales);

    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  },

  renderSalesTrendChart(trend) {
    const ctx = document.getElementById('sales-trend-canvas');
    if (!ctx) return;

    if (this.salesChart) {
      this.salesChart.destroy();
    }

    this.salesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: trend.labels,
        datasets: [
          {
            label: 'Daily Revenue (₹)',
            data: trend.revenues,
            borderColor: '#18181b',
            backgroundColor: 'rgba(24, 24, 27, 0.04)',
            fill: true,
            tension: 0.3,
            borderWidth: 2,
            pointBackgroundColor: '#18181b',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 3.5,
            pointHoverRadius: 5.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#18181b',
            titleColor: '#fafafa',
            bodyColor: '#fafafa',
            padding: 10,
            cornerRadius: 8,
            titleFont: { size: 11, weight: '600' },
            bodyFont: { size: 12, weight: '700' },
            callbacks: {
              label: (context) => ` Revenue: ₹${context.raw.toFixed(2)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            border: { display: false },
            grid: { color: '#f4f4f5' },
            ticks: {
              font: { size: 11, family: 'Inter' },
              color: '#71717a',
              callback: (val) => '₹' + val
            }
          },
          x: {
            border: { display: false },
            grid: { display: false },
            ticks: {
              font: { size: 11, family: 'Inter' },
              color: '#71717a'
            }
          }
        }
      }
    });
  },

  renderCategoryChart(categories) {
    const ctx = document.getElementById('category-pie-canvas');
    if (!ctx) return;

    if (this.categoryChart) {
      this.categoryChart.destroy();
    }

    const labels = categories.map(c => c.category);
    const counts = categories.map(c => c.count);
    const colors = [
      '#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#0d9488', '#14b8a6', '#059669', '#3b82f6'
    ];

    this.categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: counts,
          backgroundColor: colors.slice(0, counts.length),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 10,
              boxHeight: 10,
              usePointStyle: true,
              pointStyle: 'circle',
              font: { size: 11, family: 'Inter' },
              color: '#71717a'
            }
          }
        },
        cutout: '70%'
      }
    });
  },

  renderTopSelling(items) {
    const container = document.getElementById('dashboard-top-selling');
    if (!container) return;

    if (!items || items.length === 0) {
      container.innerHTML = `<div class="p-4 text-center text-zinc-400 text-xs">No sales recorded yet.</div>`;
      return;
    }

    container.innerHTML = items.map((it, idx) => `
      <div class="flex items-center justify-between p-2.5 rounded-lg border border-zinc-100 hover:bg-zinc-50/75 transition text-xs">
        <div class="flex items-center gap-2.5">
          <div class="w-6 h-6 rounded-md bg-zinc-100 text-zinc-700 font-semibold flex items-center justify-center text-[10px]">
            ${idx + 1}
          </div>
          <div>
            <div class="font-semibold text-zinc-900">${it.name}</div>
            <div class="text-[10px] text-zinc-400">${it.units_sold} units dispensed</div>
          </div>
        </div>
        <div class="text-right">
          <div class="font-bold text-zinc-900 tabular-nums">${formatCurrency(it.total_sales)}</div>
          <div class="text-[10px] text-zinc-400">Total Revenue</div>
        </div>
      </div>
    `).join('');
  },

  renderRecentSales(sales) {
    const tbody = document.getElementById('dashboard-recent-sales-tbody');
    if (!tbody) return;

    if (!sales || sales.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-zinc-400 text-xs">No transactions found.</td></tr>`;
      return;
    }

    tbody.innerHTML = sales.map(s => `
      <tr class="hover:bg-zinc-50/70 transition">
        <td class="py-2 px-3 font-mono font-medium text-[11px] text-zinc-900">
          ${s.invoice_number}
        </td>
        <td class="py-2 px-3 text-zinc-800 font-medium">
          ${s.customer_name || 'Walk-in'}
        </td>
        <td class="py-2 px-3 font-semibold text-zinc-900 tabular-nums">
          ${formatCurrency(s.total_amount)}
        </td>
        <td class="py-2 px-3">
          <span class="inline-flex items-center px-1.5 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-[10px] font-medium text-zinc-700">
            ${s.payment_method}
          </span>
        </td>
        <td class="py-2 px-3 text-[11px] text-zinc-400">
          ${new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </td>
      </tr>
    `).join('');
  }
};
