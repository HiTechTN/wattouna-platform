#!/usr/bin/env python3
"""Generate the PBX-36 A4 landscape vector wiring blueprint PDF (dark theme,
bilingual EN/AR) with fpdf2. Run: python3 scripts/generate_wiring_pdf.py"""
import os
import arabic_reshaper
from bidi.algorithm import get_display
from fpdf import FPDF

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "public", "downloads", "pbx36-wiring-guide.pdf")
AR_FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

BG = (13, 21, 39)
INK = (230, 237, 247)
MUT = (147, 164, 196)
AMBER = (245, 158, 11)
CYAN = (56, 189, 248)
GREEN = (34, 197, 94)
RED = (239, 68, 68)
GNDC = (148, 163, 184)
ORANGE = (245, 158, 11)
BLUE = (56, 189, 248)
PURPLE = (168, 85, 247)


def ar(t):
    return get_display(arabic_reshaper.reshape(t))


class BP(FPDF):
    def block(self, x, y, w, h, title, lines=(), accent=CYAN):
        self.set_fill_color(*BG)
        self.set_draw_color(*accent)
        self.set_line_width(0.6)
        self.rect(x, y, w, h, style="DF")
        self.set_fill_color(*accent)
        self.rect(x, y, w, 9, style="F")
        self.set_xy(x, y + 0.5)
        self.set_text_color(7, 12, 24)
        self.set_font("helvetica", "B", 9)
        self.cell(w, 8, title, align="C")
        self.set_text_color(*INK)
        self.set_font("helvetica", "", 7.5)
        yy = y + 11
        for ln in lines:
            self.set_xy(x + 2, yy)
            self.cell(w - 4, 4.2, ln)
            yy += 4.4

    def ar_text(self, x, y, w, t, size=11, color=INK):
        self.set_xy(x, y)
        self.set_text_color(*color)
        self.set_font("ar", "", size)
        self.cell(w, 7, ar(t), align="R")

    def wire(self, x1, y1, x2, y2, color, label="", lw=1.1, trot=0):
        self.set_draw_color(*color)
        self.set_line_width(lw)
        self.line(x1, y1, x2, y2)
        # arrowhead
        self.set_fill_color(*color)
        dx, dy = x2 - x1, y2 - y1
        import math
        L = math.hypot(dx, dy) or 1
        ux, uy = dx / L, dy / L
        s = 2.2
        self.polygon([(x2, y2), (x2 - ux * s - uy * s * .5, y2 - uy * s + ux * s * .5),
                      (x2 - ux * s + uy * s * .5, y2 - uy * s - ux * s * .5)], style="F")
        if label:
            self.set_font("helvetica", "B", 6.5)
            self.set_text_color(*color)
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2 - 3.2
            self.set_xy(mx - 20, my)
            self.cell(40, 4, label, align="C")


pdf = BP(orientation="L", format="A4")
pdf.set_auto_page_break(False)
pdf.add_font("ar", "", AR_FONT)
W, H = 297, 210

# ================= PAGE 1 : schematic =================
pdf.add_page()
pdf.set_fill_color(*BG)
pdf.rect(0, 0, W, H, style="F")
pdf.set_font("helvetica", "B", 16)
pdf.set_text_color(*AMBER)
pdf.set_xy(8, 6)
pdf.cell(200, 9, "PBX-36 Modular Ultra  -  Wiring Blueprint")
pdf.ar_text(180, 6, 109, "مخطط التوصيلات الكهربائية", 15, AMBER)
pdf.set_font("helvetica", "", 8)
pdf.set_text_color(*MUT)
pdf.set_xy(8, 15)
pdf.cell(200, 5, "36V zero-drain solar generator  |  10S Li-ion  |  cut-off 31.00V  |  charge 42.0V")

# legend
pdf.set_font("helvetica", "B", 8)
pdf.set_text_color(*INK)
pdf.set_xy(8, 22)
pdf.cell(30, 5, "Wire legend:")
lx = 42
for name, col in [("+36V RED", RED), ("GND BLACK", GNDC), ("LATCHED ORANGE", ORANGE),
                  ("+12V BLUE", BLUE), ("GATE PURPLE", PURPLE)]:
    pdf.set_fill_color(*col)
    pdf.rect(lx, 23, 7, 3, style="F")
    pdf.set_xy(lx + 8, 22)
    pdf.set_font("helvetica", "", 7.5)
    pdf.set_text_color(*INK)
    pdf.cell(34, 5, name)
    lx += 46

# --- solar row ---
pdf.block(8, 34, 52, 30, "SOLAR XT60 IN", ["Panel 18-36V", "up to 160W", "AWG 14"], AMBER)
pdf.block(70, 34, 52, 30, "MPPT BOOST", ["LTC3780 module", "OUT: 42.0V", "eff ~90%"], AMBER)
pdf.block(132, 34, 56, 30, "BATTERY 10S XT60", ["36V nom / 42V full", "336Wh usable", "recycled e-scooter"], GREEN)
pdf.wire(60, 49, 70, 49, RED, "RED AWG14", 1.4)
pdf.wire(122, 49, 132, 49, RED, "RED AWG14", 1.4)

# --- power row ---
pdf.block(8, 76, 52, 34, "15A BLADE FUSE", ["on BATT+ lead", "first component!", "AWG 14"], RED)
pdf.block(70, 76, 56, 34, "IRF4905 P-MOSFET", ["S: fused BATT+", "G: gate (purple)", "D: latched bus"], PURPLE)
pdf.block(136, 76, 52, 34, "LATCHED BUS", ["ORANGE rail", "feeds all loads", "0.00mA when OFF"], ORANGE)
pdf.wire(60, 93, 70, 93, RED, "RED AWG14", 1.4)
pdf.wire(126, 93, 136, 93, ORANGE, "ORANGE AWG14", 1.4)

# --- load branches ---
pdf.block(198, 34, 52, 30, "BUCK 12V/10A", ["IN: orange bus", "OUT: blue 12V rail", "router + LED"], BLUE)
pdf.block(198, 76, 52, 30, "USB-C PD 100W", ["IP2368 module", "laptop + phone", "AWG 20"], BLUE)
pdf.block(198, 118, 52, 30, "MINI INVERTER", ["220V AC out", "TV ~60W", "fused input"], BLUE)
pdf.wire(188, 88, 198, 49, ORANGE, "", 1.0)
pdf.wire(188, 93, 198, 91, ORANGE, "", 1.0)
pdf.wire(188, 98, 198, 133, ORANGE, "", 1.0)

# --- control row ---
pdf.block(8, 124, 62, 40, "TL431 SENSE DIVIDER", ["R1 82k / RV1 20k / R2 8.2k",
                                                  "Vref = 2.495V", "trip = 31.00V"], CYAN)
pdf.block(80, 124, 52, 40, "DRIVER PAIR", ["2N3906 PNP", "2N2222A NPN", "AWG 20 logic"], PURPLE)
pdf.block(142, 124, 46, 40, "GATE CLAMP", ["Zener 12V G-S", "Rhys 2.2M", "0.45V window"], PURPLE)
pdf.wire(70, 144, 80, 144, PURPLE, "PURPLE AWG20", 1.0)
pdf.wire(132, 144, 142, 144, PURPLE, "", 1.0)
pdf.wire(165, 124, 165, 110, PURPLE, "", 1.0)
pdf.wire(30, 124, 30, 110, RED, "sense", 0.8)
pdf.wire(30, 110, 70, 110, RED, "", 0.8)

# --- buttons ---
pdf.block(198, 160, 52, 30, "START/STOP", ["START: green NO", "STOP: red NC", "momentary"], GREEN)
pdf.wire(106, 160, 106, 144, PURPLE, "", 0.8)
pdf.wire(106, 160, 224, 160, PURPLE, "", 0.8)

pdf.ar_text(8, 192, 281, "الأحمر +36V والأسود GND بسماكة AWG 14 للبطارية والشمسي، والمنطق AWG 20 — الفيوز 15A أول عنصر بعد البطارية دائمًا", 11, MUT)

# ================= PAGE 2 : tables =================
pdf.add_page()
pdf.set_fill_color(*BG)
pdf.rect(0, 0, W, H, style="F")
pdf.set_font("helvetica", "B", 15)
pdf.set_text_color(*AMBER)
pdf.set_xy(8, 6)
pdf.cell(200, 9, "PBX-36  -  Connection Table, Threshold Math & Safety")
pdf.ar_text(180, 6, 109, "جدول التوصيلات والحسابات والسلامة", 14, AMBER)

# connection table
pdf.set_font("helvetica", "B", 8)
pdf.set_text_color(7, 12, 24)
pdf.set_fill_color(*CYAN)
cols = [("FROM", 62), ("TO", 62), ("WIRE", 52), ("AWG", 30), ("NOTE", 83)]
x = 8
pdf.set_xy(x, 20)
for title, w in cols:
    pdf.cell(w, 7, title, border=0, fill=True)
    x += w
rows = [
    ("Solar XT60+", "MPPT IN+", "RED", "14", "panel 18-36V"),
    ("Solar XT60-", "MPPT IN-", "BLACK", "14", "common GND"),
    ("MPPT OUT+", "Battery XT60+", "RED", "14", "42.0V charge"),
    ("Battery XT60+", "15A Fuse IN", "RED", "14", "first element!"),
    ("Fuse OUT", "IRF4905 Source", "RED", "14", "fused rail"),
    ("IRF4905 Drain", "Latched bus", "ORANGE", "14", "switched rail"),
    ("Batt+ sense", "R1 82k top", "RED", "20", "divider tap"),
    ("TL431 K/A", "2N3906 base", "PURPLE", "20", "trip signal"),
    ("2N2222A C", "MOSFET Gate", "PURPLE", "20", "gate drive"),
    ("Zener 12V", "Gate-Source", "PURPLE", "20", "Vgs clamp"),
    ("Latched bus", "Buck / USB / Inv", "ORANGE", "14/20", "via branch fuses"),
    ("All returns", "Battery XT60-", "BLACK", "14", "star GND"),
]
pdf.set_font("helvetica", "", 7.5)
y = 27
for r in rows:
    x = 8
    pdf.set_text_color(*INK)
    if (y // 7) % 2 == 0:
        pdf.set_fill_color(20, 30, 55)
        for (val, w) in zip(r, [c[1] for c in cols]):
            pdf.set_xy(x, y)
            pdf.cell(w, 6.5, val, fill=True)
            x += w
    else:
        for (val, w) in zip(r, [c[1] for c in cols]):
            pdf.set_xy(x, y)
            pdf.cell(w, 6.5, val)
            x += w
    y += 6.5

# threshold math + safety
pdf.set_fill_color(20, 30, 55)
pdf.rect(8, y + 4, 281, 62, style="F")
pdf.set_text_color(*GREEN)
pdf.set_font("helvetica", "B", 9)
pdf.set_xy(12, y + 7)
pdf.cell(273, 6, "Cut-off math:  Vtrip = 2.495V x (1 + (R1+RV1)/R2)  =  2.495 x (1 + 102k/8.2k)  =  31.00V   |   Hysteresis Rhys 2.2M -> 0.45V window")
pdf.set_text_color(*INK)
pdf.set_font("helvetica", "", 8)
checks = [
    "1. Set MPPT output to 42.0V BEFORE connecting the battery.   2. Calibrate RV1 so cut-off trips at 31.00V on a variable supply.",
    "3. Verify 0.00 mA standby on the mA range after STOP.   4. 15A fuse stays inline - never bypass BMS or fuse.",
    "5. Battery/solar wiring AWG 14 silicone; logic/driver AWG 20.   6. All high-current joints via WAGO 221 - no solder on power path.",
]
yy = y + 16
for c in checks:
    pdf.set_xy(12, yy)
    pdf.cell(273, 6, c)
    yy += 8
pdf.ar_text(8, y + 48, 281, "قِس مرتين وشغّل مرة واحدة — السلامة أولًا", 12, AMBER)

pdf.set_font("helvetica", "", 7)
pdf.set_text_color(*MUT)
pdf.set_xy(8, 200)
pdf.cell(281, 5, "Wattouna open hardware (MIT) - https://github.com/HiTechTN/wattouna-platform - generated vector blueprint, print at 100% scale")

pdf.output(OUT)
import os as _o
print(f"wiring guide: {_o.path.getsize(OUT)} bytes -> {OUT}")
