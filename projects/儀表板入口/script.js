const counterStorageKey = "teacher-dashboard-module-counters-v1";
const counterCooldownMs = 30 * 60 * 1000;

function loadCounterState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(counterStorageKey) || "{}");
    return {
      counts: parsed.counts && typeof parsed.counts === "object" ? parsed.counts : {},
      lastCountedAt: parsed.lastCountedAt && typeof parsed.lastCountedAt === "object" ? parsed.lastCountedAt : {}
    };
  } catch {
    return { counts: {}, lastCountedAt: {} };
  }
}

function saveCounterState(state) {
  localStorage.setItem(counterStorageKey, JSON.stringify(state));
}

function getModuleKey(card) {
  const title = card.querySelector("strong")?.textContent?.trim() || "module";
  const href = card.getAttribute("href") || "";
  return `${title}|${href}`.replace(/\s+/g, "-");
}

function getCounterBadge(card) {
  let badge = card.querySelector(".usage-counter");
  if (badge) {
    return badge;
  }

  badge = document.createElement("span");
  badge.className = "usage-counter";
  badge.innerHTML = "<strong>0</strong><span>使用次數</span>";
  card.append(badge);
  return badge;
}

function updateBadge(card, state) {
  const key = getModuleKey(card);
  const badge = getCounterBadge(card);
  const count = Number(state.counts[key] || 0);
  const lastCountedAt = Number(state.lastCountedAt[key] || 0);
  const isLocked = Date.now() - lastCountedAt < counterCooldownMs;

  badge.querySelector("strong").textContent = String(count);
  badge.classList.toggle("is-locked", isLocked);
}

function countModuleUse(card, event) {
  if (event && event.isTrusted === false) {
    return;
  }

  const state = loadCounterState();
  const key = getModuleKey(card);
  const now = Date.now();
  const lastCountedAt = Number(state.lastCountedAt[key] || 0);

  if (now - lastCountedAt < counterCooldownMs) {
    updateBadge(card, state);
    return;
  }

  state.counts[key] = Number(state.counts[key] || 0) + 1;
  state.lastCountedAt[key] = now;
  saveCounterState(state);
  updateBadge(card, state);

  const badge = getCounterBadge(card);
  badge.classList.remove("is-counted");
  window.requestAnimationFrame(() => badge.classList.add("is-counted"));
}

function initDashboardCounters() {
  const cards = document.querySelectorAll(".tool-card");
  const state = loadCounterState();

  cards.forEach((card) => {
    updateBadge(card, state);
    card.addEventListener("click", (event) => countModuleUse(card, event));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        countModuleUse(card, event);
      }
    });
  });
}

initDashboardCounters();
