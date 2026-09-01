import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Expand,
  FileDown,
  ImageDown,
  LayoutTemplate,
  Minimize2,
  Shuffle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import {
  autoAssign,
  calculateCollageLayout,
  defaultRenderOptions,
  renderCollage,
  templates,
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

export function CollageStudio({
  pieces,
  fileName,
}: {
  pieces: Piece[];
  fileName: string;
}) {
  const [templateId, setTemplateId] = useState(templates[0]!.id);
  const template = useMemo(
    () => templates.find((t) => t.id === templateId) ?? templates[0]!,
    [templateId],
  );
  const [assignment, setAssignment] = useState<(string | null)[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [gap, setGap] = useState(defaultRenderOptions.gap);
  const [width, setWidth] = useState(defaultRenderOptions.width);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(defaultRenderOptions.layoutMode);
  const [busy, setBusy] = useState(false);

  const reset = useCallback(() => {
    setAssignment(autoAssign(template, pieces));
    setSelected(null);
  }, [template, pieces]);

  useEffect(reset, [reset]);

  const byId = useMemo(() => new Map(pieces.map((p) => [p.id, p])), [pieces]);
  const used = new Set(assignment.filter(Boolean) as string[]);
  const unused = pieces.filter((p) => !used.has(p.id));
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
      return await renderCollage(template, assignment, pieces, {
        ...defaultRenderOptions,
        gap,
        layoutMode,
        width,
      });
    } finally {
      setBusy(false);
    }
  };

  const exportPng = async () => {
    const canvas = await build();
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${fileName}-collage.png`;
    a.click();
  };

  const exportPdf = async () => {
    const canvas = await build();
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
      orientation: canvas.width >= canvas.height ? "landscape" : "portrait",
      unit: "px",
      format: [canvas.width, canvas.height],
    });
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, canvas.width, canvas.height);
    pdf.save(`${fileName}-collage.pdf`);
  };

  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
        <LayoutTemplate className="size-5 text-primary" /> รวมเป็น Collage
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        เลือก Template แล้วสลับตำแหน่งได้เอง (คลิกช่องแรก → คลิกช่องที่จะสลับ) ระบบวางให้ก่อนตาม
        สัดส่วนของแต่ละรูป
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
                    selected === i ? "border-primary ring-2 ring-primary" : "border-border"
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
                  onClick={() => setTemplateId(t.id)}
                  title={t.name}
                  className={`aspect-square rounded-md border p-1.5 transition-colors ${
                    t.id === templateId
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <TemplateThumb template={t} active={t.id === templateId} />
                </button>
              ))}
            </div>
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
