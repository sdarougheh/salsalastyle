// Shared UI bits + navigation
const { useState, useEffect } = React;

function Nav() {
  return (
    <nav className="nav">
      <a className="nav-logo" href="#top">
        <img src="/assets/images/logo.png" alt="Salsa LA-Style Copenhagen" />
        <span className="nav-logo-text">
          <span className="nav-logo-main">Salsa LA-Style</span>
          <span className="nav-logo-sub">Copenhagen</span>
        </span>
      </a>
      <div className="nav-links">
        <a href="#schedule">Schedule</a>
        <a href="#classes">Classes</a>
        <a href="#pricing">Pricing</a>
        <a href="/payments">Payments</a>
        <a href="/about">About</a>
        <a href="/registration" className="nav-link-register">Register</a>
      </div>
      <div className="nav-socials">
        <a className="nav-soc" href="https://instagram.com/salsalastyle" aria-label="Instagram" title="Instagram" target="_blank" rel="noreferrer">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
        </a>
        <a className="nav-soc" href="https://www.facebook.com/profile.php?id=61572834536280" aria-label="Facebook" title="Facebook" target="_blank" rel="noreferrer">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M13.5 21v-8H16l.5-3H13.5V8.2c0-.9.3-1.5 1.6-1.5H17V4.1C16.5 4 15.5 4 14.5 4c-2.3 0-3.8 1.4-3.8 3.9V10H8v3h2.7v8h2.8z" />
          </svg>
        </a>
      </div>
      <div className="nav-mobile-links">
        <a href="/payments">Payments</a>
        <a href="/about">About</a>
        <a className="nav-mobile-soc" href="https://instagram.com/salsalastyle" aria-label="Instagram" target="_blank" rel="noreferrer">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
        </a>
        <a className="nav-mobile-soc" href="https://www.facebook.com/profile.php?id=61572834536280" aria-label="Facebook" target="_blank" rel="noreferrer">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M13.5 21v-8H16l.5-3H13.5V8.2c0-.9.3-1.5 1.6-1.5H17V4.1C16.5 4 15.5 4 14.5 4c-2.3 0-3.8 1.4-3.8 3.9V10H8v3h2.7v8h2.8z" />
          </svg>
        </a>
      </div>
    </nav>
  );
}

function Marquee({ items }) {
  const doubled = [...items, ...items, ...items, ...items];
  return (
    <div className="marquee">
      <div className="marquee-track">
        {doubled.map((t, i) => (
          <span key={i} className="marquee-item">
            <span className="marquee-dot">✦</span>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function SectionLabel({ num, children }) {
  return (
    <div className="section-label">
      <span className="section-num">{num}</span>
      <span className="section-line" />
      <span className="section-text">{children}</span>
    </div>
  );
}

function Button({ children, href, variant = "primary", arrow = true }) {
  return (
    <a className={`btn btn-${variant}`} href={href}>
      {children}
      {arrow && <span className="btn-arrow">→</span>}
    </a>
  );
}

Object.assign(window, { Nav, Marquee, SectionLabel, Button });
