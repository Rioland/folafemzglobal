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

## Known problem elsewhere

`public/images/sedan-blue.jpg` is a **BMW 3-Series** and
`public/images/sedan-silver.jpg` a **Hyundai Sonata**, and both are currently
the photos on the live **Toyota Camry** cards. `premium-black.jpg` is a Corvette
and `premium-front.jpg` an Audi R8. These predate the fleet expansion and are
still in place — worth fixing with real photographs of the actual fleet.
