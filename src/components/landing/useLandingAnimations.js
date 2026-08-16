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
 * SAFETY: animations are opt-in on proof that animation is possible.
 * `gsap.from()` paints its start state — opacity 0 — the moment it is
 * created, and relies on the ticker to bring content back. If the ticker
 * never advances (starved rAF, headless browser, a throttled background
 * tab) the page is silently blank. So we wait for one real animation frame
 * before creating a single tween. If that frame never arrives, nothing is
 * ever hidden and the page renders as plain static HTML — the correct
 * failure mode for marketing copy.
 *
 * Landing page only. The dashboards have no motion by design: clinical
 * screens should not animate while someone is reading them.
 */
export function useLandingAnimations(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ctx;
    let disposed = false;

    // The liveness probe. Only inside this callback do we touch the DOM.
    const frame = requestAnimationFrame(() => {
      if (disposed) return;

      ctx = gsap.context(() => {
        /* ---- Hero: one staged entrance on load ---- */
        gsap.from('[data-anim="hero-title"]', {
          opacity: 0, y: 20, duration: 0.8, ease: 'power2.out',
        });
        gsap.from('[data-anim="hero-sub"]', {
          opacity: 0, y: 16, duration: 0.7, ease: 'power2.out', delay: 0.12,
        });
        gsap.from('[data-anim="hero-cta"]', {
          opacity: 0, y: 14, duration: 0.6, ease: 'power2.out', delay: 0.22,
        });
        gsap.from('[data-anim="hero-pill"]', {
          opacity: 0, y: 12, duration: 0.5, ease: 'power2.out', delay: 0.3, stagger: 0.07,
        });
        gsap.from('[data-anim="scroll-cue"]', {
          opacity: 0, duration: 0.6, ease: 'power1.out', delay: 0.6,
        });

        /* ---- Hero background: light parallax ----
           The photograph is a fixed body background, so it moves via
           background-position rather than transform. 8% of travel across a
           viewport — enough to read as depth, not enough to notice. */
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

        /* ---- Sections: fade and short rise on entry ---- */
        gsap.utils.toArray('[data-anim="section"]').forEach((section) => {
          const targets = section.querySelectorAll('[data-anim="rise"]');
          gsap.from(targets.length ? targets : section, {
            opacity: 0,
            y: 24,
            duration: 0.7,
            ease: 'power2.out',
            stagger: 0.08,
            scrollTrigger: { trigger: section, start: 'top 85%', once: true },
          });
        });
      });

      // ScrollTrigger measures on creation; late-loading fonts shift layout.
      if (document.fonts?.ready) {
        document.fonts.ready.then(() => !disposed && ScrollTrigger.refresh());
      }
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      ctx?.revert();
    };
  }, [enabled]);
}
