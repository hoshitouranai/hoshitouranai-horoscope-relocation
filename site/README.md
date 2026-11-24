# HOSHITOURANAI relocation chart review

The relocation calculations use the pinned Common Engine v1.3.0 and the
existing yearly Lilith and asteroid data. The wheel is adapted from the
HOSHITOURANAI Horoscope Comparison single-chart renderer.

Source: https://github.com/hoshitouranai/hoshitouranai-horoscope-comparison/blob/main/dist/official-single.mjs
Upstream Git blob: `02d8d442b9eb1741d2e6eed03f00b0387b859823`.
The wheel-only crop and extra glyph support are local adaptations.
The table palette and header styles come from the common engine.

The aspect picker starts with no lines, offers single pairs grouped by
major and minor aspects, and provides the usual Show All button. Each
selected pair is drawn only in the wheels where it exists. The optional
extra-point switch applies the same classifier to selected extra points.
Serve `dist/` over HTTP. With Node.js and @napi-rs/canvas available,
`node tests/relocation-preview.mjs dist` verifies the canvas difference
with and without aspects, table glyphs and palette, location changes and
real 1920×1080 PNG encoding. PC and iPad Safari acceptance is separate.

The house selector offers Placidus (Porphyry fallback at polar latitudes),
Whole Sign, Equal, Solar and Natural. When the birth time is unknown,
the app uses local noon provisionally and limits choices to Solar and
Natural. Location-dependent chart angles and calculated points are
suppressed in those reference-house modes. The Moon and aspect results
remain provisional. The Finland presets use a derived timezone snapshot.
Reproduce that addition by running
`python3 research/extend-helsinki.py dist/engine/data/timezones_1900_2100.json`.

The header uses the original HOSHITOURANAI lockup image. Both wheel
panels use the original icon and approved serif lettering at lower left. The
wide PNG uses the same rendered wheel panels. An optional chart title
appears above both wheels and in the exported image. The Windows birth
date field reuses the shared Japanese keyboard date entry; iPad retains
the native date picker. Either location's coordinate button opens
manual coordinate fields, with a timezone required for birth location.

The wheel uses the original Single Chart house numbers and cusp lines.
The position and cusp panels share the Single Chart's warm paper, gold
rules and dark ink. Changed house numbers use bold text.

The cusp comparison table shows the selected house system's 12 house
starts, with the standard zodiac glyphs, colors, and degrees for each
location. The body-table filter does not affect the cusp table.

The picker selection applies to both wheels and the wide PNG.

The wheels and position table share the common engine's red R mark.
For the four asteroids and Mean/True Lilith, speed-sign transitions are
generated from direct Swiss Ephemeris longitude velocities across
1900–2100 JST. Angles and Fortune have no retrograde flag.
Rebuild the optional-point stations with
`python3 research/build-extra-stations.py /path/to/common-engine dist/points/extra-stations.json 4`.

The wide PNG is prepared when a chart is rendered or its title changes.
The existing comparison app's save helper provides a native desktop
download and iPad file sharing from the save gesture. The image can also
be opened directly. The smoke test checks the generated PNG, native link,
file sharing payload and fallback using a simulated DOM and navigator.
