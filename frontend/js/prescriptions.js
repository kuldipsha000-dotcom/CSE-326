/**
 * Prescription Records & Upload Management
 */

const prescriptions = {
  list: [],
  customersList: [],

  async init() {
    await this.loadPrescriptions();
    await this.loadCustomersDropdown();
  },

  async loadCustomersDropdown() {
    try {
      const data = await api.get('/customers');
      this.customersList = data;
      const select = document.getElementById('rx-form-customer');
      if (select) {
        select.innerHTML = `<option value="">Select Patient / Customer...</option>` +
          data.map(c => `<option value="${c.id}">${c.name} (${c.phone})</option>`).join('');
      }
    } catch (err) {
      console.error('Failed to load customers for Rx:', err);
    }
  },

  async loadPrescriptions() {
    try {
      const data = await api.get('/prescriptions');
      this.list = data;
      this.renderTable(data);
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
    }
  },

  renderTable(data) {
    const tbody = document.getElementById('prescriptions-table-tbody');
    const countEl = document.getElementById('prescriptions-total-count');
    if (countEl) countEl.textContent = `${data.length} records`;
    if (!tbody) return;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-slate-400">No prescription records found.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(rx => {
      let statusClass = 'bg-zinc-100 text-zinc-700 border-zinc-200';
      if (rx.status === 'Verified') statusClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      if (rx.status === 'Dispensed') statusClass = 'bg-zinc-100 text-zinc-500 border-zinc-200';

      return `
        <tr class="border-b border-zinc-100 hover:bg-zinc-50/70 transition text-xs">
          <td class="py-2.5 px-3 font-semibold text-zinc-900">
            ${rx.customer_name}
          </td>
          <td class="py-2.5 px-3">
            <div class="font-medium text-zinc-800">${rx.doctor_name}</div>
            <div class="text-[10px] text-zinc-400 font-mono">${rx.doctor_license || 'Lic. Unspecified'}</div>
          </td>
          <td class="py-2.5 px-3 text-[11px] text-zinc-500">
            ${formatDate(rx.prescription_date)}
          </td>
          <td class="py-2.5 px-3 text-zinc-600 max-w-[200px]">
            <p class="truncate">${rx.notes || 'No prescription notes'}</p>
            ${rx.file_url ? `<a href="${rx.file_url}" target="_blank" class="text-zinc-900 hover:underline font-semibold text-[10px] inline-flex items-center gap-1 mt-0.5">📎 View Uploaded File</a>` : ''}
          </td>
          <td class="py-2.5 px-3">
            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${statusClass}">
              ${rx.status}
            </span>
          </td>
          <td class="py-2.5 px-3 text-center">
            <select onchange="prescriptions.updateStatus(${rx.id}, this.value)" class="text-xs px-2 py-0.5 bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-950 font-medium">
              <option value="Verified" ${rx.status === 'Verified' ? 'selected' : ''}>Verified</option>
              <option value="Dispensed" ${rx.status === 'Dispensed' ? 'selected' : ''}>Dispensed</option>
              <option value="Pending" ${rx.status === 'Pending' ? 'selected' : ''}>Pending</option>
            </select>
          </td>
        </tr>
      `;
    }).join('');
  },

  openAddModal() {
    document.getElementById('rx-form').reset();
    document.getElementById('rx-form-date').value = new Date().toISOString().split('T')[0];
    const modal = document.getElementById('prescription-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  closeModal() {
    const modal = document.getElementById('prescription-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  },

  async savePrescription(e) {
    e.preventDefault();
    const customerId = document.getElementById('rx-form-customer').value;
    const doctorName = document.getElementById('rx-form-doctor').value.trim();
    const doctorLicense = document.getElementById('rx-form-license').value.trim();
    const rxDate = document.getElementById('rx-form-date').value;
    const notes = document.getElementById('rx-form-notes').value.trim();
    const fileInput = document.getElementById('rx-form-file');

    if (!customerId) {
      showToast('Please select a customer/patient', 'warning');
      return;
    }

    try {
      if (fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append('customer_id', customerId);
        formData.append('doctor_name', doctorName);
        if (doctorLicense) formData.append('doctor_license', doctorLicense);
        if (rxDate) formData.append('prescription_date_str', rxDate);
        if (notes) formData.append('notes', notes);
        formData.append('file', fileInput.files[0]);

        await api.upload('/prescriptions/upload', formData);
      } else {
        await api.post('/prescriptions', {
          customer_id: parseInt(customerId, 10),
          doctor_name: doctorName,
          doctor_license: doctorLicense || null,
          prescription_date: rxDate || null,
          notes: notes || null,
          status: 'Verified'
        });
      }

      showToast('Prescription record created successfully', 'success');
      this.closeModal();
      await this.loadPrescriptions();
    } catch (err) {
      showToast(err.message || 'Failed to save prescription', 'error');
    }
  },

  async updateStatus(rxId, newStatus) {
    try {
      await api.put(`/prescriptions/${rxId}/status?status_val=${newStatus}`);
      showToast(`Prescription status updated to ${newStatus}`, 'info');
      await this.loadPrescriptions();
    } catch (err) {
      showToast('Failed to update status: ' + err.message, 'error');
    }
  }
};
