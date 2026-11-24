const PLACE_LABELS = Object.freeze({
  birth: '出生地',
  event: '開催地・対象地域',
  transit: '観測地',
});

export function chartPlaceLabel(context) {
  if (!Object.hasOwn(PLACE_LABELS, context)) throw new RangeError('Unknown chart location context');
  return PLACE_LABELS[context];
}

export const COMPOSITE_REFERENCE_PLACE_COPY = Object.freeze({
  label: 'コンポジットの基準地',
  help: '合成図のASC（上昇点）と12ハウスを計算するための地域です。ここで選ぶ地域によって、合成天体の位置やMCは変わりません。',
});
