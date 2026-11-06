(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* Header */
  const header = document.querySelector(".site-header");
  const updateHeader = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  /* Mobile menu */
  const toggle = document.querySelector(".nav-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  const main = document.querySelector("main");
  const footer = document.querySelector(".site-footer");

  const setMenu = (open, focusToggle = false) => {
    if (!toggle || !mobileNav) return;
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    mobileNav.setAttribute("aria-hidden", String(!open));
    mobileNav.inert = !open;
    if (main) main.inert = open;
    if (footer) footer.inert = open;

    if (open) {
      const firstLink = mobileNav.querySelector("a");
      if (firstLink) window.setTimeout(() => firstLink.focus({ preventScroll: true }), 120);
    } else if (focusToggle) {
      toggle.focus({ preventScroll: true });
    }
  };

  if (mobileNav) {
    mobileNav.inert = true;
    mobileNav.setAttribute("aria-hidden", "true");
  }

  if (toggle && mobileNav) {
    toggle.addEventListener("click", () => {
      setMenu(!document.body.classList.contains("menu-open"));
    });

    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && document.body.classList.contains("menu-open")) {
        setMenu(false, true);
      }
    });

    window.matchMedia("(min-width: 961px)").addEventListener("change", (event) => {
      if (event.matches && document.body.classList.contains("menu-open")) {
        setMenu(false);
      }
    });
  }

  /* Reveal on scroll */
  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  /* ODS readout */
  const chips = Array.from(document.querySelectorAll(".ods-chip"));
  const readout = document.getElementById("ods-readout");
  const readoutDefault = readout ? readout.textContent : "";

  if (readout) {
    chips.forEach((chip) => {
      const show = () => {
        readout.textContent = chip.dataset.name || readoutDefault;
      };
      const reset = () => {
        readout.textContent = readoutDefault;
      };
      chip.addEventListener("mouseenter", show);
      chip.addEventListener("focus", show);
      chip.addEventListener("mouseleave", reset);
      chip.addEventListener("blur", reset);
    });
  }

  /* Accordion */
  const accordionItems = Array.from(document.querySelectorAll(".acc-item"));

  accordionItems.forEach((item) => {
    const button = item.querySelector(".acc-btn");
    const panel = item.querySelector(".acc-panel");
    if (!button || !panel) return;

    if (!item.classList.contains("is-open")) {
      panel.setAttribute("aria-hidden", "true");
    }

    button.addEventListener("click", () => {
      const willOpen = !item.classList.contains("is-open");

      accordionItems.forEach((other) => {
        other.classList.remove("is-open");
        const otherButton = other.querySelector(".acc-btn");
        const otherPanel = other.querySelector(".acc-panel");
        if (otherButton) otherButton.setAttribute("aria-expanded", "false");
        if (otherPanel) otherPanel.setAttribute("aria-hidden", "true");
      });

      if (willOpen) {
        item.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
        panel.setAttribute("aria-hidden", "false");
      }
    });
  });

  /* Carousel */
  const carousel = document.querySelector("[data-carousel]");

  if (carousel) {
    const slides = Array.from(carousel.querySelectorAll(".slide"));
    const thumbs = Array.from(carousel.querySelectorAll(".thumb"));
    const prevButton = carousel.querySelector(".carousel-btn--prev");
    const nextButton = carousel.querySelector(".carousel-btn--next");
    const pauseButton = carousel.querySelector(".carousel-btn--pause");
    const counter = carousel.querySelector(".carousel-counter");
    const live = carousel.querySelector(".carousel-live");
    const stage = carousel.querySelector(".carousel-stage");
    const strip = carousel.querySelector(".carousel-thumbs");
    const progressBar = carousel.querySelector(".carousel-progress-bar");
    const total = slides.length;
    const totalLabel = String(total).padStart(2, "0");
    const delay = 6800;

    carousel.querySelectorAll("img").forEach((image) => {
      image.draggable = false;
      image.decoding = "async";
    });

    carousel.addEventListener("dragstart", (event) => {
      if (event.target.closest(".slide")) event.preventDefault();
    });

    let current = 0;
    let timer = null;
    let userPaused = false;
    let inView = !("IntersectionObserver" in window);

    const pad = (value) => String(value).padStart(2, "0");
    const isReduced = () => reduceMotion.matches;

    const restartProgress = () => {
      carousel.classList.remove("is-playing");
      if (!progressBar) return;
      progressBar.style.animation = "none";
      void progressBar.offsetWidth;
      progressBar.style.animation = "";
    };

    const centerThumb = () => {
      const activeThumb = thumbs[current];
      if (!strip || !activeThumb) return;
      const stripRect = strip.getBoundingClientRect();
      const thumbRect = activeThumb.getBoundingClientRect();
      const target =
        strip.scrollLeft + (thumbRect.left - stripRect.left) - (strip.clientWidth - thumbRect.width) / 2;
      strip.scrollTo({
        left: Math.max(0, target),
        behavior: isReduced() ? "auto" : "smooth"
      });
    };

    const render = (announce = true) => {
      slides.forEach((slide, index) => {
        const active = index === current;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", String(!active));
      });

      thumbs.forEach((thumb, index) => {
        const active = index === current;
        thumb.classList.toggle("is-active", active);
        thumb.setAttribute("aria-current", active ? "true" : "false");
      });

      if (counter) counter.textContent = `${pad(current + 1)} / ${totalLabel}`;
      if (live && announce) live.textContent = `Diapositiva ${current + 1} de ${total}`;

      centerThumb();
    };

    const schedule = () => {
      window.clearTimeout(timer);
      restartProgress();
      const canPlay = !userPaused && !document.hidden && inView;
      carousel.classList.toggle("is-playing", canPlay);
      if (!canPlay) return;
      timer = window.setTimeout(() => {
        goTo(current + 1, false, "next");
      }, delay);
    };

    const goTo = (index, announce = true, direction = null) => {
      if (!total) return;
      const next = ((index % total) + total) % total;
      if (next === current) return;

      carousel.style.setProperty(
        "--enter-x",
        (direction || (next > current ? "next" : "prev")) === "prev" ? "-3.2%" : "3.2%"
      );

      current = next;
      render(announce);
      schedule();
    };

    if (prevButton) prevButton.addEventListener("click", () => goTo(current - 1, true, "prev"));
    if (nextButton) nextButton.addEventListener("click", () => goTo(current + 1, true, "next"));

    if (pauseButton) {
      pauseButton.addEventListener("click", () => {
        userPaused = !userPaused;
        carousel.classList.toggle("is-paused", userPaused);
        pauseButton.setAttribute("aria-pressed", String(userPaused));
        pauseButton.setAttribute(
          "aria-label",
          userPaused ? "Reanudar reproducción automática" : "Pausar reproducción automática"
        );
        schedule();
      });
    }

    thumbs.forEach((thumb, index) => {
      thumb.addEventListener("click", () => {
        goTo(index, true, index > current ? "next" : "prev");
      });
    });

    document.addEventListener("visibilitychange", schedule);

    if ("IntersectionObserver" in window) {
      const visibilityObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            inView = entry.isIntersecting;
            schedule();
          });
        },
        { threshold: 0.25 }
      );
      visibilityObserver.observe(carousel);
    }

    if (stage) {
      stage.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          goTo(current - 1, true, "prev");
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          goTo(current + 1, true, "next");
        }
      });

      let startX = null;
      let deltaX = 0;

      stage.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        startX = event.clientX;
        deltaX = 0;
      });

      stage.addEventListener("pointermove", (event) => {
        if (startX === null) return;
        deltaX = event.clientX - startX;
      });

      const endDrag = () => {
        if (startX !== null && Math.abs(deltaX) > 45) {
          const direction = deltaX < 0 ? "next" : "prev";
          goTo(current + (deltaX < 0 ? 1 : -1), true, direction);
        }
        startX = null;
        deltaX = 0;
      };

      stage.addEventListener("pointerup", endDrag);
      stage.addEventListener("pointercancel", () => {
        startX = null;
        deltaX = 0;
      });
    }

    render();
    schedule();
  }

  /* Year */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
