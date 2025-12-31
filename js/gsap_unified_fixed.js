// Always unlock scroll on each page load (safety)
// BUT keep scroll locked on pages that explicitly disable it (e.g. Home)
document.documentElement.style.overflow = "";
document.body.style.overflow = "";

if (window.gsap) {
  gsap.registerPlugin(window.ScrollTrigger, window.ScrambleTextPlugin, window.SplitText);
}

// ===============================
// DARK MODE TOGGLE (persist only)
// ===============================
(() => {
  const root = document.documentElement;
  const btn = document.querySelector(".theme-toggle");
  if (!btn) return;

  const icon = btn.querySelector(".theme-toggle__icon") || btn;

  const apply = (theme) => {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
      btn.setAttribute("aria-pressed", "true");
      btn.setAttribute("aria-label", "Disable dark mode");
      if (icon) icon.textContent = "☀";
    } else {
      root.removeAttribute("data-theme");
      btn.setAttribute("aria-pressed", "false");
      btn.setAttribute("aria-label", "Enable dark mode");
      if (icon) icon.textContent = "☾";
    }
  };

  // First visit: default to light.
  // Only apply dark if the user explicitly chose it before.
  const saved = localStorage.getItem("theme"); // "dark" | "light" | null
  apply(saved === "dark" ? "dark" : "light");

  btn.addEventListener("click", () => {
    const isDark = root.getAttribute("data-theme") === "dark";
    const next = isDark ? "light" : "dark";
    localStorage.setItem("theme", next);
    apply(next);
  });
})();

// ===============================
// PRELOADER (CINEMATIC SLOW + RUN ONCE PER SESSION)
// ===============================
(() => {
  const loader = document.querySelector(".preloader");
  if (!loader) return;

  // Run only once per session (no loader when coming back to Home)
  const KEY = "kuro_preloader_seen";
  const hasSeen = sessionStorage.getItem(KEY);

  if (hasSeen) {
    // Remove loader instantly + make site visible
    loader.remove();
    document.body.classList.remove("is-loading");

    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";

    // If you still fade-in your page via CSS (body.is-loading), force visible:
    gsap.set(["header", "main", "footer"], { opacity: 1 });

    return;
  }

  // Mark as seen right away (so going back to index won't show it again)
  sessionStorage.setItem(KEY, "1");

  const barFill = loader.querySelector(".preloader__barFill");
  const percentEl = loader.querySelector(".preloader__percent");

  let pulseTween = null;

  // "Cinematic" settings
  const MIN_SHOW = 5;  // minimum seconds the loader stays visible
  const HOLD_AT = 92;  // max % before real "load"

  // Lock scroll
  document.body.classList.add("is-loading");

  const state = { p: 0 };
  const setUI = () => {
    const v = Math.round(state.p);
    if (percentEl) percentEl.textContent = `${v}%`;
    if (barFill) barFill.style.width = `${v}%`;
  };

  const startTime = performance.now();

  // Cinematic progress timeline
  const progTL = gsap.timeline({ paused: true });
  progTL
    .to(state, { p: 55, duration: 3.5, ease: "power2.out", onUpdate: setUI })
    .to(state, { p: 80, duration: 4.5, ease: "power1.out", onUpdate: setUI })
    .to(state, { p: HOLD_AT, duration: 10, ease: "none", onUpdate: setUI });

  progTL.play(0);

  // Micro hold near HOLD_AT
  const holdTween = gsap.to(state, {
    p: HOLD_AT,
    duration: 9999,
    ease: "none",
    paused: true,
    onUpdate: setUI
  });

  progTL.eventCallback("onComplete", () => holdTween.play());

  const finish = () => {
    if (pulseTween) pulseTween.kill();

    progTL.pause();
    holdTween.pause();

    const outTL = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: () => {
        loader.remove();
        document.body.classList.remove("is-loading");

        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";

      }
    });

    outTL
      .to(state, { p: 100, duration: 1.4, ease: "power3.out", onUpdate: setUI })
      .to({}, { duration: 0.25 })
      .to(loader, { opacity: 0, duration: 1.1, ease: "power2.inOut" }, 0.1)
      .to(["header", "main", "footer"], { opacity: 1, duration: 1.2, ease: "power2.out" }, 0.2);
  };

  window.addEventListener("load", () => {
    const elapsed = (performance.now() - startTime) / 1000;
    const remaining = Math.max(0, MIN_SHOW - elapsed);

    // Optional: subtle bar pulse during waiting time
    if (barFill) {
      pulseTween = gsap.to(barFill, {
        opacity: 0.65,
        duration: 0.8,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });
    }
    gsap.delayedCall(remaining, finish);
  });
})();

// ===============================
// PAGE-TO-PAGE TRANSITIONS (ULTRA SAFE + SLOW)
// ===============================
(() => {
  try {
    if (typeof window.gsap === "undefined") return;

    const overlay = document.querySelector(".page-transition");
    if (!overlay) return;

    const mark = overlay.querySelector(".page-transition__mark");

    const KEY = "pt";

    const IN_DUR = 1.05;
    const OUT_DUR = 1.05;
    const HOLD_BEFORE_NAV = 0.12;
    const HOLD_ON_ARRIVAL = 0.25;

    // Reset safe state
    gsap.set(overlay, { yPercent: 100 });

    // -----------------------
    // OUT (on arrival)
    // -----------------------

    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";


    if (sessionStorage.getItem(KEY) === "1") {
      sessionStorage.removeItem(KEY);

      // Burger nav close
      try {
        const btn = document.querySelector(".nav-toggle");
        document.body.classList.remove("nav-open");
        if (btn) {
          btn.setAttribute("aria-expanded", "false");
          btn.setAttribute("aria-label", "Open menu");
        }
      } catch (_) { }

      // start covered
      gsap.set(overlay, { yPercent: 0 });

      gsap.delayedCall(HOLD_ON_ARRIVAL, () => {

        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";

        gsap.to(overlay, {
          yPercent: 100,
          duration: OUT_DUR,
          ease: "power3.inOut",
          onComplete: () => gsap.set(overlay, { yPercent: 100 })
        });

        if (mark) {
          gsap.fromTo(
            mark,
            { rotation: 0, scale: 0.9 },
            { rotation: 180, scale: 1, duration: IN_DUR, ease: "power2.inOut" }
          );
        }
      });
    }

    // -----------------------
    // IN (on click) — navigation guaranteed + failsafe unlock
    // -----------------------
    let transitioning = false;
    let navTimer = null;

    const isInternalLink = (a) => {
      const href = a.getAttribute("href");
      if (!href) return false;
      if (href.startsWith("#")) return false;
      if (href.startsWith("mailto:") || href.startsWith("tel:")) return false;
      if (a.target === "_blank") return false;

      // external?
      try {
        const url = new URL(a.href);
        if (url.origin !== window.location.origin) return false;
      } catch {
        return false;
      }

      return true;
    };

    const unlock = () => {
      transitioning = false;
      if (navTimer) {
        clearTimeout(navTimer);
        navTimer = null;
      }
      gsap.to(overlay, { yPercent: 100, duration: 0.8, ease: "power3.inOut" });
    };

    document.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a || !isInternalLink(a)) return;

      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const targetUrl = a.href;
      if (!targetUrl) return;

      // same page? -> do nothing
      if (targetUrl === window.location.href) return;

      // prevent spam
      if (transitioning) {
        e.preventDefault();
        return;
      }
      transitioning = true;

      // Burger button close
      try {
        const btn = document.querySelector(".nav-toggle");
        if (document.body.classList.contains("nav-open")) {
          document.body.classList.remove("nav-open");
          if (btn) {
            btn.setAttribute("aria-expanded", "false");
            btn.setAttribute("aria-label", "Open menu");
          }
        }
      } catch (_) { }

      e.preventDefault();

      sessionStorage.setItem(KEY, "1");

      gsap.killTweensOf(overlay);
      if (mark) gsap.killTweensOf(mark);

      gsap.set(overlay, { yPercent: 100 });

      gsap.to(overlay, {
        yPercent: 0,
        duration: IN_DUR,
        ease: "power3.inOut"
      });

      if (mark) {
        gsap.fromTo(
          mark,
          { rotation: 0 },
          { rotation: 180, duration: IN_DUR, ease: "power2.inOut" }
        );
      }

      // navigation guaranteed
      navTimer = window.setTimeout(() => {
        window.location.href = targetUrl;
      }, Math.round((IN_DUR + HOLD_BEFORE_NAV) * 1000));

      // failsafe: if after 5s we're still here, unlock
      window.setTimeout(() => {
        if (document.visibilityState === "visible") unlock();
      }, 5000);
    });

    // if user uses back/forward cache
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) {
        sessionStorage.removeItem(KEY);
        gsap.set(overlay, { yPercent: 100 });
        transitioning = false;
      }
    });

    // if the page is leaving, no need to keep lock
    window.addEventListener("pagehide", () => {
      transitioning = false;
      if (navTimer) clearTimeout(navTimer);
    });
  } catch (err) {
    // NEVER break the rest of the animations
    console.error("Page transition error:", err);
  }

  window.addEventListener("pagehide", () => {
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
  });

})();

// ===============================
// FORCE SCROLL TO TOP ON RELOAD
// ===============================

// Disable browser scroll restoration
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

// Force scroll to top immediately (before render)
window.scrollTo(0, 0);

// Force scroll to top again once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.scrollTo(0, 0);
});

// Force scroll to top on full load (images, fonts, etc.)
window.addEventListener("load", () => {
  window.scrollTo(0, 0);
});

// Reset scroll position before page unload (refresh / close)
window.addEventListener("beforeunload", () => {
  window.scrollTo(0, 0);
});

// ===============================
// CUSTOM CURSOR
// ===============================

const cursor = document.querySelector(".custom-cursor");

if (cursor) {
  gsap.set(cursor, { xPercent: -50, yPercent: -50 });

  window.addEventListener("mousemove", (e) => {
    gsap.to(cursor, {
      x: e.clientX,
      y: e.clientY,
      duration: 0.15,
      ease: "power3.out"
    });
  });

  const clickable = document.querySelectorAll(
    "a, button, .container, [role='button']"
  );

  clickable.forEach(el => {
    el.addEventListener("mouseenter", () => {
      cursor.classList.add("is-link");

      gsap.to(cursor, {
        scale: 1.6,
        duration: 0.2,
        ease: "power3.out"
      });
    });

    el.addEventListener("mouseleave", () => {
      cursor.classList.remove("is-link");

      gsap.to(cursor, {
        scale: 1,
        duration: 0.2,
        ease: "power3.out"
      });
    });

  });
}

// ===============================
// CONTACT TEXT BUTTON ANIMATION
// ===============================
(() => {
  const nextBtn = document.querySelector("#next");
  const textEl = document.querySelector(".contact-text");
  const emailLink = document.querySelector("#emailLink");
  if (!nextBtn || !textEl || !emailLink) return;

  if (typeof window.gsap === "undefined") {
    console.error("GSAP is not loaded.");
    return;
  }

  if (typeof window.ScrambleTextPlugin === "undefined") {
    console.error("ScrambleTextPlugin is not loaded.");
    return;
  }

  gsap.registerPlugin(ScrambleTextPlugin);

  const email = "kuromaeastudio@gmail.com";

  emailLink.href = "#";
  emailLink.style.pointerEvents = "none";

  nextBtn.addEventListener("click", () => {
    emailLink.style.pointerEvents = "none";

    gsap.to(textEl, {
      scrambleText: {
        text: email,
        chars: "upperAndLowerCase",
        revealDelay: 0.2,
        tweenLength: true
      },
      ease: "power2.inOut",
      overwrite: "auto",
      duration: 1.6,

      onComplete: () => {
        textEl.textContent = email;
        emailLink.href = `mailto:${email}`;
        emailLink.style.pointerEvents = "auto";
      }
    });
  });
})();

// ===============================
// SCROLL INDICATOR ARROW
// ===============================
(() => {
  const arrow = document.querySelector(".scroll-arrow");
  if (!arrow) return;

  gsap.timeline({ repeat: -1 })
    .fromTo(
      arrow,
      { y: 0, opacity: 0.4 },
      { y: 14, opacity: 1, duration: 0.7, ease: "power3.out" }
    )
    .to(arrow, {
      y: 0,
      opacity: 0.4,
      duration: 0.7,
      ease: "power3.in"
    });
})();

const scrollIndicator = document.querySelector(".scroll-indicator");

if (scrollIndicator) {
  window.addEventListener("scroll", () => {
    gsap.to(scrollIndicator, {
      autoAlpha: window.scrollY > 20 ? 0 : 1,
      duration: 0.3,
      ease: "power2.out"
    });
  });
}

// ===============================
// HOVER: HEADER NAV LINKS (Home/Work/About/Contact)
// ===============================
(() => {
  const navLinks = gsap.utils.toArray(".navigation-bar a");
  if (!navLinks.length) return;

  navLinks.forEach((link) => {
    link.addEventListener("mouseenter", () => {
      gsap.to(link, { color: "var(--blue-color)", duration: 0.25, ease: "power2.out" });
    });

    link.addEventListener("mouseleave", () => {
      gsap.to(link, { color: "var(--black-color)", duration: 0.25, ease: "power2.out" });
    });
  });
})();

// ===============================
// HOVER: WORK TEXT
// ===============================
// gsap.utils.toArray(".work-item").forEach((item) => {
//   const text = item.querySelector(".work-text");
//   if (!text) return;
//
//   item.addEventListener("mouseenter", () => {
//     gsap.to(text, {
//       color: "var(--blue-color)",
//       duration: 0.3,
//       ease: "power2.out"
//     });
//   });
//
//   item.addEventListener("mouseleave", () => {
//     gsap.to(text, {
//       color: "var(--black-color)",
//       duration: 0.3,
//       ease: "power2.out"
//     });
//   });
// });

// ===============================
// HOVER: WORK ITEM → EMOJI BLUE + ROTATE 360° (SLOW) (FIX DARK MODE)
// ===============================
(() => {
  gsap.utils.toArray(".work-item").forEach((item) => {
    const emoji = item.querySelector(".work-emoji");
    if (!emoji) return;

    item.addEventListener("mouseenter", () => {
      gsap.to(emoji, {
        color: "var(--blue-color)",
        rotation: "+=360",
        scale: 1.1,
        duration: 0.5,
        ease: "power2.out",
        overwrite: "auto"
      });
    });

    item.addEventListener("mouseleave", () => {
      gsap.to(emoji, {
        color: "var(--black-color)",  // <-- becomes white in dark mode
        scale: 1,
        duration: 0.5,
        ease: "power2.out",
        overwrite: "auto"
      });
    });
  });
})();


// ===============================
// HOVER: SOCIAL LEFT / RIGHT + FOOTER (FIX DARK MODE)
// ===============================
(() => {
  const targets = gsap.utils.toArray(
    ".social-left, .social-right, .social-left a, .social-right a, .footer-content a"
  );

  if (!targets.length) return;

  targets.forEach((el) => {
    el.addEventListener("mouseenter", () => {
      gsap.to(el, {
        color: "var(--blue-color)",
        duration: 0.25,
        ease: "power2.out"
      });
    });

    el.addEventListener("mouseleave", () => {
      gsap.to(el, {
        color: "var(--black-color)",
        duration: 0.25,
        ease: "power2.out"
      });
    });
  });
})();

// ===============================
// GSAP SPLIT TEXT (SAFE)
// ===============================
(() => {
  const container = document.querySelector(".splitText-container");
  const lines = document.querySelectorAll(".line");

  if (!container || !lines.length) return;
  if (typeof SplitText === "undefined") return;

  gsap.set(container, { visibility: "visible" });

  const splitLines = Array.from(lines).map(line =>
    new SplitText(line, { type: "chars", charsClass: "char" })
  );

  const width = window.innerWidth;
  const depth = -width / 8;
  const transformOrigin = `50% 50% ${depth}`;

  gsap.set(lines, { perspective: 700, transformStyle: "preserve-3d" });

  const animTime = 0.9;
  const tl = gsap.timeline({ repeat: -1 });

  splitLines.forEach((split, index) => {
    tl.fromTo(
      split.chars,
      { rotationX: -90 },
      { rotationX: 90, stagger: 0.08, duration: animTime, ease: "none", transformOrigin },
      index * 0.45
    );
  });
})();

// ===============================
// GSAP CURSOR TRACKING (responsive-safe)
// ===============================
(() => {
  const items = gsap.utils.toArray(".work-item");
  if (!items.length) return;

  const mm = gsap.matchMedia();

  // --- MOBILE / TOUCH: disable & cleanup
  mm.add("(max-width: 820px), (hover: none), (pointer: coarse)", () => {
    const images = gsap.utils.toArray(".work-item img.swipeimage");

    // Clean up everything GSAP may have set inline
    images.forEach((img) => {
      gsap.set(img, { clearProps: "x,y,xPercent,yPercent,opacity,visibility,transform" });
    });

    // Optional: if you want to ensure they remain visible on mobile
    // images.forEach((img) => gsap.set(img, { autoAlpha: 1 }));

    // Auto cleanup when leaving this mode
    return () => {
      images.forEach((img) => {
        gsap.set(img, { clearProps: "x,y,xPercent,yPercent,opacity,visibility,transform" });
      });
    };
  });

  // --- DESKTOP / HOVER: enable tracking
  mm.add("(min-width: 821px) and (hover: hover) and (pointer: fine)", () => {
    const images = items
      .map((el) => el.querySelector("img.swipeimage"))
      .filter(Boolean);

    if (!images.length) return;

    gsap.set(images, { xPercent: -50, yPercent: -50 });

    let firstEnter = false;
    const cleanups = [];

    items.forEach((el) => {
      const image = el.querySelector("img.swipeimage");
      if (!image) return;

      const setX = gsap.quickTo(image, "x", { duration: 0.35, ease: "power3" });
      const setY = gsap.quickTo(image, "y", { duration: 0.35, ease: "power3" });

      const align = (e) => {
        if (firstEnter) {
          setX(e.clientX, e.clientX);
          setY(e.clientY, e.clientY);
          firstEnter = false;
        } else {
          setX(e.clientX);
          setY(e.clientY);
        }
      };

      const startFollow = () => document.addEventListener("mousemove", align);
      const stopFollow = () => document.removeEventListener("mousemove", align);

      const fade = gsap.to(image, {
        autoAlpha: 1,
        ease: "none",
        paused: true,
        duration: 0.1,
        onReverseComplete: stopFollow,
      });

      const onEnter = (e) => {
        firstEnter = true;
        fade.play();
        startFollow();
        align(e);
      };

      const onLeave = () => {
        fade.reverse();
      };

      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);

      // Store cleanups for this work-item
      cleanups.push(() => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
        stopFollow();
        fade.kill();
        gsap.set(image, { clearProps: "x,y,xPercent,yPercent,opacity,visibility,transform" });
      });
    });

    // Auto cleanup when switching back to mobile
    return () => {
      cleanups.forEach((fn) => fn());
    };
  });
})();

// ===============================
// GSAP 3D CURSOR
// ===============================
(() => {
  const main = document.querySelector("main");
  const outer = document.querySelector(".logo-outer");
  const inner = document.querySelector(".logo");

  if (!main || !outer || !inner) return;

  gsap.set(main, { perspective: 650 });

  const outerRX = gsap.quickTo(outer, "rotationX", { ease: "power3" });
  const outerRY = gsap.quickTo(outer, "rotationY", { ease: "power3" });
  const innerX = gsap.quickTo(inner, "x", { ease: "power3" });
  const innerY = gsap.quickTo(inner, "y", { ease: "power3" });

  main.addEventListener("pointermove", (e) => {
    outerRX(gsap.utils.interpolate(15, -15, e.y / window.innerHeight));
    outerRY(gsap.utils.interpolate(-15, 15, e.x / window.innerWidth));
    innerX(gsap.utils.interpolate(-30, 30, e.x / window.innerWidth));
    innerY(gsap.utils.interpolate(-30, 30, e.y / window.innerHeight));
  });

  main.addEventListener("pointerleave", () => {
    outerRX(0); outerRY(0); innerX(0); innerY(0);
  });
})();

// ===============================
// GSAP SCROLL TRIGGER
// ===============================
(() => {
  (() => {
    // ---------------------------------
    // Header / Footer: show-hide on scroll (MOBILE FRIENDLY)
    // ---------------------------------
    const header = document.querySelector(".header-container");
    const footer = document.querySelector(".footer-wrapper");

    const isScrollable = () =>
      document.documentElement.scrollHeight > window.innerHeight + 2;

    // Footer initial mode (kept from your logic)
    const applyFooterMode = () => {
      if (!footer) return;

      if (!isScrollable()) {
        gsap.set(footer, { bottom: 0 });
      } else {
        gsap.set(footer, { bottom: -120 });
      }
    };

    applyFooterMode();
    window.addEventListener("load", applyFooterMode);
    window.addEventListener("resize", applyFooterMode);

    // Home page: keep header/footer fixed (no hide/show animation)
    if (document.body.classList.contains("no-scroll-page")) {
      if (header) gsap.set(header, { yPercent: 0, clearProps: "transform" });
      if (footer) gsap.set(footer, { bottom: 0 });
      return;
    }


    if (header) {
      gsap.set(header, { yPercent: 0, willChange: "transform" });
    }

    const showHeader = header
      ? gsap.quickTo(header, "yPercent", { duration: 1, ease: "power2.out" })
      : null;

    const hideHeader = () => showHeader && showHeader(-110); // -110% hides regardless of header height
    const revealHeader = () => showHeader && showHeader(0);

    const setFooterBottom = footer
      ? gsap.quickTo(footer, "bottom", { duration: 0.6, ease: "power2.out" })
      : null;

    let lastY = window.scrollY;
    let ticking = false;
    let lastDir = 0; // 1 = down, -1 = up

    const updateChrome = () => {
      ticking = false;
      if (!isScrollable()) return;

      const y = window.scrollY;
      const delta = y - lastY;

      if (document.body.classList.contains("nav-open")) {
        revealHeader();
        return;
      }

      if (y <= 10) {
        revealHeader();
        if (setFooterBottom) setFooterBottom(-120);
        lastY = y;
        lastDir = 0;
        return;
      }

      if (Math.abs(delta) < 2) return;

      const dir = delta > 0 ? 1 : -1;

      if (dir !== lastDir) {
        lastDir = dir;

        if (dir === 1) {
          hideHeader();
          if (setFooterBottom) setFooterBottom(0);
        } else {
          revealHeader();
          if (setFooterBottom) setFooterBottom(-120);
        }
      }

      lastY = y;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(updateChrome);
        }
      },
      { passive: true }
    );

    // ABOUT + scrolltrigger parts require the plugin
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    // About Text
    gsap.registerPlugin(ScrollTrigger);

    const aboutTextSection = document.querySelector(".js-about-text");
    if (aboutTextSection) {
      const lines = aboutTextSection.querySelectorAll(".text");

      gsap.set(lines, { backgroundSize: "0% 100%" });

      gsap.to(lines, {
        backgroundSize: "100% 100%",
        ease: "power2.out",
        duration: 1,
        stagger: 0.16,
        scrollTrigger: {
          trigger: aboutTextSection,
          start: "top 30%",
          once: true,
          invalidateOnRefresh: true,
          toggleActions: "play none none none",
          // markers: true,
        }
      });

    }

    // About card
    gsap.utils.toArray(".js-profile-card").forEach((card) => {
      const img = card.querySelector(".profile-card__img");
      const content = card.querySelector(".profile-card__content");

      gsap.set(card, { opacity: 0, y: 40 });
      if (img) gsap.set(img, { x: -30, opacity: 0 });
      if (content) gsap.set(content, { x: 30, opacity: 0 });

      gsap.timeline({
        scrollTrigger: {
          trigger: card,
          start: "top 70%",
          end: "+=260",
          scrub: true,
          invalidateOnRefresh: true,
          once: true,
          // markers: true,
        },
      })
        .to(card, { opacity: 1, y: 0, ease: "none" }, 0)
        .to(img, { x: 0, opacity: 1, ease: "none" }, 0)
        .to(content, { x: 0, opacity: 1, ease: "none" }, 0);
      // .to(img, { filter: "grayscale(0%)", ease: "none" }, 0);
    });

    window.addEventListener("load", () => {
      ScrollTrigger.refresh();
      gsap.delayedCall(0.25, () => ScrollTrigger.refresh());
    });
  })();
})();

// ===============================
// RESPONSIVE BURGER NAV
// ===============================
(() => {
  const btn = document.querySelector(".nav-toggle");
  const menuList = document.querySelector("#nav-menu");
  const nav = document.querySelector(".navigation-bar");
  const header = document.querySelector(".header-container");

  if (!btn || !menuList || !nav || !header) return;

  const mqMobile = window.matchMedia("(max-width: 820px)");

  const placeNavForViewport = () => {
    if (mqMobile.matches) {
      // Mobile: detach from header -> append to body (prevents fixed+transform bug)
      if (nav.parentNode !== document.body) document.body.appendChild(nav);
    } else {
      // Desktop: restore nav inside header (your CSS expects it there)
      if (nav.parentNode !== header) header.appendChild(nav);

      // Safety: ensure mobile overlay state isn't stuck on desktop
      document.body.classList.remove("nav-open");
      btn.setAttribute("aria-expanded", "false");
    }
  };

  placeNavForViewport();
  if (mqMobile.addEventListener) mqMobile.addEventListener("change", placeNavForViewport);
  else mqMobile.addListener(placeNavForViewport); // Safari fallback

  const setOpen = (open) => {
    // Only toggle overlay on mobile
    if (!mqMobile.matches) return;

    document.body.classList.toggle("nav-open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  btn.addEventListener("click", () => {
    placeNavForViewport(); // make sure it's in the right place first
    setOpen(!document.body.classList.contains("nav-open"));
  });

  // Close when clicking a link
  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });

  // Close on ESC
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
})();

if (document.body.classList.contains("no-scroll-page")) {
  window.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });
  window.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
}
