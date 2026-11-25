import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadSampledEphemeris} from './dist/engine/src/ephemeris.mjs';
import {jstToUtcMs,SAMPLE_INTERVAL_MS} from './dist/engine/src/time.mjs';
import {createYearlyEphemerisLoader} from './dist/yearly-ephemeris.mjs';
const read = async url => {
  if(url.pathname.endsWith('/ephemeris_1900_1999_3h.bin')) {
    return Buffer.concat(await Promise.all([0,1].map(i=>readFile(new URL(url.href+'.'+i)))));
  }
  const bytes=await readFile(url);
  return url.pathname.endsWith('.json')?JSON.parse(bytes):bytes;
};
const base=await loadSampledEphemeris(undefined,read);
let reads=0;
const yearly=createYearlyEphemerisLoader(url=>{reads++;return read(url);});
const epoch=jstToUtcMs('2000-01-01','00:00');
for(let year=1900;year<=2100;year++){
  const first=jstToUtcMs(`${year}-01-01`,'00:00');
  const end=jstToUtcMs(`${year+1}-01-01`,'00:00');
  const e=await yearly(first);
  await yearly(end-1);
  for(const time of [first,first+60001,first+100*86400000+12345,end-60001,end-1]){
    const step=(time-epoch)/SAMPLE_INTERVAL_MS;
    const left=e.orientation(step),right=base.orientation(step);
    for(const key of ['theta','obliquity'])assert.ok(Math.abs(left[key]-right[key])<1e-7);
    for(let i=0;i<12;i++){
      const a=e.position(i,step),b=base.position(i,step);
      assert.equal(a.retrograde,b.retrograde);
      assert.ok(Math.abs(a.longitude-b.longitude)<1e-7);
    }
  }
}
assert.equal(reads,201*3);
console.log('PASS: 201 years, 1,005 boundary/interior timestamps, 12 bodies, 3 reads per year.');
