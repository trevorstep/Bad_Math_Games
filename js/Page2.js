import { auth, onAuthStateChanged } from "./firebase.js"; // Import both from your local firebase.js
import { signUp, signIn, logOut } from "./auth.js";
 
// Get references to UI elements (these will be in nav.html, which is included)
  const authButton = document.getElementById("authButton");
  const userDisplayName = document.getElementById("userDisplayName");
  const authModal = document.getElementById("authModal");
  const closeButton = authModal ? authModal.querySelector(".closeButton") : null;
  const authUsernameInput = document.getElementById("authUsername");
  const authEmailInput = document.getElementById("authEmail");
  const authPasswordInput = document.getElementById("authPassword");
  const signInButton = document.getElementById("signInButton");
  const signUpButton = document.getElementById("signUpButton");
  const authErrorDisplay = document.getElementById("authError");
  // Function to show/hide the auth modal
  function toggleAuthModal(show) {
    if (authModal) {
      authModal.style.display = show ? "block" : "none";
      if (!show) {
        // Clear inputs and errors when closing
        if (authUsernameInput) authUsernameInput.value = "";
        if (authEmailInput) authEmailInput.value = "";
        if (authPasswordInput) authPasswordInput.value = "";
        if (authErrorDisplay) authErrorDisplay.textContent = "";
      }
    }
  } 
  // Event listener for the main auth button (Login/Logout)
  if (authButton) {
    authButton.addEventListener("click", async () => {
      if (authButton.textContent === "Logout") {
        try {
          await logOut();
          console.log("User logged out successfully.");
        } catch (error) {
          console.error("Error logging out:", error);
          if (authErrorDisplay) authErrorDisplay.textContent = error.message;
        }
      } else {
        // If button says "Login", open the modal
        toggleAuthModal(true);
      }
    });
  } 

  // Event listeners for modal buttons
  if (closeButton) {
    closeButton.addEventListener("click", () => toggleAuthModal(false));
  }

  if (signInButton) {
    signInButton.addEventListener("click", async () => {
      const email = authEmailInput.value;
      const password = authPasswordInput.value;
      if (!email || !password) {
        if (authErrorDisplay) authErrorDisplay.textContent = "Please enter both email and password.";
        return;
      }
      try {
        await signIn(email, password);
        console.log("User signed in successfully.");
        toggleAuthModal(false); // Close modal on successful sign-in
      } catch (error) {
        console.error("Error signing in:", error);
        if (authErrorDisplay) authErrorDisplay.textContent = error.message;
      }
    });
  } 

  if (signUpButton) {
    signUpButton.addEventListener("click", async () => {
      const username = authUsernameInput ? authUsernameInput.value.trim() : "";
      const email = authEmailInput.value;
      const password = authPasswordInput.value;
      if (!email || !password) {
        if (authErrorDisplay) authErrorDisplay.textContent = "Please enter both email and password.";
        return;
      }
      try {
        await signUp(email, password, username);
        console.log("User signed up successfully.");
        if (userDisplayName) {
          userDisplayName.textContent = username || email;
        }
        toggleAuthModal(false); // Close modal on successful sign-up
      } catch (error) {
        console.error("Error signing up:", error);
        if (authErrorDisplay) authErrorDisplay.textContent = error.message;
      }
    });
  } 

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User logged in:", user.email);
    if (authButton) authButton.textContent = "Logout";
    if (userDisplayName) {
      userDisplayName.textContent = user.displayName || user.email;
      userDisplayName.style.display = "inline";
    }
    toggleAuthModal(false); // Ensure modal is closed if user logs in from another tab/session
  } else {
    console.log("User logged out");
    if (authButton) authButton.textContent = "Login";
    if (userDisplayName) {
      userDisplayName.textContent = "";
      userDisplayName.style.display = "none";
    }
  }
});

const gameThumbnails = {
  bCalc: "images/Basic calculator icon.png",
  pong: "images/POONG.png",
  goose: "images/Goose Life game thum.png",
  ss: "images/Salt Salt thumbnail.png",
  walk: "images/Walk game thumbnail.png",
  BnG: "images/Water Boy and Fire G.png",
};

const params = new URLSearchParams(window.location.search);
const currentGameKey = params.get("game");

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function renderSuggestedGames() {
  const container = document.querySelector(".suggested-games-grid");
  if (!container) {
    return;
  }

  const heading = container.querySelector("h2");

  const response = await fetch("assets/games.json");
  const gameData = await response.json();

  const entries = Object.entries(gameData)
    .filter(([key]) => key !== currentGameKey)
    .map(([key, data]) => ({ key, ...data }));

  const picks = shuffle(entries).slice(0, 3);

  container.innerHTML = "";
  if (heading) {
    container.appendChild(heading);
  } else {
    const title = document.createElement("h2");
    title.textContent = "More Games";
    container.appendChild(title);
  }

  picks.forEach((game) => {
    const card = document.createElement("a");
    card.href = `Page2.html?game=${encodeURIComponent(game.key)}`;
    card.className = "suggested-game-item suggested-game-link";

    const img = document.createElement("img");
    img.src = gameThumbnails[game.key] || "images/bad_math_games.png";
    img.alt = game.title;

    const label = document.createElement("p");
    label.textContent = game.title;

    card.appendChild(img);
    card.appendChild(label);
    container.appendChild(card);
  });
}

renderSuggestedGames().catch((error) => {
  console.error("Failed to render suggested games:", error);
});
