import {
  equalHouses, naturalHouses, sunSignHouses, wholeSignHouses, wrap360,
} from './engine/src/index.mjs';

export function selectHouses(chart, method) {
  if (method === 'placidus') return chart;
  if (method === 'natural' || method === 'solar') {
    const houses = method === 'natural' ? naturalHouses() : sunSignHouses(chart.bodies[0].longitude);
    return { ...chart, ...houses, asc: houses.cusps[0], mc: null, vertexAxis: null, referenceOnly: true };
  }

  // The Porphyry fallback can switch to the antipode at polar latitudes.
  // Whole Sign and Equal use the geometric ascendant before that switch.
  let asc = chart.asc;
  if (chart.fallbackUsed) {
    const rad = Math.PI / 180;
    const theta = wrap360(chart.orientation.theta + chart.location.longitude) * rad;
    const eps = chart.orientation.obliquity * rad;
    const latitude = chart.location.latitude * rad;
    asc = wrap360(Math.atan2(
      Math.cos(theta),
      -Math.sin(theta) * Math.cos(eps) - Math.tan(latitude) * Math.sin(eps),
    ) / rad);
  }
  const houses = method === 'whole' ? wholeSignHouses(asc, chart.mc) : equalHouses(asc, chart.mc);
  return { ...chart, ...houses, fallbackUsed: false };
}
