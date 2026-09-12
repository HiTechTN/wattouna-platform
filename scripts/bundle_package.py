#!/usr/bin/env python3
"""Bundle the PBX-36 fabrication package: STLs + wiring PDF + BOM.csv + README.
Run: python3 scripts/bundle_package.py"""
import os
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DL = os.path.join(ROOT, "public", "downloads")
ZIP = os.path.join(DL, "pbx36-complete-package.zip")

BOM_CSV = """part,reference,spec,qty,source_hint
MPPT boost module,LTC3780,18-36V in / 42.0V out / 160W max,1,Gotronic/Reichelt/AliExpress
USB-C PD module,IP2368,100W PD + 18W QC,1,AliExpress/Gotronic
P-MOSFET,IRF4905,Vds -55V / Rds 20mOhm,1,Rue d'Athenes/Mouser
Shunt reference,TL431,Vref 2.495V,1,Rue d'Athenes/Mouser
Trimmer,RV1,20k multiturn,1,Rue d'Athenes
Resistor R1,,82k 1% metal film,1,Rue d'Athenes
Resistor R2,,8.2k 1% metal film,1,Rue d'Athenes
Hysteresis resistor,Rhys,2.2M,1,Rue d'Athenes
Zener diode,,12V 500mW (gate clamp),1,Rue d'Athenes
Transistor PNP,2N3906,driver stage,1,Rue d'Athenes
Transistor NPN,2N2222A,driver stage,1,Rue d'Athenes
Buck converter,,12V 10A,1,Charguia/AliExpress
Mini inverter,,220V AC 150W peak,1,Charguia
Blade fuse,,15A automotive + holder,2,Sfax/Ariana
XT60 connectors,,male+female pairs with caps,3,Sousse/Moncef Bey
Lever connectors,WAGO 221,221-413/415 assortment x10,1,Charguia/Reichelt
Digital voltmeter,,DC 0-100V panel 45x26mm bezel,1,Ariana/AliExpress
Pushbutton START,,16mm green momentary NO,1,Rue d'Athenes
Pushbutton STOP,,16mm red momentary NC,1,Rue d'Athenes
220V socket,,panel mount 40mm,1,Charguia
Silicone wire AWG14,,red+black 2m each,1,Sfax
Hookup wire AWG20,,assorted colors 5m,1,Rue d'Athenes
Battery pack,10S Li-ion,36V recycled e-scooter 336Wh,1,Moncef Bey market
Enclosure (this STL),pbx36-chassis.stl,200x140x80mm PETG 0.2mm/30%,1,Print it
Faceplate (this STL),pbx36-front-panel.stl,200x140x4mm PETG,1,Print it
"""

README = """# PBX-36 Modular Ultra — Complete Fabrication Package (MIT open hardware)

## Contents
- `pbx36-chassis.stl` — rugged enclosure 200x140x80mm, 3mm walls, WAGO rails,
  10S battery bay, ventilation louvers. Every solid manifold-verified.
- `pbx36-front-panel.stl` — faceplate with exact cutouts: 2x 16mm pushbuttons,
  45x26mm voltmeter bezel, 32x15mm USB cutout, 16x10mm XT60 slot, 40mm 220V
  socket, 4x M3 mounting holes.
- `pbx36-wiring-guide.pdf` — A4 vector wiring blueprint (power chain, TL431
  divider, gate drive) + connection table + threshold math + safety checklist.
- `BOM.csv` — full bill of materials with Tunisian sourcing hints.

## Print settings (recommended)
- Material: PETG | Layer 0.2mm | Infill 30% gyroid | Walls: 4 | Top/bottom: 5
- Chassis prints open-side up, no supports (louvers are self-supporting at 35°).
- Faceplate prints flat, face down. Mount with 4x M3x12 + heat-set inserts.

## Electrical safety (read PDF first)
1. 15A blade fuse FIRST after battery+. Never bypass BMS or fuse.
2. Pre-set MPPT output to 42.0V before connecting the pack.
3. Calibrate RV1 for 31.00V cut-off; verify 0.00mA standby on mA range.
4. AWG 14 silicone for battery/solar; AWG 20 for logic/driver.

## Regenerate from source
`python3 scripts/generate_models.py && python3 scripts/generate_wiring_pdf.py \
  && python3 scripts/bundle_package.py`

Project home: https://github.com/HiTechTN/wattouna-platform
Live portal: https://wattouna.pages.dev
"""

with zipfile.ZipFile(ZIP, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for f in ("pbx36-chassis.stl", "pbx36-front-panel.stl",
              "pbx36-wiring-guide.pdf"):
        z.write(os.path.join(DL, f), f)
    z.writestr("BOM.csv", BOM_CSV)
    z.writestr("README.md", README)

size = os.path.getsize(ZIP)
print(f"package: {size} bytes -> {ZIP}")
# ASCII STL is highly redundant text: ~1.2MB raw routinely deflates to ~70KB
assert size > 30_000, "suspiciously small bundle"
with zipfile.ZipFile(ZIP) as z:
    bad = z.testzip()
    assert bad is None, f"corrupt member: {bad}"
    print("members:", ", ".join(f"{i.filename} ({i.file_size}B)" for i in z.infolist()))
print("ZIP INTEGRITY OK ✔")
