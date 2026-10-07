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
    return;
  }
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.16 });
  revealItems.forEach((item) => observer.observe(item));
})();
