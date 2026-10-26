/**
 * Users & Staff Administration Component
 */

const users = {
  list: [],

  async init() {
    await this.loadUsers();
  },

  async loadUsers() {
    if (auth.currentUser?.role !== 'admin') return;

    try {
      const data = await api.get('/auth/users');
      this.list = data;
      this.renderTable(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  },

  renderTable(data) {
    const tbody = document.getElementById('users-table-tbody');
    if (!tbody) return;

    tbody.innerHTML = data.map(u => `
      <tr class="border-b border-zinc-100 hover:bg-zinc-50/70 transition text-xs">
        <td class="py-2.5 px-3">
          <div class="font-semibold text-zinc-900">${u.full_name}</div>
          <div class="text-[11px] text-zinc-400 font-mono">@${u.username}</div>
        </td>
        <td class="py-2.5 px-3 text-zinc-600">
          <div>${u.email}</div>
          <div class="text-[11px] text-zinc-400 font-mono">${u.phone || 'No phone'}</div>
        </td>
        <td class="py-2.5 px-3">
          <select onchange="users.changeRole(${u.id}, this.value)" class="text-xs px-2 py-1 bg-white border border-zinc-200 rounded-md font-medium focus:outline-none focus:ring-1 focus:ring-zinc-950">
            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Administrator</option>
            <option value="pharmacist" ${u.role === 'pharmacist' ? 'selected' : ''}>Pharmacist</option>
            <option value="cashier" ${u.role === 'cashier' ? 'selected' : ''}>Cashier / Staff</option>
          </select>
        </td>
        <td class="py-2.5 px-3">
          <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
            u.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }">
            ${u.is_active ? 'Active' : 'Deactivated'}
          </span>
        </td>
        <td class="py-2.5 px-3 text-center">
          ${u.id !== auth.currentUser.id ? `
            <button onclick="users.toggleActive(${u.id}, ${!u.is_active})" class="text-xs font-medium px-2 py-1 rounded-md border transition ${
              u.is_active 
                ? 'border-zinc-200 text-zinc-600 hover:text-red-600 hover:bg-red-50' 
                : 'border-zinc-200 text-zinc-600 hover:text-emerald-700 hover:bg-emerald-50'
            }">
              ${u.is_active ? 'Deactivate' : 'Activate'}
            </button>
          ` : '<span class="text-[11px] text-zinc-400 italic">Current Session</span>'}
        </td>
      </tr>
    `).join('');
  },

  async changeRole(userId, newRole) {
    try {
      await api.put(`/auth/users/${userId}/role`, { role: newRole });
      showToast('User role updated successfully', 'success');
      await this.loadUsers();
    } catch (err) {
      showToast(err.message || 'Failed to update role', 'error');
    }
  },

  async toggleActive(userId, newStatus) {
    const user = this.list.find(u => u.id === userId);
    if (!user) return;

    try {
      await api.put(`/auth/users/${userId}/role`, { role: user.role, is_active: newStatus });
      showToast(`User status updated to ${newStatus ? 'Active' : 'Deactivated'}`, 'info');
      await this.loadUsers();
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  }
};
