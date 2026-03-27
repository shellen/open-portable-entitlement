// ABOUTME: Client-side interactivity for the spec docs page.
// ABOUTME: Handles sidebar expand/collapse, scroll-spy, mobile drawer, and anchor copy.

(function () {
  // Sidebar expand/collapse
  const navLinks = document.querySelectorAll(".nav-link[data-section]");
  navLinks.forEach(function (link) {
    const children = link.parentElement.querySelector(".nav-children");
    if (!children) return;
    link.addEventListener("click", function (e) {
      // Don't prevent default — still navigate to anchor
      const chevron = link.querySelector(".nav-chevron");
      const isOpen = !children.classList.contains("hidden");
      if (isOpen) {
        children.classList.add("hidden");
        if (chevron) chevron.style.transform = "";
      } else {
        children.classList.remove("hidden");
        if (chevron) chevron.style.transform = "rotate(90deg)";
      }
    });
  });

  // Scroll spy
  const headings = document.querySelectorAll(
    "article h2[id], article h3[id]"
  );
  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          setActiveNav(entry.target.id);
        }
      });
    },
    { rootMargin: "-80px 0px -70% 0px" }
  );
  headings.forEach(function (h) {
    observer.observe(h);
  });

  function setActiveNav(id) {
    // Remove all active states
    document.querySelectorAll(".nav-link").forEach(function (link) {
      link.classList.remove(
        "text-emerald-500",
        "font-semibold"
      );
    });
    // Set active
    var active = document.querySelector('.nav-link[data-section="' + id + '"]');
    if (!active) return;
    active.classList.add(
      "text-emerald-500",
      "font-semibold"
    );
    // Expand parent if it's a child link
    var parentUl = active.closest(".nav-children");
    if (parentUl) {
      parentUl.classList.remove("hidden");
      var chevron = parentUl.parentElement.querySelector(".nav-chevron");
      if (chevron) chevron.style.transform = "rotate(90deg)";
    }
    // Scroll sidebar to keep active visible
    active.scrollIntoView({ block: "nearest" });
  }

  // Mobile drawer
  var sidebar = document.getElementById("sidebar");
  var overlay = document.getElementById("sidebar-overlay");
  var toggle = document.getElementById("sidebar-toggle");

  if (toggle && sidebar && overlay) {
    toggle.addEventListener("click", function () {
      var isOpen = !sidebar.classList.contains("hidden") && window.innerWidth < 1024;
      if (sidebar.classList.contains("hidden") || window.innerWidth >= 1024) {
        sidebar.classList.remove("hidden");
        overlay.classList.remove("hidden");
      } else {
        sidebar.classList.add("hidden");
        overlay.classList.add("hidden");
      }
    });
    overlay.addEventListener("click", function () {
      sidebar.classList.add("hidden");
      overlay.classList.add("hidden");
    });
    // Close drawer on nav link click (mobile)
    sidebar.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.innerWidth < 1024) {
          sidebar.classList.add("hidden");
          overlay.classList.add("hidden");
        }
      });
    });
  }

  // Anchor link copy
  document.querySelectorAll(".anchor-link").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      var url = window.location.origin + window.location.pathname + link.getAttribute("href");
      navigator.clipboard.writeText(url).then(function () {
        link.textContent = "✓";
        setTimeout(function () {
          link.textContent = "#";
        }, 1500);
      });
    });
  });
})();
