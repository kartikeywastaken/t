/* =========================================================
   CRIMENET | Cases
   ========================================================= */

(() => {
  "use strict";

  const DATA_KEY = "crimeNetData";
  const PROFILE_KEY = "crimeNetAdminProfile";

  const DEMO_CASES = [
    {
      id: "CR-001",
      title: "Operation Northstar",
      status: "active",
      priority: "high",
      summary:
        "Investigation involving a coordinated network with multiple linked entities.",
      entityCount: 14,
      updated: "2026-09-15"
    },
    {
      id: "CR-002",
      title: "Project Meridian",
      status: "under-investigation",
      priority: "critical",
      summary:
        "Cross-entity investigation involving financial and communication links.",
      entityCount: 21,
      updated: "2026-09-13"
    },
    {
      id: "CR-003",
      title: "Financial Corridor",
      status: "active",
      priority: "medium",
      summary:
        "Analysis of suspected financial relationships between multiple entities.",
      entityCount: 9,
      updated: "2026-09-10"
    },
    {
      id: "CR-004",
      title: "Harbor Link",
      status: "closed",
      priority: "low",
      summary:
        "Completed investigation involving historical relationship analysis.",
      entityCount: 7,
      updated: "2026-09-05"
    }
  ];

  let allCases = [];
  let filteredCases = [];
  let selectedCase = null;

  const $ = (id) => document.getElementById(id);

  /* ---------------------------------------------------------
     Utility
     --------------------------------------------------------- */

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getStoredData() {
    try {
      return JSON.parse(localStorage.getItem(DATA_KEY)) || {};
    } catch {
      return {};
    }
  }

  function saveStoredData(data) {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
  }

  function normalizeStatus(status) {
    const value = String(status || "active")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-")
      .replace(/\s+/g, "-");

    if (value.includes("closed")) return "closed";
    if (value.includes("archived")) return "archived";
    if (
      value.includes("investigation") ||
      value === "investigating" ||
      value === "pending"
    ) {
      return "under-investigation";
    }

    return "active";
  }

  function normalizePriority(priority) {
    const value = String(priority || "medium").trim().toLowerCase();

    if (["critical", "urgent", "severe"].includes(value)) return "critical";
    if (["high", "important"].includes(value)) return "high";
    if (["low", "minor"].includes(value)) return "low";

    return "medium";
  }

  function getCaseId(item) {
    return (
      item?.id ||
      item?.caseId ||
      item?.case_id ||
      item?.reference ||
      item?.caseNumber ||
      "UNKNOWN"
    );
  }

  function getCaseTitle(item) {
    return (
      item?.title ||
      item?.name ||
      item?.caseName ||
      item?.caseTitle ||
      "Untitled Case"
    );
  }

  function getCaseSummary(item) {
    return (
      item?.summary ||
      item?.description ||
      item?.details ||
      "No case summary available."
    );
  }

  function getUpdatedDate(item) {
    return (
      item?.updated ||
      item?.updatedAt ||
      item?.lastUpdated ||
      item?.modifiedAt ||
      item?.createdAt ||
      new Date().toISOString()
    );
  }

  function getEntityCount(item) {
    if (Number.isFinite(Number(item?.entityCount))) {
      return Number(item.entityCount);
    }

    if (Array.isArray(item?.entities)) {
      return item.entities.length;
    }

    if (Array.isArray(item?.entityIds)) {
      return item.entityIds.length;
    }

    return 0;
  }

  function normalizeCase(item) {
    return {
      ...item,
      id: getCaseId(item),
      title: getCaseTitle(item),
      status: normalizeStatus(item?.status),
      priority: normalizePriority(item?.priority),
      summary: getCaseSummary(item),
      entityCount: getEntityCount(item),
      updated: getUpdatedDate(item)
    };
  }

  function formatStatus(status) {
    const labels = {
      active: "Active",
      "under-investigation": "Under Investigation",
      closed: "Closed",
      archived: "Archived"
    };

    return labels[status] || "Active";
  }

  function formatPriority(priority) {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  }

  function formatDate(dateValue) {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return String(dateValue);
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  function getSearchText(item) {
    return [
      item.id,
      item.title,
      item.summary,
      item.location,
      item.investigator,
      item.assignedTo,
      item.category,
      item.status,
      item.priority
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  /* ---------------------------------------------------------
     Data
     --------------------------------------------------------- */

  function loadCases() {
    const data = getStoredData();

    let storedCases = data.cases;

    if (Array.isArray(storedCases)) {
      allCases = storedCases.map(normalizeCase);
    } else if (
      storedCases &&
      typeof storedCases === "object"
    ) {
      allCases = Object.entries(storedCases).map(([key, value]) =>
        normalizeCase({
          ...(value || {}),
          id: value?.id || value?.caseId || key
        })
      );
    } else {
      allCases = DEMO_CASES.map((item) => ({ ...item }));
    }

    if (!allCases.length) {
      allCases = DEMO_CASES.map((item) => ({ ...item }));
    }
  }

  function persistCases() {
    const data = getStoredData();

    data.cases = allCases.map((item) => ({
      ...item
    }));

    saveStoredData(data);
  }

  /* ---------------------------------------------------------
     Profile Sync
     --------------------------------------------------------- */

  function loadProfile() {
    let profile;

    try {
      profile = JSON.parse(
        localStorage.getItem(PROFILE_KEY)
      );
    } catch {
      profile = null;
    }

    if (!profile) {
      profile = {
        firstName: "System",
        lastName: "Analyst",
        designation: "Senior Investigator",
        role: "Administrator",
        profileImage: ""
      };
    }

    const fullName =
      `${profile.firstName || ""} ${profile.lastName || ""}`
        .trim() || "System Analyst";

    const role =
      profile.designation ||
      profile.role ||
      "Senior Investigator";

    const nameElement = $("profileName");
    const roleElement = $("profileRole");
    const avatar = $("profileAvatar");

    if (nameElement) {
      nameElement.textContent = fullName;
    }

    if (roleElement) {
      roleElement.textContent = role;
    }

    if (avatar) {
      if (profile.profileImage) {
        avatar.style.backgroundImage =
          `url("${profile.profileImage}")`;
        avatar.textContent = "";
      } else {
        avatar.style.backgroundImage = "";
        avatar.textContent =
          fullName
            .split(" ")
            .map((word) => word[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
      }
    }
  }

  /* ---------------------------------------------------------
     Metrics
     --------------------------------------------------------- */

  function updateMetrics() {
    const total = allCases.length;

    const active = allCases.filter(
      (item) => item.status === "active"
    ).length;

    const highPriority = allCases.filter(
      (item) =>
        item.priority === "high" ||
        item.priority === "critical"
    ).length;

    const closed = allCases.filter(
      (item) =>
        item.status === "closed" ||
        item.status === "archived"
    ).length;

    if ($("totalCases")) {
      $("totalCases").textContent = total;
    }

    if ($("activeCases")) {
      $("activeCases").textContent = active;
    }

    if ($("highPriorityCases")) {
      $("highPriorityCases").textContent = highPriority;
    }

    if ($("closedCases")) {
      $("closedCases").textContent = closed;
    }
  }

  /* ---------------------------------------------------------
     Table
     --------------------------------------------------------- */

  function renderCases() {
    const tbody = $("casesTableBody");
    const emptyState = $("emptyState");
    const resultCount = $("resultCount");

    if (!tbody) return;

    tbody.innerHTML = "";

    if (resultCount) {
      resultCount.textContent =
        `${filteredCases.length} ${
          filteredCases.length === 1 ? "case" : "cases"
        }`;
    }

    if (!filteredCases.length) {
      if (emptyState) {
        emptyState.style.display = "flex";
      }

      return;
    }

    if (emptyState) {
      emptyState.style.display = "none";
    }

    filteredCases.forEach((item) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>
          <span class="case-id">
            ${escapeHtml(item.id)}
          </span>
        </td>

        <td>
          <div class="case-name">
            <strong>${escapeHtml(item.title)}</strong>
            <small>
              ${escapeHtml(
                String(item.summary || "").slice(0, 85)
              )}${String(item.summary || "").length > 85 ? "…" : ""}
            </small>
          </div>
        </td>

        <td>
          <span class="status-badge status-${escapeHtml(item.status)}">
            ${escapeHtml(formatStatus(item.status))}
          </span>
        </td>

        <td>
          <span class="priority-badge priority-${escapeHtml(item.priority)}">
            ${escapeHtml(formatPriority(item.priority))}
          </span>
        </td>

        <td>
          <span class="entity-count">
            ${item.entityCount}
          </span>
        </td>

        <td>
          ${escapeHtml(formatDate(item.updated))}
        </td>

        <td>
          <button
            type="button"
            class="view-case"
            data-case-id="${escapeHtml(item.id)}"
          >
            View
          </button>
        </td>
      `;

      tbody.appendChild(row);
    });

    tbody.querySelectorAll(".view-case").forEach((button) => {
      button.addEventListener("click", () => {
        openCaseDetails(button.dataset.caseId);
      });
    });
  }

  /* ---------------------------------------------------------
     Filters
     --------------------------------------------------------- */

  function applyFilters() {
    const search =
      ($("caseSearch")?.value || "")
        .trim()
        .toLowerCase();

    const status =
      $("statusFilter")?.value || "all";

    const priority =
      $("priorityFilter")?.value || "all";

    const sort =
      $("sortCases")?.value || "updated-desc";

    filteredCases = allCases.filter((item) => {
      const matchesSearch =
        !search || getSearchText(item).includes(search);

      const matchesStatus =
        status === "all" ||
        item.status === status;

      const matchesPriority =
        priority === "all" ||
        item.priority === priority;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });

    filteredCases.sort((a, b) => {
      switch (sort) {
        case "updated-asc":
          return (
            new Date(a.updated) -
            new Date(b.updated)
          );

        case "name-asc":
          return a.title.localeCompare(b.title);

        case "name-desc":
          return b.title.localeCompare(a.title);

        case "priority":
          return (
            priorityWeight(b.priority) -
            priorityWeight(a.priority)
          );

        case "updated-desc":
        default:
          return (
            new Date(b.updated) -
            new Date(a.updated)
          );
      }
    });

    renderCases();
  }

  function priorityWeight(priority) {
    const weights = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1
    };

    return weights[priority] || 0;
  }

  function clearFilters() {
    if ($("caseSearch")) {
      $("caseSearch").value = "";
    }

    if ($("statusFilter")) {
      $("statusFilter").value = "all";
    }

    if ($("priorityFilter")) {
      $("priorityFilter").value = "all";
    }

    if ($("sortCases")) {
      $("sortCases").value = "updated-desc";
    }

    applyFilters();
  }

  /* ---------------------------------------------------------
     Case Details
     --------------------------------------------------------- */

  function openCaseDetails(caseId) {
    const found = allCases.find(
      (item) => String(item.id) === String(caseId)
    );

    if (!found) return;

    selectedCase = found;

    if ($("detailCaseTitle")) {
      $("detailCaseTitle").textContent =
        found.title;
    }

    if ($("detailCaseId")) {
      $("detailCaseId").textContent =
        found.id;
    }

    if ($("detailCaseStatus")) {
      $("detailCaseStatus").textContent =
        formatStatus(found.status);

      $("detailCaseStatus").className =
        `status-badge status-${found.status}`;
    }

    if ($("detailCasePriority")) {
      $("detailCasePriority").textContent =
        formatPriority(found.priority);

      $("detailCasePriority").className =
        `priority-badge priority-${found.priority}`;
    }

    if ($("detailCaseUpdated")) {
      $("detailCaseUpdated").textContent =
        formatDate(found.updated);
    }

    if ($("detailCaseSummary")) {
      $("detailCaseSummary").textContent =
        found.summary;
    }

    const intelligenceBtn = $("openIntelligence");
    const networkBtn = $("openNetwork");
    const reportBtn = $("openReport");

    if (intelligenceBtn) {
      intelligenceBtn.href =
        `intelligence.html?case=${encodeURIComponent(found.id)}`;
    }

    if (networkBtn) {
      networkBtn.href =
        `network.html?case=${encodeURIComponent(found.id)}`;
    }

    if (reportBtn) {
      reportBtn.href =
        `reports.html?case=${encodeURIComponent(found.id)}`;
    }

    const card = $("caseDetailCard");

    if (card) {
      card.style.display = "block";

      card.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  function closeCaseDetails() {
    selectedCase = null;

    const card = $("caseDetailCard");

    if (card) {
      card.style.display = "none";
    }
  }

  /* ---------------------------------------------------------
     New Case Modal
     --------------------------------------------------------- */

  function generateCaseId() {
    const numbers = allCases
      .map((item) => {
        const match =
          String(item.id).match(/CR-(\d+)/i);

        return match
          ? Number(match[1])
          : 0;
      })
      .filter(Boolean);

    const nextNumber =
      (numbers.length
        ? Math.max(...numbers)
        : 0) + 1;

    return `CR-${String(nextNumber).padStart(3, "0")}`;
  }

  function openNewCaseModal() {
    const modal = $("caseModal");

    if (!modal) return;

    const idInput = $("newCaseId");

    if (idInput) {
      idInput.value = generateCaseId();
    }

    modal.style.display = "flex";
  }

  function closeNewCaseModal() {
    const modal = $("caseModal");

    if (modal) {
      modal.style.display = "none";
    }

    $("newCaseForm")?.reset();

    const idInput = $("newCaseId");

    if (idInput) {
      idInput.value = generateCaseId();
    }
  }

  function createCase(event) {
    event.preventDefault();

    const id =
      $("newCaseId")?.value.trim() ||
      generateCaseId();

    const title =
      $("newCaseTitle")?.value.trim();

    const status =
      normalizeStatus(
        $("newCaseStatus")?.value
      );

    const priority =
      normalizePriority(
        $("newCasePriority")?.value
      );

    const summary =
      $("newCaseSummary")?.value.trim() ||
      "No case summary available.";

    if (!title) {
      $("newCaseTitle")?.focus();
      return;
    }

    const duplicate = allCases.some(
      (item) =>
        String(item.id).toLowerCase() ===
        id.toLowerCase()
    );

    if (duplicate) {
      alert("A case with this ID already exists.");
      return;
    }

    const newCase = {
      id,
      title,
      status,
      priority,
      summary,
      entityCount: 0,
      updated: new Date().toISOString()
    };

    allCases.unshift(newCase);

    persistCases();
    updateMetrics();
    applyFilters();
    closeNewCaseModal();

    openCaseDetails(id);
  }

  /* ---------------------------------------------------------
     Navigation / Logout
     --------------------------------------------------------- */

  function setupNavigation() {
    const logoutButtons = [
      document.querySelector(".logout"),
      $("accountLogoutBtn")
    ].filter(Boolean);

    logoutButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();

        const confirmed = confirm(
          "Are you sure you want to logout?"
        );

        if (confirmed) {
          window.location.href = "login.html";
        }
      });
    });
  }

  /* ---------------------------------------------------------
     Events
     --------------------------------------------------------- */

  function setupEvents() {
    $("caseSearch")?.addEventListener(
      "input",
      applyFilters
    );

    $("statusFilter")?.addEventListener(
      "change",
      applyFilters
    );

    $("priorityFilter")?.addEventListener(
      "change",
      applyFilters
    );

    $("sortCases")?.addEventListener(
      "change",
      applyFilters
    );

    $("clearFilters")?.addEventListener(
      "click",
      clearFilters
    );

    $("refreshCases")?.addEventListener(
      "click",
      () => {
        loadCases();
        updateMetrics();
        applyFilters();
      }
    );

    $("newCaseBtn")?.addEventListener(
      "click",
      openNewCaseModal
    );

    $("closeCaseModal")?.addEventListener(
      "click",
      closeNewCaseModal
    );

    $("cancelNewCase")?.addEventListener(
      "click",
      closeNewCaseModal
    );

    $("newCaseForm")?.addEventListener(
      "submit",
      createCase
    );

    $("closeCaseDetail")?.addEventListener(
      "click",
      closeCaseDetails
    );

    $("caseModal")?.addEventListener(
      "click",
      (event) => {
        if (
          event.target === $("caseModal")
        ) {
          closeNewCaseModal();
        }
      }
    );

    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape") {
          closeNewCaseModal();
          closeCaseDetails();
        }
      }
    );

    window.addEventListener(
      "storage",
      (event) => {
        if (event.key === PROFILE_KEY) {
          loadProfile();
        }

        if (event.key === DATA_KEY) {
          loadCases();
          updateMetrics();
          applyFilters();
        }
      }
    );
  }

  /* ---------------------------------------------------------
     Initialize
     --------------------------------------------------------- */

  function init() {
    loadProfile();
    loadCases();
    updateMetrics();
    applyFilters();
    setupEvents();
    setupNavigation();

    const params =
      new URLSearchParams(
        window.location.search
      );

    const caseFromUrl =
      params.get("case");

    if (caseFromUrl) {
      setTimeout(() => {
        openCaseDetails(caseFromUrl);
      }, 100);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }
})();