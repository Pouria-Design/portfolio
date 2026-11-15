/* ---------------------------------------------------------------------------
   حسن خسروجردی — پورتفولیو
   اصول موشن: ease-out برای ورود، زیر ۳۰۰ms برای UI، فقط transform/opacity
--------------------------------------------------------------------------- */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ------------------------------------------------------------------
     ۰) fallback برای تصاویر خراب یا مسیر اشتباه
  ------------------------------------------------------------------ */
  document.querySelectorAll("img[src]").forEach(function (img) {
    img.addEventListener("error", function onError() {
      img.removeEventListener("error", onError);
      img.classList.add("img-fallback");
      img.removeAttribute("src");
    }, { once: true });
  });

  /* ------------------------------------------------------------------
     ۱) تغییر تم روشن/تاریک
  ------------------------------------------------------------------ */
  var root = document.documentElement;
  var toggle = document.getElementById("theme-toggle");
  var iconSun = document.getElementById("icon-sun");
  var iconMoon = document.getElementById("icon-moon");

  function syncThemeIcon() {
    var isDark = root.classList.contains("dark");
    iconSun.classList.toggle("hidden", isDark);
    iconMoon.classList.toggle("hidden", !isDark);
    toggle.setAttribute("aria-pressed", String(isDark));
  }

  toggle.addEventListener("click", function () {
    root.classList.add("theme-transition");
    requestAnimationFrame(function () {
      var isDark = root.classList.toggle("dark");
      localStorage.setItem("theme", isDark ? "dark" : "light");
      syncThemeIcon();
      window.setTimeout(function () { root.classList.remove("theme-transition"); }, 380);
    });
  });
  syncThemeIcon();

  /* ------------------------------------------------------------------
     ۲) سایه‌ی هدر هنگام اسکرول
  ------------------------------------------------------------------ */
  var header = document.getElementById("site-header");
  var lastState = false;

  function onScrollHeader() {
    var scrolled = window.scrollY > 24;
    if (scrolled === lastState) return;
    lastState = scrolled;
    header.classList.toggle("backdrop-blur-xl", scrolled);
    header.classList.toggle("bg-coal-50/80", scrolled);
    header.classList.toggle("dark:bg-coal-950/70", scrolled);
    header.classList.toggle("border-b", scrolled);
    header.classList.toggle("border-coal-200/60", scrolled);
    header.classList.toggle("dark:border-white/[0.06]", scrolled);
  }
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  /* ------------------------------------------------------------------
     ۳) ریویل اسکرول با استگر (۳۰–۸۰ms بین آیتم‌ها)
  ------------------------------------------------------------------ */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));

  function isInViewport(el) {
    var rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
  }

  function showReveal(el) {
    el.classList.add("reveal", "is-visible");
  }

  // گروه‌بندی آیتم‌های هم‌سطح برای تاخیر پلکانی
  var groups = new Map();
  var toObserve = [];

  revealEls.forEach(function (el) {
    var key = el.parentElement;
    if (!groups.has(key)) groups.set(key, 0);
    var index = groups.get(key);
    el.style.setProperty("--reveal-delay", Math.min(index * 70, 350) + "ms");
    groups.set(key, index + 1);

    if (prefersReducedMotion || isInViewport(el)) {
      showReveal(el);
    } else {
      el.classList.add("reveal");
      toObserve.push(el);
    }
  });

  if ("IntersectionObserver" in window && toObserve.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -24px 0px" }
    );
    toObserve.forEach(function (el) { io.observe(el); });
  } else {
    toObserve.forEach(showReveal);
  }

  /* ------------------------------------------------------------------
     ۴) اسپات‌لایت دنبال‌کننده‌ی موس روی کارت‌ها
  ------------------------------------------------------------------ */
  if (canHover && !prefersReducedMotion) {
    document.querySelectorAll(".spotlight").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", e.clientX - rect.left + "px");
        card.style.setProperty("--my", e.clientY - rect.top + "px");
      });
    });
  }

  /* ------------------------------------------------------------------
     ۵) دکمه‌های مغناطیسی — با lerp نرم (حس فنری)
  ------------------------------------------------------------------ */
  if (canHover && !prefersReducedMotion) {
    document.querySelectorAll(".magnetic").forEach(function (el) {
      var raf = null;
      var targetX = 0, targetY = 0, curX = 0, curY = 0;

      function tick() {
        curX += (targetX - curX) * 0.18;
        curY += (targetY - curY) * 0.18;
        el.style.transform = "translate(" + curX.toFixed(2) + "px," + curY.toFixed(2) + "px)";
        if (Math.abs(targetX - curX) > 0.1 || Math.abs(targetY - curY) > 0.1) {
          raf = requestAnimationFrame(tick);
        } else {
          raf = null;
        }
      }

      el.addEventListener("pointermove", function (e) {
        var rect = el.getBoundingClientRect();
        targetX = (e.clientX - rect.left - rect.width / 2) * 0.22;
        targetY = (e.clientY - rect.top - rect.height / 2) * 0.28;
        if (!raf) raf = requestAnimationFrame(tick);
      });

      el.addEventListener("pointerleave", function () {
        targetX = 0;
        targetY = 0;
        if (!raf) raf = requestAnimationFrame(tick);
      });
    });
  }

  /* ------------------------------------------------------------------
     ۶) شمارش اعداد با ارقام فارسی — ease-out
  ------------------------------------------------------------------ */
  var FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

  function toFa(num) {
    if (document.documentElement.lang === "en") return String(num);
    return String(num).replace(/\d/g, function (d) { return FA_DIGITS[+d]; });
  }

  function countUp(el) {
    var end = parseInt(el.getAttribute("data-count"), 10);
    if (prefersReducedMotion) { el.textContent = toFa(end); return; }

    var duration = 1400;
    var start = null;

    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      // easeOutExpo
      var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.textContent = toFa(Math.round(eased * end));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            countUp(entry.target);
            cio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(countUp);
  }

  /* ------------------------------------------------------------------
     ۷) ساعت زنده‌ی تهران
  ------------------------------------------------------------------ */
  var clockEl = document.getElementById("tehran-clock");
  var fmt = new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tehran"
  });

  function tickClock() {
    clockEl.textContent = fmt.format(new Date());
  }
  tickClock();
  setInterval(tickClock, 15000);

  /* ------------------------------------------------------------------
     ۸) کپی ایمیل با فیدبک
  ------------------------------------------------------------------ */
  var copyBtn = document.getElementById("copy-email");
  var copyLabel = document.getElementById("copy-email-label");
  var resetTimer = null;

  copyBtn.addEventListener("click", function () {
    var email = copyBtn.getAttribute("data-email");

    function done() {
      copyLabel.textContent = document.documentElement.lang === "en" ? "Copied!" : "کپی شد!";
      copyBtn.classList.add("!border-ember-500/50", "!text-ember-500");
      clearTimeout(resetTimer);
      resetTimer = setTimeout(function () {
        copyLabel.textContent = document.documentElement.lang === "en" ? "Copy Email" : "کپی ایمیل";
        copyBtn.classList.remove("!border-ember-500/50", "!text-ember-500");
      }, 2000);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(done).catch(done);
    } else {
      var tmp = document.createElement("textarea");
      tmp.value = email;
      document.body.appendChild(tmp);
      tmp.select();
      try { document.execCommand("copy"); } catch (e) { /* noop */ }
      document.body.removeChild(tmp);
      done();
    }
  });

  /* ------------------------------------------------------------------
     ۹) بازگشت به بالا
  ------------------------------------------------------------------ */
  document.getElementById("back-to-top").addEventListener("click", function () {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth"
    });
  });

  /* ------------------------------------------------------------------
     ۱۰) منوی موبایل
  ------------------------------------------------------------------ */
  var menuToggle = document.getElementById("menu-toggle");
  var mobileMenu = document.getElementById("mobile-menu");
  var iconMenu = document.getElementById("icon-menu");
  var iconClose = document.getElementById("icon-close");

  function setMenu(open) {
    mobileMenu.classList.toggle("open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "بستن منو" : "باز کردن منو");
    iconMenu.classList.toggle("hidden", open);
    iconClose.classList.toggle("hidden", !open);
  }

  menuToggle.addEventListener("click", function () {
    setMenu(!mobileMenu.classList.contains("open"));
  });

  // بستن منو با کلیک روی لینک یا کلید Escape
  mobileMenu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () { setMenu(false); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && mobileMenu.classList.contains("open")) setMenu(false);
  });

  /* ------------------------------------------------------------------
     ۱۱) نوار پیشرفت اسکرول
  ------------------------------------------------------------------ */
  var progress = document.getElementById("scroll-progress");
  var progressRaf = null;

  function updateProgress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var ratio = max > 0 ? window.scrollY / max : 0;
    progress.style.transform = "scaleX(" + ratio + ")";
    progressRaf = null;
  }
  window.addEventListener("scroll", function () {
    if (!progressRaf) progressRaf = requestAnimationFrame(updateProgress);
  }, { passive: true });
  updateProgress();

  /* ------------------------------------------------------------------
     ۱۲) هایلایت لینک ناوبریِ بخش فعال
  ------------------------------------------------------------------ */
  var navLinks = document.querySelectorAll("[data-nav]");
  var sections = Array.prototype.slice.call(navLinks)
    .map(function (link) { return document.getElementById(link.getAttribute("data-nav")); })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var navIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navLinks.forEach(function (link) {
            link.classList.toggle("is-active", link.getAttribute("data-nav") === entry.target.id);
          });
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach(function (sec) { navIo.observe(sec); });
  }

  /* ------------------------------------------------------------------
     ۱۳) آکاردئون سوالات متداول — فقط یک مورد باز
  ------------------------------------------------------------------ */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var trigger = item.querySelector(".faq-trigger");
    trigger.addEventListener("click", function () {
      var isOpen = item.getAttribute("data-open") === "true";

      // بستن بقیه
      document.querySelectorAll('.faq-item[data-open="true"]').forEach(function (other) {
        other.setAttribute("data-open", "false");
        other.querySelector(".faq-trigger").setAttribute("aria-expanded", "false");
      });

      item.setAttribute("data-open", String(!isOpen));
      trigger.setAttribute("aria-expanded", String(!isOpen));
    });
  });
})();
