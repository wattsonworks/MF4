/* MICHAL FITNESS — ATELIER redesign · interactions */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion:reduce)").matches;
  var nav = document.querySelector(".nav");
  var hero = document.querySelector(".hero");

  /* ---- nav state: over-hero / solid / hide-on-scroll ---- */
  var lastY = 0;
  function heroBottom() { return hero ? hero.offsetHeight - 90 : 200; }
  function onScroll() {
    var y = window.scrollY;
    if (nav) {
      var overHero = y < heroBottom();
      nav.classList.toggle("nav--onhero", overHero);
      nav.classList.toggle("solid", !overHero);
      // hide when scrolling down past hero, show on scroll up
      if (!document.body.classList.contains("menu-open")) {
        nav.classList.toggle("hide", y > heroBottom() + 60 && y > lastY);
      }
    }
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- full-screen menu ---- */
  var burger = document.querySelector(".burger");
  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) nav.classList.remove("hide");
  }
  if (burger) burger.addEventListener("click", function () {
    setMenu(!document.body.classList.contains("menu-open"));
  });
  document.querySelectorAll(".menu a, .menu__list a").forEach(function (a) {
    a.addEventListener("click", function () { setMenu(false); });
  });

  /* ---- scroll reveal ---- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.14 });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  /* ---- class hover preview (desktop pointer) ---- */
  var fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
  var list = document.querySelector(".cl-list");
  var preview = document.querySelector(".cl-preview");
  if (fine && list && preview) {
    var pimg = preview.querySelector("img");
    var tx = window.innerWidth / 2, ty = window.innerHeight / 2, cx = tx, cy = ty, raf = null;
    function loop() {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      preview.style.left = cx + "px"; preview.style.top = cy + "px";
      preview.style.transform = "translate(-50%,-50%) scale(" + (preview.classList.contains("show") ? 1 : 0.85) + ")";
      raf = requestAnimationFrame(loop);
    }
    list.addEventListener("mousemove", function (e) { tx = e.clientX; ty = e.clientY; });
    list.addEventListener("mouseenter", function () { if (!raf) loop(); });
    list.querySelectorAll(".cl-row").forEach(function (row) {
      row.addEventListener("mouseenter", function () {
        var src = row.getAttribute("data-img");
        if (src) { pimg.src = src; preview.classList.add("show"); }
      });
    });
    list.addEventListener("mouseleave", function () {
      preview.classList.remove("show");
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    });
  }
  /* rows are anchors to #pricing/wa anyway; ensure tap works on mobile (no-op) */

  /* ---- count-up stats ---- */
  var counters = document.querySelectorAll("[data-count]");
  var cio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      var el = e.target, end = parseFloat(el.getAttribute("data-count")), t0 = null, dur = 1400;
      if (reduce) { el.textContent = end; return; }
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * eased);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });
  counters.forEach(function (c) { cio.observe(c); });

  /* ---- parallax (subtle) ---- */
  if (!reduce) {
    var pEras = [].map.call(document.querySelectorAll("[data-parallax]"), function (el) {
      return { el: el, speed: parseFloat(el.getAttribute("data-parallax")) || 0.12 };
    });
    var heroImg = document.querySelector(".hero__bg img,.hero__bg video");
    var pTick = false;
    function parallax() {
      pTick = false;
      var y = window.scrollY;
      if (heroImg && y < window.innerHeight) heroImg.style.transform = "scale(1.12) translateY(" + (y * 0.1) + "px)";
      pEras.forEach(function (p) {
        var r = p.el.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) {
          var off = (r.top + r.height / 2 - window.innerHeight / 2) * -p.speed;
          p.el.style.transform = "translateY(" + off + "px)";
        }
      });
    }
    window.addEventListener("scroll", function () { if (!pTick) { pTick = true; requestAnimationFrame(parallax); } }, { passive: true });
    parallax();
  }

  /* ---- hero video: muted autoplay + click-to-unmute (sound prompt) ---- */
  (function () {
    var v = document.getElementById("heroVid");
    if (!v) return;
    var btn = document.getElementById("heroSound");
    v.muted = true; v.loop = true; v.setAttribute("playsinline", "");
    function showBtn(s) { if (btn) btn.hidden = !s; }
    function unmute() { v.muted = false; showBtn(false); var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    var pp = v.play(); if (pp && pp.catch) pp.catch(function () {});
    showBtn(true); /* surface the 🔊 prompt — browsers block audio without a gesture */
    if (btn) btn.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); unmute(); });
    v.addEventListener("click", function () { if (v.muted) unmute(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { var q = v.play(); if (q && q.catch) q.catch(function () {}); } else { v.pause(); } });
      }, { threshold: 0.15 }).observe(v);
    }
  })();

  /* ---- lightbox ---- */
  var lb = document.querySelector(".lb"), lbImg = lb ? lb.querySelector("img") : null;
  function closeLb() { if (lb) lb.classList.remove("open"); }
  document.querySelectorAll("[data-lb]").forEach(function (el) {
    el.addEventListener("click", function (ev) {
      ev.preventDefault();
      if (lb) { lbImg.src = el.getAttribute("href") || el.getAttribute("data-lb"); lb.classList.add("open"); }
    });
  });
  if (lb) lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lb__x")) closeLb(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeLb(); setMenu(false); } });

  /* ---- footer year ---- */
  var yr = document.getElementById("yr"); if (yr) yr.textContent = new Date().getFullYear();
})();
