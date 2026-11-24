import {longitudeMidpoints} from './midpoint.mjs';
import {shortestSeparation} from './angles.mjs';

export const dialAngle = longitude => ((longitude % 90) + 90) % 90;

export function midpointRows(planets, orb, dial, comparison) {
  return planets.flatMap((first,i) => planets.slice(i+1).map((second,offset) => {
    const j = i+offset+1;
    const result = longitudeMidpoints(first.longitude,second.longitude);
    const axis = result.candidates ?? [result.midpoint,result.opposite];
    const contacts = (comparison ?? planets).flatMap((planet,k) => {
      if (!comparison && (k === i || k === j)) return [];
      const distance = Math.min(...axis.map(angle => {
        const separation = shortestSeparation(planet.longitude,angle);
        return dial ? Math.abs(separation - Math.round(separation/90)*90) : separation;
      }));
      return distance <= orb + 1e-9 ? [{name:planet.name,distance}] : [];
    }).sort((a,b) => a.distance-b.distance);
    return {name:`${first.name} / ${second.name}`,axis,tied:result.midpoint === null,contacts};
  }));
}

export function pointerMatches(rows, angle, orb) {
  return [dialAngle(angle), dialAngle(angle+45)].map(target => ({
    target,
    matches: rows.map(row => {
      const folded = dialAngle(row.axis[0]);
      const delta = Math.abs(folded-target);
      return {row,folded,distance:Math.min(delta,90-delta)};
    }).filter(match=>match.distance<=orb+1e-9).sort((a,b)=>a.distance-b.distance),
  }));
}
