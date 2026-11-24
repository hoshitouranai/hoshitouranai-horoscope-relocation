import {wrap360} from './angles.mjs';
const rad=Math.PI/180;
const wrap=wrap360;
// Function body copied verbatim from the three LOCKED chart HTML sources (identical SHA-256).
// Its actual algorithm is Placidus with a polar-region Porphyry fallback, NOT Regiomontanus.
function houses(thetaDeg, epsDeg, lat, lon) {
  const theta = wrap(thetaDeg + lon) * rad, eps = epsDeg * rad;
  const sine = Math.sin(eps), cosine = Math.cos(eps), tangent = Math.tan(lat * rad);
  const longitude = rightAscension => wrap(Math.atan2(Math.sin(rightAscension) / cosine, Math.cos(rightAscension)) / rad);
  const mc = longitude(theta);
  let asc = wrap(Math.atan2(Math.cos(theta), -Math.sin(theta) * cosine - tangent * sine) / rad);
  const cusps = Array(12);
  const polar = Math.abs(lat) >= 90 - epsDeg;
  if (polar && wrap(asc-mc)>180) asc=wrap(asc+180);
  cusps[0]=asc; cusps[9]=mc;
  if (polar) {
    const lower = wrap(mc+180-asc);
    const upper = wrap(asc-mc);
    cusps[1]=wrap(asc+lower/3); cusps[2]=wrap(asc+2*lower/3);
    cusps[10]=wrap(mc+upper/3); cusps[11]=wrap(mc+2*upper/3);
  } else {
    // Each intermediate cusp divides the semi-diurnal arc into three.
    const divide = fraction => {
      let lo=-Math.PI, hi=Math.PI;
      for (let i=0;i<45;i++) {
        const hour=(lo+hi)/2;
        const lambda=longitude(theta-hour)*rad;
        const declination=Math.asin(sine*Math.sin(lambda));
        const semiArc=Math.acos(Math.max(-1,Math.min(1,-tangent*Math.tan(declination))));
        if (hour < fraction*semiArc) lo=hour; else hi=hour;
      }
      return longitude(theta-(lo+hi)/2);
    };
    cusps[10]=divide(-1/3); cusps[11]=divide(-2/3);
    cusps[1]=wrap(divide(2/3)+180); cusps[2]=wrap(divide(1/3)+180);
  }
  for (const i of [0,1,2,9,10,11]) cusps[(i+6)%12]=wrap(cusps[i]+180);
  return {asc,mc,cusps,house:polar?'ポーフィリー':'プラシーダス'};
}
export function placidusHouses(thetaDeg, epsDeg, latitude, longitude) {
  if (![thetaDeg,epsDeg,latitude,longitude].every(Number.isFinite) || latitude <= -90 || latitude >= 90 || longitude < -180 || longitude > 180 || epsDeg <=0 || epsDeg >=30) throw new RangeError('Invalid earth orientation or location');
  return houses(thetaDeg,epsDeg,latitude,longitude);
}
