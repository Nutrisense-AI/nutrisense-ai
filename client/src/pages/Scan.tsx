import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { PaywallModal } from "@/components/PaywallModal";
import { trpc } from "@/lib/trpc";
import { useSessionToken } from "@/hooks/useSessionToken";
import { toast } from "sonner";
import { Camera, Upload, X, Loader2, Zap, AlertCircle } from "lucide-react";

export default function Scan() {
  const [, navigate] = useLocation();
  const sessionToken = useSessionToken();
  const [preview, setPreview] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Only query usage once we have a session token (avoids empty-string query)
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />

      <div className="container max-w-2xl py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Scan Your Meal</h1>
          <p className="text-muted-foreground">
            Take a photo or upload an image to get instant nutrition analysis
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
        {!preview && !cameraActive && (
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
        {!cameraActive && (
          <div className="flex flex-col sm:flex-row gap-3">
            {!preview && (
              <Button
                onClick={startCamera}
                variant="outline"
                className="flex-1 h-12 gap-2 border-border hover:border-primary/50"
              >
                <Camera className="w-5 h-5" />
                Use Camera
              </Button>
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
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Analyze Nutrition
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        )}

        {isAnalyzing && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-3 bg-card border border-border rounded-2xl px-6 py-4">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <div className="text-left">
                <p className="font-semibold text-sm">AI is analyzing your meal...</p>
                <p className="text-xs text-muted-foreground">Identifying foods and calculating nutrition</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
