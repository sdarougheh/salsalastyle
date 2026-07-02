// Main app — orchestrates theme + layout
const { useState: useAppState, useEffect: useAppEffect } = React;

const DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "mobile": false
}/*EDITMODE-END*/;

function App() {
  const [state, setState] = useAppState(() => {
    try {
      const saved = localStorage.getItem("sls_tweaks");
      if (saved) return { ...DEFAULTS, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULTS;
  });
  const [tweaksOpen, setTweaksOpen] = useAppState(false);
  const [editMode, setEditMode] = useAppState(false);

  useAppEffect(() => {
    applyTheme(null, null, state.dark);
    document.body.dataset.dark = state.dark ? "1" : "0";
    try { localStorage.setItem("sls_tweaks", JSON.stringify(state)); } catch (e) {}
    try {
      window.parent.postMessage({ type: "__edit_mode_set_keys", edits: state }, "*");
    } catch (e) {}
  }, [state]);

  useAppEffect(() => {
    const handler = (e) => {
      if (!e.data || typeof e.data !== "object") return;
      if (e.data.type === "__activate_edit_mode") { setEditMode(true); setTweaksOpen(true); }
      if (e.data.type === "__deactivate_edit_mode") { setEditMode(false); setTweaksOpen(false); }
    };
    window.addEventListener("message", handler);
    try { window.parent.postMessage({ type: "__edit_mode_available" }, "*"); } catch (e) {}
    return () => window.removeEventListener("message", handler);
  }, []);

  return (
    <div className={`app ${state.mobile ? "app-mobile-preview" : ""}`}>
      {state.mobile ? (
        <div className="mobile-frame">
          <div className="mobile-frame-bezel">
            <div className="mobile-frame-screen">
              <div className="mobile-frame-notch" />
              <HeroFullbleed />
              <WednesdayClasses />
              <Classes />
              <Location />
              <Pricing />
              <Events />
              <Register />
              <Footer />
            </div>
          </div>
        </div>
      ) : (
        <>
          <HeroFullbleed />
          <WednesdayClasses />
          <Classes />
          <Location />
          <Pricing />
          <Events />
          <Register />
          <Footer />
        </>
      )}
      {editMode && (
        <>
          <TweaksFab onClick={() => setTweaksOpen((v) => !v)} />
          <TweaksPanel
            state={state}
            setState={setState}
            open={tweaksOpen}
            setOpen={setTweaksOpen}
          />
        </>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
