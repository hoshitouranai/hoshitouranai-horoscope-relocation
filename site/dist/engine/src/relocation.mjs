import { BODY_NAMES } from './ephemeris.mjs';
import { civilTimeToUtc } from './historical-time.mjs';
import { placidusHouses } from './houses.mjs';
import { SAMPLE_INTERVAL_MS, jstToUtcMs } from './time.mjs';
import { vertexPoints } from './vertex.mjs';
import { clocksAt, resolveLocation } from './world-city.mjs';

const sampleEpoch = jstToUtcMs('2000-01-01', '00:00');

function sampleStep(utcMs) {
  if (!Number.isSafeInteger(utcMs)) throw new RangeError('Expected integer UTC epoch milliseconds');
  return (utcMs - sampleEpoch) / SAMPLE_INTERVAL_MS;
}

export function vertexAt(ephemeris, { utcMs, latitude, longitude }) {
  const { theta, obliquity } = ephemeris.orientation(sampleStep(utcMs));
  return vertexPoints(theta, obliquity, latitude, longitude);
}

export function relocationChart(ephemeris, timezones, {
  date, time, birthLocation, destination, birthUtcMs,
}) {
  const origin = resolveLocation(timezones, birthLocation);
  const target = resolveLocation(timezones, destination);
  const conversion = civilTimeToUtc(timezones, { date, time, timeZone: origin.timeZone });
  let utcMs;
  if (conversion.status === 'ambiguous') {
    if (birthUtcMs === undefined) return conversion;
    if (!conversion.candidates.some(candidate => candidate.utcMs === birthUtcMs)) {
      throw new RangeError('Expected one of the UTC candidates for the birth time');
    }
    utcMs = birthUtcMs;
  } else {
    if (conversion.status !== 'ok') return conversion;
    utcMs = conversion.utcMs;
    if (birthUtcMs !== undefined && birthUtcMs !== utcMs) {
      throw new RangeError('UTC does not match the birth time');
    }
  }

  const step = sampleStep(utcMs);
  const orientation = Object.freeze(ephemeris.orientation(step));
  const { theta, obliquity } = orientation;
  const bodies = Object.freeze(BODY_NAMES.map((_, index) => Object.freeze(ephemeris.position(index, step))));
  function chart(location) {
    const { latitude, longitude, timeZone } = location;
    const houses = placidusHouses(theta, obliquity, latitude, longitude);
    const fallbackUsed = Math.abs(latitude) >= 90 - obliquity;
    return {
      utcMs, location, orientation,
      clocks: timeZone === undefined ? null : clocksAt(timezones, utcMs, timeZone),
      bodies,
      ...houses,
      requestedHouseSystem: 'placidus',
      houseSystem: fallbackUsed ? 'porphyry' : 'placidus',
      fallbackUsed,
      vertexAxis: vertexPoints(theta, obliquity, latitude, longitude),
    };
  }
  return { status: 'ok', utcMs, natal: chart(origin), relocated: chart(target) };
}
