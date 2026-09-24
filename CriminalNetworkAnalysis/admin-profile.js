// ============================================================
// CRIMENET | ADMIN PROFILE
// Profile data + image + preferences + security
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY = "crimeNetAdminProfile";

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

    // ------------------------------------------------------------
    // DOM ELEMENTS
    // ------------------------------------------------------------

    const profileForm = document.getElementById("profileForm");

    const firstNameInput = document.getElementById("firstName");
    const lastNameInput = document.getElementById("lastName");
    const emailInput = document.getElementById("email");
    const designationInput = document.getElementById("designation");
    const roleInput = document.getElementById("role");

    const profileAvatar = document.getElementById("profileAvatar");
    const profileDisplayName = document.getElementById("profileDisplayName");
    const profileDisplayRole = document.getElementById("profileDisplayRole");
    const profileDisplayEmail = document.getElementById("profileDisplayEmail");

    const topProfileAvatar = document.getElementById("topProfileAvatar");
    const topProfileName = document.getElementById("topProfileName");
    const topProfileRole = document.getElementById("topProfileRole");

    const profileImageInput = document.getElementById("profileImageInput");

    const themeInput = document.getElementById("theme");
    const densityInput = document.getElementById("density");

    const cancelBtn = document.getElementById("cancelBtn");

    const changePasswordBtn = document.getElementById("changePasswordBtn");
    const passwordForm = document.getElementById("passwordForm");
    const cancelPasswordBtn = document.getElementById("cancelPasswordBtn");
    const savePasswordBtn = document.getElementById("savePasswordBtn");

    const currentPassword = document.getElementById("currentPassword");
    const newPassword = document.getElementById("newPassword");
    const confirmPassword = document.getElementById("confirmPassword");

    const logoutBtn = document.getElementById("logoutBtn");
    const accountLogoutBtn = document.getElementById("accountLogoutBtn");
    const deleteAccountBtn = document.getElementById("deleteAccountBtn");

    const profileMessage = document.getElementById("profileMessage");

    // ------------------------------------------------------------
    // LOAD PROFILE
    // ------------------------------------------------------------

    function getProfile() {
        try {
            const savedProfile = localStorage.getItem(STORAGE_KEY);

            if (!savedProfile) {
                return { ...defaultProfile };
            }

            const parsedProfile = JSON.parse(savedProfile);

            return {
                ...defaultProfile,
                ...parsedProfile
            };
        } catch (error) {
            console.error("Unable to load profile:", error);
            return { ...defaultProfile };
        }
    }

    let profile = getProfile();

    // ------------------------------------------------------------
    // SAVE PROFILE
    // ------------------------------------------------------------

    function saveProfile(data) {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(data)
            );

            profile = data;

            return true;
        } catch (error) {
            console.error("Unable to save profile:", error);

            showMessage(
                "Profile could not be saved. Storage may be full.",
                "error"
            );

            return false;
        }
    }

    // ------------------------------------------------------------
    // INITIALS
    // ------------------------------------------------------------

    function getInitials(firstName, lastName) {
        const first = String(firstName || "").trim();
        const last = String(lastName || "").trim();

        let initials = "";

        if (first) {
            initials += first.charAt(0).toUpperCase();
        }

        if (last) {
            initials += last.charAt(0).toUpperCase();
        }

        if (!initials) {
            initials = "CN";
        }

        return initials.substring(0, 2);
    }

    // ------------------------------------------------------------
    // DISPLAY NAME
    // ------------------------------------------------------------

    function getDisplayName(data) {
        const first = String(data.firstName || "").trim();
        const last = String(data.lastName || "").trim();

        const fullName = `${first} ${last}`.trim();

        return fullName || "System Analyst";
    }

    // ------------------------------------------------------------
    // UPDATE AVATAR
    // ------------------------------------------------------------

    function setAvatar(element, image, initials) {
        if (!element) return;

        if (image) {
            element.style.backgroundImage = `url("${image}")`;
            element.style.backgroundSize = "cover";
            element.style.backgroundPosition = "center";
            element.style.backgroundRepeat = "no-repeat";
            element.textContent = "";
        } else {
            element.style.backgroundImage = "";
            element.textContent = initials;
        }
    }

    // ------------------------------------------------------------
    // UPDATE UI
    // ------------------------------------------------------------

    function updateProfileUI(data) {
        const displayName = getDisplayName(data);
        const initials = getInitials(
            data.firstName,
            data.lastName
        );

        const designation =
            data.designation ||
            data.role ||
            "Investigator";

        const role =
            data.role ||
            "Administrator";

        // Form
        if (firstNameInput) {
            firstNameInput.value = data.firstName || "";
        }

        if (lastNameInput) {
            lastNameInput.value = data.lastName || "";
        }

        if (emailInput) {
            emailInput.value = data.email || "";
        }

        if (designationInput) {
            designationInput.value =
                data.designation || "";
        }

        if (roleInput) {
            roleInput.value =
                data.role || "Administrator";
        }

        // Profile overview
        if (profileDisplayName) {
            profileDisplayName.textContent =
                displayName;
        }

        if (profileDisplayRole) {
            profileDisplayRole.textContent =
                designation;
        }

        if (profileDisplayEmail) {
            profileDisplayEmail.textContent =
                data.email || "No email available";
        }

        // Top profile
        if (topProfileName) {
            topProfileName.textContent =
                displayName;
        }

        if (topProfileRole) {
            topProfileRole.textContent =
                designation;
        }

        // Avatar
        setAvatar(
            profileAvatar,
            data.profileImage,
            initials
        );

        setAvatar(
            topProfileAvatar,
            data.profileImage,
            initials
        );

        // Preferences
        if (themeInput) {
            themeInput.value =
                data.theme || "dark";
        }

        if (densityInput) {
            densityInput.value =
                data.density || "comfortable";
        }

        applyTheme(data.theme);
        applyDensity(data.density);
    }

    // ------------------------------------------------------------
    // THEME
    // ------------------------------------------------------------

    function applyTheme(theme) {
        if (theme === "light") {
            document.body.classList.add("light-theme");
        } else if (theme === "system") {
            const prefersLight =
                window.matchMedia &&
                window.matchMedia(
                    "(prefers-color-scheme: light)"
                ).matches;

            document.body.classList.toggle(
                "light-theme",
                prefersLight
            );
        } else {
            document.body.classList.remove(
                "light-theme"
            );
        }
    }

    // ------------------------------------------------------------
    // DENSITY
    // ------------------------------------------------------------

    function applyDensity(density) {
        document.body.dataset.density =
            density || "comfortable";
    }

    // ------------------------------------------------------------
    // MESSAGE
    // ------------------------------------------------------------

    function showMessage(message, type = "success") {
        if (!profileMessage) return;

        profileMessage.textContent = message;

        profileMessage.className =
            `profile-message ${type}`;

        profileMessage.style.display = "block";

        clearTimeout(showMessage.timer);

        showMessage.timer = setTimeout(() => {
            profileMessage.style.display = "none";
        }, 3500);
    }

    // ------------------------------------------------------------
    // PROFILE FORM SUBMIT
    // ------------------------------------------------------------

    if (profileForm) {
        profileForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const firstName =
                firstNameInput.value.trim();

            const lastName =
                lastNameInput.value.trim();

            const email =
                emailInput.value.trim();

            const designation =
                designationInput.value.trim();

            const role =
                roleInput.value;

            if (!firstName || !lastName) {
                showMessage(
                    "Please enter your first and last name.",
                    "error"
                );
                return;
            }

            if (!email) {
                showMessage(
                    "Please enter your email address.",
                    "error"
                );
                return;
            }

            const updatedProfile = {
                ...profile,
                firstName,
                lastName,
                email,
                designation:
                    designation ||
                    "Investigator",
                role:
                    role ||
                    "Administrator"
            };

            if (saveProfile(updatedProfile)) {
                updateProfileUI(updatedProfile);

                showMessage(
                    "Profile updated successfully.",
                    "success"
                );
            }
        });
    }

    // ------------------------------------------------------------
    // CANCEL PROFILE EDIT
    // ------------------------------------------------------------

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            updateProfileUI(profile);

            showMessage(
                "Changes discarded.",
                "info"
            );
        });
    }

    // ------------------------------------------------------------
    // PROFILE IMAGE UPLOAD
    // ------------------------------------------------------------

    if (profileImageInput) {
        profileImageInput.addEventListener(
            "change",
            (event) => {
                const file =
                    event.target.files &&
                    event.target.files[0];

                if (!file) return;

                if (!file.type.startsWith("image/")) {
                    showMessage(
                        "Please select a valid image file.",
                        "error"
                    );

                    profileImageInput.value = "";
                    return;
                }

                // 5 MB limit
                const maxSize =
                    5 * 1024 * 1024;

                if (file.size > maxSize) {
                    showMessage(
                        "Image must be smaller than 5 MB.",
                        "error"
                    );

                    profileImageInput.value = "";
                    return;
                }

                const reader =
                    new FileReader();

                reader.onload = () => {
                    const imageData =
                        reader.result;

                    const updatedProfile = {
                        ...profile,
                        profileImage:
                            imageData
                    };

                    if (saveProfile(updatedProfile)) {
                        updateProfileUI(
                            updatedProfile
                        );

                        showMessage(
                            "Profile photo updated.",
                            "success"
                        );
                    }
                };

                reader.onerror = () => {
                    showMessage(
                        "Unable to read the selected image.",
                        "error"
                    );
                };

                reader.readAsDataURL(file);
            }
        );
    }

    // ------------------------------------------------------------
    // THEME CHANGE
    // ------------------------------------------------------------

    if (themeInput) {
        themeInput.addEventListener(
            "change",
            () => {
                const selectedTheme =
                    themeInput.value;

                const updatedProfile = {
                    ...profile,
                    theme: selectedTheme
                };

                applyTheme(selectedTheme);

                saveProfile(updatedProfile);

                showMessage(
                    "Theme preference saved.",
                    "success"
                );
            }
        );
    }

    // ------------------------------------------------------------
    // DENSITY CHANGE
    // ------------------------------------------------------------

    if (densityInput) {
        densityInput.addEventListener(
            "change",
            () => {
                const selectedDensity =
                    densityInput.value;

                const updatedProfile = {
                    ...profile,
                    density: selectedDensity
                };

                applyDensity(
                    selectedDensity
                );

                saveProfile(updatedProfile);

                showMessage(
                    "Display density updated.",
                    "success"
                );
            }
        );
    }

    // ------------------------------------------------------------
    // CHANGE PASSWORD
    // ------------------------------------------------------------

    if (changePasswordBtn && passwordForm) {
        changePasswordBtn.addEventListener(
            "click",
            () => {
                const isHidden =
                    passwordForm.style.display ===
                    "none" ||
                    passwordForm.style.display === "";

                passwordForm.style.display =
                    isHidden ? "block" : "none";

                if (isHidden && currentPassword) {
                    currentPassword.focus();
                }
            }
        );
    }

    // ------------------------------------------------------------
    // CANCEL PASSWORD
    // ------------------------------------------------------------

    if (cancelPasswordBtn) {
        cancelPasswordBtn.addEventListener(
            "click",
            () => {
                if (passwordForm) {
                    passwordForm.style.display =
                        "none";
                }

                if (currentPassword) {
                    currentPassword.value = "";
                }

                if (newPassword) {
                    newPassword.value = "";
                }

                if (confirmPassword) {
                    confirmPassword.value = "";
                }
            }
        );
    }

    // ------------------------------------------------------------
    // SAVE PASSWORD
    // ------------------------------------------------------------

    if (savePasswordBtn) {
        savePasswordBtn.addEventListener(
            "click",
            () => {
                const current =
                    currentPassword.value;

                const newPass =
                    newPassword.value;

                const confirm =
                    confirmPassword.value;

                if (!current) {
                    showMessage(
                        "Enter your current password.",
                        "error"
                    );
                    return;
                }

                if (!newPass) {
                    showMessage(
                        "Enter a new password.",
                        "error"
                    );
                    return;
                }

                if (newPass.length < 8) {
                    showMessage(
                        "New password must contain at least 8 characters.",
                        "error"
                    );
                    return;
                }

                if (newPass !== confirm) {
                    showMessage(
                        "New passwords do not match.",
                        "error"
                    );
                    return;
                }

                /*
                 * Demo application:
                 * No real backend authentication is connected.
                 * Therefore the password is NOT stored in localStorage.
                 */

                if (passwordForm) {
                    passwordForm.style.display =
                        "none";
                }

                currentPassword.value = "";
                newPassword.value = "";
                confirmPassword.value = "";

                showMessage(
                    "Password update request completed.",
                    "success"
                );
            }
        );
    }

    // ------------------------------------------------------------
    // LOGOUT
    // ------------------------------------------------------------

    function logout() {
        /*
         * Profile data remains saved so it can appear again
         * when the user returns to the application.
         */

        window.location.href = "login.html";
    }

    if (logoutBtn) {
        logoutBtn.addEventListener(
            "click",
            logout
        );
    }

    if (accountLogoutBtn) {
        accountLogoutBtn.addEventListener(
            "click",
            logout
        );
    }

    // ------------------------------------------------------------
    // DELETE ACCOUNT
    // ------------------------------------------------------------

    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener(
            "click",
            () => {
                const confirmed =
                    window.confirm(
                        "Delete the CrimeNet administrator profile from this browser?\n\nThis action cannot be undone."
                    );

                if (!confirmed) return;

                localStorage.removeItem(
                    STORAGE_KEY
                );

                /*
                 * Keep application data intact.
                 * Only the administrator profile is removed.
                 */

                window.location.href =
                    "login.html";
            }
        );
    }

    // ------------------------------------------------------------
    // SYSTEM THEME LISTENER
    // ------------------------------------------------------------

    if (
        window.matchMedia
    ) {
        const mediaQuery =
            window.matchMedia(
                "(prefers-color-scheme: light)"
            );

        const handleSystemTheme = () => {
            if (profile.theme === "system") {
                applyTheme("system");
            }
        };

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener(
                "change",
                handleSystemTheme
            );
        } else if (mediaQuery.addListener) {
            mediaQuery.addListener(
                handleSystemTheme
            );
        }
    }

    // ------------------------------------------------------------
    // CROSS-TAB PROFILE SYNC
    // ------------------------------------------------------------

    window.addEventListener(
        "storage",
        (event) => {
            if (
                event.key !== STORAGE_KEY
            ) {
                return;
            }

            if (!event.newValue) {
                profile = {
                    ...defaultProfile
                };
            } else {
                try {
                    profile = {
                        ...defaultProfile,
                        ...JSON.parse(
                            event.newValue
                        )
                    };
                } catch (error) {
                    console.error(
                        "Profile sync failed:",
                        error
                    );
                }
            }

            updateProfileUI(profile);
        }
    );

    // ------------------------------------------------------------
    // INITIALIZE
    // ------------------------------------------------------------

    updateProfileUI(profile);

    console.log(
        "CRIMENET Profile initialized:",
        profile
    );
});