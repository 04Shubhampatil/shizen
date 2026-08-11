/* ===================================================================
   SHIZEN - Interactions, Navigation, Counters, Lightbox
   =================================================================== */

(function () {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const navbar = $("#navbar");
  const scrollProgress = $("#scrollProgress");
  const hamburger = $("#hamburger");
  const navPanel = $("#navPanel");
  const navLinks = $("#navLinks");
  const navCta = $(".nav-cta");
  const menuBackdrop = $("#menuBackdrop");
  const heroParticles = $("#heroParticles");
  const locName = $("#locName");
  const yearEl = $("#year");

  const syncScrollState = () => {
    const y = window.scrollY;
    navbar?.classList.toggle("scrolled", y > 40);

    if (scrollProgress) {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docH > 0 ? (y / docH) * 100 : 0;
      scrollProgress.style.width = `${pct}%`;
    }
  };

  window.addEventListener("scroll", syncScrollState, { passive: true });
  syncScrollState();

  const state = {
    menuOpen: false,
    lightboxOpen: false,
  };

  let closeLightbox = () => {};
  let restoreMenuFocus = null;
  let restoreLightboxFocus = null;

  const syncBodyLock = () => {
    document.body.classList.toggle("menu-open", state.menuOpen);
    document.body.style.overflow = state.menuOpen || state.lightboxOpen ? "hidden" : "";
  };

  const getFocusable = (root) =>
    $$(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      root
    ).filter((el) => !el.hidden && el.offsetParent !== null);

  const closeMenu = () => {
    if (!hamburger || !navLinks) return;
    state.menuOpen = false;
    hamburger.classList.remove("active");
    navPanel?.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.setAttribute("aria-label", "Open menu");
    if (menuBackdrop) menuBackdrop.hidden = true;
    syncBodyLock();
    restoreMenuFocus?.focus({ preventScroll: true });
  };

  const openMenu = () => {
    if (!hamburger || !navPanel) return;
    state.menuOpen = true;
    restoreMenuFocus = document.activeElement instanceof HTMLElement ? document.activeElement : hamburger;
    hamburger.classList.add("active");
    navPanel.classList.add("open");
    hamburger.setAttribute("aria-expanded", "true");
    hamburger.setAttribute("aria-label", "Close menu");
    if (menuBackdrop) menuBackdrop.hidden = false;
    syncBodyLock();
    const firstLink = $(".nav-link", navPanel);
    firstLink?.focus({ preventScroll: true });
  };

  hamburger?.addEventListener("click", () => {
    if (state.menuOpen) closeMenu();
    else openMenu();
  });

  menuBackdrop?.addEventListener("click", closeMenu);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Tab" || !state.menuOpen || !navPanel) return;
    const focusables = getFocusable(navPanel);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const closeOnEscape = (event) => {
    if (event.key === "Escape") {
      if (state.lightboxOpen) {
        closeLightbox();
        return;
      }
      if (state.menuOpen) closeMenu();
    }
  };

  document.addEventListener("keydown", closeOnEscape);

  $$(".nav-panel a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;

      const target = $(href);
      if (!target) return;

      event.preventDefault();
      const offset = 76;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  });

  const revealEls = $$(".reveal");
  const revealNow = (el) => el.classList.add("visible");

  if (prefersReducedMotion) {
    revealEls.forEach(revealNow);
  } else {
    const revealIO = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const delay = el.dataset.delay ? (parseInt(el.dataset.delay, 10) - 1) * 120 : 0;
          window.setTimeout(() => el.classList.add("visible"), delay);
          observer.unobserve(el);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => revealIO.observe(el));
  }

  const counters = $$("[data-count]");

  const setCounterFinal = (el) => {
    const target = Number.parseFloat(el.dataset.count || "0");
    const suffix = el.dataset.suffix || "";
    const value = Number.isInteger(target) ? String(target) : target.toFixed(1);
    el.textContent = `${value}${suffix}`;
  };

  const animateCount = (el) => {
    const target = Number.parseFloat(el.dataset.count || "0");
    const suffix = el.dataset.suffix || "";
    const isDecimal = !Number.isInteger(target);
    const duration = 1800;
    const start = performance.now();
    const parent = el.closest(".stat-item, .impact-stat");

    parent?.classList.add("is-counted");
    el.textContent = "0";

    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const raw = target * eased;
      const value = isDecimal ? raw.toFixed(1) : Math.round(raw);
      el.textContent = `${value}${suffix}`;

      if (t < 1) {
        requestAnimationFrame(step);
        return;
      }

      setCounterFinal(el);
    };

    requestAnimationFrame(step);
  };

  if (prefersReducedMotion) {
    counters.forEach((el) => {
      setCounterFinal(el);
      el.closest(".stat-item, .impact-stat")?.classList.add("is-counted");
    });
  } else {
    const counterIO = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach((el) => counterIO.observe(el));
  }

  if (heroParticles && !prefersReducedMotion) {
    const particleCount = window.innerWidth < 900 ? 0 : 10;
    for (let i = 0; i < particleCount; i += 1) {
      const particle = document.createElement("span");
      particle.className = "particle";
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.bottom = `${Math.random() * 20}%`;
      particle.style.animationDuration = `${9 + Math.random() * 10}s`;
      particle.style.animationDelay = `${Math.random() * 8}s`;
      particle.style.opacity = `${0.25 + Math.random() * 0.4}`;
      particle.style.transform = `scale(${0.5 + Math.random()})`;
      heroParticles.appendChild(particle);
    }
  }

  if (locName && !prefersReducedMotion && window.innerWidth >= 900) {
    const locations = [
      "Borneo Rainforest, Indonesia",
      "Great Barrier Reef, Australia",
      "Amazon Basin, Brazil",
      "Arctic Tundra, Norway",
      "Serengeti Plains, Tanzania",
      "Himalayan Foothills, Nepal",
    ];

    let index = 0;
    window.setInterval(() => {
      locName.style.opacity = "0";
      locName.style.transform = "translateY(-4px)";
      window.setTimeout(() => {
        index = (index + 1) % locations.length;
        locName.textContent = locations[index];
        locName.style.opacity = "1";
        locName.style.transform = "translateY(0)";
      }, 350);
    }, 3800);
  }

  $$(".acc-item").forEach((item) => {
    const header = $(".acc-header", item);
    const body = $(".acc-body", item);

    header?.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");

      $$(".acc-item").forEach((other) => {
        other.classList.remove("open");
        const otherBody = $(".acc-body", other);
        const otherHeader = $(".acc-header", other);
        if (otherBody) otherBody.style.maxHeight = null;
        otherHeader?.setAttribute("aria-expanded", "false");
      });

      if (!isOpen && body) {
        item.classList.add("open");
        body.style.maxHeight = `${body.scrollHeight}px`;
        header.setAttribute("aria-expanded", "true");
      }
    });
  });

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateField = (field) => {
    const value = field.value.trim();
    let valid = true;

    if (field.required && !value) {
      valid = false;
    } else if (field.type === "email" && value && !emailRe.test(value)) {
      valid = false;
    }

    field.classList.toggle("invalid", !valid);
    return valid;
  };

  const contactForm = $("#contactForm");
  const contactStatus = $("#contactStatus");

  contactForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const fields = $$("input, textarea, select", contactForm);
    const valid = fields.every((field) => validateField(field));

    if (!valid) {
      if (contactStatus) {
        contactStatus.textContent = "Please complete all fields with a valid email.";
        contactStatus.className = "form-status error";
      }
      return;
    }

    if (contactStatus) {
      contactStatus.textContent = "Thank you - your message has been received. We'll be in touch soon.";
      contactStatus.className = "form-status success";
    }
    contactForm.reset();
  });

  if (contactForm) {
    $$("input, textarea, select", contactForm).forEach((field) => {
      field.addEventListener("blur", () => validateField(field));
      field.addEventListener("input", () => field.classList.remove("invalid"));
    });
  }

  const setupNewsletter = (formId, inputId, statusId) => {
    const form = $(`#${formId}`);
    const input = $(`#${inputId}`);
    const status = $(`#${statusId}`);

    if (!form || !input || !status) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = input.value.trim();

      if (!emailRe.test(value)) {
        input.classList.add("invalid");
        status.textContent = "Please enter a valid email address.";
        status.className = "nl-status error";
        return;
      }

      input.classList.remove("invalid");
      status.textContent = "You're subscribed. Welcome to the Shizen community.";
      status.className = "nl-status success";
      form.reset();
    });

    input.addEventListener("input", () => input.classList.remove("invalid"));
  };

  setupNewsletter("newsletterForm", "nlEmail", "nlStatus");
  setupNewsletter("footerNL", "fnlEmail", "fnlStatus");

  const projectCards = $$(".project-card");
  if (!prefersReducedMotion) {
    const progressIO = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const bar = $(".progress-bar span", entry.target);
          if (bar) {
            const width = bar.style.width;
            bar.style.width = "0%";
            requestAnimationFrame(() => {
              window.setTimeout(() => {
                bar.style.width = width;
              }, 100);
            });
          }
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.3 }
    );
    projectCards.forEach((card) => progressIO.observe(card));
  }

  const sections = $$("main section[id]");
  const navLinkEls = $$(".nav-link");

  const navIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinkEls.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
        });
      });
    },
    { threshold: 0.35, rootMargin: "-80px 0px -50% 0px" }
  );
  sections.forEach((section) => navIO.observe(section));

  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ============ GALLERY LIGHTBOX ============ */
  const lightbox = $("#lightbox");
  const lightboxImage = $("#lightboxImage");
  const lightboxCaption = $("#lightboxCaption");
  const galleryItems = $$(".gallery-item");

  if (lightbox && lightboxImage && lightboxCaption && galleryItems.length) {
    const slides = galleryItems.map((item) => {
      const image = $("img", item);
      const figcaption = $("figcaption", item);
      const primary = figcaption ? $("span", figcaption)?.textContent?.trim() : "";
      const secondary = figcaption ? $(".cap-loc", figcaption)?.textContent?.trim() : "";

      item.tabIndex = 0;
      item.setAttribute("role", "button");
      item.setAttribute("aria-label", primary ? `Open image: ${primary}` : "Open image");

      return {
        src: image?.src || "",
        alt: image?.alt || primary || "Gallery image",
        caption: [primary, secondary].filter(Boolean).join(" · "),
      };
    });

    let currentIndex = 0;
    const renderSlide = (index) => {
      const slide = slides[index];
      if (!slide) return;
      lightboxImage.src = slide.src;
      lightboxImage.alt = slide.alt;
      lightboxCaption.textContent = slide.caption;
    };

    const openLightbox = (index) => {
      currentIndex = index;
      restoreLightboxFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      renderSlide(currentIndex);
      lightbox.hidden = false;
      lightbox.setAttribute("aria-hidden", "false");
      state.lightboxOpen = true;
      syncBodyLock();
      $(".lightbox-close", lightbox)?.focus({ preventScroll: true });
    };

    closeLightbox = () => {
      lightbox.hidden = true;
      lightbox.setAttribute("aria-hidden", "true");
      state.lightboxOpen = false;
      syncBodyLock();
      if (restoreLightboxFocus instanceof HTMLElement) {
        restoreLightboxFocus.focus({ preventScroll: true });
      }
    };

    const go = (delta) => {
      currentIndex = (currentIndex + delta + slides.length) % slides.length;
      renderSlide(currentIndex);
    };

    galleryItems.forEach((item, index) => {
      const open = () => openLightbox(index);
      item.addEventListener("click", open);
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      });
    });

    $(".lightbox-close", lightbox)?.addEventListener("click", closeLightbox);
    $(".lightbox-prev", lightbox)?.addEventListener("click", () => go(-1));
    $(".lightbox-next", lightbox)?.addEventListener("click", () => go(1));

    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (!state.lightboxOpen) return;
      if (event.key === "Tab") {
        const focusables = getFocusable(lightbox);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
    });

  }
})();
