import {pairList,detect,signConcentrationCandidates,overlapCandidates} from './aspect_patterns.mjs';

export function aspectsAt(longitudes) {
  if (!Array.isArray(longitudes) || longitudes.length !== 12 || Array.from(longitudes).some(value => !Number.isFinite(value))) {
    throw new TypeError('Expected 12 finite longitudes in BODY_NAMES order');
  }
  const pairs = pairList(longitudes);
  const patterns = detect(longitudes);
  const concentrations = signConcentrationCandidates(longitudes);
  return {pairs,patterns,concentrations,overlaps:overlapCandidates([...patterns,...concentrations])};
}
