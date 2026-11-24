import {wrap360} from './angles.mjs';
const RAD=Math.PI/180;
/** Geometric Sun center altitude, using the chart's ecliptic longitude and sidereal orientation.
 * Sidereal theta must be Greenwich sidereal angle in degrees; longitude is east-positive.
 * No atmospheric refraction, elevation, parallax, or topocentric corrections.
 */
export function solarGeometricAltitude(sunLongitudeDeg,thetaDeg,obliquityDeg,latitudeDeg,longitudeDeg) {
 if (![sunLongitudeDeg,thetaDeg,obliquityDeg,latitudeDeg,longitudeDeg].every(Number.isFinite)||Math.abs(latitudeDeg)>90||Math.abs(longitudeDeg)>180||obliquityDeg<=0||obliquityDeg>=30) throw new RangeError('Invalid astronomical orientation or location');
 const lambda=wrap360(sunLongitudeDeg)*RAD,eps=obliquityDeg*RAD,phi=latitudeDeg*RAD;
 const alpha=Math.atan2(Math.sin(lambda)*Math.cos(eps),Math.cos(lambda));
 const dec=Math.asin(Math.sin(eps)*Math.sin(lambda));
 const hourAngle=wrap360(thetaDeg+longitudeDeg)*RAD-alpha;
 const sinAlt=Math.sin(phi)*Math.sin(dec)+Math.cos(phi)*Math.cos(dec)*Math.cos(hourAngle);
 return Math.asin(Math.max(-1,Math.min(1,sinAlt)))/RAD;
}
/** Day when the geometric solar center is strictly above the mathematical horizon.
 * 0 altitude is assigned to night by convention. At a near-horizon band return uncertain.
 */
export function chartSect(chart,latitudeDeg,longitudeDeg,{horizonToleranceDeg=0.05}={}) {
 if(!chart||!Array.isArray(chart.bodies)||!chart.orientation)throw new TypeError('Chart with bodies and orientation required');
 if(!Number.isFinite(horizonToleranceDeg)||horizonToleranceDeg<0||horizonToleranceDeg>5)throw new RangeError('Invalid horizon tolerance');
 const sun=chart.bodies.find(x=>x.name==='太陽');
 if(!sun)throw new RangeError('Sun longitude missing from chart');
 const {theta,obliquity}=chart.orientation;
 const altitudeDeg=solarGeometricAltitude(sun.longitude,theta,obliquity,latitudeDeg,longitudeDeg);
 const uncertain=Math.abs(altitudeDeg)<=horizonToleranceDeg;
 return {sect:uncertain?null:(altitudeDeg>0?'day':'night'),altitudeDeg,uncertain,thresholdDeg:horizonToleranceDeg,definition:'geometric solar center relative to astronomical horizon; refraction excluded'};
}
