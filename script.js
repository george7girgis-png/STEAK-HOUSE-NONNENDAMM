// The journey through the charcoal fire: one pinned stage, five video chapters.
// Scrolling (GSAP ScrollTrigger, scrubbed) drives the camera moves, smoke transitions and text;
// the videos loop on their own, so fire and smoke keep moving whenever the visitor stops.
// Scenes are built by build-videos.sh into assets/scenes/<name>(-m).mp4 with a .jpg poster.

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const small = window.innerWidth < 900;
const journey = document.getElementById("journey");
const stage = document.getElementById("stage");
const nav = document.getElementById("nav");
const chapterEls = [...stage.querySelectorAll(".chapter")];
const chapter = Object.fromEntries(chapterEls.map((el) => [el.dataset.chapter, el]));
const sceneOf = (name) => chapter[name].querySelector(".scene");
const smoke = stage.querySelector(".smoke");

// Phones get the 960px encodes.
for (const v of document.querySelectorAll("video[data-src]")) v.src = `${v.dataset.src}${small ? "-m" : ""}.mp4`;

const play = (v) => { if (v.paused) v.play().catch(() => {}); };

window.addEventListener("scroll", () => nav.classList.toggle("scrolled", window.scrollY > 40), { passive: true });

// Wine and atmosphere slides: the picture settles in when the slide arrives, and its video only plays while visible.
const slideObserver = new IntersectionObserver((entries) => {
  for (const e of entries) {
    const v = e.target.querySelector(".slide-media");
    if (e.isIntersecting) e.target.classList.add("in");
    if (reduceMotion) continue;
    if (e.isIntersecting) { v.preload = "auto"; play(v); } else v.pause();
  }
}, { threshold: 0.2 });
document.querySelectorAll(".slide").forEach((s) => slideObserver.observe(s));

if (reduceMotion || !window.gsap || !window.ScrollTrigger) {
  // Static, readable scenes: chapters stack as normal sections. With reduced motion the posters stay still.
  document.documentElement.classList.add("rm");
  if (!reduceMotion) {
    const vio = new IntersectionObserver((entries) => {
      for (const e of entries) e.isIntersecting ? play(e.target) : e.target.pause();
    }, { threshold: 0.2 });
    stage.querySelectorAll(".scene").forEach((v) => vio.observe(v));
  }
} else {
  initJourney();
}

function initJourney() {
  gsap.registerPlugin(ScrollTrigger);
  const embers = startEmbers(document.getElementById("embers"));

  // --- Opening (about 2 s): the fire rises up from below and the camera settles out of a close-up
  // while a puff of smoke clears, then the logo and the lines follow ---
  const heroScene = sceneOf("hero");
  const lines = chapter.hero.querySelectorAll(".intro-line");
  play(heroScene);
  play(smoke);
  const intro = gsap.timeline({ defaults: { ease: "power2.out" } })
    .from(embers, { alpha: 0, duration: 0.8 }, 0)
    .fromTo(smoke, { opacity: 0 }, { opacity: 0.5, duration: 0.5 }, 0)
    .to(smoke, { opacity: 0, duration: 1.2, ease: "power1.inOut" }, 0.6)
    .fromTo(heroScene,
      { opacity: 0, scale: 1.35, yPercent: 10, clipPath: "inset(100% 0% 0% 0%)", filter: "brightness(0.3) blur(8px)" },
      { opacity: 1, scale: 1, yPercent: 0, clipPath: "inset(0% 0% 0% 0%)", filter: "brightness(1) blur(0px)",
        duration: 1.6, ease: "power3.out", clearProps: "clipPath,filter" }, 0.05)
    .from(".hero-logo", { opacity: 0, y: -16, scale: 0.85, filter: "blur(8px)", duration: 0.8, clearProps: "filter" }, 0.35)
    .from(lines, { opacity: 0, y: 18, duration: 0.6, stagger: 0.12 }, 0.75);

  // --- Scroll choreography ---
  // Each chapter: arrival (transition), viewing interval (hold, a snap point), departure.
  const T = 1, H = 0.8;   // transition and hold lengths, in timeline units
  const tl = gsap.timeline({ defaults: { ease: "none" } });
  const order = ["hero", "huefte", "spiess", "holzfaeller", "final"];
  chapterEls.forEach((el) => el !== chapter.hero && gsap.set(el, { autoAlpha: 0 }));

  // Camera moves per transition: how the outgoing shot leaves and the incoming one arrives.
  const moves = {
    huefte:      { out: { scale: 1.55, yPercent: 6 },  in: { scale: 1.3 },               smoke: 0.68 },  // push into the hero steak
    spiess:      { out: { xPercent: -18, scale: 1.08 }, in: { xPercent: 18, scale: 1.08 }, smoke: 0.56 }, // sideways through smoke and embers
    holzfaeller: { out: { yPercent: -14 },             in: { yPercent: 14 },             smoke: 0.6 },   // downward through smoke
    final:       { out: { scale: 0.82 },               in: { scale: 1.28 },              smoke: 0.45 },  // pull back into the dining room
  };

  let t = H * 0.75;
  tl.addLabel("hero", 0);
  for (let i = 1; i < order.length; i++) {
    const from = order[i - 1], to = order[i], m = moves[to];
    const fromCopy = chapter[from].querySelector(".chapter-copy");
    const toCopyParts = chapter[to].querySelectorAll(".chapter-copy > *");

    tl.to(fromCopy, { autoAlpha: 0, y: -30, duration: 0.35 }, t);
    if (from === "hero") tl.to(chapter.hero.querySelector(".scroll-cue"), { autoAlpha: 0, duration: 0.2 }, t);
    tl.to(sceneOf(from), { ...m.out, duration: T, ease: "power1.in" }, t);
    tl.fromTo(smoke, { opacity: 0, xPercent: i % 2 ? -6 : 6 }, { opacity: m.smoke, xPercent: 0, duration: T * 0.5, ease: "sine.in" }, t)
      .to(smoke, { opacity: 0, xPercent: i % 2 ? 6 : -6, duration: T * 0.5, ease: "sine.out" }, t + T * 0.5);
    tl.to(embers, { boost: 2.5, duration: T * 0.5, yoyo: true, repeat: 1 }, t);
    tl.to(chapter[to], { autoAlpha: 1, duration: 0.3 }, t + 0.35);
    tl.to(chapter[from], { autoAlpha: 0, duration: 0.3 }, t + 0.55);
    tl.fromTo(sceneOf(to), m.in, { scale: 1, xPercent: 0, yPercent: 0, duration: T * 0.65, ease: "power2.out" }, t + 0.35);
    tl.fromTo(toCopyParts, { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.06, ease: "power2.out" }, t + T * 0.7);

    t += T;
    tl.addLabel(to, t + H / 2);
    // Viewing interval: the camera keeps creeping closer while the visitor reads.
    tl.to(sceneOf(to), { scale: to === "final" ? 1 : 1.05, duration: H, ease: "none" }, t);
    t += H;
  }

  const labelTimes = order.map((n) => tl.labels[n]);
  let current = -1;
  let navTarget = null;   // scroll position the menu link is gliding to
  const proxy = { y: 0 };

  const st = ScrollTrigger.create({
    trigger: journey,
    start: "top top",
    end: () => `+=${window.innerHeight * 5.5}`,
    pin: stage,
    scrub: 0.8,
    animation: tl,
    invalidateOnRefresh: true,
    // Settle on a chapter: stay on one the visitor is already at, otherwise move on in the scroll direction.
    snap: {
      snapTo(value, self) {
        if (navTarget !== null) return (navTarget - self.start) / (self.end - self.start);   // the menu link is scrolling there
        const stops = labelTimes.map((lt) => lt / tl.duration());
        const near = stops.find((p) => Math.abs(p - value) < 0.008);
        if (near !== undefined) return near;
        const dir = Math.sign(self.getVelocity()) || self.direction;
        return dir > 0 ? stops.find((p) => p > value) ?? 1 : [...stops].reverse().find((p) => p < value) ?? 0;
      },
      duration: { min: 0.35, max: 1 }, delay: 0.15, ease: "power1.inOut",
    },
    onUpdate(self) {
      if (self.progress > 0.01 && intro.progress() < 1) intro.progress(1);   // visitor is already scrolling
      const time = tl.time();
      let k = 0;
      labelTimes.forEach((lt, i) => { if (time >= lt - (T + H) / 2) k = i; });
      if (k !== current) setChapter(k);
      syncVideos();
    },
  });

  function setChapter(k) {
    current = k;
    // Preload the next scene so it is ready before the smoke clears.
    const next = chapter[order[k + 1]];
    if (next) next.querySelector(".scene").preload = "auto";
  }

  // Only visible scenes play; everything else rests to save battery.
  function syncVideos() {
    for (const el of chapterEls) {
      const v = el.querySelector(".scene");
      gsap.getProperty(el, "autoAlpha") > 0.01 ? play(v) : v.pause();
    }
    gsap.getProperty(smoke, "opacity") > 0.01 || intro.isActive() ? play(smoke) : smoke.pause();
  }

  // The "Angebot" link jumps to a chapter's viewing interval.
  const scrollToChapter = (name) => {
    const top = st.start + (st.end - st.start) * (tl.labels[name] / tl.duration());
    navTarget = Math.round(top);
    gsap.killTweensOf(proxy);
    proxy.y = window.scrollY;
    const chapters = Math.abs(navTarget - proxy.y) / ((st.end - st.start) * (T + H) / tl.duration());
    gsap.to(proxy, {
      y: navTarget, duration: Math.min(3, 0.9 + chapters * 0.6), ease: "power2.inOut",
      onUpdate: () => window.scrollTo({ top: proxy.y, behavior: "instant" }),
      onComplete: () => (navTarget = null),
    });
  };
  document.querySelectorAll("[data-chapter-link]").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    scrollToChapter(a.dataset.chapterLink);
  }));

  // Pause the fire when the journey is off screen.
  new IntersectionObserver(([e]) => {
    embers.running = e.isIntersecting;
    if (!e.isIntersecting) stage.querySelectorAll("video").forEach((v) => v.pause());
    else syncVideos();
  }).observe(stage);

  setChapter(0);
  // Warm up all scenes once the opening has played.
  intro.eventCallback("onComplete", () => {
    syncVideos();
    setTimeout(() => stage.querySelectorAll(".scene").forEach((v) => (v.preload = "auto")), 1500);
  });
}

// Glowing embers drifting up through the whole journey. Returns a small state object GSAP can tween.
function startEmbers(canvas) {
  const ctx = canvas.getContext("2d");
  const state = { alpha: 1, boost: 1, running: true };
  const count = small ? 34 : 70;
  let w = 0, h = 0, dpr = 1;
  const parts = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = canvas.clientWidth * dpr;
    h = canvas.height = canvas.clientHeight * dpr;
  }
  function spawn(p, anywhere) {
    p.x = Math.random() * w;
    p.y = anywhere ? Math.random() * h : h + Math.random() * 40 * dpr;
    p.vy = -(0.25 + Math.random() * 0.9) * dpr;
    p.vx = (Math.random() - 0.5) * 0.3 * dpr;
    p.r = (0.6 + Math.random() * 1.8) * dpr;
    p.phase = Math.random() * Math.PI * 2;
    p.heat = Math.random();
    return p;
  }
  resize();
  for (let i = 0; i < count; i++) parts.push(spawn({}, true));
  window.addEventListener("resize", resize);

  (function frame(now) {
    requestAnimationFrame(frame);
    if (!state.running) return;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    for (const p of parts) {
      p.y += p.vy * state.boost;
      p.x += p.vx + Math.sin(now / 900 + p.phase) * 0.35 * dpr;
      if (p.y < -20 * dpr) spawn(p, false);
      const flicker = 0.55 + 0.45 * Math.sin(now / 160 + p.phase * 3);
      const fade = Math.min(1, p.y / (h * 0.35));            // embers die out towards the top
      const a = state.alpha * flicker * fade;
      if (a <= 0.01) continue;
      const g = 120 + Math.round(p.heat * 90);
      ctx.fillStyle = `rgba(255, ${g}, 60, ${a * 0.18})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255, ${g + 40}, 120, ${a})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
  })(performance.now());

  return state;
}

// Reservation form: same fields as the old site, checked in the browser.
const form = document.getElementById("res-form");
if (form) {
  const msg = document.getElementById("form-msg");
  const dateInput = form.elements.date;
  const timeSelect = form.elements.time;
  const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const today = toISO(new Date());
  // Same-day bookings are taken by phone only, so the earliest date is tomorrow.
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  dateInput.min = toISO(tomorrow);

  // Open Mo–So 12:00–24:00: offer tables every 30 min until 22:30.
  for (let m = 12 * 60; m <= 22 * 60 + 30; m += 30) {
    const t = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    timeSelect.add(new Option(`${t} Uhr`, t));
  }

  const rules = {
    name: (v) => v.trim().length >= 2 || "Bitte geben Sie Ihren Namen an.",
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Bitte geben Sie eine gültige E-Mail-Adresse an.",
    phone: (v) => /^[0-9 +()/-]{6,}$/.test(v.trim()) || "Bitte geben Sie eine Rückrufnummer an.",
    date: (v) => {
      if (!v) return "Bitte wählen Sie ein Datum.";
      if (v === today) return "Reservierungen für heute bitte telefonisch: (030) 382 50 23.";
      if (v < today) return "Das Datum liegt in der Vergangenheit.";
      return true;
    },
    time: (v) => !!v || "Bitte wählen Sie eine Uhrzeit.",
    guests: (v) => (+v >= 1 && +v <= 140) || "Bitte geben Sie die Anzahl der Personen an (1 bis 140).",
  };

  function check(name) {
    const el = form.elements[name];
    const field = el.closest(".field");
    const res = rules[name](el.value);
    field.querySelector(".err")?.remove();
    field.classList.toggle("invalid", res !== true);
    if (res !== true) {
      const e = document.createElement("span");
      e.className = "err";
      e.textContent = res;
      field.append(e);
    }
    return res === true;
  }

  for (const name of Object.keys(rules)) {
    form.elements[name].addEventListener("blur", () => check(name));
    form.elements[name].addEventListener("change", () => check(name));
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.className = "form-msg";
    msg.textContent = "";
    const ok = Object.keys(rules).map(check).every(Boolean);
    if (!ok) {
      form.querySelector(".invalid input, .invalid select")?.focus();
      return;
    }

    const d = Object.fromEntries(new FormData(form));
    const dateDE = d.date.split("-").reverse().join(".");
    const endpoint = form.dataset.endpoint;

    if (!endpoint) {
      // No form service configured yet: open the guest's email app with the request filled in.
      const body = [
        `Name: ${d.name}`, `E-Mail: ${d.email}`, `Rückrufnummer: ${d.phone}`,
        `Datum: ${dateDE}`, `Uhrzeit: ${d.time} Uhr`, `Anzahl Personen: ${d.guests}`,
        d.note ? `Anmerkung: ${d.note}` : "",
      ].filter(Boolean).join("\n");
      location.href = `mailto:info@steakhaus-nonnendamm.de?subject=${encodeURIComponent(`Reservierungsanfrage ${dateDE}, ${d.time} Uhr, ${d.guests} Pers.`)}&body=${encodeURIComponent(body)}`;
      msg.classList.add("ok");
      msg.textContent = "Ihr E-Mail-Programm öffnet sich mit Ihrer Anfrage. Bitte dort auf Senden tippen.";
      return;
    }

    // Formspree: readable labels become the email body, _subject the email subject,
    // _replyto lets the restaurant answer the guest with one click.
    const payload = {
      _subject: `Reservierungsanfrage ${dateDE}, ${d.time} Uhr, ${d.guests} Pers., ${d.name}`,
      _replyto: d.email,
      _gotcha: d._gotcha,
      Name: d.name,
      "E-Mail": d.email,
      "Rückrufnummer": d.phone,
      Datum: dateDE,
      Uhrzeit: `${d.time} Uhr`,
      "Anzahl Personen": d.guests,
      Anmerkung: d.note || "keine",
    };

    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Wird gesendet …";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      msg.classList.add("ok");
      msg.textContent = `Vielen Dank! Ihre Anfrage für den ${dateDE} ist bei uns eingegangen. Wir bestätigen Ihre Reservierung so schnell wie möglich.`;
    } catch {
      msg.classList.add("bad");
      msg.textContent = "Das hat leider nicht geklappt. Bitte rufen Sie uns an: (030) 382 50 23.";
    } finally {
      btn.disabled = false;
      btn.textContent = "Absenden";
    }
  });
}

// Fade-up reveal for content sections.
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}, { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
