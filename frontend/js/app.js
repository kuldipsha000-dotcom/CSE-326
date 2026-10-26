/**
 * Main Application Orchestrator, Router & History Navigation Manager
 */

const app = {
  currentTab: 'dashboard',
  validTabs: [
    'dashboard', 'pos', 'inventory', 'alerts', 'sales',
    'purchases', 'suppliers', 'customers', 'prescriptions',
    'reports', 'users'
  ],

  async init() {
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);

    // Initialize Auth & Check Initial Route
    const authenticated = await auth.init();

    const currentHash = window.location.hash.replace('#', '') || 'landing';
    const landingSections = ['landing', 'home', 'landing-bento', 'operations', 'features', 'roles-matrix', 'cloud-arch', 'auth-console'];

    if (authenticated && this.validTabs.includes(currentHash)) {
      await this.loadInitialData();
      this.switchTab(currentHash, false);
      history.replaceState({ view: 'app', tab: currentHash }, '', `#${currentHash}`);
    } else if (authenticated && !landingSections.includes(currentHash) && currentHash !== 'landing') {
      await this.loadInitialData();
      this.switchTab('dashboard', false);
      history.replaceState({ view: 'app', tab: 'dashboard' }, '', '#dashboard');
    } else {
      auth.showLandingView(false);
      if (authenticated) {
        auth.updateLandingAuthUI();
      }
      if (currentHash && currentHash !== 'landing' && currentHash !== 'home') {
        setTimeout(() => window.scrollToSection(currentHash, false), 150);
      } else {
        history.replaceState({ view: 'landing' }, '', '#landing');
      }
    }

    this.bindGlobalShortcuts();
    this.initScrollSpy();
    this.initHistoryRouter();
  },

  updateClock() {
    const el = document.getElementById('header-live-clock');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }) + ' • ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  },

  async loadInitialData() {
    await dashboard.init();
    await alerts.init();
    await inventory.init();
    await pos.init();
  },

  switchTab(tabId, updateHistory = true) {
    if (!this.validTabs.includes(tabId)) {
      tabId = 'dashboard';
    }
    this.currentTab = tabId;

    // Ensure Workspace is visible
    auth.showAppWorkspace();

    // Update History state if requested so Browser Back button works
    if (updateHistory) {
      if (window.location.hash !== `#${tabId}`) {
        history.pushState({ view: 'app', tab: tabId }, '', `#${tabId}`);
      }
    }

    // Update breadcrumb
    const breadcrumbTitles = {
      dashboard: 'Dashboard',
      pos: 'POS & Counter Billing',
      inventory: 'Medicine Inventory',
      alerts: 'Safety & Expiry Alerts',
      sales: 'Invoices & Sales',
      purchases: 'Stock Inward (Purchases)',
      suppliers: 'Suppliers Directory',
      customers: 'Patients & Customers',
      prescriptions: 'Prescription Records',
      reports: 'Reports & Valuation',
      users: 'Staff & Roles (Admin)'
    };
    const breadcrumbEl = document.getElementById('header-breadcrumb');
    if (breadcrumbEl) {
      breadcrumbEl.textContent = breadcrumbTitles[tabId] || 'Workspace';
    }

    // Update nav link styles
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.dataset.tab === tabId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Hide all tab views
    document.querySelectorAll('.tab-view').forEach(view => {
      view.classList.add('hidden');
    });

    // Show current tab view with view transition
    const activeView = document.getElementById(`view-${tabId}`);
    if (activeView) {
      activeView.classList.remove('hidden');
      activeView.classList.add('view-transition');
    }

    // Tab-specific lazy refreshes
    switch (tabId) {
      case 'dashboard':
        dashboard.init();
        break;
      case 'pos':
        pos.loadCatalog();
        pos.loadCustomers();
        break;
      case 'inventory':
        inventory.loadMedicines();
        break;
      case 'sales':
        sales.init();
        break;
      case 'suppliers':
        suppliers.init();
        break;
      case 'purchases':
        purchases.init();
        break;
      case 'customers':
        customers.init();
        break;
      case 'prescriptions':
        prescriptions.init();
        break;
      case 'alerts':
        alerts.init();
        break;
      case 'reports':
        reports.init();
        break;
      case 'users':
        users.init();
        break;
    }
  },

  // Setup Browser History Back / Forward Navigation
  initHistoryRouter() {
    window.addEventListener('popstate', (e) => {
      const hash = window.location.hash.replace('#', '') || 'landing';

      if (hash === 'landing' || hash === 'home' || !this.validTabs.includes(hash)) {
        // Going Back to Landing Page
        auth.showLandingView(false);
        if (hash && hash !== 'landing' && hash !== 'home') {
          window.scrollToSection(hash, false);
        }
      } else if (this.validTabs.includes(hash)) {
        // Going Forward/Back to a Workspace Tab
        if (api.getToken()) {
          this.switchTab(hash, false);
        } else {
          auth.showLandingView(false);
        }
      }
    });
  },

  // ScrollSpy to keep the floating pill navbar active item in sync with page scroll
  initScrollSpy() {
    const sections = ['landing-bento', 'operations', 'auth-console', 'features', 'roles-matrix', 'cloud-arch'];
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (ticking) return;
      window.requestAnimationFrame(() => {
        const landing = document.getElementById('landing-view');
        if (landing && !landing.classList.contains('hidden')) {
          const scrollPos = window.scrollY + 140;

          for (let i = sections.length - 1; i >= 0; i--) {
            const sec = document.getElementById(sections[i]);
            if (sec && sec.offsetTop <= scrollPos) {
              this.updateNavPill(sections[i]);
              break;
            }
          }
        }
        ticking = false;
      });
      ticking = true;
    }, { passive: true });
  },

  updateNavPill(activeSectionId) {
    document.querySelectorAll('.landing-nav-pill').forEach(pill => {
      if (pill.dataset.target === activeSectionId) {
        pill.className = 'landing-nav-pill nav-pill-active px-3.5 py-1.5 rounded-full text-xs transition';
      } else {
        pill.className = 'landing-nav-pill px-3 py-1.5 rounded-full text-xs text-zinc-600 hover:text-zinc-900 transition';
      }
    });
  },

  bindGlobalShortcuts() {
    document.addEventListener('keydown', (e) => {
      // ESC closes any open modal
      if (e.key === 'Escape') {
        inventory.closeModal();
        pos.closeInvoiceModal();
        suppliers.closeModal();
        purchases.closeModal();
        customers.closeModal();
        customers.closeProfileModal();
        prescriptions.closeModal();
        auth.hideChangePasswordModal();
        auth.hideSystemModal();
        auth.hideAuthModal();
      }

      // F2 or Alt+P opens POS Billing
      if (e.key === 'F2' || (e.altKey && e.key === 'p')) {
        e.preventDefault();
        this.switchTab('pos');
        document.getElementById('pos-search-input')?.focus();
      }
    });
  }
};

// ==================== GLOBAL ROUTER & SCROLL HELPERS ====================

/**
 * Smoothly scrolls to section with floating navbar offset and slide animation
 */
window.scrollToSection = (sectionId, updateHash = true) => {
  const el = document.getElementById(sectionId);
  if (!el) return;

  const yOffset = -85; // floating pill navbar height + padding offset
  const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;

  window.scrollTo({ top: y, behavior: 'smooth' });

  // Update active pill
  app.updateNavPill(sectionId);

  // Trigger smooth slide animation on target section
  el.classList.remove('section-slide-animate');
  void el.offsetWidth; // trigger reflow
  el.classList.add('section-slide-animate');

  if (updateHash) {
    if (window.location.hash !== `#${sectionId}`) {
      history.pushState({ view: 'landing', section: sectionId }, '', `#${sectionId}`);
    }
  }
};

/**
 * Navigate seamlessly to the Landing Page and update browser history
 */
window.navigateToLanding = (updateHistory = true) => {
  auth.showLandingView(updateHistory);
};

/**
 * Navigate seamlessly to the Workspace and update browser history
 */
window.navigateToApp = (tabId = 'dashboard', updateHistory = true) => {
  app.switchTab(tabId, updateHistory);
};

// Global helper for triggering initial load after login
window.loadInitialAppData = () => app.loadInitialData();

// Start on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
