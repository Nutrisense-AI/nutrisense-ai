import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Loader2, X, Barcode, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface FoodProduct {
  name: string;
  brand: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servingSize: string;
  imageUrl?: string;
}

interface BarcodeScannerProps {
  onProductFound: (product: FoodProduct, barcode: string) => void;
  onClose: () => void;
}

async function fetchProductByBarcode(barcode: string): Promise<FoodProduct | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,brands,nutriments,serving_size,image_url`,
      { headers: { "User-Agent": "NutrisenseAI/1.0 (contact@nutrisense.ai)" } }
    );
    if (!res.ok) return null;
    const data = await res.json() as {
      status: number;
      product?: {
        product_name?: string;
        brands?: string;
        serving_size?: string;
        image_url?: string;
        nutriments?: {
          "energy-kcal_100g"?: number;
          "energy-kcal_serving"?: number;
          proteins_100g?: number;
          carbohydrates_100g?: number;
          fat_100g?: number;
          fiber_100g?: number;
        };
      };
    };
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    const n = p.nutriments ?? {};
    // Prefer per-serving values, fall back to per-100g
    const calories = n["energy-kcal_serving"] ?? n["energy-kcal_100g"] ?? 0;
    const protein = n.proteins_100g ?? 0;
    const carbs = n.carbohydrates_100g ?? 0;
    const fat = n.fat_100g ?? 0;
    const fiber = n.fiber_100g ?? 0;

    return {
      name: p.product_name ?? "Unknown Product",
      brand: p.brands ?? "",
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      fiber: Math.round(fiber * 10) / 10,
      servingSize: p.serving_size ?? "100g",
      imageUrl: p.image_url,
    };
  } catch {
    return null;
  }
}

export function BarcodeScanner({ onProductFound, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<FoodProduct | null>(null);
  const [barcode, setBarcode] = useState("");
  const [manualBarcode, setManualBarcode] = useState("");
  const [error, setError] = useState("");
  const hasScanned = useRef(false);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScanner = async () => {
    try {
      const scanner = new Html5Qrcode("barcode-reader");
      scannerRef.current = scanner;
      setScanning(true);
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 280, height: 140 } },
        async (decodedText) => {
          if (hasScanned.current) return;
          hasScanned.current = true;
          await stopScanner();
          await lookupBarcode(decodedText);
        },
        () => {} // ignore frame errors
      );
    } catch {
      setScanning(false);
      setError("Camera access denied. Enter barcode manually below.");
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
    } catch {
      // ignore
    }
    setScanning(false);
  };

  const lookupBarcode = async (code: string) => {
    setBarcode(code);
    setLoading(true);
    setError("");
    const found = await fetchProductByBarcode(code);
    setLoading(false);
    if (found) {
      setProduct(found);
    } else {
      setError(`No product found for barcode ${code}. Try a different product or enter manually.`);
    }
  };

  const handleManualLookup = async () => {
    if (!manualBarcode.trim()) return;
    hasScanned.current = true;
    await stopScanner();
    await lookupBarcode(manualBarcode.trim());
  };

  const handleUseProduct = () => {
    if (product) {
      onProductFound(product, barcode);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Barcode className="w-5 h-5 text-primary" />
            <h2 className="font-bold">Barcode Scanner</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Camera view */}
          {!product && !loading && (
            <>
              <div
                id="barcode-reader"
                className="rounded-xl overflow-hidden bg-black mb-4"
                style={{ minHeight: "200px" }}
              />
              {error && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl mb-4 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}
              {/* Manual entry */}
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter barcode manually..."
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualLookup()}
                  className="flex-1 h-10 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
                />
                <Button onClick={handleManualLookup} size="sm" className="bg-primary text-primary-foreground">
                  Look up
                </Button>
              </div>
            </>
          )}

          {/* Loading */}
          {loading && (
            <div className="py-12 text-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Looking up barcode {barcode}...</p>
            </div>
          )}

          {/* Product found */}
          {product && !loading && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                {product.imageUrl && (
                  <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-contain rounded-lg bg-white flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-xs text-primary font-semibold">Product Found</span>
                  </div>
                  <p className="font-bold text-sm leading-tight">{product.name}</p>
                  {product.brand && <p className="text-xs text-muted-foreground">{product.brand}</p>}
                  <p className="text-xs text-muted-foreground mt-0.5">Per {product.servingSize}</p>
                </div>
              </div>

              {/* Nutrition grid */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Calories", value: product.calories, unit: "kcal" },
                  { label: "Protein", value: product.protein, unit: "g" },
                  { label: "Carbs", value: product.carbs, unit: "g" },
                  { label: "Fat", value: product.fat, unit: "g" },
                ].map((item) => (
                  <div key={item.label} className="bg-background border border-border rounded-lg p-2 text-center">
                    <p className="text-lg font-black text-foreground">{item.value}</p>
                    <p className="text-xs text-muted-foreground">{item.unit}</p>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setProduct(null);
                    setBarcode("");
                    hasScanned.current = false;
                    startScanner();
                  }}
                >
                  Scan Again
                </Button>
                <Button
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                  onClick={handleUseProduct}
                >
                  Add to Meal Log
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export type { FoodProduct };
