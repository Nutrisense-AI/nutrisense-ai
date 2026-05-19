import { useParams, Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, Camera, MessageCircle, Flame, Beef, Wheat, Droplets, Leaf, Star } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

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
