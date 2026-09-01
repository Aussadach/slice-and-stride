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
    id: "grid-5x5",
    name: "Grid 5×5",
    cols: 5,
    rows: 5,
    cells: Array.from({ length: 25 }, (_, i) => ({
      x: i % 5,
      y: Math.floor(i / 5),
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
  {
    id: "bento-17",
    name: "Bento 17",
    cols: 6,
    rows: 6,
    cells: [
      { x: 0, y: 0, w: 2, h: 2 },
      { x: 2, y: 0, w: 2, h: 1 },
      { x: 4, y: 0, w: 1, h: 1 },
      { x: 5, y: 0, w: 1, h: 2 },
      { x: 2, y: 1, w: 1, h: 1 },
      { x: 3, y: 1, w: 2, h: 1 },
      { x: 0, y: 2, w: 1, h: 2 },
      { x: 1, y: 2, w: 2, h: 1 },
      { x: 3, y: 2, w: 3, h: 2 },
      { x: 1, y: 3, w: 1, h: 1 },
      { x: 2, y: 3, w: 1, h: 1 },
      { x: 0, y: 4, w: 2, h: 2 },
      { x: 2, y: 4, w: 2, h: 1 },
      { x: 4, y: 4, w: 1, h: 1 },
      { x: 5, y: 4, w: 1, h: 2 },
      { x: 2, y: 5, w: 1, h: 1 },
      { x: 3, y: 5, w: 2, h: 1 },
    ],
  },
  {
    id: "bento-18",
    name: "Bento 18",
    cols: 6,
    rows: 6,
    cells: [
      { x: 0, y: 0, w: 2, h: 2 },
      { x: 2, y: 0, w: 1, h: 1 },
      { x: 3, y: 0, w: 1, h: 1 },
      { x: 4, y: 0, w: 1, h: 1 },
      { x: 5, y: 0, w: 1, h: 2 },
      { x: 2, y: 1, w: 1, h: 1 },
      { x: 3, y: 1, w: 2, h: 1 },
      { x: 0, y: 2, w: 1, h: 2 },
      { x: 1, y: 2, w: 2, h: 1 },
      { x: 3, y: 2, w: 3, h: 2 },
      { x: 1, y: 3, w: 1, h: 1 },
      { x: 2, y: 3, w: 1, h: 1 },
      { x: 0, y: 4, w: 2, h: 2 },
      { x: 2, y: 4, w: 2, h: 1 },
      { x: 4, y: 4, w: 1, h: 1 },
      { x: 5, y: 4, w: 1, h: 2 },
      { x: 2, y: 5, w: 1, h: 1 },
      { x: 3, y: 5, w: 2, h: 1 },
    ],
  },
];

export type Piece = { id: string; width: number; height: number; url: string };

/** Assigns pieces in cut order, filling cells from top-left to bottom-right. */
export function autoAssign(template: Template, pieces: Piece[]): (string | null)[] {
  const out: (string | null)[] = template.cells.map(() => null);
  const order = template.cells
    .map((cell, index) => ({ cell, index }))
    .sort((a, b) => a.cell.y - b.cell.y || a.cell.x - b.cell.x);
  order.slice(0, pieces.length).forEach(({ index }, pieceIndex) => {
    out[index] = pieces[pieceIndex]!.id;
  });
  return out;
}

export type RenderOptions = {
  width: number;
  gap: number;
  padding: number;
  background: string;
  radius: number;
  layoutMode: LayoutMode;
};

export type LayoutMode = "adaptive" | "contain";

export type LayoutRect = Cell & { index: number };

export const defaultRenderOptions: RenderOptions = {
  width: 1600,
  gap: 12,
  padding: 16,
  background: "#000000",
  radius: 10,
  layoutMode: "adaptive",
};

/**
 * Calculates the cell rectangles used by both the preview and the exporter.
 * Adaptive mode keeps the template's columns and vertical ordering, but lets
 * each image determine its own height. Cells below it are pushed down like a
 * masonry layout, so no image overlaps or needs to be cropped.
 */
export function calculateCollageLayout(
  template: Template,
  assignment: (string | null)[],
  pieces: Piece[],
  opts: Pick<RenderOptions, "width" | "gap" | "padding" | "layoutMode">,
): LayoutRect[] {
  const { width, gap, padding, layoutMode } = opts;
  const inner = width - padding * 2;
  const byId = new Map(pieces.map((piece) => [piece.id, piece]));

  if (layoutMode === "contain") {
    const unitX = (inner - gap * (template.cols - 1)) / template.cols;
    const unitY = (inner - gap * (template.rows - 1)) / template.rows;
    return template.cells.map((cell, index) => ({
      index,
      x: padding + cell.x * (unitX + gap),
      y: padding + cell.y * (unitY + gap),
      w: cell.w * unitX + (cell.w - 1) * gap,
      h: cell.h * unitY + (cell.h - 1) * gap,
    }));
  }

  const unit = (inner - gap * (template.cols - 1)) / template.cols;
  const placed: LayoutRect[] = [];
  const order = template.cells
    .map((cell, index) => ({ cell, index }))
    .sort((a, b) => a.cell.y - b.cell.y || a.cell.x - b.cell.x);

  for (const { cell, index } of order) {
    const w = cell.w * unit + (cell.w - 1) * gap;
    const pieceId = assignment[index];
    const piece = pieceId ? byId.get(pieceId) : undefined;
    const aspect =
      piece && piece.width > 0 && piece.height > 0
        ? piece.width / piece.height
        : cell.w / cell.h;
    const predecessors = placed.filter((rect) => {
      const source = template.cells[rect.index]!;
      const isAbove = source.y + source.h <= cell.y;
      const overlapsHorizontally =
        source.x < cell.x + cell.w && source.x + source.w > cell.x;
      return isAbove && overlapsHorizontally;
    });
    const y = predecessors.reduce(
      (bottom, rect) => Math.max(bottom, rect.y + rect.h + gap),
      0,
    );
    placed.push({ index, x: cell.x * (unit + gap), y, w, h: w / aspect });
  }

  const contentHeight = Math.max(...placed.map((rect) => rect.y + rect.h), 0);
  const scale = contentHeight > 0 ? Math.min(1, inner / contentHeight) : 1;
  const offsetX = padding + (inner - inner * scale) / 2;
  const offsetY = padding + (inner - contentHeight * scale) / 2;

  return placed
    .map((rect) => ({
      ...rect,
      x: offsetX + rect.x * scale,
      y: offsetY + rect.y * scale,
      w: rect.w * scale,
      h: rect.h * scale,
    }))
    .sort((a, b) => a.index - b.index);
}

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
  const { width, background, radius } = opts;
  const layout = calculateCollageLayout(template, assignment, pieces, opts);

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width);
  canvas.height = Math.round(width);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const byId = new Map(pieces.map((p) => [p.id, p]));

  for (let i = 0; i < template.cells.length; i++) {
    const rect = layout[i]!;
    const id = assignment[i];
    const { x, y, w, h } = rect;

    ctx.save();
    roundRect(ctx, x, y, w, h, radius);
    ctx.clip();
    const piece = id ? byId.get(id) : undefined;
    ctx.fillStyle = "#000000";
    ctx.fillRect(x, y, w, h);
    if (piece) {
      const img = await loadImage(piece.url);
      // Adaptive cells already match the image ratio. Fixed cells use contain
      // so the complete source image is always visible in either mode.
      const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    }
    ctx.restore();
  }
  return canvas;
}
