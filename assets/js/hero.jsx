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

  // Bring-a-friend discount — Beginners class only, so it is offered here and
  // nowhere else. Config lives in _config.yml (friend_discount).
  const fd = window.FRIEND_DISCOUNT || {};
  const friendOn = !!(fd.enabled && fd.base && fd.percent);
  const friendEach = friendOn ? Math.round((fd.base * (100 - fd.percent)) / 100) : 0;
  const friendTotal = friendEach * 2;

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
            {friendOn && (
              <li>
                <span className="hero-facts-label">With a friend</span>
                <span>
                  {friendEach} DKK each — {fd.percent}% off when two of you sign up together
                </span>
              </li>
            )}
          </ul>

          <div className="hero-cta-row">
            <Button href="/registration" variant="primary">Register now</Button>
            {friendOn && (
              <Button href="/registration_friend" variant="ghost-light">
                Sign up with a friend — {fd.percent}% off
              </Button>
            )}
          </div>
        </div>
      </header>

      {friendOn && (
        <section className="beginner-friend" id="bring-a-friend">
          <div className="beginner-friend-inner">
            <div className="beginner-friend-badge">−{fd.percent}%</div>
            <div className="beginner-friend-body">
              <h2 className="beginner-friend-title">Sign up with a friend, both save {fd.percent}%</h2>
              <p>
                Salsa is more fun with friends. Bring a friend, sign up together,
                and you both get <strong>{fd.percent}% off</strong>.
              </p>
              <p>
                That's <strong>{friendEach} DKK each</strong> instead of {fd.base} DKK —{" "}
                <strong>{friendTotal} DKK</strong> for the two of you, in one payment.
                Cheaper than the student price, whatever your age.
              </p>
              <p className="beginner-friend-fine">
                Beginners class only. You don't need to dance with each other in class —
                we rotate partners anyway.
              </p>
              <div className="hero-cta-row">
                <Button href="/registration_friend" variant="primary">
                  Sign up with a friend
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

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
