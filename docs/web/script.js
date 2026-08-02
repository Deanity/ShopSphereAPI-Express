/**
 * ShopSphere API Documentation - Interactive Script
 */

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initCopyButtons();
  initScrollSpy();
  initSearch();
  initMobileMenu();
});

/* 1. Tab Switching System */
function initTabs() {
  document.addEventListener("click", (e) => {
    const tabBtn = e.target.closest(".tab-btn");
    if (!tabBtn) return;

    const card = tabBtn.closest(".endpoint-card");
    if (!card) return;

    const targetTab = tabBtn.dataset.tab;
    const tabBtns = card.querySelectorAll(".tab-btn");
    const tabPanels = card.querySelectorAll(".tab-panel");

    tabBtns.forEach((btn) => btn.classList.remove("is-active"));
    tabPanels.forEach((panel) => panel.classList.remove("is-active"));

    tabBtn.classList.add("is-active");
    const activePanel = card.querySelector(".tab-panel[data-panel=\"" + targetTab + "\"]");
    if (activePanel) {
      activePanel.classList.add("is-active");
    }
  });
}

/* 2. Copy Code to Clipboard */
function initCopyButtons() {
  document.addEventListener("click", (e) => {
    const copyBtn = e.target.closest(".copy-btn");
    if (!copyBtn) return;

    const codeBlock = copyBtn.closest(".code-block");
    if (!codeBlock) return;

    const pre = codeBlock.querySelector("pre");
    if (!pre) return;

    const textToCopy = pre.textContent.trim();

    navigator.clipboard.writeText(textToCopy).then(() => {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = "COPIED!";
      copyBtn.style.backgroundColor = "var(--color-primary)";
      copyBtn.style.color = "#FFF";

      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.backgroundColor = "";
        copyBtn.style.color = "";
      }, 1500);
    }).catch(err => {
      console.error("Failed to copy code: ", err);
    });
  });
}

/* 3. Scroll-Spy Sidebar Indicator */
function initScrollSpy() {
  const cards = document.querySelectorAll(".endpoint-card");
  const sidebarLinks = document.querySelectorAll(".endpoint-row");

  if (!cards.length || !sidebarLinks.length) return;

  const observerOptions = {
    root: null,
    rootMargin: "-10% 0px -70% 0px",
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        sidebarLinks.forEach((link) => {
          if (link.getAttribute("href") === "#" + id) {
            link.classList.add("is-active");
            link.scrollIntoView({ block: "nearest", behavior: "smooth" });
          } else {
            link.classList.remove("is-active");
          }
        });
      }
    });
  }, observerOptions);

  cards.forEach((card) => observer.observe(card));
}

/* 4. Real-time Search / Filter */
function initSearch() {
  const searchInput = document.getElementById("search-input");
  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    const cards = document.querySelectorAll(".endpoint-card");
    const sidebarRows = document.querySelectorAll(".endpoint-row");
    const groupTitles = document.querySelectorAll(".group-title");
    const groupLabels = document.querySelectorAll(".group-label");

    if (!query) {
      cards.forEach((c) => (c.style.display = ""));
      sidebarRows.forEach((r) => (r.style.display = ""));
      groupTitles.forEach((t) => (t.style.display = ""));
      groupLabels.forEach((l) => (l.style.display = ""));
      return;
    }

    // Filter Cards
    cards.forEach((card) => {
      const text = card.textContent.toLowerCase();
      if (text.includes(query)) {
        card.style.display = "";
      } else {
        card.style.display = "none";
      }
    });

    // Filter Sidebar Links
    sidebarRows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      if (text.includes(query)) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  });
}

/* 5. Mobile Menu Drawer Toggle */
function initMobileMenu() {
  const menuToggle = document.getElementById("menu-toggle");
  const sidebar = document.querySelector(".sidebar");

  if (!menuToggle || !sidebar) return;

  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("is-open");
  });

  sidebar.addEventListener("click", (e) => {
    if (e.target.closest(".endpoint-row")) {
      sidebar.classList.remove("is-open");
    }
  });
}
