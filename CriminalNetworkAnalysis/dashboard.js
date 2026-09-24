// ============================================================
// CRIMENET | DASHBOARD
// Profile Sync + Dashboard Data
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    const PROFILE_KEY = "crimeNetAdminProfile";

    // ----------------------------------------------------------
    // PROFILE HELPERS
    // ----------------------------------------------------------

    function getProfile() {
        const defaults = {
            firstName: "System",
            lastName: "Analyst",
            email: "analyst@crimenet.com",
            designation: "Senior Investigator",
            role: "Administrator",
            profileImage: ""
        };

        try {
            const saved =
                localStorage.getItem(PROFILE_KEY);

            if (!saved) {
                return defaults;
            }

            return {
                ...defaults,
                ...JSON.parse(saved)
            };

        } catch (error) {
            console.error(
                "Profile loading failed:",
                error
            );

            return defaults;
        }
    }

    function getDisplayName(profile) {
        const first =
            String(profile.firstName || "").trim();

        const last =
            String(profile.lastName || "").trim();

        return (
            `${first} ${last}`.trim() ||
            "System Analyst"
        );
    }

    function getInitials(profile) {
        const first =
            String(profile.firstName || "").trim();

        const last =
            String(profile.lastName || "").trim();

        let initials = "";

        if (first) {
            initials +=
                first.charAt(0).toUpperCase();
        }

        if (last) {
            initials +=
                last.charAt(0).toUpperCase();
        }

        return initials || "CN";
    }

    // ----------------------------------------------------------
    // FIND PROFILE ELEMENTS
    // ----------------------------------------------------------

    function findProfileElements() {

        const profileBlock =
            document.querySelector(".profile");

        return {
            block: profileBlock,

            avatar:
                profileBlock?.querySelector(
                    ".avatar"
                ) ||
                profileBlock?.querySelector(
                    ".profile-avatar"
                ),

            name:
                profileBlock?.querySelector(
                    "strong"
                ),

            role:
                profileBlock?.querySelector(
                    "small"
                )
        };
    }

    // ----------------------------------------------------------
    // APPLY PROFILE
    // ----------------------------------------------------------

    function updateDashboardProfile() {

        const profile = getProfile();

        const displayName =
            getDisplayName(profile);

        const designation =
            profile.designation ||
            profile.role ||
            "Investigator";

        const initials =
            getInitials(profile);

        const elements =
            findProfileElements();

        // ------------------------------
        // Name
        // ------------------------------

        if (elements.name) {
            elements.name.textContent =
                displayName;
        }

        // ------------------------------
        // Designation
        // ------------------------------

        if (elements.role) {
            elements.role.textContent =
                designation;
        }

        // ------------------------------
        // Avatar
        // ------------------------------

        if (elements.avatar) {

            if (profile.profileImage) {

                elements.avatar.style.backgroundImage =
                    `url("${profile.profileImage}")`;

                elements.avatar.style.backgroundSize =
                    "cover";

                elements.avatar.style.backgroundPosition =
                    "center";

                elements.avatar.style.backgroundRepeat =
                    "no-repeat";

                elements.avatar.textContent = "";

            } else {

                elements.avatar.style.backgroundImage =
                    "";

                elements.avatar.textContent =
                    initials;
            }
        }

        // ------------------------------------------------------
        // Welcome message
        // ------------------------------------------------------

        const welcomeHeading =
            document.querySelector(
                ".welcome-section h1, .welcome-card h1"
            );

        if (welcomeHeading) {

            const text =
                welcomeHeading.textContent;

            if (
                text.includes("Good morning") ||
                text.includes("Good afternoon") ||
                text.includes("Good evening")
            ) {

                const hour =
                    new Date().getHours();

                let greeting =
                    "Good morning";

                if (hour >= 12 && hour < 17) {
                    greeting =
                        "Good afternoon";
                }

                if (hour >= 17) {
                    greeting =
                        "Good evening";
                }

                welcomeHeading.textContent =
                    `${greeting}, ${displayName}`;
            }
        }
    }

    // ----------------------------------------------------------
    // LIVE PROFILE SYNC
    // ----------------------------------------------------------

    window.addEventListener(
        "storage",
        (event) => {

            if (
                event.key === PROFILE_KEY
            ) {
                updateDashboardProfile();
            }
        }
    );

    // ----------------------------------------------------------
    // INITIAL PROFILE SYNC
    // ----------------------------------------------------------

    updateDashboardProfile();

    // ==========================================================
    // DASHBOARD DATA
    // ==========================================================

    const DATA_KEY = "crimeNetData";

    const defaultData = {
        cases: [],
        entities: [],
        relationships: []
    };

    function getDashboardData() {

        try {

            const saved =
                localStorage.getItem(DATA_KEY);

            if (!saved) {
                return defaultData;
            }

            return {
                ...defaultData,
                ...JSON.parse(saved)
            };

        } catch (error) {

            console.error(
                "Dashboard data loading failed:",
                error
            );

            return defaultData;
        }
    }

    const data =
        getDashboardData();

    // ----------------------------------------------------------
    // SAFE NUMBER
    // ----------------------------------------------------------

    function countItems(value) {

        if (Array.isArray(value)) {
            return value.length;
        }

        if (
            value &&
            typeof value === "object"
        ) {
            return Object.keys(value).length;
        }

        return 0;
    }

    // ----------------------------------------------------------
    // UPDATE COMMON STAT CARDS
    // ----------------------------------------------------------

    const casesCount =
        countItems(data.cases);

    const entitiesCount =
        countItems(data.entities);

    const relationshipsCount =
        countItems(data.relationships);

    const statValues =
        document.querySelectorAll(
            ".stat-value, .metric-value"
        );

    /*
     * We only update cards when recognizable
     * labels are present. This avoids changing
     * unrelated dashboard numbers.
     */

    document
        .querySelectorAll(
            ".stat-card, .metric-card"
        )
        .forEach(card => {

            const text =
                card.textContent
                    .toLowerCase();

            const value =
                card.querySelector(
                    ".stat-value, .metric-value"
                );

            if (!value) return;

            if (
                text.includes("case") &&
                !text.includes("closed")
            ) {
                if (casesCount > 0) {
                    value.textContent =
                        casesCount;
                }
            }

            else if (
                text.includes("entit")
            ) {
                if (entitiesCount > 0) {
                    value.textContent =
                        entitiesCount;
                }
            }

            else if (
                text.includes("relationship") ||
                text.includes("connection")
            ) {
                if (relationshipsCount > 0) {
                    value.textContent =
                        relationshipsCount;
                }
            }
        });

    // ----------------------------------------------------------
    // CLOCK
    // ----------------------------------------------------------

    function updateClock() {

        const clock =
            document.querySelector(
                "#currentTime, .current-time, .time"
            );

        if (!clock) return;

        const now =
            new Date();

        clock.textContent =
            now.toLocaleTimeString(
                [],
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );
    }

    updateClock();

    setInterval(
        updateClock,
        1000
    );

    // ----------------------------------------------------------
    // DATE
    // ----------------------------------------------------------

    const dateElement =
        document.querySelector(
            "#currentDate, .current-date, .date"
        );

    if (dateElement) {

        dateElement.textContent =
            new Date().toLocaleDateString(
                [],
                {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                }
            );
    }

    // ----------------------------------------------------------
    // LOGOUT
    // ----------------------------------------------------------

    document
        .querySelectorAll(
            "#logoutBtn, .logout-btn, .logout-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {
                    window.location.href =
                        "login.html";
                }
            );
        });

});