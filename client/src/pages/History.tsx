import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useSessionToken } from "@/hooks/useSessionToken";
import { useState, useEffect } from "react";
import { Loader2, Camera, Flame, Beef, Wheat, Droplets, Trash2, ArrowRight, Target, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

type MealScan = {
  id: number;
  mealName: string | null;
  imageUrl: string;
  totalCalories: number | null;
  totalProtein: number | null;
  totalCarbs: number | null;
  totalFat: number | null;
  createdAt: Date;
};

function MealCard({ scan, onDelete }: { scan: MealScan; onDelete: (id: number) => void }) {
  const { isAuthenticated } = useAuth();
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-colors group">
      <div className="relative">
        <img src={scan.imageUrl} alt={scan.mealName ?? "Meal"} className="w-full h-40 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white font-bold text-sm truncate">{scan.mealName ?? "Meal"}</p>
          <p className="text-white/70 text-xs">
            {new Date(scan.createdAt).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            })}
          </p>
        </div>
        {isAuthenticated && (
          <button
            onClick={(e) => { e.preventDefault(); onDelete(scan.id); }}
            className="absolute top-2 right-2 bg-black/60 hover:bg-destructive text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="p-4">
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { icon: Flame, label: "kcal", value: Math.round(scan.totalCalories ?? 0), color: "text-orange-400" },
            { icon: Beef, label: "protein", value: `${(scan.totalProtein ?? 0).toFixed(0)}g`, color: "text-green-400" },
            { icon: Wheat, label: "carbs", value: `${(scan.totalCarbs ?? 0).toFixed(0)}g`, color: "text-blue-400" },
            { icon: Droplets, label: "fat", value: `${(scan.totalFat ?? 0).toFixed(0)}g`, color: "text-yellow-400" },
          ].map((m, i) => (
            <div key={i} className="text-center">
              <p className={`font-bold text-sm ${m.color}`}>{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
        <Link href={`/results/${scan.id}`}>
          <Button variant="ghost" size="sm" className="w-full gap-1 text-muted-foreground hover:text-foreground text-xs">
            View Details <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function GoalBar({ label, value, goal, color, unit }: { label: string; value: number; goal: number; color: string; unit: string }) {
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
  const over = value > goal;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className={over ? "text-red-400 font-semibold" : "font-medium"}>
          {value.toFixed(0)}{unit} / {goal}{unit}
        </span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: over ? "#f87171" : color }}
        />
      </div>
    </div>
  );
}

export default function History() {
  const sessionToken = useSessionToken();
  const { isAuthenticated } = useAuth();
  const historyQuery = trpc.food.getHistory.useQuery({ sessionToken });
  const goalsQuery = trpc.goals.get.useQuery(undefined, { enabled: isAuthenticated });
  const updateGoals = trpc.goals.update.useMutation({
    onSuccess: () => { goalsQuery.refetch(); toast.success("Goals updated!"); setShowGoalsModal(false); },
    onError: (err) => toast.error("Failed to save goals: " + err.message),
  });
  const deleteMutation = trpc.food.deleteScan.useMutation({
    onSuccess: () => {
      historyQuery.refetch();
      toast.success("Scan deleted");
    },
    onError: (err) => toast.error("Delete failed: " + err.message),
  });

  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [goalForm, setGoalForm] = useState({ calorieGoal: 2000, proteinGoal: 150, carbsGoal: 250, fatGoal: 65, fiberGoal: 25 });

  useEffect(() => {
    if (goalsQuery.data) {
      setGoalForm({
        calorieGoal: goalsQuery.data.calorieGoal ?? 2000,
        proteinGoal: goalsQuery.data.proteinGoal ?? 150,
        carbsGoal: goalsQuery.data.carbsGoal ?? 250,
        fatGoal: goalsQuery.data.fatGoal ?? 65,
        fiberGoal: goalsQuery.data.fiberGoal ?? 25,
      });
    }
  }, [goalsQuery.data]);

  const goals = goalsQuery.data ?? { calorieGoal: 2000, proteinGoal: 150, carbsGoal: 250, fatGoal: 65, fiberGoal: 25 };

  const scans = (historyQuery.data ?? []) as MealScan[];

  // Daily totals
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayScans = scans.filter((s) => new Date(s.createdAt) >= today);
  const todayCalories = todayScans.reduce((sum, s) => sum + (s.totalCalories ?? 0), 0);
  const todayProtein = todayScans.reduce((sum, s) => sum + (s.totalProtein ?? 0), 0);
  const todayCarbs = todayScans.reduce((sum, s) => sum + (s.totalCarbs ?? 0), 0);
  const todayFat = todayScans.reduce((sum, s) => sum + (s.totalFat ?? 0), 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Meal History</h1>
            <p className="text-muted-foreground mt-1">Track your nutrition over time</p>
          </div>
          <Link href="/scan">
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Camera className="w-4 h-4" /> Scan Meal
            </Button>
          </Link>
        </div>

        {/* Today's summary + Goals Progress */}
        {todayScans.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Today's Summary</h2>
              {isAuthenticated && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => setShowGoalsModal(true)}
                >
                  <Target className="w-3.5 h-3.5" /> Set Goals
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Calories", value: Math.round(todayCalories), unit: "kcal", color: "text-orange-400" },
                { label: "Protein", value: `${todayProtein.toFixed(1)}`, unit: "g", color: "text-green-400" },
                { label: "Carbs", value: `${todayCarbs.toFixed(1)}`, unit: "g", color: "text-blue-400" },
                { label: "Fat", value: `${todayFat.toFixed(1)}`, unit: "g", color: "text-yellow-400" },
              ].map((stat, i) => (
                <div key={i} className="bg-secondary/50 rounded-xl p-4 text-center">
                  <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.unit}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
            {/* Goal progress bars */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Daily Goal Progress</p>
              <GoalBar label="Calories" value={todayCalories} goal={goals.calorieGoal ?? 2000} color="#fb923c" unit=" kcal" />
              <GoalBar label="Protein" value={todayProtein} goal={goals.proteinGoal ?? 150} color="#4ade80" unit="g" />
              <GoalBar label="Carbs" value={todayCarbs} goal={goals.carbsGoal ?? 250} color="#60a5fa" unit="g" />
              <GoalBar label="Fat" value={todayFat} goal={goals.fatGoal ?? 65} color="#fbbf24" unit="g" />
            </div>
          </div>
        )}

        {/* Goals Modal */}
        {showGoalsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Daily Nutrition Goals</h3>
                <button onClick={() => setShowGoalsModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                {[
                  { key: "calorieGoal", label: "Calories (kcal)", min: 500, max: 10000 },
                  { key: "proteinGoal", label: "Protein (g)", min: 10, max: 500 },
                  { key: "carbsGoal", label: "Carbs (g)", min: 10, max: 1000 },
                  { key: "fatGoal", label: "Fat (g)", min: 10, max: 500 },
                  { key: "fiberGoal", label: "Fiber (g)", min: 5, max: 100 },
                ].map(({ key, label, min, max }) => (
                  <div key={key}>
                    <label className="text-sm font-medium block mb-1.5">{label}</label>
                    <input
                      type="number"
                      min={min}
                      max={max}
                      value={goalForm[key as keyof typeof goalForm]}
                      onChange={(e) => setGoalForm((prev: typeof goalForm) => ({ ...prev, [key]: parseInt(e.target.value) || min }))}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                ))}
              </div>
              <Button
                onClick={() => updateGoals.mutate(goalForm)}
                disabled={updateGoals.isPending}
                className="w-full mt-5 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {updateGoals.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Goals"}
              </Button>
            </div>
          </div>
        )}

        {/* Sign-in prompt */}
        {!isAuthenticated && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-sm">Sign in to save your history</p>
              <p className="text-xs text-muted-foreground mt-0.5">Your scans are saved locally. Sign in to sync across devices.</p>
            </div>
            <Button
              size="sm"
              onClick={() => (window.location.href = getLoginUrl("/history"))}
              className="flex-shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Sign In
            </Button>
          </div>
        )}

        {/* Meal grid */}
        {historyQuery.isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : scans.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">No meals scanned yet</h3>
            <p className="text-muted-foreground mb-6">Start by scanning your first meal to track your nutrition.</p>
            <Link href="/scan">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                <Camera className="w-4 h-4" /> Scan Your First Meal
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {scans.map((scan) => (
              <MealCard
                key={scan.id}
                scan={scan}
                onDelete={(id) => deleteMutation.mutate({ scanId: id })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
