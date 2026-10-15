
"use strict";

const CONFIG = {
  targetDate: "2027-05-02T00:00:00+05:30",
  timezone: "Asia/Kolkata",
  transitionSeconds: 3
};

const $ = (selector) => document.querySelector(selector);

let currentFilter = "all";
let currentSearch = "";
let transitionTimer = null;

function todayInIndia() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CONFIG.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const data = {};
  parts.forEach((part) => {
    if (part.type !== "literal") data[part.type] = part.value;
  });

  return `${data.year}-${data.month}-${data.day}`;
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
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function getQuestionCount(test) {
  return test.type === "chapter" ? 45 : 180;
}

function getDuration(test) {
  return test.type === "chapter" ? 45 : 180;
}

function getTypeLabel(test) {
  return ({
    chapter: "Chapter-wise Test",
    mixed: "Mixed Biology Test",
    full: "Full Syllabus Test"
  })[test.type] || "Biology Test";
}

function getStatusLabel(status) {
  return ({
    live: "● LIVE TODAY",
    upcoming: "UPCOMING",
    previous: "PREVIOUS"
  })[status];
}

function getTestUrl(test) {
  return typeof test.cbtUrl === "string" ? test.cbtUrl.trim() : "";
}

function getTests() {
  if (!Array.isArray(TESTS)) return [];
  return [...TESTS].sort((a, b) =>
    a.date.localeCompare(b.date) || a.id - b.id
  );
}

function renderTestCard(test) {
  const status = getStatus(test);
  const url = getTestUrl(test);
  const dateLabel = formatDate(test.date);

  let buttonLabel;
  let buttonDisabled = false;

  if (status === "upcoming") {
    buttonLabel = `Starts on ${dateLabel}`;
    buttonDisabled = true;
  } else if (status === "live") {
    buttonLabel = "Start Test →";
  } else {
    buttonLabel = url ? "Open Previous Test →" : "Test Date Passed";
    buttonDisabled = !url;
  }

  return `
    <article class="test-card" id="test-${test.id}">
      <div class="test-card-top">
        <span class="test-number">
          TEST ${String(test.id).padStart(2, "0")}
        </span>
        <span class="status-badge status-${status}">
          ${escapeHTML(getStatusLabel(status))}
        </span>
      </div>

      <h3>${escapeHTML(test.title)}</h3>
      <span class="test-category">${escapeHTML(getTypeLabel(test))}</span>

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
          data-start-test="${test.id}"
          ${buttonDisabled ? "disabled" : ""}
        >${escapeHTML(buttonLabel)}</button>
      </div>
    </article>
  `;
}

function renderDashboard() {
  const list = $("#test-list");
  if (!list) return;

  const tests = getTests();

  const counts = {
    previous: 0,
    live: 0,
    upcoming: 0
  };

  tests.forEach((test) => counts[getStatus(test)]++);

  $("#completed-count").textContent = counts.previous;
  $("#live-count").textContent = counts.live;
  $("#upcoming-count").textContent = counts.upcoming;

  const visible = tests.filter((test) => {
    const statusMatches =
      currentFilter === "all" || getStatus(test) === currentFilter;

    const searchText = [
      test.id,
      test.title,
      test.type,
      test.category,
      test.syllabus,
      formatDate(test.date)
    ].join(" ").toLowerCase();

    return statusMatches && searchText.includes(currentSearch.toLowerCase());
  });

  list.innerHTML = visible.length
    ? visible.map(renderTestCard).join("")
    : `<div class="empty-state">No tests found. Try another filter or search.</div>`;
}

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

  Object.entries(values).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = id === "days"
        ? String(value)
        : String(value).padStart(2, "0");
    }
  });
}

function showHome() {
  clearTimeout(transitionTimer);

  $("#transition-screen").hidden = true;
  $("#dashboard").hidden = true;
  $("#home").hidden = false;

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle(link.tagName === "A" && link.getAttribute("href") === "#home", "active");
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showDashboard() {
  $("#home").hidden = true;
  $("#dashboard").hidden = false;
  $("#transition-screen").hidden = true;

  renderDashboard();

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle(link.id === "nav-tests", "active");
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function startDashboardTransition() {
  const transition = $("#transition-screen");
  const counter = $("#transition-seconds");

  $("#home").hidden = true;
  $("#dashboard").hidden = true;
  transition.hidden = false;

  let remaining = CONFIG.transitionSeconds;
  counter.textContent = remaining;

  const tick = () => {
    remaining--;
    counter.textContent = Math.max(remaining, 0);

    if (remaining <= 0) {
      showDashboard();
      return;
    }

    transitionTimer = window.setTimeout(tick, 1000);
  };

  transitionTimer = window.setTimeout(tick, 1000);
}

function connectEvents() {
  $("#enter-series").addEventListener("click", startDashboardTransition);
  $("#nav-tests").addEventListener("click", showDashboard);
  $("#back-home").addEventListener("click", showHome);
  $("#bottom-home").addEventListener("click", showHome);

  document.querySelectorAll('a[href="#home"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      showHome();
    });
  });

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter || "all";

      document.querySelectorAll("[data-filter]").forEach((item) => {
        item.classList.toggle("active", item === button);
      });

      renderDashboard();
    });
  });

  $("#test-search").addEventListener("input", (event) => {
    currentSearch = event.target.value.trim();
    renderDashboard();
  });

  $("#test-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-start-test]");
    if (!button || button.disabled) return;

    const testId = Number(button.dataset.startTest);
    const test = getTests().find((item) => item.id === testId);
    if (!test) return;

    const url = getTestUrl(test);

    if (!url) {
      alert(
        "The scheduled test is live, but its CBT link has not been connected yet. Please contact your test-series coordinator."
      );
      return;
    }

    window.location.href = url;
  });
}

function initialiseApp() {
  if (!Array.isArray(TESTS)) {
    console.error("TESTS was not found. Check tests.js.");
    return;
  }

  connectEvents();
  updateCountdown();
  renderDashboard();

  window.setInterval(updateCountdown, 1000);

  // Refresh test status when the date changes.
  window.setInterval(renderDashboard, 60 * 1000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialiseApp);
} else {
  initialiseApp();
}
