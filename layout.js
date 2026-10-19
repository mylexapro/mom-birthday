/* =========================================================
   LAYOUT: which images go where, and how big they are.
   Change the numbers here, save, and refresh.

   TIP: press the D key on the card to show the name of
   every floating item, so you know what to move.
   ========================================================= */


/* ---------- sizes (in vh = % of the screen height) ---------- */
const SIZES = {
  icon: 17,
  flower: 12,
  person: 28,
  pet: 26,
  extra: 36,     // the 3 extra photos around a zoomed photo
  confetti: 6    // confetti sitting around a zoomed photo (falling confetti size is in styles.css)
};


/* ---------- floating ---------- */
const FLOAT = {
  distance: 5,   // how far things drift from their spot (vh). Bigger = they travel more
  minTime: 3,    // seconds per drift, slowest and fastest
  maxTime: 6,
  spin: 14       // how much they tilt back and forth (degrees)
};


/* ---------- confetti burst + fall ---------- */
const FALLING_CONFETTI = {
  pieces: 200,     // how many pieces
  shapes: 29,      // confetti1.PNG ... confetti29.PNG
  burstPower: 1,   // how far the burst throws them. 1.5 = further, 0.6 = shorter
  fallSlowest: 18, // seconds to fall the whole screen (slowest piece)
  fallFastest: 9   // seconds to fall the whole screen (fastest piece)
};


/* ---------- main screen (around the cake) ----------
   One line = one spot. These spots fit in the gaps between the photos and the cake.
   To balance the colors, just swap the file names between lines
   (any icon or flower number works, including ones used in the zoomed photos).
   x / y = % of the screen, r = tilt. Add w: 20 to make one spot bigger or smaller. */
const MAIN_SPOTS = [
  // top, above the cake
  { file: "icon1",   x: 42, y: 12, r: -8 },
  { file: "flower1", x: 51, y: 8,  r: 6 },
  { file: "icon2",   x: 60, y: 14, r: 7 },
  { file: "flower2", x: 71, y: 9,  r: -5 },

  // left side
  { file: "flower3", x: 12, y: 51, r: 8, w: 10 },
  { file: "icon3",   x: 27, y: 49, r: -6 },

  // right side
  { file: "icon4",   x: 73, y: 28, r: 5 },
  { file: "icon5",   x: 74, y: 49, r: -7 },
  { file: "flower4", x: 88, y: 50, r: 4, w: 10 },

  // bottom, under the cake
  { file: "flower5", x: 44, y: 92, r: -4 },
  { file: "icon6",   x: 56, y: 91, r: 6 },

  // little corner fillers
  { file: "flower6", x: 9,  y: 95, r: 10, w: 9 },
  { file: "flower7", x: 96, y: 94, r: -10, w: 9 }
];


/* ---------- zoomed photos ----------
   What pops up around each photo when it's clicked.
   The numbers are your file numbers, e.g. pet: [3, 4] = pet3.PNG and pet4.PNG
   Move numbers between photos to change what goes with what. */
const ZOOM = {
  1: { extra: [1, 2, 3],    person: [1, 2],   pet: [1, 2],      icon: [10, 11, 12, 13, 14, 15], flower: [15, 16, 17], confetti: [1, 2, 3, 4] },
  2: { extra: [4, 5, 6],    person: [3, 4],   pet: [3, 4],      icon: [16, 17, 18, 19, 20, 21], flower: [18, 19, 20], confetti: [5, 6, 7, 8] },
  3: { extra: [7, 8, 9],    person: [5, 6],   pet: [5, 6],      icon: [22, 23, 24, 25, 26, 27], flower: [21, 22, 23], confetti: [9, 10, 11, 12] },
  4: { extra: [10, 11, 12], person: [7, 8],   pet: [7, 8],      icon: [28, 29, 30, 31, 32, 33], flower: [24, 25, 26], confetti: [13, 14, 15, 16] },
  5: { extra: [13, 14, 15], person: [9, 10],  pet: [9, 10],     icon: [34, 35, 36, 37, 38, 39], flower: [27, 28, 29], confetti: [17, 18, 19, 20] },
  6: { extra: [16, 17, 18], person: [11, 12], pet: [11, 12],    icon: [40, 41, 42, 43, 44, 45], flower: [30, 31, 32], confetti: [21, 22, 23, 24] },
  7: { extra: [19, 20, 21], person: [13, 14], pet: [13, 14, 15], icon: [46, 47, 48, 49, 50, 51], flower: [33, 34, 35], confetti: [25, 26, 27, 28] }
};


/* ---------- spots around a zoomed photo ----------
   The zoomed photo sits in the middle. These are the same for every photo.
   x / y = % of the screen, w = size in vh, r = tilt */

// the 3 extra photos
const EXTRA_SPOTS = [
  { x: 12, y: 31, r: -6 },   // top left
  { x: 88, y: 31, r: 6 },    // top right
  { x: 88, y: 76, r: -4 }    // bottom right
];

// the people + pet cutouts (filled in order: person, pet, person, pet, ...)
const CUTOUT_SPOTS = [
  { x: 12, y: 76, w: 28, r: 5 },    // bottom left
  { x: 28, y: 52, w: 24, r: -4 },   // left, next to the photo
  { x: 72, y: 52, w: 24, r: 4 },    // right, next to the photo
  { x: 50, y: 10, w: 18, r: -3 },   // above the photo
  { x: 50, y: 90, w: 18, r: 3 }     // below the photo
];

// the icons (filled in order)
const ICON_SPOTS = [
  { x: 28, y: 11, r: -8 },   // top left
  { x: 72, y: 11, r: 8 },    // top right
  { x: 32, y: 30, r: 6 },    // upper left, by the photo
  { x: 68, y: 30, r: -6 },   // upper right, by the photo
  { x: 29, y: 80, r: 5 },    // bottom left
  { x: 71, y: 80, r: -5 }    // bottom right
];

// the flowers (filled in order)
const FLOWER_SPOTS = [
  { x: 40, y: 8,  r: -10 },  // above the photo, left
  { x: 60, y: 8,  r: 10 },   // above the photo, right
  { x: 40, y: 92, r: 8 },    // below the photo, left
  { x: 60, y: 92, r: -8 }    // below the photo, right
];

// the little confetti pieces (filled in order)
const CONFETTI_SPOTS = [
  { x: 3,  y: 58, r: 20 },
  { x: 21, y: 97, r: -30 },
  { x: 63, y: 97, r: 45 },
  { x: 80, y: 4,  r: -15 }
];


/* ---------- move one specific item ----------
   Everything else is spread out automatically. To place something yourself,
   press D to see its name, then add a line here. Examples:

   "icon3":     { x: 20, y: 40 },            // main screen icon3
   "z2-pet4":   { x: 15, y: 70, w: 30 },     // pet4 in zoomed photo 2, a bit bigger
   "z5-extra14":{ x: 20, y: 75, r: 10 }      // extra14 in zoomed photo 5, tilted

   x / y = % of the screen, w = size in vh, r = tilt in degrees */
const PLACE = {

};


/* ---------- shuffle ----------
   Change this to any other number to get a different random arrangement. */
const SHUFFLE = 7;