/* Mirrors window.EcoConnex.getCategoryIcon() in assets/js/products-data.js.
   Kept as a tiny separate lookup because the browser version lives inside
   a browser-only IIFE and can't be required() directly from Node. */
module.exports = function getCategoryIcon(cat) {
  const map = {
    motor: "ti-engine", charger: "ti-plug", brake: "ti-disc", "brake-shoe": "ti-disc",
    throttle: "ti-gauge", controller: "ti-cpu", converter: "ti-bolt", disc: "ti-disc",
    "drum-plate": "ti-circle", "fork-set": "ti-adjustments", led: "ti-bulb", lever: "ti-hand-stop",
    lock: "ti-lock", mcb: "ti-alert-triangle", mirror: "ti-mirror", sensor: "ti-radar-2",
    switch: "ti-toggle-left", connector: "ti-plug-connected", bearing: "ti-circle-dot",
    body: "ti-motorbike", accessories: "ti-tools", other: "ti-package"
  };
  return map[cat] || "ti-package";
};
