import { lilithYearAt } from './lilith-years.mjs';

const ASTEROIDS = ['ceres', 'pallas', 'juno', 'vesta'];
const GLYPHS = Object.freeze({
  ceres: '⚳', pallas: '⚴', juno: '⚵', vesta: '⚶',
  meanLilith: '⚸M', trueLilith: '⚸T', vertex: 'Vx', antiVertex: 'AVx', fortune: '⊗',
});
const wrap = degrees => (degrees % 360 + 360) % 360;

function asteroidTable(buffer, year) {
  const view = new DataView(buffer);
  const first = Date.UTC(year - 1, 11, 31, 15);
  const last = Date.UTC(year, 11, 31, 15);
  const interval = 10_800_000;
  if (view.byteLength !== 16 + 16 * (1 + (last - first) / interval) ||
      view.getUint32(0) !== 0x41535431 ||
      view.getFloat64(4, true) !== first || view.getUint32(12, true) !== interval) {
    throw new RangeError('Invalid asteroid ephemeris table');
  }
  return utcMs => {
    const position = (utcMs - first) / interval;
    const index = Math.floor(position);
    return ASTEROIDS.map((id, column) => {
      const offset = 16 + index * 16 + column * 4;
      const a = view.getUint32(offset, true) / 1e7;
      const b = view.getUint32(offset + 16, true) / 1e7;
      const delta = wrap(b - a + 180) - 180;
      return { id, longitude: wrap(a + delta * (position - index)) };
    });
  };
}

export function createAsteroidLookup(loadTable) {
  const tables = new Map();
  return async utcMs => {
    const year = lilithYearAt(utcMs);
    if (!tables.has(year)) {
      const pending = Promise.resolve().then(() => loadTable(year)).then(buffer => asteroidTable(buffer, year));
      tables.set(year, pending);
      void pending.catch(() => tables.delete(year));
    }
    return (await tables.get(year))(utcMs);
  };
}

export function fortuneLongitude({ ascendant, sun, moon, mode, sect }) {
  if (![ascendant, sun, moon].every(Number.isFinite)) throw new RangeError('Missing Fortune inputs');
  if (mode === 'day-formula') return wrap(ascendant + moon - sun);
  if (mode === 'sect') {
    if (sect === 'day') return wrap(ascendant + moon - sun);
    if (sect === 'night') return wrap(ascendant + sun - moon);
    return null;
  }
  throw new RangeError('Select an explicit Fortune formula');
}

export async function extraChartPoints(chart, selection, { asteroidAt, lilithAt, fortune } = {}) {
  const ids = new Set(selection);
  if ([...ids].some(id => !Object.hasOwn(GLYPHS, id))) throw new RangeError('Unknown chart point');
  const points = [];
  if (ASTEROIDS.some(id => ids.has(id))) points.push(...await asteroidAt(chart.utcMs));
  if (ids.has('meanLilith') || ids.has('trueLilith')) {
    const [mean, actual] = await lilithAt(chart.utcMs);
    points.push(
      { id: 'meanLilith', longitude: mean.longitude, retrograde: mean.retrograde },
      { id: 'trueLilith', longitude: actual.longitude, retrograde: actual.retrograde },
    );
  }
  points.push({ id: 'vertex', longitude: chart.vertexAxis?.vertex?.longitude },
    { id: 'antiVertex', longitude: chart.vertexAxis?.antiVertex?.longitude });
  if (ids.has('fortune')) {
    const sun = chart.bodies.find(body => body.name === '太陽')?.longitude;
    const moon = chart.bodies.find(body => body.name === '月')?.longitude;
    points.push({ id: 'fortune', longitude: fortuneLongitude({ ...fortune, ascendant: chart.asc, sun, moon }) });
  }
  return points.filter(({ id, longitude }) => ids.has(id) && Number.isFinite(longitude))
    .map(point => ({ ...point, name: GLYPHS[point.id] }));
}

export async function wheelLayer(chart, selection, dependencies, label) {
  const extras = await extraChartPoints(chart, selection, dependencies);
  return {
    label,
    ascendant: chart.asc,
    cusps: chart.cusps,
    planets: [...chart.bodies, ...extras],
  };
}
