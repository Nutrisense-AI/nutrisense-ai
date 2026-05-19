import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import {
  createMealItems,
  createMealScan,
  deleteMealScan,
  FREE_SCAN_LIMIT,
  getChatHistory,
  getMealScanById,
  getMealScansBySession,
  getMealScansByUser,
  getOrCreateAnonymousUsage,
  getUserByOpenId,
  getUserGoals,
  incrementAnonymousScanCount,
  saveChatMessage,
  setUserPremium,
  upsertUserGoals,
} from "./db";

// ─── Food Analysis ─────────────────────────────────────────────────────────────

const foodRouter = router({
  // Check if user can scan (usage limit)
  checkUsage: publicProcedure
    .input(z.object({ sessionToken: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user) {
        return { canScan: true, isPremium: ctx.user.isPremium, scansUsed: 0, freeLimit: FREE_SCAN_LIMIT };
      }
      if (!input.sessionToken) {
        return { canScan: true, isPremium: false, scansUsed: 0, freeLimit: FREE_SCAN_LIMIT };
      }
      const usage = await getOrCreateAnonymousUsage(input.sessionToken);
      const scansUsed = usage?.scanCount ?? 0;
      return {
        canScan: scansUsed < FREE_SCAN_LIMIT,
        isPremium: false,
        scansUsed,
        freeLimit: FREE_SCAN_LIMIT,
      };
    }),

  // Analyze a food image
  analyze: publicProcedure
    .input(
      z.object({
        imageBase64: z.string(), // base64 data URL
        sessionToken: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check usage limit for non-premium users
      if (!ctx.user || !ctx.user.isPremium) {
        if (!ctx.user && input.sessionToken) {
          const usage = await getOrCreateAnonymousUsage(input.sessionToken);
          if ((usage?.scanCount ?? 0) >= FREE_SCAN_LIMIT) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "FREE_LIMIT_REACHED",
            });
          }
        }
      }

      // Upload image to storage
      const base64Data = input.imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const imageBuffer = Buffer.from(base64Data, "base64");
      const mimeMatch = input.imageBase64.match(/^data:(image\/\w+);base64,/);
      const mimeType = (mimeMatch?.[1] ?? "image/jpeg") as string;
      const ext = mimeType.split("/")[1] ?? "jpg";
      const fileKey = `meals/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { key: imageKey, url: imageUrl } = await storagePut(fileKey, imageBuffer, mimeType);

      // Call AI vision to analyze the food
      const analysisResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert AI nutritionist and food recognition system. Analyze the food in the image and return a detailed JSON response. Be precise and thorough.

Return ONLY valid JSON in this exact format:
{
  "mealName": "string (overall meal name)",
  "totalCalories": number,
  "totalProtein": number (grams),
  "totalCarbs": number (grams),
  "totalFat": number (grams),
  "totalFiber": number (grams),
  "healthScore": number (1-10, where 10 is healthiest),
  "items": [
    {
      "name": "string",
      "quantity": "string (e.g. '1 cup', '200g', '1 piece')",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "fiber": number,
      "sodium": number (mg),
      "sugar": number (grams),
      "vitaminC": number (mg),
      "calcium": number (mg),
      "iron": number (mg)
    }
  ],
  "insights": "string (2-3 sentences about the nutritional quality of this meal)",
  "suggestions": ["string", "string"] (2-3 actionable tips to improve this meal),
  "isRawFood": boolean (true if the image shows raw/uncooked ingredients rather than a prepared meal),
  "cookingRecipes": [
    {
      "name": "string (recipe name)",
      "description": "string (1-2 sentences)",
      "cookTime": "string (e.g. '20 mins')",
      "difficulty": "string (Easy/Medium)",
      "steps": ["string", "string", "string"]
    }
  ] (2-3 healthy simple recipes if isRawFood is true, otherwise empty array)
}`,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: input.imageBase64, detail: "high" },
              },
              {
                type: "text",
                text: "Please analyze this food image and provide detailed nutritional information.",
              },
            ],
          },
        ],
        response_format: { type: "json_object" } as { type: "json_object" },
      });

      const rawContentRaw = analysisResponse.choices[0]?.message?.content ?? "{}";
      const rawContent = typeof rawContentRaw === "string" ? rawContentRaw : JSON.stringify(rawContentRaw);
      let analysis: {
        mealName?: string;
        totalCalories?: number;
        totalProtein?: number;
        totalCarbs?: number;
        totalFat?: number;
        totalFiber?: number;
        healthScore?: number;
        items?: Array<{
          name: string;
          quantity?: string;
          calories?: number;
          protein?: number;
          carbs?: number;
          fat?: number;
          fiber?: number;
          sodium?: number;
          sugar?: number;
          vitaminC?: number;
          calcium?: number;
          iron?: number;
        }>;
        insights?: string;
        suggestions?: string[];
      };
      try {
        analysis = JSON.parse(rawContent);
      } catch {
        analysis = { mealName: "Unknown Meal", totalCalories: 0, items: [] };
      }

      // Save scan to database
      const scanId = await createMealScan({
        userId: ctx.user?.id,
        sessionToken: input.sessionToken,
        imageUrl,
        imageKey,
        mealName: analysis.mealName ?? "Meal",
        totalCalories: analysis.totalCalories ?? 0,
        totalProtein: analysis.totalProtein ?? 0,
        totalCarbs: analysis.totalCarbs ?? 0,
        totalFat: analysis.totalFat ?? 0,
        totalFiber: analysis.totalFiber ?? 0,
        analysisJson: analysis,
      });

      // Save individual items
      if (analysis.items && analysis.items.length > 0) {
        await createMealItems(
          analysis.items.map((item) => ({
            scanId,
            name: item.name,
            quantity: item.quantity,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            fiber: item.fiber,
            sodium: item.sodium,
            sugar: item.sugar,
            vitaminC: item.vitaminC,
            calcium: item.calcium,
            iron: item.iron,
          }))
        );
      }

      // Increment anonymous usage counter
      if (!ctx.user && input.sessionToken) {
        await incrementAnonymousScanCount(input.sessionToken);
      }

      return { scanId, analysis, imageUrl };
    }),

  // Get a single scan result
  getScan: publicProcedure
    .input(z.object({ scanId: z.number() }))
    .query(async ({ input }) => {
      const result = await getMealScanById(input.scanId);
      if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Scan not found" });
      return result;
    }),

  // Get meal history
  getHistory: publicProcedure
    .input(z.object({ sessionToken: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user) {
        return getMealScansByUser(ctx.user.id);
      }
      if (input.sessionToken) {
        return getMealScansBySession(input.sessionToken);
      }
      return [];
    }),

  // Log a barcode-scanned product as a meal entry
  logBarcodeScan: publicProcedure
    .input(
      z.object({
        sessionToken: z.string().optional(),
        productName: z.string(),
        brand: z.string().optional(),
        barcode: z.string(),
        calories: z.number(),
        protein: z.number(),
        carbs: z.number(),
        fat: z.number(),
        fiber: z.number(),
        servingSize: z.string().optional(),
        imageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const mealName = input.brand
        ? `${input.productName} (${input.brand})`
        : input.productName;

      const scanId = await createMealScan({
        userId: ctx.user?.id,
        sessionToken: input.sessionToken,
        imageUrl: input.imageUrl ?? "",
        imageKey: `barcode/${input.barcode}`,
        mealName,
        totalCalories: input.calories,
        totalProtein: input.protein,
        totalCarbs: input.carbs,
        totalFat: input.fat,
        totalFiber: input.fiber,
        analysisJson: {
          mealName,
          totalCalories: input.calories,
          totalProtein: input.protein,
          totalCarbs: input.carbs,
          totalFat: input.fat,
          totalFiber: input.fiber,
          healthScore: 5,
          items: [
            {
              name: input.productName,
              quantity: input.servingSize ?? "1 serving",
              calories: input.calories,
              protein: input.protein,
              carbs: input.carbs,
              fat: input.fat,
              fiber: input.fiber,
            },
          ],
          insights: `Scanned from barcode ${input.barcode}.`,
          suggestions: [],
          isRawFood: false,
          cookingRecipes: [],
        },
      });

      await createMealItems([
        {
          scanId,
          name: input.productName,
          quantity: input.servingSize ?? "1 serving",
          calories: input.calories,
          protein: input.protein,
          carbs: input.carbs,
          fat: input.fat,
          fiber: input.fiber,
        },
      ]);

      if (!ctx.user && input.sessionToken) {
        await incrementAnonymousScanCount(input.sessionToken);
      }

      return { scanId, mealName };
    }),

  // Delete a scan
  deleteScan: protectedProcedure
    .input(z.object({ scanId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteMealScan(input.scanId, ctx.user.id);
      return { success: true };
    }),
});

// ─── AI Chat ───────────────────────────────────────────────────────────────────

const chatRouter = router({
  getHistory: publicProcedure
    .input(
      z.object({
        sessionToken: z.string().optional(),
        scanId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return getChatHistory({
        userId: ctx.user?.id,
        sessionToken: input.sessionToken,
        scanId: input.scanId,
        limit: 50,
      });
    }),

  sendMessage: publicProcedure
    .input(
      z.object({
        message: z.string().min(1).max(2000),
        sessionToken: z.string().optional(),
        scanId: z.number().optional(),
        scanContext: z.string().optional(),
        imageBase64: z.string().optional(), // Optional image attachment
      })
    )
    .mutation(async ({ ctx, input }) => {
      const history = await getChatHistory({
        userId: ctx.user?.id,
        sessionToken: input.sessionToken,
        scanId: input.scanId,
        limit: 20,
      });

      const systemPrompt = `You are Nutrisense AI, an expert AI nutritionist and health coach. You help users understand their food choices, nutritional needs, and how to improve their diet.

${input.scanContext ? `The user has just scanned a meal with this nutritional data: ${input.scanContext}` : ""}

If the user sends an image, analyze it thoroughly — identify foods, estimate nutrition, and provide detailed advice. Be friendly, encouraging, and scientifically accurate. Keep responses concise but informative (2-4 paragraphs max).`;

      // Build user content — text only or text + image
      const userContentParts: Array<import("./_core/llm").TextContent | import("./_core/llm").ImageContent> = [
        { type: "text" as const, text: input.message },
      ];
      if (input.imageBase64) {
        userContentParts.push({
          type: "image_url" as const,
          image_url: { url: input.imageBase64, detail: "high" as const },
        });
      }

      const messages: import("./_core/llm").Message[] = [
        { role: "system" as const, content: systemPrompt },
        ...history.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
        { role: "user" as const, content: input.imageBase64 ? userContentParts : input.message },
      ];

      // Save user message (store text only in DB)
      const savedUserContent = input.imageBase64
        ? `[Image attached] ${input.message}`
        : input.message;
      await saveChatMessage({
        userId: ctx.user?.id,
        sessionToken: input.sessionToken,
        scanId: input.scanId,
        role: "user",
        content: savedUserContent,
      });

      const response = await invokeLLM({ messages });
      const assistantContentRaw = response.choices[0]?.message?.content ?? "I'm sorry, I couldn't process that. Please try again.";
      const assistantContent = typeof assistantContentRaw === "string" ? assistantContentRaw : JSON.stringify(assistantContentRaw);

      await saveChatMessage({
        userId: ctx.user?.id,
        sessionToken: input.sessionToken,
        scanId: input.scanId,
        role: "assistant",
        content: assistantContent,
      });

      return { content: assistantContent };
    }),
});

// ─── Goals ─────────────────────────────────────────────────────────────────────

const goalsRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const goals = await getUserGoals(ctx.user.id);
    return goals ?? {
      calorieGoal: 2000,
      proteinGoal: 150,
      carbsGoal: 250,
      fatGoal: 65,
      fiberGoal: 25,
    };
  }),

  update: protectedProcedure
    .input(
      z.object({
        calorieGoal: z.number().min(500).max(10000),
        proteinGoal: z.number().min(10).max(500),
        carbsGoal: z.number().min(10).max(1000),
        fatGoal: z.number().min(10).max(500),
        fiberGoal: z.number().min(5).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await upsertUserGoals({ userId: ctx.user.id, ...input });
      return { success: true };
    }),
});

// ─── Stripe / Premium ─────────────────────────────────────────────────────────

const premiumRouter = router({
  getStatus: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return { isPremium: false };
    const user = await getUserByOpenId(ctx.user.openId);
    return { isPremium: user?.isPremium ?? false };
  }),

  createCheckoutSession: protectedProcedure
    .input(z.object({ origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe not configured" });
      }

      // Use the official Stripe Price ID for the Nutrisense AI Lifetime Pass
      const STRIPE_PRICE_ID = "price_1TYcSc6881RmKyZ1JoW4nDXG";

      const params = new URLSearchParams({
        "payment_method_types[]": "card",
        "line_items[0][price]": STRIPE_PRICE_ID,
        "line_items[0][quantity]": "1",
        mode: "payment",
        allow_promotion_codes: "true",
        success_url: `${input.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${input.origin}/`,
        "metadata[userId]": String(ctx.user.id),
        "metadata[userOpenId]": ctx.user.openId,
        "customer_email": ctx.user.email ?? "",
      });

      const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("Stripe error:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create checkout session" });
      }

      const session = await response.json() as { url: string; id: string };
      return { url: session.url, sessionId: session.id };
    }),

  // Verify payment and unlock premium
  verifyPayment: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe not configured" });
      }

      const response = await fetch(
        `https://api.stripe.com/v1/checkout/sessions/${input.sessionId}`,
        {
          headers: { Authorization: `Bearer ${stripeSecretKey}` },
        }
      );

      if (!response.ok) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to verify payment" });
      }

      const session = await response.json() as {
        payment_status: string;
        payment_intent: string;
        metadata: { userId?: string };
      };

      if (session.payment_status === "paid") {
        await setUserPremium(ctx.user.id, session.payment_intent);
        return { success: true, isPremium: true };
      }

      return { success: false, isPremium: false };
    }),
});

// ─── App Router ────────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  food: foodRouter,
  chat: chatRouter,
  premium: premiumRouter,
  goals: goalsRouter,
});

export type AppRouter = typeof appRouter;
