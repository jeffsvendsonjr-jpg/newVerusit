console.log("VerusIT: Content Freshness Engine v1.0");

const TECH_SIGNALS = [
  { pattern: "\\bconst\\b", weight: 1, category: "modern", tag: "const" },
  { pattern: "\\blet\\b", weight: 1, category: "modern", tag: "let" },
  { pattern: "\\buseState\\b", weight: 3, category: "modern", tag: "useState" },
  { pattern: "\\buseEffect\\b", weight: 3, category: "modern", tag: "useEffect" },
  { pattern: "\\buseRef\\b", weight: 3, category: "modern", tag: "useRef" },
  { pattern: "\\buseMemo\\b", weight: 3, category: "modern", tag: "useMemo" },
  { pattern: "\\buseCallback\\b", weight: 3, category: "modern", tag: "useCallback" },
  { pattern: "=>", weight: 1, category: "modern", tag: "arrow fn" },
  { pattern: "\\basync\\b", weight: 2, category: "modern", tag: "async" },
  { pattern: "\\bawait\\b", weight: 2, category: "modern", tag: "await" },
  { pattern: "\\bimport\\b.*\\bfrom\\b", weight: 2, category: "modern", tag: "ES modules" },
  { pattern: "\\bexport\\s+(default|const|function)\\b", weight: 2, category: "modern", tag: "ES export" },
  { pattern: "\\bTypeScript\\b", weight: 2, category: "modern", tag: "TypeScript" },
  { pattern: "\\.tsx?\\b", weight: 1, category: "modern", tag: ".ts/.tsx" },
  { pattern: "\\bNext\\.?js\\b", weight: 3, category: "modern", tag: "Next.js" },
  { pattern: "\\bReact\\b", weight: 2, category: "modern", tag: "React" },
  { pattern: "\\bVue\\s*3\\b", weight: 3, category: "modern", tag: "Vue 3" },
  { pattern: "\\bSvelte\\b", weight: 3, category: "modern", tag: "Svelte" },
  { pattern: "\\bDeno\\b", weight: 3, category: "modern", tag: "Deno" },
  { pattern: "\\bBun\\b", weight: 2, category: "modern", tag: "Bun" },
  { pattern: "\\btailwind\\b", weight: 2, category: "modern", tag: "Tailwind" },
  { pattern: "\\bprisma\\b", weight: 2, category: "modern", tag: "Prisma" },
  { pattern: "\\bdrizzle\\b", weight: 2, category: "modern", tag: "Drizzle" },
  { pattern: "\\bRust\\b", weight: 2, category: "modern", tag: "Rust" },
  { pattern: "\\bGo\\b(?!ogle)", weight: 1, category: "modern", tag: "Go" },
  { pattern: "\\bDocker\\b", weight: 1, category: "modern", tag: "Docker" },
  { pattern: "\\bGraphQL\\b", weight: 2, category: "modern", tag: "GraphQL" },
  { pattern: "\\btRPC\\b", weight: 3, category: "modern", tag: "tRPC" },
  { pattern: "\\bZod\\b", weight: 2, category: "modern", tag: "Zod" },
  { pattern: "fetch\\(", weight: 1, category: "modern", tag: "fetch API" },
  { pattern: "\\bPromise\\b", weight: 1, category: "modern", tag: "Promise" },
  { pattern: "\\bvar\\s", weight: 2, category: "legacy", tag: "var" },
  { pattern: "\\bjQuery\\b|\\$\\(", weight: 3, category: "legacy", tag: "jQuery" },
  { pattern: "\\bmysql_connect\\b", weight: 4, category: "legacy", tag: "mysql_connect" },
  { pattern: "\\bmysql_query\\b", weight: 4, category: "legacy", tag: "mysql_query" },
  { pattern: "\\bcomponentWillMount\\b", weight: 3, category: "legacy", tag: "componentWillMount" },
  { pattern: "\\bcomponentWillReceiveProps\\b", weight: 3, category: "legacy", tag: "componentWillReceiveProps" },
  { pattern: "\\bdocument\\.write\\b", weight: 3, category: "legacy", tag: "document.write" },
  { pattern: "\\bXMLHttpRequest\\b", weight: 2, category: "legacy", tag: "XMLHttpRequest" },
  { pattern: "\\brequire\\(", weight: 1, category: "legacy", tag: "require()" },
  { pattern: "\\bmodule\\.exports\\b", weight: 1, category: "legacy", tag: "module.exports" },
  { pattern: "\\bAngularJS\\b|\\bng-\\w+", weight: 3, category: "legacy", tag: "AngularJS" },
  { pattern: "\\bBackbone\\b", weight: 3, category: "legacy", tag: "Backbone" },
  { pattern: "\\bCoffeeScript\\b", weight: 3, category: "legacy", tag: "CoffeeScript" },
  { pattern: "\\bBower\\b", weight: 3, category: "legacy", tag: "Bower" },
  { pattern: "\\bGrunt\\b", weight: 2, category: "legacy", tag: "Grunt" },
  { pattern: "\\bGulp\\b", weight: 1, category: "legacy", tag: "Gulp" },
  { pattern: "\\bPHP\\s*[4-5]\\b", weight: 3, category: "legacy", tag: "PHP 4/5" },
  { pattern: "\\bPython\\s*2\\b", weight: 3, category: "legacy", tag: "Python 2" },
  { pattern: "\\bFloat\\b.*\\bclear\\b|\\bclearfix\\b", weight: 2, category: "legacy", tag: "clearfix/float" },
];

const DATE_PATTERNS = [
  {
    source: "relative",
    regex: /(\d+)\s+(?:day|week|month|year)s?\s+ago/i,
    parser: (match) => {
      const num = parseInt(match[1]);
      const unit = match[0].toLowerCase();
      let days;
      if (unit.includes("year")) days = num * 365;
      else if (unit.includes("month")) days = num * 30;
      else if (unit.includes("week")) days = num * 7;
      else days = num;
      return { daysOld: days, source: "relative", rawMatch: match[0], confidence: 0.9 };
    },
  },
  {
    source: "updated-prefix",
    regex: /(?:Updated|Modified|Edited|Reviewed|Revised)\s*:?\s*(?:on\s+)?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}/i,
    parser: (match) => {
      const dateStr = match[0].replace(/^(?:Updated|Modified|Edited|Reviewed|Revised)\s*:?\s*(?:on\s+)?/i, "");
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      const days = Math.floor((Date.now() - date.getTime()) / 86400000);
      return { daysOld: Math.max(0, days), source: "updated-prefix", rawMatch: match[0], confidence: 0.95 };
    },
  },
  {
    source: "absolute-mdy",
    regex: /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}/i,
    parser: (match) => {
      const date = new Date(match[0]);
      if (isNaN(date.getTime())) return null;
      const days = Math.floor((Date.now() - date.getTime()) / 86400000);
      return { daysOld: Math.max(0, days), source: "absolute", rawMatch: match[0], confidence: 0.85 };
    },
  },
  {
    source: "absolute-dmy",
    regex: /\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}/i,
    parser: (match) => {
      const date = new Date(match[0]);
      if (isNaN(date.getTime())) return null;
      const days = Math.floor((Date.now() - date.getTime()) / 86400000);
      return { daysOld: Math.max(0, days), source: "absolute-dmy", rawMatch: match[0], confidence: 0.8 };
    },
  },
  {
    source: "iso",
    regex: /\d{4}-\d{2}-\d{2}/,
    parser: (match) => {
      const date = new Date(match[0]);
      if (isNaN(date.getTime())) return null;
      const days = Math.floor((Date.now() - date.getTime()) / 86400000);
      return { daysOld: Math.max(0, days), source: "iso", rawMatch: match[0], confidence: 0.9 };
    },
  },
  {
    source: "numeric-slash",
    regex: /\d{1,2}\/\d{1,2}\/\d{4}/,
    parser: (match) => {
      const date = new Date(match[0]);
      if (isNaN(date.getTime())) return null;
      const days = Math.floor((Date.now() - date.getTime()) / 86400000);
      return { daysOld: Math.max(0, days), source: "numeric", rawMatch: match[0], confidence: 0.6 };
    },
  },
  {
    source: "year-only",
    regex: /(?:in|from|since|circa|copyright|©)\s*(\d{4})\b/i,
    parser: (match) => {
      const year = parseInt(match[1]);
      if (year < 1990 || year > new Date().getFullYear() + 1) return null;
      const date = new Date(year, 6, 1);
      const days = Math.floor((Date.now() - date.getTime()) / 86400000);
      return { daysOld: Math.max(0, days), source: "year-only", rawMatch: match[0], confidence: 0.4 };
    },
  },
];

function analyzeDate(text) {
  let best = null;
  for (const p of DATE_PATTERNS) {
    const match = text.match(p.regex);
    if (match) {
      const result = p.parser(match);
      if (result && (!best || result.confidence > best.confidence)) best = result;
    }
  }
  return best;
}

function analyzeTech(text) {
  let modernScore = 0, legacyScore = 0;
  const signals = [];
  for (const s of TECH_SIGNALS) {
    const regex = new RegExp(s.pattern, "gi");
    const matches = text.match(regex);
    if (matches) {
      const count = Math.min(matches.length, 3);
      const w = s.weight * count;
      if (s.category === "modern") modernScore += w;
      else legacyScore += w;
      signals.push({ tag: s.tag, category: s.category, weight: w });
    }
  }
  const total = modernScore + legacyScore;
  if (total === 0) return { category: "neutral", confidence: 0, signals: [], modernScore: 0, legacyScore: 0 };
  const dominant = Math.max(modernScore, legacyScore);
  const confidence = Math.min((dominant / Math.max(total, 1)) * (Math.min(total, 15) / 15), 1);
  const category = modernScore > legacyScore ? "modern" : legacyScore > modernScore ? "legacy" : "neutral";
  signals.sort((a, b) => b.weight - a.weight);
  return { category, confidence, signals: signals.slice(0, 5), modernScore, legacyScore };
}

function formatAge(days) {
  if (days < 1) return "today";
  if (days === 1) return "1d";
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  const years = days / 365;
  return years >= 2 ? `${Math.floor(years)}y` : `${years.toFixed(1)}y`;
}

function getAgeClass(days, freshDays, agingDays) {
  if (days <= freshDays) return "verus-fresh";
  if (days <= agingDays) return "verus-aging";
  return "verus-stale";
}

function getAgeLabel(days, freshDays, agingDays) {
  if (days <= freshDays) return "Fresh";
  if (days <= agingDays) return "Aging";
  return "Stale";
}

function getConfidenceLabel(c) {
  if (c >= 0.8) return "High";
  if (c >= 0.5) return "Medium";
  return "Low";
}

function createBadge(result, settings) {
  const container = document.createElement("span");
  container.className = "verus-badge-container";

  if (result.age && settings.showAge) {
    const ageClass = getAgeClass(result.age.daysOld, settings.freshDays, settings.agingDays);
    const ageLabel = getAgeLabel(result.age.daysOld, settings.freshDays, settings.agingDays);
    const formatted = formatAge(result.age.daysOld);

    const badge = document.createElement("span");
    badge.className = `verus-badge ${ageClass}`;
    badge.textContent = `${ageLabel} · ${formatted}`;
    badge.title = `Age: ${formatted} (${getConfidenceLabel(result.age.confidence)} confidence)\nSource: ${result.age.source}\nMatch: "${result.age.rawMatch}"`;
    container.appendChild(badge);
  }

  if (result.tech.category !== "neutral" && settings.showTech) {
    const techBadge = document.createElement("span");
    techBadge.className = `verus-badge verus-tech-${result.tech.category}`;
    const topSignals = result.tech.signals.slice(0, 3).map(s => s.tag).join(", ");
    techBadge.textContent = result.tech.category === "modern" ? "Modern" : "Legacy";
    techBadge.title = `Tech: ${result.tech.category} (${getConfidenceLabel(result.tech.confidence)} confidence)\nSignals: ${topSignals}\nModern: ${result.tech.modernScore} / Legacy: ${result.tech.legacyScore}`;
    container.appendChild(techBadge);
  }

  return container;
}

function findAnnotationLine(resultEl) {
  const cite = resultEl.querySelector("cite");
  if (cite) {
    let parent = cite.closest("div");
    if (parent) return parent;
  }

  const spans = resultEl.querySelectorAll("span");
  for (const span of spans) {
    const text = span.textContent || "";
    if (/^\s*(http|www\.)/.test(text) || /\s*›\s*/.test(text)) {
      let parent = span.closest("div");
      if (parent) return parent;
    }
  }
  return null;
}

function processResults(settings) {
  const results = document.querySelectorAll("div.g");

  results.forEach((result) => {
    if (result.dataset.verusProcessed) return;
    result.dataset.verusProcessed = "true";

    const title = result.querySelector("h3");
    if (!title) return;

    const text = result.textContent || "";
    const age = analyzeDate(text);
    const tech = analyzeTech(text);

    if (!age && tech.category === "neutral") return;

    const analysis = { age, tech };
    const badge = createBadge(analysis, settings);

    if (badge.children.length > 0) {
      const annotationLine = findAnnotationLine(result);
      if (annotationLine) {
        const wrapper = document.createElement("span");
        wrapper.className = "verus-annotation-line";

        const sep = document.createElement("span");
        sep.className = "verus-separator";
        sep.textContent = "·";
        wrapper.appendChild(sep);
        wrapper.appendChild(badge);

        annotationLine.appendChild(wrapper);
      } else {
        const titleParent = title.parentElement;
        if (titleParent) {
          badge.style.display = "inline-flex";
          badge.style.marginLeft = "8px";
          title.after(badge);
        }
      }
    }
  });
}

function clearBadges() {
  document.querySelectorAll(".verus-badge-container, .verus-annotation-line").forEach((el) => el.remove());
  document.querySelectorAll("[data-verus-processed]").forEach((el) => {
    delete el.dataset.verusProcessed;
  });
}

function getDefaultSettings() {
  return {
    showAge: true,
    showTech: true,
    freshDays: 180,
    agingDays: 730,
  };
}

function safeStorageGet(defaults, callback) {
  try {
    chrome.storage.sync.get(defaults, (result) => {
      if (chrome.runtime.lastError) {
        console.warn("VerusIT: storage read failed, using defaults", chrome.runtime.lastError.message);
        callback(defaults);
        return;
      }
      callback(result);
    });
  } catch (e) {
    console.warn("VerusIT: chrome.storage unavailable, using defaults");
    callback(defaults);
  }
}

function init() {
  let currentSettings = getDefaultSettings();
  let debounceTimer = null;

  safeStorageGet(getDefaultSettings(), (settings) => {
    currentSettings = settings;
    processResults(currentSettings);

    const observer = new MutationObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        processResults(currentSettings);
      }, 150);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });

  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "sync") return;
      const relevantKeys = ["showAge", "showTech", "freshDays", "agingDays"];
      const hasRelevant = Object.keys(changes).some((k) => relevantKeys.includes(k));
      if (!hasRelevant) return;

      clearBadges();
      safeStorageGet(getDefaultSettings(), (settings) => {
        currentSettings = settings;
        processResults(currentSettings);
      });
    });
  } catch (e) {
    console.warn("VerusIT: could not register storage listener");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
