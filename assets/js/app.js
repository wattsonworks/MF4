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
    a.addEventListener("click", function (e) {
      var href = a.getAttribute("href");
      setMenu(false); /* re-enables scroll + starts the curtain lift */
      if (href && href.charAt(0) === "#" && href.length > 1) {
        var target = document.getElementById(href.slice(1));
        if (target) {
          e.preventDefault();
          /* jump instantly while the menu still covers the screen, so the
             curtain reveals the DESTINATION, not the previous section */
          var htmlEl = document.documentElement, prev = htmlEl.style.scrollBehavior;
          htmlEl.style.scrollBehavior = "auto";
          target.scrollIntoView();          /* honors section scroll-margin-top */
          htmlEl.style.scrollBehavior = prev;
        }
      }
    });
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

  /* ---- parallax (subtle, desktop only — avoids mobile scroll jank) ---- */
  if (fine && !reduce) {
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

  /* ---- preloader dismiss (CSS auto-lifts too; this is the failsafe) ---- */
  window.addEventListener("load", function () { document.body.classList.add("loaded"); });
  setTimeout(function () { document.body.classList.add("loaded"); }, 2800);

  /* ---- scroll progress bar ---- */
  (function () {
    var bar = document.getElementById("progress");
    if (!bar) return;
    function upd() {
      var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? h.scrollTop / max : 0) + ")";
    }
    window.addEventListener("scroll", upd, { passive: true });
    window.addEventListener("resize", upd); upd();
  })();

  /* ---- hero color-wash fade on scroll ---- */
  (function () {
    var wash = document.getElementById("heroWash");
    if (!wash) return;
    function f() { wash.style.opacity = Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.8)); }
    window.addEventListener("scroll", f, { passive: true }); f();
  })();

  /* ---- gallery drag-to-scroll ---- */
  (function () {
    var g = document.querySelector(".gal");
    if (!g) return;
    var down = false, sx = 0, sl = 0;
    g.addEventListener("mousedown", function (e) { down = true; g.classList.add("drag"); sx = e.pageX; sl = g.scrollLeft; });
    window.addEventListener("mouseup", function () { down = false; g.classList.remove("drag"); });
    g.addEventListener("mouseleave", function () { down = false; g.classList.remove("drag"); });
    g.addEventListener("mousemove", function (e) { if (!down) return; e.preventDefault(); g.scrollLeft = sl - (e.pageX - sx) * 1.4; });
  })();

  /* ---- custom cursor + magnetic buttons + hero tilt (desktop, fine pointer, motion-ok) ---- */
  if (fine && !reduce) {
    var cur = document.getElementById("cursor");
    if (cur) {
      var cgx = window.innerWidth / 2, cgy = window.innerHeight / 2, cdx = cgx, cdy = cgy;
      (function cloop() { cdx += (cgx - cdx) * 0.2; cdy += (cgy - cdy) * 0.2; cur.style.left = cdx + "px"; cur.style.top = cdy + "px"; requestAnimationFrame(cloop); })();
      window.addEventListener("mousemove", function (e) { cgx = e.clientX; cgy = e.clientY; cur.classList.add("on"); });
      document.addEventListener("mouseleave", function () { cur.classList.remove("on"); });
      document.querySelectorAll("a,button,.cl-row,.gal a").forEach(function (el) {
        el.addEventListener("mouseenter", function () { cur.classList.add("grow"); });
        el.addEventListener("mouseleave", function () { cur.classList.remove("grow"); });
      });
    }
    document.querySelectorAll(".btn,.nav__cta").forEach(function (b) {
      b.addEventListener("mousemove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = "translate(" + (e.clientX - r.left - r.width / 2) * 0.25 + "px," + (e.clientY - r.top - r.height / 2) * 0.3 + "px)";
      });
      b.addEventListener("mouseleave", function () { b.style.transform = ""; });
    });
    var heroEl = document.querySelector(".hero"), heroBg = document.querySelector(".hero__bg");
    if (heroEl && heroBg) {
      heroEl.addEventListener("mousemove", function (e) {
        var r = heroEl.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        heroBg.style.transform = "scale(1.06) translate(" + (px * -14) + "px," + (py * -14) + "px)";
      });
      heroEl.addEventListener("mouseleave", function () { heroBg.style.transform = ""; });
    }
  }

  /* ---- preloader: tap or scroll to skip ---- */
  (function () {
    function skip() { document.body.classList.add("loaded"); }
    var pl = document.getElementById("preloader");
    if (pl) pl.addEventListener("click", skip);
    window.addEventListener("scroll", skip, { once: true, passive: true });
  })();

  /* ---- marquee reacts to scroll velocity (desktop only) ---- */
  if (fine && !reduce) {
    var mq = document.querySelector(".marquee");
    if (mq) {
      var mly = window.scrollY, mv = 0;
      (function mtick() {
        var y = window.scrollY; mv += ((y - mly) - mv) * 0.15; mly = y; mv *= 0.9;
        var sk = Math.max(-5, Math.min(5, mv * 0.3));
        mq.style.transform = "skewX(" + sk.toFixed(2) + "deg)";
        requestAnimationFrame(mtick);
      })();
    }
  }

  /* ---- contextual cursor labels ---- */
  if (fine && !reduce) {
    var curEl = document.getElementById("cursor");
    if (curEl) {
      var lbl = document.createElement("span"); lbl.className = "cursor__label"; curEl.appendChild(lbl);
      document.addEventListener("mouseover", function (e) {
        var t = e.target.closest ? e.target.closest(".cl-row,.gal") : null;
        if (t && t.classList.contains("cl-row")) { curEl.classList.add("labeled"); lbl.textContent = "צפי ↗"; }
        else if (t) { curEl.classList.add("labeled"); lbl.textContent = "גררי"; }
        else { curEl.classList.remove("labeled"); }
      });
    }
  }

  /* ---- R2: split-flap odometer on price tiers (own observer, runs once) ---- */
  (function () {
    var prices = document.querySelectorAll(".ladder .tier__price");
    if (!prices.length || !("IntersectionObserver" in window)) return;
    function buildDigit(finalNum, delay) {
      var wrap = document.createElement("span"); wrap.className = "od-digit";
      var strip = document.createElement("span"); strip.className = "od-strip";
      var seq = [], k;
      for (k = 0; k <= 9; k++) seq.push(k);
      for (k = 0; k <= 9; k++) seq.push(k);
      seq.push(finalNum);
      seq.forEach(function (n) { var c = document.createElement("span"); c.className = "od-cell"; c.textContent = n; strip.appendChild(c); });
      wrap.appendChild(strip);
      var landIndex = seq.length - 1;
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        strip.style.transitionDelay = delay + "ms";
        strip.style.transform = "translateY(-" + landIndex + "em)";
      }); });
      strip.addEventListener("transitionend", function () { strip.style.willChange = "auto"; }, { once: true });
      return wrap;
    }
    function rollEl(el) {
      if (el.getAttribute("data-rolled")) return;
      el.setAttribute("data-rolled", "1");
      if (reduce) return;
      var small = el.querySelector("small");
      var raw = (el.firstChild && el.firstChild.nodeValue ? el.firstChild.nodeValue : el.textContent).replace(/[^0-9]/g, "");
      if (!raw) return;
      el.classList.add("roll");
      if (el.firstChild && el.firstChild.nodeType === 3) el.removeChild(el.firstChild);
      var frag = document.createDocumentFragment();
      raw.split("").forEach(function (ch, i) { frag.appendChild(buildDigit(parseInt(ch, 10), 70 * i)); });
      if (small) el.insertBefore(frag, small); else el.appendChild(frag);
    }
    var oio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (!e.isIntersecting) return; oio.unobserve(e.target); rollEl(e.target); });
    }, { threshold: 0.45 });
    [].forEach.call(prices, function (el) { oio.observe(el); });
  })();

  /* ---- R2: reviews auto-marquee (desktop only; pauses on hover/touch/focus) ---- */
  (function () {
    var row = document.querySelector(".rev-row");
    if (!row || reduce || !fine) return;
    if (row.children.length < 2) return;
    var originals = [].slice.call(row.children);
    originals.forEach(function (c) { var k = c.cloneNode(true); k.classList.add("rev-clone"); k.setAttribute("aria-hidden", "true"); row.appendChild(k); });
    var half = 0;
    function measure() { half = row.scrollWidth / 2; }
    measure();
    window.addEventListener("resize", measure);
    if (row.scrollWidth <= row.clientWidth + 4) return;
    var paused = false, userTouching = false, speed = 0.4;
    function step() {
      if (!paused && !userTouching && document.visibilityState !== "hidden") {
        row.scrollLeft += speed;
        if (row.scrollLeft >= half) row.scrollLeft -= half;
        else if (row.scrollLeft <= 0) row.scrollLeft += half;
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    row.addEventListener("mouseenter", function () { paused = true; });
    row.addEventListener("mouseleave", function () { paused = false; });
    row.addEventListener("focusin", function () { paused = true; });
    row.addEventListener("focusout", function () { paused = false; });
    row.addEventListener("touchstart", function () { userTouching = true; }, { passive: true });
    row.addEventListener("touchend", function () { setTimeout(function () { userTouching = false; }, 2500); }, { passive: true });
    var resume; row.addEventListener("wheel", function () { userTouching = true; clearTimeout(resume); resume = setTimeout(function () { userTouching = false; }, 2000); }, { passive: true });
  })();

  /* ---- R2: WhatsApp FAB scroll-progress ring ---- */
  (function () {
    var wa = document.querySelector(".wa");
    if (!wa) return;
    var tick = false;
    function upd() {
      tick = false;
      var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? h.scrollTop / max : 0;
      wa.style.setProperty("--wa-prog", p.toFixed(4));
    }
    window.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    window.addEventListener("resize", upd, { passive: true });
    upd();
  })();

  /* ---- R2: magnetic CTA badge (desktop, motion-ok) ---- */
  if (fine && !reduce) {
    var badgeEl = document.querySelector(".badge");
    if (badgeEl) {
      badgeEl.addEventListener("mousemove", function (e) {
        var r = badgeEl.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) * 0.18;
        var dy = (e.clientY - r.top - r.height / 2) * 0.2;
        badgeEl.classList.add("pull");
        badgeEl.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px)";
      });
      badgeEl.addEventListener("mouseleave", function () { badgeEl.classList.remove("pull"); badgeEl.style.transform = ""; });
      var curB = document.getElementById("cursor");
      if (curB) {
        badgeEl.addEventListener("mouseenter", function () { curB.classList.add("grow"); });
        badgeEl.addEventListener("mouseleave", function () { curB.classList.remove("grow"); });
      }
    }
  }

  /* ---- off-screen edge tabs: pop in from the edge, tug to pull ---- */
  (function () {
    var tabs = [].slice.call(document.querySelectorAll(".etab"));
    if (!tabs.length) return;
    tabs.forEach(function (t, i) {
      setTimeout(function () { t.classList.add("shown"); }, (reduce ? 0 : 2200) + i * 130);
    });
    tabs.forEach(function (t) {
      var sx = 0, drag = false, moved = 0, pid = null;
      t.addEventListener("pointerdown", function (e) {
        drag = true; moved = 0; pid = e.pointerId;
        try { t.setPointerCapture(pid); } catch (_) {}
        t.classList.add("grab"); sx = e.clientX;
      });
      t.addEventListener("pointermove", function (e) {
        if (!drag) return;
        var d = e.clientX - sx;
        moved = Math.max(moved, Math.abs(d));
        t.style.transform = "translateX(" + Math.max(-130, Math.min(12, d)) + "px)";
      });
      function rel() {
        if (!drag) return;
        drag = false; t.classList.remove("grab");
        try { t.releasePointerCapture(pid); } catch (_) {}
        t.style.transform = ""; /* springs back to resting translateX(0) */
      }
      t.addEventListener("pointerup", rel);
      t.addEventListener("pointercancel", rel);
      t.addEventListener("click", function (e) { if (moved > 8) e.preventDefault(); });
    });
  })();

  /* ---- footer year ---- */
  var yr = document.getElementById("yr"); if (yr) yr.textContent = new Date().getFullYear();
})();
