// Tweaks panel — palette / font / layout
function TweaksPanel({ state, setState, open, setOpen }) {
  if (!open) return null;

  const row = (label, key, options) => (
    <div className="tw-row">
      <div className="tw-row-label">{label}</div>
      <div className="tw-chips">
        {options.map((o) => (
          <button
            key={String(o.value)}
            className={`tw-chip ${state[key] === o.value ? "tw-chip-active" : ""}`}
            onClick={() => setState({ ...state, [key]: o.value })}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="tweaks-panel">
      <div className="tw-head">
        <div className="tw-title">Tweaks</div>
        <button className="tw-close" onClick={() => setOpen(false)}>×</button>
      </div>
      {row("Mode", "dark", [
        { value: false, label: "Light" },
        { value: true,  label: "Dark" },
      ])}
      {row("Preview", "mobile", [
        { value: false, label: "Desktop" },
        { value: true,  label: "Mobile" },
      ])}
    </div>
  );
}

function TweaksFab({ onClick }) {
  return (
    <button className="tweaks-fab" onClick={onClick} title="Tweaks">
      <span className="tweaks-fab-dot" />
      <span>Tweaks</span>
    </button>
  );
}

Object.assign(window, { TweaksPanel, TweaksFab });
