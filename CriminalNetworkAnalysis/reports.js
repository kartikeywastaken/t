/* =========================================================
   CRIMENET | REPORTS
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  /* =======================================================
     STORAGE
     ======================================================= */

  const DATA_KEY = "crimeNetData";
  const PROFILE_KEY = "crimeNetAdminProfile";
  const SETTINGS_KEY = "crimeNetSettings";

  const defaultProfile = {
    firstName: "System",
    lastName: "Analyst",
    email: "analyst@crimenet.com",
    designation: "Senior Investigator",
    role: "Administrator",
    theme: "dark",
    density: "comfortable",
    profileImage: ""
  };

  const defaultSettings = {
    theme: "dark",
    density: "comfortable",
    sidebarBehavior: "expanded",
    notifications: true,
    activityLogging: true
  };

  /* =======================================================
     HELPERS
     ======================================================= */

  function readJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.warn(`Unable to read ${key}`, error);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Unable to save ${key}`, error);
      return false;
    }
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getElement(id) {
    return document.getElementById(id);
  }

  function firstValue(object, keys, fallback = "") {
    if (!object || typeof object !== "object") {
      return fallback;
    }

    for (const key of keys) {
      if (
        object[key] !== undefined &&
        object[key] !== null &&
        String(object[key]).trim() !== ""
      ) {
        return object[key];
      }
    }

    return fallback;
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  function formatDateTime(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function normalizeText(value) {
    return String(value ?? "").trim().toLowerCase();
  }

  /* =======================================================
     PROFILE
     ======================================================= */

  let profile = {
    ...defaultProfile,
    ...readJSON(PROFILE_KEY, {})
  };

  function getProfileName() {
    const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();

    return fullName || "System Analyst";
  }

  function getProfileRole() {
    return profile.designation || profile.role || "Senior Investigator";
  }

  function getInitials(name) {
    const parts = String(name || "System Analyst")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (!parts.length) return "SA";

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  function updateProfileUI() {
    const name = getProfileName();
    const role = getProfileRole();
    const initials = getInitials(name);

    const profileName = getElement("profileName");
    const profileRole = getElement("profileRole");
    const profileAvatar = getElement("profileAvatar");

    if (profileName) {
      profileName.textContent = name;
    }

    if (profileRole) {
      profileRole.textContent = role;
    }

    if (profileAvatar) {
      if (profile.profileImage) {
        profileAvatar.innerHTML = `
          <img
            src="${escapeHTML(profile.profileImage)}"
            alt="${escapeHTML(name)}"
          >
        `;
      } else {
        profileAvatar.textContent = initials;
      }
    }

    const preparedBy = getElement("reportPreparedBy");

    if (preparedBy) {
      preparedBy.textContent = `${name} • ${role}`;
    }
  }

  /* =======================================================
     THEME / DENSITY
     ======================================================= */

  function applySettings() {
    const settings = {
      ...defaultSettings,
      ...readJSON(SETTINGS_KEY, {})
    };

    profile = {
      ...profile,
      ...readJSON(PROFILE_KEY, {})
    };

    const theme =
      profile.theme ||
      settings.theme ||
      "dark";

    const density =
      profile.density ||
      settings.density ||
      "comfortable";

    document.body.classList.toggle(
      "light-theme",
      theme === "light"
    );

    document.body.classList.toggle(
      "compact-density",
      density === "compact"
    );

    updateProfileUI();
  }

  function toggleTheme() {
    const isLight = document.body.classList.contains("light-theme");
    const newTheme = isLight ? "dark" : "light";

    document.body.classList.toggle(
      "light-theme",
      newTheme === "light"
    );

    const settings = {
      ...defaultSettings,
      ...readJSON(SETTINGS_KEY, {})
    };

    settings.theme = newTheme;

    profile.theme = newTheme;

    writeJSON(SETTINGS_KEY, settings);
    writeJSON(PROFILE_KEY, profile);
  }

  const themeToggle = getElement("themeToggle");

  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }

  applySettings();

  /* =======================================================
     CLOCK
     ======================================================= */

  function updateClock() {
    const now = new Date();

    const dateElement = getElement("currentDate");
    const timeElement = getElement("currentTime");

    if (dateElement) {
      dateElement.textContent = now.toLocaleDateString(undefined, {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    }

    if (timeElement) {
      timeElement.textContent = now.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    }
  }

  updateClock();
  setInterval(updateClock, 1000);

  /* =======================================================
     DATA NORMALIZATION
     ======================================================= */

  function normalizeCases(rawData) {
    const source = firstValue(
      rawData,
      ["cases", "caseRecords", "caseData"],
      []
    );

    if (Array.isArray(source)) {
      return source;
    }

    if (source && typeof source === "object") {
      return Object.entries(source).map(([key, value]) => ({
        ...(value || {}),
        id:
          value?.id ||
          value?.caseId ||
          key
      }));
    }

    return [];
  }

  function normalizeEntities(rawData) {
    const source = firstValue(
      rawData,
      ["entities", "entityRecords", "entityData"],
      []
    );

    if (Array.isArray(source)) {
      return source;
    }

    if (source && typeof source === "object") {
      return Object.entries(source).map(([key, value]) => ({
        ...(value || {}),
        id:
          value?.id ||
          value?.entityId ||
          key
      }));
    }

    return [];
  }

  function normalizeRelationships(rawData) {
    const source = firstValue(
      rawData,
      ["relationships", "relations", "connections"],
      []
    );

    if (Array.isArray(source)) {
      return source;
    }

    if (source && typeof source === "object") {
      return Object.entries(source).map(([key, value]) => ({
        ...(value || {}),
        id:
          value?.id ||
          value?.relationshipId ||
          key
      }));
    }

    return [];
  }

  function normalizeIntelligence(rawData) {
    const source = firstValue(
      rawData,
      [
        "intelligence",
        "intelligenceRecords",
        "intel",
        "intelligenceData"
      ],
      []
    );

    if (Array.isArray(source)) {
      return source;
    }

    if (source && typeof source === "object") {
      return Object.entries(source).map(([key, value]) => ({
        ...(value || {}),
        id:
          value?.id ||
          value?.intelligenceId ||
          key
      }));
    }

    return [];
  }

  /* =======================================================
     DEMO DATA
     ======================================================= */

  const demoCases = [
    {
      id: "CR-001",
      title: "Financial Network Investigation",
      status: "Active",
      priority: "High",
      summary:
        "Investigation into a suspected financial network involving multiple persons and organizations.",
      updatedAt: "2026-09-17T09:30:00"
    },
    {
      id: "CR-002",
      title: "Coordinated Property Crime",
      status: "Active",
      priority: "Medium",
      summary:
        "Multiple incidents show common entities, locations and relationship patterns.",
      updatedAt: "2026-09-16T14:20:00"
    },
    {
      id: "CR-003",
      title: "Organized Intelligence Review",
      status: "Under Review",
      priority: "High",
      summary:
        "Cross-source intelligence is being reviewed for possible organizational links.",
      updatedAt: "2026-09-15T11:10:00"
    },
    {
      id: "CR-004",
      title: "Closed Evidence Assessment",
      status: "Closed",
      priority: "Low",
      summary:
        "Completed assessment of evidence and associated entity relationships.",
      updatedAt: "2026-09-10T16:45:00"
    }
  ];

  const demoEntities = [
    {
      id: "ENT-001",
      name: "Subject Alpha",
      type: "Person",
      risk: "High",
      cases: ["CR-001", "CR-003"],
      summary: "Primary person of interest."
    },
    {
      id: "ENT-002",
      name: "Northstar Holdings",
      type: "Organization",
      risk: "High",
      cases: ["CR-001"],
      summary: "Organization connected to the financial investigation."
    },
    {
      id: "ENT-003",
      name: "Central District",
      type: "Location",
      risk: "Medium",
      cases: ["CR-001", "CR-002"],
      summary: "Location appearing across multiple records."
    },
    {
      id: "ENT-004",
      name: "Subject Bravo",
      type: "Person",
      risk: "Medium",
      cases: ["CR-002"],
      summary: "Associated individual."
    }
  ];

  const demoRelationships = [
    {
      source: "ENT-001",
      target: "ENT-002",
      type: "Associated With"
    },
    {
      source: "ENT-001",
      target: "ENT-003",
      type: "Located At"
    },
    {
      source: "ENT-004",
      target: "ENT-003",
      type: "Located At"
    }
  ];

  /* =======================================================
     LOAD DATA
     ======================================================= */

  let rawData = readJSON(DATA_KEY, {});

  let cases = normalizeCases(rawData);
  let entities = normalizeEntities(rawData);
  let relationships = normalizeRelationships(rawData);
  let intelligence = normalizeIntelligence(rawData);

  /*
   * Keep the report functional even when the data store
   * has not been populated yet.
   */

  if (!cases.length) {
    cases = [...demoCases];
  }

  if (!entities.length) {
    entities = [...demoEntities];
  }

  if (!relationships.length) {
    relationships = [...demoRelationships];
  }

  /* =======================================================
     CASE HELPERS
     ======================================================= */

  function getCaseId(item) {
    return String(
      firstValue(
        item,
        ["id", "caseId", "caseID", "case_number", "number"],
        ""
      )
    );
  }

  function getCaseTitle(item) {
    return String(
      firstValue(
        item,
        ["title", "name", "caseTitle", "subject"],
        "Untitled Case"
      )
    );
  }

  function getCaseStatus(item) {
    return String(
      firstValue(
        item,
        ["status", "caseStatus"],
        "Active"
      )
    );
  }

  function getCasePriority(item) {
    return String(
      firstValue(
        item,
        ["priority", "severity", "risk"],
        "Medium"
      )
    );
  }

  function getCaseSummary(item) {
    return String(
      firstValue(
        item,
        ["summary", "description", "details", "notes"],
        "No case summary available."
      )
    );
  }

  function getCaseUpdated(item) {
    return firstValue(
      item,
      [
        "updatedAt",
        "updated",
        "lastUpdated",
        "dateUpdated",
        "createdAt"
      ],
      ""
    );
  }

  /* =======================================================
     ENTITY HELPERS
     ======================================================= */

  function getEntityId(item) {
    return String(
      firstValue(
        item,
        ["id", "entityId", "entityID"],
        ""
      )
    );
  }

  function getEntityName(item) {
    return String(
      firstValue(
        item,
        ["name", "title", "entityName"],
        "Unknown Entity"
      )
    );
  }

  function getEntityType(item) {
    return String(
      firstValue(
        item,
        ["type", "entityType", "category"],
        "Entity"
      )
    );
  }

  function getEntityRisk(item) {
    return String(
      firstValue(
        item,
        ["risk", "riskLevel", "priority", "severity"],
        "Medium"
      )
    );
  }

  function getEntityCases(item) {
    const value = firstValue(
      item,
      ["cases", "caseIds", "relatedCases"],
      []
    );

    if (Array.isArray(value)) {
      return value;
    }

    if (value === null || value === undefined || value === "") {
      return [];
    }

    return String(value)
      .split(",")
      .map(item => item.trim())
      .filter(Boolean);
  }

  /* =======================================================
     INTELLIGENCE HELPERS
     ======================================================= */

  function getIntelCaseId(item) {
    return String(
      firstValue(
        item,
        ["case", "caseId", "relatedCase", "caseID"],
        ""
      )
    );
  }

  /* =======================================================
     CASE SELECT
     ======================================================= */

  const reportCase = getElement("reportCase");

  function populateCaseSelect() {
    if (!reportCase) return;

    const currentValue = reportCase.value;

    reportCase.innerHTML = `
      <option value="">Select a case</option>
      ${cases
        .map(caseItem => {
          const id = getCaseId(caseItem);
          const title = getCaseTitle(caseItem);

          return `
            <option value="${escapeHTML(id)}">
              ${escapeHTML(id)} — ${escapeHTML(title)}
            </option>
          `;
        })
        .join("")}
    `;

    if (
      currentValue &&
      cases.some(item => getCaseId(item) === currentValue)
    ) {
      reportCase.value = currentValue;
    }
  }

  populateCaseSelect();

  /* =======================================================
     REPORT STATE
     ======================================================= */

  let selectedCaseId = "";

  function getCaseById(caseId) {
    return cases.find(
      item => getCaseId(item) === String(caseId)
    );
  }

  function getEntitiesForCase(caseId) {
    const normalizedCaseId = String(caseId);

    return entities.filter(entity => {
      const relatedCases = getEntityCases(entity).map(String);

      return relatedCases.includes(normalizedCaseId);
    });
  }

  function getRelationshipsForCase(caseId) {
    const caseEntities = getEntitiesForCase(caseId);

    const ids = new Set(
      caseEntities.map(entity => getEntityId(entity))
    );

    return relationships.filter(relationship => {
      const source = String(
        firstValue(
          relationship,
          ["source", "from", "sourceId", "entity1"],
          ""
        )
      );

      const target = String(
        firstValue(
          relationship,
          ["target", "to", "targetId", "entity2"],
          ""
        )
      );

      return ids.has(source) || ids.has(target);
    });
  }

  function getIntelligenceForCase(caseId) {
    const normalizedCaseId = String(caseId);

    return intelligence.filter(item => {
      return getIntelCaseId(item) === normalizedCaseId;
    });
  }

  /* =======================================================
     STATUS / PRIORITY CLASSES
     ======================================================= */

  function getStatusClass(status) {
    const value = normalizeText(status);

    if (
      value.includes("closed") ||
      value.includes("complete") ||
      value.includes("verified")
    ) {
      return "badge-success";
    }

    if (
      value.includes("review") ||
      value.includes("pending") ||
      value.includes("open")
    ) {
      return "badge-warning";
    }

    if (
      value.includes("critical") ||
      value.includes("escalated")
    ) {
      return "badge-danger";
    }

    return "badge-accent";
  }

  function getPriorityClass(priority) {
    const value = normalizeText(priority);

    if (
      value.includes("critical") ||
      value.includes("high")
    ) {
      return "badge-danger";
    }

    if (value.includes("medium")) {
      return "badge-warning";
    }

    if (
      value.includes("low") ||
      value.includes("normal")
    ) {
      return "badge-success";
    }

    return "badge-accent";
  }

  /* =======================================================
     REPORT VISIBILITY
     ======================================================= */

  function showReport() {
    const documentElement = getElement("reportDocument");
    const emptyState = getElement("reportEmptyState");

    if (documentElement) {
      documentElement.style.display = "";
    }

    if (emptyState) {
      emptyState.style.display = "none";
    }
  }

  function showEmptyReport() {
    const documentElement = getElement("reportDocument");
    const emptyState = getElement("reportEmptyState");

    if (documentElement) {
      documentElement.style.display = "none";
    }

    if (emptyState) {
      emptyState.style.display = "";
    }
  }

  /* =======================================================
     REPORT RENDER
     ======================================================= */

  function renderReport(caseId) {
    const caseItem = getCaseById(caseId);

    if (!caseItem) {
      selectedCaseId = "";
      showEmptyReport();
      return;
    }

    selectedCaseId = String(caseId);

    showReport();

    const title = getElement("reportTitle");
    const caseIdElement = getElement("reportCaseId");
    const classification = getElement("reportClassification");
    const currentStatus = getElement("reportCurrentStatus");
    const generatedDate = getElement("reportGeneratedDate");

    const overviewCaseId = getElement("overviewCaseId");
    const overviewStatus = getElement("overviewStatus");
    const overviewPriority = getElement("overviewPriority");
    const overviewUpdated = getElement("overviewUpdated");
    const summary = getElement("reportCaseSummary");

    const assessment = getElement("reportAssessment");
    const analystAssessment = getElement("reportAnalystAssessment");

    const entityCount = getElement("reportEntityCount");
    const relationshipCount = getElement("reportRelationshipCount");
    const flagCount = getElement("reportFlagCount");

    const keyEntities = getElement("reportKeyEntities");
    const flags = getElement("reportFlags");

    const caseTitle = getCaseTitle(caseItem);
    const status = getCaseStatus(caseItem);
    const priority = getCasePriority(caseItem);
    const updated = getCaseUpdated(caseItem);
    const caseSummary = getCaseSummary(caseItem);

    const caseEntities = getEntitiesForCase(caseId);
    const caseRelationships = getRelationshipsForCase(caseId);
    const caseIntelligence = getIntelligenceForCase(caseId);

    /* -----------------------------------------------
       Header
       ----------------------------------------------- */

    if (title) {
      title.textContent = caseTitle;
    }

    if (caseIdElement) {
      caseIdElement.textContent = getCaseId(caseItem);
    }

    if (classification) {
      classification.textContent = "CONFIDENTIAL";
      classification.className = "badge badge-purple";
    }

    if (currentStatus) {
      currentStatus.textContent = status;
      currentStatus.className =
        `badge ${getStatusClass(status)}`;
    }

    if (generatedDate) {
      generatedDate.textContent = formatDateTime(new Date());
    }

    /* -----------------------------------------------
       Overview
       ----------------------------------------------- */

    if (overviewCaseId) {
      overviewCaseId.textContent = getCaseId(caseItem);
    }

    if (overviewStatus) {
      overviewStatus.textContent = status;
      overviewStatus.className =
        `value ${getStatusClass(status)}`;
    }

    if (overviewPriority) {
      overviewPriority.textContent = priority;
    }

    if (overviewUpdated) {
      overviewUpdated.textContent = formatDateTime(updated);
    }

    if (summary) {
      summary.textContent = caseSummary;
    }

    /* -----------------------------------------------
       Metrics
       ----------------------------------------------- */

    if (entityCount) {
      entityCount.textContent = caseEntities.length;
    }

    if (relationshipCount) {
      relationshipCount.textContent =
        caseRelationships.length;
    }

    const intelligenceFlagCount =
      caseIntelligence.filter(item => {
        const value = normalizeText(
          firstValue(
            item,
            ["priority", "risk", "severity"],
            ""
          )
        );

        return (
          value.includes("high") ||
          value.includes("critical")
        );
      }).length;

    const fallbackFlags =
      caseIntelligence.length ||
      caseRelationships.length;

    if (flagCount) {
      flagCount.textContent =
        intelligenceFlagCount || fallbackFlags;
    }

    /* -----------------------------------------------
       Assessment
       ----------------------------------------------- */

    const assessmentText = buildAssessment(
      caseItem,
      caseEntities,
      caseRelationships,
      caseIntelligence
    );

    if (assessment) {
      assessment.textContent = assessmentText;
    }

    if (analystAssessment) {
      analystAssessment.textContent =
        buildAnalystAssessment(
          caseItem,
          caseEntities,
          caseRelationships,
          caseIntelligence
        );
    }

    /* -----------------------------------------------
       Key Entities
       ----------------------------------------------- */

    renderKeyEntities(
      keyEntities,
      caseEntities
    );

    /* -----------------------------------------------
       Flags
       ----------------------------------------------- */

    renderFlags(
      flags,
      caseItem,
      caseEntities,
      caseRelationships,
      caseIntelligence
    );
  }

  /* =======================================================
     ASSESSMENT
     ======================================================= */

  function buildAssessment(
    caseItem,
    caseEntities,
    caseRelationships,
    caseIntelligence
  ) {
    const status = getCaseStatus(caseItem);
    const priority = getCasePriority(caseItem);

    const highRiskEntities = caseEntities.filter(entity => {
      const risk = normalizeText(getEntityRisk(entity));

      return (
        risk.includes("high") ||
        risk.includes("critical")
      );
    });

    const intelligenceCount = caseIntelligence.length;

    let text =
      `Case ${getCaseId(caseItem)} is currently ${status.toLowerCase()} ` +
      `with a ${priority.toLowerCase()} priority classification. `;

    text +=
      `The current record contains ${caseEntities.length} ` +
      `${caseEntities.length === 1 ? "associated entity" : "associated entities"} ` +
      `and ${caseRelationships.length} ` +
      `${caseRelationships.length === 1 ? "relationship" : "relationships"}. `;

    if (highRiskEntities.length) {
      text +=
        `${highRiskEntities.length} associated ` +
        `${highRiskEntities.length === 1 ? "entity is" : "entities are"} ` +
        `marked with elevated risk. `;
    }

    if (intelligenceCount) {
      text +=
        `${intelligenceCount} intelligence ` +
        `${intelligenceCount === 1 ? "record is" : "records are"} ` +
        `currently associated with this case.`;
    } else {
      text +=
        "No directly associated intelligence records are currently available.";
    }

    return text;
  }

  function buildAnalystAssessment(
    caseItem,
    caseEntities,
    caseRelationships,
    caseIntelligence
  ) {
    const priority = normalizeText(
      getCasePriority(caseItem)
    );

    const highRisk = caseEntities.filter(entity => {
      const risk = normalizeText(getEntityRisk(entity));

      return (
        risk.includes("high") ||
        risk.includes("critical")
      );
    }).length;

    const parts = [];

    if (
      priority.includes("high") ||
      priority.includes("critical")
    ) {
      parts.push(
        "Priority review is recommended based on the current case classification."
      );
    }

    if (caseRelationships.length > 0) {
      parts.push(
        `Network analysis currently identifies ${caseRelationships.length} recorded relationship${caseRelationships.length === 1 ? "" : "s"} among associated entities.`
      );
    }

    if (highRisk > 0) {
      parts.push(
        `${highRisk} associated entity${highRisk === 1 ? " has" : "ies have"} elevated risk indicators in the current data.`
      );
    }

    if (caseIntelligence.length > 0) {
      parts.push(
        `${caseIntelligence.length} intelligence record${caseIntelligence.length === 1 ? " is" : "s are"} linked to this case.`
      );
    }

    if (!parts.length) {
      parts.push(
        "Current data does not contain enough linked information for an extended assessment."
      );
    }

    return parts.join(" ");
  }

  /* =======================================================
     KEY ENTITIES
     ======================================================= */

  function renderKeyEntities(container, caseEntities) {
    if (!container) return;

    if (!caseEntities.length) {
      container.innerHTML = `
        <div class="report-empty-state">
          <div class="empty-icon">◎</div>
          <h3>No linked entities</h3>
          <p>
            No entities are currently associated with this case.
          </p>
        </div>
      `;

      return;
    }

    container.innerHTML = caseEntities
      .slice(0, 12)
      .map(entity => {
        const name = getEntityName(entity);
        const type = getEntityType(entity);
        const risk = getEntityRisk(entity);

        return `
          <div class="entity-report-item">
            <div class="entity-report-main">
              <div class="entity-report-name">
                ${escapeHTML(name)}
              </div>

              <div class="entity-report-type">
                ${escapeHTML(type)}
                •
                ${escapeHTML(getEntityId(entity))}
              </div>
            </div>

            <div class="entity-report-risk">
              <span class="badge ${getPriorityClass(risk)}">
                ${escapeHTML(risk)}
              </span>
            </div>
          </div>
        `;
      })
      .join("");
  }

  /* =======================================================
     FLAGS
     ======================================================= */

  function renderFlags(
    container,
    caseItem,
    caseEntities,
    caseRelationships,
    caseIntelligence
  ) {
    if (!container) return;

    const flags = [];

    const priority = normalizeText(
      getCasePriority(caseItem)
    );

    if (
      priority.includes("high") ||
      priority.includes("critical")
    ) {
      flags.push({
        title: "High-priority case",
        description:
          `Case ${getCaseId(caseItem)} is classified as ${getCasePriority(caseItem)} priority.`,
        type: "priority"
      });
    }

    const highRiskEntities = caseEntities.filter(entity => {
      const risk = normalizeText(getEntityRisk(entity));

      return (
        risk.includes("high") ||
        risk.includes("critical")
      );
    });

    if (highRiskEntities.length) {
      flags.push({
        title: "Elevated-risk entities",
        description:
          `${highRiskEntities.length} associated ${highRiskEntities.length === 1 ? "entity has" : "entities have"} an elevated risk classification.`,
        type: "risk"
      });
    }

    if (caseRelationships.length >= 3) {
      flags.push({
        title: "Multiple network relationships",
        description:
          `The case currently has ${caseRelationships.length} recorded relationships requiring network review.`,
        type: "network"
      });
    }

    const highPriorityIntel = caseIntelligence.filter(item => {
      const value = normalizeText(
        firstValue(
          item,
          ["priority", "risk", "severity"],
          ""
        )
      );

      return (
        value.includes("high") ||
        value.includes("critical")
      );
    });

    if (highPriorityIntel.length) {
      flags.push({
        title: "High-priority intelligence",
        description:
          `${highPriorityIntel.length} associated intelligence ${highPriorityIntel.length === 1 ? "record is" : "records are"} marked high priority.`,
        type: "intelligence"
      });
    }

    if (!flags.length) {
      flags.push({
        title: "No elevated flags detected",
        description:
          "No additional high-priority indicators were identified in the currently loaded data.",
        type: "normal"
      });
    }

    container.innerHTML = flags
      .map(flag => {
        let icon = "!";
        let iconClass = "flag-icon";

        if (flag.type === "network") {
          icon = "⌘";
        } else if (flag.type === "intelligence") {
          icon = "◈";
        } else if (flag.type === "normal") {
          icon = "✓";
        }

        return `
          <div class="flag-item">
            <div class="${iconClass}">
              ${icon}
            </div>

            <div class="flag-content">
              <div class="flag-title">
                ${escapeHTML(flag.title)}
              </div>

              <div class="flag-description">
                ${escapeHTML(flag.description)}
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  /* =======================================================
     GENERATE REPORT
     ======================================================= */

  const generateReport = getElement("generateReport");

  if (generateReport) {
    generateReport.addEventListener("click", () => {
      const caseId = reportCase
        ? reportCase.value
        : "";

      if (!caseId) {
        showToast("Please select a case first.");
        showEmptyReport();
        return;
      }

      renderReport(caseId);
      showToast("Report generated successfully.");
    });
  }

  /* =======================================================
     CASE CHANGE
     ======================================================= */

  if (reportCase) {
    reportCase.addEventListener("change", () => {
      const caseId = reportCase.value;

      if (!caseId) {
        selectedCaseId = "";
        showEmptyReport();
        return;
      }

      renderReport(caseId);
    });
  }

  /* =======================================================
     REFRESH
     ======================================================= */

  const refreshReport = getElement("refreshReport");

  if (refreshReport) {
    refreshReport.addEventListener("click", () => {
      rawData = readJSON(DATA_KEY, {});

      cases = normalizeCases(rawData);
      entities = normalizeEntities(rawData);
      relationships = normalizeRelationships(rawData);
      intelligence = normalizeIntelligence(rawData);

      if (!cases.length) {
        cases = [...demoCases];
      }

      if (!entities.length) {
        entities = [...demoEntities];
      }

      if (!relationships.length) {
        relationships = [...demoRelationships];
      }

      populateCaseSelect();

      if (selectedCaseId) {
        renderReport(selectedCaseId);
      }

      showToast("Report data refreshed.");
    });
  }

  /* =======================================================
     PRINT
     ======================================================= */

  const printReport = getElement("printReport");

  if (printReport) {
    printReport.addEventListener("click", () => {
      if (!selectedCaseId) {
        showToast("Generate a report before printing.");
        return;
      }

      window.print();
    });
  }

  /* =======================================================
     TOAST
     ======================================================= */

  let toastTimer = null;

  function showToast(message) {
    let toast = getElement("reportToast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "reportToast";
      toast.className = "toast";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);
  }

  /* =======================================================
     URL QUERY SUPPORT
     ======================================================= */

  function loadCaseFromURL() {
    const params = new URLSearchParams(
      window.location.search
    );

    const caseId =
      params.get("case") ||
      params.get("caseId") ||
      params.get("id");

    if (!caseId) {
      showEmptyReport();
      return;
    }

    const matchingCase = getCaseById(caseId);

    if (!matchingCase) {
      showEmptyReport();
      showToast(`Case ${caseId} was not found.`);
      return;
    }

    if (reportCase) {
      reportCase.value = caseId;
    }

    renderReport(caseId);
  }

  loadCaseFromURL();

  /* =======================================================
     NAVIGATION
     ======================================================= */

  function navigate(path) {
    window.location.href = path;
  }

  const navigationMap = {
    dashboard: "dashboard.html",
    cases: "cases.html",
    intelligence: "intelligence.html",
    network: "network.html",
    entities: "entities.html",
    reports: "reports.html",
    profile: "admin-profile.html",
    settings: "settings.html"
  };

  document
    .querySelectorAll("[data-page]")
    .forEach(item => {
      item.addEventListener("click", event => {
        event.preventDefault();

        const page = item.dataset.page;

        if (navigationMap[page]) {
          navigate(navigationMap[page]);
        }
      });
    });

  /* =======================================================
     LOGOUT
     ======================================================= */

  const logoutItems = document.querySelectorAll(
    "#logoutBtn, #accountLogoutBtn, [data-action='logout']"
  );

  logoutItems.forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();

      const confirmed = window.confirm(
        "Are you sure you want to logout?"
      );

      if (!confirmed) return;

      /*
       * Keep profile/data intact so the demo can continue
       * using the same localStorage state after login.
       */

      window.location.href = "login.html";
    });
  });

  /* =======================================================
     STORAGE SYNC
     ======================================================= */

  window.addEventListener("storage", event => {
    if (event.key === PROFILE_KEY) {
      profile = {
        ...defaultProfile,
        ...readJSON(PROFILE_KEY, {})
      };

      updateProfileUI();
    }

    if (event.key === SETTINGS_KEY) {
      applySettings();
    }

    if (event.key === DATA_KEY) {
      rawData = readJSON(DATA_KEY, {});

      cases = normalizeCases(rawData);
      entities = normalizeEntities(rawData);
      relationships = normalizeRelationships(rawData);
      intelligence = normalizeIntelligence(rawData);

      if (!cases.length) {
        cases = [...demoCases];
      }

      if (!entities.length) {
        entities = [...demoEntities];
      }

      if (!relationships.length) {
        relationships = [...demoRelationships];
      }

      populateCaseSelect();

      if (selectedCaseId) {
        renderReport(selectedCaseId);
      }
    }
  });

  /* =======================================================
     INITIAL UI
     ======================================================= */

  updateProfileUI();

  /*
   * If no case was supplied through URL and no case is selected,
   * show the empty report state.
   */
  if (!selectedCaseId) {
    showEmptyReport();
  }
});