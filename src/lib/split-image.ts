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

/**
 * Finds horizontal "empty" bands (rows that are visually uniform) in a tall
 * screenshot. Those bands are the borders between UI cards / sections.
 */
export function detectGaps(data: ImageData, opts: DetectOptions): Gap[] {
  const { width, height } = data;
  const px = data.data;
  const flat: boolean[] = new Array(height);

  for (let y = 0; y < height; y++) {
    let min = 255;
    let max = 0;
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    const row = y * width * 4;
    // sample every 2nd pixel for speed
    let n = 0;
    for (let x = 0; x < width; x += 2) {
      const i = row + x * 4;
      const r = px[i];
      const g = px[i + 1];
      const b = px[i + 2];
      const lum = (r * 299 + g * 587 + b * 114) / 1000;
      if (lum < min) min = lum;
      if (lum > max) max = lum;
      sumR += r;
      sumG += g;
      sumB += b;
      n++;
    }
    const avgSpread =
      Math.abs(sumR / n - sumG / n) +
      Math.abs(sumG / n - sumB / n) +
      Math.abs(sumR / n - sumB / n);
    flat[y] = max - min <= opts.tolerance && avgSpread <= opts.tolerance * 3;
  }

  const gaps: Gap[] = [];
  let start = -1;
  for (let y = 0; y < height; y++) {
    if (flat[y]) {
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
