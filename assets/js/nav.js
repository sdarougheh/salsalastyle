// Shared UI bits + navigation
const {
  useState,
  useEffect
} = React;
function Nav() {
  return /*#__PURE__*/React.createElement("nav", {
    className: "nav"
  }, /*#__PURE__*/React.createElement("a", {
    className: "nav-logo",
    href: "/"
  }, /*#__PURE__*/React.createElement("img", {
    src: "/assets/images/logo.png",
    alt: "Salsa LA-Style Copenhagen"
  }), /*#__PURE__*/React.createElement("span", {
    className: "nav-logo-text"
  }, /*#__PURE__*/React.createElement("span", {
    className: "nav-logo-main"
  }, "Salsa LA-Style"), /*#__PURE__*/React.createElement("span", {
    className: "nav-logo-sub"
  }, "Copenhagen"))), /*#__PURE__*/React.createElement("div", {
    className: "nav-links"
  }, /*#__PURE__*/React.createElement("a", {
    href: "/#schedule"
  }, "Classes"), /*#__PURE__*/React.createElement("a", {
    href: "/#events"
  }, "Events"), /*#__PURE__*/React.createElement("a", {
    href: "/teachers"
  }, "Teachers"), /*#__PURE__*/React.createElement("a", {
    href: "/faq"
  }, "FAQ"), /*#__PURE__*/React.createElement("a", {
    href: "/payments"
  }, "Payments"), /*#__PURE__*/React.createElement("a", {
    href: "/about"
  }, "About"), /*#__PURE__*/React.createElement("a", {
    href: "/registration",
    className: "nav-link-register"
  }, "Register")), /*#__PURE__*/React.createElement("div", {
    className: "nav-socials"
  }, /*#__PURE__*/React.createElement("a", {
    className: "nav-soc",
    href: "https://instagram.com/salsalastyle",
    "aria-label": "Instagram",
    title: "Instagram",
    target: "_blank",
    rel: "noreferrer"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "18",
    height: "18",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
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
  }))), /*#__PURE__*/React.createElement("a", {
    className: "nav-soc",
    href: "https://www.facebook.com/profile.php?id=61572834536280",
    "aria-label": "Facebook",
    title: "Facebook",
    target: "_blank",
    rel: "noreferrer"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "18",
    height: "18",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M13.5 21v-8H16l.5-3H13.5V8.2c0-.9.3-1.5 1.6-1.5H17V4.1C16.5 4 15.5 4 14.5 4c-2.3 0-3.8 1.4-3.8 3.9V10H8v3h2.7v8h2.8z"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "nav-mobile-links"
  }, /*#__PURE__*/React.createElement("a", {
    href: "/payments"
  }, "Payments"), /*#__PURE__*/React.createElement("a", {
    href: "/about"
  }, "About"), /*#__PURE__*/React.createElement("a", {
    className: "nav-mobile-soc",
    href: "https://instagram.com/salsalastyle",
    "aria-label": "Instagram",
    target: "_blank",
    rel: "noreferrer"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "16",
    height: "16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
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
  }))), /*#__PURE__*/React.createElement("a", {
    className: "nav-mobile-soc",
    href: "https://www.facebook.com/profile.php?id=61572834536280",
    "aria-label": "Facebook",
    target: "_blank",
    rel: "noreferrer"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "16",
    height: "16",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M13.5 21v-8H16l.5-3H13.5V8.2c0-.9.3-1.5 1.6-1.5H17V4.1C16.5 4 15.5 4 14.5 4c-2.3 0-3.8 1.4-3.8 3.9V10H8v3h2.7v8h2.8z"
  })))));
}
function Marquee({
  items
}) {
  const doubled = [...items, ...items, ...items, ...items];
  return /*#__PURE__*/React.createElement("div", {
    className: "marquee"
  }, /*#__PURE__*/React.createElement("div", {
    className: "marquee-track"
  }, doubled.map((t, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: "marquee-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "marquee-dot"
  }, "\u2726"), t))));
}
function SectionLabel({
  num,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "section-label"
  }, /*#__PURE__*/React.createElement("span", {
    className: "section-num"
  }, num), /*#__PURE__*/React.createElement("span", {
    className: "section-line"
  }), /*#__PURE__*/React.createElement("span", {
    className: "section-text"
  }, children));
}
function Button({
  children,
  href,
  variant = "primary",
  arrow = true,
  target
}) {
  return /*#__PURE__*/React.createElement("a", {
    className: `btn btn-${variant}`,
    href: href,
    target: target,
    rel: target === "_blank" ? "noreferrer" : undefined
  }, children, arrow && /*#__PURE__*/React.createElement("span", {
    className: "btn-arrow"
  }, "\u2192"));
}
Object.assign(window, {
  Nav,
  Marquee,
  SectionLabel,
  Button
});