import { readLilithTable } from './lilith.mjs';

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function lilithYearAt(utcMs) {
  if (!Number.isSafeInteger(utcMs)) throw new RangeError('Expected integer UTC milliseconds');
  const year = new Date(utcMs + JST_OFFSET_MS).getUTCFullYear();
  if (!(year >= 1900 && year <= 2100)) throw new RangeError('Lilith supports 1900–2100 JST');
  return year;
}

export function createLilithLookup(loadTable) {
  const tables = new Map();
  return async function lilithAt(utcMs) {
    const year = lilithYearAt(utcMs);
    if (!tables.has(year)) {
      const pending = Promise.resolve().then(() => loadTable(year)).then(readLilithTable);
      tables.set(year, pending);
      void pending.catch(() => tables.delete(year));
    }
    const lookup = await tables.get(year);
    return lookup(utcMs);
  };
}
