document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       CRIMENET SETTINGS ENGINE
       ========================================================= */

    const SETTINGS_KEY = "crimeNetSettings";
    const PROFILE_KEY = "crimeNetAdminProfile";
    const DATA_KEY = "crimeNetData";


    /* =========================================================
       DEFAULT SETTINGS
       ========================================================= */

    const DEFAULT_SETTINGS = {
        theme: "dark",
        density: "comfortable",
        sidebarBehavior: "expanded",

        caseNotifications: true,
        flagNotifications: true,
        systemNotifications: true,

        activityLogging: true
    };


    /* =========================================================
       HELPERS
       ========================================================= */

    const $ = (id) => document.getElementById(id);

    function readJSON(key, fallback) {

        try {

            const value = localStorage.getItem(key);

            if (!value) {
                return { ...fallback };
            }

            const parsed = JSON.parse(value);

            return {
                ...fallback,
                ...parsed
            };

        } catch (error) {

            console.error(
                "CRIMENET storage read error:",
                error
            );

            return { ...fallback };
        }
    }


    function saveJSON(key, value) {

        try {

            localStorage.setItem(
                key,
                JSON.stringify(value)
            );

            return true;

        } catch (error) {

            console.error(
                "CRIMENET storage save error:",
                error
            );

            return false;
        }
    }


    let settings =
        readJSON(
            SETTINGS_KEY,
            DEFAULT_SETTINGS
        );


    /* =========================================================
       PROFILE
       ========================================================= */

    const DEFAULT_PROFILE = {
        firstName: "System",
        lastName: "Analyst",
        email: "analyst@crimenet.com",
        designation: "Senior Investigator",
        role: "Administrator",
        profileImage: ""
    };


    let profile =
        readJSON(
            PROFILE_KEY,
            DEFAULT_PROFILE
        );


    function profileName() {

        const name =
            `${profile.firstName || ""} ${profile.lastName || ""}`
                .trim();

        return name || "System Analyst";
    }


    function profileRole() {

        return (
            profile.designation ||
            profile.role ||
            "Senior Investigator"
        );
    }


    function profileInitials() {

        const first =
            (profile.firstName || "S")
                .charAt(0);

        const last =
            (profile.lastName || "A")
                .charAt(0);

        return `${first}${last}`.toUpperCase();
    }


    function updateProfileUI() {

        const nameElement =
            $("profileName");

        const roleElement =
            $("profileRole");

        const avatar =
            $("profileAvatar");


        if (nameElement) {
            nameElement.textContent =
                profileName();
        }


        if (roleElement) {
            roleElement.textContent =
                profileRole();
        }


        if (avatar) {

            if (profile.profileImage) {

                avatar.textContent = "";

                avatar.style.backgroundImage =
                    `url("${profile.profileImage}")`;

            } else {

                avatar.style.backgroundImage =
                    "none";

                avatar.textContent =
                    profileInitials();
            }
        }
    }


    /* =========================================================
       TOAST
       ========================================================= */

    let toastTimer = null;


    function showToast(
        message,
        type = "success"
    ) {

        const toast =
            $("toast");

        if (!toast) {
            return;
        }


        toast.textContent =
            message;

        toast.className =
            `toast ${type} show`;


        clearTimeout(
            toastTimer
        );


        toastTimer =
            setTimeout(() => {

                toast.classList.remove(
                    "show"
                );

            }, 3000);
    }


    function showMessage(
        message,
        type = "success"
    ) {

        const box =
            $("settingsMessage");

        if (!box) {
            showToast(
                message,
                type
            );

            return;
        }


        box.textContent =
            message;

        box.className =
            `settings-message ${type}`;

        box.style.display =
            "block";


        setTimeout(() => {

            box.style.display =
                "none";

        }, 3500);
    }


    /* =========================================================
       THEME
       ========================================================= */

    function applyTheme() {

        document.body.classList.toggle(
            "light-theme",
            settings.theme === "light"
        );


        const select =
            $("theme");

        if (select) {
            select.value =
                settings.theme;
        }


        document
            .querySelectorAll(".theme-card")
            .forEach(card => {

                card.classList.toggle(
                    "active",
                    card.dataset.theme ===
                    settings.theme
                );

            });


        const toggle =
            $("themeToggle");

        if (toggle) {

            toggle.innerHTML =
                settings.theme === "light"
                    ? '<i class="fa-solid fa-moon"></i>'
                    : '<i class="fa-solid fa-sun"></i>';
        }
    }


    /* =========================================================
       DENSITY
       ========================================================= */

    function applyDensity() {

        document.body.classList.toggle(
            "compact-density",
            settings.density === "compact"
        );


        const select =
            $("density");

        if (select) {

            select.value =
                settings.density;
        }
    }


    /* =========================================================
       SIDEBAR
       ========================================================= */

    function applySidebar() {

        document.body.classList.toggle(
            "sidebar-collapsed",
            settings.sidebarBehavior ===
            "collapsed"
        );


        const select =
            $("sidebarBehavior");

        if (select) {

            select.value =
                settings.sidebarBehavior;
        }
    }


    /* =========================================================
       CHECKBOXES
       ========================================================= */

    function applyCheckboxes() {

        const mappings = {

            caseNotifications:
                "caseNotifications",

            flagNotifications:
                "flagNotifications",

            systemNotifications:
                "systemNotifications",

            activityLogging:
                "activityLogging"
        };


        Object.entries(mappings)
            .forEach(([elementId, settingKey]) => {

                const element =
                    $(elementId);

                if (element) {

                    element.checked =
                        Boolean(
                            settings[settingKey]
                        );
                }
            });
    }


    /* =========================================================
       APPLY ALL SETTINGS
       ========================================================= */

    function applySettings() {

        applyTheme();
        applyDensity();
        applySidebar();
        applyCheckboxes();
    }


    /* =========================================================
       SAVE CURRENT FORM
       ========================================================= */

    function collectSettings() {

        return {

            theme:
                $("theme")
                    ? $("theme").value
                    : settings.theme,

            density:
                $("density")
                    ? $("density").value
                    : settings.density,

            sidebarBehavior:
                $("sidebarBehavior")
                    ? $("sidebarBehavior").value
                    : settings.sidebarBehavior,

            caseNotifications:
                $("caseNotifications")
                    ? $("caseNotifications").checked
                    : settings.caseNotifications,

            flagNotifications:
                $("flagNotifications")
                    ? $("flagNotifications").checked
                    : settings.flagNotifications,

            systemNotifications:
                $("systemNotifications")
                    ? $("systemNotifications").checked
                    : settings.systemNotifications,

            activityLogging:
                $("activityLogging")
                    ? $("activityLogging").checked
                    : settings.activityLogging
        };
    }


    function saveSettings() {

        settings =
            collectSettings();


        const saved =
            saveJSON(
                SETTINGS_KEY,
                settings
            );


        applySettings();


        if (saved) {

            showMessage(
                "Settings saved successfully.",
                "success"
            );

        } else {

            showMessage(
                "Unable to save settings.",
                "error"
            );
        }
    }


    /* =========================================================
       SAVE BUTTON
       ========================================================= */

    const saveButton =
        $("saveSettingsBtn");

    if (saveButton) {

        saveButton.addEventListener(
            "click",
            saveSettings
        );
    }


    /* =========================================================
       RESET
       ========================================================= */

    const resetButton =
        $("resetSettingsBtn");


    if (resetButton) {

        resetButton.addEventListener(
            "click",
            () => {

                const confirmed =
                    confirm(
                        "Reset all settings to their default values?"
                    );


                if (!confirmed) {
                    return;
                }


                settings =
                    {
                        ...DEFAULT_SETTINGS
                    };


                saveJSON(
                    SETTINGS_KEY,
                    settings
                );


                applySettings();


                showMessage(
                    "Settings have been reset to defaults.",
                    "success"
                );
            }
        );
    }


    /* =========================================================
       THEME TOGGLE
       ========================================================= */

    const themeToggle =
        $("themeToggle");


    if (themeToggle) {

        themeToggle.addEventListener(
            "click",
            () => {

                settings.theme =
                    settings.theme === "dark"
                        ? "light"
                        : "dark";


                saveJSON(
                    SETTINGS_KEY,
                    settings
                );


                applyTheme();


                showToast(
                    settings.theme === "dark"
                        ? "Dark Navy enabled."
                        : "Light theme enabled.",
                    "success"
                );
            }
        );
    }


    /* =========================================================
       THEME CARDS
       ========================================================= */

    document
        .querySelectorAll(".theme-card")
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    const theme =
                        card.dataset.theme;

                    if (!theme) {
                        return;
                    }


                    settings.theme =
                        theme;


                    if ($("theme")) {
                        $("theme").value =
                            theme;
                    }


                    saveJSON(
                        SETTINGS_KEY,
                        settings
                    );


                    applyTheme();


                    showToast(
                        theme === "dark"
                            ? "Dark Navy enabled."
                            : "Light theme enabled.",
                        "success"
                    );
                }
            );
        });


    /* =========================================================
       THEME SELECT
       ========================================================= */

    if ($("theme")) {

        $("theme").addEventListener(
            "change",
            () => {

                settings.theme =
                    $("theme").value;


                saveJSON(
                    SETTINGS_KEY,
                    settings
                );


                applyTheme();
            }
        );
    }


    /* =========================================================
       DENSITY
       ========================================================= */

    if ($("density")) {

        $("density").addEventListener(
            "change",
            () => {

                settings.density =
                    $("density").value;


                saveJSON(
                    SETTINGS_KEY,
                    settings
                );


                applyDensity();


                showToast(
                    settings.density === "compact"
                        ? "Compact density enabled."
                        : "Comfortable density enabled.",
                    "success"
                );
            }
        );
    }


    /* =========================================================
       SIDEBAR
       ========================================================= */

    if ($("sidebarBehavior")) {

        $("sidebarBehavior").addEventListener(
            "change",
            () => {

                settings.sidebarBehavior =
                    $("sidebarBehavior").value;


                saveJSON(
                    SETTINGS_KEY,
                    settings
                );


                applySidebar();


                showToast(
                    settings.sidebarBehavior === "collapsed"
                        ? "Sidebar collapsed."
                        : "Sidebar expanded.",
                    "success"
                );
            }
        );
    }


    /* =========================================================
       SETTINGS TABS
       ========================================================= */

    const tabs =
        document.querySelectorAll(
            ".settings-tab"
        );

    const sections =
        document.querySelectorAll(
            ".settings-section"
        );


    function openTab(tabName) {

        tabs.forEach(tab => {

            tab.classList.toggle(
                "active",
                tab.dataset.tab === tabName
            );

        });


        sections.forEach(section => {

            section.classList.toggle(
                "active",
                section.dataset.section === tabName
            );

        });


        /*
         * Keep URL updated.
         * Example:
         * settings.html#security
         */

        if (
            window.history &&
            window.history.replaceState
        ) {

            window.history.replaceState(
                null,
                "",
                `#${tabName}`
            );
        }
    }


    tabs.forEach(tab => {

        tab.addEventListener(
            "click",
            () => {

                openTab(
                    tab.dataset.tab
                );
            }
        );
    });


    /* =========================================================
       OPEN TAB FROM URL HASH
       ========================================================= */

    const initialTab =
        window.location.hash
            .replace("#", "")
            .trim();


    if (
        initialTab &&
        document.querySelector(
            `[data-section="${initialTab}"]`
        )
    ) {

        openTab(
            initialTab
        );
    }


    /* =========================================================
       CHECKBOX LIVE SAVE
       ========================================================= */

    const checkboxMap = {

        caseNotifications:
            "caseNotifications",

        flagNotifications:
            "flagNotifications",

        systemNotifications:
            "systemNotifications",

        activityLogging:
            "activityLogging"
    };


    Object.entries(
        checkboxMap
    ).forEach(
        ([id, key]) => {

            const checkbox =
                $(id);

            if (!checkbox) {
                return;
            }


            checkbox.addEventListener(
                "change",
                () => {

                    settings[key] =
                        checkbox.checked;


                    saveJSON(
                        SETTINGS_KEY,
                        settings
                    );


                    showToast(
                        checkbox.checked
                            ? "Preference enabled."
                            : "Preference disabled.",
                        "success"
                    );
                }
            );
        }
    );


    /* =========================================================
       CHANGE PASSWORD
       ========================================================= */

    const changePasswordButton =
        $("changePasswordBtn");

    const passwordForm =
        $("passwordForm");


    if (
        changePasswordButton &&
        passwordForm
    ) {

        changePasswordButton.addEventListener(
            "click",
            () => {

                const isHidden =
                    passwordForm.style.display ===
                    "none" ||
                    passwordForm.style.display ===
                    "";


                passwordForm.style.display =
                    isHidden
                        ? "block"
                        : "none";


                if (isHidden) {

                    passwordForm.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });
                }
            }
        );
    }


    /* =========================================================
       CANCEL PASSWORD
       ========================================================= */

    if ($("cancelPasswordBtn")) {

        $("cancelPasswordBtn")
            .addEventListener(
                "click",
                () => {

                    if (passwordForm) {
                        passwordForm.reset();
                        passwordForm.style.display =
                            "none";
                    }
                }
            );
    }


    /* =========================================================
       PASSWORD SUBMIT
       ========================================================= */

    if (passwordForm) {

        passwordForm.addEventListener(
            "submit",
            (event) => {

                event.preventDefault();


                const current =
                    $("currentPassword").value
                        .trim();

                const newPassword =
                    $("newPassword").value;

                const confirmPassword =
                    $("confirmPassword").value;


                if (!current) {

                    showMessage(
                        "Please enter your current password.",
                        "error"
                    );

                    return;
                }


                if (
                    newPassword.length < 8
                ) {

                    showMessage(
                        "New password must contain at least 8 characters.",
                        "error"
                    );

                    return;
                }


                if (
                    newPassword !==
                    confirmPassword
                ) {

                    showMessage(
                        "Passwords do not match.",
                        "error"
                    );

                    return;
                }


                /*
                 * Demo application:
                 * No backend authentication system exists.
                 */

                passwordForm.reset();

                passwordForm.style.display =
                    "none";


                showMessage(
                    "Password changed successfully in demo mode.",
                    "success"
                );
            }
        );
    }


    /* =========================================================
       SECURITY ACTIONS
       ========================================================= */

    function securityMessage(type) {

        const messages = {

            security:
                "Security log opened. No security events are currently recorded.",

            activity:
                "Activity log opened. Local application activity is available through stored data.",

            sessions:
                "Active session manager opened. This browser is the current local session."
        };


        showMessage(
            messages[type],
            "info"
        );
    }


    if ($("securityLogBtn")) {

        $("securityLogBtn")
            .addEventListener(
                "click",
                () => securityMessage("security")
            );
    }


    if ($("viewActivityBtn")) {

        $("viewActivityBtn")
            .addEventListener(
                "click",
                () => securityMessage("activity")
            );
    }


    if ($("sessionManagerBtn")) {

        $("sessionManagerBtn")
            .addEventListener(
                "click",
                () => securityMessage("sessions")
            );
    }


    /* =========================================================
       HELP BUTTONS
       ========================================================= */

    const helpMessages = {

        helpCenterBtn:
            "Help Center: Use the sidebar to access Dashboard, Cases, Intelligence, Network, Entities and Reports.",

        userGuideBtn:
            "User Guide: Start from Dashboard, select a case, review intelligence and analyze entity relationships.",

        documentationBtn:
            "Documentation: CRIMENET organizes operational data into cases, intelligence, entities, networks and reports.",

        supportBtn:
            "Support: For this demo, support is available through the project administrator.",

        reportIssueBtn:
            "Issue reporting: Please record the page, action and error message when reporting a problem."
    };


    Object.entries(
        helpMessages
    ).forEach(
        ([id, message]) => {

            const button =
                $(id);

            if (!button) {
                return;
            }


            button.addEventListener(
                "click",
                () => {

                    showMessage(
                        message,
                        "info"
                    );
                }
            );
        }
    );


    /* =========================================================
       TERMS
       ========================================================= */

    if ($("termsBtn")) {

        $("termsBtn")
            .addEventListener(
                "click",
                () => {

                    showMessage(
                        "CRIMENET Terms of Service: This demonstration application is intended for authorized analysis workflows.",
                        "info"
                    );
                }
            );
    }


    /* =========================================================
       PRIVACY
       ========================================================= */

    if ($("privacyBtn")) {

        $("privacyBtn")
            .addEventListener(
                "click",
                () => {

                    showMessage(
                        "CRIMENET Privacy Policy: Profile, settings and demo application data are stored locally in this browser.",
                        "info"
                    );
                }
            );
    }


    /* =========================================================
       EXPORT DATA
       ========================================================= */

    if ($("exportDataBtn")) {

        $("exportDataBtn")
            .addEventListener(
                "click",
                () => {

                    let applicationData = {};

                    try {

                        applicationData =
                            JSON.parse(
                                localStorage.getItem(
                                    DATA_KEY
                                ) || "{}"
                            );

                    } catch (error) {

                        applicationData = {};
                    }


                    const exportData = {

                        application:
                            "CRIMENET",

                        version:
                            "1.0.0",

                        exportedAt:
                            new Date().toISOString(),

                        profile:
                            profile,

                        settings:
                            settings,

                        applicationData:
                            applicationData
                    };


                    const json =
                        JSON.stringify(
                            exportData,
                            null,
                            2
                        );


                    const blob =
                        new Blob(
                            [json],
                            {
                                type:
                                    "application/json"
                            }
                        );


                    const url =
                        URL.createObjectURL(
                            blob
                        );


                    const link =
                        document.createElement(
                            "a"
                        );


                    link.href =
                        url;

                    link.download =
                        `crimenet-export-${new Date()
                            .toISOString()
                            .slice(0, 10)}.json`;


                    document.body.appendChild(
                        link
                    );

                    link.click();

                    document.body.removeChild(
                        link
                    );


                    URL.revokeObjectURL(
                        url
                    );


                    showMessage(
                        "Application data exported successfully.",
                        "success"
                    );
                }
            );
    }


    /* =========================================================
       CLEAR APPLICATION DATA
       ========================================================= */

    if ($("clearDataBtn")) {

        $("clearDataBtn")
            .addEventListener(
                "click",
                () => {

                    const confirmed =
                        confirm(
                            "This will delete locally stored CRIMENET operational data. Your profile and settings will remain. Continue?"
                        );


                    if (!confirmed) {
                        return;
                    }


                    localStorage.removeItem(
                        DATA_KEY
                    );


                    showMessage(
                        "Operational application data cleared successfully.",
                        "success"
                    );


                    window.dispatchEvent(
                        new StorageEvent(
                            "storage",
                            {
                                key: DATA_KEY
                            }
                        )
                    );
                }
            );
    }


    /* =========================================================
       DELETE ACCOUNT MODAL
       ========================================================= */

    const deleteButton =
        $("deleteAccountBtn");

    const deleteModal =
        $("deleteModal");

    const closeDeleteModal =
        $("closeDeleteModal");

    const cancelDelete =
        $("cancelDeleteBtn");

    const confirmDelete =
        $("confirmDeleteBtn");

    const deleteInput =
        $("deleteConfirmation");


    function openDeleteModal() {

        if (!deleteModal) {
            return;
        }


        deleteModal.classList.add(
            "show"
        );


        deleteModal.setAttribute(
            "aria-hidden",
            "false"
        );


        if (deleteInput) {

            deleteInput.value = "";

            setTimeout(() => {

                deleteInput.focus();

            }, 100);
        }
    }


    function closeDeleteModalWindow() {

        if (!deleteModal) {
            return;
        }


        deleteModal.classList.remove(
            "show"
        );


        deleteModal.setAttribute(
            "aria-hidden",
            "true"
        );
    }


    if (deleteButton) {

        deleteButton.addEventListener(
            "click",
            openDeleteModal
        );
    }


    if (closeDeleteModal) {

        closeDeleteModal.addEventListener(
            "click",
            closeDeleteModalWindow
        );
    }


    if (cancelDelete) {

        cancelDelete.addEventListener(
            "click",
            closeDeleteModalWindow
        );
    }


    if (deleteModal) {

        const backdrop =
            deleteModal.querySelector(
                ".modal-backdrop"
            );


        if (backdrop) {

            backdrop.addEventListener(
                "click",
                closeDeleteModalWindow
            );
        }
    }


    if (confirmDelete) {

        confirmDelete.addEventListener(
            "click",
            () => {

                if (!deleteInput) {
                    return;
                }


                const confirmation =
                    deleteInput.value
                        .trim()
                        .toUpperCase();


                if (
                    confirmation !==
                    "DELETE"
                ) {

                    showMessage(
                        'Please type "DELETE" to confirm.',
                        "error"
                    );

                    return;
                }


                /*
                 * Demo account deletion.
                 *
                 * Remove:
                 * - profile
                 * - operational data
                 *
                 * Keep settings temporarily so
                 * the UI can transition cleanly.
                 */

                localStorage.removeItem(
                    PROFILE_KEY
                );

                localStorage.removeItem(
                    DATA_KEY
                );


                closeDeleteModalWindow();


                showMessage(
                    "Account deleted successfully. Redirecting...",
                    "success"
                );


                setTimeout(() => {

                    window.location.href =
                        "login.html";

                }, 1200);
            }
        );
    }


    /* =========================================================
       ESCAPE MODAL
       ========================================================= */

    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Escape" &&
                deleteModal &&
                deleteModal.classList.contains("show")
            ) {

                closeDeleteModalWindow();
            }
        }
    );


    /* =========================================================
       ACCOUNT LOGOUT
       ========================================================= */

    function logout() {

        const confirmed =
            confirm(
                "Are you sure you want to logout?"
            );


        if (!confirmed) {
            return;
        }


        window.location.href =
            "login.html";
    }


    if ($("accountLogoutBtn")) {

        $("accountLogoutBtn")
            .addEventListener(
                "click",
                logout
            );
    }


    if ($("logoutBtn")) {

        $("logoutBtn")
            .addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    logout();
                }
            );
    }


    /* =========================================================
       PROFILE LINK
       ========================================================= */

    document
        .querySelectorAll(
            '[data-page="profile"]'
        )
        .forEach(link => {

            link.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    window.location.href =
                        "admin-profile.html";
                }
            );
        });


    /* =========================================================
       STORAGE SYNC
       ========================================================= */

    window.addEventListener(
        "storage",
        event => {

            if (
                event.key === PROFILE_KEY
            ) {

                profile =
                    readJSON(
                        PROFILE_KEY,
                        DEFAULT_PROFILE
                    );

                updateProfileUI();
            }


            if (
                event.key === SETTINGS_KEY
            ) {

                settings =
                    readJSON(
                        SETTINGS_KEY,
                        DEFAULT_SETTINGS
                    );

                applySettings();
            }
        }
    );


    /* =========================================================
       CLOCK
       ========================================================= */

    function updateClock() {

        const now =
            new Date();


        if ($("currentDate")) {

            $("currentDate").textContent =
                now.toLocaleDateString(
                    undefined,
                    {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    }
                );
        }


        if ($("currentTime")) {

            $("currentTime").textContent =
                now.toLocaleTimeString(
                    undefined,
                    {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                    }
                );
        }
    }


    updateClock();

    setInterval(
        updateClock,
        1000
    );


    /* =========================================================
       INITIALIZE
       ========================================================= */

    updateProfileUI();

    applySettings();


    console.log(
        "CRIMENET Settings: fully initialized."
    );

});