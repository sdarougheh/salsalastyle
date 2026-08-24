// Main app — orchestrates theme + layout
const {
  useState: useAppState,
  useEffect: useAppEffect
} = React;
const DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "mobile": false
} /*EDITMODE-END*/;
function App() {
  const [state, setState] = useAppState(() => {
    try {
      const saved = localStorage.getItem("sls_tweaks");
      if (saved) return {
        ...DEFAULTS,
        ...JSON.parse(saved)
      };
    } catch (e) {}
    return DEFAULTS;
  });
  const [tweaksOpen, setTweaksOpen] = useAppState(false);
  const [editMode, setEditMode] = useAppState(false);
  useAppEffect(() => {
    applyTheme(null, null, state.dark);
    document.body.dataset.dark = state.dark ? "1" : "0";
    try {
      localStorage.setItem("sls_tweaks", JSON.stringify(state));
    } catch (e) {}
    try {
      window.parent.postMessage({
        type: "__edit_mode_set_keys",
        edits: state
      }, "*");
    } catch (e) {}
  }, [state]);
  useAppEffect(() => {
    const handler = e => {
      if (!e.data || typeof e.data !== "object") return;
      if (e.data.type === "__activate_edit_mode") {
        setEditMode(true);
        setTweaksOpen(true);
      }
      if (e.data.type === "__deactivate_edit_mode") {
        setEditMode(false);
        setTweaksOpen(false);
      }
    };
    window.addEventListener("message", handler);
    try {
      window.parent.postMessage({
        type: "__edit_mode_available"
      }, "*");
    } catch (e) {}
    return () => window.removeEventListener("message", handler);
  }, []);

  // Dedicated beginner landing page (same layout, different content).
  if (/\/beginner\/?$/.test(window.location.pathname)) {
    return /*#__PURE__*/React.createElement(BeginnerLanding, null);
  }
  return /*#__PURE__*/React.createElement("div", {
    className: `app ${state.mobile ? "app-mobile-preview" : ""}`
  }, state.mobile ? /*#__PURE__*/React.createElement("div", {
    className: "mobile-frame"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mobile-frame-bezel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mobile-frame-screen"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mobile-frame-notch"
  }), /*#__PURE__*/React.createElement(HeroFullbleed, null), /*#__PURE__*/React.createElement(WednesdayClasses, null), /*#__PURE__*/React.createElement(Classes, null), /*#__PURE__*/React.createElement(Location, null), /*#__PURE__*/React.createElement(Pricing, null), /*#__PURE__*/React.createElement(Events, null), /*#__PURE__*/React.createElement(Register, null), /*#__PURE__*/React.createElement(Footer, null)))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(HeroFullbleed, null), /*#__PURE__*/React.createElement(WednesdayClasses, null), /*#__PURE__*/React.createElement(Classes, null), /*#__PURE__*/React.createElement(Location, null), /*#__PURE__*/React.createElement(Pricing, null), /*#__PURE__*/React.createElement(Events, null), /*#__PURE__*/React.createElement(Register, null), /*#__PURE__*/React.createElement(Footer, null)), editMode && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(TweaksFab, {
    onClick: () => setTweaksOpen(v => !v)
  }), /*#__PURE__*/React.createElement(TweaksPanel, {
    state: state,
    setState: setState,
    open: tweaksOpen,
    setOpen: setTweaksOpen
  })));
}
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(/*#__PURE__*/React.createElement(App, null));