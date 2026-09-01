export type Cell = { x: number; y: number; w: number; h: number };

export type Template = {
  id: string;
  name: string;
  cols: number;
  rows: number;
  cells: Cell[];
};

/** Collage layouts described on a simple grid (units, not pixels). */
export const templates: Template[] = [
  {
    id: "pinwheel",
    name: "Pinwheel 8",
    cols: 6,
    rows: 6,
    cells: [
      { x: 0, y: 0, w: 2, h: 3 },
      { x: 2, y: 0, w: 2, h: 1 },
      { x: 4, y: 0, w: 2, h: 1 },
      { x: 2, y: 1, w: 1, h: 2 },
      { x: 3, y: 1, w: 3, h: 2 },
      { x: 0, y: 3, w: 3, h: 3 },
      { x: 3, y: 3, w: 3, h: 2 },
      { x: 3, y: 5, w: 3, h: 1 },
    ],
  },
  {
    id: "center-hero",
    name: "Center hero",
    cols: 6,
    rows: 6,
    cells: [
      { x: 0, y: 0, w: 2, h: 2 },
      { x: 2, y: 0, w: 2, h: 1 },
      { x: 4, y: 0, w: 2, h: 1 },
      { x: 2, y: 1, w: 3, h: 3 },
      { x: 5, y: 1, w: 1, h: 3 },
      { x: 0, y: 2, w: 2, h: 2 },
      { x: 0, y: 4, w: 2, h: 2 },
      { x: 2, y: 4, w: 2, h: 2 },
      { x: 4, y: 4, w: 2, h: 2 },
    ],
  },
  {
    id: "zigzag",
    name: "Zigzag 7",
    cols: 6,
    rows: 6,
    cells: [
      { x: 0, y: 0, w: 3, h: 3 },
      { x: 3, y: 0, w: 3, h: 1 },
      { x: 3, y: 1, w: 3, h: 1 },
      { x: 3, y: 2, w: 3, h: 2 },
      { x: 0, y: 3, w: 3, h: 1 },
      { x: 0, y: 4, w: 3, h: 2 },
      { x: 3, y: 4, w: 3, h: 2 },
    ],
  },
  {
    id: "columns",
    name: "Columns 7",
    cols: 6,
    rows: 6,
    cells: [
      { x: 0, y: 0, w: 2, h: 3 },
      { x: 2, y: 0, w: 2, h: 2 },
      { x: 4, y: 0, w: 2, h: 2 },
      { x: 2, y: 2, w: 2, h: 2 },
      { x: 4, y: 2, w: 2, h: 4 },
      { x: 0, y: 3, w: 2, h: 3 },
      { x: 2, y: 4, w: 2, h: 2 },
    ],
  },
  {
    id: "grid-2x3",
    name: "Grid 2×3",
    cols: 2,
    rows: 3,
    cells: [
      { x: 0, y: 0, w: 1, h: 1 },
      { x: 1, y: 0, w: 1, h: 1 },
      { x: 0, y: 1, w: 1, h: 1 },
      { x: 1, y: 1, w: 1, h: 1 },
      { x: 0, y: 2, w: 1, h: 1 },
      { x: 1, y: 2, w: 1, h: 1 },
    ],
  },
  {
    id: "grid-3x4",
    name: "Grid 3×4",
    cols: 3,
    rows: 4,
    cells: Array.from({ length: 12 }, (_, i) => ({
      x: i % 3,
      y: Math.floor(i / 3),
      w: 1,
      h: 1,
    })),
  },
  {
    id: "stack",
    name: "Stack (แนวยาว)",
    cols: 1,
    rows: 6,
    cells: Array.from({ length: 6 }, (_, i) => ({ x: 0, y: i, w: 1, h: 1 })),
  },
  {
    id: "hero-strip",
    name: "Hero + strip",
    cols: 4,
    rows: 4,
    cells: [
      { x: 0, y: 0, w: 4, h: 2 },
      { x: 0, y: 2, w: 2, h: 2 },
      { x: 2, y: 2, w: 1, h: 1 },
      { x: 3, y: 2, w: 1, h: 1 },
      { x: 2, y: 3, w: 2, h: 1 },
    ],
  },
];

export type Piece = { id: string; width: number; height: number; url: string };

/**
 * Assigns pieces to cells so that each piece lands in the cell whose aspect
 * ratio is closest to its own. Returns an array parallel to template.cells
 * holding piece ids (or null when unused).
 */
export function autoAssign(template: Template, pieces: Piece[]): (string | null)[] {
  const cellAspect = (c: Cell) => (c.w * template.rows) / (c.h * template.cols);
  const cells = template.cells.map((c, i) => ({ i, a: cellAspect(c), area: c.w * c.h }));
  const items = pieces.map((p) => ({ id: p.id, a: p.width / p.height }));

  // Big cells first so wide/tall hero pieces get the prominent slots.
  const order = [...cells].sort((a, b) => b.area - a.area);
  const pool = [...items];
  const out: (string | null)[] = template.cells.map(() => null);

  for (const cell of order) {
    if (!pool.length) break;
    let best = 0;
    let bestScore = Infinity;
    pool.forEach((p, idx) => {
      const score = Math.abs(Math.log(p.a / cell.a));
      if (score < bestScore) {
        bestScore = score;
        best = idx;
      }
    });
    out[cell.i] = pool.splice(best, 1)[0]!.id;
  }
  return out;
}

export type RenderOptions = {
  width: number;
  gap: number;
  padding: number;
  background: string;
  radius: number;
};

export const defaultRenderOptions: RenderOptions = {
  width: 1600,
  gap: 12,
  padding: 16,
  background: "#0b0f0c",
  radius: 10,
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Draws the collage and returns the canvas. */
export async function renderCollage(
  template: Template,
  assignment: (string | null)[],
  pieces: Piece[],
  opts: RenderOptions = defaultRenderOptions,
): Promise<HTMLCanvasElement> {
  const { width, gap, padding, background, radius } = opts;
  const inner = width - padding * 2;
  const unit = (inner - gap * (template.cols - 1)) / template.cols;
  const height =
    padding * 2 + unit * template.rows + gap * (template.rows - 1);

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width);
  canvas.height = Math.round(height);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const byId = new Map(pieces.map((p) => [p.id, p]));

  for (let i = 0; i < template.cells.length; i++) {
    const cell = template.cells[i]!;
    const id = assignment[i];
    const x = padding + cell.x * (unit + gap);
    const y = padding + cell.y * (unit + gap);
    const w = cell.w * unit + (cell.w - 1) * gap;
    const h = cell.h * unit + (cell.h - 1) * gap;

    ctx.save();
    roundRect(ctx, x, y, w, h, radius);
    ctx.clip();
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(x, y, w, h);
    const piece = id ? byId.get(id) : undefined;
    if (piece) {
      const img = await loadImage(piece.url);
      // cover fit, anchored to the top so headings stay visible
      const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, x + (w - dw) / 2, y, dw, dh);
    }
    ctx.restore();
  }
  return canvas;
}
