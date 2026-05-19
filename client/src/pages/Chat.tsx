import { useState, useRef, useEffect } from "react";
import { useSearch } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useSessionToken } from "@/hooks/useSessionToken";
import { Loader2, Send, Bot, User, MessageCircle, ImagePlus, X } from "lucide-react";
import { Streamdown } from "streamdown";

const LOGO_URL = "/manus-storage/nutrisense_logo_736b579e.png";

const STARTER_QUESTIONS = [
  "What should I eat for breakfast to boost energy?",
  "How much protein do I need daily?",
  "What foods help with weight loss?",
  "Is my meal healthy for someone trying to build muscle?",
];

export default function Chat() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const scanId = params.get("scanId") ? parseInt(params.get("scanId")!) : undefined;

  const sessionToken = useSessionToken();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [localMessages, setLocalMessages] = useState<Array<{ role: "user" | "assistant"; content: string; imagePreview?: string }>>([])
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const historyQuery = trpc.chat.getHistory.useQuery({ sessionToken, scanId });
  const scanQuery = trpc.food.getScan.useQuery(
    { scanId: scanId! },
    { enabled: !!scanId }
  );

  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      setLocalMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
      setIsLoading(false);
      historyQuery.refetch();
    },
    onError: (err) => {
      setIsLoading(false);
      setLocalMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    },
  });

  const allMessages: Array<{ role: "user" | "assistant"; content: string; imagePreview?: string }> = [
    ...(historyQuery.data ?? []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ...localMessages,
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImageBase64(dataUrl);
      setImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleSend = (text?: string) => {
    const msg = text ?? input.trim();
    if (!msg || isLoading) return;
    setInput("");
    const capturedImage = imageBase64;
    const capturedPreview = imagePreview;
    setImageBase64(null);
    setImagePreview(null);
    setIsLoading(true);
    setLocalMessages((prev) => [...prev, { role: "user", content: msg, imagePreview: capturedPreview ?? undefined }]);

    const scanContext = scanQuery.data
      ? JSON.stringify({
          mealName: scanQuery.data.scan.mealName,
          calories: scanQuery.data.scan.totalCalories,
          protein: scanQuery.data.scan.totalProtein,
          carbs: scanQuery.data.scan.totalCarbs,
          fat: scanQuery.data.scan.totalFat,
        })
      : undefined;

    sendMessage.mutate({ message: msg, sessionToken, scanId, scanContext, imageBase64: capturedImage ?? undefined });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      {/* Chat header */}
      <div className="border-b border-border bg-card/50">
        <div className="container max-w-3xl py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <img src={LOGO_URL} alt="AI" className="w-7 h-7 rounded-lg" />
          </div>
          <div>
            <h1 className="font-bold">AI Nutritionist</h1>
            <p className="text-xs text-muted-foreground">
              {scanId && scanQuery.data
                ? `Discussing: ${scanQuery.data.scan.mealName ?? "your meal"}`
                : "Ask me anything about nutrition"}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-green-400 font-medium">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Online
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-3xl py-6 space-y-4">
          {/* Welcome */}
          {allMessages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Your AI Nutritionist</h2>
              <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto">
                Ask me anything about nutrition, your scanned meals, or how to improve your diet.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                {STARTER_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="text-left bg-card border border-border hover:border-primary/40 rounded-xl p-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {allMessages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className="max-w-[80%] flex flex-col gap-1.5">
                {msg.imagePreview && (
                  <img src={msg.imagePreview} alt="Attached" className="rounded-xl max-h-48 object-cover border border-border" />
                )}
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border border-border rounded-bl-sm text-foreground"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Streamdown>{msg.content}</Streamdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1.5 items-center">
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background/80 backdrop-blur-xl">
        <div className="container max-w-3xl py-4">
          {/* Image preview */}
          {imagePreview && (
            <div className="mb-3 relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-20 rounded-xl border border-border object-cover" />
              <button
                onClick={() => { setImageBase64(null); setImagePreview(null); }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center text-xs"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            {/* Hidden file input */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => imageInputRef.current?.click()}
              disabled={isLoading}
              title="Attach an image"
              className="rounded-xl shrink-0 border-border hover:border-primary/50"
            >
              <ImagePlus className="w-4 h-4" />
            </Button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Ask about nutrition, attach a photo, or describe your meal..."
              className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors placeholder:text-muted-foreground"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSend()}
              disabled={(!input.trim() && !imageBase64) || isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 rounded-xl"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
