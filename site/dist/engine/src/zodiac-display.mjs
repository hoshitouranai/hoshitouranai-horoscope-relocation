import {zodiacPosition} from './angles.mjs';

export const ZODIAC_GLYPHS = Object.freeze([...'♈♉♊♋♌♍♎♏♐♑♒♓']);
export const ZODIAC_COLORS = Object.freeze([
  '#ff3035','#00c06b','#ffdc53','#f69abe','#ffb23e','#8dc127',
  '#00cbd0','#cb141b','#8647fb','#505050','#33b7f4','#d99be8',
]);

export function zodiacGlyphStyle(signIndex, palette = ZODIAC_COLORS) {
  return {glyph:ZODIAC_GLYPHS[signIndex]+'\uFE0E', color:palette[signIndex]};
}

export function zodiacDegreeDisplay(longitude) {
  const {signIndex,degreesInSign} = zodiacPosition(longitude);
  const minutes = Math.floor(degreesInSign * 60);
  const degreeText = `${Math.floor(minutes/60)}°${String(minutes%60).padStart(2,'0')}′`;
  return {...zodiacGlyphStyle(signIndex),degreeText};
}
