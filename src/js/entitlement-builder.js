// ABOUTME: Interactive entitlement builder widget for the OPE landing page.
// ABOUTME: Composes an entitlement claim from the 3 types (access, limit, status) per spec §10 and shows its JSON.

(function () {
  var root = document.getElementById("entitlement-builder");
  if (!root) return;

  // Color palette per type: emerald / amber / rose
  var COLORS = {
    access: { fg: "#059669", bg: "#ecfdf5", ring: "rgba(16,185,129,0.2)", text: "#065f46" },
    limit:  { fg: "#b45309", bg: "#fffbeb", ring: "rgba(245,158,11,0.2)", text: "#92400e" },
    status: { fg: "#e11d48", bg: "#fff1f2", ring: "rgba(244,63,94,0.2)",  text: "#9f1239" },
  };
  var NEUTRAL = { fg: "#52525b", bg: "#f4f4f5", ring: "rgba(24,24,27,0.1)", text: "#3f3f46" };

  // Values from spec §10.2. coverage is required on every type; kind is optional and extensible.
  var COVERAGES = ["item", "collection"];
  var DURATIONS = ["perpetual", "recurring", "time-limited", "rental"];
  var RENTAL_WINDOWS = { "24h": 24, "48h": 48, "72h": 72, "7d": 168 };
  var KINDS = {
    access: ["none", "pre-release"],
    limit: ["metered", "locale-gated"],
    status: ["ad-free", "patron", "group-member", "institutional"],
  };
  var QUOTAS = ["3", "5", "10"];
  var SOURCES = ["direct", "broker", "institution", "group"];

  // The 14 named aliases of spec §10.3. Names are for people; only the fields are protocol.
  var PRESETS = [
    { name: "Subscription",          desc: "Recurring access to everything a publisher offers", e: { type: "access", coverage: "collection", duration: "recurring",    source: "direct" } },
    { name: "Per-item purchase",     desc: "Buy one article or episode, keep it",               e: { type: "access", coverage: "item",       duration: "perpetual",    source: "direct" } },
    { name: "Rental",                desc: "One item for a set window",                         e: { type: "access", coverage: "item",       duration: "rental",       source: "direct", rental: "72h" } },
    { name: "Gift",                  desc: "One item, time-limited, transferable",              e: { type: "access", coverage: "item",       duration: "time-limited", source: "direct", transferable: true } },
    { name: "Trial",                 desc: "Time-limited access for new subscribers",           e: { type: "access", coverage: "collection", duration: "time-limited", source: "direct" } },
    { name: "Bundle",                desc: "An album, season, or course, kept for good",        e: { type: "access", coverage: "collection", duration: "perpetual",    source: "direct" } },
    { name: "Early access",          desc: "Pre-release items for a premium tier",              e: { type: "access", coverage: "collection", duration: "time-limited", source: "direct", kind: "pre-release" } },
    { name: "Broker bundle",         desc: "A subscription sold across many publishers",        e: { type: "access", coverage: "collection", duration: "recurring",    source: "broker" } },
    { name: "Institutional access",  desc: "A school or library buys seats (story S4)",         e: { type: "access", coverage: "collection", duration: "recurring",    source: "institution" } },
    { name: "Metered",               desc: "A few free items per month, counted by the server", e: { type: "limit",  coverage: "collection", kind: "metered", quota: "5", source: "direct" } },
    { name: "Institutional status",  desc: "Affiliation that changes treatment, not access",     e: { type: "status", coverage: "collection", kind: "institutional",   source: "institution" } },
    { name: "Group / family",        desc: "Membership in a household or group plan",          e: { type: "status", coverage: "collection", kind: "group-member",    source: "group" } },
    { name: "Patron",                desc: "A supporter, recognized by the publisher",         e: { type: "status", coverage: "collection", kind: "patron",          source: "direct" } },
    { name: "Ad-free",               desc: "Same content, no ads",                              e: { type: "status", coverage: "collection", kind: "ad-free",         source: "direct" } },
  ];

  var state = {
    e: assign({}, PRESETS[0].e),
    activePreset: PRESETS[0].name,
    view: "builder",
    copied: false,
  };

  function assign(target) {
    for (var i = 1; i < arguments.length; i++) {
      var src = arguments[i];
      for (var k in src) {
        if (Object.prototype.hasOwnProperty.call(src, k)) target[k] = src[k];
      }
    }
    return target;
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // Build the entitlement claim (spec §10.2) in the order the spec's table lists fields.
  function toClaim(e) {
    var o = { type: e.type, coverage: e.coverage };
    if (e.kind && e.kind !== "none") o.kind = e.kind;
    if (e.type === "access") {
      if (e.duration) o.duration = e.duration;
      if (e.duration === "rental") {
        var hours = RENTAL_WINDOWS[e.rental || "72h"];
        o.rental_expires_at = Math.floor(Date.now() / 1000) + hours * 3600;
      }
      if (e.transferable) o.transferable = true;
    }
    if (e.type === "limit" && e.quota) {
      o.quota = parseInt(e.quota, 10);
      o.period = "P1M";
    }
    o.source = e.source;
    if (e.source === "institution" || e.source === "group") o.group_id = "grp_example";
    return o;
  }

  function toJSON(e) {
    return JSON.stringify({ entitlement: toClaim(e) }, null, 2);
  }

  function findPreset(e) {
    for (var i = 0; i < PRESETS.length; i++) {
      var p = PRESETS[i].e;
      if (p.type === e.type && p.coverage === e.coverage
        && (p.kind || "none") === (e.kind || "none")
        && (p.duration || "") === (e.type === "access" ? e.duration || "" : "")
        && (p.quota || "") === (e.type === "limit" ? e.quota || "" : "")
        && p.source === e.source
        && !!p.transferable === !!e.transferable) {
        return PRESETS[i];
      }
    }
    return null;
  }

  function colorJSON(json) {
    return json.split("\n").map(function (line) {
      var km = line.match(/^(\s*)"([^"]+)":/);
      var vs = line.match(/: "([^"]+)"(.*)$/);
      var vn = line.match(/: (\d+)(.*)$/);
      var vb = line.match(/: (true|false)(.*)$/);
      if (!km) return '<span style="color:#a1a1aa">' + esc(line) + "</span>";
      var indent = esc(line.slice(0, km.index + km[1].length));
      var key = '<span style="color:#34d399">"' + esc(km[2]) + '"</span><span style="color:#a1a1aa">: </span>';
      // Keep whatever follows the value (a trailing comma) so the shown JSON stays valid.
      var rest = function (m) { return '<span style="color:#a1a1aa">' + esc(m[2]) + "</span>"; };
      var val = vs ? '<span style="color:#fcd34d">"' + esc(vs[1]) + '"</span>' + rest(vs)
        : vn ? '<span style="color:#7dd3fc">' + vn[1] + "</span>" + rest(vn)
        : vb ? '<span style="color:#fb7185">' + vb[1] + "</span>" + rest(vb)
        : '<span style="color:#d4d4d8">' + esc(line.slice(line.indexOf(":") + 2)) + "</span>";
      return indent + key + val;
    }).join("\n");
  }

  // Global handlers (called from onclick attributes)
  window._eb = {
    loadPreset: function (i) {
      state.e = assign({}, PRESETS[i].e);
      state.activePreset = PRESETS[i].name;
      state.view = "builder";
      render();
    },
    setType: function (t) {
      var defaults = {
        access: { type: "access", coverage: "collection", duration: "recurring", source: "direct" },
        limit: { type: "limit", coverage: "collection", kind: "metered", quota: "5", source: "direct" },
        status: { type: "status", coverage: "collection", kind: "ad-free", source: "direct" },
      };
      state.e = assign({}, defaults[t]);
      state.activePreset = null;
      render();
    },
    setField: function (k, v) {
      state.e = assign({}, state.e);
      state.e[k] = v;
      state.activePreset = null;
      render();
    },
    toggleXfer: function () {
      state.e = assign({}, state.e);
      state.e.transferable = !state.e.transferable;
      state.activePreset = null;
      render();
    },
    setView: function (v) {
      state.view = v;
      render();
    },
    copy: function () {
      navigator.clipboard.writeText(toJSON(state.e));
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
    return '<button onclick="' + esc(onclick) + '"' + ariaPressed + ' class="rounded-full px-3 py-1 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-900/10 hover:text-zinc-900 hover:ring-zinc-900/20 transition-colors">' + esc(label) + "</button>";
  }

  function fieldGroup(label, items, active, fnTpl, col) {
    var c = col || COLORS[state.e.type];
    var tags = items.map(function (v) {
      return pill(v, v === active, c, fnTpl.replace("{v}", v));
    }).join("");
    return '<div class="mb-5" role="group" aria-label="' + esc(label) + '"><div class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">' + esc(label) + '</div><div class="flex flex-wrap gap-1.5">' + tags + "</div></div>";
  }

  function render() {
    var e = state.e;
    var col = COLORS[e.type];
    var json = toJSON(e);
    var match = findPreset(e);

    var tabs = '<div class="flex gap-2 mb-8" role="tablist" aria-label="Entitlement builder views">'
      + '<button onclick="_eb.setView(\'builder\')" role="tab" aria-selected="' + (state.view === "builder") + '" class="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors '
      + (state.view === "builder" ? "bg-zinc-900 text-white" : "text-zinc-600 ring-1 ring-inset ring-zinc-900/10 hover:text-zinc-900") + '">Builder</button>'
      + '<button onclick="_eb.setView(\'examples\')" role="tab" aria-selected="' + (state.view === "examples") + '" class="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors '
      + (state.view === "examples" ? "bg-zinc-900 text-white" : "text-zinc-600 ring-1 ring-inset ring-zinc-900/10 hover:text-zinc-900") + '">All ' + PRESETS.length + " Presets</button>"
      + "</div>";

    if (state.view === "examples") {
      root.innerHTML = tabs + renderExamples();
      return;
    }

    var chips = PRESETS.map(function (p, i) {
      return pill(p.name, state.activePreset === p.name, COLORS[p.e.type], "_eb.loadPreset(" + i + ")");
    }).join("");

    var typeBtns = ["access", "limit", "status"].map(function (t) {
      var on = e.type === t;
      if (on) {
        return '<button onclick="_eb.setType(\'' + t + '\')" aria-pressed="true" class="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors" style="background:' + COLORS[t].fg + ';color:#fff">' + t + "</button>";
      }
      return '<button onclick="_eb.setType(\'' + t + '\')" aria-pressed="false" class="rounded-full px-3.5 py-1.5 text-xs font-semibold text-zinc-600 ring-1 ring-inset ring-zinc-900/10 hover:text-zinc-900 transition-colors">' + t + "</button>";
    }).join("");

    var fields = '<div class="mb-5" role="group" aria-label="Type"><div class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Type</div><div class="flex flex-wrap gap-1.5">' + typeBtns + "</div></div>";
    fields += '<div class="h-px bg-zinc-900/5 my-5"></div>';
    fields += fieldGroup("Coverage", COVERAGES, e.coverage, "_eb.setField('coverage','{v}')");
    fields += fieldGroup("Kind", KINDS[e.type], e.kind || "none", "_eb.setField('kind','{v}')");

    if (e.type === "access") {
      fields += fieldGroup("Duration", DURATIONS, e.duration, "_eb.setField('duration','{v}')");
      if (e.duration === "rental") {
        fields += fieldGroup("Rental window", Object.keys(RENTAL_WINDOWS), e.rental || "72h", "_eb.setField('rental','{v}')");
      }
      fields += '<div class="mb-5" role="group" aria-label="Options"><div class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Options</div><div class="flex flex-wrap gap-1.5">';
      fields += pill("transferable", !!e.transferable, col, "_eb.toggleXfer()");
      fields += "</div></div>";
    }
    if (e.type === "limit") {
      fields += fieldGroup("Quota per month", QUOTAS, e.quota, "_eb.setField('quota','{v}')");
    }

    fields += '<div class="h-px bg-zinc-900/5 my-5"></div>';
    fields += fieldGroup("Source", SOURCES, e.source, "_eb.setField('source','{v}')", NEUTRAL);

    var badge = '<div class="rounded-2xl p-5 transition-all" style="background:' + (match ? col.bg : "#fff") + ";border:1px solid " + (match ? col.ring : "rgba(24,24,27,0.08)") + '">'
      + '<div class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Recognized as</div>'
      + '<div class="text-lg font-semibold tracking-tight" style="color:' + (match ? col.fg : "#52525b") + '">' + (match ? esc(match.name) : "Custom entitlement") + "</div>"
      + '<div class="text-xs mt-1" style="color:' + (match ? col.text : "#52525b") + '">' + (match ? esc(match.desc) : "A valid combination, just not one of the named aliases") + "</div>"
      + "</div>";

    var jsonPanel = '<div class="bg-zinc-900 rounded-2xl overflow-hidden relative" aria-label="Entitlement claim JSON" role="region">'
      + '<div class="flex items-center gap-2 px-4 py-3 border-b border-white/5">'
      + '<span class="w-2 h-2 rounded-full bg-white/10"></span>'
      + '<span class="w-2 h-2 rounded-full bg-white/10"></span>'
      + '<span class="w-2 h-2 rounded-full bg-white/10"></span>'
      + '<span class="ml-2 text-zinc-400 text-xs font-[family-name:var(--font-mono)]">entitlement claim</span>'
      + '<button onclick="_eb.copy()" aria-label="Copy JSON to clipboard" class="ml-auto text-xs font-[family-name:var(--font-mono)] px-2 py-0.5 rounded transition-colors '
      + (state.copied ? "text-emerald-400 bg-emerald-400/10" : "text-zinc-400 hover:text-zinc-200") + '">'
      + (state.copied ? "Copied" : "Copy") + "</button>"
      + "</div>"
      + '<pre class="p-5 overflow-x-auto m-0 text-zinc-300 leading-relaxed text-xs font-[family-name:var(--font-mono)]" tabindex="0">' + colorJSON(json) + "</pre>"
      + "</div>";

    var explTexts = {
      access: '<span class="font-semibold" style="color:' + col.fg + '">access</span> lets a person have the item, or everything in a collection. Coverage says which: the token\'s <code>resource</code> is one item or a scope. A rental ends at <code>rental_expires_at</code>, which the publisher\'s server enforces.',
      limit: '<span class="font-semibold" style="color:' + col.fg + '">limit</span> allows items up to a quota per period. The publisher\'s server keeps the count; the token only says what the quota is.',
      status: '<span class="font-semibold" style="color:' + col.fg + '">status</span> is a standing, like ad-free or patron. It unlocks nothing by itself: the publisher decides what it changes, such as dropping ads.',
    };
    var explainer = '<div class="rounded-2xl border border-zinc-900/5 p-4 text-xs text-zinc-600 leading-relaxed">' + explTexts[e.type]
      + (e.source === "institution" || e.source === "group" ? ' <code>group_id</code> names the paying group; its value here is a placeholder.' : "")
      + "</div>";

    root.innerHTML = tabs
      + '<div class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Start from a preset</div>'
      + '<div class="flex flex-wrap gap-1.5 mb-8">' + chips + "</div>"
      + '<div class="grid grid-cols-1 lg:grid-cols-2 gap-5">'
      + '<div class="rounded-2xl border border-zinc-900/5 p-6">' + fields + "</div>"
      + '<div class="flex flex-col gap-4">' + badge + jsonPanel + explainer + "</div>"
      + "</div>";
  }

  function renderExamples() {
    var html = '<p class="text-sm text-zinc-600 leading-relaxed mb-6">All ' + PRESETS.length + ' named aliases from the specification, as combinations of the 3 types. Click any row to load it into the builder.</p>';

    html += '<div class="rounded-2xl border border-zinc-900/5 overflow-hidden">';
    html += '<div class="hidden sm:grid grid-cols-[170px_1fr_72px_96px_110px_100px_90px] gap-2 px-5 py-3 border-b border-zinc-900/5 bg-zinc-50/50">';
    ["Name", "Description", "Type", "Coverage", "Kind", "Duration", "Source"].forEach(function (h) {
      html += '<span class="text-xs font-medium text-zinc-500 uppercase tracking-wider">' + h + "</span>";
    });
    html += "</div>";

    PRESETS.forEach(function (p, i) {
      var c = COLORS[p.e.type];
      var isActive = state.activePreset === p.name;
      html += '<div onclick="_eb.loadPreset(' + i + ')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();_eb.loadPreset(' + i + ')}" tabindex="0" role="button" aria-label="Load ' + esc(p.name) + ' preset" class="cursor-pointer border-b border-zinc-900/5 last:border-b-0 transition-colors hover:bg-zinc-50" style="background:' + (isActive ? c.bg : "#fff") + '">';

      html += '<div class="hidden sm:grid grid-cols-[170px_1fr_72px_96px_110px_100px_90px] gap-2 px-5 py-3 items-center">';
      html += '<div class="flex items-center gap-2">';
      html += '<span class="w-1.5 h-1.5 rounded-full shrink-0" aria-hidden="true" style="background:' + (isActive ? c.fg : "#a1a1aa") + '"></span>';
      html += '<span class="text-sm font-medium" style="color:' + (isActive ? c.fg : "#3f3f46") + '">' + esc(p.name) + "</span></div>";
      html += '<span class="text-xs text-zinc-600 truncate">' + esc(p.desc) + "</span>";
      html += '<span class="text-xs font-medium rounded-full px-2 py-0.5 justify-self-start" style="background:' + c.bg + ";color:" + c.text + '">' + esc(p.e.type) + "</span>";
      html += '<span class="text-xs text-zinc-600 font-[family-name:var(--font-mono)]">' + esc(p.e.coverage) + "</span>";
      html += '<span class="text-xs text-zinc-600 font-[family-name:var(--font-mono)]">' + esc(p.e.kind || "—") + (p.e.transferable ? " · xfer" : "") + "</span>";
      html += '<span class="text-xs text-zinc-600">' + esc(p.e.duration || "—") + "</span>";
      html += '<span class="text-xs text-zinc-600">' + esc(p.e.source) + "</span>";
      html += "</div>";

      html += '<div class="sm:hidden px-5 py-3">';
      html += '<div class="flex items-center gap-2 mb-1">';
      html += '<span class="w-1.5 h-1.5 rounded-full shrink-0" aria-hidden="true" style="background:' + (isActive ? c.fg : "#a1a1aa") + '"></span>';
      html += '<span class="text-sm font-medium" style="color:' + (isActive ? c.fg : "#3f3f46") + '">' + esc(p.name) + "</span>";
      html += '<span class="text-xs font-medium rounded-full px-2 py-0.5 ml-auto" style="background:' + c.bg + ";color:" + c.text + '">' + esc(p.e.type) + "</span>";
      html += "</div>";
      html += '<div class="text-xs text-zinc-600 ml-3.5">' + esc(p.desc) + "</div>";
      html += "</div>";

      html += "</div>";
    });

    html += "</div>";
    return html;
  }

  render();
})();
