// ABOUTME: Client-side interactivity for the spec docs page.
// ABOUTME: Handles sidebar expand/collapse, scroll-spy, mobile drawer, and anchor copy.

(function () {
  // Sidebar expand/collapse with aria-expanded
  const navLinks = document.querySelectorAll(".nav-link[data-section]");
  navLinks.forEach(function (link) {
    const children = link.parentElement.querySelector(".nav-children");
    if (!children) return;
    link.addEventListener("click", function (e) {
      // Don't prevent default — still navigate to anchor
      const chevron = link.querySelector(".nav-chevron");
      const treeItem = link.parentElement;
      const isOpen = !children.classList.contains("hidden");
      if (isOpen) {
        children.classList.add("hidden");
        if (chevron) chevron.style.transform = "";
        if (treeItem) treeItem.setAttribute("aria-expanded", "false");
      } else {
        children.classList.remove("hidden");
        if (chevron) chevron.style.transform = "rotate(90deg)";
        if (treeItem) treeItem.setAttribute("aria-expanded", "true");
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
      link.setAttribute("aria-current", "false");
    });
    // Set active
    var active = document.querySelector('.nav-link[data-section="' + id + '"]');
    if (!active) return;
    active.classList.add(
      "text-emerald-500",
      "font-semibold"
    );
    active.setAttribute("aria-current", "location");
    // Expand parent if it's a child link
    var parentUl = active.closest(".nav-children");
    if (parentUl) {
      parentUl.classList.remove("hidden");
      var chevron = parentUl.parentElement.querySelector(".nav-chevron");
      if (chevron) chevron.style.transform = "rotate(90deg)";
      var treeItem = parentUl.parentElement;
      if (treeItem) treeItem.setAttribute("aria-expanded", "true");
    }
    // Scroll sidebar to keep active visible
    active.scrollIntoView({ block: "nearest" });
  }

  // Mobile drawer with focus trap
  var sidebar = document.getElementById("sidebar");
  var overlay = document.getElementById("sidebar-overlay");
  var toggle = document.getElementById("sidebar-toggle");
  var focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function openDrawer() {
    sidebar.classList.remove("hidden");
    overlay.classList.remove("hidden");
    toggle.setAttribute("aria-expanded", "true");
    // Focus first link in sidebar
    var firstFocusable = sidebar.querySelector(focusableSelector);
    if (firstFocusable) firstFocusable.focus();
    // Trap focus within sidebar
    document.addEventListener("keydown", trapFocus);
  }

  function closeDrawer() {
    sidebar.classList.add("hidden");
    overlay.classList.add("hidden");
    toggle.setAttribute("aria-expanded", "false");
    toggle.focus();
    document.removeEventListener("keydown", trapFocus);
  }

  function trapFocus(e) {
    if (e.key === "Escape") {
      closeDrawer();
      return;
    }
    if (e.key !== "Tab") return;

    var focusable = sidebar.querySelectorAll(focusableSelector);
    if (focusable.length === 0) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  if (toggle && sidebar && overlay) {
    toggle.addEventListener("click", function () {
      var isHidden = sidebar.classList.contains("hidden");
      if (isHidden || window.innerWidth >= 1024) {
        if (window.innerWidth < 1024) {
          openDrawer();
        }
      } else {
        closeDrawer();
      }
    });
    overlay.addEventListener("click", function () {
      closeDrawer();
    });
    // Close drawer on nav link click (mobile)
    sidebar.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.innerWidth < 1024) {
          closeDrawer();
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
        link.textContent = "\u2713";
        setTimeout(function () {
          link.textContent = "#";
        }, 1500);
      });
    });
  });
})();
