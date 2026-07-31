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

// Click-and-drag horizontal scroll for the Selected Work row
const workGrid = document.querySelector('.work-grid');
if (workGrid) {
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  workGrid.addEventListener('mousedown', (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = workGrid.scrollLeft;
    workGrid.classList.add('is-dragging');
  });

  window.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    workGrid.classList.remove('is-dragging');
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const dx = e.pageX - startX;
    if (Math.abs(dx) > 4) moved = true;
    workGrid.scrollLeft = startScroll - dx;
  });

  // Suppress the click on a card if the pointer actually dragged
  workGrid.addEventListener(
    'click',
    (e) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true
  );
}
