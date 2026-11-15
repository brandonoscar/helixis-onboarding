# Photos

Every photo in this folder, where it came from, and why the site may use it.
`src/sidePhoto.test.ts` fails if a photo the sign-up page shows has no section here.

## upper-east-side-brownstone.jpg

- **What:** "Brownstone apartment, Manhattan's Upper East Side, New York, New York", a stoop and
  facade with window boxes. No people, signs or house numbers.
- **By:** Carol M. Highsmith.
- **Licence:** Public domain. Highsmith gave her archive to the Library of Congress with no
  restriction on use. No credit is owed. The Library asks for this one, and the page gives it:
  "Photo: Carol M. Highsmith, Library of Congress".
- **Library of Congress:** https://www.loc.gov/item/2011632000/ (Carol M. Highsmith Archive,
  Prints and Photographs Division).
- **Copy used:** Wikimedia Commons' 960-pixel JPEG of the Library's file,
  https://commons.wikimedia.org/wiki/File:Brownstone_apartment,_Manhattan%27s_Upper_East_Side,_New_York,_New_York_LCCN2011632000.tif.
  The file was re-encoded smaller and not otherwise changed. The page mirrors it, lightens it
  and fades it into the page with CSS (`.ob-side-photo` in `src/App.tsx`).
- **Used on:** the sign-up page's side panel (`/start`, `SIDE_PHOTO` in `src/App.tsx`), 2026-11-07;
  and the home page's first screen, behind the rent roll (`PHOTOS.stoop` in `src/Landing.tsx`),
  2026-11-15, with the same credit under it.

## soho-fire-escapes.jpg

- **What:** "Fire escapes on apartment buildings in Soho, New York, New York": cast-iron facades
  with their fire escapes, against a blue sky. No people, signs or house numbers.
- **By:** Carol M. Highsmith.
- **Licence:** Public domain, as above (the Carol M. Highsmith Archive at the Library of Congress,
  given with no restriction on use). The page credits it: "Fire escapes in Soho. Photo: Carol M.
  Highsmith, Library of Congress".
- **Library of Congress:** https://www.loc.gov/item/2011630656/ (Carol M. Highsmith Archive,
  Prints and Photographs Division).
- **Copy used:** Wikimedia Commons' 3,840-pixel JPEG of the Library's file,
  https://commons.wikimedia.org/wiki/File:Fire_escapes_on_apartment_buildings_in_Soho,_New_York,_New_York_LCCN2011630656.tif,
  which Commons marks Public domain. Scaled to 1,400 pixels wide and re-encoded smaller, not
  otherwise changed.
- **Used on:** the home page, beside "Trust accounting that ties out." (`PHOTOS.soho` in
  `src/Landing.tsx`), 2026-11-15.
