import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Landing page motion. Deliberately restrained.
 *
 *  - Nothing travels more than ~24px. Large movement reads as a slideshow.
 *  - `power2.out` only — no bounce, no elastic, no overshoot.
 *  - Scroll reveals fire at 85% of viewport height, so text has settled
 *    before it is close enough to read.
 *  - Honours prefers-reduced-motion by not animating at all.
 *
 * ── Why this is defensive ────────────────────────────────────────────
 * `gsap.from()` paints its start state (opacity 0) the instant it is
 * created and relies on the ticker to bring content back. Anything that
 * interrupts the tween — a starved rAF, a StrictMode remount landing
 * mid-flight, a killed context — leaves that element permanently
 * invisible. This bit the hero CTA, pill row and scroll cue in practice:
 * the undelayed tweens completed, the delayed ones did not.
 *
 * Three independent guarantees now prevent a blank hero:
 *   1. Motion only starts once a real animation frame has fired.
 *   2. Every tween clears its own inline styles on completion.
 *   3. A watchdog force-reveals anything still hidden after 2.5s, using
 *      plain DOM writes so it works even if GSAP itself is wedged.
 *
 * Landing page only. Dashboards have no motion by design — clinical
 * screens should not animate while someone is reading them.
 * ─────────────────────────────────────────────────────────────────────
 */

const ANIM_SELECTOR = '[data-anim]';

/** Strip any inline state, without depending on GSAP being healthy. */
function forceReveal(root = document) {
  root.querySelectorAll(ANIM_SELECTOR).forEach((el) => {
    const s = el.style;
    s.removeProperty('opacity');
    s.removeProperty('transform');
    s.removeProperty('translate');
    s.removeProperty('rotate');
    s.removeProperty('scale');
    s.removeProperty('visibility');
  });
}

export function useLandingAnimations(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      forceReveal();
      return;
    }

    let ctx;
    let disposed = false;

    /* Guarantee 3 — scoped to the hero, which animates on load and must be
       readable within a second. Below-fold sections are deliberately excluded:
       they are supposed to still be hidden at this point, waiting for their
       scroll trigger. Revealing those early would defeat the effect rather
       than rescue it. */
    const watchdog = setTimeout(() => {
      if (disposed) return;
      const hero = document.querySelector('.hero-landing-container');
      if (!hero) return;
      const stuck = [...hero.querySelectorAll(ANIM_SELECTOR)]
        .filter((el) => parseFloat(getComputedStyle(el).opacity) < 0.99);
      if (!stuck.length) return;
      console.warn(`[Wellora] ${stuck.length} hero element(s) never resolved — revealing`);
      forceReveal(hero);
    }, 2500);

    // Guarantee 1 — only animate once we know frames are actually running.
    const frame = requestAnimationFrame(() => {
      if (disposed) return;

      ctx = gsap.context(() => {
        /* Guarantee 2 — `set` + `to`, never `from`.
           A `from()` tween stores its start state and re-applies it whenever
           GSAP re-renders the tween, which `ScrollTrigger.refresh()` does.
           That is what pulled the hero headline back to opacity 0.19 after a
           scroll: the animation had finished, then a refresh rewound it. A
           `to()` tween only ever moves toward the end state, and clearProps
           removes the inline styles afterwards so a later refresh has nothing
           left to act on. */
        const heroTargets = [
          '[data-anim="hero-title"]', '[data-anim="hero-sub"]',
          '[data-anim="hero-cta"]', '[data-anim="hero-pill"]',
        ];
        gsap.set(heroTargets, { opacity: 0, y: 16 });

        const hero = gsap.timeline({
          defaults: { ease: 'power2.out', clearProps: 'opacity,transform' },
        });

        hero
          .to('[data-anim="hero-title"]', { opacity: 1, y: 0, duration: 0.8 })
          .to('[data-anim="hero-sub"]',   { opacity: 1, y: 0, duration: 0.7 }, '-=0.62')
          .to('[data-anim="hero-cta"]',   { opacity: 1, y: 0, duration: 0.6 }, '-=0.5')
          .to('[data-anim="hero-pill"]',  { opacity: 1, y: 0, duration: 0.5, stagger: 0.07 }, '-=0.42');

        /* Hero background parallax. The photograph is a fixed body
           background, so it moves via background-position rather than
           transform. 8% of travel across a viewport — depth, not motion. */
        gsap.to('body', {
          backgroundPositionY: '8%',
          ease: 'none',
          scrollTrigger: {
            trigger: '.hero-landing-container',
            start: 'top top',
            end: 'bottom top',
            scrub: 0.6,
          },
        });

        /* Sections: fade and short rise on entry — same set/to pattern, for
           the same reason. `once: true` means each section reveals a single
           time and then keeps its natural styles. */
        gsap.utils.toArray('[data-anim="section"]').forEach((section) => {
          const found = section.querySelectorAll('[data-anim="rise"]');
          const targets = found.length ? Array.from(found) : [section];
          gsap.set(targets, { opacity: 0, y: 24 });
          gsap.to(targets, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power2.out',
            stagger: 0.08,
            clearProps: 'opacity,transform',
            scrollTrigger: { trigger: section, start: 'top 85%', once: true },
          });
        });
      });

      if (document.fonts?.ready) {
        document.fonts.ready.then(() => !disposed && ScrollTrigger.refresh());
      }
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      clearTimeout(watchdog);
      ctx?.revert();
      // A remount must never leave the previous pass's start state painted.
      forceReveal();
    };
  }, [enabled]);
}
