/* =========================================================
   Happy Birthday Mom - script
   (sizes, lists and positions live in layout.js)
   ========================================================= */

/* ---------- SETTINGS ---------- */
const SONG_FADE = 1.5;         // seconds for each music crossfade
const ZOOM_SIZE = 0.55;        // zoomed photo height, as a fraction of the screen height
const RESTART_SPEED = 3;       // how fast the card rewinds when you hit restart
const LIGHT_GAP = 0.18;        // seconds between each candle lighting

const EXT = ".PNG";
const img = (name) => `images/${name}${EXT}`;
const EMOJI = { icon: "☕", flower: "🌸", person: "🧍", pet: "🐶", extra: "🖼️", confetti: "🎊" };
const rand = gsap.utils.random;


/* =========================================================
   1. SPREADING THINGS OUT EVENLY
   Each item tries a bunch of random spots and keeps the one with the
   most room around it, so everything ends up evenly spread and mixed.
   ========================================================= */
const ASPECT = innerWidth / innerHeight;

// same "random" layout every time you load, change SHUFFLE in layout.js to reshuffle
function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// items: [{ key, w }]   keepOut: { rects: [{x1,x2,y1,y2}] in %, circles: [{x,y (in %), rad (vh)}] }
function scatter(items, keepOut, seed) {
  const rng = makeRng(seed);
  const placed = [];
  const result = {};
  const dist = (ax, ay, bx, by) => Math.hypot((ax - bx) * ASPECT, ay - by); // in vh

  // shuffle so the different kinds get mixed together
  const order = items.slice();
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  // things you placed yourself in PLACE come first
  order.forEach((it) => {
    const p = PLACE[it.key];
    if (!p) return;
    result[it.key] = { x: p.x, y: p.y, w: p.w ?? it.w, r: p.r ?? 0 };
    placed.push(result[it.key]);
  });

  order.forEach((it) => {
    if (result[it.key]) return;
    const hx = it.w / 2 / ASPECT; // half size in % of width
    const hy = it.w / 2;          // half size in % of height
    let best = null;
    let bestRoom = -Infinity;

    for (let tries = 0; tries < 120; tries++) {
      const x = hx + 1 + rng() * (98 - 2 * hx);
      const y = hy + 1 + rng() * (98 - 2 * hy);

      const inRect = keepOut.rects.some((r) =>
        x + hx * 0.5 > r.x1 && x - hx * 0.5 < r.x2 && y + hy * 0.5 > r.y1 && y - hy * 0.5 < r.y2
      );
      if (inRect) continue;

      let room = Infinity;
      keepOut.circles.forEach((c) => { room = Math.min(room, dist(x, y, c.x, c.y) - c.rad - it.w * 0.35); });
      if (room < 0) continue;
      placed.forEach((p) => { room = Math.min(room, dist(x, y, p.x, p.y) - (p.w + it.w) / 2); });

      if (room > bestRoom) {
        bestRoom = room;
        best = { x, y };
      }
    }
    if (!best) best = { x: 5 + rng() * 90, y: 8 + rng() * 84 };

    result[it.key] = { x: best.x, y: best.y, w: it.w, r: Math.round(rng() * 30 - 15) };
    placed.push(result[it.key]);
  });

  return result;
}

function makeSpot(parent, { key, file, kind, pos, floats }) {
  const el = document.createElement("div");
  el.className = `spot kind-${kind}${floats ? " float" : ""}`;
  el.dataset.key = key;
  el.dataset.img = img(file);
  el.dataset.emoji = EMOJI[kind];
  el.style.setProperty("--x", pos.x + "%");
  el.style.setProperty("--y", pos.y + "%");
  el.style.setProperty("--w", pos.w + "vh");
  el.style.setProperty("--r", pos.r + "deg");
  parent.appendChild(el);
  return el;
}

const CORNERS = [
  { x1: 0, x2: 11, y1: 0, y2: 18 },    // restart button
  { x1: 89, x2: 100, y1: 0, y2: 18 }   // music button
];


/* =========================================================
   2. BUILD THE MAIN SCREEN FLOATERS (set spots from MAIN_SPOTS in layout.js)
   ========================================================= */
(function buildMain() {
  const box = document.querySelector(".main-floaters");

  MAIN_SPOTS.forEach((s, i) => {
    const kind = s.file.replace(/\d+$/, ""); // "icon3" -> "icon"
    makeSpot(box, {
      key: `${s.file} (main ${i + 1})`,
      file: s.file,
      kind,
      floats: true,
      pos: { x: s.x, y: s.y, w: s.w ?? SIZES[kind] ?? SIZES.icon, r: s.r ?? 0 }
    });
  });
})();


/* =========================================================
   3. BUILD THE ZOOMED-IN PANELS
   ========================================================= */
(function buildZoomPanels() {
  const holder = document.querySelector(".details");

  Object.entries(ZOOM).forEach(([n, group]) => {
    const panel = document.createElement("div");
    panel.className = "detail";
    panel.dataset.photo = n;
    holder.appendChild(panel);

    // the 3 extra photos go in fixed spots
    const extraSpots = (group.extra || []).map((num, i) => {
      const key = `z${n}-extra${num}`;
      const slot = EXTRA_SPOTS[i % EXTRA_SPOTS.length];
      const p = PLACE[key] || {};
      return { key, num, x: p.x ?? slot.x, y: p.y ?? slot.y, w: p.w ?? SIZES.extra, r: p.r ?? slot.r };
    });
    extraSpots.forEach((s) => {
      makeSpot(panel, { key: s.key, file: "extra" + s.num, kind: "extra", floats: false, pos: s });
    });

    // people + pets go in the cutout spots, alternating person, pet, person, pet...
    const people = (group.person || []).map((num) => ({ kind: "person", num }));
    const pets = (group.pet || []).map((num) => ({ kind: "pet", num }));
    const cutouts = [];
    while (people.length || pets.length) {
      if (people.length) cutouts.push(people.shift());
      if (pets.length) cutouts.push(pets.shift());
    }

    const taken = extraSpots.map((s) => ({ x: s.x, y: s.y, rad: s.w * 0.6 }));
    const leftovers = [];

    cutouts.forEach((c, i) => {
      const key = `z${n}-${c.kind}${c.num}`;
      const slot = CUTOUT_SPOTS[i];
      if (!slot) { // more cutouts than spots: spread them like the small stuff
        leftovers.push({ key, file: c.kind + c.num, kind: c.kind, w: SIZES[c.kind] });
        return;
      }
      const p = PLACE[key] || {};
      const pos = { x: p.x ?? slot.x, y: p.y ?? slot.y, w: p.w ?? slot.w, r: p.r ?? slot.r };
      makeSpot(panel, { key, file: c.kind + c.num, kind: c.kind, pos, floats: true });
      taken.push({ x: pos.x, y: pos.y, rad: pos.w * 0.5 });
    });

    // icons, flowers and confetti go in their own set spots
    const smallSpots = { icon: ICON_SPOTS, flower: FLOWER_SPOTS, confetti: CONFETTI_SPOTS };
    ["icon", "flower", "confetti"].forEach((kind) => {
      (group[kind] || []).forEach((num, i) => {
        const key = `z${n}-${kind}${num}`;
        const slot = smallSpots[kind][i];
        if (!slot) { // more than there are spots: spread them out in the gaps
          leftovers.push({ key, file: kind + num, kind, w: SIZES[kind] });
          return;
        }
        const p = PLACE[key] || {};
        const pos = { x: p.x ?? slot.x, y: p.y ?? slot.y, w: p.w ?? slot.w ?? SIZES[kind], r: p.r ?? slot.r ?? 0 };
        makeSpot(panel, { key, file: kind + num, kind, pos, floats: true });
        taken.push({ x: pos.x, y: pos.y, rad: pos.w * 0.5 });
      });
    });

    const items = [...leftovers];

    const spots = scatter(items, {
      rects: [{ x1: 36, x2: 64, y1: 20, y2: 80 }, ...CORNERS], // the zoomed photo
      circles: taken
    }, SHUFFLE * 100 + Number(n));

    items.forEach((it) => makeSpot(panel, { ...it, pos: spots[it.key], floats: true }));
  });
})();


/* =========================================================
   4. BUILD THE CONFETTI PIECES (spread over 3 layers)
   ========================================================= */
const confettiLayers = [
  document.querySelector(".confetti-back"),
  document.querySelector(".confetti-middle"),
  document.querySelector(".confetti-front")
];

for (let i = 0; i < FALLING_CONFETTI.pieces; i++) {
  const piece = document.createElement("div");
  piece.className = "confetti";
  piece.dataset.img = img("confetti" + ((i % FALLING_CONFETTI.shapes) + 1));
  piece.dataset.emoji = ["🟥", "🟧", "🟨", "🟩", "🟦", "🟪"][i % 6];
  confettiLayers[Math.floor(Math.random() * 3)].appendChild(piece);
}


/* =========================================================
   5. PLACEHOLDERS -> YOUR PNGs
   ========================================================= */
document.querySelectorAll("[data-img]").forEach((el) => {
  const inner = document.createElement("div");
  inner.className = "ph-inner";
  inner.textContent = el.dataset.emoji || "❓";
  el.appendChild(inner);

  const pic = new Image();
  pic.alt = "";
  pic.onload = () => {
    inner.textContent = "";
    inner.appendChild(pic);
  };
  pic.src = el.dataset.img;
});

document.querySelectorAll("[data-bg]").forEach((el) => {
  const pic = new Image();
  pic.onload = () => { el.style.backgroundImage = `url("${el.dataset.bg}")`; };
  pic.src = el.dataset.bg;
});


/* =========================================================
   6. STARTING STATE
   ========================================================= */
gsap.set(".cake-wrap", { autoAlpha: 0 });
gsap.set(".flame", { autoAlpha: 0 });
gsap.set(".cake-text", { autoAlpha: 0, scale: 0 });
gsap.set(".detail", { autoAlpha: 0 });
gsap.set(".restart", { autoAlpha: 0 });
gsap.set(confettiLayers, { autoAlpha: 0 });
gsap.set(".confetti", { xPercent: -50, yPercent: -50 });

document.querySelectorAll(".photo").forEach((p) => {
  p.dataset.r = p.style.getPropertyValue("--r").trim() || "0deg";
});


/* =========================================================
   7. ALWAYS-ON LITTLE MOVEMENTS
   ========================================================= */

// letters wiggle randomly
gsap.utils.toArray(".letter .ph-inner").forEach((el) => {
  gsap.to(el, {
    rotation: () => rand(-14, 14),
    x: () => rand(-6, 6),
    y: () => rand(-4, 4),
    duration: () => rand(0.25, 0.6),
    ease: "sine.inOut",
    repeat: -1,
    repeatRefresh: true
  });
});

// icons, flowers, people, pets and zoom confetti float around their spot
gsap.utils.toArray(".float > .ph-inner").forEach((el) => {
  const d = () => (FLOAT.distance * innerHeight) / 100;
  gsap.to(el, {
    x: () => rand(-1, 1) * d(),
    y: () => rand(-1, 1) * d(),
    rotation: () => rand(-FLOAT.spin, FLOAT.spin),
    duration: () => rand(FLOAT.minTime, FLOAT.maxTime),
    ease: "sine.inOut",
    repeat: -1,
    repeatRefresh: true
  });
});

// flames flicker
gsap.utils.toArray(".flame .ph-inner").forEach((el) => {
  gsap.to(el, {
    scaleY: () => rand(0.85, 1.15),
    scaleX: () => rand(0.9, 1.08),
    opacity: () => rand(0.8, 1),
    duration: () => rand(0.08, 0.2),
    ease: "sine.inOut",
    repeat: -1,
    repeatRefresh: true
  });
});

// press D to show/hide the name of every item (for placing things in layout.js)
document.addEventListener("keydown", (e) => {
  if (e.key === "d" || e.key === "D") document.body.classList.toggle("debug");
});


/* =========================================================
   8. MUSIC
   ========================================================= */
const songs = {};
document.querySelectorAll("audio[data-song]").forEach((a) => {
  songs[a.dataset.song] = a;
  a.volume = 0;
});

const musicBtn = document.querySelector(".btn-music");
const nowPlaying = document.querySelector(".now-playing");
let currentSong = "front";
let musicOn = false;

function updateMusicUI() {
  musicBtn.classList.toggle("on", musicOn);
  nowPlaying.textContent = `🎵 ${currentSong}${musicOn ? "" : " (paused)"}`;
}

function fadeIn(name) {
  const a = songs[name];
  if (!a) return;
  gsap.killTweensOf(a);
  a.play().catch(() => {});
  gsap.to(a, { volume: 1, duration: SONG_FADE });
}

function fadeOut(name) {
  const a = songs[name];
  if (!a) return;
  gsap.killTweensOf(a);
  gsap.to(a, { volume: 0, duration: SONG_FADE, onComplete: () => a.pause() });
}

function switchSong(name) {
  if (name === currentSong) return;
  if (musicOn) {
    fadeOut(currentSong);
    fadeIn(name);
  }
  currentSong = name;
  updateMusicUI();
}

musicBtn.addEventListener("click", () => {
  musicOn = !musicOn;
  if (musicOn) fadeIn(currentSong);
  else fadeOut(currentSong);
  updateMusicUI();
});

updateMusicUI();


/* =========================================================
   9. OPENING THE CARD
   bow falls -> letters walk off -> doors open ->
   confetti bursts + cake appears -> candles light -> text pops
   ========================================================= */
let state = "closed"; // closed | opening | open | zoomed | busy | closing
let openTl = null;

document.querySelector(".bow").addEventListener("click", () => {
  if (state !== "closed") return;
  state = "opening";
  document.querySelector(".bow").classList.add("clicked"); // stop the pulse

  if (!musicOn) {
    musicOn = true; // the inside song starts when the doors open
    updateMusicUI();
  }

  openTl = gsap.timeline({
    onComplete: () => {
      state = "open";
      gsap.to(".restart", { autoAlpha: 1, duration: 0.4 });
    },
    onReverseComplete: () => {
      state = "closed";
      document.querySelector(".bow").classList.remove("clicked"); // pulse again
      openTl.kill();
      openTl = null;
    }
  });

  // bow hops, then falls off
  openTl
    .to(".bow", { y: -25, duration: 0.2, ease: "power1.out" })
    .to(".bow", { y: innerHeight, rotation: 220, duration: 1, ease: "power2.in" })
    .set(".bow", { autoAlpha: 0 });

  // letters walk off: left-side letters go left, right-side go right
  openTl.addLabel("walk", "-=0.3");
  const middle = innerWidth / 2;

  gsap.utils.toArray(".letter").forEach((el) => {
    const r = el.getBoundingClientRect();
    const goLeft = r.left + r.width / 2 < middle;
    const distance = goLeft ? -(r.right + 40) : innerWidth - r.left + 40;
    const delay = rand(0, 0.4);

    openTl.to(el, { x: distance, duration: 1.8, ease: "power1.in" }, `walk+=${delay}`);
    openTl.to(el, { y: -12, duration: 0.18, ease: "sine.inOut", yoyo: true, repeat: 9 }, `walk+=${delay}`);
  });

  // grand doors swing open
  openTl
    .addLabel("doors", "walk+=2.2")
    .call(() => { if (!openTl.reversed()) switchSong("inside"); }, null, "doors")
    .to(".door-left",  { rotationY: -95, duration: 1.8, ease: "power2.inOut" }, "doors")
    .to(".door-right", { rotationY: 95,  duration: 1.8, ease: "power2.inOut" }, "doors")
    .set(".front", { autoAlpha: 0 });

  // MAGIC: confetti bursts from the middle and the cake + candles appear behind it
  openTl
    .addLabel("magic", "doors+=0.7")
    .call(() => { openTl.reversed() ? stopConfetti() : burstConfetti(); }, null, "magic")
    .fromTo(".cake-wrap",
      { autoAlpha: 0, scale: 0.4 },
      { autoAlpha: 1, scale: 1, duration: 0.7, ease: "back.out(1.8)" },
      "magic+=0.05"
    );

  // candles light right to left, quick
  const candles = gsap.utils.toArray(".candle");
  openTl.addLabel("light", "magic+=1.6");
  [...candles].reverse().forEach((c, i) => {
    openTl.fromTo(c.querySelector(".flame"),
      { autoAlpha: 0, scale: 0.2 },
      { autoAlpha: 1, scale: 1, duration: 0.3, ease: "power2.out" },
      `light+=${i * LIGHT_GAP}`
    );
  });

  // cake text pops in
  openTl.fromTo(".cake-text",
    { scale: 0, autoAlpha: 0 },
    { scale: 1, autoAlpha: 1, duration: 0.8, ease: "back.out(2)" },
    "+=0.3"
  );
});


/* =========================================================
   10. CONFETTI: burst from the center, then float down forever
   ========================================================= */
let confettiOn = false;

function burstConfetti() {
  stopConfetti();
  confettiOn = true;
  gsap.set(confettiLayers, { autoAlpha: 1 });

  const W = innerWidth;
  const H = innerHeight;
  const reach = Math.hypot(W, H) * 0.6 * FALLING_CONFETTI.burstPower;

  gsap.utils.toArray(".confetti").forEach((p) => {
    const inner = p.firstElementChild;
    const angle = rand(0, Math.PI * 2);
    const far = rand(0.15, 1) * reach;

    // tumble and sway forever (on the inside part, so it doesn't fight the falling)
    gsap.to(inner, { rotation: `+=${rand(180, 540) * (Math.random() < 0.5 ? -1 : 1)}`, duration: rand(4, 9), ease: "none", repeat: -1 });
    gsap.to(inner, { x: rand(20, 70) * (Math.random() < 0.5 ? -1 : 1), duration: rand(1.8, 3.5), ease: "sine.inOut", yoyo: true, repeat: -1 });

    // BURST out from the middle in every direction (some fly off screen)
    gsap.fromTo(p,
      { x: W / 2, y: H / 2, scale: 0.1, rotation: rand(0, 360) },
      {
        x: W / 2 + Math.cos(angle) * far,
        y: H / 2 + Math.sin(angle) * far,
        scale: rand(0.6, 1.3),
        rotation: `+=${rand(-360, 360)}`,
        duration: rand(0.8, 1.5),
        delay: rand(0, 0.2),
        ease: "power4.out",
        onComplete: () => fall(p)
      }
    );
  });
}

// float down to the bottom, then start again at a random spot above the top
function fall(p) {
  if (!confettiOn) return;
  const H = innerHeight;
  const bottom = H + 80;
  const y = gsap.getProperty(p, "y");
  const speed = H / rand(FALLING_CONFETTI.fallFastest, FALLING_CONFETTI.fallSlowest); // pixels per second

  gsap.to(p, {
    y: bottom,
    duration: Math.max(0.3, (bottom - y) / speed),
    ease: "none",
    onComplete: () => {
      if (!confettiOn) return;
      gsap.set(p, { x: rand(0, innerWidth), y: rand(-200, -60), scale: rand(0.6, 1.3) });
      fall(p);
    }
  });
}

function stopConfetti() {
  confettiOn = false;
  const pieces = gsap.utils.toArray(".confetti");
  gsap.killTweensOf(pieces);
  gsap.killTweensOf(pieces.map((p) => p.firstElementChild));
  gsap.set(confettiLayers, { autoAlpha: 0 });
}


/* =========================================================
   11. PHOTO ZOOM
   ========================================================= */
const world = document.querySelector(".world");
let zoomedPhoto = null;

document.querySelectorAll(".photo").forEach((photo) => {
  photo.addEventListener("click", () => {
    if (state === "open") zoomIn(photo);
    else if (state === "zoomed" && photo === zoomedPhoto) zoomOut();
  });
});

function zoomIn(photo) {
  state = "busy";
  zoomedPhoto = photo;
  const n = photo.dataset.photo;

  const r = photo.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const scale = (innerHeight * ZOOM_SIZE) / photo.offsetHeight;

  switchSong("photo" + n);
  world.classList.add("is-zoomed"); // turns off the hover effect on the other photos
  photo.classList.add("zoomed-in");  // this one gets its own hover effect

  gsap.timeline({ onComplete: () => { state = "zoomed"; } })
    .to(confettiLayers, { autoAlpha: 0, duration: 0.4 }, 0)
    .to(everythingBut(photo), { autoAlpha: 0, duration: 0.6 }, 0) // hide the cake, icons and other photos
    .to(world, {
      x: innerWidth / 2 - scale * cx,
      y: innerHeight / 2 - scale * cy,
      scale: scale,
      duration: 1.3,
      ease: "power3.inOut"
    }, 0)
    .to(photo, { "--r": "0deg", duration: 1.3, ease: "power3.inOut" }, 0)
    .set(`.detail[data-photo="${n}"]`, { autoAlpha: 1 }, 1)
    .fromTo(`.detail[data-photo="${n}"] > *`,
      { autoAlpha: 0, scale: 0.6 },
      { autoAlpha: 1, scale: 1, duration: 0.5, stagger: 0.04, ease: "back.out(1.8)" },
      1
    );
}

function zoomOut() {
  state = "busy";
  const photo = zoomedPhoto;
  const n = photo.dataset.photo;

  switchSong("inside");

  gsap.timeline({ onComplete: () => { state = "open"; zoomedPhoto = null; world.classList.remove("is-zoomed"); photo.classList.remove("zoomed-in"); } })
    .to(`.detail[data-photo="${n}"]`, { autoAlpha: 0, duration: 0.4 }, 0)
    .to(world, { x: 0, y: 0, scale: 1, duration: 1.2, ease: "power3.inOut" }, 0.2)
    .to(photo, { "--r": photo.dataset.r, duration: 1.2, ease: "power3.inOut" }, 0.2)
    .to(everythingBut(photo), { autoAlpha: 1, duration: 0.6 }, 0.7)
    .to(confettiLayers, { autoAlpha: confettiOn ? 1 : 0, duration: 0.5 }, 1);
}

// the cake, main icons/flowers and the other 6 photos
function everythingBut(photo) {
  return [".main-floaters", ".cake-wrap", ...[...document.querySelectorAll(".photo")].filter((p) => p !== photo)];
}

function resetZoom() {
  if (!zoomedPhoto) return;
  gsap.set(everythingBut(zoomedPhoto), { autoAlpha: 1 });
  gsap.set(".detail", { autoAlpha: 0 });
  gsap.set(world, { x: 0, y: 0, scale: 1 });
  gsap.set(zoomedPhoto, { "--r": zoomedPhoto.dataset.r });
  zoomedPhoto.classList.remove("zoomed-in");
  zoomedPhoto = null;
  world.classList.remove("is-zoomed");
}


/* =========================================================
   12. RESTART: flames out, candles fall, cake vanishes, card closes
   ========================================================= */
document.querySelector(".restart").addEventListener("click", () => {
  if (state !== "open" && state !== "zoomed") return;

  state = "closing";
  gsap.to(".restart", { autoAlpha: 0, duration: 0.3 });
  resetZoom();
  stopConfetti();
  switchSong("front");

  const candles = gsap.utils.toArray(".candle");

  gsap.timeline({
    onComplete: () => {
      gsap.set(candles, { x: 0, y: 0, rotation: 0, autoAlpha: 1 }); // put candles back for next time
      openTl.seek("magic", true);
      openTl.timeScale(RESTART_SPEED).reverse();
    }
  })
    .to(".cake-text", { scale: 0, autoAlpha: 0, duration: 0.3, ease: "back.in(2)" })
    .to(".flame", { autoAlpha: 0, scale: 0.2, duration: 0.25, ease: "power2.in" }, "<")
    .to(candles, {
      y: () => rand(-60, -30),
      x: () => rand(-40, 40),
      rotation: () => rand(-40, 40),
      duration: 0.3,
      ease: "power2.out",
      stagger: 0.04
    }, "+=0.2")
    .to(candles, {
      y: innerHeight,
      rotation: () => rand(-300, 300),
      duration: 0.9,
      ease: "power2.in",
      stagger: 0.04
    }, "-=0.1")
    .set(candles, { autoAlpha: 0 })
    .to(".cake-wrap", { scale: 0.4, autoAlpha: 0, duration: 0.4, ease: "back.in(1.8)" });
});