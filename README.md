# HOSHITOURANAI Relocation Chart

Release source for v1.0.0. Compare natal and relocated charts, including
house cusps, angles and selected celestial points. The browser computes
the comparison and exports a 1920 × 1080 PNG.

## Build and verify

Use Python 3.12 or later. Keep the three input archives inside `inputs/`
as supplied. The build verifies the input archive hashes and the list
and SHA-256 of all 466 static output files.

```sh
python3 restore.py restored
python3 -m http.server 8000 --directory restored/dist
```

Open http://127.0.0.1:8000/ in a browser. Restore into a fresh directory
on each build. The Cloudflare Pages output directory for a dedicated
project is `restored/dist`.

The integration test requires Node.js and `@napi-rs/canvas` 0.1.100:

```sh
node restored/tests/relocation-preview.mjs restored/dist
```

The checks cover charts, time and location inputs, aspect modes,
retrograde marks, house systems, house cusps and PNG encoding. Device
behavior for the simulated browser controls requires separate testing.

## Source and notices

The base is the HOSHITOURANAI Common Engine v1.3.0 LOCKED input kit.
Source, reproducible data inputs and their notices are bundled in
`inputs/`; the relocation application and derived-data scripts are
in `site/`. See `LICENSE` and
`site/dist/engine/SWISS-LICENSE.txt`. Source and deployed assets should
identify the same revision. The HOSHITOURANAI name and logo are brand
assets.
