export type Gap = { start: number; end: number };

export type DetectOptions = {
  /** 0-255 tolerance for treating a row as flat/uniform */
  tolerance: number;
  /** minimum height in px of a resulting section */
  minSection: number;
  /** minimum number of flat rows to be considered a divider */
  minGap: number;
};

export const defaultOptions: DetectOptions = {
  tolerance: 10,
  minSection: 120,
  minGap: 6,
};

/** Mean absolute horizontal luminance change per row ("busy-ness" of a row). */
export function rowEnergies(data: ImageData): Float32Array {
  const { width, height } = data;
  const px = data.data;
  const out = new Float32Array(height);
  for (let y = 0; y < height; y++) {
    const row = y * width * 4;
    let sum = 0;
    let n = 0;
    let prev = -1;
    for (let x = 0; x < width; x += 1) {
      const i = row + x * 4;
      const lum = (px[i] * 299 + px[i + 1] * 587 + px[i + 2] * 114) / 1000;
      if (prev >= 0) {
        sum += Math.abs(lum - prev);
        n++;
      }
      prev = lum;
    }
    out[y] = n ? sum / n : 0;
  }
  return out;
}

function percentile(sorted: Float32Array, p: number) {
  const i = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)));
  return sorted[i];
}

/**
 * Page background color, estimated from the outer left/right margins where no
 * card is ever drawn.
 */
function backgroundColor(data: ImageData): [number, number, number] {
  const { width, height, data: px } = data;
  const xs = [1, 2, width - 3, width - 2].filter((x) => x >= 0 && x < width);
  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 400))) {
    for (const x of xs) {
      const i = (y * width + x) * 4;
      rs.push(px[i]);
      gs.push(px[i + 1]);
      bs.push(px[i + 2]);
    }
  }
  const med = (a: number[]) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)] ?? 0;
  return [med(rs), med(gs), med(bs)];
}

/** Average color of the middle band of a row (i.e. inside the cards). */
function rowCenterColor(data: ImageData, y: number): [number, number, number] {
  const { width, data: px } = data;
  const from = Math.floor(width * 0.25);
  const to = Math.ceil(width * 0.75);
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let x = from; x < to; x++) {
    const i = (y * width + x) * 4;
    r += px[i];
    g += px[i + 1];
    b += px[i + 2];
    n++;
  }
  return [r / n, g / n, b / n];
}

/**
 * Finds the horizontal bands that separate UI cards / sections: rows with
 * almost no horizontal detail whose color matches the page background.
 * Thresholds are relative to the image, so JPEG noise, light and dark themes
 * all work. Falls back to detail-only detection when the background heuristic
 * finds nothing (e.g. cards without margins).
 */
export function detectGaps(data: ImageData, opts: DetectOptions): Gap[] {
  const height = data.height;
  const energy = rowEnergies(data);
  const sorted = Float32Array.from(energy).sort();
  const low = percentile(sorted, 0.05);
  const high = percentile(sorted, 0.9);
  const threshold = low + (Math.max(0.5, high - low) * opts.tolerance) / 100;
  const bg = backgroundColor(data);
  const colorTol = 8 + opts.tolerance * 0.8;

  const collect = (useBg: boolean) => {
    const gaps: Gap[] = [];
    let start = -1;
    for (let y = 0; y < height; y++) {
      let quiet = energy[y] <= threshold;
      if (quiet && useBg) {
        const [r, g, b] = rowCenterColor(data, y);
        quiet =
          Math.abs(r - bg[0]) <= colorTol &&
          Math.abs(g - bg[1]) <= colorTol &&
          Math.abs(b - bg[2]) <= colorTol;
      }
      if (quiet) {
        if (start === -1) start = y;
      } else if (start !== -1) {
        if (y - start >= opts.minGap) gaps.push({ start, end: y - 1 });
        start = -1;
      }
    }
    if (start !== -1 && height - start >= opts.minGap) {
      gaps.push({ start, end: height - 1 });
    }
    return gaps;
  };

  const withBg = collect(true);
  return withBg.length >= 2 ? withBg : collect(false);
}



/** Turns detected gaps into cut positions, respecting a minimum section height. */
export function gapsToCuts(gaps: Gap[], height: number, minSection: number): number[] {
  const candidates = gaps
    .map((g) => Math.round((g.start + g.end) / 2))
    .filter((y) => y > 0 && y < height);

  const cuts: number[] = [];
  let last = 0;
  for (const y of candidates) {
    if (y - last >= minSection && height - y >= minSection) {
      cuts.push(y);
      last = y;
    }
  }
  return cuts;
}

export type Slice = { index: number; y: number; height: number; url: string };

export async function renderSlices(
  img: HTMLImageElement,
  cuts: number[],
  padding = 0,
): Promise<Slice[]> {
  const bounds = [0, ...cuts, img.naturalHeight];
  const out: Slice[] = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const top = Math.max(0, bounds[i] - (i === 0 ? 0 : padding));
    const bottom = Math.min(img.naturalHeight, bounds[i + 1] + padding);
    const h = bottom - top;
    if (h <= 0) continue;
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, top, img.naturalWidth, h, 0, 0, img.naturalWidth, h);
    const url = canvas.toDataURL("image/png");
    out.push({ index: i + 1, y: top, height: h, url });
  }
  return out;
}

export function dataUrlToBlob(url: string): Blob {
  const [head, b64] = url.split(",");
  const mime = head.match(/:(.*?);/)?.[1] ?? "image/png";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
