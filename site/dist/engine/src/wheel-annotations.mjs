import {wrap360,zodiacPosition} from './angles.mjs';

const ANGLES = [['ASC','asc',0],['MC','mc',0],['DSC','asc',180],['IC','mc',180]];

/** Geometry shared by Canvas and SVG. point() uses the caller's wheel origin. */
export function degreeTicks(point,radius,scale=1) {
  return Array.from({length:360},(_,longitude)=>{
    const length=longitude%10===0?12:longitude%5===0?8:4;
    return {longitude,length,from:point(longitude,radius),to:point(longitude,radius-length*scale),
      width:(longitude%10===0?1.15:.55)*scale};
  });
}

export function angleMarkers({asc,mc},point,outerRadius,scale=1) {
  const coordinates={asc,mc};
  return ANGLES.map(([name,key,delta])=>{
    const longitude=wrap360(coordinates[key]+delta);
    const {signIndex,degreesInSign}=zodiacPosition(longitude);
    const arcMinutes=Math.floor(degreesInSign*60);
    const degreeText=`${Math.floor(arcMinutes/60)}°${String(arcMinutes%60).padStart(2,'0')}′`;
    const guideStart=point(longitude,outerRadius+11*scale);
    return {name,longitude,signIndex,degreeText,guideStart,
      triangle:[point(longitude,outerRadius+2*scale),
        point(longitude-1,outerRadius+11*scale),point(longitude+1,outerRadius+11*scale)]};
  });
}
