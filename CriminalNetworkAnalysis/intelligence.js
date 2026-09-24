/* =========================================================
   CRIMENET | INTELLIGENCE HUB
   ========================================================= */

(() => {
  "use strict";

  const DATA_KEY = "crimeNetData";
  const PROFILE_KEY = "crimeNetAdminProfile";
  const SETTINGS_KEY = "crimeNetSettings";

  const DEFAULT_PROFILE = {
    firstName: "System",
    lastName: "Analyst",
    email: "analyst@crimenet.com",
    designation: "Senior Investigator",
    role: "Administrator",
    theme: "dark",
    density: "comfortable",
    profileImage: ""
  };

  /* =======================================================
     HELPERS
     ======================================================= */

  const $ = (selector) => document.querySelector(selector);

  const escapeHTML = (value) => {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const safeParse = (value, fallback) => {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  };

  const normalizeText = (value) =>
    String(value ?? "")
      .trim()
      .toLowerCase();

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const formatDateTime = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const nowISO = () => new Date().toISOString();

  /* =======================================================
     PROFILE
     ======================================================= */

  let profile = {
    ...DEFAULT_PROFILE,
    ...safeParse(
      localStorage.getItem(PROFILE_KEY) || "{}",
      {}
    )
  };

  const getProfileName = () => {
    const fullName = [
      profile.firstName,
      profile.lastName
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return fullName || "System Analyst";
  };

  function syncProfile() {
    profile = {
      ...DEFAULT_PROFILE,
      ...safeParse(
        localStorage.getItem(PROFILE_KEY) || "{}",
        {}
      )
    };

    const name = getProfileName();
    const role =
      profile.designation ||
      profile.role ||
      "Senior Investigator";

    const nameEl = $("#profileName");
    const roleEl = $("#profileRole");
    const avatarEl = $("#profileAvatar");

    if (nameEl) {
      nameEl.textContent = name;
    }

    if (roleEl) {
      roleEl.textContent = role;
    }

    if (avatarEl) {
      if (profile.profileImage) {
        avatarEl.innerHTML = `
          <img
            src="${escapeHTML(profile.profileImage)}"
            alt="${escapeHTML(name)}"
          />
        `;
      } else {
        avatarEl.innerHTML =
          '<i class="fa-solid fa-user"></i>';
      }
    }
  }

  /* =======================================================
     DEMO INTELLIGENCE DATA
     ======================================================= */

  const DEMO_INTELLIGENCE = [
    {
      id: "INT-001",
      title: "Suspicious financial transfer pattern",
      type: "financial",
      priority: "high",
      status: "active",
      caseId: "CR-001",
      source: "Financial Monitoring Unit",
      summary:
        "Multiple transfers indicate a possible financial connection between identified entities.",
      entities: [
        "ENT-001",
        "ENT-003"
      ],
      updatedAt: "2026-09-16T10:20:00"
    },
    {
      id: "INT-002",
      title: "Vehicle movement observation",
      type: "surveillance",
      priority: "medium",
      status: "review",
      caseId: "CR-002",
      source: "Field Surveillance",
      summary:
        "Repeated vehicle movement was observed near locations associated with the investigation.",
      entities: [
        "ENT-002",
        "ENT-004"
      ],
      updatedAt: "2026-09-15T15:45:00"
    },
    {
      id: "INT-003",
      title: "Communication relationship identified",
      type: "communication",
      priority: "high",
      status: "verified",
      caseId: "CR-003",
      source: "Communication Analysis",
      summary:
        "Analysis identified a recurring communication relationship between relevant entities.",
      entities: [
        "ENT-001",
        "ENT-005"
      ],
      updatedAt: "2026-09-14T09:30:00"
    },
    {
      id: "INT-004",
      title: "Digital activity anomaly",
      type: "digital",
      priority: "medium",
      status: "active",
      caseId: "CR-004",
      source: "Digital Forensics",
      summary:
        "An unusual digital activity pattern requires further analytical review.",
      entities: [
        "ENT-003"
      ],
      updatedAt: "2026-09-13T18:10:00"
    },
    {
      id: "INT-005",
      title: "Field source information",
      type: "field",
      priority: "low",
      status: "archived",
      caseId: "CR-001",
      source: "Field Intelligence",
      summary:
        "Information received from a field source and retained for case reference.",
      entities: [
        "ENT-002"
      ],
      updatedAt: "2026-09-12T11:05:00"
    }
  ];

  let intelligenceRecords = [];
  let selectedIntelligence = null;

  /* =======================================================
     DATA NORMALIZATION
     ======================================================= */

  function normalizeIntelligence(item, index = 0) {
    if (!item || typeof item !== "object") {
      return null;
    }

    const entities =
      Array.isArray(item.entities)
        ? item.entities
        : Array.isArray(item.relatedEntities)
          ? item.relatedEntities
          : typeof item.entities === "string"
            ? item.entities
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean)
            : [];

    return {
      id:
        item.id ||
        item.intelligenceId ||
        `INT-${String(index + 1).padStart(3, "0")}`,

      title:
        item.title ||
        item.name ||
        item.subject ||
        "Untitled Intelligence",

      type:
        normalizeType(item.type || item.intelligenceType),

      priority:
        normalizePriority(item.priority || item.risk),

      status:
        normalizeStatus(item.status),

      caseId:
        item.caseId ||
        item.case ||
        item.relatedCase ||
        "",

      source:
        item.source ||
        item.origin ||
        item.sourceName ||
        "Unknown",

      summary:
        item.summary ||
        item.description ||
        item.details ||
        "No intelligence summary available.",

      entities,

      updatedAt:
        item.updatedAt ||
        item.updated ||
        item.timestamp ||
        item.createdAt ||
        nowISO()
    };
  }

  function normalizeType(value) {
    const type = normalizeText(value);

    const allowed = [
      "tip",
      "surveillance",
      "financial",
      "communication",
      "digital",
      "field"
    ];

    return allowed.includes(type) ? type : "tip";
  }

  function normalizePriority(value) {
    const priority = normalizeText(value);

    if (priority === "high" || priority === "critical") {
      return "high";
    }

    if (priority === "low") {
      return "low";
    }

    return "medium";
  }

  function normalizeStatus(value) {
    const status = normalizeText(value);

    if (
      status === "review" ||
      status === "under review" ||
      status === "pending"
    ) {
      return "review";
    }

    if (
      status === "verified" ||
      status === "confirmed"
    ) {
      return "verified";
    }

    if (
      status === "archived" ||
      status === "closed"
    ) {
      return "archived";
    }

    return "active";
  }

  function loadData() {
    const raw = safeParse(
      localStorage.getItem(DATA_KEY) || "{}",
      {}
    );

    let source = [];

    if (Array.isArray(raw)) {
      source = raw;
    } else if (Array.isArray(raw.intelligence)) {
      source = raw.intelligence;
    } else if (Array.isArray(raw.intelligenceRecords)) {
      source = raw.intelligenceRecords;
    } else if (Array.isArray(raw.intelligenceHub)) {
      source = raw.intelligenceHub;
    } else if (raw.intelligence && typeof raw.intelligence === "object") {
      source = Object.values(raw.intelligence);
    }

    const normalized = source
      .map((item, index) =>
        normalizeIntelligence(item, index)
      )
      .filter(Boolean);

    intelligenceRecords =
      normalized.length > 0
        ? normalized
        : DEMO_INTELLIGENCE.map((item, index) =>
            normalizeIntelligence(item, index)
          );
  }

  function persistData() {
    const raw = safeParse(
      localStorage.getItem(DATA_KEY) || "{}",
      {}
    );

    if (
      raw &&
      !Array.isArray(raw) &&
      typeof raw === "object"
    ) {
      raw.intelligence = intelligenceRecords;

      localStorage.setItem(
        DATA_KEY,
        JSON.stringify(raw)
      );
    } else {
      localStorage.setItem(
        DATA_KEY,
        JSON.stringify({
          intelligence: intelligenceRecords
        })
      );
    }
  }

  /* =======================================================
     TYPE LABELS
     ======================================================= */

  function typeLabel(type) {
    const labels = {
      tip: "Tip / Lead",
      surveillance: "Surveillance",
      financial: "Financial",
      communication: "Communication",
      digital: "Digital",
      field: "Field Intelligence"
    };

    return labels[type] || "Intelligence";
  }

  function priorityLabel(priority) {
    return (
      priority.charAt(0).toUpperCase() +
      priority.slice(1)
    );
  }

  function statusLabel(status) {
    const labels = {
      active: "Active",
      review: "Under Review",
      verified: "Verified",
      archived: "Archived"
    };

    return labels[status] || "Active";
  }

  /* =======================================================
     CLOCK
     ======================================================= */

  function updateClock() {
    const now = new Date();

    const dateEl = $("#currentDate");
    const timeEl = $("#currentTime");

    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString(
        "en-IN",
        {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric"
        }
      );
    }

    if (timeEl) {
      timeEl.textContent = now.toLocaleTimeString(
        "en-IN",
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }
      );
    }
  }

  /* =======================================================
     METRICS
     ======================================================= */

  function updateMetrics(records) {
    const total = records.length;

    const highPriority = records.filter(
      (item) => item.priority === "high"
    ).length;

    const active = records.filter(
      (item) =>
        item.status === "active" ||
        item.status === "review"
    ).length;

    const verified = records.filter(
      (item) => item.status === "verified"
    ).length;

    const totalEl = $("#totalIntelligence");
    const highEl = $("#highPriorityIntelligence");
    const activeEl = $("#activeAnalysis");
    const verifiedEl = $("#verifiedIntelligence");

    if (totalEl) {
      totalEl.textContent = total;
    }

    if (highEl) {
      highEl.textContent = highPriority;
    }

    if (activeEl) {
      activeEl.textContent = active;
    }

    if (verifiedEl) {
      verifiedEl.textContent = verified;
    }
  }

  /* =======================================================
     FILTERING
     ======================================================= */

  function getFilteredRecords() {
    const search =
      normalizeText(
        $("#intelligenceSearch")?.value
      );

    const type =
      $("#intelligenceTypeFilter")?.value ||
      "all";

    const priority =
      $("#intelligencePriorityFilter")?.value ||
      "all";

    const status =
      $("#intelligenceStatusFilter")?.value ||
      "all";

    const sort =
      $("#sortIntelligence")?.value ||
      "updated-desc";

    let records = intelligenceRecords.filter(
      (item) => {

        const searchable = [
          item.id,
          item.title,
          item.type,
          typeLabel(item.type),
          item.priority,
          item.status,
          item.caseId,
          item.source,
          item.summary,
          ...(item.entities || [])
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !search ||
          searchable.includes(search);

        const matchesType =
          type === "all" ||
          item.type === type;

        const matchesPriority =
          priority === "all" ||
          item.priority === priority;

        const matchesStatus =
          status === "all" ||
          item.status === status;

        return (
          matchesSearch &&
          matchesType &&
          matchesPriority &&
          matchesStatus
        );
      }
    );

    records.sort((a, b) => {

      if (sort === "title-asc") {
        return a.title.localeCompare(b.title);
      }

      if (sort === "title-desc") {
        return b.title.localeCompare(a.title);
      }

      if (sort === "priority-desc") {
        const order = {
          high: 3,
          medium: 2,
          low: 1
        };

        return (
          (order[b.priority] || 0) -
          (order[a.priority] || 0)
        );
      }

      return (
        new Date(b.updatedAt) -
        new Date(a.updatedAt)
      );
    });

    return records;
  }

  /* =======================================================
     RENDER TABLE
     ======================================================= */

  function renderTable() {
    const tbody = $("#intelligenceTableBody");
    const emptyState = $("#emptyState");
    const resultCount = $("#resultCount");

    if (!tbody) return;

    const records = getFilteredRecords();

    if (resultCount) {
      resultCount.textContent =
        `${records.length} ${
          records.length === 1
            ? "record"
            : "records"
        }`;
    }

    updateMetrics(intelligenceRecords);

    if (records.length === 0) {
      tbody.innerHTML = "";

      if (emptyState) {
        emptyState.hidden = false;
      }

      return;
    }

    if (emptyState) {
      emptyState.hidden = true;
    }

    tbody.innerHTML = records
      .map((item) => {

        const caseHTML = item.caseId
          ? `
            <a
              href="cases.html?case=${encodeURIComponent(item.caseId)}"
              class="case-link"
            >
              ${escapeHTML(item.caseId)}
            </a>
          `
          : `<span class="muted-text">—</span>`;

        return `
          <tr data-id="${escapeHTML(item.id)}">

            <td>
              <div class="intelligence-title">
                <strong>
                  ${escapeHTML(item.title)}
                </strong>

                <small>
                  ${escapeHTML(item.id)}
                </small>
              </div>
            </td>

            <td>
              <span class="type-badge">
                ${escapeHTML(typeLabel(item.type))}
              </span>
            </td>

            <td>
              <span
                class="priority-badge ${escapeHTML(item.priority)}"
              >
                ${escapeHTML(
                  priorityLabel(item.priority)
                )}
              </span>
            </td>

            <td>
              <span
                class="status-badge ${escapeHTML(item.status)}"
              >
                ${escapeHTML(
                  statusLabel(item.status)
                )}
              </span>
            </td>

            <td>
              ${caseHTML}
            </td>

            <td>
              ${escapeHTML(
                formatDate(item.updatedAt)
              )}
            </td>

            <td>
              <button
                class="table-action view-intelligence"
                type="button"
                data-id="${escapeHTML(item.id)}"
                title="View intelligence"
              >
                <i class="fa-solid fa-eye"></i>
              </button>
            </td>

          </tr>
        `;
      })
      .join("");

    tbody
      .querySelectorAll(".view-intelligence")
      .forEach((button) => {
        button.addEventListener("click", () => {
          openDetail(button.dataset.id);
        });
      });
  }

  /* =======================================================
     DETAIL PANEL
     ======================================================= */

  function openDetail(id) {
    const record = intelligenceRecords.find(
      (item) => item.id === id
    );

    if (!record) return;

    selectedIntelligence = record;

    const detailCard = $("#intelligenceDetailCard");

    if (!detailCard) return;

    const title = $("#detailIntelligenceTitle");
    const recordId = $("#detailIntelligenceId");
    const status = $("#detailIntelligenceStatus");
    const priority = $("#detailIntelligencePriority");
    const updated = $("#detailIntelligenceUpdated");
    const summary = $("#detailIntelligenceSummary");
    const source = $("#detailIntelligenceSource");
    const caseEl = $("#detailIntelligenceCase");
    const entitiesEl = $("#detailIntelligenceEntities");

    if (title) {
      title.textContent = record.title;
    }

    if (recordId) {
      recordId.textContent = record.id;
    }

    if (status) {
      status.className =
        `status-badge ${record.status}`;
      status.textContent =
        statusLabel(record.status);
    }

    if (priority) {
      priority.className =
        `priority-badge ${record.priority}`;
      priority.textContent =
        priorityLabel(record.priority);
    }

    if (updated) {
      updated.textContent =
        formatDateTime(record.updatedAt);
    }

    if (summary) {
      summary.textContent = record.summary;
    }

    if (source) {
      source.textContent = record.source;
    }

    if (caseEl) {
      if (record.caseId) {
        caseEl.innerHTML = `
          <a
            href="cases.html?case=${encodeURIComponent(record.caseId)}"
            class="case-link"
          >
            ${escapeHTML(record.caseId)}
          </a>
        `;
      } else {
        caseEl.textContent = "—";
      }
    }

    if (entitiesEl) {
      if (
        Array.isArray(record.entities) &&
        record.entities.length
      ) {
        entitiesEl.innerHTML =
          record.entities
            .map(
              (entity) => `
                <span class="entity-tag">
                  ${escapeHTML(entity)}
                </span>
              `
            )
            .join("");
      } else {
        entitiesEl.innerHTML = `
          <span class="muted-text">
            No entities linked
          </span>
        `;
      }
    }

    detailCard.hidden = false;

    detailCard.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function closeDetail() {
    selectedIntelligence = null;

    const detailCard = $("#intelligenceDetailCard");

    if (detailCard) {
      detailCard.hidden = true;
    }
  }

  /* =======================================================
     MODAL
     ======================================================= */

  function openModal() {
    const modal = $("#intelligenceModal");

    if (!modal) return;

    const form = $("#newIntelligenceForm");

    if (form) {
      form.reset();
    }

    const idInput = $("#newIntelligenceId");

    if (idInput) {
      idInput.value =
        generateNextId();
    }

    modal.hidden = false;

    document.body.style.overflow = "hidden";

    setTimeout(() => {
      $("#newIntelligenceTitle")?.focus();
    }, 50);
  }

  function closeModal() {
    const modal = $("#intelligenceModal");

    if (modal) {
      modal.hidden = true;
    }

    document.body.style.overflow = "";
  }

  function generateNextId() {
    let highest = 0;

    intelligenceRecords.forEach((item) => {
      const match =
        String(item.id).match(/(\d+)$/);

      if (match) {
        highest = Math.max(
          highest,
          Number(match[1])
        );
      }
    });

    return `INT-${String(highest + 1).padStart(3, "0")}`;
  }

  /* =======================================================
     CREATE INTELLIGENCE
     ======================================================= */

  function createIntelligence(event) {
    event.preventDefault();

    const id =
      $("#newIntelligenceId")?.value.trim() ||
      generateNextId();

    const title =
      $("#newIntelligenceTitle")?.value.trim();

    const type =
      $("#newIntelligenceType")?.value ||
      "tip";

    const priority =
      $("#newIntelligencePriority")?.value ||
      "medium";

    const status =
      $("#newIntelligenceStatus")?.value ||
      "active";

    const caseId =
      $("#newIntelligenceCase")?.value.trim() ||
      "";

    const source =
      $("#newIntelligenceSource")?.value.trim() ||
      "Internal Analysis";

    const summary =
      $("#newIntelligenceSummary")?.value.trim();

    if (!title || !summary) {
      showToast(
        "Please complete the required fields."
      );
      return;
    }

    const duplicate = intelligenceRecords.some(
      (item) =>
        normalizeText(item.id) ===
        normalizeText(id)
    );

    if (duplicate) {
      showToast(
        "Intelligence ID already exists."
      );
      return;
    }

    const newRecord = {
      id,
      title,
      type: normalizeType(type),
      priority: normalizePriority(priority),
      status: normalizeStatus(status),
      caseId,
      source,
      summary,
      entities: [],
      updatedAt: nowISO()
    };

    intelligenceRecords.unshift(newRecord);

    persistData();
    renderTable();
    closeModal();
    openDetail(newRecord.id);

    showToast(
      "Intelligence record created."
    );
  }

  /* =======================================================
     EDIT INTELLIGENCE
     ======================================================= */

  function editSelectedIntelligence() {
    if (!selectedIntelligence) {
      showToast(
        "Select an intelligence record first."
      );
      return;
    }

    const record = selectedIntelligence;

    const newTitle = window.prompt(
      "Intelligence title:",
      record.title
    );

    if (newTitle === null) return;

    const cleanTitle = newTitle.trim();

    if (!cleanTitle) {
      showToast(
        "Title cannot be empty."
      );
      return;
    }

    const newSummary = window.prompt(
      "Intelligence summary:",
      record.summary
    );

    if (newSummary === null) return;

    const cleanSummary = newSummary.trim();

    if (!cleanSummary) {
      showToast(
        "Summary cannot be empty."
      );
      return;
    }

    record.title = cleanTitle;
    record.summary = cleanSummary;
    record.updatedAt = nowISO();

    persistData();
    renderTable();
    openDetail(record.id);

    showToast(
      "Intelligence record updated."
    );
  }

  /* =======================================================
     NAVIGATION
     ======================================================= */

  function openRelatedCase() {
    if (!selectedIntelligence?.caseId) {
      showToast(
        "No related case available."
      );
      return;
    }

    window.location.href =
      `cases.html?case=${encodeURIComponent(
        selectedIntelligence.caseId
      )}`;
  }

  function openRelatedNetwork() {
    if (selectedIntelligence?.caseId) {
      window.location.href =
        `network.html?case=${encodeURIComponent(
          selectedIntelligence.caseId
        )}`;
    } else {
      window.location.href =
        "network.html";
    }
  }

  /* =======================================================
     CLEAR FILTERS
     ======================================================= */

  function clearFilters() {
    const search = $("#intelligenceSearch");
    const type = $("#intelligenceTypeFilter");
    const priority = $("#intelligencePriorityFilter");
    const status = $("#intelligenceStatusFilter");
    const sort = $("#sortIntelligence");

    if (search) search.value = "";
    if (type) type.value = "all";
    if (priority) priority.value = "all";
    if (status) status.value = "all";
    if (sort) sort.value = "updated-desc";

    renderTable();
  }

  /* =======================================================
     REFRESH
     ======================================================= */

  function refreshIntelligence() {
    loadData();
    syncProfile();
    renderTable();

    showToast(
      "Intelligence feed refreshed."
    );
  }

  /* =======================================================
     THEME
     ======================================================= */

  function applyTheme(theme) {
    document.body.classList.toggle(
      "light-theme",
      theme === "light"
    );

    const button = $("#themeToggle");

    if (button) {
      button.innerHTML =
        theme === "light"
          ? '<i class="fa-solid fa-sun"></i>'
          : '<i class="fa-solid fa-moon"></i>';
    }
  }

  function loadTheme() {
    const settings = safeParse(
      localStorage.getItem(SETTINGS_KEY) || "{}",
      {}
    );

    const savedTheme =
      profile.theme ||
      settings.theme ||
      "dark";

    applyTheme(savedTheme);
  }

  function toggleTheme() {
    const isLight =
      document.body.classList.contains(
        "light-theme"
      );

    const nextTheme =
      isLight ? "dark" : "light";

    applyTheme(nextTheme);

    profile.theme = nextTheme;

    localStorage.setItem(
      PROFILE_KEY,
      JSON.stringify(profile)
    );

    const settings = safeParse(
      localStorage.getItem(SETTINGS_KEY) || "{}",
      {}
    );

    settings.theme = nextTheme;

    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(settings)
    );
  }

  /* =======================================================
     LOGOUT
     ======================================================= */

  function logout() {
    const confirmed = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmed) return;

    sessionStorage.removeItem(
      "crimeNetLoggedIn"
    );

    window.location.href =
      "login.html";
  }

  /* =======================================================
     TOAST
     ======================================================= */

  let toastTimer = null;

  function showToast(message) {
    const toast = $("#intelligenceToast");
    const messageEl = $("#toastMessage");

    if (!toast) return;

    if (messageEl) {
      messageEl.textContent = message;
    }

    toast.hidden = false;

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toast.hidden = true;
    }, 2800);
  }

  /* =======================================================
     URL CASE / INTELLIGENCE
     ======================================================= */

  function handleURL() {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const intelligenceId =
      params.get("intelligence") ||
      params.get("id") ||
      params.get("intel");

    if (intelligenceId) {
      const record =
        intelligenceRecords.find(
          (item) =>
            normalizeText(item.id) ===
            normalizeText(intelligenceId)
        );

      if (record) {
        openDetail(record.id);
        return;
      }
    }

    const caseId = params.get("case");

    if (caseId) {
      const search = $("#intelligenceSearch");

      if (search) {
        search.value = caseId;
      }

      renderTable();
    }
  }

  /* =======================================================
     EVENT LISTENERS
     ======================================================= */

  function bindEvents() {
    $("#intelligenceSearch")?.addEventListener(
      "input",
      renderTable
    );

    $("#intelligenceTypeFilter")?.addEventListener(
      "change",
      renderTable
    );

    $("#intelligencePriorityFilter")?.addEventListener(
      "change",
      renderTable
    );

    $("#intelligenceStatusFilter")?.addEventListener(
      "change",
      renderTable
    );

    $("#sortIntelligence")?.addEventListener(
      "change",
      renderTable
    );

    $("#clearIntelligenceFilters")?.addEventListener(
      "click",
      clearFilters
    );

    $("#clearEmptyFilters")?.addEventListener(
      "click",
      clearFilters
    );

    $("#refreshIntelligence")?.addEventListener(
      "click",
      refreshIntelligence
    );

    $("#newIntelligenceBtn")?.addEventListener(
      "click",
      openModal
    );

    $("#closeIntelligenceModal")?.addEventListener(
      "click",
      closeModal
    );

    $("#cancelNewIntelligence")?.addEventListener(
      "click",
      closeModal
    );

    $("#newIntelligenceForm")?.addEventListener(
      "submit",
      createIntelligence
    );

    $("#closeIntelligenceDetail")?.addEventListener(
      "click",
      closeDetail
    );

    $("#editIntelligenceBtn")?.addEventListener(
      "click",
      editSelectedIntelligence
    );

    $("#openRelatedCase")?.addEventListener(
      "click",
      openRelatedCase
    );

    $("#openRelatedNetwork")?.addEventListener(
      "click",
      openRelatedNetwork
    );

    $("#themeToggle")?.addEventListener(
      "click",
      toggleTheme
    );

    $("#logoutBtn")?.addEventListener(
      "click",
      logout
    );

    $("#intelligenceModal")?.addEventListener(
      "click",
      (event) => {
        if (
          event.target.id ===
          "intelligenceModal"
        ) {
          closeModal();
        }
      }
    );

    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape") {
          const modal =
            $("#intelligenceModal");

          if (
            modal &&
            !modal.hidden
          ) {
            closeModal();
            return;
          }

          closeDetail();
        }
      }
    );

    window.addEventListener(
      "storage",
      (event) => {

        if (
          event.key === PROFILE_KEY
        ) {
          syncProfile();
          loadTheme();
        }

        if (
          event.key === DATA_KEY
        ) {
          loadData();
          renderTable();
        }

        if (
          event.key === SETTINGS_KEY
        ) {
          loadTheme();
        }
      }
    );
  }

  /* =======================================================
     INITIALIZE
     ======================================================= */

  function init() {
    syncProfile();
    loadData();
    loadTheme();
    updateClock();
    renderTable();
    bindEvents();
    handleURL();

    setInterval(
      updateClock,
      1000
    );
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }

})();