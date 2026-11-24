import { wrap360, zodiacPosition } from './angles.mjs';

const radians = Math.PI / 180;
const singularityTolerance = 1e-12;

function point(longitude) {
  return { longitude, ...zodiacPosition(longitude) };
}

export function vertexPoints(theta, obliquity, latitude, longitude) {
  if (![theta, obliquity, latitude, longitude].every(Number.isFinite) ||
      obliquity <= 0 || obliquity >= 30 || Math.abs(latitude) >= 90 ||
      Math.abs(longitude) > 180) {
    throw new RangeError('Invalid earth orientation or location');
  }

  const sidereal = wrap360(theta + longitude) * radians;
  const tilt = obliquity * radians;
  const lat = latitude * radians;
  const sinSidereal = Math.sin(sidereal);
  const cosSidereal = Math.cos(sidereal);
  const sinLat = Math.sin(lat);
  const cosTilt = Math.cos(tilt);
  // Project the local north vector onto the two ecliptic basis vectors.
  const northX = -sinLat * cosSidereal;
  const northY = -sinLat * sinSidereal * cosTilt + Math.cos(lat) * Math.sin(tilt);
  const length = Math.hypot(northX, northY);
  if (length <= singularityTolerance) {
    return { status: 'coincident-planes', vertex: null, antiVertex: null };
  }

  // The intersection has two antipodes. Select the one in the local western half.
  const east = (-sinSidereal * northY - cosSidereal * cosTilt * northX) / length;
  if (Math.abs(east) <= singularityTolerance) {
    return { status: 'no-western-intersection', vertex: null, antiVertex: null };
  }

  const vertex = wrap360(Math.atan2(-northX, northY) / radians + (east > 0 ? 180 : 0));
  return { status: 'ok', vertex: point(vertex), antiVertex: point(wrap360(vertex + 180)) };
}
