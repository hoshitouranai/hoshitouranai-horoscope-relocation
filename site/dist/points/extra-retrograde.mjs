import { lilithYearAt } from './lilith-years.mjs';

export function extraRetrogradeAt(stations, utcMs, id) {
  const year = lilithYearAt(utcMs);
  const second = (utcMs - Date.UTC(year - 1, 11, 31, 15)) / 1000;
  const changes = stations[year][id];
  let first = 1;
  let last = changes.length;
  while (first < last) {
    const middle = (first + last) >>> 1;
    if (changes[middle] <= second) first = middle + 1;
    else last = middle;
  }
  return Boolean((changes[0] + first - 1) % 2);
}
