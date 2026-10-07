(() => {
  const toast = document.querySelector('.toast');
  const closeToast = document.querySelector('.toast-close');
  let toastTimer;

  function showToast() {
    window.clearTimeout(toastTimer);
    toast.hidden = false;
    closeToast.focus();
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 3000);
  }

  document.querySelectorAll('[data-cta]:not([href])').forEach((button) => {
    button.addEventListener('click', showToast);
  });

  closeToast.addEventListener('click', () => { toast.hidden = true; });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') toast.hidden = true;
  });

  const tipButton = document.querySelector('.info-button');
  const tip = document.querySelector('#pack-tip');
  tipButton.addEventListener('click', () => {
    const willOpen = tip.hidden;
    tip.hidden = !willOpen;
    tipButton.setAttribute('aria-expanded', String(willOpen));
  });

  document.querySelectorAll('.accordion details').forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      document.querySelectorAll('.accordion details[open]').forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      });
    }, { threshold: 0.16 });
    revealItems.forEach((item) => observer.observe(item));
  }

  // --- GA4 Measurement (section_view & cta_click) ---
  if (!window.__ga4TrackingInitialized) {
    window.__ga4TrackingInitialized = true;

    function sendAnalyticsEvent(eventName, params) {
      if (typeof window.gtag === 'function') {
        try {
          window.gtag('event', eventName, params);
        } catch (e) {
          // Fail gracefully without breaking user actions
        }
      }
    }

    // 1. CTA Click Tracking
    const ctaConfigs = [
      { selector: '#cta-hero, [data-cta-location="hero"]', location: 'hero' },
      { selector: '#cta-final, [data-cta-location="final"]', location: 'final' }
    ];

    const boundCtaElements = new Set();
    ctaConfigs.forEach(({ selector, location }) => {
      document.querySelectorAll(selector).forEach((el) => {
        if (boundCtaElements.has(el)) return;
        boundCtaElements.add(el);

        el.addEventListener('click', () => {
          sendAnalyticsEvent('cta_click', { button_location: location });
        });
      });
    });

    // 2. Section Reach Tracking (section_view)
    const sectionTargets = [
      { id: 'hero-title', name: 'hero' },
      { id: 'detail-space-title', name: 'detail' },
      { id: 'purchase-title', name: 'cta' }
    ];

    const trackedSections = new Set();
    let sectionObserver = null;

    function getHeaderOffset() {
      const header = document.querySelector('.site-header');
      return header ? Math.ceil(header.getBoundingClientRect().height) : 70;
    }

    function checkActiveVisibility() {
      if (document.visibilityState !== 'visible') return;

      const headerHeight = getHeaderOffset();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const effectiveTop = headerHeight;
      const effectiveBottom = viewportHeight;

      sectionTargets.forEach(({ id, name }) => {
        if (trackedSections.has(name)) return;
        const el = document.getElementById(id);
        if (!el) return;

        const rect = el.getBoundingClientRect();
        if (rect.height === 0 || rect.width === 0) return;

        const visibleTop = Math.max(rect.top, effectiveTop);
        const visibleBottom = Math.min(rect.bottom, effectiveBottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);

        // Check if 50% or more of target element height is visible in effective area
        if (visibleHeight / rect.height >= 0.5) {
          trackedSections.add(name);
          sendAnalyticsEvent('section_view', { section_name: name });
          if (sectionObserver) {
            sectionObserver.unobserve(el);
          }
        }
      });
    }

    if ('IntersectionObserver' in window) {
      const headerHeight = getHeaderOffset();
      sectionObserver = new IntersectionObserver((entries) => {
        if (document.visibilityState !== 'visible') return;

        entries.forEach((entry) => {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.5) return;
          const targetId = entry.target.id;
          const matched = sectionTargets.find((item) => item.id === targetId);
          if (matched && !trackedSections.has(matched.name)) {
            trackedSections.add(matched.name);
            sendAnalyticsEvent('section_view', { section_name: matched.name });
            sectionObserver.unobserve(entry.target);
          }
        });
      }, {
        root: null,
        rootMargin: `-${headerHeight}px 0px 0px 0px`,
        threshold: [0.5]
      });

      sectionTargets.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el) sectionObserver.observe(el);
      });
    }

    // Ensure currently visible sections are recorded on load and tab reactivation
    checkActiveVisibility();
    window.addEventListener('scroll', checkActiveVisibility, { passive: true });
    window.addEventListener('resize', checkActiveVisibility, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkActiveVisibility();
      }
    });
  }
})();
