/**
 * Authentication, Session & Cloud Database Diagnostics Management
 */

const auth = {
  currentUser: null,
  systemStatus: null,

  async init() {
    // Check system & database health in background
    this.refreshSystemStatus();

    const token = api.getToken();
    if (!token) {
      this.showLandingView();
      return false;
    }

    try {
      const user = await api.get('/auth/me');
      this.currentUser = user;
      api.setUser(user);
      this.updateUI();
      this.showAppWorkspace();
      return true;
    } catch (err) {
      this.showLandingView();
      return false;
    }
  },

  showLandingView(updateHistory = true) {
    const landing = document.getElementById('landing-view');
    const app = document.getElementById('app-workspace');
    if (landing) {
      landing.classList.remove('hidden');
      landing.classList.add('view-transition');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (app) {
      app.classList.add('hidden');
    }
    this.updateLandingAuthUI();
    if (updateHistory) {
      if (window.location.hash !== '#landing') {
        history.pushState({ view: 'landing' }, '', '#landing');
      }
    }
  },

  showAppWorkspace() {
    const landing = document.getElementById('landing-view');
    const app = document.getElementById('app-workspace');
    if (landing) landing.classList.add('hidden');
    if (app) {
      app.classList.remove('hidden');
      app.classList.add('view-transition');
    }
    this.hideAuthModal();
  },

  updateLandingAuthUI() {
    const landingUserPill = document.getElementById('landing-user-status');
    const landingLaunchBtn = document.getElementById('landing-launch-app-btn');
    const landingSignInBtn = document.getElementById('landing-signin-btn');

    if (this.currentUser) {
      if (landingUserPill) {
        landingUserPill.textContent = `Active: ${this.currentUser.full_name} (${this.currentUser.role.toUpperCase()})`;
        landingUserPill.classList.remove('hidden');
      }
      if (landingLaunchBtn) {
        landingLaunchBtn.classList.remove('hidden');
      }
      if (landingSignInBtn) {
        landingSignInBtn.classList.add('hidden');
      }
    } else {
      if (landingUserPill) landingUserPill.classList.add('hidden');
      if (landingLaunchBtn) landingLaunchBtn.classList.add('hidden');
      if (landingSignInBtn) landingSignInBtn.classList.remove('hidden');
    }
  },

  switchLandingAuthTab(tab) {
    const demoTab = document.getElementById('landing-tab-demo');
    const loginTab = document.getElementById('landing-tab-login');
    const registerTab = document.getElementById('landing-tab-register');

    const demoContent = document.getElementById('landing-content-demo');
    const loginContent = document.getElementById('landing-content-login');
    const registerContent = document.getElementById('landing-content-register');

    const activeClass = 'bg-zinc-900 text-zinc-50 shadow-xs font-semibold';
    const inactiveClass = 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 font-medium';

    [demoTab, loginTab, registerTab].forEach(t => {
      if (t) t.className = `px-3.5 py-1.5 rounded-lg text-xs transition ${inactiveClass}`;
    });
    [demoContent, loginContent, registerContent].forEach(c => {
      if (c) c.classList.add('hidden');
    });

    if (tab === 'demo') {
      if (demoTab) demoTab.className = `px-3.5 py-1.5 rounded-lg text-xs transition ${activeClass}`;
      if (demoContent) demoContent.classList.remove('hidden');
    } else if (tab === 'login') {
      if (loginTab) loginTab.className = `px-3.5 py-1.5 rounded-lg text-xs transition ${activeClass}`;
      if (loginContent) loginContent.classList.remove('hidden');
      document.getElementById('landing-login-user')?.focus();
    } else if (tab === 'register') {
      if (registerTab) registerTab.className = `px-3.5 py-1.5 rounded-lg text-xs transition ${activeClass}`;
      if (registerContent) registerContent.classList.remove('hidden');
      document.getElementById('landing-reg-name')?.focus();
    }
  },

  showAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  },

  hideAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  updateUI() {
    if (!this.currentUser) return;

    // Update user profile card in sidebar
    const nameEl = document.getElementById('user-display-name');
    const roleEl = document.getElementById('user-display-role');
    const emailEl = document.getElementById('user-display-email');
    const roleBadgeEl = document.getElementById('user-role-badge');

    if (nameEl) nameEl.textContent = this.currentUser.full_name;
    if (roleEl) roleEl.textContent = this.currentUser.role.toUpperCase();
    if (emailEl) emailEl.textContent = this.currentUser.email;
    if (roleBadgeEl) {
      roleBadgeEl.textContent = this.currentUser.role;
      roleBadgeEl.className = `text-xs px-2 py-0.5 rounded-md font-medium uppercase ${
        this.currentUser.role === 'admin' 
          ? 'bg-zinc-900 text-zinc-50 border border-zinc-900' 
          : 'bg-zinc-100 text-zinc-800 border border-zinc-200'
      }`;
    }

    // Admin-only elements
    const adminNavItems = document.querySelectorAll('.admin-only');
    adminNavItems.forEach(el => {
      if (this.currentUser.role === 'admin') {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });

    this.updateLandingAuthUI();
  },

  async login(username, password, targetTab = 'dashboard') {
    try {
      const res = await api.post('/auth/login', { username, password });
      api.setToken(res.access_token);
      this.currentUser = res.user;
      api.setUser(res.user);
      this.hideAuthModal();
      this.updateUI();
      if (typeof window.navigateToApp === 'function') {
        window.navigateToApp(targetTab, true);
      } else {
        this.showAppWorkspace();
      }
      showToast(`Welcome back, ${res.user.full_name}!`, 'success');

      // Refresh application data
      if (typeof window.loadInitialAppData === 'function') {
        window.loadInitialAppData();
      }
      return true;
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
      return false;
    }
  },

  async loginAndNavigate(username, password, targetTab = 'dashboard') {
    if (this.currentUser) {
      if (typeof window.navigateToApp === 'function') {
        window.navigateToApp(targetTab, true);
      } else {
        app.switchTab(targetTab, true);
      }
      return true;
    }
    return await this.login(username, password, targetTab);
  },

  async register(data) {
    try {
      const res = await api.post('/auth/register', data);
      api.setToken(res.access_token);
      this.currentUser = res.user;
      api.setUser(res.user);
      this.hideAuthModal();
      this.updateUI();
      if (typeof window.navigateToApp === 'function') {
        window.navigateToApp('dashboard', true);
      } else {
        this.showAppWorkspace();
      }
      showToast(`Registration successful! Logged in as ${res.user.full_name}`, 'success');

      if (typeof window.loadInitialAppData === 'function') {
        window.loadInitialAppData();
      }
      return true;
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
      return false;
    }
  },

  logout() {
    api.clearAuth();
    this.currentUser = null;
    showToast('You have been signed out.', 'info');
    if (typeof window.navigateToLanding === 'function') {
      window.navigateToLanding(true);
    } else {
      this.showLandingView();
    }
  },

  // ==================== Password Management ====================
  showChangePasswordModal() {
    const modal = document.getElementById('change-password-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  },

  hideChangePasswordModal() {
    const modal = document.getElementById('change-password-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      const form = document.getElementById('change-password-form');
      if (form) form.reset();
    }
  },

  async changePassword(currentPassword, newPassword) {
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      showToast('Password changed successfully!', 'success');
      this.hideChangePasswordModal();
    } catch (err) {
      showToast(err.message || 'Failed to change password', 'error');
    }
  },

  // ==================== Database & System Status Diagnostics ====================
  async refreshSystemStatus() {
    try {
      const status = await api.get('/system/status');
      this.systemStatus = status;

      // Update pills in app header & landing page
      const badges = [
        document.getElementById('db-status-pill'),
        document.getElementById('landing-db-pill')
      ];

      badges.forEach(badge => {
        if (!badge) return;
        const isCloud = status.database.is_cloud || status.database.is_supabase;
        badge.innerHTML = `
          <span class="w-1.5 h-1.5 rounded-full ${status.database.connected ? 'bg-emerald-500' : 'bg-red-500'}"></span>
          <span>DB: ${status.database.is_supabase ? 'Supabase' : (isCloud ? 'PostgreSQL' : 'SQLite')}</span>
        `;
        badge.title = `${status.database.provider} - Click for system diagnostics`;
      });

      // Update landing live metric counts if present
      const lmSales = document.getElementById('landing-stat-sales');
      const lmMeds = document.getElementById('landing-stat-meds');
      const lmUsers = document.getElementById('landing-stat-users');
      if (lmSales) lmSales.textContent = `${status.total_sales}+ Invoices`;
      if (lmMeds) lmMeds.textContent = `${status.total_medicines}+ Formulations`;
      if (lmUsers) lmUsers.textContent = `${status.active_users} Staff Accounts`;
    } catch (err) {
      console.warn('System status check skipped:', err);
    }
  },

  showSystemModal() {
    this.refreshSystemStatus();
    const modal = document.getElementById('system-status-modal');
    if (!modal) return;

    if (this.systemStatus) {
      const s = this.systemStatus;
      document.getElementById('sys-db-provider').textContent = s.database.provider;
      document.getElementById('sys-db-driver').textContent = s.database.driver;
      document.getElementById('sys-db-connected').innerHTML = s.database.connected 
        ? '<span class="text-emerald-600 font-semibold">● Connected (Online)</span>'
        : '<span class="text-red-600 font-semibold">● Disconnected</span>';
      document.getElementById('sys-env-badge').textContent = s.environment.toUpperCase();
      document.getElementById('sys-auth-algo').textContent = `${s.auth_algorithm} (Token Validity: ${s.token_expiry_hours}h)`;
      document.getElementById('sys-users-count').textContent = s.active_users;
      document.getElementById('sys-medicines-count').textContent = s.total_medicines;
      document.getElementById('sys-sales-count').textContent = s.total_sales;
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  hideSystemModal() {
    const modal = document.getElementById('system-status-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }
};

window.showAuthModal = () => auth.showAuthModal();
window.showLandingView = () => auth.showLandingView();
window.showAppWorkspace = () => auth.showAppWorkspace();
