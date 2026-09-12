#!/usr/bin/env python3
"""Generate mathematically valid ASCII STL models for the PBX-36 Modular Ultra.

Strategy (slicer-safe, manifold-guaranteed):
- Every part is emitted as its own CLOSED solid (each edge shared by exactly
  two facets, outward orientation auto-fixed by signed-volume check).
- Chassis: open-top enclosure assembled from volumetrically OVERLAPPING
  closed boxes/prisms -> boolean union in any slicer, no coplanar-touch risk.
- Front panel: plate tiled by overlapping boxes AROUND exact openings, plus
  "frame ring" solids (rectangular rings / circular annuli) that carry the
  exact cutout walls. All junctions overlap volumetrically; openings stay
  dimensionally exact (rect holes pre-compensated +0.3 mm/side for the
  intentional 0.3 mm overlap intrusion).

Units: millimetres. Origin: plate/chassis corner.
Run:  python3 scripts/generate_models.py
"""
import math
import os

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                       "public", "downloads")

# ---------------------------------------------------------------- mesh core
class Solid:
    def __init__(self, name, expected=None):
        self.name = name
        self.tris = []  # list of (a, b, c) each a 3-tuple
        self.expected = expected  # analytic volume for verification

    def add(self, a, b, c):
        self.tris.append((tuple(a), tuple(b), tuple(c)))

    def quad(self, a, b, c, d):
        self.add(a, b, c)
        self.add(a, c, d)

    def fix_orientation(self):
        """Flip all facets if signed volume is negative (=> inward normals)."""
        vol = 0.0
        for (a, b, c) in self.tris:
            vol += (a[0] * (b[1] * c[2] - b[2] * c[1])
                    - a[1] * (b[0] * c[2] - b[2] * c[0])
                    + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6.0
        if vol < 0:
            self.tris = [(a, c, b) for (a, b, c) in self.tris]
        return vol

    def check_manifold(self):
        """Every edge must be shared by exactly 2 facets."""
        edges = {}
        for (a, b, c) in self.tris:
            for p, q in ((a, b), (b, c), (c, a)):
                key = tuple(sorted((
                    (round(p[0], 3), round(p[1], 3), round(p[2], 3)),
                    (round(q[0], 3), round(q[1], 3), round(q[2], 3)),
                )))
                edges[key] = edges.get(key, 0) + 1
        bad = [e for e, n in edges.items() if n != 2]
        assert not bad, f"{self.name}: {len(bad)} non-manifold edges"
        return True


def normal(a, b, c):
    ux, uy, uz = b[0] - a[0], b[1] - a[1], b[2] - a[2]
    vx, vy, vz = c[0] - a[0], c[1] - a[1], c[2] - a[2]
    nx, ny, nz = uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx
    L = math.sqrt(nx * nx + ny * ny + nz * nz) or 1.0
    return (nx / L, ny / L, nz / L)


def box(s, x0, y0, z0, x1, y1, z1):
    # outward CCW winding (verified: normal == face outward axis)
    v = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),
         (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]
    s.quad(v[0], v[3], v[2], v[1])  # bottom (-z)
    s.quad(v[4], v[5], v[6], v[7])  # top (+z)
    s.quad(v[0], v[1], v[5], v[4])  # front (-y)
    s.quad(v[3], v[7], v[6], v[2])  # back (+y)
    s.quad(v[1], v[2], v[6], v[5])  # right (+x)
    s.quad(v[0], v[4], v[7], v[3])  # left (-x)
    if s.expected is None:
        s.expected = (x1 - x0) * (y1 - y0) * (z1 - z0)


def rot_x(p, ang, center):
    cx, cy, cz = center
    x, y, z = p[0] - cx, p[1] - cy, p[2] - cz
    c, sn = math.cos(ang), math.sin(ang)
    return (x + cx, cy + y * c - z * sn, cz + y * sn + z * c)


def tilted_box(s, cx, cy, cz, lx, ly, lz, angle_deg):
    """Closed box rotated about the X axis around its center."""
    pts = []
    for sx in (-lx / 2, lx / 2):
        for sy in (-ly / 2, ly / 2):
            for sz in (-lz / 2, lz / 2):
                pts.append(rot_x((cx + sx, cy + sy, cz + sz),
                                 math.radians(angle_deg), (cx, cy, cz)))
    # pts order: x in {0,1}, y in {0,1}, z in {0,1} -> index = ix*4+iy*2+iz
    def P(ix, iy, iz):
        return pts[ix * 4 + iy * 2 + iz]
    s.quad(P(0, 0, 0), P(0, 1, 0), P(1, 1, 0), P(1, 0, 0))
    s.quad(P(0, 0, 1), P(1, 0, 1), P(1, 1, 1), P(0, 1, 1))
    s.quad(P(0, 0, 0), P(1, 0, 0), P(1, 0, 1), P(0, 0, 1))
    s.quad(P(0, 1, 0), P(0, 1, 1), P(1, 1, 1), P(1, 1, 0))
    s.quad(P(1, 0, 0), P(1, 1, 0), P(1, 1, 1), P(1, 0, 1))
    s.quad(P(0, 0, 0), P(0, 0, 1), P(0, 1, 1), P(0, 1, 0))
    if s.expected is None:
        s.expected = lx * ly * lz


def ngon_prism(s, cx, cy, z0, z1, r, n=12, phase=0.0):
    ring0 = [(cx + r * math.cos(phase + 2 * math.pi * i / n),
              cy + r * math.sin(phase + 2 * math.pi * i / n), z0)
             for i in range(n)]
    ring1 = [(x, y, z1) for (x, y, _) in ring0]
    for i in range(n):
        j = (i + 1) % n
        s.quad(ring0[i], ring0[j], ring1[j], ring1[i])
    for i in range(1, n - 1):
        s.add(ring0[0], ring0[i + 1], ring0[i])
        s.add(ring1[0], ring1[i], ring1[i + 1])
    if s.expected is None:
        s.expected = n / 2 * math.sin(2 * math.pi / n) * r * r * (z1 - z0)


def annulus(s, cx, cy, z0, z1, r_in, r_out, n=48):
    """Flat ring (washer) extruded in Z. Closed genus-1 manifold."""
    def ring(r, z):
        return [(cx + r * math.cos(2 * math.pi * i / n),
                 cy + r * math.sin(2 * math.pi * i / n), z)
                for i in range(n)]
    o0, o1 = ring(r_out, z0), ring(r_out, z1)
    i0, i1 = ring(r_in, z0), ring(r_in, z1)
    for k in range(n):
        m = (k + 1) % n
        s.quad(o0[k], o0[m], o1[m], o1[k])  # outer wall
        s.quad(i0[k], i1[k], i1[m], i0[m])  # inner (hole) wall
        s.quad(o0[k], i0[k], i0[m], o0[m])  # bottom ring
        s.quad(o1[k], o1[m], i1[m], i1[k])  # top ring
    if s.expected is None:
        s.expected = (n / 2 * math.sin(2 * math.pi / n)
                      * (r_out * r_out - r_in * r_in) * (z1 - z0))


def rect_ring(s, ax0, ay0, ax1, ay1, bx0, by0, bx1, by1, z0, z1):
    """Rectangular frame: outer rect minus inner (hole) rect, extruded."""
    # top & bottom faces: 8 sub-strips so every edge matches exactly
    # (no T-junctions): 3 bottom + 3 top + left + right
    pieces = [((ax0, ay0), (bx0, by0)),   # bottom-left
              ((bx0, ay0), (bx1, by0)),   # bottom-mid (under hole)
              ((bx1, ay0), (ax1, by0)),   # bottom-right
              ((ax0, by1), (bx0, ay1)),   # top-left
              ((bx0, by1), (bx1, ay1)),   # top-mid (over hole)
              ((bx1, by1), (ax1, ay1)),   # top-right
              ((ax0, by0), (bx0, by1)),   # left
              ((bx1, by0), (ax1, by1))]   # right
    for z, flip in ((z1, False), (z0, True)):
        for (px0, py0), (px1, py1) in pieces:
            p = [(px0, py0, z), (px1, py0, z), (px1, py1, z), (px0, py1, z)]
            if flip:
                s.quad(p[0], p[3], p[2], p[1])
            else:
                s.quad(p[0], p[1], p[2], p[3])
    # walls: outer walls subdivided to match the face strips exactly
    def wall_quad(p0, p1, outward):
        if outward:
            s.quad((p0[0], p0[1], z0), (p1[0], p1[1], z0),
                   (p1[0], p1[1], z1), (p0[0], p0[1], z1))
        else:
            s.quad((p1[0], p1[1], z0), (p0[0], p0[1], z0),
                   (p0[0], p0[1], z1), (p1[0], p1[1], z1))
    xsegs = [(ax0, bx0), (bx0, bx1), (bx1, ax1)]
    ysegs = [(ay0, by0), (by0, by1), (by1, ay1)]
    for sx0, sx1 in xsegs:
        wall_quad((sx0, ay0), (sx1, ay0), True)   # outer bottom (+x run)
        wall_quad((sx1, ay1), (sx0, ay1), True)   # outer top (-x run)
    for sy0, sy1 in ysegs:
        wall_quad((ax0, sy1), (ax0, sy0), True)   # outer left (-y run)
        wall_quad((ax1, sy0), (ax1, sy1), True)   # outer right (+y run)
    # inner (hole) walls: single quads, already edge-matched
    for (rx0, ry0, rx1, ry1) in ((bx0, by0, bx1, by1),):
        c = [(rx0, ry0), (rx1, ry0), (rx1, ry1), (rx0, ry1)]
        for k in range(4):
            wall_quad(c[k], c[(k + 1) % 4], False)
    if s.expected is None:
        s.expected = ((ax1 - ax0) * (ay1 - ay0)
                      - (bx1 - bx0) * (by1 - by0)) * (z1 - z0)


# ------------------------------------------------------------- chassis model
def build_chassis():
    solids = []

    def part(name):
        s = Solid(name)
        solids.append(s)
        return s

    # floor 200 x 140 x 4
    box(part("floor"), 0, 0, 0, 200, 140, 4)
    # walls (3 mm), full height 80, overlapping floor + corners
    box(part("wall_front"), 0, 0, 0, 200, 3, 80)
    box(part("wall_back"), 0, 137, 0, 200, 140, 80)
    box(part("wall_left"), 0, 0, 0, 3, 140, 80)
    box(part("wall_right"), 197, 0, 0, 200, 140, 80)
    # 4x mounting standoffs with blind M3 pilot bore (tube embedded in floor)
    for i, (sx, sy) in enumerate([(15, 15), (185, 15), (15, 125), (185, 125)]):
        annulus(part(f"standoff_{i}"), sx, sy, 3.0, 13.0, 1.6, 4.0, n=12)
    # battery bay divider ribs (10S pack zone)
    box(part("rib_left"), 20, 32, 3, 24, 108, 26)
    box(part("rib_right"), 176, 32, 3, 180, 108, 26)
    box(part("batt_stop"), 24, 100, 3, 176, 104, 14)
    # WAGO 221 bracket rails
    box(part("wago_rail_a"), 50, 116, 3, 150, 120, 12)
    box(part("wago_rail_b"), 50, 130, 3, 150, 134, 12)
    # 15 A blade-fuse perch
    box(part("fuse_perch"), 160, 60, 3, 185, 80, 14)
    # side ventilation louvers: tilted slats passing through front/back walls
    idx = 0
    for ywall in (1.5, 138.5):
        for zi, zc in enumerate(range(25, 66, 8)):
            for xc in range(25, 176, 21):
                tilted_box(part(f"louver_{idx}"), xc, ywall, zc,
                           14, 6, 2, 35)
                idx += 1
    return solids


# --------------------------------------------------------- front panel model
PANEL_W, PANEL_H, PANEL_T = 200.0, 140.0, 4.0
INTR = 0.3      # tiling intrusion into openings (volumetric overlap)
OV = 0.6        # tiling box expansion for guaranteed union


def build_front_panel():
    # (kind, params) -- rects drawn PRE-COMPENSATED +INTR per side
    rects = [
        ("voltmeter", 105 - INTR, 87 - INTR, 150 + INTR, 113 + INTR),
        ("usb", 105 - INTR, 60 - INTR, 137 + INTR, 75 + INTR),
        ("xt60", 150 - INTR, 60 - INTR, 166 + INTR, 70 + INTR),
    ]
    circles = [  # (name, cx, cy, r_intended)
        ("start", 40, 100, 8.0),
        ("stop", 75, 100, 8.0),
        ("socket220", 60, 45, 20.0),
        ("m3_bl", 10, 10, 1.6),
        ("m3_br", 190, 10, 1.6),
        ("m3_tl", 10, 130, 1.6),
        ("m3_tr", 190, 130, 1.6),
    ]
    solids = []

    def part(name):
        s = Solid(name)
        solids.append(s)
        return s

    # ---- frame rings carry the EXACT cutout walls
    FRAME_W = 3.5
    for name, x0, y0, x1, y1 in rects:
        rect_ring(part(f"frame_{name}"),
                  x0 - FRAME_W, y0 - FRAME_W, x1 + FRAME_W, y1 + FRAME_W,
                  x0, y0, x1, y1, 0, PANEL_T)
    circ = []
    for name, cx, cy, r in circles:
        Rd = r + INTR
        Ro = Rd + 6.0
        n = 64 if r >= 8 else 20
        annulus(part(f"frame_{name}"), cx, cy, 0, PANEL_T, Rd, Ro, n=n)
        circ.append((name, cx, cy, Rd, Ro))

    # ---- layout separation asserts (frames must not collide)
    def rects_overlap(a, b, m=1.0):
        return not (a[2] + m < b[0] or b[2] + m < a[0]
                    or a[3] + m < b[1] or b[3] + m < a[1])
    frame_rects = []
    for name, x0, y0, x1, y1 in rects:
        frame_rects.append((name, (x0 - FRAME_W, y0 - FRAME_W,
                                   x1 + FRAME_W, y1 + FRAME_W)))
    for name, cx, cy, Rd, Ro in circ:
        frame_rects.append((name, (cx - Ro, cy - Ro, cx + Ro, cy + Ro)))
    for i in range(len(frame_rects)):
        for j in range(i + 1, len(frame_rects)):
            assert not rects_overlap(frame_rects[i][1], frame_rects[j][1]), \
                f"frame collision: {frame_rects[i][0]} x {frame_rects[j][0]}"
    for name, (ax0, ay0, ax1, ay1) in frame_rects:
        assert ax0 >= 0 and ay0 >= 0 and ax1 <= PANEL_W and ay1 <= PANEL_H, \
            f"frame {name} outside plate"

    # ---- tiling: scanline bands; boxes overlap each other + frames
    ycuts = {0.0, PANEL_H}
    for _, x0, y0, x1, y1 in rects:
        ycuts.add(y0 + INTR)
        ycuts.add(y1 - INTR)
    for _, cx, cy, Rd, Ro in circ:
        ycuts.add(cy - Ro)
        ycuts.add(cy + Ro)
        k = -int(Ro // 2) - 1
        while True:
            y = cy + 2.0 * k
            if y > cy + Ro:
                break
            if cy - Ro < y < cy + Ro:
                ycuts.add(round(y, 3))
            k += 1
    ys = sorted(ycuts)
    box_id = 0
    for bi in range(len(ys) - 1):
        ya, yb = ys[bi], ys[bi + 1]
        if yb - ya < 0.05:
            continue
        ymid = (ya + yb) / 2
        blocked = []
        for _, x0, y0, x1, y1 in rects:
            if y0 < ymid < y1:
                blocked.append((x0 + INTR, x1 - INTR))
        for _, cx, cy, Rd, Ro in circ:
            if cy - Rd < ymid < cy + Rd:
                # max circle half-width over this band + intrusion
                w = 0.0
                for yy in (ya, yb, ymid):
                    dd = abs(yy - cy)
                    if dd < Rd:
                        w = max(w, math.sqrt(Rd * Rd - dd * dd))
                E = w + 0.35
                # corner safety: blocked-square corners must stay in annulus
                for qy in (ya, yb):
                    rho = math.hypot(E, abs(qy - cy))
                    assert rho <= Ro - 0.3, f"circle band corner outside frame"
                blocked.append((cx - E, cx + E))
        # merge + complement -> open segments tiled with overlapping boxes
        blocked.sort()
        merged = []
        for a, b in blocked:
            if merged and a <= merged[-1][1] + 0.05:
                merged[-1][1] = max(merged[-1][1], b)
            else:
                merged.append([a, b])
        segs, cur = [], 0.0
        for a, b in merged:
            if a > cur + 0.05:
                segs.append((cur, a))
            cur = max(cur, b)
        if cur < PANEL_W - 0.05:
            segs.append((cur, PANEL_W))
        for sx0, sx1 in segs:
            box(part(f"tile_{box_id}"),
                max(0.0, sx0 - OV), max(0.0, ya - OV),
                0.0,
                min(PANEL_W, sx1 + OV), min(PANEL_H, yb + OV), PANEL_T)
            box_id += 1
    return solids


# ------------------------------------------------------------------ IO
def write_stl(path, solids, header):
    total = 0
    with open(path, "w") as f:
        for s in solids:
            vol = s.fix_orientation()
            assert vol > 0, f"{s.name}: zero volume"
            if s.expected:
                err = abs(vol - s.expected) / s.expected
                assert err < 0.02, f"{s.name}: volume {vol:.1f} != {s.expected:.1f}"
            s.check_manifold()
            f.write(f"solid {s.name}\n")
            for (a, b, c) in s.tris:
                n = normal(a, b, c)
                f.write(f"  facet normal {n[0]:.6e} {n[1]:.6e} {n[2]:.6e}\n"
                        f"    outer loop\n"
                        f"      vertex {a[0]:.4f} {a[1]:.4f} {a[2]:.4f}\n"
                        f"      vertex {b[0]:.4f} {b[1]:.4f} {b[2]:.4f}\n"
                        f"      vertex {c[0]:.4f} {c[1]:.4f} {c[2]:.4f}\n"
                        f"    endloop\n  endfacet\n")
                total += 1
            f.write(f"endsolid {s.name}\n")
    return total


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    chassis = build_chassis()
    n1 = write_stl(os.path.join(OUT_DIR, "pbx36-chassis.stl"), chassis,
                   "PBX-36 chassis")
    panel = build_front_panel()
    n2 = write_stl(os.path.join(OUT_DIR, "pbx36-front-panel.stl"), panel,
                   "PBX-36 front panel")
    s1 = os.path.getsize(os.path.join(OUT_DIR, "pbx36-chassis.stl"))
    s2 = os.path.getsize(os.path.join(OUT_DIR, "pbx36-front-panel.stl"))
    print(f"chassis: {len(chassis)} watertight solids, {n1} facets, {s1} bytes")
    print(f"panel:   {len(panel)} watertight solids, {n2} facets, {s2} bytes")
    print("ALL SOLIDS MANIFOLD-VERIFIED ✔")


if __name__ == "__main__":
    main()
