/* ============================================================
   Eco Connex — Category → Hero Banner image mapping.
   ONE lookup table (no scattered if/else). A category not
   listed here (or with no banner yet) automatically falls back
   to assets/images/hero/default.webp — never a broken image.

   To add a banner for a future category: drop the image in
   assets/images/hero/ and add one line below. Nothing else
   needs to change — generate-category-pages.js reads this file.
   ============================================================ */
const HERO_IMAGE_MAP = {
  accessories: "accessories.webp",
  brake: "brake.webp",
  "brake-shoe": "brake.webp", // shares the brake family banner — no dedicated photo shot yet
  charger: "charger.webp",
  connector: "connector.webp",
  controller: "controller.webp",
  converter: "converter.webp",
  disc: "disc.webp",
  "fork-set": "forkset.webp",
  led: "led.webp",
  lever: "liver.webp", // actual filename shipped by the design team (see assets/images/hero/)
  lock: "lockset.webp", // actual filename shipped by the design team
  mcb: "mcb.webp",
  mirror: "mirror.webp",
  motor: "motor.webp",
  other: "others.webp", // actual filename shipped by the design team
  sensor: "sensor.webp",
  switch: "switch.webp",
  throttle: "throttle.webp"
  // bearing, body: no dedicated banner yet — automatically use default.webp
};

const DEFAULT_HERO_IMAGE = "default.webp";

module.exports = function getHeroImage(categoryKey) {
  return HERO_IMAGE_MAP[categoryKey] || DEFAULT_HERO_IMAGE;
};
module.exports.MAP = HERO_IMAGE_MAP;
module.exports.DEFAULT = DEFAULT_HERO_IMAGE;
