gsap.registerPlugin(ScrollTrigger);

// Preloader: block the page behind a full-screen cover until every image on
// it has actually finished loading, then fade the cover out. Only runs on a
// real page load (this script re-executes on every hard navigation, but the
// in-app router further down swaps <main> without reloading the script).
(function preload() {
  const el = document.getElementById('preloader');
  if (!el) return;
  const percentEl = el.querySelector('.preloader__percent');

  const finish = () => {
    el.classList.add('preloader--done');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
  };

  const imgs = Array.from(document.images);
  const total = imgs.length;
  if (total === 0) {
    finish();
    return;
  }

  let loaded = 0;
  const onProgress = () => {
    loaded += 1;
    if (percentEl) percentEl.textContent = `${Math.round((loaded / total) * 100)}%`;
    if (loaded >= total) finish();
  };

  imgs.forEach((img) => {
    if (img.complete) { onProgress(); return; }
    img.addEventListener('load', onProgress, { once: true });
    img.addEventListener('error', onProgress, { once: true });
  });

  // Don't hold the site hostage if one image stalls (slow network, dead link)
  setTimeout(finish, 8000);
})();

const EASE = 'power3.out';
const HOVER_EASE = 'elastic.out(0.5, 0.35)';
const HOVER_DURATION = 0.65;

const mainEl = document.querySelector('main');
const navItems = gsap.utils.toArray('.hero__nav-item');

function setNavOpacity(item, value) {
  gsap.to(item, { opacity: value, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
}

// Sets which nav item reads as active by matching the page path portion of
// its href (ignoring any #hash) against the given page path.
function setActiveNav(pagePath) {
  navItems.forEach((item) => {
    const itemPath = item.getAttribute('href').split('#')[0] || 'index.html';
    const isActive = itemPath === pagePath;
    item.classList.toggle('is-active', isActive);
    setNavOpacity(item, isActive ? 1 : 0.5);
  });
}

navItems.forEach((item) => {
  item.addEventListener('mouseenter', () => setNavOpacity(item, 1));
  item.addEventListener('mouseleave', () => {
    setNavOpacity(item, item.classList.contains('is-active') ? 1 : 0.5);
  });
});

// Reveal-on-load for everything outside <main> (the hero header, the case
// pages' back-nav) — this chrome is persistent and never swapped by the
// router below, so it only needs to animate in once.
const chromeReveals = Array.from(document.querySelectorAll('.reveal')).filter((el) => !mainEl.contains(el));
gsap.set(chromeReveals, { y: 24, opacity: 0 });
gsap.utils.toArray(chromeReveals).forEach((el, i) => {
  gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: 0.7,
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

// Footer hover fade + copy-to-clipboard — the footer lives outside <main>,
// so it's never swapped out and only needs to be wired up once.
gsap.utils.toArray('.links a').forEach((el) => {
  el.addEventListener('mouseenter', () => gsap.to(el, { opacity: 0.6, duration: 0.3, ease: 'power2.out', overwrite: 'auto' }));
  el.addEventListener('mouseleave', () => gsap.to(el, { opacity: 1, duration: 0.3, ease: 'power2.out', overwrite: 'auto' }));
});

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback for browsers/contexts without Clipboard API access
  const temp = document.createElement('textarea');
  temp.value = text;
  temp.style.position = 'fixed';
  temp.style.opacity = '0';
  document.body.appendChild(temp);
  temp.select();
  document.execCommand('copy');
  document.body.removeChild(temp);
  return Promise.resolve();
}

document.querySelectorAll('.link-copy').forEach((btn) => {
  const label = btn.dataset.label || btn.textContent;
  let resetTimer = null;

  btn.addEventListener('click', () => {
    copyText(btn.dataset.copy).finally(() => {
      btn.textContent = 'Copied!';
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => { btn.textContent = label; }, 1500);
    });
  });
});

// Selected Work row: no manual drag. The row itself scrolls natively
// (trackpad/wheel/touch); paging is done via the two edge buttons, which are
// real elements sitting on top of the row — no mouseup/click timing games,
// so a click on a card is just a click on a card.
function updateWorkEdges(grid, leftBtn, rightBtn) {
  const max = grid.scrollWidth - grid.clientWidth;
  leftBtn.classList.toggle('is-available', grid.scrollLeft > 1);
  rightBtn.classList.toggle('is-available', grid.scrollLeft < max - 1);
}

function initWorkGrid(root) {
  const grid = root.querySelector('.work-grid');
  const wrap = root.querySelector('.work-grid-wrap');
  const head = root.querySelector('#work .section__head');
  if (!grid || !wrap || !head) return;
  const leftBtn = wrap.querySelector('.work-edge--left');
  const rightBtn = wrap.querySelector('.work-edge--right');
  if (!leftBtn || !rightBtn) return;

  const refresh = () => updateWorkEdges(grid, leftBtn, rightBtn);
  refresh();
  grid.addEventListener('scroll', refresh);
  window.addEventListener('resize', refresh);

  // Just two resting points, per the Figma spec (node 658-19333): flush at
  // the start, or flush at the end — one click covers the whole distance
  // rather than stepping through intermediate cards. The end point lands
  // the last card's right edge flush on the "View All" container's own
  // edge; the row never renders wider than that edge (see .work-grid-wrap),
  // so this is always reachable regardless of viewport width.
  const page = (dir) => {
    const max = grid.scrollWidth - grid.clientWidth;
    let target;

    if (dir > 0) {
      const gridRect = grid.getBoundingClientRect();
      const boundaryWidth = head.getBoundingClientRect().right - gridRect.left;
      const cards = grid.querySelectorAll('.card');
      const lastCard = cards[cards.length - 1];
      const r = lastCard.getBoundingClientRect();
      const lastCardRight = r.left - gridRect.left + grid.scrollLeft + r.width;
      target = lastCardRight - boundaryWidth;
    } else {
      target = 0;
    }

    target = Math.min(max, Math.max(0, target));
    gsap.to(grid, {
      scrollLeft: target,
      duration: 0.6,
      ease: 'power3.out',
      overwrite: 'auto',
      onUpdate: refresh,
      onComplete: refresh,
    });
  };
  leftBtn.addEventListener('click', () => page(-1));
  rightBtn.addEventListener('click', () => page(1));
}

// Card hover: lift + shadow + image zoom, plus fade/caption reveal
// (Selected Work captions are always visible, so those two are skipped there)
// Modeled on jay.tel's card hover: a real spring (overshoot, small
// undershoot, settle) over ~0.65s on transform + a drop-shadow filter,
// rather than a plain ease-out — that oscillation is what reads as
// "snappy" instead of sluggish, even though the total duration is similar.
function initCards(root) {
  root.querySelectorAll('.card').forEach((card) => {
    const visual = card.querySelector('.card__visual');
    const fade = card.querySelector('.card__fade');
    const text = card.querySelector('.card__text');
    const captionsAlwaysOn = card.closest('.work-grid') !== null;

    // Animate straight to an explicit target on both enter and leave (instead
    // of playing/reversing one timeline) — reverse() replays at the position
    // the timeline was interrupted at, so a longer hover let it drift further
    // and made the return take longer. Two fixed-duration tweens always take
    // the same time regardless of how long the card was hovered.
    const setHover = (active) => {
      gsap.to(card, { y: active ? -8 : 0, scale: active ? 1.03 : 1, duration: HOVER_DURATION, ease: HOVER_EASE, overwrite: 'auto' });
      gsap.to(card, { '--shadow-o': active ? 0.45 : 0, duration: HOVER_DURATION * 0.7, ease: 'power1.out', overwrite: 'auto' });
      if (visual) gsap.to(visual, { scale: active ? 1.06 : 1, duration: HOVER_DURATION, ease: HOVER_EASE, overwrite: 'auto' });
      if (fade && !captionsAlwaysOn) gsap.to(fade, { opacity: active ? 1 : 0, duration: 0.35, ease: 'power1.out', overwrite: 'auto' });
      if (text && !captionsAlwaysOn) gsap.to(text, { opacity: active ? 1 : 0, y: active ? 0 : 10, duration: 0.35, ease: 'power1.out', overwrite: 'auto' });
    };

    card.addEventListener('mouseenter', () => setHover(true));
    card.addEventListener('mouseleave', () => setHover(false));
  });
}

// Case study pages: drag-to-reveal before/after comparison
function initCaseCompare(root) {
  root.querySelectorAll('.case-compare').forEach((el) => {
    const afterClip = el.querySelector('.case-compare__after-clip');
    const handle = el.querySelector('.case-compare__handle');
    const grip = el.querySelector('.case-compare__grip');
    if (!afterClip) return;

    const setSplit = (pct) => {
      const clamped = Math.min(96, Math.max(4, pct));
      // Clip the full-size wrapper, not the (smaller, offset) image itself —
      // the percentage here is relative to the wrapper's own box, which is
      // the whole comparison container, so it lines up with the handle/grip.
      afterClip.style.clipPath = `inset(0 0 0 ${clamped}%)`;
      if (handle) handle.style.left = `${clamped}%`;
      if (grip) grip.style.left = `${clamped}%`;
    };

    const updateFromClientX = (clientX) => {
      const rect = el.getBoundingClientRect();
      setSplit(((clientX - rect.left) / rect.width) * 100);
    };

    let dragging = false;
    el.addEventListener('mousedown', (e) => {
      dragging = true;
      updateFromClientX(e.clientX);
    });
    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      updateFromClientX(e.clientX);
    });
    window.addEventListener('mouseup', () => { dragging = false; });

    el.addEventListener('touchstart', (e) => updateFromClientX(e.touches[0].clientX), { passive: true });
    el.addEventListener('touchmove', (e) => updateFromClientX(e.touches[0].clientX), { passive: true });
  });
}

// Everything below lives inside <main> and needs to be re-run every time the
// in-app router (further down) swaps <main> for another page's content.
let mainTriggers = [];

function initMain() {
  // Tear down triggers left over from the outgoing page before wiring up
  // the new one, so nothing keeps pointing at detached elements.
  mainTriggers.forEach((t) => t.kill());
  mainTriggers = [];

  const reveals = mainEl.querySelectorAll('.reveal');
  gsap.set(reveals, { y: 24, opacity: 0 });
  gsap.utils.toArray(reveals).forEach((el, i) => {
    const tween = gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: EASE,
      delay: (i % 6) * 0.06,
      overwrite: 'auto',
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        once: true,
      },
    });
    if (tween.scrollTrigger) mainTriggers.push(tween.scrollTrigger);
  });

  // In-page anchor highlighting (e.g. #work on the homepage)
  navItems.forEach((item) => {
    const href = item.getAttribute('href');
    const hash = href.split('#')[1];
    if (!hash) return;
    const section = mainEl.querySelector(`#${hash}`);
    if (!section) return;
    mainTriggers.push(
      ScrollTrigger.create({
        trigger: section,
        start: 'top center',
        end: 'bottom center',
        onToggle: (self) => {
          if (!self.isActive) return;
          setActiveNav(href.split('#')[0] || 'index.html');
        },
      })
    );
  });

  mainEl.querySelectorAll('.section__all').forEach((el) => {
    el.addEventListener('mouseenter', () => gsap.to(el, { opacity: 0.6, duration: 0.3, ease: 'power2.out', overwrite: 'auto' }));
    el.addEventListener('mouseleave', () => gsap.to(el, { opacity: 1, duration: 0.3, ease: 'power2.out', overwrite: 'auto' }));
  });

  initCards(mainEl);
  initWorkGrid(mainEl);
  initCaseCompare(mainEl);

  // <main>'s content (and therefore document height) just changed — recompute
  // trigger positions instead of trusting whatever was measured before.
  ScrollTrigger.refresh();
}

initMain();

// ---- In-app router for the hero nav tabs (Projects / About / Experience) ----
// Swaps <main> instead of doing a full page load, so the header/footer never
// unmount and the page doesn't jump back to the hero on every tab switch.
function normalizedPath(path) {
  const file = path.split('/').pop();
  return file === '' ? 'index.html' : file;
}

async function loadPage(pagePath, { push = true } = {}) {
  let html;
  try {
    const res = await fetch(pagePath);
    if (!res.ok) throw new Error('bad response');
    html = await res.text();
  } catch {
    window.location.href = pagePath; // fall back to a real navigation
    return;
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const newMain = doc.querySelector('main');
  if (!newMain) {
    window.location.href = pagePath;
    return;
  }

  const apply = () => {
    mainEl.innerHTML = newMain.innerHTML;
    mainEl.className = newMain.className;
    document.title = doc.title;
    setActiveNav(pagePath);
    initMain();
    // Deliberately no scroll adjustment — stay exactly where the click
    // happened instead of yanking the viewport to the new content's top.
  };

  if (document.startViewTransition) {
    document.startViewTransition(apply);
  } else {
    apply();
  }

  if (push) history.pushState({ pagePath }, '', pagePath);
}

document.addEventListener('click', (e) => {
  const link = e.target.closest('.hero__nav-item');
  if (!link) return;

  const href = link.getAttribute('href');
  const targetPath = normalizedPath(href.split('#')[0] || 'index.html');
  if (targetPath === normalizedPath(location.pathname)) return; // already on this page — let the browser handle any in-page anchor

  e.preventDefault();
  loadPage(targetPath);
});

window.addEventListener('popstate', () => {
  loadPage(normalizedPath(location.pathname), { push: false });
});
