import { Link, useParams } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, Camera, MessageCircle, Flame, Beef, Wheat, Droplets, Leaf, Star, Share2, Download, Check } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

const MACRO_COLORS = {
  protein: "#4ade80",
  carbs: "#60a5fa",
  fat: "#f59e0b",
  fiber: "#a78bfa",
};

function MacroBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value.toFixed(1)}g</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── Share Card Generator ────────────────────────────────────────────────────
async function generateShareCard(params: {
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  healthScore?: number;
  imageUrl: string;
  date: string;
}): Promise<Blob> {
  const W = 1080;
  const H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background — dark gradient
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, "#0d1117");
  bgGrad.addColorStop(1, "#0a1a0f");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle green glow top-center
  const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 500);
  glow.addColorStop(0, "rgba(74,222,128,0.12)");
  glow.addColorStop(1, "rgba(74,222,128,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Load meal image
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = params.imageUrl;
    });
    // Draw image in top portion with rounded clip
    const imgH = 420;
    ctx.save();
    roundRect(ctx, 40, 40, W - 80, imgH, 28);
    ctx.clip();
    // Cover-fit the image
    const scale = Math.max((W - 80) / img.width, imgH / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    const dx = 40 + ((W - 80) - dw) / 2;
    const dy = 40 + (imgH - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
    // Gradient overlay on image bottom
    const imgOverlay = ctx.createLinearGradient(0, 40 + imgH - 120, 0, 40 + imgH);
    imgOverlay.addColorStop(0, "rgba(13,17,23,0)");
    imgOverlay.addColorStop(1, "rgba(13,17,23,0.9)");
    ctx.fillStyle = imgOverlay;
    ctx.fillRect(40, 40, W - 80, imgH);
    ctx.restore();
  } catch {
    // If image fails, draw placeholder
    ctx.fillStyle = "#1a2a1a";
    roundRect(ctx, 40, 40, W - 80, 420, 28);
    ctx.fill();
  }

  // Meal name on image
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 48px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  const mealName = params.mealName.length > 32 ? params.mealName.substring(0, 30) + "…" : params.mealName;
  ctx.fillText(mealName, 64, 430);

  // Date
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "28px system-ui, -apple-system, sans-serif";
  ctx.fillText(params.date, 64, 470);

  // Health score badge (top-right of image)
  if (params.healthScore) {
    ctx.fillStyle = "rgba(74,222,128,0.9)";
    roundRect(ctx, W - 200, 60, 140, 56, 28);
    ctx.fill();
    ctx.fillStyle = "#0d1117";
    ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`⭐ ${params.healthScore}/10`, W - 130, 95);
  }

  // Calorie hero block
  const heroY = 510;
  ctx.fillStyle = "rgba(74,222,128,0.08)";
  ctx.strokeStyle = "rgba(74,222,128,0.25)";
  ctx.lineWidth = 2;
  roundRect(ctx, 40, heroY, W - 80, 130, 24);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#4ade80";
  ctx.font = "bold 80px system-ui, -apple-system, sans-serif";
  ctx.fillText(String(Math.round(params.calories)), W / 2, heroY + 90);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "28px system-ui, -apple-system, sans-serif";
  ctx.fillText("CALORIES", W / 2, heroY + 122);

  // Macro grid — 4 boxes
  const macroY = 670;
  const macroW = (W - 80 - 30) / 4;
  const macros = [
    { label: "PROTEIN", value: params.protein, unit: "g", color: MACRO_COLORS.protein },
    { label: "CARBS", value: params.carbs, unit: "g", color: MACRO_COLORS.carbs },
    { label: "FAT", value: params.fat, unit: "g", color: MACRO_COLORS.fat },
    { label: "FIBER", value: params.fiber, unit: "g", color: MACRO_COLORS.fiber },
  ];
  macros.forEach((m, i) => {
    const x = 40 + i * (macroW + 10);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, macroY, macroW, 130, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = m.color;
    ctx.font = "bold 46px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${m.value.toFixed(0)}${m.unit}`, x + macroW / 2, macroY + 72);

    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "22px system-ui, -apple-system, sans-serif";
    ctx.fillText(m.label, x + macroW / 2, macroY + 108);
  });

  // Branding footer
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(40, 830, W - 80, 1);

  ctx.textAlign = "left";
  ctx.fillStyle = "#4ade80";
  ctx.font = "bold 30px system-ui, -apple-system, sans-serif";
  ctx.fillText("Nutrisense AI", 64, 890);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "24px system-ui, -apple-system, sans-serif";
  ctx.fillText("AI-Powered Nutrition Analysis", 64, 924);

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.font = "22px system-ui, -apple-system, sans-serif";
  ctx.fillText("nutrisense.manus.space", W - 64, 924);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/png", 0.95));
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Share Button Component ──────────────────────────────────────────────────
function ShareButton({ scan, healthScore }: {
  scan: { mealName: string | null; imageUrl: string; totalCalories: number | null; totalProtein: number | null; totalCarbs: number | null; totalFat: number | null; totalFiber: number | null; createdAt: Date };
  healthScore?: number;
}) {
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);

  const handleShare = useCallback(async () => {
    setSharing(true);
    try {
      const blob = await generateShareCard({
        mealName: scan.mealName ?? "My Meal",
        calories: scan.totalCalories ?? 0,
        protein: scan.totalProtein ?? 0,
        carbs: scan.totalCarbs ?? 0,
        fat: scan.totalFat ?? 0,
        fiber: scan.totalFiber ?? 0,
        healthScore,
        imageUrl: scan.imageUrl,
        date: new Date(scan.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      });

      const file = new File([blob], "nutrisense-meal.png", { type: "image/png" });

      // Try Web Share API first (mobile)
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${scan.mealName ?? "My Meal"} — ${Math.round(scan.totalCalories ?? 0)} kcal`,
          text: `Just analyzed my meal with Nutrisense AI! 🥗 ${Math.round(scan.totalCalories ?? 0)} calories, ${(scan.totalProtein ?? 0).toFixed(0)}g protein`,
        });
        setShared(true);
        setTimeout(() => setShared(false), 3000);
      } else {
        // Fallback: download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `nutrisense-${(scan.mealName ?? "meal").replace(/\s+/g, "-").toLowerCase()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Meal card downloaded! Share it anywhere.");
        setShared(true);
        setTimeout(() => setShared(false), 3000);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        toast.error("Could not generate share card. Please try again.");
      }
    } finally {
      setSharing(false);
    }
  }, [scan, healthScore]);

  return (
    <Button
      onClick={handleShare}
      disabled={sharing}
      variant="outline"
      className="flex-1 h-12 gap-2 border-border hover:border-primary/50"
    >
      {sharing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : shared ? (
        <Check className="w-4 h-4 text-primary" />
      ) : (
        <Share2 className="w-4 h-4" />
      )}
      {sharing ? "Generating…" : shared ? "Shared!" : "Share Results"}
    </Button>
  );
}

// ─── Main Results Page ───────────────────────────────────────────────────────
export default function Results() {
  const { scanId } = useParams<{ scanId: string }>();
  const scanQuery = trpc.food.getScan.useQuery({ scanId: parseInt(scanId ?? "0") });

  if (scanQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!scanQuery.data) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground mb-4">Scan not found.</p>
          <Link href="/scan"><Button>Scan a Meal</Button></Link>
        </div>
      </div>
    );
  }

  const { scan, items } = scanQuery.data;
  const analysis = scan.analysisJson as {
    healthScore?: number;
    insights?: string;
    suggestions?: string[];
    isRawFood?: boolean;
    cookingRecipes?: Array<{
      name: string;
      description: string;
      cookTime: string;
      difficulty: string;
      steps: string[];
    }>;
  } | null;

  const totalMacros = (scan.totalProtein ?? 0) + (scan.totalCarbs ?? 0) + (scan.totalFat ?? 0);
  const pieData = [
    { name: "Protein", value: scan.totalProtein ?? 0, color: MACRO_COLORS.protein },
    { name: "Carbs", value: scan.totalCarbs ?? 0, color: MACRO_COLORS.carbs },
    { name: "Fat", value: scan.totalFat ?? 0, color: MACRO_COLORS.fat },
  ].filter((d) => d.value > 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container max-w-3xl py-8">
        {/* Back */}
        <Link href="/scan">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> Scan Another Meal
          </Button>
        </Link>

        {/* Meal name & image */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
          <img src={scan.imageUrl} alt={scan.mealName ?? "Meal"} className="w-full max-h-64 object-cover" />
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{scan.mealName ?? "Meal Analysis"}</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {new Date(scan.createdAt).toLocaleDateString("en-US", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                  })}
                </p>
              </div>
              {analysis?.healthScore && (
                <div className="flex-shrink-0 flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-bold">
                  <Star className="w-4 h-4" />
                  {analysis.healthScore}/10
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Calorie hero */}
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-2xl p-6 mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Flame className="w-6 h-6 text-primary" />
            <span className="text-muted-foreground font-medium">Total Calories</span>
          </div>
          <div className="text-6xl font-black text-foreground">
            {Math.round(scan.totalCalories ?? 0)}
          </div>
          <div className="text-muted-foreground text-sm mt-1">kcal</div>
        </div>

        {/* Macros + Chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Macro bars */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-5">Macronutrients</h2>
            <div className="space-y-4">
              <MacroBar label="Protein" value={scan.totalProtein ?? 0} max={totalMacros} color={MACRO_COLORS.protein} />
              <MacroBar label="Carbohydrates" value={scan.totalCarbs ?? 0} max={totalMacros} color={MACRO_COLORS.carbs} />
              <MacroBar label="Fat" value={scan.totalFat ?? 0} max={totalMacros} color={MACRO_COLORS.fat} />
              <MacroBar label="Fiber" value={scan.totalFiber ?? 0} max={totalMacros} color={MACRO_COLORS.fiber} />
            </div>
          </div>

          {/* Pie chart */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-4">Macro Split</h2>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => [`${val.toFixed(1)}g`]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Food items */}
        {items.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h2 className="font-bold text-lg mb-4">Food Items Detected</h2>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    {item.quantity && <p className="text-xs text-muted-foreground">{item.quantity}</p>}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-right">
                    <div>
                      <p className="font-bold">{Math.round(item.calories ?? 0)}</p>
                      <p className="text-xs text-muted-foreground">kcal</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="font-medium text-[oklch(0.72_0.22_145)]">{(item.protein ?? 0).toFixed(1)}g</p>
                      <p className="text-xs text-muted-foreground">protein</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="font-medium text-[oklch(0.65_0.2_200)]">{(item.carbs ?? 0).toFixed(1)}g</p>
                      <p className="text-xs text-muted-foreground">carbs</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="font-medium text-[oklch(0.75_0.18_60)]">{(item.fat ?? 0).toFixed(1)}g</p>
                      <p className="text-xs text-muted-foreground">fat</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Micronutrients */}
        {items.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h2 className="font-bold text-lg mb-4">Micronutrients (avg per item)</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Sodium", value: items.reduce((s, i) => s + (i.sodium ?? 0), 0), unit: "mg", icon: Droplets },
                { label: "Sugar", value: items.reduce((s, i) => s + (i.sugar ?? 0), 0), unit: "g", icon: Leaf },
                { label: "Vitamin C", value: items.reduce((s, i) => s + (i.vitaminC ?? 0), 0), unit: "mg", icon: Leaf },
                { label: "Iron", value: items.reduce((s, i) => s + (i.iron ?? 0), 0), unit: "mg", icon: Beef },
              ].map((micro, i) => (
                <div key={i} className="bg-secondary/50 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{micro.label}</p>
                  <p className="font-bold text-lg">{micro.value.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">{micro.unit}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Insights */}
        {analysis?.insights && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-6">
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" /> AI Nutritionist Insights
            </h2>
            <p className="text-muted-foreground leading-relaxed">{analysis.insights}</p>
            {analysis.suggestions && analysis.suggestions.length > 0 && (
              <div className="mt-4">
                <p className="font-semibold text-sm mb-2">Tips to improve this meal:</p>
                <ul className="space-y-1.5">
                  {analysis.suggestions.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-0.5">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Raw Food Cooking Suggestions */}
        {analysis?.isRawFood && analysis.cookingRecipes && analysis.cookingRecipes.length > 0 && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 mb-6">
            <h2 className="font-bold text-lg mb-1 flex items-center gap-2">
              <span className="text-2xl">🍳</span> Healthy Recipes You Can Make
            </h2>
            <p className="text-muted-foreground text-sm mb-4">We detected raw ingredients! Here are simple, healthy recipes you can cook right now.</p>
            <div className="space-y-4">
              {analysis.cookingRecipes.map((recipe, i) => (
                <details key={i} className="group bg-background/50 rounded-xl border border-border overflow-hidden">
                  <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                    <div>
                      <p className="font-semibold">{recipe.name}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{recipe.description}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{recipe.cookTime}</span>
                      <span className="text-xs bg-secondary px-2 py-1 rounded-full">{recipe.difficulty}</span>
                      <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                    </div>
                  </summary>
                  <div className="px-4 pb-4">
                    <p className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Steps</p>
                    <ol className="space-y-2">
                      {recipe.steps.map((step, j) => (
                        <li key={j} className="flex gap-3 text-sm">
                          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">{j + 1}</span>
                          <span className="text-muted-foreground">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/scan" className="flex-1">
            <Button variant="outline" className="w-full h-12 gap-2">
              <Camera className="w-4 h-4" /> Scan Another Meal
            </Button>
          </Link>
          <ShareButton scan={scan} healthScore={analysis?.healthScore} />
          <Link href={`/chat?scanId=${scan.id}`} className="flex-1">
            <Button className="w-full h-12 gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <MessageCircle className="w-4 h-4" /> Ask AI Nutritionist
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
