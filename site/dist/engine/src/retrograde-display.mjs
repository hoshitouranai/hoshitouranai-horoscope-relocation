export const RETROGRADE_MARK = 'R';
export const RETROGRADE_COLOR = '#a6212d';

export function retrogradeGlyph(glyph, retrograde) {
  return retrograde === true ? glyph + 'ᴿ' : glyph;
}

// Positions are offsets from the badge center, in its drawing units.
export function retrogradeBadgeLayout(half, retrograde, dial = false) {
  if (retrograde !== true) {
    return { glyphY: 0, glyphSize: half * (dial ? 1.55 : 1.48), mark: null };
  }
  return {
    glyphY: -half * (dial ? .35 : .36),
    glyphSize: half * 1.25,
    mark: { text: RETROGRADE_MARK, y: half * .55, size: half * (dial ? .75 : .65) },
  };
}
