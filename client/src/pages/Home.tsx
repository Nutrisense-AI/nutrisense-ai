import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Camera, Zap, BarChart3, MessageCircle, Shield, Star, ArrowRight, CheckCircle } from "lucide-react";

const LOGO_URL = "/manus-storage/nutrisense_logo_736b579e.png";

const FEATURES = [
  {
    icon: Camera,
    title: "Snap & Analyze",
    desc: "Take a photo or upload any meal image. Our AI identifies every food item instantly.",
  },
  {
    icon: Zap,
    title: "Instant Nutrition",
    desc: "Get calories, protein, carbs, fat, fiber, and 10+ micronutrients in seconds.",
  },
  {
    icon: BarChart3,
    title: "Track Your Progress",
    desc: "View your full meal history with daily totals and beautiful macro charts.",
  },
  {
    icon: MessageCircle,
    title: "AI Nutritionist",
    desc: "Chat with your personal AI nutritionist for advice, tips, and meal optimization.",
  },
  {
    icon: Shield,
    title: "Lifetime Access",
    desc: "Pay once, use forever. No subscriptions, no hidden fees. $29 USD one-time.",
  },
  {
    icon: Star,
    title: "Science-Backed",
    desc: "Powered by state-of-the-art vision AI trained on millions of food images.",
  },
];

const STEPS = [
  { num: "01", title: "Snap Your Meal", desc: "Take a photo or upload an image of any food." },
  { num: "02", title: "AI Analyzes It", desc: "Our AI identifies every ingredient and calculates nutrition." },
  { num: "03", title: "See Your Results", desc: "Get a full breakdown of calories, macros, and micronutrients." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        </div>

        <div className="container relative pt-20 pb-24 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-8 animate-fade-in-up">
            <Zap className="w-3.5 h-3.5" />
            AI-Powered Nutrition Analysis
          </div>

          {/* Logo + Heading */}
          <div className="flex justify-center mb-6 animate-fade-in-up stagger-1">
            <img src={LOGO_URL} alt="Nutrisense AI" className="w-20 h-20 rounded-2xl shadow-2xl" />
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 animate-fade-in-up stagger-2">
            Know exactly what
            <br />
            <span className="gradient-text">you're eating</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up stagger-3">
            Snap a photo of any meal and get instant AI-powered nutrition analysis.
            Calories, macros, micronutrients — all in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up stagger-4">
            <Link href="/scan">
              <Button size="lg" className="h-14 px-8 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 glow-green gap-2">
                <Camera className="w-5 h-5" />
                Scan Your First Meal Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">3 free scans · No credit card required</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-t border-border">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-muted-foreground text-lg">Three simple steps to know your nutrition</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={i} className="relative text-center group">
                <div className="text-7xl font-black text-primary/10 mb-4 group-hover:text-primary/20 transition-colors">
                  {step.num}
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 right-0 translate-x-1/2 text-border text-2xl">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 border-t border-border">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need</h2>
            <p className="text-muted-foreground text-lg">Powerful features to take control of your nutrition</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/40 hover:bg-card/80 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-20 border-t border-border">
        <div className="container max-w-2xl text-center">
          <div className="bg-card border border-border rounded-3xl p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-3 py-1 rounded-full mb-6">
                <Star className="w-3.5 h-3.5" />
                Lifetime Access
              </div>
              <h2 className="text-4xl font-black mb-2">
                <span className="gradient-text">$29 USD</span>
              </h2>
              <p className="text-muted-foreground mb-8 text-lg">One-time payment. Unlimited forever.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left">
                {[
                  "Unlimited food scans",
                  "Full AI nutrition analysis",
                  "Complete meal history",
                  "AI Nutritionist chat",
                  "Daily nutrition reports",
                  "Lifetime updates included",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/scan">
                <Button size="lg" className="w-full h-12 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 glow-green">
                  Start Free — 3 Scans on Us
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground mt-3">
                Try 3 scans free. Upgrade anytime for $29 USD — no subscription.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Nutrisense AI" className="w-6 h-6 rounded" />
            <span className="text-sm font-semibold">Nutrisense AI</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2025 Nutrisense AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
