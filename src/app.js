const $ = (selector) => document.querySelector(selector),
  $$ = (selector) => [...document.querySelectorAll(selector)];
const titles = {
  general: "General",
  visual: "Visual",
  misc: "Misc",
  settings: "Settings",
};
const defaults = {
  theme: "noir",
  ui: "classic",
  generation: "new",
  version: "2.7",
  compact: false,
  motion: true,
  discordPresence: false,
  scale: 100,
  sidebarCollapsed: false,
  activeTab: "general",
  activeSubtab: "primary",
  scrolls: {},
  ranges: { amount: 68, intensity: 42, opacity: 85 },
  toggles: [true, false, true, false, true, true, false, true],
  checks: [true, false, true],
  keys: ["INSERT", "NONE"],
  selects: ["Default", "First"],
};
const uiNames = {
  classic: "Classic",
  stellar: "Stellar",
  horizon: "Horizon",
  dock: "Dock",
};
const freshDefaults = () => JSON.parse(JSON.stringify(defaults));
let state = load(),
  toastTimer,
  scrollSaveTimer,
  resetTimer,
  resetArmed = false,
  listening = null;
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem("fractual.ui") || "{}"),
      isPreGeneration = !["new", "legacy"].includes(saved.generation);
    if (!["noir", "graphite2", "paper", "contrast"].includes(saved.theme))
      saved.theme = "noir";
    if (!["classic", "stellar", "horizon", "dock"].includes(saved.ui))
      saved.ui = "classic";
    if (!Object.keys(titles).includes(saved.activeTab))
      saved.activeTab = "general";
    if (!["primary", "secondary"].includes(saved.activeSubtab))
      saved.activeSubtab = "primary";
    if (!saved.scrolls || typeof saved.scrolls !== "object") saved.scrolls = {};
    if (isPreGeneration) saved.generation = "new";
    if (["2.5", "2.6"].includes(saved.version)) saved.version = "2.7";
    saved.scale = Math.max(90, Math.min(120, Number(saved.scale) || 100));
    return {
      ...defaults,
      ...saved,
      scrolls: { ...defaults.scrolls, ...saved.scrolls },
      ranges: { ...defaults.ranges, ...saved.ranges },
    };
  } catch {
    return freshDefaults();
  }
}
function save() {
  localStorage.setItem("fractual.ui", JSON.stringify(state));
}
function icons() {
  window.lucide?.createIcons({
    icons: window.lucide.icons,
    attrs: { "stroke-width": 1.7 },
  });
}
function toast(message) {
  $("#toast span").textContent = message;
  $("#toast").classList.remove("show");
  void $("#toast").offsetWidth;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 1500);
}
function motionSwap(change) {
  if (document.startViewTransition && state.motion)
    return document.startViewTransition(change);
  change();
}
function tab(name, persist = true) {
  if (!titles[name]) return;
  const content = $(".content"),
    current = $(".page.active")?.dataset.page;
  if (current && current !== name) state.scrolls[current] = content.scrollTop;
  const change = () => {
    $$(".nav").forEach((b) => {
      const active = b.dataset.tab === name;
      b.classList.toggle("active", active);
      b.setAttribute("aria-current", active ? "page" : "false");
    });
    $$(".page").forEach((p) =>
      p.classList.toggle("active", p.dataset.page === name),
    );
    $("#page-title").textContent = titles[name];
    $("#topbar-page").textContent = titles[name];
    state.activeTab = name;
    content.scrollTop = Number(state.scrolls[name] || 0);
    if (persist) save();
    icons();
  };
  current === name ? change() : motionSwap(change);
}
function setSubtab(name, persist = true) {
  if (!["primary", "secondary"].includes(name)) return;
  $$("[data-subtab]").forEach((button) => {
    const active = button.dataset.subtab === name;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
  });
  $$("[data-subpage]").forEach((page) =>
    page.classList.toggle("active", page.dataset.subpage === name),
  );
  state.activeSubtab = name;
  if (persist) save();
}
function setRange(input, value) {
  input.value = value;
  input.style.setProperty(
    "--value",
    `${((value - input.min) / (input.max - input.min)) * 100}%`,
  );
  const output = $(`#${input.id}-value`);
  if (output) output.textContent = input.id === "scale" ? `${value}%` : value;
  if (input.id === "opacity") $(".preview-box").style.opacity = value / 100;
  if (input.id === "scale")
    document.documentElement.style.setProperty("--ui-scale", value / 100);
}
function apply() {
  document.body.dataset.theme = state.theme === "graphite" ? "" : state.theme;
  document.body.dataset.generation = state.generation;
  document.body.classList.toggle("compact", state.compact);
  document.body.classList.toggle("reduced-motion", !state.motion);
  document.body.classList.toggle("sidebar-collapsed", state.sidebarCollapsed);
  $$(".theme").forEach((b) => {
    const active = b.dataset.theme === state.theme;
    b.classList.toggle("active", active);
    b.setAttribute("aria-pressed", String(active));
  });
  $$("[data-generation-choice]").forEach((b) => {
    const active = b.dataset.generationChoice === state.generation;
    b.classList.toggle("active", active);
    b.setAttribute("aria-checked", String(active));
  });
  $("#compact-toggle").classList.toggle("on", state.compact);
  $("#motion-toggle").classList.toggle("on", state.motion);
  $("#discord-presence-toggle").classList.toggle("on", state.discordPresence);
  $("#sidebar-toggle").setAttribute(
    "aria-expanded",
    String(!state.sidebarCollapsed),
  );
  $("#sidebar-toggle").setAttribute(
    "aria-label",
    `${state.sidebarCollapsed ? "Expand" : "Collapse"} sidebar`,
  );
  $("#sidebar-toggle").title =
    `${state.sidebarCollapsed ? "Expand" : "Collapse"} sidebar (Ctrl+B)`;
  ["amount", "intensity", "opacity"].forEach((id) =>
    setRange($("#" + id), state.ranges[id]),
  );
  setRange($("#scale"), state.scale);
  $$(
    ".toggle:not(#compact-toggle):not(#motion-toggle):not(#discord-presence-toggle)",
  ).forEach((b, i) => b.classList.toggle("on", !!state.toggles[i]));
  $$(".toggle").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.classList.contains("on")),
    );
    const label = button.closest(".row")?.querySelector("b")?.textContent;
    if (label) button.setAttribute("aria-label", label);
  });
  $$(".checkbox").forEach((b, i) => {
    const active = !!state.checks[i];
    b.classList.toggle("on", active);
    b.setAttribute("aria-pressed", String(active));
    const label = b.closest(".check-row")?.querySelector("span")?.textContent;
    if (label) b.setAttribute("aria-label", label);
  });
  $$(".keybind").forEach(
    (b, i) => (b.querySelector("kbd").textContent = state.keys[i] || "NONE"),
  );
  $$("select").forEach(
    (s, i) => (s.value = state.selects[i] || s.options[0].value),
  );
  $$(".nav").forEach(
    (button, index) =>
      (button.title = `${button.dataset.label} (Ctrl+${index + 1})`),
  );
  tab(state.activeTab, false);
  setSubtab(state.activeSubtab, false);
}

function moveButtonFocus(buttons, button, event, columns = 1) {
  if (
    ![
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ].includes(event.key)
  )
    return;
  event.preventDefault();
  const current = buttons.indexOf(button);
  let next = current;
  if (event.key === "Home") next = 0;
  else if (event.key === "End") next = buttons.length - 1;
  else if (event.key === "ArrowLeft") next--;
  else if (event.key === "ArrowRight") next++;
  else if (event.key === "ArrowUp") next -= columns;
  else if (event.key === "ArrowDown") next += columns;
  next = (next + buttons.length) % buttons.length;
  buttons[next].focus();
  buttons[next].click();
}
const navButtons = $$(".nav");
navButtons.forEach((button) => {
  button.onclick = () => {
    tab(button.dataset.tab);
    document.body.classList.remove("sidebar-mobile-open");
  };
  button.onkeydown = (event) => moveButtonFocus(navButtons, button, event);
});
$(".content").addEventListener("scroll", (event) => {
  state.scrolls[state.activeTab] = event.currentTarget.scrollTop;
  clearTimeout(scrollSaveTimer);
  scrollSaveTimer = setTimeout(save, 180);
});
$("#sidebar-toggle").onclick = () => {
  if (window.innerWidth <= 720) {
    document.body.classList.toggle("sidebar-mobile-open");
    toast(
      document.body.classList.contains("sidebar-mobile-open")
        ? "Sidebar opened"
        : "Sidebar closed",
    );
  } else {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    save();
    apply();
    toast(state.sidebarCollapsed ? "Sidebar collapsed" : "Sidebar expanded");
  }
};
$$("[data-subtab]").forEach((button) => {
  button.onclick = () => motionSwap(() => setSubtab(button.dataset.subtab));
  button.onkeydown = (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const tabs = $$("[data-subtab]"),
      current = tabs.indexOf(button),
      next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? tabs.length - 1
            : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) %
              tabs.length;
    tabs[next].focus();
    tabs[next].click();
  };
});
$$(".toggle").forEach(
  (button) =>
    (button.onclick = () => {
      button.classList.toggle("on");
      button.animate?.(
        [
          { transform: "scale(.92)" },
          { transform: "scale(1.045)" },
          { transform: "scale(1)" },
        ],
        { duration: 360, easing: "cubic-bezier(.16,1,.3,1)" },
      );
      if (button === $("#compact-toggle"))
        state.compact = button.classList.contains("on");
      else if (button === $("#motion-toggle"))
        state.motion = button.classList.contains("on");
      else if (button === $("#discord-presence-toggle")) {
        state.discordPresence = button.classList.contains("on");
        syncDiscordPresence();
      } else
        state.toggles = $$(
          ".toggle:not(#compact-toggle):not(#motion-toggle):not(#discord-presence-toggle)",
        ).map((b) => b.classList.contains("on"));
      save();
      apply();
      const label = button.closest(".row")?.querySelector("b")?.textContent;
      toast(
        `${label || "Option"} ${button.classList.contains("on") ? "enabled" : "disabled"}`,
      );
    }),
);
$$(".checkbox").forEach(
  (button) =>
    (button.onclick = () => {
      button.classList.toggle("on");
      button.setAttribute(
        "aria-pressed",
        String(button.classList.contains("on")),
      );
      state.checks = $$(".checkbox").map((b) => b.classList.contains("on"));
      save();
    }),
);
["amount", "intensity", "opacity", "scale"].forEach((id) => {
  const input = $("#" + id);
  input.title = "Double-click to restore the default value";
  input.oninput = (event) => {
    const value = Number(event.target.value);
    setRange(event.target, value);
    if (id === "scale") state.scale = value;
    else state.ranges[id] = value;
    save();
  };
  input.ondblclick = () => {
    const value = id === "scale" ? defaults.scale : defaults.ranges[id];
    setRange(input, value);
    if (id === "scale") state.scale = value;
    else state.ranges[id] = value;
    save();
    toast(`${id[0].toUpperCase() + id.slice(1)} restored`);
  };
});
$$("select").forEach(
  (select, index) =>
    (select.onchange = () => {
      state.selects[index] = select.value;
      save();
      toast("Selection saved");
    }),
);
const themeButtons = $$(".theme");
themeButtons.forEach((button) => {
  button.onclick = () => {
    state.theme = button.dataset.theme;
    save();
    apply();
    document
      .querySelector(".window")
      .animate?.([{ opacity: 0.88 }, { opacity: 1 }], {
        duration: 320,
        easing: "cubic-bezier(.22,1,.36,1)",
      });
    toast(
      `${button.querySelector("b")?.textContent || button.dataset.theme} applied`,
    );
  };
  button.onkeydown = (event) => moveButtonFocus(themeButtons, button, event, 2);
});
function setGeneration(mode, notify = true) {
  if (!["new", "legacy"].includes(mode) || mode === state.generation) return;
  const change = () => {
    state.generation = mode;
    save();
    apply();
    applyUI();
    syncVersion();
  };
  if (document.startViewTransition && state.motion)
    document.startViewTransition(change);
  else change();
  $(".shell").animate?.(
    [
      { opacity: 0.66, transform: "scale(.992)", filter: "blur(.12rem)" },
      { opacity: 1, transform: "none", filter: "blur(0)" },
    ],
    { duration: 520, easing: "cubic-bezier(.16,1,.3,1)" },
  );
  (window.requestAnimationFrame || setTimeout)(resizeNetwork);
  if (notify)
    toast(
      mode === "new" ? "New interface enabled" : "Legacy interface enabled",
    );
}
const generationButtons = $$("[data-generation-choice]");
generationButtons.forEach((button) => {
  button.onclick = () => setGeneration(button.dataset.generationChoice);
  button.onkeydown = (event) =>
    moveButtonFocus(generationButtons, button, event);
});
$$(".keybind").forEach(
  (button, index) =>
    (button.onclick = () => {
      if (listening) return;
      listening = { button, index };
      button.classList.add("listening");
      button.querySelector("kbd").textContent = "...";
      toast("Press any key");
    }),
);
$("#color-swatch").onclick = (event) => {
  event.currentTarget.classList.toggle("alternate");
  toast("Accent preview changed");
};
$("#action-button").onclick = (event) => {
  event.currentTarget.textContent = "Complete";
  event.currentTarget.animate?.(
    [{ transform: "scale(.98)" }, { transform: "scale(1)" }],
    { duration: 220 },
  );
  setTimeout(() => (event.currentTarget.textContent = "Run action"), 850);
  toast("Action complete");
};
$("#reset-button").onclick = (event) => {
  const button = event.currentTarget;
  if (!resetArmed) {
    resetArmed = true;
    button.classList.add("armed");
    button.textContent = "Click again to reset";
    toast("Reset ready — click once more to confirm");
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      resetArmed = false;
      button.classList.remove("armed");
      button.textContent = "Reset interface";
    }, 3200);
    return;
  }
  clearTimeout(resetTimer);
  resetArmed = false;
  button.classList.remove("armed");
  button.textContent = "Reset interface";
  state = freshDefaults();
  save();
  apply();
  applyUI();
  syncVersion();
  toast("Interface reset");
};
function applyUI() {
  const ui = uiNames[state.ui] ? state.ui : "classic";
  document.body.dataset.ui = ui;
  $("#ui-swap-current").textContent = `${uiNames[ui]} frame`;
}
function syncVersion() {
  const select = $("#version-select");
  const version = [
    "2.7",
    "2.6",
    "2.5",
    "2.4",
    "2.2",
    "2.1",
    "2.0",
    "1.9",
    "1.8",
    "1.7",
    "1.5",
    "1.4",
    "1.3",
    "1.0",
  ].includes(state.version)
    ? state.version
    : "2.7";
  state.version = version;
  select.value = version;
  $("#app-version").textContent = `v${version}`;
  $("#brand-version").textContent =
    `${state.generation === "new" ? "NEW" : "LEGACY"} / ${version}`;
  document.body.dataset.version = version;
}
$("#version-select").onchange = (event) => {
  state.version = event.target.value;
  save();
  syncVersion();
  document.querySelector(".content").animate?.(
    [
      { opacity: 0.76, transform: "translateY(.15rem)" },
      { opacity: 1, transform: "none" },
    ],
    { duration: 340, easing: "cubic-bezier(.22,1,.36,1)" },
  );
  toast(`Version ${state.version} selected`);
};
const uiOrder = ["classic", "stellar", "horizon", "dock"];
let stageIndex = 0,
  stageReturnFocus = null;
function renderStage(direction = 0) {
  const cards = $$(".cover-card"),
    length = cards.length;
  cards.forEach((card, index) => {
    let offset = (index - stageIndex + length) % length;
    if (offset > length / 2) offset -= length;
    card.dataset.position = String(offset);
    card.classList.toggle("active", offset === 0);
    card.setAttribute("aria-selected", String(offset === 0));
    card.tabIndex = offset === 0 ? 0 : -1;
  });
  $$(".stage-dots i").forEach((dot, index) =>
    dot.classList.toggle("active", index === stageIndex),
  );
  const title = $("#stage-title");
  title.textContent = uiNames[uiOrder[stageIndex]];
  title.animate?.(
    [
      { opacity: 0, transform: `translateX(${direction * 12}px)` },
      { opacity: 1, transform: "none" },
    ],
    { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" },
  );
}
function moveStage(amount) {
  stageIndex = (stageIndex + amount + uiOrder.length) % uiOrder.length;
  renderStage(amount);
}
function swapOpen(open) {
  const stage = $("#ui-stage"),
    wasOpen = stage.classList.contains("open");
  if (open && !wasOpen) stageReturnFocus = document.activeElement;
  stage.classList.toggle("open", open);
  stage.setAttribute("aria-hidden", String(!open));
  $("#ui-swap-trigger").setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("selector-open", open);
  if (open) {
    stageIndex = Math.max(0, uiOrder.indexOf(state.ui));
    renderStage();
    $("#stage-close").focus();
  } else if (wasOpen) {
    stageReturnFocus?.focus?.();
    stageReturnFocus = null;
  }
}
function tweenLayout(change) {
  const elements = [$(".sidebar"), $(".content")].filter(Boolean),
    before = elements.map((element) => element.getBoundingClientRect());
  change();
  if (!state.motion) return;
  (window.requestAnimationFrame || setTimeout)(() =>
    elements.forEach((element, index) => {
      const after = element.getBoundingClientRect(),
        first = before[index],
        x = first.left - after.left,
        y = first.top - after.top,
        sx = after.width ? first.width / after.width : 1,
        sy = after.height ? first.height / after.height : 1;
      element.animate?.(
        [
          {
            transform: `translate(${x}px,${y}px) scale(${sx},${sy})`,
            opacity: 0.66,
          },
          { transform: "none", opacity: 1 },
        ],
        { duration: 620, easing: "cubic-bezier(.16,1,.3,1)" },
      );
    }),
  );
}
function chooseStage() {
  state.ui = uiOrder[stageIndex];
  save();
  tweenLayout(applyUI);
  swapOpen(false);
  (window.requestAnimationFrame || setTimeout)(resizeNetwork);
  toast(`${uiNames[state.ui]} UI applied`);
}
$("#ui-swap-trigger").onclick = () => swapOpen(true);
$("#stage-close").onclick = () => swapOpen(false);
$("#ui-stage").onclick = (event) => {
  if (event.target === event.currentTarget) swapOpen(false);
};
$("#stage-prev").onclick = () => moveStage(-1);
$("#stage-next").onclick = () => moveStage(1);
$("#stage-apply").onclick = chooseStage;
$$(".cover-card").forEach(
  (card, index) =>
    (card.onclick = () => {
      if (index === stageIndex) chooseStage();
      else {
        const forward = (index - stageIndex + uiOrder.length) % uiOrder.length;
        stageIndex = index;
        renderStage(forward <= 2 ? 1 : -1);
      }
    }),
);
let stageWheelReady = true,
  stageTouchX = 0;
$("#coverflow").addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    if (!stageWheelReady || Math.abs(event.deltaX) + Math.abs(event.deltaY) < 4)
      return;
    stageWheelReady = false;
    moveStage((event.deltaY || event.deltaX) > 0 ? 1 : -1);
    setTimeout(() => (stageWheelReady = true), 260);
  },
  { passive: false },
);
$("#coverflow").addEventListener(
  "touchstart",
  (event) => (stageTouchX = event.touches[0]?.clientX || 0),
  { passive: true },
);
$("#coverflow").addEventListener(
  "touchend",
  (event) => {
    const end = event.changedTouches[0]?.clientX || stageTouchX,
      delta = stageTouchX - end;
    if (Math.abs(delta) > 34) moveStage(delta > 0 ? 1 : -1);
  },
  { passive: true },
);

const commandOverlay = $("#command-overlay"),
  commandSearch = $("#command-search"),
  commandCount = $("#command-count"),
  commandEmpty = $("#command-empty"),
  commandButtons = $$("[data-command]");
let commandIndex = 0,
  commandReturnFocus = null;
function visibleCommands() {
  return commandButtons.filter((button) => !button.hidden);
}
function selectCommand(index, scroll = true) {
  const visible = visibleCommands();
  commandButtons.forEach((button) => {
    button.classList.remove("selected");
    button.setAttribute("aria-selected", "false");
    button.tabIndex = -1;
  });
  if (!visible.length) return;
  commandIndex = ((index % visible.length) + visible.length) % visible.length;
  const selected = visible[commandIndex];
  selected.classList.add("selected");
  selected.setAttribute("aria-selected", "true");
  selected.tabIndex = 0;
  if (scroll) selected.scrollIntoView?.({ block: "nearest" });
}
function filterCommands() {
  const query = commandSearch.value.trim().toLowerCase();
  commandButtons.forEach((button) => {
    const haystack =
      `${button.dataset.search} ${button.textContent}`.toLowerCase();
    button.hidden = Boolean(query) && !haystack.includes(query);
  });
  const count = visibleCommands().length;
  commandCount.textContent = `${count} ${count === 1 ? "action" : "actions"}`;
  commandEmpty.classList.toggle("show", count === 0);
  selectCommand(0, false);
}
function commandOpen(open) {
  const wasOpen = commandOverlay.classList.contains("open");
  if (open && !wasOpen) {
    if ($("#ui-stage").classList.contains("open")) swapOpen(false);
    commandReturnFocus = document.activeElement;
  }
  commandOverlay.classList.toggle("open", open);
  commandOverlay.setAttribute("aria-hidden", String(!open));
  $("#command-trigger").setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("command-open", open);
  if (open) {
    commandSearch.value = "";
    filterCommands();
    commandSearch.focus();
  } else if (wasOpen) {
    commandReturnFocus?.focus?.();
    commandReturnFocus = null;
  }
}
function applyLayout(name) {
  if (!uiNames[name]) return;
  state.ui = name;
  save();
  tweenLayout(applyUI);
  (window.requestAnimationFrame || setTimeout)(resizeNetwork);
  toast(`${uiNames[name]} UI applied`);
}
function runCommand(button = visibleCommands()[commandIndex]) {
  if (!button) return;
  const action = button.dataset.command;
  commandOpen(false);
  if (action.startsWith("page-")) tab(action.slice(5));
  else if (action.startsWith("layout-")) applyLayout(action.slice(7));
  else if (action === "ui-swap") swapOpen(true);
  else if (action === "sidebar") $("#sidebar-toggle").click();
  else if (action === "motion") $("#motion-toggle").click();
  else if (action === "cycle-theme") {
    const themes = $$(".theme"),
      current = themes.findIndex(
        (theme) => theme.dataset.theme === state.theme,
      );
    themes[(current + 1 + themes.length) % themes.length].click();
  }
}
$("#command-trigger").onclick = () => commandOpen(true);
commandSearch.oninput = filterCommands;
commandButtons.forEach((button) => {
  button.setAttribute("role", "option");
  button.onclick = () => runCommand(button);
  button.onpointermove = () => {
    const index = visibleCommands().indexOf(button);
    if (index >= 0) selectCommand(index, false);
  };
});
commandOverlay.onclick = (event) => {
  if (event.target === event.currentTarget) commandOpen(false);
};

function trapFocus(container, event) {
  if (event.key !== "Tab") return false;
  const focusable = [
    ...container.querySelectorAll(
      'button:not([hidden]),input:not([hidden]),select:not([hidden]),[tabindex]:not([tabindex="-1"]):not([hidden])',
    ),
  ];
  if (!focusable.length) return false;
  const current = focusable.indexOf(document.activeElement),
    next = event.shiftKey
      ? (current - 1 + focusable.length) % focusable.length
      : (current + 1) % focusable.length;
  event.preventDefault();
  focusable[next].focus();
  return true;
}
document.addEventListener(
  "keydown",
  (event) => {
    if (listening) {
      event.preventDefault();
      const value = event.key === "Escape" ? "NONE" : event.key.toUpperCase();
      listening.button.querySelector("kbd").textContent = value;
      listening.button.classList.remove("listening");
      state.keys[listening.index] = value;
      listening = null;
      save();
      toast(value === "NONE" ? "Keybind cleared" : "Key saved");
      return;
    }
    if (commandOverlay.classList.contains("open")) {
      if (trapFocus($(".command-dialog"), event)) return;
      if (event.key === "Escape") commandOpen(false);
      else if (event.key === "ArrowDown") selectCommand(commandIndex + 1);
      else if (event.key === "ArrowUp") selectCommand(commandIndex - 1);
      else if (event.key === "Home") selectCommand(0);
      else if (event.key === "End") selectCommand(visibleCommands().length - 1);
      else if (event.key === "Enter") runCommand();
      else return;
      event.preventDefault();
      return;
    }
    if ($("#ui-stage").classList.contains("open")) {
      if (trapFocus($(".stage-window"), event)) return;
      if (event.key === "Escape") swapOpen(false);
      else if (event.key === "ArrowLeft") moveStage(-1);
      else if (event.key === "ArrowRight") moveStage(1);
      else if (event.key === "Home") {
        stageIndex = 0;
        renderStage(-1);
      } else if (event.key === "End") {
        stageIndex = uiOrder.length - 1;
        renderStage(1);
      } else if (event.key === "Enter") chooseStage();
      else return;
      event.preventDefault();
      return;
    }
    if (
      (event.ctrlKey || event.metaKey) &&
      ["k", "p"].includes(event.key.toLowerCase())
    ) {
      event.preventDefault();
      commandOpen(true);
      return;
    }
    if (event.ctrlKey && event.key.toLowerCase() === "b") {
      event.preventDefault();
      $("#sidebar-toggle").click();
      return;
    }
    if (event.ctrlKey && ["1", "2", "3", "4"].includes(event.key)) {
      event.preventDefault();
      tab(["general", "visual", "misc", "settings"][Number(event.key) - 1]);
      return;
    }
    if (event.altKey && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      const pages = Object.keys(titles),
        index = pages.indexOf(state.activeTab),
        direction = event.key === "ArrowRight" ? 1 : -1;
      tab(pages[(index + direction + pages.length) % pages.length]);
      return;
    }
    if (
      event.key === "Escape" &&
      document.body.classList.contains("sidebar-mobile-open")
    )
      document.body.classList.remove("sidebar-mobile-open");
  },
  { capture: true },
);
$("#window-min").onclick = () => window.desktop?.minimize();
$("#window-max").onclick = () => window.desktop?.maximize();
$("#window-close").onclick = () => window.desktop?.close();
$(".topbar").ondblclick = (event) => {
  if (!event.target.closest("button")) window.desktop?.maximize();
};
const discordPresenceStatus = $("#discord-presence-status");
function showDiscordPresence(result = {}) {
  const message =
    result.message ||
    (state.discordPresence
      ? "Connecting to Discord…"
      : "Show Fractual in your Discord activity");
  discordPresenceStatus.textContent = message;
  discordPresenceStatus.dataset.state = result.state || "idle";
}
async function syncDiscordPresence() {
  showDiscordPresence({ state: "connecting" });
  if (!window.desktop?.presence) {
    showDiscordPresence({
      state: "desktop",
      message: state.discordPresence
        ? "Presence is saved for the desktop build"
        : "Show Fractual in your Discord activity",
    });
    return;
  }
  try {
    showDiscordPresence(
      await window.desktop.presence.setEnabled(state.discordPresence),
    );
  } catch {
    showDiscordPresence({
      state: "error",
      message: "Discord is not available right now",
    });
  }
}
async function setupDiscordPresence() {
  if (!window.desktop?.presence) {
    showDiscordPresence();
    return;
  }
  try {
    const status = await window.desktop.presence.getStatus();
    showDiscordPresence(status);
    if (state.discordPresence && !status.enabled) await syncDiscordPresence();
  } catch {
    showDiscordPresence({
      state: "error",
      message: "Discord is not available right now",
    });
  }
}
function finishBoot() {
  const boot = $("#boot-screen");
  boot.classList.add("complete");
  setTimeout(() => boot.setAttribute("aria-hidden", "true"), 500);
}
let networkContext = null,
  networkNodes = [],
  networkLinks = [],
  networkDpr = 1,
  networkPointer = { x: -9999, y: -9999 };
function resizeNetwork() {
  const canvas = $("#network-field");
  if (!canvas || !networkContext) return;
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return;
  networkDpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * networkDpr);
  canvas.height = Math.round(rect.height * networkDpr);
  const columns = Math.max(5, Math.ceil(rect.width / 175)),
    rows = Math.max(4, Math.ceil(rect.height / 145));
  networkNodes = [];
  networkLinks = [];
  for (let row = 0; row < rows; row++)
    for (let column = 0; column < columns; column++) {
      const index = row * columns + column;
      networkNodes.push({
        x:
          ((column + 0.5) * rect.width) / columns + Math.sin(index * 2.13) * 18,
        y: ((row + 0.5) * rect.height) / rows + Math.cos(index * 1.71) * 15,
        phase: index * 0.73,
      });
      if (column) networkLinks.push([index, index - 1]);
      if (row) networkLinks.push([index, index - columns]);
      if (row && column && (row + column) % 2 === 0)
        networkLinks.push([index, index - columns - 1]);
    }
}
function drawNetwork(now = 0) {
  const canvas = $("#network-field");
  if (!canvas || !networkContext) return;
  const width = canvas.width / networkDpr,
    height = canvas.height / networkDpr,
    reduced = document.body.classList.contains("reduced-motion"),
    time = reduced ? 0 : now * 0.00018,
    tone =
      getComputedStyle(document.body)
        .getPropertyValue("--network-rgb")
        .trim() || "145,150,146",
    strong = document.body.dataset.generation === "new";
  networkContext.setTransform(networkDpr, 0, 0, networkDpr, 0, 0);
  networkContext.clearRect(0, 0, width, height);
  const points = networkNodes.map((node) => {
    const x = node.x + Math.sin(time * 2.4 + node.phase) * 5,
      y = node.y + Math.cos(time * 1.9 + node.phase) * 4,
      distance = Math.hypot(networkPointer.x - x, networkPointer.y - y),
      pull = Math.max(0, 1 - distance / 210);
    return {
      x: x + (networkPointer.x - x) * pull * 0.035,
      y: y + (networkPointer.y - y) * pull * 0.035,
      pull,
    };
  });
  networkContext.lineWidth = 0.72;
  networkLinks.forEach(([a, b], index) => {
    const p = points[a],
      q = points[b],
      activity = Math.max(p.pull, q.pull),
      alpha =
        (strong ? 0.072 : 0.045) +
        activity * 0.075 +
        (index % 5 === 0 ? 0.018 : 0);
    networkContext.strokeStyle = `rgba(${tone},${alpha})`;
    networkContext.beginPath();
    networkContext.moveTo(p.x, p.y);
    const midX = (p.x + q.x) / 2,
      midY = (p.y + q.y) / 2;
    networkContext.quadraticCurveTo(
      midX + Math.sin(index * 0.9 + time) * 3,
      midY + Math.cos(index * 0.7 + time) * 3,
      q.x,
      q.y,
    );
    networkContext.stroke();
  });
  points.forEach((point, index) => {
    const alpha = (strong ? 0.16 : 0.1) + point.pull * 0.22;
    networkContext.fillStyle = `rgba(${tone},${alpha})`;
    networkContext.beginPath();
    networkContext.arc(
      point.x,
      point.y,
      index % 7 === 0 ? 1.35 : 0.85,
      0,
      Math.PI * 2,
    );
    networkContext.fill();
  });
  window.requestAnimationFrame(drawNetwork);
}
function setupNetwork() {
  if (navigator.userAgent.toLowerCase().includes("jsdom")) return;
  const canvas = $("#network-field");
  if (!canvas) return;
  try {
    networkContext = canvas.getContext("2d");
  } catch {
    return;
  }
  if (!networkContext) return;
  resizeNetwork();
  canvas.parentElement.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    networkPointer.x = event.clientX - rect.left;
    networkPointer.y = event.clientY - rect.top;
  });
  canvas.parentElement.addEventListener(
    "pointerleave",
    () => (networkPointer = { x: -9999, y: -9999 }),
  );
  new window.ResizeObserver(resizeNetwork).observe(canvas);
  window.requestAnimationFrame(drawNetwork);
}
document.addEventListener("click", (event) => {
  if (
    !event.target.closest(
      ".toggle,.checkbox,.wide-button,.nav,.theme,.cover-card,#stage-prev,#stage-next,#stage-apply",
    )
  )
    return;
  const brand = $(".brand");
  brand.classList.remove("brand-pulse");
  void brand.offsetWidth;
  brand.classList.add("brand-pulse");
  setTimeout(() => brand.classList.remove("brand-pulse"), 520);
});
window.addEventListener("resize", () => {
  if (window.innerWidth > 720)
    document.body.classList.remove("sidebar-mobile-open");
  resizeNetwork();
});
const updateAction = $("#update-action"),
  updateStatusText = $("#update-status"),
  updateChip = $("#update-chip");
let updaterState = "idle";
function showUpdate(status = {}) {
  updaterState = status.state || "idle";
  const labels = {
    idle: "AUTO",
    checking: "CHECKING",
    available: "FOUND",
    downloading: `${Math.round(status.percent || 0)}%`,
    downloaded: "RESTART",
    current: "CURRENT",
    error: "RETRY",
    disabled: "INSTALLER",
  };
  updateStatusText.textContent =
    status.message || "Updates check automatically";
  updateChip.textContent = labels[updaterState] || "AUTO";
  updateAction.className = `row update-row ${updaterState}`;
  updateAction.style.setProperty(
    "--update-progress",
    `${Math.max(0, Math.min(100, status.percent || 0))}%`,
  );
}
async function setupUpdates() {
  if (!window.desktop?.updates) {
    showUpdate({
      state: "disabled",
      message: "Install Fractual Setup once to enable automatic updates",
    });
    return;
  }
  window.desktop.updates.onStatus(showUpdate);
  showUpdate(await window.desktop.updates.getStatus());
}
updateAction.onclick = async () => {
  if (updaterState === "downloaded") {
    window.desktop?.updates?.install();
    return;
  }
  if (updaterState === "disabled") {
    toast("Use Fractual Setup once, then updates are automatic");
    return;
  }
  showUpdate({ state: "checking", message: "Checking for updates…" });
  try {
    await window.desktop?.updates?.check();
  } catch {
    showUpdate({
      state: "error",
      message: "Update check failed — click to retry",
    });
  }
};
apply();
applyUI();
syncVersion();
icons();
setupNetwork();
setupUpdates();
setupDiscordPresence();
(window.requestAnimationFrame || setTimeout)(() =>
  document.body.classList.add("booting"),
);
setTimeout(finishBoot, 1250);
