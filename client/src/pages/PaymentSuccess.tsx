import { useEffect, useRef, useState } from "react";
import { Link, useSearch } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { CheckCircle, Crown, Loader2, Camera, MessageCircle } from "lucide-react";

const LOGO_URL = "/manus-storage/nutrisense_logo_736b579e.png";

export default function PaymentSuccess() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const sessionId = params.get("session_id");
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(!!sessionId);
  const utils = trpc.useUtils();
  const hasVerified = useRef(false);

  const verifyPayment = trpc.premium.verifyPayment.useMutation({
    onSuccess: (data) => {
      setVerified(data.success);
      setVerifying(false);
      if (data.success) {
        // Invalidate premium status so Navbar badge updates immediately
        utils.premium.getStatus.invalidate();
        utils.auth.me.invalidate();
      }
    },
    onError: () => {
      setVerifying(false);
    },
  });

  useEffect(() => {
    if (sessionId && !hasVerified.current) {
      hasVerified.current = true;
      verifyPayment.mutate({ sessionId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container max-w-lg py-20 text-center">
        {verifying ? (
          <div>
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Verifying your payment...</p>
            <p className="text-xs text-muted-foreground mt-2">This usually takes just a second</p>
          </div>
        ) : verified ? (
          <div className="animate-fade-in-up">
            {/* Success icon */}
            <div className="relative inline-flex mb-8">
              <img src={LOGO_URL} alt="Nutrisense AI" className="w-20 h-20 rounded-2xl" />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              <Crown className="w-4 h-4" />
              Lifetime Pass Activated
            </div>

            <h1 className="text-4xl font-black mb-4">Welcome to Premium!</h1>
            <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
              Your $29 USD Lifetime Pass is now active. You have unlimited access to all Nutrisense AI features — forever.
            </p>

            <div className="bg-card border border-border rounded-2xl p-6 mb-8 text-left">
              <h2 className="font-bold mb-4">Your Premium Features</h2>
              <div className="space-y-3">
                {[
                  "Unlimited food photo scans",
                  "Full AI nutrition analysis",
                  "Complete meal history & tracking",
                  "Unlimited AI Nutritionist chat",
                  "Daily nutrition reports",
                  "Lifetime updates included",
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/scan" className="flex-1">
                <Button className="w-full h-12 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
                  <Camera className="w-4 h-4" /> Scan Your First Meal
                </Button>
              </Link>
              <Link href="/chat" className="flex-1">
                <Button variant="outline" className="w-full h-12 gap-2">
                  <MessageCircle className="w-4 h-4" /> Chat with AI Nutritionist
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="w-8 h-8 text-yellow-500" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Payment Received!</h1>
            <p className="text-muted-foreground mb-2">
              Your payment was processed successfully. Your account will be upgraded within a few minutes.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              If your premium access doesn't activate automatically, please refresh the page or contact support.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/scan">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Start Scanning
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline">Go Home</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
