const fs = require("fs"),
  path = require("path"),
  { JSDOM } = require("jsdom");
const html = fs
  .readFileSync(path.join(__dirname, "src", "index.html"), "utf8")
  .replace(
    '<script src="../node_modules/lucide/dist/umd/lucide.js"></script><script src="app.js"></script>',
    "",
  );
const app = fs.readFileSync(path.join(__dirname, "src", "app.js"), "utf8"),
  lucide = fs.readFileSync(
    path.join(__dirname, "node_modules", "lucide", "dist", "umd", "lucide.js"),
    "utf8",
  );
const dom = new JSDOM(html, {
  runScripts: "dangerously",
  url: "http://fractual.local/",
});
dom.window.desktop = { minimize() {}, maximize() {}, close() {} };
dom.window.eval(lucide);
dom.window.eval(app);
const d = dom.window.document,
  assert = (x, m) => {
    if (!x) throw new Error(m);
  },
  click = (s) => d.querySelector(s).click();
d.startViewTransition = (change) => {
  change();
  return { finished: Promise.resolve() };
};
assert(d.title === "Fractual", "Branding failed");
assert(d.querySelector('link[href*="geist"]'), "Packaged font failed");
assert(
  [...d.querySelectorAll('link[rel="stylesheet"]')]
    .at(-1)
    .href.endsWith("/new-ui.css"),
  "New UI cascade order failed",
);
assert(d.querySelector(".brand .fractual-icon"), "Brand icon failed");
assert(
  d.querySelectorAll(".brand-word span").length === 8,
  "Recurring brand typing failed",
);
assert(
  d.querySelectorAll(".boot-word i").length === 8,
  "Loading word animation failed",
);
assert(d.querySelector("#boot-screen"), "Loading screen failed");
assert(!d.querySelector(".fractual-rail"), "Old focus rail remains");
assert(d.querySelector("#network-field"), "Connected network canvas failed");
assert(d.body.dataset.generation === "new", "New interface default failed");
assert(
  d.querySelectorAll("[data-generation-choice]").length === 2,
  "Interface mode controls failed",
);
assert(
  d.querySelector("#discord-presence-toggle"),
  "Discord presence setting failed",
);
assert(d.querySelector("#update-action"), "Auto update UI failed");
assert(
  d.querySelector("#update-chip").textContent === "INSTALLER",
  "Source update state failed",
);
assert(!d.querySelector(".brand em"), "Old preview badge remains");
assert(!d.querySelector(".status"), "Old ready status remains");
assert(d.querySelectorAll(".theme").length === 4, "Theme set failed");
assert(
  d.querySelector(".material-panel .material-copy"),
  "Material introduction failed",
);
assert(
  d.querySelectorAll(".theme .theme-swatch").length === 4,
  "Material swatches failed",
);
assert(
  d.querySelectorAll(".theme small").length === 4,
  "Material descriptions failed",
);
assert(
  d.querySelectorAll(".theme em svg").length === 4,
  "Material selection markers failed",
);
assert(
  d.querySelector('[data-page="general"]').classList.contains("active"),
  "General tab failed",
);
assert(d.querySelector(".nav svg"), "Icons failed");
assert(
  d.querySelectorAll("[data-command]").length === 12,
  "Quick switcher actions failed",
);
click("#command-trigger");
assert(
  d.querySelector("#command-overlay").classList.contains("open"),
  "Quick switcher open failed",
);
assert(
  d.querySelector("#command-trigger").getAttribute("aria-expanded") === "true",
  "Quick switcher accessibility state failed",
);
const commandSearch = d.querySelector("#command-search");
commandSearch.value = "visual";
commandSearch.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
assert(
  [...d.querySelectorAll("[data-command]")].filter((button) => !button.hidden)
    .length === 1,
  "Quick switcher filter failed",
);
d.dispatchEvent(
  new dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
);
assert(
  d.querySelector('[data-page="visual"]').classList.contains("active"),
  "Quick switcher command failed",
);
assert(
  !d.querySelector("#command-overlay").classList.contains("open"),
  "Quick switcher close failed",
);
click("#sidebar-toggle");
assert(
  d.body.classList.contains("sidebar-collapsed"),
  "Sidebar collapse failed",
);
click("#sidebar-toggle");
assert(
  !d.body.classList.contains("sidebar-collapsed"),
  "Sidebar expand failed",
);
click('[data-tab="visual"]');
assert(
  d.querySelector('[data-page="visual"]').classList.contains("active"),
  "Visual tab failed",
);
click('[data-page="visual"] .toggle');
assert(
  !d.querySelector('[data-page="visual"] .toggle').classList.contains("on"),
  "Toggle failed",
);
const opacity = d.querySelector("#opacity");
opacity.value = "50";
opacity.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
assert(d.querySelector("#opacity-value").textContent === "50", "Slider failed");
click('[data-tab="misc"]');
click(".keybind");
d.dispatchEvent(
  new dom.window.KeyboardEvent("keydown", { key: "K", bubbles: true }),
);
assert(d.querySelector(".keybind kbd").textContent === "K", "Keybind failed");
click('[data-tab="settings"]');
click("#discord-presence-toggle");
assert(
  d.querySelector("#discord-presence-toggle").classList.contains("on"),
  "Discord presence toggle failed",
);
click('[data-generation-choice="legacy"]');
assert(
  d.body.dataset.generation === "legacy",
  "Legacy interface switch failed",
);
click('[data-generation-choice="new"]');
assert(d.body.dataset.generation === "new", "New interface switch failed");
click("#ui-swap-trigger");
assert(
  d.querySelector("#ui-stage").classList.contains("open"),
  "UI Swap stage failed",
);
d.querySelector("#ui-stage").click();
assert(
  !d.querySelector("#ui-stage").classList.contains("open"),
  "UI Swap click-outside close failed",
);
click("#ui-swap-trigger");
assert(
  d.querySelector(".cover-card.active").dataset.ui === "classic",
  "Cover-flow selection failed",
);
click("#stage-next");
assert(
  d.querySelector(".cover-card.active").dataset.ui === "stellar",
  "Cover-flow motion failed",
);
assert(
  d.querySelector("#stage-title").textContent === "Stellar",
  "Cover-flow title failed",
);
click("#stage-apply");
assert(d.body.dataset.ui === "stellar", "UI Swap failed");
assert(
  d.querySelector("#ui-swap-current").textContent.includes("Stellar"),
  "UI Swap label failed",
);
assert(
  !d.querySelector("#ui-stage").classList.contains("open"),
  "UI Swap close failed",
);
const version = d.querySelector("#version-select");
version.value = "1.3";
version.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
assert(d.body.dataset.version === "1.3", "Version selector failed");
assert(
  d.querySelector("#app-version").textContent === "v1.3",
  "Version label failed",
);
click('[data-theme="paper"]');
assert(d.body.dataset.theme === "paper", "Theme failed");
click("#compact-toggle");
assert(d.body.classList.contains("compact"), "Compact mode failed");
const scale = d.querySelector("#scale");
scale.value = "90";
scale.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
assert(
  d.documentElement.style.getPropertyValue("--ui-scale") === "0.9",
  "UI scale failed",
);
assert(
  d.querySelector("#scale-value").textContent === "90%",
  "Scale readout failed",
);
click('[data-tab="general"]');
click('[data-subtab="secondary"]');
assert(
  d.querySelector('[data-subpage="secondary"]').classList.contains("active"),
  "Subtab failed",
);
click(".checkbox");
assert(
  !d.querySelector(".checkbox").classList.contains("on"),
  "Checkbox failed",
);
click('[data-tab="visual"]');
click('[data-tab="general"]');
assert(
  d.querySelector('[data-subpage="secondary"]').classList.contains("active"),
  "Subtab persistence failed",
);
const content = d.querySelector(".content");
content.scrollTop = 123;
content.dispatchEvent(new dom.window.Event("scroll"));
click('[data-tab="settings"]');
click('[data-tab="general"]');
assert(content.scrollTop === 123, "Per-page scroll restoration failed");
click("#reset-button");
assert(
  d.querySelector("#reset-button").textContent.includes("again"),
  "Safe reset confirmation failed",
);
assert(d.body.dataset.theme === "paper", "Safe reset triggered too early");
click("#reset-button");
assert(d.body.dataset.theme === "noir", "Confirmed reset failed");
assert(
  fs
    .readFileSync(path.join(__dirname, "src", "app.js"), "utf8")
    .includes("networkLinks.push"),
  "Connected background failed",
);
const newUi = fs.readFileSync(
  path.join(__dirname, "src", "new-ui.css"),
  "utf8",
);
assert(
  /max\(0?\.86rem,\s*14px\)/.test(newUi),
  "Readable primary text floor failed",
);
assert(
  /max\(0?\.75rem,\s*12px\)/.test(newUi),
  "Readable secondary text floor failed",
);
assert(/border-radius:\s*0?\.9rem/.test(newUi), "Rounded panel pass failed");
assert(newUi.includes(".material-footer"), "Material footer failed");
assert(newUi.includes(".command-dialog"), "Quick switcher styling failed");
console.log(
  "Fractual checks passed: Geist font, loading, recurring brand typing, connected network, New and Legacy modes, Discord presence, auto update UI, quick switcher, keyboard navigation, safe reset, remembered scroll and subtabs, sidebar, tabs, icons, scrollable UI Swap, version selector, toggles, sliders, scale, keybinds, themes, compact mode, and checkboxes.",
);
