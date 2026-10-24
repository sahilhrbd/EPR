(() => {
  "use strict";
  document.documentElement.classList.add("js");

  const menu = document.querySelector("[data-mobile-menu]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const menuClosers = document.querySelectorAll("[data-menu-close]");
  const searchPanel = document.querySelector("#search-panel");
  const searchToggle = document.querySelector("[data-search-toggle]");
  let previousFocus = null;

  const closeMenu = () => {
    if (!menu || !menu.classList.contains("is-open")) return;
    menu.classList.remove("is-open");
    document.querySelector(".menu-scrim")?.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-label", "Open navigation menu");
    document.body.classList.remove("menu-open");
    previousFocus?.focus();
  };

  const openMenu = () => {
    if (!menu) return;
    previousFocus = document.activeElement;
    menu.classList.add("is-open");
    document.querySelector(".menu-scrim")?.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    menuToggle?.setAttribute("aria-expanded", "true");
    menuToggle?.setAttribute("aria-label", "Close navigation menu");
    document.body.classList.add("menu-open");
    menu.querySelector("a")?.focus({ preventScroll: true });
  };

  menuToggle?.addEventListener("click", () => {
    menu?.classList.contains("is-open") ? closeMenu() : openMenu();
  });
  menuClosers.forEach((button) => button.addEventListener("click", closeMenu));
  menu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

  const closeSearch = () => {
    if (!searchPanel || searchPanel.hidden) return;
    searchPanel.hidden = true;
    searchToggle?.setAttribute("aria-expanded", "false");
    searchToggle?.setAttribute("aria-label", "Open product search");
    document.body.classList.remove("search-open");
  };

  searchToggle?.addEventListener("click", () => {
    if (!searchPanel) return;
    const opening = searchPanel.hidden;
    searchPanel.hidden = !opening;
    searchToggle.setAttribute("aria-expanded", String(opening));
    searchToggle.setAttribute("aria-label", opening ? "Close product search" : "Open product search");
    document.body.classList.toggle("search-open", opening);
    if (opening) searchPanel.querySelector('input[type="search"]')?.focus();
  });

  document.addEventListener("click", (event) => {
    if (searchPanel && !searchPanel.hidden &&
        !searchPanel.contains(event.target) &&
        !searchToggle?.contains(event.target)) closeSearch();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      closeSearch();
    }

    if (event.key === "Tab" && menu?.classList.contains("is-open")) {
      const focusable = [...menu.querySelectorAll('a[href], button:not([disabled]), input:not([disabled])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  const gallery = document.querySelector("[data-gallery]");
  document.querySelector("[data-gallery-prev]")?.addEventListener("click", () => {
    gallery?.scrollBy({ left: -Math.max(280, gallery.clientWidth * 0.72), behavior: "smooth" });
  });
  document.querySelector("[data-gallery-next]")?.addEventListener("click", () => {
    gallery?.scrollBy({ left: Math.max(280, gallery.clientWidth * 0.72), behavior: "smooth" });
  });

  const revealItems = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const counters = document.querySelectorAll("[data-count]");
  const formatNumber = (value) => new Intl.NumberFormat("en").format(value);
  const animateCount = (element) => {
    const target = Number(element.dataset.count);
    const suffix = element.dataset.suffix || "";
    if (!Number.isFinite(target)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.textContent = formatNumber(target) + suffix;
      return;
    }
    const duration = 1300;
    const start = performance.now();
    const frame = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      element.textContent = formatNumber(Math.round(target * eased)) + suffix;
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  if ("IntersectionObserver" in window) {
    const countObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((counter) => countObserver.observe(counter));
  }

  document.querySelectorAll(".product-photo img, .hero-photo img, .story-photo img, .supply-image img")
    .forEach((image) => image.addEventListener("error", () => {
      image.closest("figure, .product-photo")?.classList.add("image-unavailable");
    }));

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
})();
