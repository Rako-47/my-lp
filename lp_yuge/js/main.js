document.addEventListener('DOMContentLoaded', () => {
  // Explicit pointer feedback makes the pressed state reliable on mobile browsers.
  const pressTargets = document.querySelectorAll('.cta-block, .price-btn, .form-submit, .final-primary, .final-secondary, .sticky-primary, .sticky-secondary');
  pressTargets.forEach((target) => {
    const press = () => target.classList.add('is-pressed');
    const release = () => target.classList.remove('is-pressed');
    target.addEventListener('pointerdown', press);
    target.addEventListener('pointerup', release);
    target.addEventListener('pointercancel', release);
    target.addEventListener('pointerleave', release);
  });

  // Subtle scroll reveal for section content.
  // The class is added by JavaScript so the page remains fully visible if JS is unavailable.
  const revealTargets = [
    '.hero-copy',
    '.hero-cta-strip',
    '.concept-section',
    '.temperature-section .section-head',
    '.spec-mini',
    '.women-section .section-head',
    '.women-section > img',
    '.women-section > p',
    '.section-plans .section-head',
    '.price-card',
    '.coupon',
    '.reservation-section .section-head',
    '.reserve-notice',
    '#reserve-form',
    '.faq-section .section-head',
    '.faq-list',
    '.amenity-section .section-head',
    '.amenity-section > img',
    '.amenity-list',
    '.access-section .section-head',
    '.access-list',
    '.final-cta'
  ];

  const revealElements = document.querySelectorAll(revealTargets.join(', '));
  revealElements.forEach((element, index) => {
    element.classList.add('scroll-reveal');
    if (
      element.matches('.spec-mini, .price-card')
    ) {
      element.style.setProperty('--reveal-delay', `${Math.min(index % 3, 2) * 110}ms`);
    }
  });

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealElements.forEach((element) => element.classList.add('is-visible'));
  } else if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -8% 0px'
    });

    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add('is-visible'));
  }

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const id = link.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
});
