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
  const season = window.SEASON || {};
  const prices = (window.PRICING || []).filter(function (p) { return !/drop/i.test(p.pkg); });
  const priceLabel = { "Single Class": "One class", "Two Classes": "Two classes" };

  return (
    <div className="app">
      <header className="hero hero-fullbleed" id="top">
        <div className="hero-photo">
          <img src={photo} alt="Salsa class in Copenhagen" />
          <div className="hero-photo-veil" />
        </div>
        <Nav />
        <div className="hero-fullbleed-body">
          <h1 className="hero-title">
            <span className="hero-title-line">Salsa for</span>
            <span className="hero-title-line hero-title-accent">total beginners</span>
          </h1>
          <p className="hero-lede">
            Our Beginners class is built for absolute first-timers. No experience needed.
            No partner needed. Come as you are and start dancing with us!
          </p>

          <ul className="hero-facts">
            <li>
              <span className="hero-facts-label">When</span>
              <span>Wednesdays, 19:00–20:00</span>
            </li>
            <li>
              <span className="hero-facts-label">Dates</span>
              <span>8 weeks from September 2nd — with a holiday break in week 42</span>
            </li>
            <li>
              <span className="hero-facts-label">Price</span>
              <span>
                {prices.map(function (p, i) {
                  return (priceLabel[p.pkg] || p.pkg) + ": " + p.regular +
                    " (" + p.student + " students)";
                }).join(" · ")}
              </span>
            </li>
          </ul>

          <div className="hero-cta-row">
            <Button href="/registration" variant="primary">Register now</Button>
            <Button href="/faq" variant="ghost-light">Questions?</Button>
          </div>
        </div>
      </header>
      <Footer />
    </div>
  );
}

Object.assign(window, { HeroFullbleed, BeginnerLanding });
