import {wrap360} from './angles.mjs';

/** Opposition has two equally short arcs, so neither midpoint is primary. */
export function longitudeMidpoints(first, second) {
  if (!Number.isFinite(first) || !Number.isFinite(second)) {
    throw new RangeError('Two finite longitudes are required');
  }
  const a = wrap360(first), b = wrap360(second);
  const forward = wrap360(b-a);
  if (forward === 180) {
    const midpoint = wrap360(Math.min(a,b)+90);
    return {midpoint:null, opposite:null, candidates:[midpoint,wrap360(midpoint+180)]};
  }
  const midpoint = wrap360(a+(forward>180 ? forward-360 : forward)/2);
  return {midpoint, opposite:wrap360(midpoint+180)};
}
