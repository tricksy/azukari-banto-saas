/**
 * 預かり番頭 SaaS Documentation - Section Loader & Interactive Features
 */

/**
 * Load all sections from embedded data (window.SECTIONS)
 */
function loadAllSections() {
  if (typeof window.SECTIONS === 'undefined') {
    console.error('SECTIONS not loaded. Make sure all-sections.js is included before docs.js');
    showErrorMessage();
    return;
  }

  Object.entries(window.SECTIONS).forEach(([fileName, content]) => {
    const container = document.querySelector(`[data-file="${fileName}"]`);
    if (container) {
      container.innerHTML = content;
      container.classList.remove('loading');
    }
  });

  initializeFeatures();
}

/**
 * Show error message if sections fail to load
 */
function showErrorMessage() {
  document.querySelectorAll('.section-placeholder').forEach(el => {
    el.innerHTML = `
      <div style="padding: 30px; text-align: center; color: #7B2D26;">
        <p>コンテンツの読み込みに失敗しました。</p>
        <p>all-sections.js が正しく読み込まれているか確認してください。</p>
      </div>
    `;
    el.classList.remove('loading');
  });
}

/**
 * Initialize all interactive features
 */
function initializeFeatures() {
  initSmoothScroll();
  initScrollTracking();
  initCategoryHeight();
  initKeyboardShortcuts();
}

/**
 * Smooth Scroll Handler
 */
function handleSmoothScroll(e) {
  e.preventDefault();
  const href = this.getAttribute('href');
  const target = document.querySelector(href);

  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  document.querySelector('.sidebar').classList.remove('open');
  document.querySelector('.sidebar-overlay').classList.remove('active');
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', handleSmoothScroll);
  });
}

/**
 * Scroll Tracking
 */
let sections = [];
let navLinks = [];

function updateScrollTracking() {
  sections = Array.from(document.querySelectorAll('section[id]'));
  navLinks = Array.from(document.querySelectorAll('.sidebar nav a'));
}

function initScrollTracking() {
  const progressBar = document.querySelector('.progress-indicator');
  const scrollTopBtn = document.querySelector('.scroll-top');

  updateScrollTracking();

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      if (scrollY >= sectionTop - 100) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });

    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = progress + '%';

    if (scrollTop > 400) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  }, { passive: true });
}

/**
 * Scroll to Top
 */
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Category Toggle
 */
function toggleCategory(element) {
  element.classList.toggle('collapsed');
  const links = element.nextElementSibling;

  if (links && links.classList.contains('category-links')) {
    links.classList.toggle('collapsed');
  }
}

function initCategoryHeight() {
  document.querySelectorAll('.category-links').forEach(links => {
    links.style.maxHeight = links.scrollHeight + 'px';
  });
}

/**
 * Search/Filter Navigation
 */
function filterNav(query) {
  const q = query.toLowerCase().trim();
  const allLinks = document.querySelectorAll('.sidebar nav a');
  const categories = document.querySelectorAll('.sidebar .category');

  if (q === '') {
    allLinks.forEach(link => link.classList.remove('hidden'));
    document.querySelectorAll('.category-links').forEach(links => {
      links.classList.remove('collapsed');
      links.style.maxHeight = links.scrollHeight + 'px';
    });
    categories.forEach(cat => cat.classList.remove('collapsed'));
    return;
  }

  allLinks.forEach(link => {
    const text = link.textContent.toLowerCase();
    const href = link.getAttribute('href').toLowerCase();
    const matches = text.includes(q) || href.includes(q);
    link.classList.toggle('hidden', !matches);
  });

  document.querySelectorAll('.category-links').forEach(links => {
    const hasVisible = links.querySelectorAll('a:not(.hidden)').length > 0;
    if (hasVisible) {
      links.classList.remove('collapsed');
      links.style.maxHeight = links.scrollHeight + 'px';
      links.previousElementSibling.classList.remove('collapsed');
    } else {
      links.classList.add('collapsed');
      links.previousElementSibling.classList.add('collapsed');
    }
  });
}

/**
 * Mobile Menu Toggle
 */
function toggleMobileMenu() {
  document.querySelector('.sidebar').classList.toggle('open');
  document.querySelector('.sidebar-overlay').classList.toggle('active');
}

/**
 * Keyboard Shortcuts
 */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      document.getElementById('searchInput').focus();
    }
    if (e.key === 'Escape') {
      document.querySelector('.sidebar').classList.remove('open');
      document.querySelector('.sidebar-overlay').classList.remove('active');
      document.getElementById('searchInput').blur();
    }
  });
}

/**
 * Initialize on DOM Ready
 */
document.addEventListener('DOMContentLoaded', loadAllSections);

window.scrollToTop = scrollToTop;
window.toggleCategory = toggleCategory;
window.filterNav = filterNav;
window.toggleMobileMenu = toggleMobileMenu;
