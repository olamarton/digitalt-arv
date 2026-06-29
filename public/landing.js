// ── Nav scroll state ──
const nav = document.getElementById('mainNav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// ── Scroll to top ──
function scrollToTop(e) {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Mobile menu ──
let mobileOpen = false;
function toggleMobileMenu() {
  mobileOpen = !mobileOpen;
  document.getElementById('navBurger').classList.toggle('open', mobileOpen);
  document.getElementById('navMobile').classList.toggle('open', mobileOpen);
  document.body.style.overflow = mobileOpen ? 'hidden' : '';
}
function closeMobileMenu() {
  mobileOpen = false;
  document.getElementById('navBurger').classList.remove('open');
  document.getElementById('navMobile').classList.remove('open');
  document.body.style.overflow = '';
}

// ── BankID — startar OIDC-autentiseringsflödet ──
function openDemo() {
  closeMobileMenu();
  window.location.href = '/app.html';
}

// ── FAQ accordion ──
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

// ── Kontaktformulär — öppnar mailto med ifyllt innehåll ──
function sendContactMail(e) {
  e.preventDefault();
  const name = document.getElementById('contactName').value.trim();
  const email = document.getElementById('contactEmail').value.trim();
  const msg = document.getElementById('contactMsg').value.trim();
  const subject = encodeURIComponent(`Fråga från ${name}`);
  const body = encodeURIComponent(`${msg}\n\n—\n${name}\n${email}`);
  window.location.href = `mailto:info@nyckelvalvet.se?subject=${subject}&body=${body}`;
}

// ── Juridiska slide-out-paneler ──
const LEGAL_TITLES = {
  integritet: 'Integritetspolicy',
  villkor: 'Användarvillkor',
  tillganglighet: 'Tillgänglighetsredogörelse',
  gdpr: 'GDPR',
  cookies: 'Cookies'
};

function openLegal(key) {
  const template = document.getElementById('legal-' + key);
  const panel = document.getElementById('legalPanel');
  const overlay = document.getElementById('legalOverlay');
  const body = document.getElementById('legalBody');
  const title = document.getElementById('legalTitle');
  if (!template || !panel || !overlay || !body) return;
  title.textContent = LEGAL_TITLES[key] || '';
  body.innerHTML = '';
  body.appendChild(template.content.cloneNode(true));
  body.scrollTop = 0;
  overlay.classList.add('open');
  panel.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLegal() {
  document.getElementById('legalPanel')?.classList.remove('open');
  document.getElementById('legalOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLegal();
});

// ── Scroll reveal ──
document.body.classList.add('js-ready');

const reveals = document.querySelectorAll('.reveal');

reveals.forEach(el => {
  const rect = el.getBoundingClientRect();
  if (rect.top < window.innerHeight) {
    el.classList.add('visible');
  }
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0, rootMargin: '0px 0px 60px 0px' });

reveals.forEach(el => {
  if (!el.classList.contains('visible')) observer.observe(el);
});

// ── Smooth nav link scroll ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (target) {
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});
