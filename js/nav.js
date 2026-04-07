import { auth, onAuthStateChanged } from "./firebase.js";
import { signUp, signIn, logOut } from "./auth.js";

function saveUserToStorage(user) {
    // localStorage: persist auth state across page loads
    localStorage.setItem("bmg_user", JSON.stringify({
        displayName: user.displayName || "",
        email: user.email || ""
    }));
}

function clearUserFromStorage() {
    localStorage.removeItem("bmg_user");
}

function getUserFromStorage() {
    const raw = localStorage.getItem("bmg_user");
    return raw ? JSON.parse(raw) : null;
}

function getEl(id) { return document.getElementById(id); }

function toggleAuthModal(show) {
    const authModal = getEl("authModal");
    if (!authModal) return;
    authModal.style.display = show ? "block" : "none";
    if (!show) {
        const u = getEl("authUsername"), e = getEl("authEmail"),
              p = getEl("authPassword"), err = getEl("authError");
        if (u) u.value = "";
        if (e) e.value = "";
        if (p) p.value = "";
        if (err) err.textContent = "";
    }
}

function applyLoggedInUI(displayName, email) {
    const label = displayName || email;

    const btn = getEl("authButton");
    const name = getEl("userDisplayName");
    if (btn) btn.textContent = "Logout";
    if (name) { name.textContent = label; name.style.display = "inline"; }

    const mBtn = getEl("authButton-mobile");
    const mName = getEl("userDisplayName-mobile");
    if (mBtn) mBtn.textContent = "Logout";
    if (mName) { mName.textContent = label; mName.style.display = "inline"; }

    toggleAuthModal(false);
}

function applyLoggedOutUI() {
    const btn = getEl("authButton");
    const name = getEl("userDisplayName");
    if (btn) btn.textContent = "Login";
    if (name) { name.textContent = ""; name.style.display = "none"; }

    const mBtn = getEl("authButton-mobile");
    const mName = getEl("userDisplayName-mobile");
    if (mBtn) mBtn.textContent = "Login";
    if (mName) { mName.textContent = ""; mName.style.display = "none"; }
}

function setupNavHandlers() {
    const toggle = document.querySelector(".menu-toggle");
    const menu = document.querySelector(".nav-items-wrapper");
    if (toggle && menu && !toggle.dataset.bound) {
        const btn = toggle.querySelector("button");
        toggle.addEventListener("click", () => {
            const isOpen = menu.classList.toggle("active");
            if (btn) btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
        });
        toggle.dataset.bound = "true";
    }

    const authButton = getEl("authButton");
    if (authButton && !authButton.dataset.bound) {
        authButton.addEventListener("click", async () => {
            if (authButton.textContent === "Logout") {
                try {
                    await logOut();
                    clearUserFromStorage(); 
                } catch (e) {
                    console.error("Logout error:", e);
                }
            } else {
                toggleAuthModal(true);
            }
        });
        authButton.dataset.bound = "true";
    }

    const mobileAuthBtn = getEl("authButton-mobile");
    if (mobileAuthBtn && !mobileAuthBtn.dataset.bound) {
        mobileAuthBtn.addEventListener("click", async () => {
            if (mobileAuthBtn.textContent === "Logout") {
                try {
                    await logOut();
                    clearUserFromStorage(); 
                } catch (e) {
                    console.error("Logout error:", e);
                }
            } else {
                toggleAuthModal(true);
            }
        });
        mobileAuthBtn.dataset.bound = "true";
    }

    const authModal = getEl("authModal");
    if (authModal) {
        const closeBtn = authModal.querySelector(".closeButton");
        if (closeBtn && !closeBtn.dataset.bound) {
            closeBtn.addEventListener("click", () => toggleAuthModal(false));
            closeBtn.dataset.bound = "true";
        }
    }

    const signInButton = getEl("signInButton");
    if (signInButton && !signInButton.dataset.bound) {
        signInButton.addEventListener("click", async () => {
            const email = getEl("authEmail")?.value;
            const password = getEl("authPassword")?.value;
            const errEl = getEl("authError");
            if (!email || !password) {
                if (errEl) errEl.textContent = "Please enter both email and password.";
                return;
            }
            try {
                await signIn(email, password);
            } catch (e) {
                console.error("Sign in error:", e);
                if (errEl) errEl.textContent = e.message;
            }
        });
        signInButton.dataset.bound = "true";
    }

    const signUpButton = getEl("signUpButton");
    if (signUpButton && !signUpButton.dataset.bound) {
        signUpButton.addEventListener("click", async () => {
            const username = getEl("authUsername")?.value.trim() || "";
            const email = getEl("authEmail")?.value;
            const password = getEl("authPassword")?.value;
            const errEl = getEl("authError");
            if (!email || !password) {
                if (errEl) errEl.textContent = "Please enter both email and password.";
                return;
            }
            try {
                await signUp(email, password, username);
            } catch (e) {
                console.error("Sign up error:", e);
                if (errEl) errEl.textContent = e.message;
            }
        });
        signUpButton.dataset.bound = "true";
    }
}

const storedUser = getUserFromStorage(); 
if (storedUser) {
    applyLoggedInUI(storedUser.displayName, storedUser.email);
}

let navInitialized = false;

function initAfterNavLoaded() {
    if (navInitialized) return;
    if (!document.querySelector(".nav-list")) return;

    setupNavHandlers();
    const u = getUserFromStorage(); 
    if (u) applyLoggedInUI(u.displayName, u.email);
    else applyLoggedOutUI();
    navInitialized = true;
}

document.addEventListener("navLoaded", initAfterNavLoaded);
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(initAfterNavLoaded, 50);
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        saveUserToStorage(user);
        applyLoggedInUI(user.displayName, user.email);
    } else {
        clearUserFromStorage(); 
        applyLoggedOutUI();
    }
});
