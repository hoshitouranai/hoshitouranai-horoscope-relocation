import {wrap360} from './angles.mjs';
const TO_RAD = Math.PI / 180;
const TO_DEG = 180 / Math.PI;

/**
 * Regiomontanus house cusps. ARMC (local sidereal right ascension of MC),
 * true or mean obliquity, geodetic latitude in DEGREES. Longitude is NOT
 * an argument here: it must already be included in ARMC.
 *
 * Uses equator divisions in 30-degree steps projected through north/south
 * horizon points, not the Placidus semi-arc algorithm.
 *
 * For the polar circles, this implementation deliberately throws rather
 * than silently assume the Swiss-Ephemeris polar-flip convention.
 */
export function regiomontanusHouses(armcDeg, obliquityDeg, latitudeDeg) {
  if (![armcDeg,obliquityDeg,latitudeDeg].every(Number.isFinite) ||
      obliquityDeg <= 0 || obliquityDeg >= 30 ||
      latitudeDeg <= -90 || latitudeDeg >= 90) {
    throw new RangeError('Invalid ARMC, obliquity, or geographic latitude');
  }
  if (Math.abs(latitudeDeg) >= 90-obliquityDeg) {
    throw new RangeError('Regiomontanus polar-circle handling not yet verified');
  }
  const armc=wrap360(armcDeg)*TO_RAD;
  const eps=obliquityDeg*TO_RAD;
  const phi=latitudeDeg*TO_RAD;
  const cusp=(offsetDeg, poleFactor) => {
    const a=armc+offsetDeg*TO_RAD;
    const poleTan=Math.tan(phi)*poleFactor;
    return wrap360(Math.atan2(Math.sin(a), Math.cos(a)*Math.cos(eps)-poleTan*Math.sin(eps))*TO_DEG);
  };
  const asc=wrap360(Math.atan2(Math.cos(armc),
    -Math.sin(armc)*Math.cos(eps)-Math.tan(phi)*Math.sin(eps))*TO_DEG);
  const mc=wrap360(Math.atan2(Math.sin(armc), Math.cos(armc)*Math.cos(eps))*TO_DEG);
  const cusps=Array(12);
  cusps[0]=asc;
  cusps[9]=mc;
  cusps[10]=cusp(30,0.5);
  cusps[11]=cusp(60,Math.sqrt(3)/2);
  cusps[1]=cusp(120,Math.sqrt(3)/2);
  cusps[2]=cusp(150,0.5);
  for(const i of [0,1,2,9,10,11]) cusps[(i+6)%12]=wrap360(cusps[i]+180);
  return {asc,mc,cusps,house:'レギオモンタヌス',system:'Regiomontanus',polarFallback:false};
}

/** Convert Greenwich sidereal time theta + east-positive geographic longitude. */
export function regiomontanusHousesFromGreenwich(thetaDeg, obliquityDeg, latitudeDeg, longitudeDeg) {
  if (!Number.isFinite(longitudeDeg) || longitudeDeg < -180 || longitudeDeg > 180)
    throw new RangeError('Invalid geographic longitude');
  return regiomontanusHouses(wrap360(thetaDeg+longitudeDeg),obliquityDeg,latitudeDeg);
}
