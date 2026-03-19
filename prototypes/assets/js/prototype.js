/* ============================================================
   BAAM LOCAL PORTAL — Prototype Interaction Scripts
   Handles tabs, modals, dropdowns, mobile nav for static HTML
   ============================================================ */

document.addEventListener('DOMContentLoaded', function() {

  // ---- Tab Switching ----
  document.querySelectorAll('[data-tabs]').forEach(function(tabGroup) {
    const tabs = tabGroup.querySelectorAll('[data-tab]');
    const panels = tabGroup.closest('section')?.querySelectorAll('[data-panel]')
                   || document.querySelectorAll('[data-panel]');

    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        const target = this.getAttribute('data-tab');
        tabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        panels.forEach(function(panel) {
          panel.style.display = panel.getAttribute('data-panel') === target ? 'block' : 'none';
        });
      });
    });
  });

  // ---- Mobile Navigation Toggle ----
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', function() {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // ---- Modal Open/Close ----
  document.querySelectorAll('[data-modal-open]').forEach(function(trigger) {
    trigger.addEventListener('click', function(e) {
      e.preventDefault();
      const modalId = this.getAttribute('data-modal-open');
      const modal = document.getElementById(modalId);
      if (modal) modal.classList.remove('hidden');
    });
  });
  document.querySelectorAll('[data-modal-close]').forEach(function(closeBtn) {
    closeBtn.addEventListener('click', function() {
      this.closest('.modal-overlay').classList.add('hidden');
    });
  });
  // Close modal on overlay click
  document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === this) this.classList.add('hidden');
    });
  });

  // ---- Dropdown Toggle ----
  document.querySelectorAll('[data-dropdown]').forEach(function(trigger) {
    const menu = trigger.nextElementSibling;
    trigger.addEventListener('click', function(e) {
      e.stopPropagation();
      menu.classList.toggle('hidden');
    });
  });
  document.addEventListener('click', function() {
    document.querySelectorAll('[data-dropdown] + *').forEach(function(menu) {
      menu.classList.add('hidden');
    });
  });

  // ---- Accordion / FAQ ----
  document.querySelectorAll('[data-accordion]').forEach(function(trigger) {
    trigger.addEventListener('click', function() {
      const content = this.nextElementSibling;
      const icon = this.querySelector('.accordion-icon');
      const isOpen = !content.classList.contains('hidden');
      content.classList.toggle('hidden');
      if (icon) icon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
    });
  });

  // ---- Language Toggle (Simplified/Traditional) ----
  const langToggle = document.getElementById('lang-toggle');
  if (langToggle) {
    langToggle.addEventListener('click', function() {
      const current = this.textContent.trim();
      this.textContent = current === '繁' ? '简' : '繁';
      // In real app, this would trigger opencc-js conversion
      document.body.classList.toggle('traditional-chinese');
    });
  }

  // ---- Like Button Toggle ----
  document.querySelectorAll('[data-like]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      this.classList.toggle('text-red-500');
      this.classList.toggle('text-gray-400');
      const count = this.querySelector('.like-count');
      if (count) {
        const n = parseInt(count.textContent);
        count.textContent = this.classList.contains('text-red-500') ? n + 1 : n - 1;
      }
    });
  });

  // ---- Follow Button Toggle ----
  document.querySelectorAll('[data-follow]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const isFollowing = this.classList.contains('following');
      if (isFollowing) {
        this.classList.remove('following', 'bg-gray-200', 'text-gray-700');
        this.classList.add('bg-orange-500', 'text-white');
        this.textContent = '+ 关注';
      } else {
        this.classList.add('following', 'bg-gray-200', 'text-gray-700');
        this.classList.remove('bg-orange-500', 'text-white');
        this.textContent = '已关注';
      }
    });
  });

  // ---- Toast Demo ----
  window.showToast = function(message, type) {
    type = type || 'info';
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 3000);
  };

  // ---- Scroll-to-top ----
  const scrollTopBtn = document.getElementById('scroll-top');
  if (scrollTopBtn) {
    window.addEventListener('scroll', function() {
      scrollTopBtn.style.display = window.scrollY > 400 ? 'flex' : 'none';
    });
    scrollTopBtn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ---- Admin sidebar active state ----
  const currentPage = window.location.pathname.split('/').pop()?.replace('.html', '');
  document.querySelectorAll('.admin-sidebar .nav-item').forEach(function(item) {
    if (item.getAttribute('data-page') === currentPage) {
      item.classList.add('active');
    }
  });

});
