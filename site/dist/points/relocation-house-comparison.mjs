// Add this module to common-engine/src in a working copy of v1.3.0.
// The input is the successful result returned by relocationChart.
// A point on a cusp belongs to the house that starts at that cusp.

export function houseNumberAt(longitude, cusps) {
  if (!Number.isFinite(longitude) || cusps.length !== 12 ||
      !Array.from(cusps).every(Number.isFinite)) {
    throw new RangeError('Expected a finite longitude and twelve finite cusps');
  }
  const normalize = value => {
    const remainder = value % 360;
    return remainder < 0 ? remainder + 360 : remainder;
  };
  const point = normalize(longitude);
  const boundaries = Array.from(cusps, normalize);
  const wraps = boundaries.filter((start, i) => start >= boundaries[(i + 1) % 12]);
  if (wraps.length !== 1 || new Set(boundaries).size !== 12) {
    throw new RangeError('Expected distinct cusps in zodiac order');
  }
  const index = boundaries.findIndex((start, i) => {
    const end = boundaries[(i + 1) % 12];
    return start < end ? point >= start && point < end : point >= start || point < end;
  });
  return index + 1;
}

export function relocationHouseComparison(result, extraPoints = []) {
  if (result.status !== 'ok') return result;
  const { natal, relocated } = result;
  const row = (name, natalLongitude, relocatedLongitude) => {
    const natalHouse = natalLongitude === null ? null : houseNumberAt(natalLongitude, natal.cusps);
    const relocatedHouse = relocatedLongitude === null ? null : houseNumberAt(relocatedLongitude, relocated.cusps);
    return {
      name, natalLongitude, relocatedLongitude, natalHouse, relocatedHouse,
      houseChanged: natalHouse === null || relocatedHouse === null ? null : natalHouse !== relocatedHouse,
    };
  };
  const shared = [...natal.bodies, ...extraPoints].map(({ name, longitude }) => row(name, longitude, longitude));
  const angles = ['vertex', 'antiVertex'].map(name => row(
    name,
    natal.vertexAxis[name]?.longitude ?? null,
    relocated.vertexAxis[name]?.longitude ?? null,
  ));
  return { status: 'ok', utcMs: result.utcMs, shared, angles };
}
