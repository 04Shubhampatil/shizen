/* ===================================================================
   SHIZEN — 自然 — Interactions & Animations
   =================================================================== */

(function () {
  "use strict";

  /* ============ HELPERS ============ */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ============ NAVBAR SCROLL STATE ============ */
  const navbar = $("#navbar");
  const scrollProgress = $("#scrollProgress");

  const onScroll = () => {
    const y = window.scrollY;
    if (y > 40) navbar.classList.add("scrolled");
    else navbar.classList.remove("scrolled");

    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docH > 0 ? (y / docH) * 100 : 0;
    scrollProgress.style.width = pct + "%";
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ============ MOBILE MENU ============ */
  const hamburger = $("#hamburger");
  const navLinks = $("#navLinks");
  const navCta = $(".nav-cta");

  const closeMenu = () => {
    hamburger.classList.remove("active");
    navLinks.classList.remove("open");
    if (navCta) navCta.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };

  hamburger.addEventListener("click", () => {
    const open = hamburger.classList.toggle("active");
    navLinks.classList.toggle("open", open);
    if (navCta) navCta.classList.toggle("open", open);
    hamburger.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  });

  $$(".nav-links a").forEach((a) => a.addEventListener("click", closeMenu));

  /* ============ SMOOTH SCROLL OFFSET ============ */
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (id === "#" || id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });

  /* ============ SCROLL REVEAL ============ */
  const revealEls = $$(".reveal");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = el.dataset.delay ? (parseInt(el.dataset.delay, 10) - 1) * 120 : 0;
          setTimeout(() => el.classList.add("visible"), delay);
          io.unobserve(el);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
  );
  revealEls.forEach((el) => io.observe(el));

  /* ============ ANIMATED COUNTERS ============ */
  const counters = $$("[data-count]");

  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const isDecimal = target % 1 !== 0;
    const duration = 1800;
    const start = performance.now();

    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = target * eased;
      el.textContent = (isDecimal ? val.toFixed(1) : Math.round(val)) + suffix;
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = (isDecimal ? target.toFixed(1) : target) + suffix;
    };
    requestAnimationFrame(step);
  };

  const counterIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          counterIO.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((c) => counterIO.observe(c));

  /* ============ HERO PARTICLES ============ */
  const particleContainer = $("#heroParticles");
  if (particleContainer) {
    const count = window.innerWidth < 600 ? 12 : 22;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      p.className = "particle";
      p.style.left = Math.random() * 100 + "%";
      p.style.bottom = Math.random() * 20 + "%";
      p.style.animationDuration = 9 + Math.random() * 10 + "s";
      p.style.animationDelay = Math.random() * 8 + "s";
      p.style.opacity = 0.25 + Math.random() * 0.4;
      p.style.transform = `scale(${0.5 + Math.random() * 1})`;
      particleContainer.appendChild(p);
    }
  }

  /* ============ HERO LOCATION ROTATION ============ */
  const locations = [
    "Borneo Rainforest, Indonesia",
    "Great Barrier Reef, Australia",
    "Amazon Basin, Brazil",
    "Arctic Tundra, Norway",
    "Serengeti Plains, Tanzania",
    "Himalayan Foothills, Nepal",
  ];
  const locName = $("#locName");
  if (locName) {
    let idx = 0;
    setInterval(() => {
      locName.style.opacity = "0";
      locName.style.transform = "translateY(-4px)";
      setTimeout(() => {
        idx = (idx + 1) % locations.length;
        locName.textContent = locations[idx];
        locName.style.opacity = "1";
        locName.style.transform = "translateY(0)";
      }, 400);
    }, 3800);
  }

  /* ============ FAQ ACCORDION ============ */
  $$(".acc-item").forEach((item) => {
    const header = $(".acc-header", item);
    const body = $(".acc-body", item);
    header.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      $$(".acc-item").forEach((other) => {
        other.classList.remove("open");
        $(".acc-body", other).style.maxHeight = null;
        $(".acc-header", other).setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("open");
        body.style.maxHeight = body.scrollHeight + "px";
        header.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ============ CONTACT FORM ============ */
  const contactForm = $("#contactForm");
  const contactStatus = $("#contactStatus");

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateField = (field) => {
    if (field.required && !field.value.trim()) {
      field.classList.add("invalid");
      return false;
    }
    if (field.type === "email" && !emailRe.test(field.value.trim())) {
      field.classList.add("invalid");
      return false;
    }
    field.classList.remove("invalid");
    return true;
  };

  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fields = $$("input, textarea", contactForm);
      let valid = true;
      fields.forEach((f) => { if (!validateField(f)) valid = false; });

      if (!valid) {
        contactStatus.textContent = "Please complete all fields with a valid email.";
        contactStatus.className = "form-status error";
        return;
      }
      contactStatus.textContent = "Thank you — your message has been received. We'll be in touch soon.";
      contactStatus.className = "form-status success";
      contactForm.reset();
    });

    $$("input, textarea", contactForm).forEach((f) => {
      f.addEventListener("blur", () => validateField(f));
      f.addEventListener("input", () => f.classList.remove("invalid"));
    });
  }

  /* ============ NEWSLETTER FORMS ============ */
  const setupNewsletter = (formId, inputId, statusId) => {
    const form = $("#" + formId);
    const input = $("#" + inputId);
    const status = $("#" + statusId);
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = input.value.trim();
      if (!emailRe.test(val)) {
        input.classList.add("invalid");
        status.textContent = "Please enter a valid email address.";
        status.className = status.className.replace("success", "") + " error";
        return;
      }
      input.classList.remove("invalid");
      status.textContent = "You're subscribed. Welcome to the Shizen community.";
      status.className = status.className.replace("error", "") + " success";
      form.reset();
    });

    input.addEventListener("input", () => input.classList.remove("invalid"));
  };

  setupNewsletter("newsletterForm", "nlEmail", "nlStatus");
  setupNewsletter("footerNL", "fnlEmail", "fnlStatus");

  /* ============ PARALLAX ON HERO ============ */
  const heroBg = $(".hero-bg");
  if (heroBg && window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      if (y < window.innerHeight) {
        heroBg.style.transform = `translateY(${y * 0.35}px) scale(1.1)`;
      }
    }, { passive: true });
  }

  /* ============ FOOTER YEAR ============ */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ============ ANIMATED PROGRESS BARS ============ */
  const projectCards = $$(".project-card");
  const progressIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const bar = $(".progress-bar span", entry.target);
          if (bar) {
            const w = bar.style.width;
            bar.style.width = "0%";
            requestAnimationFrame(() => {
              setTimeout(() => { bar.style.width = w; }, 100);
            });
          }
          progressIO.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );
  projectCards.forEach((c) => progressIO.observe(c));

  /* ============ ACTIVE NAV STATE ON SCROLL ============ */
  const sections = $$("main section[id]");
  const navLinkEls = $$(".nav-link");

  const navIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinkEls.forEach((link) => {
            link.classList.toggle("active", link.getAttribute("href") === "#" + id);
          });
        }
      });
    },
    { threshold: 0.35, rootMargin: "-80px 0px -50% 0px" }
  );
  sections.forEach((s) => navIO.observe(s));
})();
