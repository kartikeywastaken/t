/* =========================================================
   CRIMENET | NETWORK ANALYSIS
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const DATA_KEY = "crimeNetData";
  const PROFILE_KEY = "crimeNetAdminProfile";
  const SETTINGS_KEY = "crimeNetSettings";

  /* =======================================================
     DEFAULT / DEMO DATA
     ======================================================= */

  const demoCases = [
    {
      id: "CR-001",
      title: "Operation Nightfall",
      status: "Active",
      priority: "High",
      summary: "Coordinated investigation involving multiple persons and organizations.",
      updated: "Today"
    },
    {
      id: "CR-002",
      title: "Financial Network Review",
      status: "Investigating",
      priority: "Medium",
      summary: "Analysis of suspected financial relationships across multiple entities.",
      updated: "Yesterday"
    },
    {
      id: "CR-003",
      title: "Cross-Border Intelligence",
      status: "Active",
      priority: "Critical",
      summary: "Cross-border intelligence assessment involving several locations.",
      updated: "2 days ago"
    },
    {
      id: "CR-004",
      title: "Legacy Investigation",
      status: "Closed",
      priority: "Low",
      summary: "Historical case retained for reference and relationship analysis.",
      updated: "Last week"
    }
  ];

  const demoEntities = [
    {
      id: "ENT-001",
      name: "Arjun Mehta",
      type: "Person",
      risk: "High",
      cases: ["CR-001", "CR-003"]
    },
    {
      id: "ENT-002",
      name: "Nova Trading Ltd.",
      type: "Organization",
      risk: "High",
      cases: ["CR-001", "CR-002"]
    },
    {
      id: "ENT-003",
      name: "Delhi",
      type: "Location",
      risk: "Medium",
      cases: ["CR-001", "CR-003"]
    },
    {
      id: "ENT-004",
      name: "Rohan Kapoor",
      type: "Person",
      risk: "Medium",
      cases: ["CR-002"]
    },
    {
      id: "ENT-005",
      name: "Apex Holdings",
      type: "Organization",
      risk: "Low",
      cases: ["CR-002", "CR-004"]
    },
    {
      id: "ENT-006",
      name: "Mumbai",
      type: "Location",
      risk: "Low",
      cases: ["CR-004"]
    }
  ];

  const demoRelationships = [
    {
      source: "ENT-001",
      target: "ENT-002",
      type: "Financial"
    },
    {
      source: "ENT-001",
      target: "ENT-003",
      type: "Associated"
    },
    {
      source: "ENT-002",
      target: "ENT-003",
      type: "Located In"
    },
    {
      source: "ENT-002",
      target: "ENT-004",
      type: "Business"
    },
    {
      source: "ENT-004",
      target: "ENT-005",
      type: "Financial"
    },
    {
      source: "ENT-005",
      target: "ENT-006",
      type: "Located In"
    }
  ];

  /* =======================================================
     DOM
     ======================================================= */

  const caseSelect = document.getElementById("caseSelect");
  const entityTypeSelect = document.getElementById("entityType");
  const relationshipTypeSelect =
    document.getElementById("relationshipType");

  const analyzeBtn = document.getElementById("analyzeNetwork");
  const resetBtn = document.getElementById("resetGraph");
  const resetControlsBtn =
    document.getElementById("resetGraphControls");

  const zoomInBtn = document.getElementById("zoomIn");
  const zoomOutBtn = document.getElementById("zoomOut");

  const graphContainer = document.getElementById("networkGraph");

  const entityCount = document.getElementById("entityCount");
  const relationshipCount =
    document.getElementById("relationshipCount");
  const groupCount = document.getElementById("groupCount");
  const networkStatus =
    document.getElementById("networkStatus");

  const selectedEntityCard =
    document.getElementById("selectedEntityCard");

  const selectedEntityName =
    document.getElementById("selectedEntityName");

  const selectedEntityType =
    document.getElementById("selectedEntityType");

  const selectedEntityId =
    document.getElementById("selectedEntityId");

  const selectedEntityConnections =
    document.getElementById("selectedEntityConnections");

  const selectedEntityRisk =
    document.getElementById("selectedEntityRisk");

  const selectedEntityCases =
    document.getElementById("selectedEntityCases");

  const networkInsight =
    document.getElementById("networkInsight");

  const profileAvatar =
    document.getElementById("profileAvatar");

  const profileName =
    document.getElementById("profileName");

  const profileRole =
    document.getElementById("profileRole");

  const currentDate =
    document.getElementById("currentDate");

  const currentTime =
    document.getElementById("currentTime");

  const themeToggle =
    document.getElementById("themeToggle");

  /* =======================================================
     STATE
     ======================================================= */

  let cy = null;

  let cases = [];
  let entities = [];
  let relationships = [];

  let currentCaseId = "ALL";
  let selectedEntity = null;

  /* =======================================================
     HELPERS
     ======================================================= */

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function normalizeCase(item, fallbackIndex = 0) {
    if (!item || typeof item !== "object") {
      return null;
    }

    return {
      id:
        item.id ||
        item.caseId ||
        item.case_id ||
        `CR-${String(fallbackIndex + 1).padStart(3, "0")}`,

      title:
        item.title ||
        item.name ||
        item.caseTitle ||
        "Untitled Case",

      status:
        item.status ||
        item.state ||
        "Active",

      priority:
        item.priority ||
        item.severity ||
        "Medium",

      summary:
        item.summary ||
        item.description ||
        "",

      updated:
        item.updated ||
        item.updatedAt ||
        item.date ||
        "Recently"
    };
  }

  function normalizeEntity(item, fallbackIndex = 0) {
    if (!item || typeof item !== "object") {
      return null;
    }

    let entityCases =
      item.cases ||
      item.caseIds ||
      item.case_ids ||
      [];

    if (!Array.isArray(entityCases)) {
      entityCases = entityCases
        ? [entityCases]
        : [];
    }

    return {
      id:
        item.id ||
        item.entityId ||
        item.entity_id ||
        `ENT-${String(fallbackIndex + 1).padStart(3, "0")}`,

      name:
        item.name ||
        item.title ||
        item.fullName ||
        "Unknown Entity",

      type:
        item.type ||
        item.entityType ||
        "Person",

      risk:
        item.risk ||
        item.riskLevel ||
        item.priority ||
        "Low",

      cases: entityCases
    };
  }

  function normalizeRelationship(item) {
    if (!item || typeof item !== "object") {
      return null;
    }

    const source =
      item.source ||
      item.from ||
      item.sourceId ||
      item.entity1;

    const target =
      item.target ||
      item.to ||
      item.targetId ||
      item.entity2;

    if (!source || !target) {
      return null;
    }

    return {
      source,
      target,
      type:
        item.type ||
        item.relationshipType ||
        item.relation ||
        "Associated"
    };
  }

  /* =======================================================
     LOAD DATA
     ======================================================= */

  function loadData() {
    let stored = null;

    try {
      stored = JSON.parse(
        localStorage.getItem(DATA_KEY) || "null"
      );
    } catch (error) {
      stored = null;
    }

    if (stored) {
      const storedCases =
        Array.isArray(stored)
          ? stored
          : stored.cases;

      const storedEntities =
        Array.isArray(stored?.entities)
          ? stored.entities
          : [];

      const storedRelationships =
        Array.isArray(stored?.relationships)
          ? stored.relationships
          : Array.isArray(stored?.relations)
            ? stored.relations
            : [];

      cases = safeArray(storedCases)
        .map(normalizeCase)
        .filter(Boolean);

      entities = storedEntities
        .map(normalizeEntity)
        .filter(Boolean);

      relationships = storedRelationships
        .map(normalizeRelationship)
        .filter(Boolean);
    }

    if (!cases.length) {
      cases = demoCases.map((item) => ({ ...item }));
    }

    if (!entities.length) {
      entities = demoEntities.map((item) => ({
        ...item,
        cases: [...item.cases]
      }));
    }

    if (!relationships.length) {
      relationships = demoRelationships.map((item) => ({
        ...item
      }));
    }

    /*
     * If relationships are absent but entities exist,
     * generate useful case-based relationships.
     */
    if (
      relationships.length === 0 &&
      entities.length > 1
    ) {
      relationships = buildCaseRelationships();
    }
  }

  /* =======================================================
     BUILD RELATIONSHIPS
     ======================================================= */

  function buildCaseRelationships() {
    const generated = [];

    entities.forEach((entityA, index) => {
      entities.slice(index + 1).forEach((entityB) => {
        const sharedCases = safeArray(entityA.cases).filter(
          (caseId) =>
            safeArray(entityB.cases).includes(caseId)
        );

        if (sharedCases.length) {
          generated.push({
            source: entityA.id,
            target: entityB.id,
            type: "Case Association"
          });
        }
      });
    });

    return generated;
  }

  /* =======================================================
     PROFILE
     ======================================================= */

  function getProfile() {
    try {
      return JSON.parse(
        localStorage.getItem(PROFILE_KEY) || "null"
      );
    } catch (error) {
      return null;
    }
  }

  function getInitials(name) {
    const parts = String(name || "System Analyst")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (!parts.length) {
      return "SA";
    }

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    ).toUpperCase();
  }

  function updateProfile() {
    const profile = getProfile();

    if (!profile) {
      if (profileName) {
        profileName.textContent = "Analyst";
      }

      if (profileRole) {
        profileRole.textContent = "Senior Investigator";
      }

      return;
    }

    const fullName = [
      profile.firstName || "",
      profile.lastName || ""
    ]
      .join(" ")
      .trim() || "Analyst";

    const role =
      profile.designation ||
      profile.role ||
      "Senior Investigator";

    if (profileName) {
      profileName.textContent = fullName;
    }

    if (profileRole) {
      profileRole.textContent = role;
    }

    if (profileAvatar) {
      if (profile.profileImage) {
        profileAvatar.innerHTML = "";

        const img = document.createElement("img");

        img.src = profile.profileImage;
        img.alt = fullName;

        profileAvatar.appendChild(img);
      } else {
        profileAvatar.textContent =
          getInitials(fullName);
      }
    }
  }

  /* =======================================================
     CLOCK
     ======================================================= */

  function updateClock() {
    const now = new Date();

    if (currentDate) {
      currentDate.textContent =
        now.toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
          year: "numeric"
        });
    }

    if (currentTime) {
      currentTime.textContent =
        now.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        });
    }
  }

  /* =======================================================
     THEME
     ======================================================= */

  function applyTheme() {
    let theme = "dark";

    try {
      const settings = JSON.parse(
        localStorage.getItem(SETTINGS_KEY) || "null"
      );

      const profile = getProfile();

      theme =
        settings?.theme ||
        profile?.theme ||
        "dark";
    } catch (error) {
      theme = "dark";
    }

    document.body.classList.toggle(
      "light-theme",
      theme === "light"
    );
  }

  function toggleTheme() {
    const isLight =
      document.body.classList.toggle("light-theme");

    const newTheme = isLight ? "light" : "dark";

    try {
      const settings = JSON.parse(
        localStorage.getItem(SETTINGS_KEY) || "{}"
      );

      settings.theme = newTheme;

      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(settings)
      );
    } catch (error) {
      /* Ignore storage errors */
    }

    try {
      const profile = getProfile();

      if (profile) {
        profile.theme = newTheme;

        localStorage.setItem(
          PROFILE_KEY,
          JSON.stringify(profile)
        );
      }
    } catch (error) {
      /* Ignore storage errors */
    }
  }

  /* =======================================================
     CASE SELECT
     ======================================================= */

  function populateCases() {
    if (!caseSelect) {
      return;
    }

    const previousValue = caseSelect.value;

    caseSelect.innerHTML =
      `<option value="ALL">All Cases</option>`;

    cases.forEach((item) => {
      const option =
        document.createElement("option");

      option.value = item.id;
      option.textContent =
        `${item.id} — ${item.title}`;

      caseSelect.appendChild(option);
    });

    if (
      previousValue &&
      [...caseSelect.options].some(
        (option) =>
          option.value === previousValue
      )
    ) {
      caseSelect.value = previousValue;
    } else {
      caseSelect.value = "ALL";
    }

    currentCaseId = caseSelect.value;
  }

  /* =======================================================
     FILTER GRAPH DATA
     ======================================================= */

  function getFilteredEntities() {
    let filtered = [...entities];

    if (currentCaseId !== "ALL") {
      filtered = filtered.filter((entity) =>
        safeArray(entity.cases).includes(
          currentCaseId
        )
      );
    }

    if (
      entityTypeSelect &&
      entityTypeSelect.value &&
      entityTypeSelect.value !== "all"
    ) {
      const type =
        entityTypeSelect.value.toLowerCase();

      filtered = filtered.filter(
        (entity) =>
          String(entity.type).toLowerCase() === type
      );
    }

    return filtered;
  }

  function getFilteredRelationships(filteredEntities) {
    const validIds = new Set(
      filteredEntities.map((entity) => entity.id)
    );

    let filtered =
      relationships.filter(
        (relationship) =>
          validIds.has(String(relationship.source)) &&
          validIds.has(String(relationship.target))
      );

    if (
      relationshipTypeSelect &&
      relationshipTypeSelect.value &&
      relationshipTypeSelect.value !== "all"
    ) {
      const selectedType =
        relationshipTypeSelect.value.toLowerCase();

      filtered = filtered.filter(
        (relationship) =>
          String(relationship.type).toLowerCase() ===
          selectedType
      );
    }

    return filtered;
  }

  /* =======================================================
     NODE COLORS
     ======================================================= */

  function getNodeColor(type) {
    const normalized =
      String(type || "").toLowerCase();

    if (normalized.includes("organization")) {
      return "#a78bfa";
    }

    if (normalized.includes("location")) {
      return "#34d399";
    }

    return "#38bdf8";
  }

  function getRiskColor(risk) {
    const normalized =
      String(risk || "").toLowerCase();

    if (
      normalized.includes("critical") ||
      normalized.includes("high")
    ) {
      return "#fb7185";
    }

    if (normalized.includes("medium")) {
      return "#fbbf24";
    }

    return "#34d399";
  }

  /* =======================================================
     BUILD GRAPH
     ======================================================= */

  function buildGraph() {
    if (!graphContainer) {
      return;
    }

    const filteredEntities =
      getFilteredEntities();

    const filteredRelationships =
      getFilteredRelationships(
        filteredEntities
      );

    if (typeof cytoscape === "undefined") {
      graphContainer.innerHTML = `
        <div style="
          height:100%;
          min-height:300px;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#9eacbd;
          font-size:13px;
          padding:30px;
          text-align:center;
        ">
          Network visualization library could not be loaded.
        </div>
      `;

      updateMetrics(
        filteredEntities,
        filteredRelationships
      );

      return;
    }

    if (cy) {
      cy.destroy();
      cy = null;
    }

    const nodes = filteredEntities.map(
      (entity) => ({
        data: {
          id: String(entity.id),
          name: entity.name,
          type: entity.type,
          risk: entity.risk
        }
      })
    );

    const edges = filteredRelationships
      .map((relationship, index) => ({
        data: {
          id:
            `rel-${index}-${relationship.source}-${relationship.target}`,

          source: String(relationship.source),
          target: String(relationship.target),

          type: relationship.type
        }
      }))
      .filter(
        (edge) =>
          nodes.some(
            (node) =>
              node.data.id === edge.data.source
          ) &&
          nodes.some(
            (node) =>
              node.data.id === edge.data.target
          )
      );

    cy = cytoscape({
      container: graphContainer,

      elements: {
        nodes,
        edges
      },

      minZoom: 0.35,
      maxZoom: 3,

      wheelSensitivity: 0.18,

      layout: {
        name: "cose",
        animate: true,
        animationDuration: 500,
        fit: true,
        padding: 55,

        nodeRepulsion: 6500,
        idealEdgeLength: 145,
        edgeElasticity: 100,

        nestingFactor: 1.2,
        gravity: 0.45
      },

      style: [
        {
          selector: "node",

          style: {
            "background-color": (node) =>
              getNodeColor(
                node.data("type")
              ),

            "border-width": 2,

            "border-color": (node) =>
              getNodeColor(
                node.data("type")
              ),

            "width": 38,
            "height": 38,

            label: "data(name)",

            color: "#e8eef7",

            "font-size": 10,
            "font-weight": 600,

            "text-wrap": "wrap",
            "text-max-width": "95px",

            "text-valign": "bottom",
            "text-halign": "center",

            "text-margin-y": 10,

            "text-outline-width": 3,
            "text-outline-color": "#08111b",

            "overlay-opacity": 0
          }
        },

        {
          selector: "node[risk = 'High']",

          style: {
            "border-color": "#fb7185",
            "border-width": 3,

            "box-shadow":
              "0 0 14px rgba(251,113,133,.45)"
          }
        },

        {
          selector: "node[risk = 'Critical']",

          style: {
            "border-color": "#fb7185",
            "border-width": 4
          }
        },

        {
          selector: "edge",

          style: {
            width: 1.5,

            "line-color": "#40556b",

            "target-arrow-color": "#40556b",

            "target-arrow-shape": "triangle",

            "curve-style": "bezier",

            opacity: 0.75
          }
        },

        {
          selector: "edge:selected",

          style: {
            width: 3,

            "line-color": "#38bdf8",

            "target-arrow-color": "#38bdf8"
          }
        },

        {
          selector: "node:selected",

          style: {
            "border-color": "#ffffff",
            "border-width": 3,

            width: 46,
            height: 46
          }
        },

        {
          selector: ".highlighted",

          style: {
            "border-color": "#ffffff",
            "border-width": 3,

            "line-color": "#38bdf8",

            "target-arrow-color": "#38bdf8"
          }
        }
      ]
    });

    /* Node click */
    cy.on("tap", "node", (event) => {
      const node = event.target;

      const entity = entities.find(
        (item) =>
          String(item.id) ===
          String(node.id())
      );

      if (entity) {
        showSelectedEntity(entity);
      }
    });

    /* Background click */
    cy.on("tap", (event) => {
      if (event.target === cy) {
        clearSelectedEntity();
      }
    });

    updateMetrics(
      filteredEntities,
      filteredRelationships
    );
  }

  /* =======================================================
     METRICS
     ======================================================= */

  function updateMetrics(
    filteredEntities,
    filteredRelationships
  ) {
    if (entityCount) {
      entityCount.textContent =
        filteredEntities.length;
    }

    if (relationshipCount) {
      relationshipCount.textContent =
        filteredRelationships.length;
    }

    if (groupCount) {
      groupCount.textContent =
        calculateGroups(
          filteredEntities,
          filteredRelationships
        );
    }

    if (networkStatus) {
      networkStatus.textContent =
        filteredEntities.length
          ? "Active"
          : "No Data";
    }
  }

  /* =======================================================
     CONNECTED GROUPS
     ======================================================= */

  function calculateGroups(
    nodeList,
    edgeList
  ) {
    if (!nodeList.length) {
      return 0;
    }

    const ids = nodeList.map(
      (node) => String(node.id)
    );

    const adjacency = {};

    ids.forEach((id) => {
      adjacency[id] = [];
    });

    edgeList.forEach((edge) => {
      const source = String(edge.source);
      const target = String(edge.target);

      if (
        adjacency[source] &&
        adjacency[target]
      ) {
        adjacency[source].push(target);
        adjacency[target].push(source);
      }
    });

    const visited = new Set();
    let groups = 0;

    ids.forEach((start) => {
      if (visited.has(start)) {
        return;
      }

      groups++;

      const queue = [start];
      visited.add(start);

      while (queue.length) {
        const current = queue.shift();

        adjacency[current].forEach(
          (neighbor) => {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.push(neighbor);
            }
          }
        );
      }
    });

    return groups;
  }

  /* =======================================================
     SELECTED ENTITY
     ======================================================= */

  function showSelectedEntity(entity) {
    selectedEntity = entity;

    if (!selectedEntityCard) {
      return;
    }

    selectedEntityCard.style.display = "block";

    if (selectedEntityName) {
      selectedEntityName.textContent =
        entity.name;
    }

    if (selectedEntityType) {
      selectedEntityType.textContent =
        entity.type;
    }

    if (selectedEntityId) {
      selectedEntityId.textContent =
        entity.id;
    }

    const connections =
      relationships.filter(
        (relationship) =>
          String(relationship.source) ===
            String(entity.id) ||
          String(relationship.target) ===
            String(entity.id)
      );

    if (selectedEntityConnections) {
      selectedEntityConnections.textContent =
        connections.length;
    }

    if (selectedEntityRisk) {
      selectedEntityRisk.textContent =
        entity.risk || "Low";
    }

    if (selectedEntityCases) {
      selectedEntityCases.textContent =
        safeArray(entity.cases).length
          ? safeArray(entity.cases).join(", ")
          : "None";
    }

    if (networkInsight) {
      networkInsight.textContent =
        generateInsight(
          entity,
          connections
        );
    }

    if (cy) {
      cy.elements().removeClass("highlighted");

      const node = cy.getElementById(
        String(entity.id)
      );

      if (node.length) {
        node.addClass("highlighted");

        node.connectedEdges()
          .addClass("highlighted");
      }
    }
  }

  function clearSelectedEntity() {
    selectedEntity = null;

    if (selectedEntityCard) {
      selectedEntityCard.style.display = "none";
    }

    if (cy) {
      cy.elements().removeClass("highlighted");
    }
  }

  function generateInsight(entity, connections) {
    const connectionCount =
      connections.length;

    const caseCount =
      safeArray(entity.cases).length;

    if (connectionCount >= 4) {
      return `${entity.name} has ${connectionCount} direct relationships and appears as a highly connected node in the current network.`;
    }

    if (connectionCount >= 2) {
      return `${entity.name} has ${connectionCount} direct relationships across ${caseCount || "the"} associated case network.`;
    }

    if (connectionCount === 1) {
      return `${entity.name} has one direct relationship in the current network.`;
    }

    return `${entity.name} currently has no direct relationships in the selected network view.`;
  }

  /* =======================================================
     ZOOM
     ======================================================= */

  function zoomIn() {
    if (!cy) {
      return;
    }

    const currentZoom = cy.zoom();

    cy.animate({
      zoom: Math.min(
        currentZoom * 1.25,
        3
      ),
      center: cy.extent()
    }, {
      duration: 180
    });
  }

  function zoomOut() {
    if (!cy) {
      return;
    }

    const currentZoom = cy.zoom();

    cy.animate({
      zoom: Math.max(
        currentZoom / 1.25,
        0.35
      ),
      center: cy.extent()
    }, {
      duration: 180
    });
  }

  /* =======================================================
     RESET
     ======================================================= */

  function resetGraph() {
    clearSelectedEntity();

    if (caseSelect) {
      caseSelect.value = "ALL";
    }

    if (entityTypeSelect) {
      entityTypeSelect.value = "all";
    }

    if (relationshipTypeSelect) {
      relationshipTypeSelect.value = "all";
    }

    currentCaseId = "ALL";

    buildGraph();
  }

  /* =======================================================
     ANALYZE
     ======================================================= */

  function analyzeNetwork() {
    currentCaseId =
      caseSelect?.value || "ALL";

    buildGraph();

    if (cy) {
      cy.layout({
        name: "cose",
        animate: true,
        animationDuration: 550,
        fit: true,
        padding: 55,
        nodeRepulsion: 6500,
        idealEdgeLength: 145,
        gravity: 0.45
      }).run();
    }
  }

  /* =======================================================
     NAVIGATION
     ======================================================= */

  function setupNavigation() {
    document
      .querySelectorAll("[data-page]")
      .forEach((item) => {
        item.addEventListener(
          "click",
          () => {
            const page =
              item.dataset.page;

            if (page) {
              window.location.href = page;
            }
          }
        );
      });

    document
      .querySelectorAll(".nav-item")
      .forEach((item) => {
        const href =
          item.getAttribute("href");

        if (
          href &&
          !href.startsWith("#") &&
          !href.startsWith("javascript:")
        ) {
          item.addEventListener(
            "click",
            () => {
              window.location.href = href;
            }
          );
        }
      });
  }

  /* =======================================================
     LOGOUT
     ======================================================= */

  function setupLogout() {
    const logoutButtons =
      document.querySelectorAll(
        "#logoutBtn, #accountLogoutBtn, .logout-item"
      );

    logoutButtons.forEach((button) => {
      button.addEventListener(
        "click",
        (event) => {
          const href =
            button.getAttribute("href");

          if (
            button.id === "logoutBtn" ||
            button.id === "accountLogoutBtn" ||
            button.classList.contains("logout-item")
          ) {
            event.preventDefault();

            const confirmed =
              window.confirm(
                "Are you sure you want to logout?"
              );

            if (confirmed) {
              window.location.href =
                "login.html";
            }
          } else if (href) {
            window.location.href = href;
          }
        }
      );
    });
  }

  /* =======================================================
     URL CASE SUPPORT
     ======================================================= */

  function loadCaseFromURL() {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const caseId =
      params.get("case");

    if (!caseId || !caseSelect) {
      return;
    }

    const exists = cases.some(
      (item) =>
        String(item.id).toLowerCase() ===
        String(caseId).toLowerCase()
    );

    if (exists) {
      caseSelect.value = caseId;
      currentCaseId = caseId;

      buildGraph();
    }
  }

  /* =======================================================
     STORAGE SYNC
     ======================================================= */

  window.addEventListener(
    "storage",
    (event) => {
      if (
        event.key === PROFILE_KEY ||
        event.key === SETTINGS_KEY
      ) {
        updateProfile();
        applyTheme();
      }

      if (event.key === DATA_KEY) {
        loadData();
        populateCases();
        buildGraph();
      }
    }
  );

  /* =======================================================
     EVENT LISTENERS
     ======================================================= */

  caseSelect?.addEventListener(
    "change",
    () => {
      currentCaseId =
        caseSelect.value;

      buildGraph();
    }
  );

  entityTypeSelect?.addEventListener(
    "change",
    () => {
      buildGraph();
    }
  );

  relationshipTypeSelect?.addEventListener(
    "change",
    () => {
      buildGraph();
    }
  );

  analyzeBtn?.addEventListener(
    "click",
    analyzeNetwork
  );

  resetBtn?.addEventListener(
    "click",
    resetGraph
  );

  resetControlsBtn?.addEventListener(
    "click",
    resetGraph
  );

  zoomInBtn?.addEventListener(
    "click",
    zoomIn
  );

  zoomOutBtn?.addEventListener(
    "click",
    zoomOut
  );

  themeToggle?.addEventListener(
    "click",
    toggleTheme
  );

  /* =======================================================
     INITIALIZE
     ======================================================= */

  loadData();

  updateProfile();
  applyTheme();
  updateClock();

  setInterval(
    updateClock,
    1000
  );

  populateCases();

  buildGraph();

  loadCaseFromURL();

  setupNavigation();
  setupLogout();
});