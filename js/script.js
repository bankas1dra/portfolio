gsap.registerPlugin(ScrollTrigger);

const EASE = 'expo.out';

// Reveal-on-scroll for elements marked .reveal
gsap.set('.reveal', { y: 24 });
gsap.utils.toArray('.reveal').forEach((el, i) => {
  gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: EASE,
    delay: (i % 6) * 0.06,
    overwrite: 'auto',
    scrollTrigger: {
      trigger: el,
      start: 'top 88%',
      once: true,
    },
  });
});

// Highlight active nav item based on scrolled section
const navItems = gsap.utils.toArray('.hero__nav-item');

function setNavOpacity(item, value) {
  gsap.to(item, { opacity: value, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
}

navItems.forEach((item) => {
  item.addEventListener('mouseenter', () => setNavOpacity(item, 1));
  item.addEventListener('mouseleave', () => {
    setNavOpacity(item, item.classList.contains('is-active') ? 1 : 0.5);
  });

  const section = document.querySelector(item.getAttribute('href'));
  if (!section) return;
  ScrollTrigger.create({
    trigger: section,
    start: 'top center',
    end: 'bottom center',
    onToggle: (self) => {
      if (!self.isActive) return;
      navItems.forEach((other) => {
        const isActive = other === item;
        other.classList.toggle('is-active', isActive);
        setNavOpacity(other, isActive ? 1 : 0.5);
      });
    },
  });
});

// Section "View All" + footer links — simple hover fade
gsap.utils.toArray('.section__all, .links a').forEach((el) => {
  el.addEventListener('mouseenter', () => gsap.to(el, { opacity: 0.6, duration: 0.3, ease: 'power2.out', overwrite: 'auto' }));
  el.addEventListener('mouseleave', () => gsap.to(el, { opacity: 1, duration: 0.3, ease: 'power2.out', overwrite: 'auto' }));
});

// Card hover: lift + shadow + image zoom, plus fade/caption reveal
// (Selected Work captions are always visible, so those two are skipped there)
// A snappy spring-ish ease (slight overshoot, quick settle) instead of a
// plain ease-out reads much less sluggish for a fast hover interaction.
const HOVER_EASE = 'back.out(1.7)';

document.querySelectorAll('.card').forEach((card) => {
  const visual = card.querySelector('.card__visual');
  const fade = card.querySelector('.card__fade');
  const text = card.querySelector('.card__text');
  const captionsAlwaysOn = card.closest('.work-grid') !== null;

  const tl = gsap.timeline({ paused: true, defaults: { overwrite: 'auto' } });
  tl.to(card, { y: -6, duration: 0.45, ease: HOVER_EASE }, 0);
  // Only the shadow's alpha animates (offsets/blur stay fixed) — tweening a
  // single number is smooth; tweening the whole multi-value shadow string
  // is what caused the janky/jumpy hover before.
  tl.to(card, { '--shadow-o': 0.4, duration: 0.45, ease: HOVER_EASE }, 0);
  if (visual) tl.to(visual, { scale: 1.045, duration: 0.5, ease: HOVER_EASE }, 0);
  if (fade && !captionsAlwaysOn) tl.to(fade, { opacity: 1, duration: 0.35, ease: 'power1.out' }, 0);
  if (text && !captionsAlwaysOn) tl.to(text, { opacity: 1, y: 0, duration: 0.35, ease: 'power1.out' }, 0);

  card.addEventListener('mouseenter', () => tl.play());
  card.addEventListener('mouseleave', () => tl.reverse());
});

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
