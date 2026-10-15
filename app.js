
"use strict";

/*
 * NEET AARAMBH - Main Application
 *
 * To connect a CBT file, add cbtUrl to its entry in tests.js:
 * cbtUrl: "tests/test-01.html"
 *
 * Status is based on the scheduled date in India Standard Time.
 */

const CONFIG = {
  targetDate: "2027-05-02T00:00:00+05:30",
  transitionSeconds: 3,
  timezone: "Asia/Kolkata"
};

const $ = (selector) => document.querySelector(selector);

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: CONFIG.timezone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

function indiaToday() {
  const parts = dateFormatter.formatToParts(new Date());
  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") values[part.type] = part.value;
  }

  return `${values.year}-${values.month}-${values.day}`;
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function formatDay(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "UTC",
    weekday: "long"
  }).format(date);
}

function getStatus(test) {
  const today = indiaToday();

  if (test.date < today) return "previous";
  if (test.date > today) return "upcoming";
  return "live";
}

function getQuestionCount(test) {
  return test.type === "chapter" ? 45 : 180;
}

function getDuration(test) {
  return test.type === "chapter" ? 45 : 180;
}

function getTypeLabel(test) {
  const labels = {
    chapter: "Chapter-wise",
    mixed: "Mixed Biology",
    full: "Full Syllabus"
  };

  return labels[test.type] || test.category || "Biology";
}

function getStatusLabel(status) {
  const labels = {
    live: "● LIVE",
    upcoming: "UPCOMING",
    previous: "PREVIOUS"
  };

  return labels[status];
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}

function getTests() {
  if (!Array.isArray(TESTS)) return [];

  return [...TESTS].sort((a, b) => {
    return a.date.localeCompare(b.date) || a.id - b.id;
  });
}

function getTestUrl(test) {
  /*
   * A test is enabled only after its actual CBT URL
   * is added to that test's object in tests.js.
   */
  return typeof test.cbtUrl === "string" &&
    test.cbtUrl.trim().length > 0
    ? test.cbtUrl.trim()
    : "";
}

function renderTestCard(test, plannerMode = false) {
  const status = getStatus(test);
  const questions = getQuestionCount(test);
  const duration = getDuration(test);
  const url = getTestUrl(test);
  const typeLabel = getTypeLabel(test);

  const statusHTML = `
    <span class="status-badge status-${status}">
      ${escapeHTML(getStatusLabel(status))}
    </span>
  `;

  const cardClass = plannerMode ? "planner-test" : "test-card";

  const syllabusHTML = `
    <div class="syllabus-box">
      <strong>📚 Syllabus / Chapters</strong>
      <p>${escapeHTML(test.syllabus)}</p>
    </div>
  `;

  const actionHTML = `
    <div class="test-actions">
      <button
        class="start-test-button"
        type="button"
        data-start-test="${test.id}"
        ${!url ? "disabled" : ""}
        title="${url ? "Open CBT test" : "Upload CBT HTML and add its URL in tests.js"}"
      >
        ${url ? "Start Test →" : "CBT Not Added"}
      </button>
      ${
        !plannerMode
          ? `<button class="details-button" type="button"
              data-show-planner="${test.id}">Planner</button>`
          : ""
      }
    </div>
  `;

  return `
    <article class="${cardClass}" id="test-${test.id}">
      <div class="${plannerMode ? "planner-test-top" : "test-card-top"}">
        <span class="test-number">
          TEST ${String(test.id).padStart(2, "0")}
        </span>
        ${statusHTML}
      </div>

      <h3>${escapeHTML(test.title)}</h3>
      <span class="test-category">${escapeHTML(typeLabel)}</span>

      <div class="test-meta">
        <div class="meta-item">
          <span aria-hidden="true">📅</span>
          <span><strong>Date</strong>${escapeHTML(formatDate(test.date))}</span>
        </div>
        <div class="meta-item">
          <span aria-hidden="true">🗓</span>
          <span><strong>Day</strong>${escapeHTML(formatDay(test.date))}</span>
        </div>
        <div class="meta-item">
          <span aria-hidden="true">📝</span>
          <span><strong>Questions</strong>${questions}</span>
        </div>
        <div class="meta-item">
          <span aria-hidden="true">⏱</span>
          <span><strong>Duration</strong>${duration} minutes</span>
        </div>
      </div>

      ${syllabusHTML}
      ${actionHTML}
    </article>
  `;
}

let currentFilter = "all";
let currentSearch = "";

function matchesSearch(test, search) {
  if (!search) return true;

  const searchable = [
    test.id,
    test.title,
    test.category,
    test.type,
    test.syllabus,
    formatDate(test.date)
  ].join(" ").toLowerCase();

  return searchable.includes(search.toLowerCase());
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

  for (const test of tests) {
    counts[getStatus(test)]++;
  }

  $("#completed-count").textContent = counts.previous;
  $("#live-count").textContent = counts.live;
  $("#upcoming-count").textContent = counts.upcoming;

  const visible = tests.filter((test) => {
    const statusMatches =
      currentFilter === "all" || getStatus(test) === currentFilter;

    return statusMatches && matchesSearch(test, currentSearch);
  });

  if (!visible.length) {
    list.innerHTML = `
      <div class="empty-state">
        No tests match your search or selected filter.
      </div>
    `;
    return;
  }

  list.innerHTML = visible
    .map((test) => renderTestCard(test))
    .join("");
}

function renderPlanner() {
  const list = $("#planner-list");
  if (!list) return;

  const selectedMonth = $("#planner-month")?.value || "all";

  const tests = getTests().filter((test) => {
    return selectedMonth === "all" ||
      test.date.startsWith(selectedMonth);
  });

  if (!tests.length) {
    list.innerHTML = `
      <div class="empty-state">No tests found for this month.</div>
    `;
    return;
  }

  list.innerHTML = tests
    .map((test) => renderTestCard(test, true))
    .join("");
}

function updateCountdown() {
  const target = new Date(CONFIG.targetDate).getTime();
  const now = Date.now();
  const remaining = Math.max(0, target - now);

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if ($("#days")) $("#days").textContent = days;
  if ($("#hours")) $("#hours").textContent = String(hours).padStart(2, "0");
  if ($("#minutes")) $("#minutes").textContent = String(minutes).padStart(2, "0");
  if ($("#seconds")) $("#seconds").textContent = String(seconds).padStart(2, "0");
}

function openDashboard() {
  const transition = $("#transition-screen");
  const counter = $("#transition-seconds");

  if (!transition) {
    $("#dashboard")?.scrollIntoView({ behavior: "smooth" });
    return;
  }

  transition.hidden = false;

  let remaining = CONFIG.transitionSeconds;
  if (counter) counter.textContent = remaining;

  const startedAt = Date.now();

  function tick() {
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    remaining = Math.max(0, CONFIG.transitionSeconds - elapsed);

    if (counter) counter.textContent = remaining;

    if (remaining <= 0) {
      transition.hidden = true;
      $("#dashboard")?.scrollIntoView({ behavior: "smooth" });
      renderDashboard();
      return;
    }

    window.setTimeout(tick, 150);
  }

  window.setTimeout(tick, 150);
}

function connectEvents() {
  $("#enter-series")?.addEventListener("click", openDashboard);

  $("#back-home")?.addEventListener("click", () => {
    $("#home")?.scrollIntoView({ behavior: "smooth" });
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

  $("#test-search")?.addEventListener("input", (event) => {
    currentSearch = event.target.value.trim();
    renderDashboard();
  });

  $("#planner-month")?.addEventListener("change", renderPlanner);

  document.addEventListener("click", (event) => {
    const startButton = event.target.closest("[data-start-test]");

    if (startButton && !startButton.disabled) {
      const testId = Number(startButton.dataset.startTest);
      const test = getTests().find((item) => item.id === testId);
      const url = test ? getTestUrl(test) : "";

      if (url) {
        window.location.href = url;
      }

      return;
    }

    const plannerButton = event.target.closest("[data-show-planner]");

    if (plannerButton) {
      const testId = Number(plannerButton.dataset.showPlanner);
      const target = document.getElementById(`test-${testId}`);

      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        $("#planner")?.scrollIntoView({ behavior: "smooth" });
      }
    }
  });
}

function initialiseApp() {
  if (!Array.isArray(TESTS)) {
    console.error("tests.js did not provide a valid TESTS array.");
    return;
  }

  if (TESTS.length !== 50) {
    console.warn(`Expected 50 tests, received ${TESTS.length}.`);
  }

  updateCountdown();
  renderDashboard();
  renderPlanner();
  connectEvents();

  // Refresh status automatically when the calendar date changes.
  window.setInterval(() => {
    updateCountdown();
    renderDashboard();
    renderPlanner();
  }, 60 * 1000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialiseApp);
} else {
  initialiseApp();
}
