/** Offline timezone lookup from a versioned snapshot bundled by the build process.
 * Supports a deliberately limited set of IANA zones for 1900 through 2100.
 * Historical tzdata differs across versions. Never silently resolve gaps/folds.
 * Date/time input is local civil time, not JST sample labels.
 */
const DB=new URL('../data/timezones_1900_2100.json',import.meta.url);
export async function loadHistoricalTimezones(){
 if (DB.protocol === 'file:' && globalThis.process?.versions?.node) {
  const {readFile} = await import('node:fs/promises');
  return JSON.parse(await readFile(DB,'utf8'));
 }
 const response = await fetch(DB);
 if (!response.ok) throw new Error(`Failed loading timezone snapshot: ${response.status}`);
 return response.json();
}
function parseCivil(date,time){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw new RangeError('Civil date must be YYYY-MM-DD and time HH:mm');
 const [y,m,d]=date.split('-').map(Number),[h,minute]=time.split(':').map(Number);
 const timestamp=Date.UTC(y,m-1,d,h,minute);
 const dt=new Date(timestamp);
 if(dt.getUTCFullYear()!==y||dt.getUTCMonth()+1!==m||dt.getUTCDate()!==d||dt.getUTCHours()!==h||dt.getUTCMinutes()!==minute)throw new RangeError('Invalid civil date');
 return timestamp;
}
export function civilTimeToUtc(db,{date,time,timeZone}){
 const localMs=parseCivil(date,time);
 if(!db||!db.zones||!Object.hasOwn(db.zones,timeZone))return {status:'unsupported-zone',timeZone};
 const period=db.zones[timeZone]; const min=Date.parse(db.coverageUtc[0]),max=Date.parse(db.coverageUtc[1]);
 const found=[];
 for(let i=0;i<period.length;i++){
  const [utcSeconds,offsetSeconds]=period[i];
  const candidate=localMs-offsetSeconds*1000;
  const low=Math.max(utcSeconds*1000,min);
  const high=i+1<period.length?Math.min(period[i+1][0]*1000,max):max;
  if(candidate>=low&&candidate<high)found.push({utcMs:candidate,utcIso:new Date(candidate).toISOString(),offsetSeconds});
 }
 if(found.length===1)return {status:'ok',timeZone,...found[0]};
 if(found.length>1)return {status:'ambiguous',timeZone,candidates:found};
 // Civil time outside supported UTC coverage is distinct from a DST gap.
 const possible=period.some(([_,offsetSeconds])=>localMs-offsetSeconds*1000>=min&&localMs-offsetSeconds*1000<max);
 return {status:possible?'nonexistent':'out-of-range',timeZone};
}
