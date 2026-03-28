// ABOUTME: Card deck (carousel) for the OPE landing page story walkthroughs.
// ABOUTME: Handles story tab switching, card flipping, dot navigation, and swipe gestures.

(function () {
  // Story tab switching with ARIA tablist support
  var tabs = document.querySelectorAll(".story-tab");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var storyId = tab.getAttribute("data-story");
      // Update tab styles and ARIA states
      tabs.forEach(function (t) {
        t.classList.remove("bg-emerald-500", "text-white");
        t.classList.add("text-zinc-500", "ring-1", "ring-inset", "ring-zinc-900/10");
        t.setAttribute("aria-selected", "false");
        t.setAttribute("tabindex", "-1");
      });
      tab.classList.add("bg-emerald-500", "text-white");
      tab.classList.remove("text-zinc-500", "ring-1", "ring-inset", "ring-zinc-900/10");
      tab.setAttribute("aria-selected", "true");
      tab.removeAttribute("tabindex");
      // Show/hide decks
      document.querySelectorAll(".story-deck").forEach(function (deck) {
        deck.classList.add("hidden");
      });
      var target = document.getElementById("story-" + storyId);
      if (target) target.classList.remove("hidden");
    });

    // Arrow key navigation between tabs (WCAG tab pattern)
    tab.addEventListener("keydown", function (e) {
      var tabsArray = Array.prototype.slice.call(tabs);
      var index = tabsArray.indexOf(tab);
      var next;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        next = tabsArray[(index + 1) % tabsArray.length];
        next.click();
        next.focus();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        next = tabsArray[(index - 1 + tabsArray.length) % tabsArray.length];
        next.click();
        next.focus();
      }
    });
  });

  // Deck navigation for each story
  document.querySelectorAll(".story-deck").forEach(function (deck) {
    var track = deck.querySelector(".deck-track");
    var cards = deck.querySelectorAll(".deck-card");
    var dots = deck.querySelectorAll(".deck-dot");
    var prevBtn = deck.querySelector(".deck-prev");
    var nextBtn = deck.querySelector(".deck-next");
    var liveRegion = deck.querySelector(".deck-live");
    var current = 0;
    var total = cards.length;

    function goTo(index) {
      if (index < 0 || index >= total) return;
      current = index;
      track.style.transform = "translateX(-" + (current * 100) + "%)";
      // Update dots
      dots.forEach(function (dot, i) {
        dot.classList.toggle("bg-emerald-500", i === current);
        dot.classList.toggle("bg-zinc-300", i !== current);
        dot.setAttribute("aria-current", i === current ? "step" : "false");
      });
      // Update buttons
      prevBtn.disabled = current === 0;
      nextBtn.disabled = current === total - 1;
      // Announce to screen readers
      if (liveRegion) {
        var cardTitle = cards[current].querySelector("h3");
        liveRegion.textContent = "Slide " + (current + 1) + " of " + total + (cardTitle ? ": " + cardTitle.textContent : "");
      }
    }

    prevBtn.addEventListener("click", function () { goTo(current - 1); });
    nextBtn.addEventListener("click", function () { goTo(current + 1); });
    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        goTo(parseInt(dot.getAttribute("data-index"), 10));
      });
    });

    // Keyboard navigation when deck is in viewport
    document.addEventListener("keydown", function (e) {
      var rect = deck.getBoundingClientRect();
      var inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView || deck.classList.contains("hidden")) return;
      if (e.key === "ArrowLeft") goTo(current - 1);
      if (e.key === "ArrowRight") goTo(current + 1);
    });

    // Touch swipe support
    var touchStartX = 0;
    var touchEndX = 0;
    track.addEventListener("touchstart", function (e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    track.addEventListener("touchend", function (e) {
      touchEndX = e.changedTouches[0].screenX;
      var diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) goTo(current + 1);
        else goTo(current - 1);
      }
    }, { passive: true });
  });
})();
