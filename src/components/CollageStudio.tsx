import { useCallback, useEffect, useMemo, useState } from "react";
import { FileDown, ImageDown, LayoutTemplate, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  autoAssign,
  defaultRenderOptions,
  renderCollage,
  templates,
  type Piece,
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
  const [busy, setBusy] = useState(false);

  const reset = useCallback(() => {
    setAssignment(autoAssign(template, pieces));
    setSelected(null);
  }, [template, pieces]);

  useEffect(reset, [reset]);

  const byId = useMemo(() => new Map(pieces.map((p) => [p.id, p])), [pieces]);
  const used = new Set(assignment.filter(Boolean) as string[]);
  const unused = pieces.filter((p) => !used.has(p.id));

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
          <div
            className="mx-auto grid gap-1.5"
            style={{
              gridTemplateColumns: `repeat(${template.cols}, minmax(0,1fr))`,
              gridTemplateRows: `repeat(${template.rows}, 1fr)`,
              aspectRatio: `${template.cols} / ${template.rows}`,
              maxWidth: 640,
            }}
          >
            {template.cells.map((c, i) => {
              const piece = assignment[i] ? byId.get(assignment[i]!) : undefined;
              return (
                <button
                  key={i}
                  onClick={() => clickCell(i)}
                  className={`relative overflow-hidden rounded-md border bg-muted/40 transition-colors ${
                    selected === i ? "border-primary ring-2 ring-primary" : "border-border"
                  }`}
                  style={{
                    gridColumn: `${c.x + 1} / span ${c.w}`,
                    gridRow: `${c.y + 1} / span ${c.h}`,
                  }}
                  aria-label={`ช่องที่ ${i + 1}`}
                >
                  {piece ? (
                    <img
                      src={piece.url}
                      alt={`ช่องที่ ${i + 1}`}
                      className="absolute inset-0 size-full object-cover object-top"
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
