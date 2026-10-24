(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.querySelector('.header');
  const nav = document.querySelector('#mobile-nav');
  const toggle = document.querySelector('.menu-toggle');
  const closeButton = document.querySelector('.menu-close');
  const productMenu = document.querySelector('.product-menu');
  let navDestination = null;

  function closeNavigation(destination = null) {
    navDestination = destination;
    if (nav?.open) nav.close();
  }
  toggle?.addEventListener('click', () => {
    if (!nav) return;
    nav.showModal();
    document.body.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close navigation');
    closeButton?.focus();
  });
  closeButton?.addEventListener('click', () => closeNavigation());
  nav?.addEventListener('close', () => {
    document.body.classList.remove('nav-open');
    toggle?.setAttribute('aria-expanded', 'false');
    toggle?.setAttribute('aria-label', 'Open navigation');
    if (navDestination) {
      const destination = navDestination;
      navDestination = null;
      destination.setAttribute('tabindex', '-1');
      destination.focus({ preventScroll: true });
      destination.addEventListener('blur', () => destination.removeAttribute('tabindex'), { once: true });
    } else if (toggle?.getClientRects().length) toggle.focus({ preventScroll: true });
  });
  nav?.addEventListener('click', (event) => {
    if (event.target === nav) {
      const rect = nav.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right) closeNavigation();
    }
  });
  nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    const hash = link.getAttribute('href');
    closeNavigation(hash?.startsWith('#') ? document.querySelector(hash) : null);
  }));
  window.matchMedia('(min-width: 1051px)').addEventListener('change', (event) => {
    if (event.matches) closeNavigation();
    if (!event.matches && productMenu) productMenu.open = false;
  });
  document.addEventListener('click', (event) => {
    if (productMenu?.open && !productMenu.contains(event.target)) productMenu.open = false;
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && productMenu?.open) {
      productMenu.open = false;
      productMenu.querySelector('summary')?.focus();
    }
  });
  productMenu?.addEventListener('focusout', () => {
    setTimeout(() => {
      if (!productMenu.contains(document.activeElement)) productMenu.open = false;
    }, 0);
  });
  productMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => { productMenu.open = false; }));

  let scheduled = false;
  const heroPhoto = document.querySelector('.hero-photo');
  function updateScroll() {
    header?.classList.toggle('is-scrolled', window.scrollY > 24);
    if (heroPhoto && !reducedMotion.matches && window.innerWidth > 800 && window.scrollY < 1000) {
      heroPhoto.style.setProperty('--parallax-y', `${Math.min(14, window.scrollY * 0.025)}px`);
    }
    scheduled = false;
  }
  window.addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateScroll); }
  }, { passive: true });
  updateScroll();

  const revealElements = document.querySelectorAll('.reveal');
  const activeCounters = new Map();
  function finishCounter(element) { element.textContent = element.dataset.counter; }
  function count(element) {
    if (reducedMotion.matches) return finishCounter(element);
    const target = Number(element.dataset.counter);
    if (!Number.isFinite(target)) return;
    const started = performance.now();
    const frame = (now) => {
      const progress = Math.min((now - started) / 1250, 1);
      element.textContent = String(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) activeCounters.set(element, requestAnimationFrame(frame));
      else activeCounters.delete(element);
    };
    activeCounters.set(element, requestAnimationFrame(frame));
  }
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.07, rootMargin: '0px 0px -15px 0px' });
    revealElements.forEach((element) => observer.observe(element));
    document.documentElement.classList.add('js');
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { count(entry.target); counterObserver.unobserve(entry.target); }
      });
    }, { threshold: 0.7 });
    document.querySelectorAll('[data-counter]').forEach((element) => counterObserver.observe(element));
  } else revealElements.forEach((element) => element.classList.add('is-visible'));

  function applyMotionPreference() {
    if (reducedMotion.matches) {
      revealElements.forEach((element) => element.classList.add('is-visible'));
      activeCounters.forEach((frame, element) => { cancelAnimationFrame(frame); finishCounter(element); });
      activeCounters.clear();
      document.querySelectorAll('svg').forEach((svg) => svg.pauseAnimations?.());
    } else document.querySelectorAll('svg').forEach((svg) => svg.unpauseAnimations?.());
  }
  reducedMotion.addEventListener('change', applyMotionPreference);
  applyMotionPreference();
  document.querySelectorAll('[data-year]').forEach((element) => { element.textContent = String(new Date().getFullYear()); });
})();
