/* ===================================================================
   Is Your Data That Important? — script.js
   Legal and Ethical Issues module project

   This one file runs on every page. It handles:
   - the cookie consent banner and "manage preferences" modal
   - saving/reading the user's choice with localStorage
   - a small simulated analytics counter and a simulated ad box,
     so the cookie choices actually change something on the page
   - the mobile navigation menu
   - the "What did you actually agree to?" page
   =================================================================== */

const STORAGE_KEY = "dataProjectCookiePrefs";
const VIEWS_KEY = "dataProjectSimulatedViews";

/* ---------------- Reading and writing the saved choice ---------------- */

function getPrefs() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    // Saved value got corrupted somehow - treat it as "no choice yet".
    return null;
  }
}

function savePrefs(analytics, advertising) {
  const prefs = {
    necessary: true, // necessary cookies are never optional
    analytics: Boolean(analytics),
    advertising: Boolean(advertising),
    savedAt: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  return prefs;
}

function clearPrefs() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(VIEWS_KEY);
}

/* ---------------- Simulated analytics counter ----------------
   Stands in for what a real analytics cookie would quietly do.
   It only counts a "page view" when analytics cookies are switched on,
   so switching analytics off in the modal actually stops the counting. */

function logSimulatedView(prefs) {
  const current = Number(localStorage.getItem(VIEWS_KEY) || 0);
  if (!prefs || !prefs.analytics) {
    return current;
  }
  const updated = current + 1;
  localStorage.setItem(VIEWS_KEY, String(updated));
  return updated;
}

/* ---------------- Cookie banner ---------------- */

function showBanner() {
  const banner = document.getElementById("cookieBanner");
  if (banner) {
    banner.hidden = false;
  }
}

function hideBanner() {
  const banner = document.getElementById("cookieBanner");
  if (banner) {
    banner.hidden = true;
  }
}

/* ---------------- Preferences modal ---------------- */

function openModal(prefs) {
  const overlay = document.getElementById("prefsModalOverlay");
  if (!overlay) {
    return;
  }
  const analyticsBox = document.getElementById("analyticsCheckbox");
  const advertisingBox = document.getElementById("advertisingCheckbox");

  // Pre-fill the modal with the existing choice, if there is one.
  if (analyticsBox) {
    analyticsBox.checked = prefs ? prefs.analytics : false;
  }
  if (advertisingBox) {
    advertisingBox.checked = prefs ? prefs.advertising : false;
  }
  overlay.hidden = false;
}

function closeModal() {
  const overlay = document.getElementById("prefsModalOverlay");
  if (overlay) {
    overlay.hidden = true;
  }
}

/* ---------------- Cookie status strip (shown on every page) ---------------- */

function renderCookieStatus(prefs) {
  const el = document.getElementById("cookieStatus");
  if (!el) {
    return;
  }

  if (!prefs) {
    el.style.display = "none";
    el.innerHTML = "";
    return;
  }

  const viewCount = logSimulatedView(prefs);
  const viewLabel = viewCount === 1 ? "view" : "views";
  const analyticsText = prefs.analytics
    ? "Analytics \u2705 (" + viewCount + " simulated page " + viewLabel + " logged)"
    : "Analytics \u274C (nothing logged)";
  const advertisingText = prefs.advertising ? "Advertising \u2705" : "Advertising \u274C";

  el.style.display = "flex";
  el.innerHTML =
    "<span>Necessary \u2705</span>" +
    "<span>" + analyticsText + "</span>" +
    "<span>" + advertisingText + "</span>" +
    '<button id="changePrefsBtn" class="link-button" type="button">Change settings</button>';

  const changeBtn = document.getElementById("changePrefsBtn");
  if (changeBtn) {
    changeBtn.addEventListener("click", function () {
      openModal(getPrefs());
    });
  }
}

/* ---------------- Simulated ad box (index.html, cookies.html, choices.html) ---------------- */

function renderAdBox(prefs) {
  const box = document.getElementById("adBox");
  if (!box) {
    return;
  }

  if (prefs && prefs.advertising) {
    box.classList.add("ad-active");
    box.innerHTML =
      '<p class="ad-label">Simulated targeted ad</p>' +
      "<p>\u201CStill thinking about those headphones? Free delivery today only.\u201D</p>" +
      '<p class="ad-note">Shown because advertising cookies are switched on in your ' +
      "preferences. This is a mock advert for the assignment - no real ad network is " +
      "connected to this site.</p>";
  } else {
    box.classList.remove("ad-active");
    box.innerHTML =
      '<p class="ad-label">No targeted ad shown</p>' +
      '<p class="ad-note">Advertising cookies are off in your preferences, so this space ' +
      "is not personalised to you.</p>";
  }
}

/* ---------------- Illustrative data-scale counter (index.html) ----------------
   This is NOT a live measurement of this site or of any visitor. It is a
   published, real figure spread out over time so an abstract statistic feels
   more concrete. The Irish Council for Civil Liberties (ICCL) estimated in a
   2022 report that "real-time bidding" online advertising broadcasts personal
   data about 178 trillion times a year across the US and Europe combined -
   see the Law & Sources page for the original report. That works out to
   roughly 5.6 million broadcasts every second. This counter simply multiplies
   that published rate by the time spent on this page. */

const RTB_BROADCASTS_PER_YEAR = 178000000000000;
const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
const RTB_BROADCASTS_PER_SECOND = RTB_BROADCASTS_PER_YEAR / SECONDS_PER_YEAR;

function startDataCounter() {
  const el = document.getElementById("dataCounter");
  if (!el) {
    return; // this page has no counter, nothing to do
  }

  const startTime = Date.now();
  const reducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const updateEveryMs = reducedMotion ? 1000 : 100;

  function update() {
    const secondsElapsed = (Date.now() - startTime) / 1000;
    const estimate = Math.floor(secondsElapsed * RTB_BROADCASTS_PER_SECOND);
    el.textContent = estimate.toLocaleString("en-IE");
  }

  update();
  setInterval(update, updateEveryMs);
}

/* ---------------- "What did you actually agree to?" page ---------------- */

function choiceRowHtml(label, accepted) {
  const statusClass = accepted ? "yes" : "no";
  const statusText = accepted ? "Accepted \u2713" : "Rejected \u2717";
  return (
    '<div class="choice-row"><span>' + label + "</span>" +
    '<span class="choice-status ' + statusClass + '">' + statusText + "</span></div>"
  );
}

function renderChoicesPage() {
  const summaryEl = document.getElementById("choicesSummary");
  if (!summaryEl) {
    return; // this page has no "your choices" summary, nothing to do
  }

  const prefs = getPrefs();

  if (!prefs) {
    summaryEl.innerHTML =
      "<p>It looks like you haven't made a cookie choice on this site yet. Visit the " +
      '<a href="index.html">home page</a> to see the banner, or set your preferences ' +
      "now.</p>" +
      '<button id="setPrefsNowBtn" class="btn btn-primary" type="button">' +
      "Set my cookie preferences</button>";
    const setBtn = document.getElementById("setPrefsNowBtn");
    if (setBtn) {
      setBtn.addEventListener("click", function () {
        openModal(null);
      });
    }
    return;
  }

  summaryEl.innerHTML =
    choiceRowHtml("Necessary", true) +
    choiceRowHtml("Analytics", prefs.analytics) +
    choiceRowHtml("Advertising / Tracking", prefs.advertising);
}

/* ---------------- Scroll reveal for card-like content blocks ----------------
   Progressive enhancement only: the .reveal class is added here, at runtime,
   never in the HTML itself, and CSS only hides .reveal elements when the
   <html> tag also carries .js-enabled (set by an inline script in <head>).
   So with JavaScript off, or on a very old browser, every block is simply
   visible immediately - nothing depends on this to be readable. */

function setupScrollReveal() {
  const targets = document.querySelectorAll(
    ".card, .dilemma, .question-box, .counter-card, .stat-block, .reference-list li, .reflect-item"
  );
  if (!targets.length) {
    return;
  }

  targets.forEach(function (el, index) {
    el.classList.add("reveal");
    el.style.transitionDelay = Math.min(index * 60, 240) + "ms";
  });

  if (!("IntersectionObserver" in window)) {
    // No observer support: show everything rather than risk it staying hidden.
    targets.forEach(function (el) {
      el.classList.add("is-visible");
    });
    return;
  }

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  targets.forEach(function (el) {
    observer.observe(el);
  });
}

/* ---------------- Sticky header state + reading-progress bar ---------------- */

function setupScrollChrome() {
  const header = document.querySelector(".site-header");
  const progressBar = document.getElementById("readingProgress");
  if (!header && !progressBar) {
    return;
  }

  function updateOnScroll() {
    if (header) {
      header.classList.toggle("scrolled", window.scrollY > 40);
    }
    if (progressBar) {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percent = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0;
      progressBar.style.width = percent + "%";
    }
  }

  updateOnScroll();
  window.addEventListener("scroll", updateOnScroll, { passive: true });
  window.addEventListener("resize", updateOnScroll);
}

/* ---------------- Bring everything up to date after any change ---------------- */

function refreshPageState() {
  const prefs = getPrefs();
  renderCookieStatus(prefs);
  renderAdBox(prefs);
  renderChoicesPage();
}

/* ---------------- Wire everything up once the page has loaded ---------------- */

document.addEventListener("DOMContentLoaded", function () {
  const prefs = getPrefs();

  // Only show the banner if the visitor hasn't chosen anything yet.
  if (!prefs) {
    showBanner();
  }

  renderCookieStatus(prefs);
  renderAdBox(prefs);
  renderChoicesPage();
  startDataCounter();
  setupScrollReveal();
  setupScrollChrome();

  // Mobile navigation menu toggle.
  const navToggle = document.getElementById("navToggle");
  const siteNav = document.getElementById("siteNav");
  if (navToggle && siteNav) {
    navToggle.addEventListener("click", function () {
      siteNav.classList.toggle("open");
    });
  }

  // Banner: Accept All.
  const acceptAllBtn = document.getElementById("acceptAllBtn");
  if (acceptAllBtn) {
    acceptAllBtn.addEventListener("click", function () {
      savePrefs(true, true);
      hideBanner();
      refreshPageState();
    });
  }

  // Banner: Necessary Only.
  const necessaryOnlyBtn = document.getElementById("necessaryOnlyBtn");
  if (necessaryOnlyBtn) {
    necessaryOnlyBtn.addEventListener("click", function () {
      savePrefs(false, false);
      hideBanner();
      refreshPageState();
    });
  }

  // Banner: Manage Preferences.
  const managePrefsBtn = document.getElementById("managePrefsBtn");
  if (managePrefsBtn) {
    managePrefsBtn.addEventListener("click", function () {
      openModal(getPrefs());
    });
  }

  // Modal: Save Preferences.
  const savePrefsBtn = document.getElementById("savePrefsBtn");
  if (savePrefsBtn) {
    savePrefsBtn.addEventListener("click", function () {
      const analyticsBox = document.getElementById("analyticsCheckbox");
      const advertisingBox = document.getElementById("advertisingCheckbox");
      savePrefs(analyticsBox.checked, advertisingBox.checked);
      closeModal();
      hideBanner();
      refreshPageState();
    });
  }

  // Modal: Cancel / close.
  const closeModalBtn = document.getElementById("closeModalBtn");
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModal);
  }

  // Clicking the dark overlay outside the modal box also closes it.
  const overlay = document.getElementById("prefsModalOverlay");
  if (overlay) {
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) {
        closeModal();
      }
    });
  }

  // Footer link present on every page, in case someone wants to
  // change their mind after their first visit.
  const cookieSettingsLink = document.getElementById("cookieSettingsLink");
  if (cookieSettingsLink) {
    cookieSettingsLink.addEventListener("click", function () {
      openModal(getPrefs());
    });
  }

  // Reflection question accordion on choices.html.
  const reflectButtons = document.querySelectorAll(".reflect-question");
  reflectButtons.forEach(function (button) {
    button.setAttribute("aria-expanded", "false");
    button.addEventListener("click", function () {
      const item = button.closest(".reflect-item");
      item.classList.toggle("open");
      button.setAttribute("aria-expanded", item.classList.contains("open") ? "true" : "false");
    });
  });

  // Reset button on choices.html.
  const resetBtn = document.getElementById("resetPrefsBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      const sure = window.confirm(
        "This will clear your saved cookie choice and reload the page. Continue?"
      );
      if (sure) {
        clearPrefs();
        window.location.reload();
      }
    });
  }
});
