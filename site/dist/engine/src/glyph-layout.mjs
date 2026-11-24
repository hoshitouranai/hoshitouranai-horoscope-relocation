// Spread labels without changing the longitudes used for calculations.
export function spreadGlyphs(planets) {
  const sorted = planets.map((planet, index) => ({ planet, index, longitude: planet.longitude }))
    .sort((a, b) => a.longitude - b.longitude || a.index - b.index);
  if (sorted.length < 2) return sorted.map(({ planet, longitude }) => ({ planet, labelLongitude: longitude }));

  const count = sorted.length;
  const spacing = Math.min(11, 360 / count);
  let cut = 0;
  let largestGap = -1;
  for (let i = 0; i < count; i++) {
    const next = sorted[(i + 1) % count].longitude + (i === count - 1 ? 360 : 0);
    const gap = next - sorted[i].longitude;
    if (gap > largestGap) {
      cut = (i + 1) % count;
      largestGap = gap;
    }
  }

  const ordered = sorted.slice(cut).concat(sorted.slice(0, cut));
  const target = ordered.map(({ longitude }, i) => longitude + (i >= count - cut ? 360 : 0));
  // Pool groups until the label centers can preserve zodiac order and spacing.
  const groups = [];
  for (const [i, longitude] of target.entries()) {
    groups.push({ start: i, count: 1, sum: longitude - spacing * i });
    while (groups.length >= 2) {
      const right = groups.at(-1);
      const left = groups.at(-2);
      if (left.sum / left.count <= right.sum / right.count) break;
      left.count += right.count;
      left.sum += right.sum;
      groups.pop();
    }
  }
  const positions = groups.flatMap(({ start, count, sum }) =>
    Array.from({ length: count }, (_, i) => sum / count + spacing * (start + i)));
  const span = positions.at(-1) - positions[0];
  if (span > 360 - spacing) {
    const fraction = (360 - count * spacing) / (span - (count - 1) * spacing);
    const first = positions[0];
    for (let i = 1; i < count; i++) {
      positions[i] = first + i * spacing + fraction * (positions[i] - first - i * spacing);
    }
  }

  return ordered.map(({ planet }, i) => ({ planet, labelLongitude: (positions[i] % 360 + 360) % 360 }));
}
