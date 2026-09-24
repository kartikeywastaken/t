/* =========================================================
   CRIMENET | ENTITIES
   Entity Registry + Profile Sync + Local Storage
   ========================================================= */

(() => {
  "use strict";

  const DATA_KEY = "crimeNetData";
  const PROFILE_KEY = "crimeNetAdminProfile";
  const SETTINGS_KEY = "crimeNetSettings";

  let allEntities = [];
  let filteredEntities = [];
  let selectedEntity = null;

  /* =======================================================
     DEMO DATA
     ======================================================= */

  const DEMO_ENTITIES = [
    {
      id: "ENT-001",
      name: "Subject Alpha",
      type: "person",
      risk: "critical",
      cases: 3,
      relationships: 12,
      updated: "2026-09-16",
      summary:
        "Primary person of interest linked with multiple active investigations.",
      attributes: {
        Status: "Person of Interest",
        Region: "North Sector",
        Classification: "Restricted"
      }
    },

    {
      id: "ENT-002",
      name: "Meridian Holdings",
      type: "organization",
      risk: "high",
      cases: 4,
      relationships: 18,
      updated: "2026-09-14",
      summary:
        "Organization appearing across multiple financial and communication records.",
      attributes: {
        Category: "Organization",
        Sector: "Financial",
        Classification: "High Interest"
      }
    },

    {
      id: "ENT-003",
      name: "Central Transit Hub",
      type: "location",
      risk: "medium",
      cases: 2,
      relationships: 9,
      updated: "2026-09-12",
      summary:
        "Location referenced in several case records and entity relationships.",
      attributes: {
        Region: "Central",
        Category: "Transit",
        Monitoring: "Active"
      }
    },

    {
      id: "ENT-004",
      name: "Subject Delta",
      type: "person",
      risk: "high",
      cases: 2,
      relationships: 7,
      updated: "2026-09-09",
      summary:
        "Individual entity connected to an active investigation.",
      attributes: {
        Status: "Under Investigation",
        Region: "East Sector",
        Classification: "Sensitive"
      }
    },

    {
      id: "ENT-005",
      name: "Vehicle AX-204",
      type: "vehicle",
      risk: "low",
      cases: 1,
      relationships: 4,
      updated: "2026-09-07",
      summary:
        "Vehicle referenced in historical case intelligence.",
      attributes: {
        Category: "Vehicle",
        Status: "Tracked",
        Region: "South Sector"
      }
    }
  ];

  /* =======================================================
     HELPERS
     ======================================================= */

  const $ = (id) => document.getElementById(id);

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
      return JSON.parse(
        localStorage.getItem(DATA_KEY)
      ) || {};
    } catch {
      return {};
    }
  }

  function saveStoredData(data) {
    localStorage.setItem(
      DATA_KEY,
      JSON.stringify(data)
    );
  }

  function normalizeType(type) {
    const value = String(type || "other")
      .trim()
      .toLowerCase()
      .replace(/[_\s-]+/g, "");

    if (
      value === "person" ||
      value === "individual" ||
      value === "people"
    ) {
      return "person";
    }

    if (
      value === "organization" ||
      value === "organisation" ||
      value === "company" ||
      value === "group"
    ) {
      return "organization";
    }

    if (
      value === "location" ||
      value === "place" ||
      value === "address"
    ) {
      return "location";
    }

    if (
      value === "vehicle" ||
      value === "car"
    ) {
      return "vehicle";
    }

    if (
      value === "account" ||
      value === "bankaccount" ||
      value === "socialaccount"
    ) {
      return "account";
    }

    return "other";
  }

  function normalizeRisk(risk) {
    const value = String(risk || "unknown")
      .trim()
      .toLowerCase();

    if (
      ["critical", "severe", "urgent"].includes(value)
    ) {
      return "critical";
    }

    if (
      ["high", "important"].includes(value)
    ) {
      return "high";
    }

    if (
      ["medium", "moderate"].includes(value)
    ) {
      return "medium";
    }

    if (
      ["low", "minor"].includes(value)
    ) {
      return "low";
    }

    return "unknown";
  }

  function getEntityId(entity) {
    return (
      entity?.id ||
      entity?.entityId ||
      entity?.entity_id ||
      entity?.reference ||
      "UNKNOWN"
    );
  }

  function getEntityName(entity) {
    return (
      entity?.name ||
      entity?.entityName ||
      entity?.title ||
      entity?.label ||
      "Unnamed Entity"
    );
  }

  function getEntitySummary(entity) {
    return (
      entity?.summary ||
      entity?.description ||
      entity?.details ||
      "No information available."
    );
  }

  function getUpdated(entity) {
    return (
      entity?.updated ||
      entity?.updatedAt ||
      entity?.lastUpdated ||
      entity?.modifiedAt ||
      entity?.createdAt ||
      new Date().toISOString()
    );
  }

  function getCaseCount(entity) {
    if (
      Number.isFinite(
        Number(entity?.cases)
      )
    ) {
      return Number(entity.cases);
    }

    if (
      Number.isFinite(
        Number(entity?.caseCount)
      )
    ) {
      return Number(entity.caseCount);
    }

    if (Array.isArray(entity?.caseIds)) {
      return entity.caseIds.length;
    }

    if (Array.isArray(entity?.cases)) {
      return entity.cases.length;
    }

    return 0;
  }

  function getRelationshipCount(entity) {
    if (
      Number.isFinite(
        Number(entity?.relationships)
      )
    ) {
      return Number(entity.relationships);
    }

    if (
      Number.isFinite(
        Number(entity?.relationshipCount)
      )
    ) {
      return Number(entity.relationshipCount);
    }

    if (
      Array.isArray(entity?.relationshipIds)
    ) {
      return entity.relationshipIds.length;
    }

    if (
      Array.isArray(entity?.relationships)
    ) {
      return entity.relationships.length;
    }

    return 0;
  }

  function normalizeEntity(entity) {
    return {
      ...entity,

      id: getEntityId(entity),

      name: getEntityName(entity),

      type: normalizeType(
        entity?.type ||
        entity?.entityType ||
        entity?.category
      ),

      risk: normalizeRisk(
        entity?.risk ||
        entity?.riskLevel ||
        entity?.priority
      ),

      cases: getCaseCount(entity),

      relationships:
        getRelationshipCount(entity),

      updated: getUpdated(entity),

      summary: getEntitySummary(entity),

      attributes:
        entity?.attributes &&
        typeof entity.attributes === "object"
          ? entity.attributes
          : {}
    };
  }

  function formatType(type) {
    const labels = {
      person: "Person",
      organization: "Organization",
      location: "Location",
      vehicle: "Vehicle",
      account: "Account",
      other: "Other"
    };

    return labels[type] || "Other";
  }

  function formatRisk(risk) {
    const labels = {
      critical: "Critical",
      high: "High",
      medium: "Medium",
      low: "Low",
      unknown: "Unknown"
    };

    return labels[risk] || "Unknown";
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );
  }

  /* =======================================================
     LOAD DATA
     ======================================================= */

  function loadEntities() {
    const data = getStoredData();

    let storedEntities = data.entities;

    if (Array.isArray(storedEntities)) {
      allEntities =
        storedEntities.map(normalizeEntity);
    } else if (
      storedEntities &&
      typeof storedEntities === "object"
    ) {
      allEntities =
        Object.entries(storedEntities)
          .map(([key, value]) =>
            normalizeEntity({
              ...(value || {}),
              id:
                value?.id ||
                value?.entityId ||
                key
            })
          );
    } else {
      allEntities =
        DEMO_ENTITIES.map((entity) => ({
          ...entity,
          attributes: {
            ...(entity.attributes || {})
          }
        }));
    }

    if (!allEntities.length) {
      allEntities =
        DEMO_ENTITIES.map((entity) => ({
          ...entity,
          attributes: {
            ...(entity.attributes || {})
          }
        }));
    }
  }

  function persistEntities() {
    const data = getStoredData();

    data.entities =
      allEntities.map((entity) => ({
        ...entity
      }));

    saveStoredData(data);
  }

  /* =======================================================
     PROFILE SYNC
     ======================================================= */

  function loadProfile() {
    let profile = null;

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
      `${profile.firstName || ""} ${
        profile.lastName || ""
      }`.trim() || "System Analyst";

    const role =
      profile.designation ||
      profile.role ||
      "Senior Investigator";

    const name = $("profileName");
    const roleElement = $("profileRole");
    const avatar = $("profileAvatar");

    if (name) {
      name.textContent = fullName;
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
            .split(/\s+/)
            .map((part) => part.charAt(0))
            .join("")
            .slice(0, 2)
            .toUpperCase();
      }
    }
  }

  /* =======================================================
     CLOCK
     ======================================================= */

  function updateClock() {
    const now = new Date();

    const dateElement =
      $("currentDate");

    const timeElement =
      $("currentTime");

    if (dateElement) {
      dateElement.textContent =
        now.toLocaleDateString(
          "en-IN",
          {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric"
          }
        );
    }

    if (timeElement) {
      timeElement.textContent =
        now.toLocaleTimeString(
          "en-IN",
          {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
          }
        );
    }
  }

  /* =======================================================
     METRICS
     ======================================================= */

  function updateMetrics() {
    const total =
      allEntities.length;

    const persons =
      allEntities.filter(
        (entity) =>
          entity.type === "person"
      ).length;

    const organizations =
      allEntities.filter(
        (entity) =>
          entity.type === "organization"
      ).length;

    const locations =
      allEntities.filter(
        (entity) =>
          entity.type === "location"
      ).length;

    if ($("totalEntities")) {
      $("totalEntities").textContent =
        total;
    }

    if ($("personEntities")) {
      $("personEntities").textContent =
        persons;
    }

    if ($("organizationEntities")) {
      $("organizationEntities").textContent =
        organizations;
    }

    if ($("locationEntities")) {
      $("locationEntities").textContent =
        locations;
    }
  }

  /* =======================================================
     TABLE
     ======================================================= */

  function renderEntities() {
    const tbody =
      $("entitiesTableBody");

    const emptyState =
      $("emptyState");

    const resultCount =
      $("resultCount");

    if (!tbody) return;

    tbody.innerHTML = "";

    if (resultCount) {
      resultCount.textContent =
        `${filteredEntities.length} ${
          filteredEntities.length === 1
            ? "entity"
            : "entities"
        }`;
    }

    if (!filteredEntities.length) {
      if (emptyState) {
        emptyState.style.display =
          "flex";
      }

      return;
    }

    if (emptyState) {
      emptyState.style.display =
        "none";
    }

    filteredEntities.forEach(
      (entity) => {
        const row =
          document.createElement("tr");

        row.innerHTML = `
          <td>
            <div class="entity-name">
              <strong>
                ${escapeHtml(entity.name)}
              </strong>

              <small>
                ${escapeHtml(entity.id)}
              </small>
            </div>
          </td>

          <td>
            <span
              class="entity-type type-${escapeHtml(entity.type)}"
            >
              ${escapeHtml(
                formatType(entity.type)
              )}
            </span>
          </td>

          <td>
            <span
              class="risk-badge risk-${escapeHtml(entity.risk)}"
            >
              ${escapeHtml(
                formatRisk(entity.risk)
              )}
            </span>
          </td>

          <td>
            <span class="case-count">
              ${entity.cases}
            </span>
          </td>

          <td>
            <span class="relationship-count">
              ${entity.relationships}
            </span>
          </td>

          <td>
            ${escapeHtml(
              formatDate(entity.updated)
            )}
          </td>

          <td>
            <button
              type="button"
              class="view-entity"
              data-entity-id="${escapeHtml(entity.id)}"
            >
              View
            </button>
          </td>
        `;

        tbody.appendChild(row);
      }
    );

    tbody
      .querySelectorAll(".view-entity")
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            openEntityDetails(
              button.dataset.entityId
            );
          }
        );
      });
  }

  /* =======================================================
     FILTERS
     ======================================================= */

  function getSearchText(entity) {
    return [
      entity.id,
      entity.name,
      entity.type,
      entity.risk,
      entity.summary,
      entity.location,
      entity.category,
      entity.region
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function applyFilters() {
    const search =
      (
        $("entitySearch")?.value ||
        ""
      )
        .trim()
        .toLowerCase();

    const type =
      $("entityTypeFilter")?.value ||
      "all";

    const risk =
      $("entityRiskFilter")?.value ||
      "all";

    const sort =
      $("sortEntities")?.value ||
      "updated-desc";

    filteredEntities =
      allEntities.filter((entity) => {
        const matchesSearch =
          !search ||
          getSearchText(entity)
            .includes(search);

        const matchesType =
          type === "all" ||
          entity.type === type;

        const matchesRisk =
          risk === "all" ||
          entity.risk === risk;

        return (
          matchesSearch &&
          matchesType &&
          matchesRisk
        );
      });

    filteredEntities.sort(
      (a, b) => {
        switch (sort) {
          case "name-asc":
            return a.name.localeCompare(
              b.name
            );

          case "name-desc":
            return b.name.localeCompare(
              a.name
            );

          case "updated-asc":
            return (
              new Date(a.updated) -
              new Date(b.updated)
            );

          case "risk":
            return (
              riskWeight(b.risk) -
              riskWeight(a.risk)
            );

          case "updated-desc":
          default:
            return (
              new Date(b.updated) -
              new Date(a.updated)
            );
        }
      }
    );

    renderEntities();
  }

  function riskWeight(risk) {
    const weights = {
      critical: 5,
      high: 4,
      medium: 3,
      low: 2,
      unknown: 1
    };

    return weights[risk] || 0;
  }

  function clearFilters() {
    if ($("entitySearch")) {
      $("entitySearch").value = "";
    }

    if ($("entityTypeFilter")) {
      $("entityTypeFilter").value =
        "all";
    }

    if ($("entityRiskFilter")) {
      $("entityRiskFilter").value =
        "all";
    }

    if ($("sortEntities")) {
      $("sortEntities").value =
        "updated-desc";
    }

    applyFilters();
  }

  /* =======================================================
     ENTITY DETAILS
     ======================================================= */

  function openEntityDetails(entityId) {
    const entity =
      allEntities.find(
        (item) =>
          String(item.id) ===
          String(entityId)
      );

    if (!entity) return;

    selectedEntity = entity;

    if ($("detailEntityName")) {
      $("detailEntityName").textContent =
        entity.name;
    }

    if ($("detailEntityId")) {
      $("detailEntityId").textContent =
        entity.id;
    }

    if ($("detailEntityType")) {
      $("detailEntityType").textContent =
        formatType(entity.type);
    }

    if ($("detailEntityRisk")) {
      $("detailEntityRisk").textContent =
        formatRisk(entity.risk);

      $("detailEntityRisk").className =
        `risk-badge risk-${entity.risk}`;
    }

    if ($("detailEntityCases")) {
      $("detailEntityCases").textContent =
        entity.cases;
    }

    if ($("detailEntityRelationships")) {
      $("detailEntityRelationships")
        .textContent =
        entity.relationships;
    }

    if ($("detailEntityUpdated")) {
      $("detailEntityUpdated").textContent =
        formatDate(entity.updated);
    }

    if ($("detailEntitySummary")) {
      $("detailEntitySummary").textContent =
        entity.summary;
    }

    renderAttributes(entity);

    const network =
      $("openEntityNetwork");

    const intelligence =
      $("openEntityIntelligence");

    if (network) {
      network.href =
        `network.html?entity=${encodeURIComponent(
          entity.id
        )}`;
    }

    if (intelligence) {
      intelligence.href =
        `intelligence.html?entity=${encodeURIComponent(
          entity.id
        )}`;
    }

    const detailCard =
      $("entityDetailCard");

    if (detailCard) {
      detailCard.style.display =
        "block";

      detailCard.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  function renderAttributes(entity) {
    const container =
      $("detailEntityAttributes");

    if (!container) return;

    container.innerHTML = "";

    const attributes =
      entity.attributes || {};

    const entries =
      Object.entries(attributes);

    if (!entries.length) {
      container.innerHTML = `
        <div class="attribute-item">
          <strong>No additional attributes</strong>
        </div>
      `;

      return;
    }

    entries.forEach(
      ([key, value]) => {
        const item =
          document.createElement("div");

        item.className =
          "attribute-item";

        item.innerHTML = `
          <strong>
            ${escapeHtml(key)}:
          </strong>

          <span>
            ${escapeHtml(
              Array.isArray(value)
                ? value.join(", ")
                : value
            )}
          </span>
        `;

        container.appendChild(item);
      }
    );
  }

  function closeEntityDetails() {
    selectedEntity = null;

    const card =
      $("entityDetailCard");

    if (card) {
      card.style.display =
        "none";
    }
  }

  /* =======================================================
     NEW ENTITY
     ======================================================= */

  function generateEntityId() {
    const numbers =
      allEntities
        .map((entity) => {
          const match =
            String(entity.id)
              .match(/ENT-(\d+)/i);

          return match
            ? Number(match[1])
            : 0;
        })
        .filter(Boolean);

    const next =
      (numbers.length
        ? Math.max(...numbers)
        : 0) + 1;

    return `ENT-${String(next).padStart(
      3,
      "0"
    )}`;
  }

  function openNewEntityModal() {
    const modal =
      $("entityModal");

    if (!modal) return;

    const idInput =
      $("newEntityId");

    if (idInput) {
      idInput.value =
        generateEntityId();
    }

    modal.style.display =
      "flex";
  }

  function closeNewEntityModal() {
    const modal =
      $("entityModal");

    if (modal) {
      modal.style.display =
        "none";
    }

    $("newEntityForm")?.reset();

    const idInput =
      $("newEntityId");

    if (idInput) {
      idInput.value =
        generateEntityId();
    }
  }

  function createEntity(event) {
    event.preventDefault();

    const id =
      $("newEntityId")?.value.trim() ||
      generateEntityId();

    const name =
      $("newEntityName")?.value.trim();

    const type =
      normalizeType(
        $("newEntityType")?.value
      );

    const risk =
      normalizeRisk(
        $("newEntityRisk")?.value
      );

    const cases = Math.max(
      0,
      Number(
        $("newEntityCases")?.value || 0
      )
    );

    const summary =
      $("newEntitySummary")
        ?.value.trim() ||
      "No information available.";

    if (!name) {
      $("newEntityName")?.focus();
      return;
    }

    const duplicate =
      allEntities.some(
        (entity) =>
          String(entity.id)
            .toLowerCase() ===
          id.toLowerCase()
      );

    if (duplicate) {
      alert(
        "An entity with this ID already exists."
      );
      return;
    }

    const newEntity = {
      id,
      name,
      type,
      risk,
      cases,
      relationships: 0,
      updated:
        new Date().toISOString(),
      summary,
      attributes: {}
    };

    allEntities.unshift(
      newEntity
    );

    persistEntities();
    updateMetrics();
    applyFilters();
    closeNewEntityModal();

    openEntityDetails(id);
  }

  /* =======================================================
     EDIT ENTITY
     ======================================================= */

  function editSelectedEntity() {
    if (!selectedEntity) {
      return;
    }

    const newName =
      prompt(
        "Enter entity name:",
        selectedEntity.name
      );

    if (
      newName === null ||
      !newName.trim()
    ) {
      return;
    }

    selectedEntity.name =
      newName.trim();

    selectedEntity.updated =
      new Date().toISOString();

    persistEntities();
    updateMetrics();
    applyFilters();

    openEntityDetails(
      selectedEntity.id
    );
  }

  /* =======================================================
     THEME
     ======================================================= */

  function applyTheme() {
    let settings = null;

    try {
      settings = JSON.parse(
        localStorage.getItem(
          SETTINGS_KEY
        )
      );
    } catch {
      settings = null;
    }

    let profile = null;

    try {
      profile = JSON.parse(
        localStorage.getItem(
          PROFILE_KEY
        )
      );
    } catch {
      profile = null;
    }

    const theme =
      settings?.theme ||
      profile?.theme ||
      "dark";

    document.body.classList.toggle(
      "light-theme",
      theme === "light"
    );
  }

  function toggleTheme() {
    const isLight =
      document.body.classList.contains(
        "light-theme"
      );

    document.body.classList.toggle(
      "light-theme",
      !isLight
    );

    let settings = {};

    try {
      settings =
        JSON.parse(
          localStorage.getItem(
            SETTINGS_KEY
          )
        ) || {};
    } catch {
      settings = {};
    }

    settings.theme =
      isLight ? "dark" : "light";

    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(settings)
    );
  }

  /* =======================================================
     NAVIGATION
     ======================================================= */

  function setupNavigation() {
    document
      .querySelectorAll(
        ".logout"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          (event) => {
            event.preventDefault();

            const confirmed =
              confirm(
                "Are you sure you want to logout?"
              );

            if (confirmed) {
              window.location.href =
                "login.html";
            }
          }
        );
      });
  }

  /* =======================================================
     EVENTS
     ======================================================= */

  function setupEvents() {
    $("entitySearch")
      ?.addEventListener(
        "input",
        applyFilters
      );

    $("entityTypeFilter")
      ?.addEventListener(
        "change",
        applyFilters
      );

    $("entityRiskFilter")
      ?.addEventListener(
        "change",
        applyFilters
      );

    $("sortEntities")
      ?.addEventListener(
        "change",
        applyFilters
      );

    $("clearEntityFilters")
      ?.addEventListener(
        "click",
        clearFilters
      );

    $("clearEmptyFilters")
      ?.addEventListener(
        "click",
        clearFilters
      );

    $("refreshEntities")
      ?.addEventListener(
        "click",
        () => {
          loadEntities();
          updateMetrics();
          applyFilters();
        }
      );

    $("newEntityBtn")
      ?.addEventListener(
        "click",
        openNewEntityModal
      );

    $("closeEntityModal")
      ?.addEventListener(
        "click",
        closeNewEntityModal
      );

    $("cancelNewEntity")
      ?.addEventListener(
        "click",
        closeNewEntityModal
      );

    $("newEntityForm")
      ?.addEventListener(
        "submit",
        createEntity
      );

    $("closeEntityDetail")
      ?.addEventListener(
        "click",
        closeEntityDetails
      );

    $("editEntityBtn")
      ?.addEventListener(
        "click",
        editSelectedEntity
      );

    $("themeToggle")
      ?.addEventListener(
        "click",
        toggleTheme
      );

    $("entityModal")
      ?.addEventListener(
        "click",
        (event) => {
          if (
            event.target ===
            $("entityModal")
          ) {
            closeNewEntityModal();
          }
        }
      );

    document.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Escape"
        ) {
          closeNewEntityModal();
          closeEntityDetails();
        }
      }
    );

    window.addEventListener(
      "storage",
      (event) => {
        if (
          event.key ===
          PROFILE_KEY
        ) {
          loadProfile();
        }

        if (
          event.key ===
          DATA_KEY
        ) {
          loadEntities();
          updateMetrics();
          applyFilters();
        }

        if (
          event.key ===
          SETTINGS_KEY
        ) {
          applyTheme();
        }
      }
    );
  }

  /* =======================================================
     INITIALIZE
     ======================================================= */

  function init() {
    loadProfile();
    applyTheme();

    loadEntities();
    updateMetrics();
    applyFilters();

    updateClock();

    setInterval(
      updateClock,
      1000
    );

    setupEvents();
    setupNavigation();

    const params =
      new URLSearchParams(
        window.location.search
      );

    const entityFromUrl =
      params.get("entity");

    if (entityFromUrl) {
      setTimeout(() => {
        openEntityDetails(
          entityFromUrl
        );
      }, 100);
    }
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