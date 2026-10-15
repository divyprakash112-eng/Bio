
"use strict";

const CONFIG = {
  seriesStart: "2026-10-20",
  timezone: "Asia/Kolkata",
  transitionSeconds: 3,
  cbtFolder: "./cbt/"
};

const $ = (selector, root = document) => root.querySelector(selector);

let currentFilter = "all";
let currentSearch = "";
let transitionTimer = null;
let countdownInterval = null;
let statusInterval = null;
let eventsConnected = false;

const cbtAvailability = new Map();
const cbtChecksInProgress = new Set();

/* ---------- DATE HELPERS ---------- */

function todayInIndia() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CONFIG.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const result = {};

  parts.forEach(part => {
    if (part.type !== "literal") {
      result[part.type] = part.value;
    }
  });

  return `${result.year}-${result.month}-${result.day}`;
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

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

/* ---------- TEST DATA ---------- */

function getTests() {
  if (typeof TESTS === "undefined" || !Array.isArray(TESTS)) {
    return [];
  }

  return [...TESTS]
    .filter(test =>
      test &&
      Number.isInteger(Number(test.id)) &&
      /^\d{4}-\d{2}-\d{2}$/.test(test.date || "") &&
      ["chapter", "mixed", "full"].includes(test.type)
    )
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
  return {
    chapter: "Chapter-wise Test",
    mixed: "Mixed Biology Test",
    full: "Full Syllabus Test"
  }[test.type] || "Biology Test";
}

function getCategoryLabel(test) {
  if (test.category) return test.category;

  return test.type === "chapter"
    ? "Biology"
    : test.type === "mixed"
      ? "Mixed"
      : "Full Syllabus";
}

function getStatusLabel(status) {
  return {
    live: "● LIVE TODAY",
    upcoming: "UPCOMING",
    previous: "PREVIOUS"
  }[status] || "SCHEDULED";
}

/* ---------- AUTOMATIC CBT FILE DETECTION ---------- */

/*
  Expected filenames:
  cbt/test-01.html
  cbt/test-02.html
  ...
  cbt/test-50.html

  A test is startable only when:
  1. Its scheduled date is today.
  2. Its CBT HTML file exists.
*/

function getCbtUrl(test) {
  // A manually supplied URL takes priority.
  if (typeof test.cbtUrl === "string" && test.cbtUrl.trim()) {
    const url = test.cbtUrl.trim();

    if (/^https?:\/\//i.test(url)) return url;

    if (
      (url.startsWith("./") || url.startsWith("../")) &&
      !url.startsWith("//")
    ) {
      return url;
    }
  }

  const number = String(Number(test.id)).padStart(2, "0");
  return `${CONFIG.cbtFolder}test-${number}.html`;
}

async function checkCbtFile(test) {
  const id = Number(test.id);

  if (cbtAvailability.has(id) || cbtChecksInProgress.has(id)) {
    return;
  }

  cbtChecksInProgress.add(id);

  const url = getCbtUrl(test);

  try {
    // HEAD checks whether the static HTML file exists without
    // downloading the full question paper.
    let response = await fetch(url, {
      method: "HEAD",
      cache: "no-store"
    });

    // Some static hosts do not support HEAD. Try GET as fallback.
    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, {
        method: "GET",
        cache: "no-store"
      });
    }

    cbtAvailability.set(id, response.ok);
  } catch (error) {
    cbtAvailability.set(id, false);
    console.warn(`Could not verify CBT file for Test ${id}.`, error);
  } finally {
    cbtChecksInProgress.delete(id);
    renderDashboard();
  }
}

function checkAllCbtFiles() {
  getTests().forEach(test => {
    checkCbtFile(test);
  });
}

/* ---------- COUNTDOWN ---------- */

function updateCountdown() {
  const target = new Date(
    `${CONFIG.seriesStart}T00:00:00+05:30`
  ).getTime();

  const remaining = Math.max(0, target - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);

  const values = {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60
  };

  Object.entries(values).forEach(([id, value]) => {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = id === "days"
        ? String(value)
        : String(value).padStart(2, "0");
    }
  });

  const message = $("#countdown-message");

  if (message) {
    message.textContent = remaining > 0
      ? "Your first scheduled test begins on 20 October 2026."
      : "The test series has started. Check today's test in the dashboard.";
  }
}

/* ---------- TEST CARDS ---------- */

function renderTestCard(test) {
  const status = getStatus(test);
  const url = getCbtUrl(test);
  const id = Number(test.id);
  const dateLabel = formatDate(test.date);

  const fileKnown = cbtAvailability.has(id);
  const fileExists = cbtAvailability.get(id) === true;
  const fileChecking = cbtChecksInProgress.has(id);

  let buttonLabel = "";
  let disabled = false;

  if (status === "upcoming") {
    buttonLabel = `Starts on ${dateLabel}`;
    disabled = true;
  } else if (fileChecking || !fileKnown) {
    buttonLabel = "Checking Test File…";
    disabled = true;
  } else if (!fileExists) {
    buttonLabel = "CBT File Not Uploaded";
    disabled = true;
  } else if (status === "live") {
    buttonLabel = "Start Test →";
  } else {
    buttonLabel = "Open Previous Test →";
  }

  return `
    <article class="test-card" id="test-${id}">
      <div class="test-card-top">
        <span class="test-number">
          TEST ${String(id).padStart(2, "0")}
        </span>

        <span class="status-badge status-${status}">
          ${escapeHTML(getStatusLabel(status))}
        </span>
      </div>

      <h3>${escapeHTML(test.title || `Biology Test ${id}`)}</h3>

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
        <p>${escapeHTML(test.syllabus || "Syllabus details will be updated.")}</p>
      </div>

      <div class="test-actions">
        <button
          class="start-test-button ${status === "previous" ? "is-previous" : ""}"
          type="button"
          data-start-test="${id}"
          ${disabled ? "disabled" : ""}
        >${escapeHTML(buttonLabel)}</button>
      </div>
    </article>
  `;
}

/* ---------- DASHBOARD, SEARCH & FILTERS ---------- */

function renderDashboard() {
  const list = $("#test-list");
  if (!list) return;

  const tests = getTests();

  const counts = {
    previous: 0,
    live: 0,
    upcoming: 0
  };

  tests.forEach(test => {
    counts[getStatus(test)]++;
  });

  const completed = $("#completed-count");
  const live = $("#live-count");
  const upcoming = $("#upcoming-count");

  if (completed) completed.textContent = counts.previous;
  if (live) live.textContent = counts.live;
  if (upcoming) upcoming.textContent = counts.upcoming;

  const query = currentSearch.toLocaleLowerCase();

  const visibleTests = tests.filter(test => {
    const status = getStatus(test);

    const matchesFilter =
      currentFilter === "all" || currentFilter === status;

    const text = [
      test.id,
      test.title,
      test.type,
      test.category,
      test.syllabus,
      test.date,
      formatDate(test.date),
      formatDay(test.date)
    ].join(" ").toLocaleLowerCase();

    return matchesFilter && text.includes(query);
  });

  list.innerHTML = visibleTests.length
    ? visibleTests.map(renderTestCard).join("")
    : `<div class="empty-state">No tests found. Try another filter or search.</div>`;
}

/* ---------- NAVIGATION ---------- */

function updateNavigation(page) {
  document.querySelectorAll(".nav-link").forEach(link => {
    const isHome =
      link.tagName === "A" && link.getAttribute("href") === "#home";

    const isTests = link.id === "nav-tests";

    link.classList.toggle(
      "active",
      page === "home" ? isHome : isTests
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
  window.scrollTo({ top: 0, behavior: "smooth" });
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
  checkAllCbtFiles();

  window.scrollTo({ top: 0, behavior: "smooth" });
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

  let seconds = CONFIG.transitionSeconds;
  counter.textContent = String(seconds);

  function tick() {
    seconds--;
    counter.textContent = String(Math.max(seconds, 0));

    if (seconds <= 0) {
      showDashboard();
      return;
    }

    transitionTimer = setTimeout(tick, 1000);
  }

  transitionTimer = setTimeout(tick, 1000);
}

/* ---------- OPEN TEST ---------- */

function handleTestOpen(button) {
  if (!button || button.disabled) return;

  const id = Number(button.dataset.startTest);
  const test = getTests().find(item => Number(item.id) === id);

  if (!test) {
    alert("Test details could not be found. Please refresh the page.");
    return;
  }

  if (getStatus(test) === "upcoming") {
    alert(`This test starts on ${formatDate(test.date)}.`);
    return;
  }

  if (cbtAvailability.get(id) !== true) {
    alert("The CBT file has not been detected. Please check the uploaded file path.");
    return;
  }

  window.location.href = getCbtUrl(test);
}

/* ---------- EVENTS ---------- */

function connectEvents() {
  if (eventsConnected) return;
  eventsConnected = true;

  const enter = $("#enter-series");
  const navTests = $("#nav-tests");
  const back = $("#back-home");
  const bottomHome = $("#bottom-home");
  const search = $("#test-search");
  const list = $("#test-list");

  if (enter) enter.addEventListener("click", startDashboardTransition);
  if (navTests) navTests.addEventListener("click", showDashboard);
  if (back) back.addEventListener("click", showHome);
  if (bottomHome) bottomHome.addEventListener("click", showHome);

  document.querySelectorAll('a[href="#home"]').forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      showHome();
    });
  });

  document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter || "all";

      if (!["all", "live", "upcoming", "previous"].includes(filter)) {
        return;
      }

      currentFilter = filter;

      document.querySelectorAll("[data-filter]").forEach(item => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });

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
      handleTestOpen(event.target.closest("[data-start-test]"));
    });
  }
}

/* ---------- STARTUP ---------- */

function initialiseApp() {
  const tests = getTests();

  if (!tests.length) {
    const list = $("#test-list");

    if (list) {
      list.innerHTML = `
        <div class="empty-state">
          Test schedule could not be loaded. Check tests.js and refresh.
        </div>
      `;
    }

    console.error("No valid tests found in tests.js.");
    connectEvents();
    updateCountdown();
    return;
  }

  connectEvents();
  updateCountdown();
  renderDashboard();

  // Check CBT files when the dashboard is opened.
  // This also allows newly uploaded files to be detected after refresh.
  checkAllCbtFiles();

  clearInterval(countdownInterval);
  clearInterval(statusInterval);

  countdownInterval = setInterval(updateCountdown, 1000);

  statusInterval = setInterval(() => {
    renderDashboard();
    checkAllCbtFiles();
  }, 60 * 1000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialiseApp, { once: true });
} else {
  initialiseApp();
}
