import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowDown, ArrowUpRight, Ruler, CalendarClock, Scissors, PackageCheck,
  Sun, Moon, MapPin, Phone, Mail, Globe, Star,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { shop } from '../api/endpoints';
import { adaptStyle, placeholderFor } from '../api/adapters';

// ---------------------------------------------------------------------------
// The Atelier — a scroll-told landing page for the house's work.
//
// This is deliberately NOT the app homepage. The homepage is a working
// storefront (search, carousels, live data); this is the brand's front door:
// full-bleed, cinematic, editorial. It renders outside AppLayout (see
// App.js noLayoutPaths) so it fills the window with no app chrome.
//
// The app locks `body { overflow: hidden }` and scrolls inside inner
// containers, so this page carries its OWN full-viewport scroll container
// (.atl-root). Every scroll effect below reads that container's scrollTop, not
// window.scrollY, and the fixed nav / progress bar still anchor to the viewport
// because no ancestor is transformed.
//
// Colour comes from the palette CSS variables themeContext writes to :root
// (--primary, --heading, --mainBg, …), so light/dark reflows for free and the
// house gold stays jewelry — hairlines and accents, never a fill.
// ---------------------------------------------------------------------------

// A house look-book that stands on its own even with the API offline. Real
// styles, when they load, replace these; the deterministic placeholder art
// keeps the same tile for a given name so nothing shuffles between renders.
const DEFAULT_WORKS = [
  { name: 'Kente Evening Gown', category: 'Womenswear' },
  { name: 'Tailored Three-Piece', category: 'Menswear' },
  { name: 'Ceremonial Agbada', category: 'Ceremonial' },
  { name: 'Bridal Corset Gown', category: 'Bridal' },
  { name: 'Draped Kaba & Slit', category: 'Womenswear' },
  { name: 'Ankara Sport Blazer', category: 'Menswear' },
  { name: 'Hand-Pleated Skirt', category: 'Womenswear' },
  { name: 'Wool Topcoat', category: 'Outerwear' },
  { name: 'Silk Resort Kaftan', category: 'Resort' },
  { name: 'Structured Peak Suit', category: 'Menswear' },
  { name: 'Beaded Cocktail Dress', category: 'Occasion' },
  { name: 'Linen Safari Set', category: 'Resort' },
].map((w, i) => ({
  id: `default-${i}`,
  slug: null,
  name: w.name,
  category: w.category,
  image: placeholderFor(w.name, w.name),
}));

// Editorial bento — each tile gets a deliberate footprint so the grid reads as
// designed, not tiled. Cycles through big / tall / wide / square.
const BENTO_SPANS = ['big', 'tall', 'wide', 'sq', 'wide', 'tall', 'sq', 'big'];

// Horizontal rail deliberately mixes card shapes (tall, wide, square, grand) so
// the "works in different shapes and sizes" reads at a glance; cards sit on a
// shared baseline so the varied heights stagger.
const RAIL_SHAPES = ['tall', 'wide', 'sq', 'grand', 'wide', 'tall', 'grand', 'sq'];

const workHref = (w) => (w && w.slug ? `/styles/order/${w.slug}` : '/gallery');

// Fill a short list of real works up to a comfortable minimum with house
// samples, never repeating a name that already came from the API.
const padWorks = (list) => {
  if (list.length >= 10) return list;
  const have = new Set(list.map((w) => w.name));
  return [...list, ...DEFAULT_WORKS.filter((d) => !have.has(d.name))].slice(0, Math.max(10, list.length));
};

const Atelier = () => {
  const navigate = useNavigate();
  const { theme, updateTheme } = useTheme();
  const isDark = theme.mode === 'dark';

  const rootRef = useRef(null);
  const progressRef = useRef(null);
  const lookbookRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const [works, setWorks] = useState(DEFAULT_WORKS);
  const [quotes, setQuotes] = useState([]);

  const reduceMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  // Client's work. Most-viewed first, topped up with featured pieces; the page
  // renders fully on the house samples if either request fails.
  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      shop.styles({ ordering: '-views', page: 1 }),
      shop.styles({ featured: 'true', page: 1 }),
    ]).then((results) => {
      if (cancelled) return;
      const rows = [];
      results.forEach((r) => {
        if (r.status === 'fulfilled') rows.push(...(r.value?.results || []));
      });
      const seen = new Set();
      const mapped = rows
        .map(adaptStyle)
        .filter((m) => (m.slug && !seen.has(m.slug) ? seen.add(m.slug) : false));
      if (mapped.length) setWorks(padWorks(mapped));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // A real customer line for the pulled quote, when one exists.
  useEffect(() => {
    let cancelled = false;
    shop
      .latestReviews(6)
      .then((rows) => {
        if (!cancelled) setQuotes((rows || []).filter((r) => r.comment && r.comment.length > 24));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Reveal-on-scroll + progress bar + light parallax, all driven by the page's
  // own scroll container (not the window, which the app keeps overflow-hidden).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    root.scrollTop = 0;

    const reveals = Array.from(root.querySelectorAll('.atl-reveal'));
    let observer;
    if ('IntersectionObserver' in window && !reduceMotion) {
      observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('is-in');
              obs.unobserve(e.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -6% 0px' }
      );
      reveals.forEach((el) => observer.observe(el));
    } else {
      reveals.forEach((el) => el.classList.add('is-in'));
    }

    const parallax = reduceMotion ? [] : Array.from(root.querySelectorAll('[data-speed]'));
    const bar = progressRef.current;
    let ticking = false;
    const onScroll = () => {
      const y = root.scrollTop;
      setScrolled(y > 20);
      const max = root.scrollHeight - root.clientHeight;
      if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      if (reduceMotion || ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        parallax.forEach((el) => {
          const speed = parseFloat(el.getAttribute('data-speed')) || 0;
          el.style.transform = `translate3d(0, ${(y * speed).toFixed(1)}px, 0)`;
        });
        ticking = false;
      });
    };
    onScroll();
    root.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (observer) observer.disconnect();
      root.removeEventListener('scroll', onScroll);
    };
  }, [reduceMotion, works.length]);

  const toggleTheme = useCallback(
    () => updateTheme({ mode: isDark ? 'light' : 'dark', system: false }),
    [isDark, updateTheme]
  );

  const scrollToTop = useCallback(() => {
    rootRef.current?.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [reduceMotion]);

  const scrollToLookbook = useCallback(() => {
    lookbookRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }, [reduceMotion]);

  // Slices for the different treatments.
  const heroStack = works.slice(0, 2);
  const banners = works.slice(0, 3);
  const rail = works.length >= 8 ? works : padWorks(works);
  const bento = works.slice(0, 8);
  const ticker = works.length >= 6 ? works : padWorks(works);
  const quote = quotes[0];

  const year = new Date().getFullYear();

  const process = [
    { icon: CalendarClock, k: '01', title: 'Consultation', body: 'Book a fitting and talk through the occasion, the fabric, the silhouette you have in mind.', to: '/appointments/book' },
    { icon: Ruler, k: '02', title: 'Measured to you', body: 'Every commission begins with your own measurements — captured once, kept for every piece after.', to: '/measure' },
    { icon: Scissors, k: '03', title: 'Cut & crafted', body: 'Patterns drafted by hand, cloth cut and finished in the Accra atelier by our tailors.', to: '/gallery' },
    { icon: PackageCheck, k: '04', title: 'Delivered', body: 'A final fitting, the last adjustments, and your piece is yours — made for no one else.', to: '/orders' },
  ];

  const navLinks = [
    { label: 'Lookbook', onClick: scrollToLookbook },
    { label: 'Measure', onClick: () => navigate('/measure') },
    { label: 'Book a fitting', onClick: () => navigate('/appointments/book') },
    { label: 'Shop', onClick: () => navigate('/gallery') },
  ];

  return (
    <div className={`atl-root${reduceMotion ? ' atl-reduce' : ''}`} ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: ATELIER_CSS }} />

      {/* scroll progress — a hairline that also signals the page scrolls */}
      <div className="atl-progress" aria-hidden><span ref={progressRef} /></div>

      {/* ---------------------------------------------------------------- nav */}
      <header className={`atl-nav${scrolled ? ' is-scrolled' : ''}`}>
        <button className="atl-wordmark" onClick={scrollToTop}>
          <span className="atl-wordmark-name">SQUALLY<i className="atl-diamond" />LINE</span>
          <em>Atelier</em>
        </button>

        <nav className="atl-nav-links">
          {navLinks.map((l) => (
            <button key={l.label} onClick={l.onClick}><span>{l.label}</span></button>
          ))}
        </nav>

        <div className="atl-nav-right">
          <button className="atl-icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/')}>
            Enter the shop <ArrowRight size={15} />
          </button>
        </div>
      </header>

      {/* -------------------------------------------------------------- hero */}
      <section className="atl-hero">
        <div className="atl-hero-monogram" data-speed="0.16" aria-hidden>SL</div>
        <span className="atl-hero-side atl-hero-side-l" aria-hidden>EST. ACCRA</span>
        <span className="atl-hero-side atl-hero-side-r" aria-hidden>BESPOKE · {year}</span>

        <div className="atl-hero-inner">
          <div className="atl-hero-copy">
            <span className="atl-overline atl-reveal">
              <i className="atl-diamond" /> Bespoke tailoring &amp; ready-to-wear
            </span>
            <h1 className="atl-reveal" style={{ '--d': '90ms' }}>
              Cut for one.<br />Worn like <span className="atl-gold-underline">no one else.</span>
            </h1>
            <p className="atl-reveal" style={{ '--d': '180ms' }}>
              Squally Line is a house of measured clothing — every gown, suit and
              agbada drafted to a single body. Explore the work, then begin your own.
            </p>
            <div className="atl-hero-cta atl-reveal" style={{ '--d': '270ms' }}>
              <button className="btn btn-primary" onClick={scrollToLookbook}>
                View the lookbook <ArrowRight size={16} />
              </button>
              <button className="atl-btn-line" onClick={() => navigate('/appointments/book')}>
                Book a fitting
              </button>
            </div>
            <div className="atl-hero-stats atl-reveal" style={{ '--d': '360ms' }}>
              <div><b>12+</b><span>years cutting</span></div>
              <span className="atl-stat-div" />
              <div><b>2k+</b><span>pieces delivered</span></div>
              <span className="atl-stat-div" />
              <div><b>1:1</b><span>made to measure</span></div>
            </div>
          </div>

          {/* Editorial composition: an offset gold hairline frame behind a
              primary portrait, a smaller piece overlapping, a caption chip.
              Decorative — hidden on small screens. */}
          <div className="atl-hero-art atl-reveal" aria-hidden>
            <span className="atl-hero-frame" data-speed="0.05" />
            {heroStack[0] && (
              <figure className="atl-hero-card atl-hero-card-a" data-speed="-0.05">
                <img className="atl-clip" src={heroStack[0].image} alt="" loading="eager" decoding="async" draggable={false} />
              </figure>
            )}
            {heroStack[1] && (
              <figure className="atl-hero-card atl-hero-card-b" data-speed="0.07">
                <img className="atl-clip" style={{ '--cd': '160ms' }} src={heroStack[1].image} alt="" loading="eager" decoding="async" draggable={false} />
              </figure>
            )}
            <span className="atl-hero-chip">
              <Star size={12} fill="currentColor" /> Hand-finished in Ghana
            </span>
          </div>
        </div>

        <button className="atl-scrollcue" onClick={scrollToLookbook} aria-label="Scroll to work">
          <span>Scroll</span><ArrowDown size={14} />
        </button>
      </section>

      {/* ------------------------------------------------------------ marquee */}
      <div className="atl-marquee atl-marquee-words" aria-hidden>
        <div className="atl-marquee-track">
          {Array.from({ length: 2 }).map((_, dup) => (
            <div className="atl-marquee-set" key={dup}>
              {['Bespoke Tailoring', 'Made to Measure', 'Cut in Accra', 'Ready-to-Wear', 'Ceremonial', 'Bridal', 'Timeless'].map((w) => (
                <span key={w}>{w}<i className="atl-diamond" /></span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------------- statement */}
      <section className="atl-statement">
        <span className="atl-rule atl-reveal" />
        <p className="atl-reveal" style={{ '--d': '90ms' }}>
          We believe luxury is not loud. It is a shoulder that sits right, a hem
          that falls clean, a garment that remembers your measurements so the next
          one fits before the first fitting. <span className="atl-gold">Luxury in simplicity.</span>
        </p>
      </section>

      {/* ------------------------------------------------------ feature banners */}
      <section className="atl-banners">
        <div className="atl-overline atl-overline-block atl-reveal">
          <span className="atl-idx">01</span><i /> <span>Signatures</span>
        </div>
        {banners.map((w, i) => (
          <article
            key={w.id}
            className={`atl-banner atl-reveal ${i % 2 ? 'is-right' : 'is-left'}`}
            onClick={() => navigate(workHref(w))}
          >
            <div className="atl-banner-media atl-clip">
              <img src={w.image} alt={w.name} data-speed={i % 2 ? '-0.03' : '0.03'} loading="lazy" decoding="async" draggable={false} />
              <span className="atl-banner-no">{String(i + 1).padStart(2, '0')}</span>
            </div>
            <div className="atl-banner-copy">
              <span className="atl-overline"><i /> {w.category || 'Signature'}</span>
              <h2>{w.name}</h2>
              <p>
                {i === 0 && 'A house signature — structured through the body, fluid at the hem, made to a single measure.'}
                {i === 1 && 'Traditional cloth, modern line. Draped and finished by hand in the atelier.'}
                {i === 2 && 'For the occasion that asks for more. Commissioned, fitted, and yours alone.'}
              </p>
              <span className="atl-link">
                <span>{w.slug ? 'Commission this' : 'See the gallery'}</span> <ArrowRight size={16} />
              </span>
            </div>
          </article>
        ))}
      </section>

      {/* ------------------------------------------------- collection rail */}
      <section className="atl-rail-sec">
        <div className="atl-section-head atl-section-head-row atl-reveal">
          <div className="atl-overline"><span className="atl-idx">02</span><i /> <span>Selected Works</span></div>
          <p>A cross-section of shapes, cloths and occasions — drag or scroll through.</p>
        </div>
        <div className="atl-rail">
          {rail.map((w, i) => (
            <button
              key={`rail-${w.id}`}
              className={`atl-rail-card atl-rail-${RAIL_SHAPES[i % RAIL_SHAPES.length]}`}
              onClick={() => navigate(workHref(w))}
            >
              <img src={w.image} alt={w.name} loading="lazy" decoding="async" draggable={false} />
              <span className="atl-rail-cap">
                <b>{w.name}</b>
                {w.category && <em>{w.category}</em>}
              </span>
            </button>
          ))}
          <button className="atl-rail-end" onClick={() => navigate('/gallery')}>
            <ArrowUpRight size={26} />
            <span>See everything</span>
          </button>
        </div>
      </section>

      {/* ------------------------------------------------------------ lookbook */}
      <section className="atl-lookbook" ref={lookbookRef} id="lookbook">
        <div className="atl-section-head atl-reveal">
          <div className="atl-overline"><span className="atl-idx">03</span><i /> <span>The Lookbook</span></div>
          <h2>Recent work from the floor</h2>
          <p>A composed grid of what leaves the atelier — tap any piece to begin one like it.</p>
        </div>

        <div className="atl-bento">
          {bento.map((w, i) => (
            <button
              key={w.id}
              className={`atl-tile atl-tile-${BENTO_SPANS[i % BENTO_SPANS.length]} atl-reveal`}
              style={{ '--d': `${(i % 4) * 70}ms` }}
              onClick={() => navigate(workHref(w))}
            >
              <img src={w.image} alt={w.name} loading="lazy" decoding="async" draggable={false} />
              <span className="atl-tile-frame" />
              <span className="atl-tile-scrim" />
              <span className="atl-tile-no">{String(i + 1).padStart(2, '0')}</span>
              <span className="atl-tile-cap">
                <b>{w.name}</b>
                <span className="atl-tile-meta">
                  {w.category && <em>{w.category}</em>}
                  <i className="atl-tile-go"><ArrowUpRight size={15} /></i>
                </span>
              </span>
            </button>
          ))}
        </div>

        <div className="atl-lookbook-more atl-reveal">
          <button className="btn btn-ghost" onClick={() => navigate('/gallery')}>
            Open the full gallery <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* ----------------------------------------------------- image ticker */}
      <div className="atl-marquee atl-marquee-img" aria-hidden>
        <div className="atl-marquee-track atl-marquee-track-rev">
          {Array.from({ length: 2 }).map((_, dup) => (
            <div className="atl-marquee-set" key={dup}>
              {ticker.map((w) => (
                <figure key={`${dup}-${w.id}`}><img src={w.image} alt="" loading="lazy" decoding="async" draggable={false} /></figure>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- process */}
      <section className="atl-process">
        <div className="atl-section-head atl-reveal">
          <div className="atl-overline"><span className="atl-idx">04</span><i /> <span>The Commission</span></div>
          <h2>From first fitting to final stitch</h2>
        </div>
        <div className="atl-steps">
          {process.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={s.k}
                className="atl-step atl-reveal"
                style={{ '--d': `${i * 90}ms` }}
                onClick={() => navigate(s.to)}
              >
                <span className="atl-step-k">{s.k}</span>
                <Icon size={22} className="atl-step-icon" />
                <b>{s.title}</b>
                <p>{s.body}</p>
                <i className="atl-step-go"><ArrowRight size={15} /></i>
              </button>
            );
          })}
        </div>
      </section>

      {/* ---------------------------------------------------------- testimonial */}
      <section className="atl-quote">
        <div className="atl-quote-inner atl-reveal">
          <div className="atl-quote-mark" aria-hidden>&ldquo;</div>
          <blockquote>
            {quote
              ? quote.comment
              : 'They took one set of measurements and every piece since has fit like it was drawn on me. This is what tailoring is supposed to feel like.'}
          </blockquote>
          <div className="atl-quote-by">
            <span className="atl-quote-stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} fill="currentColor" />
              ))}
            </span>
            <b>{quote ? quote.user_name : 'A Squally Line client'}</b>
            {quote?.item_name && <em>on {quote.item_name}</em>}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- cta band */}
      <section className="atl-cta">
        <div className="atl-cta-inner atl-reveal">
          <span className="atl-overline atl-overline-center"><i /> Your commission <i /></span>
          <h2>Begin something made only for you</h2>
          <p>Book a fitting, save your measurements, and let the atelier take it from there.</p>
          <div className="atl-cta-buttons">
            <button className="btn btn-primary" onClick={() => navigate('/appointments/book')}>
              Book a fitting <ArrowRight size={16} />
            </button>
            <button className="atl-btn-line" onClick={() => navigate('/measure')}>
              Take my measurements
            </button>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- footer */}
      <footer className="atl-footer">
        <div className="atl-footer-top">
          <div className="atl-footer-brand">
            <div className="atl-wordmark atl-wordmark-static">
              <span className="atl-wordmark-name">SQUALLY<i className="atl-diamond" />LINE</span>
              <em>Clothing</em>
            </div>
            <p>Premium ready-to-wear and bespoke tailoring for those who value quality, craft, and a clean line.</p>
            <div className="atl-socials">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Social"><Globe size={17} /></a>
              <a href="mailto:hello@squallyline.com" aria-label="Email"><Mail size={17} /></a>
              <a href="tel:+233241234567" aria-label="Phone"><Phone size={17} /></a>
            </div>
          </div>

          <div className="atl-footer-col">
            <h4>Explore</h4>
            <button onClick={() => navigate('/gallery')}>Gallery</button>
            <button onClick={() => navigate('/products')}>Products</button>
            <button onClick={() => navigate('/categories')}>Categories</button>
            <button onClick={scrollToLookbook}>Lookbook</button>
          </div>

          <div className="atl-footer-col">
            <h4>Atelier</h4>
            <button onClick={() => navigate('/appointments/book')}>Book a fitting</button>
            <button onClick={() => navigate('/measure')}>Measurements</button>
            <button onClick={() => navigate('/appointments')}>My appointments</button>
            <button onClick={() => navigate('/')}>The shop</button>
          </div>

          <div className="atl-footer-col">
            <h4>Visit</h4>
            <span><MapPin size={13} /> 123 Fashion Avenue, Accra</span>
            <span><Phone size={13} /> +233 24 123 4567</span>
            <span><Mail size={13} /> hello@squallyline.com</span>
          </div>
        </div>
        <div className="atl-footer-bottom">
          <span>© {year} Squally-Line Clothing. Luxury in simplicity.</span>
          <button className="atl-footer-top-btn" onClick={scrollToTop}>Back to top <ArrowUpRight size={13} /></button>
        </div>
      </footer>
    </div>
  );
};

// All styling scoped under .atl-root, driven by the palette CSS variables so
// light/dark and the house gold come through with no per-node theming.
const ATELIER_CSS = `
.atl-root{
  position:relative;height:100dvh;overflow-y:auto;overflow-x:hidden;
  background:var(--mainBg);color:var(--text);
  font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  scroll-behavior:smooth;-webkit-overflow-scrolling:touch;
}
.atl-reduce{scroll-behavior:auto;}
.atl-root *{box-sizing:border-box;}
.atl-gold{color:var(--primary);}
.atl-gold-underline{position:relative;color:var(--heading);white-space:nowrap;}
.atl-gold-underline::after{content:"";position:absolute;left:0;right:0;bottom:.06em;height:2px;
  background:var(--primary);opacity:.85;}

/* diamond motif */
.atl-diamond{display:inline-block;width:5px;height:5px;margin:0 .5em;transform:rotate(45deg);
  background:var(--primary);vertical-align:middle;flex:0 0 auto;}

/* reveal */
.atl-reveal{opacity:0;transform:translateY(28px);
  transition:opacity 1s cubic-bezier(.16,1,.3,1),transform 1s cubic-bezier(.16,1,.3,1);
  transition-delay:var(--d,0ms);will-change:opacity,transform;}
.atl-reveal.is-in{opacity:1;transform:none;}
.atl-reduce .atl-reveal{opacity:1;transform:none;transition:none;}

/* clip-path image reveal (transform-free, so hover/parallax still work) */
.atl-clip{clip-path:inset(0 0 102% 0);
  transition:clip-path 1.1s cubic-bezier(.16,1,.3,1);transition-delay:var(--cd,60ms);}
.atl-reveal.is-in .atl-clip,.atl-hero-art.is-in .atl-clip{clip-path:inset(0 0 0 0);}
.atl-reduce .atl-clip{clip-path:none;transition:none;}

/* progress hairline */
.atl-progress{position:fixed;top:0;left:0;right:0;height:2px;z-index:70;background:transparent;pointer-events:none;}
.atl-progress span{display:block;height:100%;width:100%;transform:scaleX(0);transform-origin:left;
  background:linear-gradient(90deg,var(--primary),var(--primaryLight));}

/* overline / index label */
.atl-overline{display:inline-flex;align-items:center;gap:11px;
  color:var(--secondaryText);text-transform:uppercase;letter-spacing:.24em;
  font-size:11px;font-weight:800;}
.atl-overline i{display:inline-block;width:26px;height:1px;background:var(--borderMid);}
.atl-overline .atl-idx{font-family:Georgia,serif;font-size:14px;font-weight:700;letter-spacing:.04em;
  color:var(--primary);text-transform:none;}
.atl-overline-block{margin-bottom:clamp(20px,4vw,40px);}
.atl-overline-center{justify-content:center;color:var(--primary);}
.atl-overline-center i{width:20px;}

/* nav */
.atl-nav{position:fixed;top:0;left:0;right:0;z-index:60;
  display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding:18px clamp(16px,4vw,48px);
  transition:background .35s ease,border-color .35s ease,padding .35s ease,backdrop-filter .35s ease;
  border-bottom:1px solid transparent;}
.atl-nav.is-scrolled{
  background:color-mix(in srgb,var(--mainBg) 85%,transparent);
  backdrop-filter:blur(18px) saturate(150%);-webkit-backdrop-filter:blur(18px) saturate(150%);
  border-bottom-color:var(--border);padding-top:12px;padding-bottom:12px;}
.atl-wordmark{background:none;border:0;cursor:pointer;padding:0;text-align:left;
  display:flex;flex-direction:column;line-height:1;gap:5px;}
.atl-wordmark-name{font-family:Georgia,serif;font-weight:600;letter-spacing:.16em;font-size:16px;
  color:var(--heading);display:inline-flex;align-items:center;}
.atl-wordmark em{font-style:normal;font-size:9px;letter-spacing:.42em;
  color:var(--primary);text-transform:uppercase;font-weight:800;}
.atl-nav-links{display:flex;gap:2px;}
.atl-nav-links button{background:none;border:0;cursor:pointer;font:inherit;
  font-size:13px;font-weight:600;color:var(--secondaryText);
  padding:8px 15px;border-radius:999px;transition:color .2s ease;position:relative;}
.atl-nav-links button span{position:relative;}
.atl-nav-links button span::after{content:"";position:absolute;left:0;right:100%;bottom:-3px;height:1px;
  background:var(--primary);transition:right .3s cubic-bezier(.16,1,.3,1);}
.atl-nav-links button:hover{color:var(--heading);}
.atl-nav-links button:hover span::after{right:0;}
.atl-nav-right{display:flex;align-items:center;gap:10px;}
.atl-icon-btn{display:grid;place-items:center;width:37px;height:37px;border-radius:999px;
  border:1px solid var(--border);background:var(--surfaceL1);color:var(--text);cursor:pointer;
  transition:border-color .2s ease,color .2s ease,transform .2s ease;}
.atl-icon-btn:hover{border-color:var(--primary);color:var(--primary);transform:translateY(-1px);}

/* gold hairline button */
.atl-btn-line{display:inline-flex;align-items:center;justify-content:center;gap:8px;
  padding:12px 24px;border-radius:999px;cursor:pointer;font:inherit;font-size:14.5px;font-weight:600;
  letter-spacing:.02em;background:transparent;color:var(--heading);border:1px solid var(--borderMid);
  transition:border-color .2s ease,color .2s ease,transform .18s ease,background .2s ease;}
.atl-btn-line:hover{border-color:var(--primary);color:var(--primary);
  background:var(--primaryTint);transform:translateY(-2px);}

/* hero */
.atl-hero{position:relative;min-height:100dvh;display:flex;flex-direction:column;
  justify-content:center;padding:128px clamp(16px,4vw,48px) 92px;overflow:hidden;}
.atl-hero-monogram{position:absolute;right:-3vw;top:44%;transform:translateY(-50%);
  font-family:Georgia,serif;font-weight:900;font-size:clamp(240px,42vw,600px);line-height:1;
  color:var(--primary);opacity:.055;pointer-events:none;user-select:none;z-index:0;}
.atl-hero-side{position:absolute;top:50%;font-size:10px;font-weight:800;letter-spacing:.4em;
  text-transform:uppercase;color:var(--mutedText);white-space:nowrap;z-index:2;}
.atl-hero-side-l{left:clamp(14px,3vw,30px);transform:rotate(-90deg) translateX(50%);transform-origin:left center;}
.atl-hero-side-r{right:clamp(14px,3vw,30px);transform:rotate(90deg) translateX(-50%);transform-origin:right center;}
.atl-hero-inner{position:relative;z-index:3;width:100%;max-width:1280px;margin:0 auto;
  display:grid;grid-template-columns:1.02fr .98fr;gap:48px;align-items:center;}
.atl-hero-copy h1{font-family:Georgia,serif;font-weight:500;color:var(--heading);
  font-size:clamp(44px,7.2vw,92px);line-height:1.0;letter-spacing:-.022em;margin:22px 0 24px;}
.atl-hero-copy p{color:var(--secondaryText);font-size:clamp(15px,1.5vw,18px);line-height:1.72;
  max-width:520px;margin:0 0 32px;}
.atl-hero-cta{display:flex;flex-wrap:wrap;gap:12px;}
.atl-hero-stats{display:flex;align-items:center;gap:26px;margin-top:42px;padding-top:28px;
  border-top:1px solid var(--border);max-width:540px;}
.atl-stat-div{width:1px;height:34px;background:var(--border);}
.atl-hero-stats b{display:block;font-family:Georgia,serif;font-size:clamp(26px,3vw,32px);font-weight:500;color:var(--heading);}
.atl-hero-stats span:not(.atl-stat-div){font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:var(--mutedText);}

.atl-hero-art{position:relative;height:min(580px,66vh);}
.atl-hero-frame{position:absolute;left:8%;top:10%;width:56%;height:78%;
  border:1px solid var(--primary);opacity:.5;z-index:1;}
.atl-hero-card{position:absolute;margin:0;overflow:hidden;background:var(--surfaceL2);
  border:1px solid var(--borderMid);box-shadow:var(--shadowLg);}
.atl-hero-card img{width:100%;height:100%;object-fit:cover;display:block;
  transition:transform 1.2s cubic-bezier(.16,1,.3,1);}
.atl-hero-card-a{left:0;top:2%;width:58%;height:80%;z-index:2;}
.atl-hero-card-b{right:1%;bottom:1%;width:44%;height:52%;z-index:3;}
.atl-hero-art:hover .atl-hero-card img{transform:scale(1.03);}
.atl-hero-chip{position:absolute;left:2%;bottom:-2%;z-index:4;display:inline-flex;align-items:center;gap:7px;
  padding:9px 14px;background:color-mix(in srgb,var(--mainBg) 82%,transparent);
  backdrop-filter:blur(8px);border:1px solid var(--borderMid);color:var(--primary);
  font-size:11px;font-weight:800;letter-spacing:.06em;}

.atl-scrollcue{position:absolute;left:50%;bottom:24px;transform:translateX(-50%);z-index:4;
  display:inline-flex;flex-direction:column;align-items:center;gap:7px;background:none;border:0;cursor:pointer;
  color:var(--mutedText);font-size:10px;letter-spacing:.26em;text-transform:uppercase;font-weight:700;}
.atl-scrollcue svg{animation:atl-bob 1.9s ease-in-out infinite;color:var(--primary);}
@keyframes atl-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(6px)}}

/* marquee */
.atl-marquee{overflow:hidden;border-top:1px solid var(--border);border-bottom:1px solid var(--border);
  background:var(--surfaceL1);}
.atl-marquee-track{display:flex;width:max-content;animation:atl-scroll 46s linear infinite;}
.atl-marquee-track-rev{animation-direction:reverse;animation-duration:60s;}
.atl-marquee:hover .atl-marquee-track{animation-play-state:paused;}
.atl-marquee-set{display:flex;align-items:center;flex:0 0 auto;}
@keyframes atl-scroll{to{transform:translateX(-50%);}}
.atl-reduce .atl-marquee-track{animation:none;}
.atl-marquee-words .atl-marquee-set span{display:inline-flex;align-items:center;gap:26px;
  padding:17px 0;font-family:Georgia,serif;font-size:clamp(20px,2.6vw,34px);font-weight:500;
  color:var(--heading);white-space:nowrap;}
.atl-marquee-words .atl-marquee-set span .atl-diamond{width:6px;height:6px;margin:0 26px;opacity:.85;}
.atl-marquee-img{background:var(--mainBg);}
.atl-marquee-img .atl-marquee-set figure{flex:0 0 auto;margin:0;width:clamp(150px,20vw,240px);
  height:clamp(200px,26vw,320px);overflow:hidden;border-right:1px solid var(--border);}
.atl-marquee-img .atl-marquee-set figure img{width:100%;height:100%;object-fit:cover;display:block;
  transition:transform .7s ease;}
.atl-marquee-img:hover .atl-marquee-set figure img{transform:scale(1.05);}

/* statement */
.atl-statement{max-width:1040px;margin:0 auto;padding:clamp(84px,13vw,168px) clamp(20px,5vw,48px);
  display:flex;gap:30px;align-items:flex-start;}
.atl-statement .atl-rule{flex:0 0 auto;width:2px;align-self:stretch;min-height:130px;
  background:linear-gradient(var(--primary),transparent);opacity:.75;transform-origin:top;}
.atl-statement .atl-reveal.atl-rule{transform:scaleY(0);}
.atl-statement .atl-rule.is-in{transform:scaleY(1);transition:transform 1.1s cubic-bezier(.16,1,.3,1);}
.atl-statement p{margin:0;font-family:Georgia,serif;font-weight:500;color:var(--heading);
  font-size:clamp(23px,3.5vw,42px);line-height:1.3;letter-spacing:-.012em;}

/* feature banners */
.atl-banners{max-width:1280px;margin:0 auto;padding:0 clamp(16px,4vw,48px) clamp(60px,10vw,120px);
  display:flex;flex-direction:column;gap:clamp(30px,6vw,96px);}
.atl-banner{display:grid;grid-template-columns:1fr 1fr;gap:clamp(22px,4vw,60px);align-items:center;cursor:pointer;}
.atl-banner.is-right .atl-banner-media{order:2;}
.atl-banner-media{position:relative;overflow:hidden;aspect-ratio:4/3;
  border:1px solid var(--border);background:var(--surfaceL2);}
.atl-banner-media img{position:absolute;inset:-6% 0;width:100%;height:112%;object-fit:cover;display:block;
  transition:transform .8s cubic-bezier(.16,1,.3,1);}
.atl-banner:hover .atl-banner-media img{transform:scale(1.045);}
.atl-banner-no{position:absolute;top:14px;left:16px;font-family:Georgia,serif;font-size:15px;font-weight:700;
  color:#F7F3EC;letter-spacing:.05em;text-shadow:0 1px 10px rgba(0,0,0,.5);z-index:2;}
.atl-banner-copy h2{font-family:Georgia,serif;font-weight:500;color:var(--heading);
  font-size:clamp(27px,3.7vw,48px);line-height:1.05;margin:16px 0 14px;letter-spacing:-.012em;}
.atl-banner-copy p{color:var(--secondaryText);font-size:15px;line-height:1.72;margin:0 0 22px;max-width:440px;}
.atl-link{display:inline-flex;align-items:center;gap:10px;color:var(--heading);
  font-weight:700;font-size:13.5px;letter-spacing:.02em;}
.atl-link span{position:relative;}
.atl-link span::after{content:"";position:absolute;left:0;right:0;bottom:-3px;height:1px;
  background:var(--primary);transform:scaleX(0);transform-origin:left;transition:transform .3s cubic-bezier(.16,1,.3,1);}
.atl-link svg{color:var(--primary);transition:transform .25s ease;}
.atl-banner:hover .atl-link span::after{transform:scaleX(1);}
.atl-banner:hover .atl-link svg{transform:translateX(5px);}

/* section head */
.atl-section-head{max-width:1280px;margin:0 auto clamp(30px,5vw,56px);padding:0 clamp(16px,4vw,48px);
  text-align:center;display:flex;flex-direction:column;align-items:center;gap:16px;}
.atl-section-head h2{font-family:Georgia,serif;font-weight:500;color:var(--heading);
  font-size:clamp(29px,4.6vw,56px);line-height:1.04;letter-spacing:-.014em;margin:0;}
.atl-section-head p{margin:0;max-width:560px;color:var(--secondaryText);font-size:15px;line-height:1.62;}
.atl-section-head-row{flex-direction:row;justify-content:space-between;align-items:flex-end;text-align:left;flex-wrap:wrap;gap:12px;}
.atl-section-head-row p{max-width:360px;text-align:right;}

/* collection rail */
.atl-rail-sec{padding:clamp(56px,8vw,104px) 0;overflow:hidden;}
.atl-rail{display:flex;align-items:flex-end;gap:clamp(14px,2vw,24px);
  padding:8px clamp(16px,4vw,48px) 22px;overflow-x:auto;scroll-snap-type:x proximity;
  scrollbar-width:none;}
.atl-rail::-webkit-scrollbar{display:none;}
.atl-rail-card{flex:0 0 auto;position:relative;overflow:hidden;cursor:pointer;padding:0;
  border:1px solid var(--border);background:var(--surfaceL2);scroll-snap-align:center;}
.atl-rail-card img{width:100%;height:100%;object-fit:cover;display:block;
  transition:transform .8s cubic-bezier(.16,1,.3,1);}
.atl-rail-card:hover img{transform:scale(1.05);}
.atl-rail-cap{position:absolute;left:0;right:0;bottom:0;padding:16px 16px 14px;display:flex;flex-direction:column;gap:3px;
  background:linear-gradient(180deg,transparent,color-mix(in srgb,#0b0a08 80%,transparent));}
.atl-rail-cap b{color:#F7F3EC;font-family:Georgia,serif;font-weight:500;font-size:16px;line-height:1.15;
  text-shadow:0 1px 8px rgba(0,0,0,.45);}
.atl-rail-cap em{color:var(--primaryLight);font-style:normal;font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;}
.atl-rail-tall{width:clamp(220px,24vw,300px);height:clamp(320px,44vw,470px);}
.atl-rail-wide{width:clamp(320px,38vw,460px);height:clamp(230px,30vw,320px);}
.atl-rail-sq{width:clamp(280px,30vw,360px);height:clamp(280px,30vw,360px);}
.atl-rail-grand{width:clamp(300px,32vw,400px);height:clamp(380px,50vw,540px);}
.atl-rail-end{flex:0 0 auto;width:200px;height:300px;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:12px;cursor:pointer;
  border:1px dashed var(--borderMid);background:transparent;color:var(--secondaryText);
  font-size:13px;font-weight:700;letter-spacing:.02em;transition:border-color .25s ease,color .25s ease;scroll-snap-align:center;}
.atl-rail-end svg{color:var(--primary);}
.atl-rail-end:hover{border-color:var(--primary);color:var(--primary);}

/* lookbook bento */
.atl-lookbook{padding:clamp(60px,9vw,112px) 0;}
.atl-bento{max-width:1280px;margin:0 auto;padding:0 clamp(16px,4vw,48px);
  display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:clamp(150px,15vw,212px);
  grid-auto-flow:dense;gap:14px;}
.atl-tile{position:relative;overflow:hidden;cursor:pointer;padding:0;border:1px solid var(--border);background:var(--surfaceL2);}
.atl-tile img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .8s cubic-bezier(.16,1,.3,1);}
.atl-tile:hover img{transform:scale(1.06);}
.atl-tile-frame{position:absolute;inset:10px;border:1px solid rgba(247,243,236,.55);opacity:0;
  transition:opacity .35s ease,inset .35s ease;z-index:2;pointer-events:none;}
.atl-tile:hover .atl-tile-frame{opacity:1;inset:12px;}
.atl-tile-scrim{position:absolute;inset:0;
  background:linear-gradient(180deg,transparent 40%,color-mix(in srgb,#0b0a08 80%,transparent) 100%);}
.atl-tile-no{position:absolute;top:12px;left:14px;z-index:3;font-family:Georgia,serif;font-size:13px;font-weight:700;
  color:#F7F3EC;letter-spacing:.05em;text-shadow:0 1px 8px rgba(0,0,0,.5);}
.atl-tile-cap{position:absolute;left:0;right:0;bottom:0;padding:15px 16px;text-align:left;z-index:3;
  display:flex;flex-direction:column;gap:6px;}
.atl-tile-cap b{color:#F7F3EC;font-family:Georgia,serif;font-weight:500;font-size:16px;line-height:1.15;
  text-shadow:0 1px 8px rgba(0,0,0,.45);}
.atl-tile-meta{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.atl-tile-cap em{color:var(--primaryLight);font-style:normal;font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;}
.atl-tile-go{display:grid;place-items:center;width:26px;height:26px;border-radius:999px;
  border:1px solid rgba(247,243,236,.5);color:#F7F3EC;opacity:0;transform:translateY(6px);
  transition:opacity .3s ease,transform .3s ease;}
.atl-tile:hover .atl-tile-go{opacity:1;transform:translateY(0);}
.atl-tile-big{grid-column:span 2;grid-row:span 2;}
.atl-tile-tall{grid-column:span 1;grid-row:span 2;}
.atl-tile-wide{grid-column:span 2;grid-row:span 1;}
.atl-tile-sq{grid-column:span 1;grid-row:span 1;}
.atl-lookbook-more{display:flex;justify-content:center;margin-top:clamp(30px,4vw,46px);}

/* process */
.atl-process{padding:clamp(60px,9vw,112px) 0;background:var(--surfaceL1);
  border-top:1px solid var(--border);border-bottom:1px solid var(--border);}
.atl-steps{max-width:1280px;margin:0 auto;padding:0 clamp(16px,4vw,48px);
  display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
.atl-step{position:relative;text-align:left;cursor:pointer;background:var(--mainBg);
  border:1px solid var(--border);padding:28px 24px 26px;overflow:hidden;
  transition:border-color .25s ease,transform .25s ease,box-shadow .25s ease;}
.atl-step::before{content:"";position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--primary);
  transform:scaleY(0);transform-origin:top;transition:transform .35s cubic-bezier(.16,1,.3,1);}
.atl-step:hover{border-color:var(--borderMid);transform:translateY(-4px);box-shadow:var(--shadowMd);}
.atl-step:hover::before{transform:scaleY(1);}
.atl-step-k{font-family:Georgia,serif;font-size:13px;font-weight:700;color:var(--primary);letter-spacing:.1em;}
.atl-step-icon{display:block;margin:16px 0 14px;color:var(--heading);}
.atl-step b{display:block;font-family:Georgia,serif;font-weight:500;font-size:21px;color:var(--heading);margin-bottom:9px;}
.atl-step p{margin:0;color:var(--secondaryText);font-size:13px;line-height:1.62;}
.atl-step-go{position:absolute;top:24px;right:22px;color:var(--primary);opacity:0;transform:translateX(-6px);
  transition:opacity .25s ease,transform .25s ease;}
.atl-step:hover .atl-step-go{opacity:1;transform:translateX(0);}

/* testimonial */
.atl-quote{padding:clamp(84px,13vw,168px) clamp(20px,5vw,48px);}
.atl-quote-inner{max-width:960px;margin:0 auto;text-align:center;position:relative;}
.atl-quote-mark{font-family:Georgia,serif;font-size:130px;line-height:.6;color:var(--primary);opacity:.26;height:64px;}
.atl-quote blockquote{margin:0 0 28px;font-family:Georgia,serif;font-weight:500;color:var(--heading);
  font-size:clamp(23px,3.7vw,44px);line-height:1.32;letter-spacing:-.012em;}
.atl-quote-by{display:flex;flex-direction:column;align-items:center;gap:7px;}
.atl-quote-stars{display:inline-flex;gap:3px;color:var(--primary);}
.atl-quote-by b{color:var(--heading);font-size:14px;font-weight:700;letter-spacing:.02em;}
.atl-quote-by em{color:var(--mutedText);font-style:normal;font-size:12px;}

/* cta band */
.atl-cta{padding:0 clamp(16px,4vw,48px) clamp(72px,10vw,124px);}
.atl-cta-inner{max-width:1000px;margin:0 auto;text-align:center;padding:clamp(50px,7vw,88px) clamp(24px,5vw,64px);
  border:1px solid var(--borderMid);background:var(--surfaceL1);
  display:flex;flex-direction:column;align-items:center;gap:16px;position:relative;overflow:hidden;}
.atl-cta-inner::before,.atl-cta-inner::after{content:"";position:absolute;width:44px;height:44px;opacity:.6;}
.atl-cta-inner::before{top:18px;left:18px;border-top:1px solid var(--primary);border-left:1px solid var(--primary);}
.atl-cta-inner::after{bottom:18px;right:18px;border-bottom:1px solid var(--primary);border-right:1px solid var(--primary);}
.atl-cta-inner h2{font-family:Georgia,serif;font-weight:500;color:var(--heading);
  font-size:clamp(30px,4.7vw,58px);line-height:1.03;letter-spacing:-.02em;margin:4px 0 0;}
.atl-cta-inner p{margin:0;color:var(--secondaryText);font-size:16px;line-height:1.6;max-width:480px;}
.atl-cta-buttons{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:14px;}

/* footer */
.atl-footer{border-top:1px solid var(--border);background:var(--surfaceL1);
  padding:clamp(50px,6vw,76px) clamp(20px,5vw,48px) 28px;}
.atl-footer-top{max-width:1280px;margin:0 auto;display:grid;grid-template-columns:1.6fr 1fr 1fr 1.2fr;gap:38px;
  padding-bottom:36px;border-bottom:1px solid var(--border);}
.atl-wordmark-static{cursor:default;}
.atl-footer-brand p{color:var(--secondaryText);font-size:13px;line-height:1.72;max-width:300px;margin:16px 0 18px;}
.atl-socials{display:flex;gap:10px;}
.atl-socials a{display:grid;place-items:center;width:39px;height:39px;border-radius:999px;
  border:1px solid var(--border);color:var(--secondaryText);transition:all .2s ease;}
.atl-socials a:hover{border-color:var(--primary);color:var(--primary);transform:translateY(-2px);}
.atl-footer-col{display:flex;flex-direction:column;gap:11px;}
.atl-footer-col h4{margin:0 0 6px;color:var(--heading);font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;}
.atl-footer-col button{background:none;border:0;padding:0;cursor:pointer;font:inherit;text-align:left;
  color:var(--secondaryText);font-size:13.5px;transition:color .2s ease,transform .2s ease;width:fit-content;}
.atl-footer-col button:hover{color:var(--primary);transform:translateX(3px);}
.atl-footer-col span{display:inline-flex;align-items:center;gap:8px;color:var(--secondaryText);font-size:13px;}
.atl-footer-col span svg{color:var(--primary);flex:0 0 auto;}
.atl-footer-bottom{max-width:1280px;margin:0 auto;padding-top:20px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
.atl-footer-bottom span{color:var(--mutedText);font-size:12px;}
.atl-footer-top-btn{background:none;border:0;cursor:pointer;font:inherit;font-size:12px;font-weight:700;
  color:var(--secondaryText);display:inline-flex;align-items:center;gap:5px;transition:color .2s ease;}
.atl-footer-top-btn:hover{color:var(--primary);}
.atl-footer-top-btn svg{color:var(--primary);}

/* ---- responsive ---- */
@media (max-width:1000px){
  .atl-hero-inner{grid-template-columns:1fr;}
  .atl-hero-art{display:none;}
  .atl-hero-side{display:none;}
  .atl-steps{grid-template-columns:repeat(2,1fr);}
  .atl-footer-top{grid-template-columns:1fr 1fr;}
}
@media (max-width:760px){
  .atl-nav-links{display:none;}
  .atl-banner,.atl-banner.is-right .atl-banner-media{grid-template-columns:1fr;order:0;}
  .atl-banner-media{order:0!important;}
  .atl-bento{grid-template-columns:repeat(2,1fr);grid-auto-rows:clamp(140px,40vw,190px);}
  .atl-tile-big{grid-column:span 2;grid-row:span 2;}
  .atl-tile-wide{grid-column:span 2;}
  .atl-tile-tall{grid-column:span 1;grid-row:span 2;}
  .atl-section-head-row{flex-direction:column;align-items:flex-start;}
  .atl-section-head-row p{text-align:left;}
  .atl-hero-stats{gap:16px;}
  .atl-footer-top{grid-template-columns:1fr;gap:26px;}
}
@media (max-width:440px){
  .atl-nav-right .btn-primary{display:none;}
}
@media (prefers-reduced-motion:reduce){
  .atl-reveal{opacity:1!important;transform:none!important;transition:none!important;}
  .atl-clip{clip-path:none!important;}
  .atl-marquee-track{animation:none!important;}
  .atl-scrollcue svg{animation:none!important;}
}
`;

export default Atelier;
