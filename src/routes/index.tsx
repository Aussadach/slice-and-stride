import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import { Download, ImageDown, Scissors, Trash2, Upload, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  dataUrlToBlob,
  defaultOptions,
  detectGaps,
  gapsToCuts,
  renderSlices,
  type Slice,
} from "@/lib/split-image";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SplitFit — ตัดแบ่งภาพสรุปผลออกกำลังกายยาวๆ เป็นหลายรูป" },
      {
        name: "description",
        content:
          "อัปโหลดภาพสรุปผลจากแอปออกกำลังกายที่ยาวมาก ระบบจะตัดตามขอบของแต่ละ Section แล้ว Export ออกเป็นหลายรูปคมชัด พร้อมส่งให้ AI อ่าน",
      },
      { property: "og:title", content: "SplitFit — ตัดภาพสรุปผลออกกำลังกายเป็นหลายรูป" },
      {
        property: "og:description",
        content:
          "ตัดภาพ Export ยาวๆ จากแอปออกกำลังกายตามขอบแต่ละ Section แล้วดาวน์โหลดเป็นหลายไฟล์ ทำงานในเบราว์เซอร์ 100%",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SplitFit,
});

function SplitFit() {
  const [src, setSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState("workout");
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [cuts, setCuts] = useState<number[]>([]);
  const [tolerance, setTolerance] = useState(defaultOptions.tolerance);
  const [minSection, setMinSection] = useState(defaultOptions.minSection);
  const [minGap, setMinGap] = useState(defaultOptions.minGap);
  const [padding, setPadding] = useState(0);
  const [slices, setSlices] = useState<Slice[]>([]);
  const [busy, setBusy] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const loadFile = useCallback((file: File) => {
    setFileName(file.name.replace(/\.[^.]+$/, "") || "workout");
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(image, 0, 0);
      setImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
      setImg(image);
      setSrc(url);
      setSlices([]);
    };
    image.src = url;
  }, []);

  // auto detect whenever image or parameters change
  useEffect(() => {
    if (!imageData) return;
    const gaps = detectGaps(imageData, { tolerance, minSection, minGap });
    setCuts(gapsToCuts(gaps, imageData.height, minSection));
  }, [imageData, tolerance, minSection, minGap]);

  const sections = useMemo(() => {
    if (!img) return [];
    const bounds = [0, ...cuts, img.naturalHeight];
    return bounds.slice(0, -1).map((top, i) => ({
      top,
      height: bounds[i + 1] - top,
    }));
  }, [cuts, img]);

  const addCutAt = (clientY: number) => {
    if (!img || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const ratio = img.naturalHeight / rect.height;
    const y = Math.round((clientY - rect.top) * ratio);
    if (y <= 4 || y >= img.naturalHeight - 4) return;
    setCuts((prev) => [...prev, y].sort((a, b) => a - b));
  };

  const build = async () => {
    if (!img) return;
    setBusy(true);
    setSlices(await renderSlices(img, cuts, padding));
    setBusy(false);
  };

  const downloadZip = async () => {
    const list = slices.length ? slices : await renderSlices(img!, cuts, padding);
    setSlices(list);
    const zip = new JSZip();
    list.forEach((s) => {
      zip.file(
        `${fileName}-${String(s.index).padStart(2, "0")}.png`,
        dataUrlToBlob(s.url),
      );
    });
    const blob = await zip.generateAsync({ type: "blob" });
    triggerDownload(URL.createObjectURL(blob), `${fileName}-sections.zip`);
  };

  const triggerDownload = (url: string, name: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header
        className="border-b border-border"
        style={{ backgroundImage: "var(--gradient-hero)" }}
      >
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            Workout screenshot splitter
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            ตัดภาพสรุปผลยาวๆ ให้ AI อ่านออก
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            ภาพ Export จากแอปออกกำลังกายมักยาวหลายพันพิกเซล เมื่อส่งเข้า AI จะถูกย่อจนเบลอ
            เครื่องมือนี้ตรวจหาขอบระหว่างแต่ละการ์ด/Section อัตโนมัติ แล้วแยกออกเป็นหลายรูปคมชัด
            ทั้งหมดทำงานในเครื่องของคุณ ไม่มีการอัปโหลดไปเซิร์ฟเวอร์
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* preview */}
        <Card className="overflow-hidden p-4" style={{ boxShadow: "var(--shadow-panel)" }}>
          {!src ? (
            <Dropzone onFile={loadFile} />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Scissors className="size-4 text-primary" />
                คลิกบนภาพเพื่อเพิ่มเส้นตัด • คลิกที่เส้นเพื่อลบ • ได้ {sections.length} รูป
              </div>
              <div
                ref={previewRef}
                onClick={(e) => addCutAt(e.clientY)}
                className="relative mx-auto max-w-sm cursor-crosshair select-none overflow-hidden rounded-lg border border-border"
              >
                <img src={src} alt="ภาพสรุปผลออกกำลังกายที่กำลังแบ่ง" className="block w-full" />
                {sections.map((s, i) => (
                  <span
                    key={`n-${i}`}
                    className="absolute left-1 rounded bg-primary px-1.5 text-[10px] font-bold text-primary-foreground"
                    style={{
                      top: `${(s.top / (img?.naturalHeight ?? 1)) * 100}%`,
                    }}
                  >
                    {i + 1}
                  </span>
                ))}
                {cuts.map((y) => (
                  <button
                    key={y}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCuts((prev) => prev.filter((c) => c !== y));
                    }}
                    aria-label={`ลบเส้นตัดที่ ${y}px`}
                    className="absolute inset-x-0 h-1 -translate-y-1/2 bg-accent hover:h-2 hover:bg-destructive"
                    style={{ top: `${(y / (img?.naturalHeight ?? 1)) * 100}%` }}
                  />
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* controls */}
        <div className="space-y-4">
          <Card className="space-y-5 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider">
              <Wand2 className="size-4 text-primary" /> ตั้งค่าการตรวจจับ
            </h2>
            <Control
              label="ความไวต่อสีพื้น"
              value={tolerance}
              min={2}
              max={40}
              onChange={setTolerance}
              hint="ค่ามากขึ้น = ถือว่าแถบที่สีต่างเล็กน้อยเป็นช่องว่าง"
            />
            <Control
              label="ความสูงต่ำสุดของ Section (px)"
              value={minSection}
              min={40}
              max={800}
              step={10}
              onChange={setMinSection}
              hint="กันไม่ให้ตัดถี่เกินไป"
            />
            <Control
              label="ความหนาต่ำสุดของช่องว่าง (px)"
              value={minGap}
              min={2}
              max={60}
              onChange={setMinGap}
              hint="ช่องไฟระหว่างการ์ดต้องหนากว่านี้จึงถือเป็นขอบ"
            />
            <Control
              label="เผื่อขอบรอบภาพที่ตัด (px)"
              value={padding}
              min={0}
              max={60}
              onChange={setPadding}
            />
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setCuts([])}>
                <Trash2 /> ล้างเส้นตัด
              </Button>
            </div>
          </Card>

          <Card className="space-y-3 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider">
              <ImageDown className="size-4 text-primary" /> Export
            </h2>
            <Button className="w-full" disabled={!img || busy} onClick={build}>
              <Scissors /> {busy ? "กำลังตัด..." : `สร้าง ${sections.length} รูป`}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              disabled={!img}
              onClick={downloadZip}
            >
              <Download /> ดาวน์โหลดทั้งหมด (.zip)
            </Button>
            {src && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setSrc(null);
                  setImg(null);
                  setImageData(null);
                  setSlices([]);
                }}
              >
                <Upload /> เปลี่ยนรูป
              </Button>
            )}
          </Card>
        </div>
      </div>

      {slices.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-16">
          <h2 className="mb-4 text-lg font-semibold">ผลลัพธ์ {slices.length} รูป</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {slices.map((s) => (
              <Card key={s.index} className="space-y-3 overflow-hidden p-3">
                <img
                  src={s.url}
                  alt={`ส่วนที่ ${s.index} ของภาพสรุปผล`}
                  className="w-full rounded-md border border-border"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    #{String(s.index).padStart(2, "0")} · {s.height}px
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      triggerDownload(
                        s.url,
                        `${fileName}-${String(s.index).padStart(2, "0")}.png`,
                      )
                    }
                  >
                    <Download /> PNG
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Control({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs font-mono text-primary">{value}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
      />
      {hint && <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Dropzone({ onFile }: { onFile: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      onClick={() => inputRef.current?.click()}
      className={`flex min-h-[420px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
        over ? "border-primary bg-primary/5" : "border-border"
      }`}
    >
      <Upload className="size-8 text-primary" />
      <p className="text-base font-semibold">ลากภาพมาวาง หรือคลิกเพื่อเลือกไฟล์</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        รองรับ PNG / JPG ภาพยาวจาก Garmin, Strava, Nike Run Club, Apple Fitness ฯลฯ
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
    </div>
  );
}
