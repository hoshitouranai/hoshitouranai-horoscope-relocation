import {aspectsAt} from './aspects.mjs';
import {longitudeMidpoints} from './midpoint.mjs';
import {placidusHouses} from './houses.mjs';
import {wrap360} from './angles.mjs';

export function compositePoint(a,b) {
  const {midpoint,candidates} = longitudeMidpoints(a,b);
  return {longitude:midpoint ?? Math.min(...candidates),tied:midpoint === null};
}

export function compositeChart(first,second,latitude,obliquity) {
  const mc = compositePoint(first.mc,second.mc);
  const radians = Math.PI/180;
  const longitude = mc.longitude*radians;
  // Invert the engine's ecliptic longitude of the meridian.
  const armc = wrap360(Math.atan2(Math.sin(longitude)*Math.cos(obliquity*radians),Math.cos(longitude))/radians);
  const houses = placidusHouses(armc,obliquity,latitude,0);
  const planets = first.planets.map((planet,i)=>({name:planet.name,...compositePoint(planet.longitude,second.planets[i].longitude)}));
  const ties = [...(mc.tied ? ['MC'] : []),...planets.filter(planet=>planet.tied).map(planet=>planet.name)];
  return {...houses,ascendant:houses.asc,planets,ties,
    pairs:aspectsAt(planets.map(planet=>planet.longitude)).pairs,isComposite:true};
}
