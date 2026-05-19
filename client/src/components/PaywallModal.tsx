import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CheckCircle, Zap, Camera, MessageCircle, History, Lock } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
}

const FEATURES = [
  { icon: Camera, text: "Unlimited food photo scans" },
  { icon: Zap, text: "Instant AI nutrition analysis" },
  { icon: MessageCircle, text: "Unlimited AI Nutritionist chat" },
  { icon: History, text: "Full meal history & tracking" },
  { icon: CheckCircle, text: "Daily & weekly nutrition reports" },
  { icon: CheckCircle, text: "Lifetime access — pay once, forever" },
];

export function PaywallModal({ open, onClose }: PaywallModalProps) {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const createCheckout = trpc.premium.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      setIsLoading(false);
      toast.success("Redirecting to secure checkout...");
      // Open Stripe checkout in a new tab so user doesn't lose their session
      window.open(data.url, "_blank");
      onClose();
    },
    onError: (err) => {
      toast.error("Payment error: " + err.message);
      setIsLoading(false);
    },
  });

  const handleUpgrade = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl("/");
      return;
    }
    setIsLoading(true);
    createCheckout.mutate({ origin: window.location.origin });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-border p-0 overflow-hidden">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-[oklch(0.72_0.22_145)] to-[oklch(0.55_0.2_200)] p-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <Lock className="w-7 h-7 text-white" />
            </div>
          </div>
          <DialogTitle className="text-white text-2xl font-bold mb-1">
            Unlock Nutrisense AI
          </DialogTitle>
          <p className="text-white/80 text-sm">
            You've used your 3 free scans. Upgrade to continue.
          </p>
        </div>

        <div className="p-6">
          {/* Price */}
          <div className="text-center mb-6">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-black text-foreground">$29</span>
              <span className="text-muted-foreground text-lg">USD</span>
            </div>
            <p className="text-primary font-semibold text-sm mt-1">One-time payment · Lifetime Access</p>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-6">
            {FEATURES.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-3 h-3 text-primary" />
                </div>
                <span className="text-sm text-foreground">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full h-12 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 glow-green"
          >
            {isLoading ? "Preparing checkout..." : isAuthenticated ? "Get Lifetime Pass — $29 USD" : "Sign in to Upgrade"}
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-3">
            Secure payment via Stripe · No subscription · One-time payment
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
