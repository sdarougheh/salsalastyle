// Hero — content comes from _data/copy.yml via window.COPY

function HeroFullbleed() {
  const c = (window.COPY && window.COPY.hero) || {};
  const photo = c.photo ? "/" + c.photo.replace(/^\//, "") : "/assets/images/photo-class-1.png";
  return (
    <header className="hero hero-fullbleed" id="top">
      <div className="hero-photo">
        <img src={photo} alt="Salsa class at Inflow Studio" />
        <div className="hero-photo-veil" />
      </div>
      <Nav />
      <div className="hero-fullbleed-body">
        <h1 className="hero-title">
          <span className="hero-title-line" dangerouslySetInnerHTML={{ __html: c.title_line_1 || "" }} />
          <span className="hero-title-line hero-title-accent" dangerouslySetInnerHTML={{ __html: c.title_line_2 || "" }} />
        </h1>
        <p className="hero-lede" dangerouslySetInnerHTML={{ __html: c.lede || "" }} />
        <div className="hero-cta-row">
          <Button href={(c.cta_primary   || {}).href} variant="primary">
            {(c.cta_primary   || {}).label}
          </Button>
          <Button href={(c.cta_secondary || {}).href} variant="ghost-light">
            {(c.cta_secondary || {}).label}
          </Button>
        </div>
      </div>
    </header>
  );
}

// Dedicated landing hero for /beginner — same full-bleed look + nav + footer.
function BeginnerLanding() {
  const photo = "/assets/images/photo-class-1.png";
  const location = ((window.COPY || {}).location || {}).address || "";
  const single = (window.PRICING || []).filter(function (p) { return /single/i.test(p.pkg); })[0];
  const priceText = single ? (single.regular + " (" + single.student + " students)") : "";

  return (
    <div className="app">
      <header className="hero hero-fullbleed hero-beginner" id="top">
        <div className="hero-photo">
          <img src={photo} alt="Salsa class in Copenhagen" />
          <div className="hero-photo-veil" />
        </div>
        <Nav />
        <div className="hero-fullbleed-body">
          <h1 className="hero-title">
            <span className="hero-title-line">Salsa for</span>
            <span className="hero-title-line hero-title-accent">beginners</span>
          </h1>
          <p className="hero-lede">
            Our Beginners class is built for absolute first-timers.{" "}
            <strong>No experience needed. No partner needed.</strong>{" "}
            Come as you are and start dancing with us!
          </p>

          <ul className="hero-facts">
            <li>
              <span className="hero-facts-label">When</span>
              <span>Wednesdays, 19:00–20:00</span>
            </li>
            <li>
              <span className="hero-facts-label">Where</span>
              <span>{location}</span>
            </li>
            <li>
              <span className="hero-facts-label">Dates</span>
              <span>8 weeks from September 2nd — with a holiday break in week 42</span>
            </li>
            <li>
              <span className="hero-facts-label">Price</span>
              <span>{priceText}</span>
            </li>
          </ul>

          <div className="hero-cta-row">
            <Button href="/registration" variant="primary">Register now</Button>
          </div>
        </div>
      </header>

      <section className="beginner-faq" id="faq">
        <div className="beginner-faq-inner">
          <h2 className="beginner-faq-title">Good to know</h2>
          {(window.FAQ || []).map(function (item, i) {
            return (
              <details className="beginner-faq-item" key={i}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            );
          })}
          <p className="beginner-faq-more">
            Still not sure? <a href="/contact">Get in touch</a> — we'll help you pick.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

Object.assign(window, { HeroFullbleed, BeginnerLanding });
