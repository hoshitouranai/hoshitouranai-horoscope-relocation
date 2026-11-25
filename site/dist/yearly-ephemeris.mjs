import {SampledEphemeris} from './engine/src/ephemeris.mjs';
import {jstSampleStep, utcMsToJst} from './engine/src/time.mjs';

export function createYearlyEphemerisLoader(read) {
  const cache = new Map();
  return async utcMs => {
    const year = Number(utcMsToJst(utcMs).date.slice(0,4));
    if (year < 1900 || year > 2100) throw new RangeError('天文暦の対応期間は1900〜2100年（JST）です。');
    if (!cache.has(year)) {
      const pending = Promise.all(['positions', 'orientation', 'stations'].map(name =>
        read(new URL(`./engine/data/yearly/${name}-${year}.${name === 'stations' ? 'json' : 'bin'}`, import.meta.url))
      )).then(([positions, orientation, stations]) =>
        new SampledEphemeris(positions, orientation, stations, jstSampleStep(`${year}-01-01`, '00:00')));
      cache.set(year, pending);
      void pending.catch(() => { if (cache.get(year) === pending) cache.delete(year); });
      if (cache.size > 4) cache.delete(cache.keys().next().value);
    }
    const segment = await cache.get(year);
    return {
      position: (index, step) => segment.position(index, step - segment.startStep),
      orientation: step => segment.orientation(step - segment.startStep),
    };
  };
}
