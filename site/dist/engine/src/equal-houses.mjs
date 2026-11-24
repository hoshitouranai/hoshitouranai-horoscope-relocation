import {wrap360,zodiacPosition} from './angles.mjs';

function housesFrom(start,house,asc,mc) {
  return {
    asc,mc,house,
    cusps:Array.from({length:12},(_,i)=>wrap360(start+30*i)),
  };
}

export function wholeSignHouses(asc,mc) {
  return housesFrom(zodiacPosition(asc).signIndex*30,'ホールサイン',wrap360(asc),mc);
}

export function naturalHouses() {
  return housesFrom(0,'ナチュラルハウス');
}

export function sunSignHouses(sunLongitude) {
  return housesFrom(zodiacPosition(sunLongitude).signIndex*30,'サンサイン・ハウス');
}

export function equalHouses(asc,mc) {
  zodiacPosition(asc);
  return housesFrom(wrap360(asc),'イコールハウス',wrap360(asc),mc);
}
