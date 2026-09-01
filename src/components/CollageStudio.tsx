import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Expand,
  FileDown,
  ImageDown,
  LayoutTemplate,
  Minus,
  Minimize2,
  Plus,
  Shuffle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import {
  autoAssign,
  buildCustomCells,
  calculateCollageLayout,
  defaultRenderOptions,
  getMergeBounds,
  renderCollage,
  templates,
  type Cell,
  type Piece,
  type LayoutMode,
  type Template,
} from "@/lib/collage";

function TemplateThumb({ template, active }: { template: Template; active: boolean }) {
  return (
    <svg
      viewBox={`0 0 ${template.cols} ${template.rows}`}
      className="h-full w-full"
      preserveAspectRatio="none"
    >
      {template.cells.map((c, i) => (
        <rect
          key={i}
          x={c.x + 0.06}
          y={c.y + 0.06}
          width={c.w - 0.12}
          height={c.h - 0.12}
          rx={0.1}
          className={active ? "fill-primary" : "fill-muted-foreground/50"}
        />
      ))}
    </svg>
  );
}

function sameCell(a: Cell, b: Cell) {
  return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
}

export function CollageStudio({
  pieces,
  fileName,
}: {
  pieces: Piece[];
  fileName: string;
}) {
  const [templateId, setTemplateId] = useState(templates[0]!.id);
  const [customCols, setCustomCols] = useState(4);
  const [customRows, setCustomRows] = useState(4);
  const [customMerges, setCustomMerges] = useState<Cell[]>([]);
  const template = useMemo(
    () => {
      const selectedTemplate = templates.find((t) => t.id === templateId) ?? templates[0]!;
      if (selectedTemplate.id !== "custom-grid") return selectedTemplate;
      return {
        ...selectedTemplate,
        name: `Custom ${customCols}×${customRows}`,
        cols: customCols,
        rows: customRows,
        cells: buildCustomCells(customCols, customRows, customMerges),
      };
    },
    [customCols, customMerges, customRows, templateId],
  );
  const [assignment, setAssignment] = useState<(string | null)[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeSelection, setMergeSelection] = useState<number[]>([]);
  const [gap, setGap] = useState(defaultRenderOptions.gap);
  const [width, setWidth] = useState(defaultRenderOptions.width);
  const [exportScale, setExportScale] = useState(3);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(defaultRenderOptions.layoutMode);
  const [busy, setBusy] = useState(false);

  const reset = useCallback(() => {
    setAssignment(autoAssign(template, pieces));
    setSelected(null);
    setMergeSelection([]);
  }, [template, pieces]);

  useEffect(reset, [reset]);

  const byId = useMemo(() => new Map(pieces.map((p) => [p.id, p])), [pieces]);
  const used = new Set(assignment.filter(Boolean) as string[]);
  const unused = pieces.filter((p) => !used.has(p.id));
  const mergeCells = useMemo(
    () => mergeSelection.map((index) => template.cells[index]!).filter(Boolean),
    [mergeSelection, template.cells],
  );
  const mergeBounds = useMemo(() => {
    return getMergeBounds(mergeCells);
  }, [mergeCells]);
  const canUnmerge =
    mergeCells.length === 1 && (mergeCells[0]!.w > 1 || mergeCells[0]!.h > 1);
  const previewLayout = useMemo(
    () =>
      calculateCollageLayout(template, assignment, pieces, {
        width,
        gap,
        padding: defaultRenderOptions.padding,
        layoutMode,
      }),
    [assignment, gap, layoutMode, pieces, template, width],
  );

  const clickCell = (i: number) => {
    if (mergeMode && templateId === "custom-grid") {
      setSelected(null);
      setMergeSelection((previous) =>
        previous.includes(i) ? previous.filter((index) => index !== i) : [...previous, i],
      );
      return;
    }
    if (selected === null) {
      setSelected(i);
      return;
    }
    if (selected === i) {
      setSelected(null);
      return;
    }
    setAssignment((prev) => {
      const next = [...prev];
      const a = next[selected] ?? null;
      next[selected] = next[i] ?? null;
      next[i] = a;
      return next;
    });
    setSelected(null);
  };

  const mergeSelectedCells = () => {
    if (!mergeBounds) return;
    setCustomMerges((previous) => [
      ...previous.filter((merged) => !mergeCells.some((cell) => sameCell(merged, cell))),
      mergeBounds,
    ]);
    setMergeSelection([]);
  };

  const unmergeSelectedCell = () => {
    const cell = mergeCells[0];
    if (!cell || !canUnmerge) return;
    setCustomMerges((previous) => previous.filter((merged) => !sameCell(merged, cell)));
    setMergeSelection([]);
  };

  const changeCustomSize = (axis: "cols" | "rows", delta: number) => {
    const update = (value: number) => Math.min(12, Math.max(1, value + delta));
    if (axis === "cols") setCustomCols(update);
    else setCustomRows(update);
    setCustomMerges([]);
    setMergeSelection([]);
  };

  const placePiece = (id: string) => {
    const target = selected ?? assignment.findIndex((a) => !a);
    if (target < 0) return;
    setAssignment((prev) => {
      const next = prev.map((a) => (a === id ? null : a));
      next[target] = id;
      return next;
    });
    setSelected(null);
  };

  const build = async () => {
    setBusy(true);
    try {
      const renderWidth = Math.min(8000, width * exportScale);
      const renderRatio = renderWidth / width;
      return await renderCollage(template, assignment, pieces, {
        ...defaultRenderOptions,
        gap: gap * renderRatio,
        layoutMode,
        padding: defaultRenderOptions.padding * renderRatio,
        radius: defaultRenderOptions.radius * renderRatio,
        width: renderWidth,
      });
    } finally {
      setBusy(false);
    }
  };

  const exportPng = async () => {
    const canvas = await build();
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error("ไม่สามารถสร้างไฟล์ PNG ได้"));
      }, "image/png");
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}-collage.png`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const exportPdf = async () => {
    const canvas = await build();
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
      orientation: canvas.width >= canvas.height ? "landscape" : "portrait",
      unit: "px",
      format: [canvas.width, canvas.height],
    });
    pdf.addImage(canvas, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save(`${fileName}-collage.pdf`);
  };

  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
        <LayoutTemplate className="size-5 text-primary" /> รวมเป็น Collage
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        เลือก Template แล้วสลับตำแหน่งได้เอง (คลิกช่องแรก → คลิกช่องที่จะสลับ)
        ระบบวางชิ้นงานจากแถวบนตามลำดับที่ตัดรูป
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="p-4">
          <div className="relative mx-auto aspect-square w-full max-w-[640px] overflow-hidden rounded-lg bg-black">
            {template.cells.map((_, i) => {
              const piece = assignment[i] ? byId.get(assignment[i]!) : undefined;
              const rect = previewLayout[i]!;
              return (
                <button
                  key={i}
                  onClick={() => clickCell(i)}
                  className={`absolute flex items-center justify-center overflow-hidden rounded-md border bg-black transition-colors ${
                    mergeMode && mergeSelection.includes(i)
                      ? "border-accent ring-2 ring-accent"
                      : selected === i
                        ? "border-primary ring-2 ring-primary"
                        : "border-border"
                  }`}
                  style={{
                    left: `${(rect.x / width) * 100}%`,
                    top: `${(rect.y / width) * 100}%`,
                    width: `${(rect.w / width) * 100}%`,
                    height: `${(rect.h / width) * 100}%`,
                  }}
                  aria-label={`ช่องที่ ${i + 1}`}
                >
                  {piece ? (
                    <img
                      src={piece.url}
                      alt={`ช่องที่ ${i + 1}`}
                      className="absolute inset-0 size-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">ว่าง</span>
                  )}
                </button>
              );
            })}
          </div>

          {unused.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground">
                รูปที่ยังไม่ได้ใช้ ({unused.length}) — คลิกเพื่อใส่ในช่องที่เลือก
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {unused.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => placePiece(p.id)}
                    className="size-16 shrink-0 overflow-hidden rounded border border-border hover:border-primary"
                  >
                    <img
                      src={p.url}
                      alt={`รูปสำรอง ${p.id}`}
                      className="size-full object-cover object-top"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="space-y-3 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider">Template</h3>
            <div className="grid grid-cols-3 gap-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTemplateId(t.id);
                    setMergeMode(false);
                    setMergeSelection([]);
                    setSelected(null);
                  }}
                  title={t.name}
                  className={`aspect-square rounded-md border p-1.5 transition-colors ${
                    t.id === templateId
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {t.id === "custom-grid" ? (
                    <span className="flex size-full items-center justify-center text-center text-xs font-semibold">
                      Custom Grid
                    </span>
                  ) : (
                    <TemplateThumb template={t} active={t.id === templateId} />
                  )}
                </button>
              ))}
            </div>
            {templateId === "custom-grid" && (
              <div className="space-y-3 rounded-lg border border-border bg-black/20 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs">คอลัมน์ (แนวนอน)</Label>
                    <p className="font-mono text-sm text-primary">{customCols}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      disabled={customCols <= 1}
                      onClick={() => changeCustomSize("cols", -1)}
                      aria-label="ลดจำนวนคอลัมน์"
                    >
                      <Minus />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      disabled={customCols >= 12}
                      onClick={() => changeCustomSize("cols", 1)}
                      aria-label="เพิ่มจำนวนคอลัมน์"
                    >
                      <Plus />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs">แถว (แนวตั้ง)</Label>
                    <p className="font-mono text-sm text-primary">{customRows}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      disabled={customRows <= 1}
                      onClick={() => changeCustomSize("rows", -1)}
                      aria-label="ลดจำนวนแถว"
                    >
                      <Minus />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      disabled={customRows >= 12}
                      onClick={() => changeCustomSize("rows", 1)}
                      aria-label="เพิ่มจำนวนแถว"
                    >
                      <Plus />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  รองรับ {customCols * customRows} รูป — ปรับให้ใกล้จำนวนรูปเพื่อลดช่องว่างที่ไม่ได้ใช้
                </p>
                <Button
                  type="button"
                  variant={mergeMode ? "default" : "outline"}
                  className="w-full"
                  onClick={() => {
                    setMergeMode((active) => !active);
                    setMergeSelection([]);
                    setSelected(null);
                    setLayoutMode("contain");
                  }}
                >
                  {mergeMode ? "ออกจากโหมด Merge" : "Merge ช่อง"}
                </Button>
                {mergeMode && (
                  <div className="space-y-2 rounded-md border border-primary/30 bg-primary/5 p-2.5">
                    <p className="text-xs text-muted-foreground">
                      เลือกช่องที่ติดกันให้เป็นสี่เหลี่ยม แล้วกด Merge
                    </p>
                    <p className="text-xs">
                      เลือกแล้ว <span className="font-mono text-primary">{mergeCells.length}</span>{" "}
                      ช่อง
                    </p>
                    {mergeCells.length > 1 && !mergeBounds && (
                      <p className="text-xs text-destructive">
                        ช่องที่เลือกต้องติดกันและรวมเป็นพื้นที่สี่เหลี่ยม
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={!mergeBounds}
                        onClick={mergeSelectedCells}
                      >
                        Merge
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={!canUnmerge}
                        onClick={unmergeSelectedCell}
                      >
                        Unmerge
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <Button variant="secondary" className="w-full" onClick={reset}>
              <Shuffle /> จัดวางอัตโนมัติใหม่
            </Button>
          </Card>

          <Card className="space-y-4 p-5">
            <div className="space-y-3">
              <Label className="text-xs">วิธีรักษารูปให้ครบ</Label>
              <RadioGroup
                value={layoutMode}
                onValueChange={(value) => setLayoutMode(value as LayoutMode)}
                className="gap-2"
              >
                <Label
                  htmlFor="layout-adaptive"
                  className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors ${
                    layoutMode === "adaptive" ? "border-primary bg-primary/10" : "border-border"
                  }`}
                >
                  <RadioGroupItem id="layout-adaptive" value="adaptive" className="mt-0.5" />
                  <span>
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <Expand className="size-4" /> ปรับช่องตามรูป
                    </span>
                    <span className="mt-1 block text-xs font-normal text-muted-foreground">
                      คงโครง Template และขยายความสูงของช่องตามสัดส่วนรูป
                    </span>
                  </span>
                </Label>
                <Label
                  htmlFor="layout-contain"
                  className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors ${
                    layoutMode === "contain" ? "border-primary bg-primary/10" : "border-border"
                  }`}
                >
                  <RadioGroupItem id="layout-contain" value="contain" className="mt-0.5" />
                  <span>
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <Minimize2 className="size-4" /> ย่อรูปให้พอดีช่อง
                    </span>
                    <span className="mt-1 block text-xs font-normal text-muted-foreground">
                      คงขนาดช่องเดิมและแสดงภาพครบโดยไม่ตัดขอบ
                    </span>
                  </span>
                </Label>
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                ไฟล์ที่ Export จะเป็นสี่เหลี่ยมจัตุรัส และพื้นที่ว่างจะเป็นสีดำ
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">ช่องไฟระหว่างรูป</Label>
                <span className="font-mono text-xs text-primary">{gap}</span>
              </div>
              <Slider
                value={[gap]}
                min={0}
                max={48}
                onValueChange={(v) => setGap(v[0] ?? 0)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">ความกว้างไฟล์ (px)</Label>
                <span className="font-mono text-xs text-primary">{width}</span>
              </div>
              <Slider
                value={[width]}
                min={800}
                max={3000}
                step={100}
                onValueChange={(v) => setWidth(v[0] ?? 1600)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">คุณภาพ Export</Label>
                <span className="font-mono text-xs text-primary">
                  {Math.min(8000, width * exportScale)}×{Math.min(8000, width * exportScale)} px
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((scale) => (
                  <Button
                    key={scale}
                    type="button"
                    size="sm"
                    variant={exportScale === scale ? "default" : "secondary"}
                    onClick={() => setExportScale(scale)}
                  >
                    {scale}×
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                แนะนำ 3× สำหรับกราฟและตัวอักษรขนาดเล็ก (ไฟล์จะมีขนาดใหญ่ขึ้น)
              </p>
            </div>
            <Button className="w-full" disabled={busy} onClick={exportPng}>
              <ImageDown /> {busy ? "กำลังสร้าง..." : "Export รูปเดียว (PNG)"}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              disabled={busy}
              onClick={exportPdf}
            >
              <FileDown /> Export เป็น PDF
            </Button>
          </Card>
        </div>
      </div>
    </section>
  );
}
