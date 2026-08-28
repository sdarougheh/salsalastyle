// Hero — content comes from _data/copy.yml via window.COPY

function HeroFullbleed() {
  const c = window.COPY && window.COPY.hero || {};
  const photo = c.photo ? "/" + c.photo.replace(/^\//, "") : "/assets/images/photo-class-1.png";
  return /*#__PURE__*/React.createElement("header", {
    className: "hero hero-fullbleed",
    id: "top"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero-photo"
  }, /*#__PURE__*/React.createElement("img", {
    src: photo,
    alt: "Salsa class at Inflow Studio"
  }), /*#__PURE__*/React.createElement("div", {
    className: "hero-photo-veil"
  })), /*#__PURE__*/React.createElement(Nav, null), /*#__PURE__*/React.createElement("div", {
    className: "hero-fullbleed-body"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "hero-title"
  }, /*#__PURE__*/React.createElement("span", {
    className: "hero-title-line",
    dangerouslySetInnerHTML: {
      __html: c.title_line_1 || ""
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "hero-title-line hero-title-accent",
    dangerouslySetInnerHTML: {
      __html: c.title_line_2 || ""
    }
  })), /*#__PURE__*/React.createElement("p", {
    className: "hero-lede",
    dangerouslySetInnerHTML: {
      __html: c.lede || ""
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "hero-cta-row"
  }, /*#__PURE__*/React.createElement(Button, {
    href: (c.cta_primary || {}).href,
    variant: "primary"
  }, (c.cta_primary || {}).label), /*#__PURE__*/React.createElement(Button, {
    href: (c.cta_secondary || {}).href,
    variant: "ghost-light"
  }, (c.cta_secondary || {}).label), /*#__PURE__*/React.createElement(Button, {
    href: "/#events",
    variant: "ghost-light",
    className: "hero-cta-events"
  }, "Events"))));
}

// Dedicated landing hero for /beginner — same full-bleed look + nav + footer.
function BeginnerLanding() {
  const photo = "/assets/images/photo-class-1.png";
  const location = ((window.COPY || {}).location || {}).address || "";
  const single = (window.PRICING || []).filter(function (p) {
    return /single/i.test(p.pkg);
  })[0];
  const priceText = single ? single.regular + " (" + single.student + " students)" : "";
  const instagram = (((window.COPY || {}).footer || {}).social || {}).instagram || "https://instagram.com/salsalastyle";
  // Direct-message deep link derived from the profile handle (ig.me/m/<handle>).
  const igHandle = instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/.*$/, "");
  const instagramDM = igHandle ? "https://ig.me/m/" + igHandle : instagram;

  // Bring-a-friend discount — Beginners class only, so it is offered here and
  // nowhere else. Config lives in _config.yml (friend_discount).
  const fd = window.FRIEND_DISCOUNT || {};
  const friendOn = !!(fd.enabled && fd.base && fd.percent);
  const friendEach = friendOn ? Math.round(fd.base * (100 - fd.percent) / 100) : 0;
  const friendTotal = friendEach * 2;
  return /*#__PURE__*/React.createElement("div", {
    className: "app"
  }, /*#__PURE__*/React.createElement("header", {
    className: "hero hero-fullbleed hero-beginner",
    id: "top"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero-photo"
  }, /*#__PURE__*/React.createElement("img", {
    src: photo,
    alt: "Salsa class in Copenhagen"
  }), /*#__PURE__*/React.createElement("div", {
    className: "hero-photo-veil"
  })), /*#__PURE__*/React.createElement(Nav, null), /*#__PURE__*/React.createElement("div", {
    className: "hero-fullbleed-body"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "hero-title"
  }, /*#__PURE__*/React.createElement("span", {
    className: "hero-title-line"
  }, "Salsa for"), /*#__PURE__*/React.createElement("span", {
    className: "hero-title-line hero-title-accent"
  }, "beginners")), /*#__PURE__*/React.createElement("p", {
    className: "hero-lede"
  }, "Our Beginners class is built for absolute first-timers.", " ", /*#__PURE__*/React.createElement("strong", null, "No experience needed. No partner needed."), " ", "Come as you are and start dancing with us!"), /*#__PURE__*/React.createElement("ul", {
    className: "hero-facts"
  }, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
    className: "hero-facts-label"
  }, "When"), /*#__PURE__*/React.createElement("span", null, "Wednesdays, 19:00\u201320:00")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
    className: "hero-facts-label"
  }, "Where"), /*#__PURE__*/React.createElement("span", null, location)), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
    className: "hero-facts-label"
  }, "Dates"), /*#__PURE__*/React.createElement("span", null, "8 weeks from September 2nd \u2014 with a holiday break in week 42")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
    className: "hero-facts-label"
  }, "Price"), /*#__PURE__*/React.createElement("span", null, priceText)), friendOn && /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
    className: "hero-facts-label"
  }, "With a friend"), /*#__PURE__*/React.createElement("span", null, friendEach, " DKK each \u2014 ", fd.percent, "% off when two of you sign up together"))), /*#__PURE__*/React.createElement("div", {
    className: "hero-cta-row"
  }, /*#__PURE__*/React.createElement(Button, {
    href: "/registration_beginner",
    variant: "primary"
  }, "Register now"), friendOn && /*#__PURE__*/React.createElement(Button, {
    href: "/registration_friend",
    variant: "ghost-light"
  }, "Sign up with a friend \u2014 ", fd.percent, "% off"), /*#__PURE__*/React.createElement(Button, {
    href: instagram,
    variant: "ghost-light",
    target: "_blank",
    arrow: false
  }, /*#__PURE__*/React.createElement("svg", {
    className: "btn-icon",
    viewBox: "0 0 24 24",
    width: "17",
    height: "17",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    role: "img",
    "aria-label": "Instagram"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "3",
    width: "18",
    height: "18",
    rx: "5"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "4"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "17.5",
    cy: "6.5",
    r: "1",
    fill: "currentColor",
    stroke: "none"
  })), "Impressions from previous classes"), /*#__PURE__*/React.createElement(Button, {
    href: instagramDM,
    variant: "ghost-light",
    target: "_blank",
    arrow: false
  }, /*#__PURE__*/React.createElement("svg", {
    className: "btn-icon",
    viewBox: "0 0 24 24",
    width: "17",
    height: "17",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    role: "img",
    "aria-label": "Message"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l2.1-5.7A8.4 8.4 0 1 1 21 11.5z"
  })), "Message us")))), friendOn && /*#__PURE__*/React.createElement("section", {
    className: "beginner-friend",
    id: "bring-a-friend"
  }, /*#__PURE__*/React.createElement("div", {
    className: "beginner-friend-inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "beginner-friend-badge"
  }, "\u2212", fd.percent, "%"), /*#__PURE__*/React.createElement("div", {
    className: "beginner-friend-body"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "beginner-friend-title"
  }, "Bring a friend, both save ", fd.percent, "%"), /*#__PURE__*/React.createElement("p", null, "Sign up together for ", /*#__PURE__*/React.createElement("strong", null, friendEach, " DKK each"), " instead of ", fd.base, " DKK \u2014 cheaper than the student price, whatever your age. Beginners class only."), /*#__PURE__*/React.createElement("div", {
    className: "hero-cta-row"
  }, /*#__PURE__*/React.createElement(Button, {
    href: "/registration_friend",
    variant: "primary"
  }, "Sign up with a friend"))))), /*#__PURE__*/React.createElement("section", {
    className: "beginner-faq",
    id: "faq"
  }, /*#__PURE__*/React.createElement("div", {
    className: "beginner-faq-inner"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "beginner-faq-title"
  }, "Good to know"), (window.FAQ || []).filter(function (item) {
    return !item.hide_on_beginner;
  }).map(function (item, i) {
    return /*#__PURE__*/React.createElement("details", {
      className: "beginner-faq-item",
      key: i
    }, /*#__PURE__*/React.createElement("summary", null, item.q), /*#__PURE__*/React.createElement("p", null, item.a));
  }), /*#__PURE__*/React.createElement("p", {
    className: "beginner-faq-more"
  }, "Any other questions? ", /*#__PURE__*/React.createElement("a", {
    href: "https://ig.me/m/salsalastyle",
    target: "_blank",
    rel: "noreferrer"
  }, "Message us on Instagram"), " \u2014 we're happy to help."))), /*#__PURE__*/React.createElement(Footer, null));
}
Object.assign(window, {
  HeroFullbleed,
  BeginnerLanding
});