# Fleet image provenance

Where each file in `public/images/fleet/` came from, so the licence position is
recoverable later without guesswork.

## Real photographs

All four are **CC0 or public domain**: free for commercial use, no attribution
required, no share-alike obligation. Authors are recorded as courtesy, not duty.
Sourced from Wikimedia Commons and cropped to the 1200×800 the fleet cards use.

| File | Source | Licence | Author |
|---|---|---|---|
| `toyota-corolla-2016.jpg` | Toyota Corolla (E170, North America)1.jpg | CC0 | Labeiorhuan |
| `toyota-rav4.jpg` | 2021 Toyota RAV4 PHV.jpg | CC0 | TTTNIS |
| `toyota-highlander.jpg` | 2008 Toyota Highlander.jpg | Public domain | IFCAR |
| `toyota-venza.jpg` | Toyota Venza UZ-spec spotted in Greater Manchester, UK 01.jpg | CC0 | MoCars |

The Corolla is an E170, the 2014–2019 generation, which is the right car for the
2016 listing — and it happens to have been photographed in Nigeria, Abuja plate
and all.

## Generated cards

The rest are placeholders generated from the brand palette and the FG monogram:
navy ground, gold rule, model name and seat count. They exist because no
correctly-badged free photograph was available, and a card that shows no car is
better than a photo of the wrong one.

- `toyota-corolla-2020.jpg` — no free photo of the E210 sedan (the 2020
  generation) exists under CC0; the free E210 images are hatchbacks and wagons.
- `kia-rio.jpg`, `kia-optima.jpg`, `kia-sportage.jpg`, `kia-sorento.jpg`

## Replacing any of these

Drop a real photograph at the same path. Nothing in `data/content.json` or the
components refers to how the image was made, so a swap needs no code change.
Roughly 1200×800 (3:2) keeps the cards uniform.

## The client's own photographs — now the primary source

Supplied by the client and used for ten fleet cards plus the gallery. Originals
live in `assets/fleet-originals/` — outside `public/`, so they stay in the repo
for future re-crops without being served to browsers.

Most are portrait phone shots. A 3:2 band cut from a 3:4 photo slices the
vehicle in half, so those are fitted whole with the gap filled by a blurred,
darkened blow-up of the same frame. Landscape sources are cropped normally.

| Card | Source | Vehicle |
|---|---|---|
| `toyota-camry-2014.jpg`, `toyota-camry-2010.jpg` | toyota camry.jpeg | Black Camry |
| `toyota-prado-2022.jpg` | toyota prado pilot.jpeg | Prado, Ondo plate |
| `lexus-gx-460.jpg` | 1000685880.jpeg | Lexus GX 460 |
| `lexus-lx-570.jpg` | 1000685921.jpeg | Lexus LX 570 |
| `toyota-corolla-2016.jpg` | 1000685915.jpeg | White Corolla, Ondo plate |
| `toyota-hiace-bus.jpg` | 1000685877.jpg | Hiace, Lagos plate |
| `toyota-hilux.jpg` | 1000685876.jpeg | White Hilux, light bar |
| `security-escort.jpg` | 1000685878.jpeg | Black Hilux TRD, police lights |
| `kia-sportage.jpg` | kia.jpeg | Black Kia Sportage |

Videos are in `public/video/`, moved out of `public/images/` because they are
not images.

## Resolved: the wrong-badge photos

`sedan-blue.jpg` (a BMW 3-Series) and `sedan-silver.jpg` (a Hyundai Sonata)
were the photos on the live Camry cards. Both Camry listings now carry the
client's actual Camry, and no vehicle references either file. They remain in
`public/images/` only because other page furniture may use them.

`premium-black.jpg` (a Corvette) and `premium-front.jpg` (an Audi R8) are still
unused by any vehicle.
