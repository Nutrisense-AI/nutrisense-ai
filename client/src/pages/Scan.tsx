import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { PaywallModal } from "@/components/PaywallModal";
import { BarcodeScanner, type FoodProduct } from "@/components/BarcodeScanner";
import { trpc } from "@/lib/trpc";
import { useSessionToken } from "@/hooks/useSessionToken";
import { toast } from "sonner";
import { Camera, Upload, X, Loader2, Zap, AlertCircle, Barcode, Utensils, BarChart3, Leaf } from "lucide-react";

// ─── Skeleton loading animation while AI analyzes ─────────────────────────────
function AnalysisSkeleton() {
  return (
    <div className="mt-8 space-y-4 animate-pulse">
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary/20 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-3 bg-muted rounded w-1/3" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-muted rounded-xl p-3 text-center">
              <div className="h-6 bg-muted-foreground/20 rounded mb-1 mx-auto w-10" />
              <div className="h-3 bg-muted-foreground/20 rounded w-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="h-4 bg-muted rounded w-1/3 mb-3" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-muted rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="h-4 bg-muted rounded w-1/4 mb-3" />
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded w-full" />
          <div className="h-3 bg-muted rounded w-5/6" />
          <div className="h-3 bg-muted rounded w-4/6" />
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-3 py-2">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
        <div className="text-sm text-muted-foreground">
          <span className="text-primary font-semibold">AI is analyzing</span> — identifying foods and calculating nutrition...
        </div>
      </div>
    </div>
  );
}

export default function Scan() {
  const [, navigate] = useLocation();
  const sessionToken = useSessionToken();
  const [preview, setPreview] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const usageQuery = trpc.food.checkUsage.useQuery(
    { sessionToken: sessionToken || undefined },
    { enabled: true }
  );

  const analyzeMutation = trpc.food.analyze.useMutation({
    onSuccess: (data) => {
      navigate(`/results/${data.scanId}`);
    },
    onError: (err) => {
      setIsAnalyzing(false);
      if (err.message === "FREE_LIMIT_REACHED") {
        setShowPaywall(true);
      } else {
        toast.error("Analysis failed: " + err.message);
      }
    },
  });

  const logBarcodeMutation = trpc.food.logBarcodeScan.useMutation({
    onSuccess: (data) => {
      toast.success(`"${data.mealName}" added to your meal log!`);
      navigate(`/results/${data.scanId}`);
    },
    onError: (err) => {
      toast.error("Failed to log product: " + err.message);
    },
  });

  const usage = usageQuery.data;
  const scansLeft = Math.max(0, (usage?.freeLimit ?? 3) - (usage?.scansUsed ?? 0));
  const canScan = usage?.canScan ?? true;
  const isPremium = usage?.isPremium ?? false;

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      toast.error("Camera access denied. Please use file upload instead.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setPreview(dataUrl);
    stopCamera();
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  const handleAnalyze = () => {
    if (!preview) return;
    if (!canScan && !isPremium) {
      setShowPaywall(true);
      return;
    }
    setIsAnalyzing(true);
    analyzeMutation.mutate({ imageBase64: preview, sessionToken: sessionToken || undefined });
  };

  const handleBarcodeProduct = (product: FoodProduct, barcode: string) => {
    setShowBarcodeScanner(false);
    logBarcodeMutation.mutate({
      sessionToken: sessionToken || undefined,
      productName: product.name,
      brand: product.brand || undefined,
      barcode,
      calories: product.calories,
      protein: product.protein,
      carbs: product.carbs,
      fat: product.fat,
      fiber: product.fiber,
      servingSize: product.servingSize,
      imageUrl: product.imageUrl,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />
      {showBarcodeScanner && (
        <BarcodeScanner
          onProductFound={handleBarcodeProduct}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}

      <div className="container max-w-2xl py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Scan Your Meal</h1>
          <p className="text-muted-foreground">
            Take a photo, upload an image, or scan a barcode for instant nutrition analysis
          </p>
        </div>

        {/* Usage indicator */}
        {!isPremium && (
          <div className={`flex items-center gap-2 p-3 rounded-xl mb-6 text-sm ${canScan ? "bg-primary/10 border border-primary/20 text-primary" : "bg-destructive/10 border border-destructive/20 text-destructive"}`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {canScan
              ? `${scansLeft} free scan${scansLeft !== 1 ? "s" : ""} remaining`
              : "Free scans used — upgrade to continue scanning"}
          </div>
        )}

        {/* Camera view */}
        {cameraActive && (
          <div className="relative rounded-2xl overflow-hidden mb-6 bg-black aspect-video">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <Button onClick={capturePhoto} size="lg" className="bg-white text-black hover:bg-white/90 font-bold gap-2">
                <Camera className="w-5 h-5" /> Capture
              </Button>
              <Button onClick={stopCamera} variant="outline" size="lg" className="bg-black/50 border-white/30 text-white">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Preview */}
        {preview && !cameraActive && (
          <div className="relative rounded-2xl overflow-hidden mb-6 bg-card border border-border">
            <img src={preview} alt="Food preview" className="w-full max-h-80 object-cover" />
            <button
              onClick={() => setPreview(null)}
              className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upload area */}
        {!preview && !cameraActive && !isAnalyzing && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-12 text-center cursor-pointer transition-colors mb-6 group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <p className="text-lg font-semibold mb-1">Drop your meal photo here</p>
            <p className="text-muted-foreground text-sm">or click to browse files</p>
            <p className="text-xs text-muted-foreground mt-2">JPG, PNG, WEBP up to 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        )}

        {/* Action buttons */}
        {!cameraActive && !isAnalyzing && (
          <div className="flex flex-col sm:flex-row gap-3">
            {!preview && (
              <>
                <Button
                  onClick={startCamera}
                  variant="outline"
                  className="flex-1 h-12 gap-2 border-border hover:border-primary/50"
                >
                  <Camera className="w-5 h-5" />
                  Camera
                </Button>
                <Button
                  onClick={() => setShowBarcodeScanner(true)}
                  variant="outline"
                  className="flex-1 h-12 gap-2 border-border hover:border-primary/50"
                >
                  <Barcode className="w-5 h-5" />
                  Scan Barcode
                </Button>
              </>
            )}
            {preview && (
              <>
                <Button
                  onClick={() => setPreview(null)}
                  variant="outline"
                  className="flex-1 h-12 gap-2"
                >
                  <X className="w-4 h-4" />
                  Retake
                </Button>
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="flex-1 h-12 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold glow-green"
                >
                  <Zap className="w-5 h-5" />
                  Analyze Nutrition
                </Button>
              </>
            )}
          </div>
        )}

        {/* Scan method info cards */}
        {!preview && !cameraActive && !isAnalyzing && (
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { icon: Camera, title: "Photo", desc: "Snap or upload any meal" },
              { icon: Barcode, title: "Barcode", desc: "Scan packaged foods" },
              { icon: Utensils, title: "AI Analysis", desc: "Full macro breakdown" },
            ].map((item, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-3 text-center">
                <item.icon className="w-5 h-5 text-primary mx-auto mb-1.5" />
                <p className="text-xs font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* Skeleton loading while AI analyzes */}
        {isAnalyzing && <AnalysisSkeleton />}
      </div>
    </div>
  );
}
