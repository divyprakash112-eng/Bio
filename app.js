
"use strict";

/*
 * NEET AARAMBH — Biology Test Series
 * File: app.js
 * Requires: tests.js loaded before app.js
 */

const CONFIG = {
  targetDate: "2026-10-20T00:00:00+05:30",
  timezone: "Asia/Kolkata",
  transitionSeconds: 3
};

const $ = (selector, root = document) => root.querySelector(selector);

let currentFilter = "all";
let currentSearch = "";
let transitionTimer = null;
let countdownInterval = null;
let statusInterval = null;
let eventsConnected = false;

/* ---------- DATE & STATUS ---------- */

function todayInIndia() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CONFIG.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return `${values.year}-${values.month}-${values.day}`;
}

function getStatus(test) {
  const today = todayInIndia();

  if (test.date < today) return "previous";
  if (test.date > today) return "upcoming";

  return "live";
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatDay(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/* ---------- SAFE DISPLAY ---------- */

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function setText(selector, value) {
  const element = $(selector);

  if (element) {
    element.textContent = String(value);
  }
}

/* ---------- TEST DATA ---------- */

function getTests() {
  if (typeof TESTS === "undefined" || !Array.isArray(TESTS)) {
    return [];
  }

  return [...TESTS]
    .filter(test => {
      if (!test || !Number.isInteger(Number(test.id))) {
        return false;
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(test.date || "")) {
        return false;
      }

      const parsedDate = new Date(`${test.date}T00:00:00Z`);

      if (Number.isNaN(parsedDate.getTime())) {
        return false;
      }

      if (typeof test.title !== "string") {
        return false;
      }

      if (!["chapter", "mixed", "full"].includes(test.type)) {
        return false;
      }

      return true;
    })
    .sort((a, b) =>
      a.date.localeCompare(b.date) ||
      Number(a.id) - Number(b.id)
    );
}

function getQuestionCount(test) {
  return test.type === "chapter" ? 45 : 180;
}

function getDuration(test) {
  return test.type === "chapter" ? 45 : 180;
}

function getTypeLabel(test) {
  const labels = {
    chapter: "Chapter-wise Test",
    mixed: "Mixed Biology Test",
    full: "Full Syllabus Test"
  };

  return labels[test.type] || "Biology Test";
}

function getCategoryLabel(test) {
  if (test.category) {
    return test.category;
  }

  if (test.type === "chapter") {
    return "Biology";
  }

  if (test.type === "mixed") {
    return "Mixed";
  }

  return "Full Syllabus";
}

function getStatusLabel(status) {
  const labels = {
    live: "● LIVE TODAY",
    upcoming: "UPCOMING",
    previous: "PREVIOUS"
  };

  return labels[status] || "SCHEDULED";
}

/*
 * Supports:
 *   ./tests/test-01.html
 *   ../tests/test-01.html
 *   https://example.com/test.html
 *
 * Add cbtUrl to a test in tests.js only when its real CBT file exists.
 */
function getTestUrl(test) {
  if (typeof test.cbtUrl !== "string") {
    return "";
  }

  const url = test.cbtUrl.trim();

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (
    (url.startsWith("./") || url.startsWith("../")) &&
    !url.startsWith("//")
  ) {
    return url;
  }

  return "";
}

/* ---------- TEST CARDS ---------- */

function renderTestCard(test) {
  const status = getStatus(test);
  const url = getTestUrl(test);
  const dateLabel = formatDate(test.date);

  let buttonLabel;
  let disabled = false;

  if (status === "upcoming") {
    buttonLabel = `Starts on ${dateLabel}`;
    disabled = true;
  } else if (!url) {
    buttonLabel = status === "previous"
      ? "Previous Test Link Pending"
      : "CBT Link Not Added Yet";

    disabled = true;
  } else {
    buttonLabel = status === "live"
      ? "Start Test →"
      : "Open Previous Test →";
  }

  return `
    <article class="test-card" id="test-${Number(test.id)}">

      <div class="test-card-top">
        <span class="test-number">
          TEST ${String(test.id).padStart(2, "0")}
        </span>

        <span class="status-badge status-${status}">
          ${escapeHTML(getStatusLabel(status))}
        </span>
      </div>

      <h3>
        ${escapeHTML(test.title || `Biology Test ${test.id}`)}
      </h3>

      <div class="test-labels">
        <span class="test-category">
          ${escapeHTML(getTypeLabel(test))}
        </span>

        <span class="test-category category-secondary">
          ${escapeHTML(getCategoryLabel(test))}
        </span>
      </div>

      <div class="test-meta">

        <div class="meta-item">
          <span aria-hidden="true">📅</span>
          <span>
            <strong>Test Date</strong>
            ${escapeHTML(dateLabel)}
          </span>
        </div>

        <div class="meta-item">
          <span aria-hidden="true">🗓️</span>
          <span>
            <strong>Day</strong>
            ${escapeHTML(formatDay(test.date))}
          </span>
        </div>

        <div class="meta-item">
          <span aria-hidden="true">📝</span>
          <span>
            <strong>Questions</strong>
            ${getQuestionCount(test)} Questions
          </span>
        </div>

        <div class="meta-item">
          <span aria-hidden="true">⏱️</span>
          <span>
            <strong>Duration</strong>
            ${getDuration(test)} Minutes
          </span>
        </div>

      </div>

      <div class="syllabus-box">
        <strong>📚 Syllabus / Chapters</strong>
        <p>
          ${escapeHTML(
            test.syllabus || "Syllabus details will be updated."
          )}
        </p>
      </div>

      <div class="test-actions">
        <button
          class="start-test-button ${status === "previous" ? "is-previous" : ""}"
          type="button"
          data-start-test="${Number(test.id)}"
          ${disabled ? "disabled" : ""}
        >
          ${escapeHTML(buttonLabel)}
        </button>
      </div>

    </article>
  `;
}

/* ---------- FILTERS & SEARCH ---------- */

function renderDashboard() {
  const list = $("#test-list");

  if (!list) {
    return;
  }

  const tests = getTests();

  const counts = {
    previous: 0,
    live: 0,
    upcoming: 0
  };

  tests.forEach(test => {
    counts[getStatus(test)]++;
  });

  setText("#completed-count", counts.previous);
  setText("#live-count", counts.live);
  setText("#upcoming-count", counts.upcoming);

  const query = currentSearch.toLocaleLowerCase();

  const visibleTests = tests.filter(test => {
    const status = getStatus(test);

    const matchesFilter =
      currentFilter === "all" ||
      status === currentFilter;

    const searchableText = [
      test.id,
      test.title,
      test.type,
      test.category,
      test.syllabus,
      test.date,
      formatDate(test.date),
      formatDay(test.date)
    ]
      .join(" ")
      .toLocaleLowerCase();

    return matchesFilter && searchableText.includes(query);
  });

  if (visibleTests.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        No tests found. Try another filter or search.
      </div>
    `;
    return;
  }

  list.innerHTML = visibleTests.map(renderTestCard).join("");
}

function updateFilterButtons(activeButton) {
  document.querySelectorAll("[data-filter]").forEach(button => {
    const isActive = button === activeButton;

    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

/* ---------- COUNTDOWN ---------- */

function updateCountdown() {
  const target = new Date(CONFIG.targetDate).getTime();
  const remaining = Math.max(0, target - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);

  const values = {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60
  };

  for (const [id, value] of Object.entries(values)) {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = id === "days"
        ? String(value)
        : String(value).padStart(2, "0");
    }
  }
}

/* ---------- PAGE NAVIGATION ---------- */

function updateNavigation(activePage) {
  document.querySelectorAll(".nav-link").forEach(link => {
    const isHome =
      link.tagName === "A" &&
      link.getAttribute("href") === "#home";

    const isTests = link.id === "nav-tests";

    link.classList.toggle(
      "active",
      activePage === "home" ? isHome : isTests
    );
  });
}

function showHome() {
  clearTimeout(transitionTimer);

  const transition = $("#transition-screen");
  const dashboard = $("#dashboard");
  const home = $("#home");

  if (transition) transition.hidden = true;
  if (dashboard) dashboard.hidden = true;
  if (home) home.hidden = false;

  updateNavigation("home");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function showDashboard() {
  clearTimeout(transitionTimer);

  const home = $("#home");
  const dashboard = $("#dashboard");
  const transition = $("#transition-screen");

  if (home) home.hidden = true;
  if (dashboard) dashboard.hidden = false;
  if (transition) transition.hidden = true;

  updateNavigation("tests");
  renderDashboard();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function startDashboardTransition() {
  clearTimeout(transitionTimer);

  const transition = $("#transition-screen");
  const counter = $("#transition-seconds");
  const home = $("#home");
  const dashboard = $("#dashboard");

  if (!transition || !counter || !home || !dashboard) {
    showDashboard();
    return;
  }

  home.hidden = true;
  dashboard.hidden = true;
  transition.hidden = false;

  updateNavigation("tests");

  let remaining = CONFIG.transitionSeconds;
  counter.textContent = String(remaining);

  function tick() {
    remaining--;

    counter.textContent = String(Math.max(remaining, 0));

    if (remaining <= 0) {
      showDashboard();
      return;
    }

    transitionTimer = window.setTimeout(tick, 1000);
  }

  transitionTimer = window.setTimeout(tick, 1000);
}

/* ---------- CBT OPENING ---------- */

function handleTestOpen(button) {
  if (!button || button.disabled) {
    return;
  }

  const testId = Number(button.dataset.startTest);

  const test = getTests().find(item =>
    Number(item.id) === testId
  );

  if (!test) {
    alert("Test details could not be found. Please refresh the page.");
    return;
  }

  const status = getStatus(test);

  if (status === "upcoming") {
    alert(`This test starts on ${formatDate(test.date)}.`);
    return;
  }

  const url = getTestUrl(test);

  if (!url) {
    alert(
      "The CBT link for this test has not been added yet. Please contact your test-series coordinator."
    );
    return;
  }

  window.location.href = url;
}

/* ---------- EVENT LISTENERS ---------- */

function connectEvents() {
  if (eventsConnected) {
    return;
  }

  eventsConnected = true;

  const enterSeries = $("#enter-series");
  const navTests = $("#nav-tests");
  const backHome = $("#back-home");
  const bottomHome = $("#bottom-home");
  const search = $("#test-search");
  const list = $("#test-list");

  if (enterSeries) {
    enterSeries.addEventListener(
      "click",
      startDashboardTransition
    );
  }

  if (navTests) {
    navTests.addEventListener("click", showDashboard);
  }

  if (backHome) {
    backHome.addEventListener("click", showHome);
  }

  if (bottomHome) {
    bottomHome.addEventListener("click", showHome);
  }

  document.querySelectorAll('a[href="#home"]').forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      showHome();
    });
  });

  document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
      const nextFilter = button.dataset.filter || "all";

      if (!["all", "live", "upcoming", "previous"].includes(nextFilter)) {
        return;
      }

      currentFilter = nextFilter;
      updateFilterButtons(button);
      renderDashboard();
    });
  });

  if (search) {
    search.addEventListener("input", event => {
      currentSearch = event.target.value.trim();
      renderDashboard();
    });
  }

  if (list) {
    list.addEventListener("click", event => {
      const button = event.target.closest("[data-start-test]");
      handleTestOpen(button);
    });
  }
}

/* ---------- INITIALISATION ---------- */

function initialiseApp() {
  const rawTests =
    typeof TESTS !== "undefined" && Array.isArray(TESTS)
      ? TESTS
      : null;

  const tests = getTests();

  if (!rawTests || tests.length === 0) {
    console.error(
      "Test schedule could not be loaded. Check tests.js and script order."
    );

    const list = $("#test-list");

    if (list) {
      list.innerHTML = `
        <div class="empty-state">
          Test schedule could not be loaded. Please refresh the page or contact support.
        </div>
      `;
    }

    connectEvents();
    return;
  }

  if (tests.length !== 50) {
    console.warn(
      `Expected 50 valid tests, but found ${tests.length}.`
    );
  }

  const ids = tests.map(test => Number(test.id));

  if (new Set(ids).size !== ids.length) {
    console.warn("Duplicate test IDs detected in tests.js.");
  }

  connectEvents();
  updateCountdown();
  renderDashboard();

  clearInterval(countdownInterval);
  clearInterval(statusInterval);

  countdownInterval = window.setInterval(
    updateCountdown,
    1000
  );

  statusInterval = window.setInterval(
    renderDashboard,
    60 * 1000
  );
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initialiseApp,
    { once: true }
  );
} else {
  initialiseApp();
}
