// ABOUTME: Interactive grant builder widget for the OPE landing page.
// ABOUTME: Lets users compose grants from 3 primitives (access, limit, signal) and see JSON output.

(function () {
  var root = document.getElementById("grant-builder");
  if (!root) return;

  // Color palette per primitive — emerald / amber / rose
  var COLORS = {
    access: { fg: "#10b981", bg: "#ecfdf5", ring: "rgba(16,185,129,0.2)", text: "#065f46" },
    limit:  { fg: "#f59e0b", bg: "#fffbeb", ring: "rgba(245,158,11,0.2)", text: "#92400e" },
    signal: { fg: "#f43f5e", bg: "#fff1f2", ring: "rgba(244,63,94,0.2)",  text: "#9f1239" },
  };

  var TYPES = {
    access: { label: "access", desc: "Reader may view this content", scopes: ["all", "item", "collection", "pre-release"], durations: ["perpetual", "recurring", "time-limited", "rental"] },
    limit:  { label: "limit",  desc: "Reader may view up to a threshold", kinds: ["metered", "locale-gated", "time-windowed"], quotas: ["3 / month", "5 / month", "10 / month", "unlimited"] },
    signal: { label: "signal", desc: "Reader has a status that unlocks treatment", kinds: ["ad-free", "group-member", "institutional", "patron", "early-access"] },
  };

  var SOURCES = ["direct", "broker", "institution", "family-plan"];

  var PRESETS = [
    { name: "Subscription",  desc: "Recurring access to all content",            grant: { type: "access", scope: "all",         duration: "recurring",    source: "direct" } },
    { name: "Per-item",      desc: "Pay per article or episode",                 grant: { type: "access", scope: "item",        duration: "perpetual",    source: "direct" } },
    { name: "Gift",          desc: "Shareable unlock link, time-limited",        grant: { type: "access", scope: "item",        duration: "time-limited", source: "direct", transferable: true } },
    { name: "Institutional", desc: "Libraries, universities, organizations",     grant: { type: "signal", kind: "institutional",                          source: "institution" } },
    { name: "Metered",       desc: "Free content limits with meter tracking",    grant: { type: "limit",  kind: "metered",      quota: "5 / month",      source: "direct" } },
    { name: "Locale-free",   desc: "Regional free access by user locale",        grant: { type: "limit",  kind: "locale-gated",                          source: "direct" } },
    { name: "Patronage",     desc: "Voluntary support, optional full access",    grant: { type: "signal", kind: "patron",                                source: "direct" } },
    { name: "Broker",        desc: "Multi-publisher bundles via brokers",        grant: { type: "access", scope: "collection",  duration: "recurring",    source: "broker" } },
    { name: "Trial",         desc: "Time-limited free access for new users",     grant: { type: "access", scope: "all",         duration: "time-limited", source: "direct" } },
    { name: "Rental",        desc: "Temporary access to specific content",       grant: { type: "access", scope: "item",        duration: "rental",       source: "direct", rentalHours: "72" } },
    { name: "Bundle",        desc: "Album, season, or course collection",        grant: { type: "access", scope: "collection",  duration: "perpetual",    source: "direct" } },
    { name: "Ad-supported",  desc: "Free with ads; signals ad-free tier status", grant: { type: "signal", kind: "ad-free",                               source: "direct" } },
    { name: "Early access",  desc: "Pre-release content for premium tiers",      grant: { type: "access", scope: "pre-release", duration: "time-limited", source: "direct" } },
    { name: "Family",        desc: "Shared group or household access",           grant: { type: "signal", kind: "group-member",                          source: "family-plan" } },
  ];

  var state = {
    grant: assign({}, PRESETS[0].grant),
    activePreset: "Subscription",
    view: "builder",
    copied: false,
  };

  function assign(target) {
    for (var i = 1; i < arguments.length; i++) {
      var src = arguments[i];
      for (var k in src) {
        if (src.hasOwnProperty(k)) target[k] = src[k];
      }
    }
    return target;
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function toJSON(g) {
    var o = { type: g.type };
    if (g.type === "access") {
      if (g.scope) o.scope = g.scope;
      if (g.duration) o.duration = g.duration === "rental" ? "rental:" + (g.rentalHours || 72) + "h" : g.duration;
      if (g.transferable) o.transferable = true;
    } else if (g.type === "limit") {
      if (g.kind) o.kind = g.kind;
      if (g.quota) { o.quota = parseInt(g.quota); o.period = "month"; }
    } else if (g.type === "signal") {
      if (g.kind) o.kind = g.kind;
    }
    if (g.source) o.source = g.source;
    return JSON.stringify(o, null, 2);
  }

  function findPreset(g) {
    for (var i = 0; i < PRESETS.length; i++) {
      var a = PRESETS[i].grant;
      if (a.type === g.type && (a.scope || "") === (g.scope || "") && (a.kind || "") === (g.kind || "")
        && (a.duration || "") === (g.duration || "") && (a.source || "") === (g.source || "")
        && !!a.transferable === !!g.transferable) {
        return PRESETS[i];
      }
    }
    return null;
  }

  function colorJSON(json, col) {
    return json.split("\n").map(function (line) {
      var km = line.match(/^(\s*)"([^"]+)":/);
      var vs = line.match(/: "([^"]+)"/);
      var vn = line.match(/: (\d+)/);
      var vb = line.match(/: (true|false)/);
      if (!km) return '<span style="color:#71717a">' + esc(line) + "</span>";
      var indent = esc(line.slice(0, km.index + km[1].length));
      var key = '<span style="color:#34d399">"' + esc(km[2]) + '"</span><span style="color:#71717a">: </span>';
      var val = vs ? '<span style="color:#fcd34d">"' + esc(vs[1]) + '"</span>'
        : vn ? '<span style="color:#7dd3fc">' + vn[1] + "</span>"
        : vb ? '<span style="color:#fb7185">' + vb[1] + "</span>"
        : '<span style="color:#a1a1aa">' + esc(line.slice(line.indexOf(":") + 1)) + "</span>";
      return '<span style="color:#52525b">' + indent + "</span>" + key + val;
    }).join("\n");
  }

  // Global handlers (called from onclick attrs)
  window._gb = {
    loadPreset: function (i) {
      state.grant = assign({}, PRESETS[i].grant);
      state.activePreset = PRESETS[i].name;
      state.view = "builder";
      render();
    },
    setType: function (t) {
      state.grant = { type: t, source: "direct" };
      state.activePreset = null;
      render();
    },
    setField: function (k, v) {
      state.grant = assign({}, state.grant);
      state.grant[k] = v;
      state.activePreset = null;
      render();
    },
    toggleXfer: function () {
      state.grant = assign({}, state.grant);
      state.grant.transferable = !state.grant.transferable;
      state.activePreset = null;
      render();
    },
    setView: function (v) {
      state.view = v;
      render();
    },
    copy: function () {
      navigator.clipboard.writeText(toJSON(state.grant));
      state.copied = true;
      render();
      setTimeout(function () { state.copied = false; render(); }, 1500);
    },
  };

  function pill(label, active, color, onclick) {
    var ariaPressed = ' aria-pressed="' + (active ? "true" : "false") + '"';
    if (active) {
      return '<button onclick="' + esc(onclick) + '"' + ariaPressed + ' class="rounded-full px-3 py-1 text-xs font-medium transition-colors" style="background:' + color.bg + ";color:" + color.text + ";box-shadow:inset 0 0 0 1px " + color.ring + '">' + esc(label) + "</button>";
    }
    return '<button onclick="' + esc(onclick) + '"' + ariaPressed + ' class="rounded-full px-3 py-1 text-xs font-medium text-zinc-500 ring-1 ring-inset ring-zinc-900/10 hover:text-zinc-900 hover:ring-zinc-900/20 transition-colors">' + esc(label) + "</button>";
  }

  function fieldGroup(label, items, active, fnTpl, col) {
    var c = col || COLORS[state.grant.type];
    var tags = items.map(function (v) {
      return pill(v, v === active, c, fnTpl.replace("{v}", v));
    }).join("");
    return '<div class="mb-5" role="group" aria-label="' + esc(label) + '"><div class="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">' + label + '</div><div class="flex flex-wrap gap-1.5">' + tags + "</div></div>";
  }

  function render() {
    var g = state.grant;
    var col = COLORS[g.type];
    var def = TYPES[g.type];
    var json = toJSON(g);
    var match = findPreset(g);

    // Tab buttons
    var tabs = '<div class="flex gap-2 mb-8" role="tablist" aria-label="Grant builder views">'
      + '<button onclick="_gb.setView(\'builder\')" role="tab" aria-selected="' + (state.view === "builder") + '" class="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors '
      + (state.view === "builder" ? "bg-zinc-900 text-white" : "text-zinc-500 ring-1 ring-inset ring-zinc-900/10 hover:text-zinc-900") + '">Builder</button>'
      + '<button onclick="_gb.setView(\'examples\')" role="tab" aria-selected="' + (state.view === "examples") + '" class="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors '
      + (state.view === "examples" ? "bg-zinc-900 text-white" : "text-zinc-500 ring-1 ring-inset ring-zinc-900/10 hover:text-zinc-900") + '">All 14 Presets</button>'
      + "</div>";

    if (state.view === "examples") {
      root.innerHTML = tabs + renderExamples();
      return;
    }

    // Preset chips
    var chips = PRESETS.map(function (p, i) {
      var isActive = state.activePreset === p.name;
      var c = COLORS[p.grant.type];
      return pill(p.name, isActive, c, "_gb.loadPreset(" + i + ")");
    }).join("");

    // Type selector
    var typeBtns = ["access", "limit", "signal"].map(function (t) {
      var on = g.type === t;
      var c = COLORS[t];
      if (on) {
        return '<button onclick="_gb.setType(\'' + t + '\')" class="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors" style="background:' + c.fg + ';color:#fff">' + t + "</button>";
      }
      return '<button onclick="_gb.setType(\'' + t + '\')" class="rounded-full px-3.5 py-1.5 text-xs font-semibold text-zinc-400 ring-1 ring-inset ring-zinc-900/10 hover:text-zinc-900 transition-colors">' + t + "</button>";
    }).join("");

    // Build fields
    var fields = '<div class="mb-5"><div class="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Primitive</div><div class="flex flex-wrap gap-1.5">' + typeBtns + "</div></div>";
    fields += '<div class="h-px bg-zinc-900/5 my-5"></div>';

    if (g.type === "access") {
      fields += fieldGroup("Scope", def.scopes, g.scope, "_gb.setField('scope','{v}')");
      fields += fieldGroup("Duration", def.durations, g.duration, "_gb.setField('duration','{v}')");
      if (g.duration === "rental") {
        fields += fieldGroup("Rental Window", ["24h", "48h", "72h", "168h"], (g.rentalHours || "72") + "h", "_gb.setField('rentalHours','{v}'.replace('h',''))");
      }
      var xferCol = g.transferable ? col : { bg: "transparent", text: "#a1a1aa", ring: "rgba(24,24,27,0.1)" };
      fields += '<div class="mb-5"><div class="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Options</div><div class="flex flex-wrap gap-1.5">';
      fields += pill("transferable", !!g.transferable, col, "_gb.toggleXfer()");
      fields += "</div></div>";
    }
    if (g.type === "limit" || g.type === "signal") {
      fields += fieldGroup("Kind", def.kinds, g.kind, "_gb.setField('kind','{v}')");
    }
    if (g.type === "limit") {
      fields += fieldGroup("Quota", def.quotas, g.quota, "_gb.setField('quota','{v}')");
    }

    fields += '<div class="h-px bg-zinc-900/5 my-5"></div>';
    fields += fieldGroup("Source", SOURCES, g.source, "_gb.setField('source','{v}')", { fg: "#71717a", bg: "#f4f4f5", ring: "rgba(24,24,27,0.1)", text: "#3f3f46" });

    // Badge
    var badge = '<div class="rounded-2xl p-5 transition-all" style="background:' + (match ? col.bg : "#fff") + ";border:1px solid " + (match ? col.ring : "rgba(24,24,27,0.05)") + '">'
      + '<div class="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Recognized as</div>'
      + '<div class="text-lg font-semibold tracking-tight" style="color:' + (match ? col.fg : "#d4d4d8") + '">' + (match ? esc(match.name) : "Custom Grant") + "</div>"
      + '<div class="text-xs mt-1" style="color:' + (match ? col.text : "#d4d4d8") + '">' + (match ? esc(match.desc) : "Valid combination — not a named preset") + "</div>"
      + "</div>";

    // JSON panel — matches site code block style
    var jsonPanel = '<div class="bg-zinc-900 rounded-2xl overflow-hidden relative" aria-label="Grant JSON output" role="region">'
      + '<div class="flex items-center gap-2 px-4 py-3 border-b border-white/5">'
      + '<span class="w-2 h-2 rounded-full bg-white/10"></span>'
      + '<span class="w-2 h-2 rounded-full bg-white/10"></span>'
      + '<span class="w-2 h-2 rounded-full bg-white/10"></span>'
      + '<span class="ml-2 text-zinc-500 text-xs font-[family-name:var(--font-mono)]">grant object</span>'
      + '<button onclick="_gb.copy()" aria-label="Copy JSON to clipboard" class="ml-auto text-xs font-[family-name:var(--font-mono)] px-2 py-0.5 rounded transition-colors '
      + (state.copied ? "text-emerald-400 bg-emerald-400/10" : "text-zinc-500 hover:text-zinc-300") + '">'
      + (state.copied ? "Copied" : "Copy") + "</button>"
      + "</div>"
      + '<pre class="p-5 overflow-x-auto m-0 text-zinc-300 leading-relaxed text-xs font-[family-name:var(--font-mono)]">' + colorJSON(json, col.fg) + "</pre>"
      + "</div>";

    // Explainer
    var explTexts = {
      access: '<span class="font-semibold" style="color:' + col.fg + '">access</span> grants let readers view content. Scope defines what, duration defines how long, source defines who issued it.',
      limit: '<span class="font-semibold" style="color:' + col.fg + '">limit</span> grants allow conditional access up to a threshold — metered by count, locale, or time window.',
      signal: '<span class="font-semibold" style="color:' + col.fg + '">signal</span> grants communicate reader status — unlocking treatment like ad-free rendering or group membership.',
    };
    var explainer = '<div class="rounded-2xl border border-zinc-900/5 p-4 text-xs text-zinc-500 leading-relaxed">' + explTexts[g.type] + "</div>";

    root.innerHTML = tabs
      + '<div class="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Start from a preset</div>'
      + '<div class="flex flex-wrap gap-1.5 mb-8">' + chips + "</div>"
      + '<div class="grid grid-cols-1 lg:grid-cols-2 gap-5">'
      + '<div class="rounded-2xl border border-zinc-900/5 p-6">' + fields + "</div>"
      + '<div class="flex flex-col gap-4">' + badge + jsonPanel + explainer + "</div>"
      + "</div>";
  }

  function renderExamples() {
    var html = '<p class="text-sm text-zinc-600 leading-relaxed mb-6">All 14 named grant types as combinations of the 3 primitives. Click any row to load it into the builder.</p>';

    // Table header
    html += '<div class="rounded-2xl border border-zinc-900/5 overflow-hidden">';
    html += '<div class="hidden sm:grid grid-cols-[140px_1fr_72px_140px_110px_80px] gap-2 px-5 py-3 border-b border-zinc-900/5 bg-zinc-50/50">';
    html += '<span class="text-xs font-medium text-zinc-400 uppercase tracking-wider">Name</span>';
    html += '<span class="text-xs font-medium text-zinc-400 uppercase tracking-wider">Description</span>';
    html += '<span class="text-xs font-medium text-zinc-400 uppercase tracking-wider">Type</span>';
    html += '<span class="text-xs font-medium text-zinc-400 uppercase tracking-wider">Scope / Kind</span>';
    html += '<span class="text-xs font-medium text-zinc-400 uppercase tracking-wider">Duration</span>';
    html += '<span class="text-xs font-medium text-zinc-400 uppercase tracking-wider">Source</span>';
    html += "</div>";

    // Rows
    PRESETS.forEach(function (p, i) {
      var c = COLORS[p.grant.type];
      var isActive = state.activePreset === p.name;
      var bg = isActive ? c.bg : "#fff";

      // Mobile: stacked layout. Desktop: grid
      html += '<div onclick="_gb.loadPreset(' + i + ')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();_gb.loadPreset(' + i + ')}" tabindex="0" role="button" aria-label="Load ' + esc(p.name) + ' preset" class="cursor-pointer border-b border-zinc-900/5 last:border-b-0 transition-colors hover:bg-zinc-50" style="background:' + bg + '">';

      // Desktop row
      html += '<div class="hidden sm:grid grid-cols-[140px_1fr_72px_140px_110px_80px] gap-2 px-5 py-3 items-center">';
      html += '<div class="flex items-center gap-2">';
      html += '<span class="w-1.5 h-1.5 rounded-full shrink-0" style="background:' + (isActive ? c.fg : "#d4d4d8") + '"></span>';
      html += '<span class="text-sm font-medium" style="color:' + (isActive ? c.fg : "#3f3f46") + '">' + esc(p.name) + "</span></div>";
      html += '<span class="text-xs text-zinc-400 truncate">' + esc(p.desc) + "</span>";
      html += '<span class="text-xs font-medium rounded-full px-2 py-0.5" style="background:' + c.bg + ";color:" + c.text + '">' + esc(p.grant.type) + "</span>";
      html += '<span class="text-xs text-zinc-500 font-[family-name:var(--font-mono)]">' + esc(p.grant.scope || p.grant.kind || "\u2014") + (p.grant.transferable ? " \u00b7 xfer" : "") + "</span>";
      html += '<span class="text-xs text-zinc-400">' + esc(p.grant.duration || "\u2014") + "</span>";
      html += '<span class="text-xs text-zinc-400">' + esc(p.grant.source) + "</span>";
      html += "</div>";

      // Mobile row
      html += '<div class="sm:hidden px-5 py-3">';
      html += '<div class="flex items-center gap-2 mb-1">';
      html += '<span class="w-1.5 h-1.5 rounded-full shrink-0" style="background:' + (isActive ? c.fg : "#d4d4d8") + '"></span>';
      html += '<span class="text-sm font-medium" style="color:' + (isActive ? c.fg : "#3f3f46") + '">' + esc(p.name) + "</span>";
      html += '<span class="text-xs font-medium rounded-full px-2 py-0.5 ml-auto" style="background:' + c.bg + ";color:" + c.text + '">' + esc(p.grant.type) + "</span>";
      html += "</div>";
      html += '<div class="text-xs text-zinc-400 ml-3.5">' + esc(p.desc) + "</div>";
      html += "</div>";

      html += "</div>";
    });

    html += "</div>";
    return html;
  }

  render();
})();
