// Reveal-on-scroll for elements marked .reveal
const revealTargets = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
);

revealTargets.forEach((el, i) => {
  el.style.transitionDelay = `${Math.min(i % 6, 5) * 60}ms`;
  revealObserver.observe(el);
});

// Highlight active nav item based on scrolled section
const navItems = document.querySelectorAll('.hero__nav-item');
const sections = [...navItems]
  .map((item) => document.querySelector(item.getAttribute('href')))
  .filter(Boolean);

const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = `#${entry.target.id}`;
      navItems.forEach((item) => {
        item.classList.toggle('is-active', item.getAttribute('href') === id);
      });
    });
  },
  { threshold: 0.4 }
);

sections.forEach((section) => navObserver.observe(section));
