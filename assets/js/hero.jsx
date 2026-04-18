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
          <span className="hero-title-line">{c.title_line_1}</span>
          <span className="hero-title-line hero-title-accent">{c.title_line_2}</span>
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

Object.assign(window, { HeroFullbleed });
