// Tweaks panel — palette / font / layout
function TweaksPanel({
  state,
  setState,
  open,
  setOpen
}) {
  if (!open) return null;
  const row = (label, key, options) => /*#__PURE__*/React.createElement("div", {
    className: "tw-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tw-row-label"
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "tw-chips"
  }, options.map(o => /*#__PURE__*/React.createElement("button", {
    key: String(o.value),
    className: `tw-chip ${state[key] === o.value ? "tw-chip-active" : ""}`,
    onClick: () => setState({
      ...state,
      [key]: o.value
    })
  }, o.label))));
  return /*#__PURE__*/React.createElement("div", {
    className: "tweaks-panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tw-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tw-title"
  }, "Tweaks"), /*#__PURE__*/React.createElement("button", {
    className: "tw-close",
    onClick: () => setOpen(false)
  }, "\xD7")), row("Mode", "dark", [{
    value: false,
    label: "Light"
  }, {
    value: true,
    label: "Dark"
  }]), row("Preview", "mobile", [{
    value: false,
    label: "Desktop"
  }, {
    value: true,
    label: "Mobile"
  }]));
}
function TweaksFab({
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    className: "tweaks-fab",
    onClick: onClick,
    title: "Tweaks"
  }, /*#__PURE__*/React.createElement("span", {
    className: "tweaks-fab-dot"
  }), /*#__PURE__*/React.createElement("span", null, "Tweaks"));
}
Object.assign(window, {
  TweaksPanel,
  TweaksFab
});