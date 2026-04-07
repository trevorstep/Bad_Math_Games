async function includeHTML() {
    const elements = document.querySelectorAll("[data-include]");
    for (const el of elements) {
        const file = el.getAttribute("data-include");
        try {
            const response = await fetch(file);
            if (response.ok) {
                const html = await response.text();
                el.innerHTML = html;
                if (file.includes("nav.html")) {
                    initSiteSearch();
                    document.dispatchEvent(new Event("navLoaded"));
                }
            } else {
                el.innerHTML = `<p>Could not load ${file}</p>`;
            }
        } catch (e) {
            el.innerHTML = `<p>Error loading ${file}</p>`;
        }
    }
}

document.addEventListener("DOMContentLoaded", includeHTML);

function initSiteSearch() {
  const searchInput = document.getElementById("site-search");
  const searchButton = document.querySelector(".search-container button[type='submit']");
  const searchResults = document.getElementById("site-search-results");
  const gameLinks = Array.from(document.querySelectorAll("#games-dropdown-menu a[href*='Page2.html?game=']"));

  if (!searchInput || !searchButton || !searchResults || gameLinks.length === 0) {
    return;
  }

  if (searchInput.dataset.searchBound === "true") {
    return;
  }

  const normalize = (text) => text.trim().toLowerCase();
  const getGameKey = (href) => {
    const match = href.match(/[?&]game=([^&]+)/i);
    return match ? decodeURIComponent(match[1]) : "";
  };

  const games = gameLinks.map((link) => ({
    title: normalize(link.textContent || ""),
    label: (link.textContent || "").trim(),
    key: normalize(getGameKey(link.getAttribute("href") || "")),
    href: link.getAttribute("href") || "",
  }));

  const hideResults = () => {
    searchResults.classList.remove("visible");
    searchResults.innerHTML = "";
  };

  const showResults = (results) => {
    if (results.length === 0) {
      hideResults();
      return;
    }

    searchResults.innerHTML = results
      .map(
        (game) =>
          `<button type="button" class="search-result-item" data-href="${game.href}">${game.label}</button>`
      )
      .join("");
    searchResults.classList.add("visible");
  };

  const getMatches = (query) => {
    if (!query) {
      return [];
    }

    return games
      .filter((game) => game.title.includes(query) || game.key.includes(query))
      .slice(0, 6);
  };

  const runSearch = () => {
    const query = normalize(searchInput.value || "");
    if (!query) {
      hideResults();
      return;
    }

    const match = getMatches(query)[0];
    if (match) {
      window.location.href = match.href;
      return;
    }

    hideResults();
  };

  searchInput.addEventListener("input", () => {
    const query = normalize(searchInput.value || "");
    showResults(getMatches(query));
  });

  searchButton.addEventListener("click", runSearch);
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      runSearch();
    }
  });

  searchResults.addEventListener("click", (event) => {
    const target = event.target.closest(".search-result-item");
    if (!target) {
      return;
    }

    const href = target.getAttribute("data-href");
    if (href) {
      window.location.href = href;
    }
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".search-container")) {
      hideResults();
    }
  });

  searchInput.addEventListener("focus", () => {
    const query = normalize(searchInput.value || "");
    showResults(getMatches(query));
  });

  searchInput.dataset.searchBound = "true";
}
