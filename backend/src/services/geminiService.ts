/**
 * Gemini AI assistant backend client.
 * API key stays server-side in backend/.env
 */

const MODEL = "gemini-3.6-flash";

const ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export interface AssistantContext {
  userName?: string | null;
  totalIncome: number | null;
  totalTaxPaid: number | null;
  estimatedLiability?: number | null;
  balancePayable?: number | null;
  filingStatus: string;
  hasPan?: boolean | null;
  unconfirmedReceipts?: number | null;
  turnoverOverGstThreshold: boolean;
}

const SYSTEM_PROMPT = `
You are the in-app tax assistant for Gig, an income-tax helper
for Indian gig workers such as Swiggy, Zomato, Uber, Ola,
Upwork and Fiverr earners.

Rules:
- Answer questions about Indian income tax, ITR, TDS, GST,
  deadlines and this application.
- Use the user's ledger context when relevant.
- Be concise: normally 2-5 sentences.
- If the question is unrelated to tax or this application,
  politely redirect the user.
- Do not claim to provide certified legal or tax advice.
- Suggest consulting a CA for complex or exceptional cases.
`;

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function contextBlock(ctx: AssistantContext): string {
  return `
--- USER LEDGER CONTEXT ---

User: ${ctx.userName || "unnamed"}

PAN on file:
$ {ctx.hasPan ? "yes" : "no"}

Total reported income:
// $ {formatINR(ctx.totalIncome)}

Tax already deducted/paid:
// $ {formatINR(ctx.totalTaxPaid)} 

Estimated tax liability:
// $ {formatINR(ctx.estimatedLiability)}

// $ {
  ctx.balancePayable >= 0
   // ? Balance payable: $ {formatINR(ctx.balancePayable)}
    // : Refund due: $ {formatINR(Math.abs(ctx.balancePayable))}
}

Filing status:
$ {ctx.filingStatus}

Unconfirmed receipts:
$ {ctx.unconfirmedReceipts}

Turnover over GST threshold:
$ {ctx.turnoverOverGstThreshold ? "yes" : "no"}

-----------------------------
`;
}

export const geminiService = {
  isConfigured(): boolean {
    return Boolean(
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY.trim()
    );
  },

  async chat(
    messages: ChatMessage[],
    ctx: AssistantContext
  ): Promise<string> {

    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      const err = new Error(
        "GEMINI_API_KEY is missing from backend/.env"
      );

      (err as Error & { status?: number }).status = 503;

      throw err;
    }

    const contents = messages.map((message) => ({
      role: message.role,
      parts: [
        {
          text: message.text,
        },
      ],
    }));

    const requestBody = {
      systemInstruction: {
        parts: [
          {
            text:
              SYSTEM_PROMPT +
              "\n\n" +
              contextBlock(ctx),
          },
        ],
      },

      contents,

      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 512,
      },
    };

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },

        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error(
          "Gemini API error:",
          response.status,
          responseText
        );

        const error = new Error(
          `Gemini API error ${response.status}: ${responseText.slice(
            0,
            500
          )}`
        );

        (error as Error & { status?: number }).status = 502;

        throw error;
      }

      const data = JSON.parse(responseText) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              text?: string;
            }>;
          };
        }>;
      };

      const reply =
        data.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? "")
          .join("")
          .trim();

      if (!reply) {
        return "Sorry, I couldn't generate a reply. Please try again.";
      }

      return reply;

    } catch (error) {
      console.error("Gemini request failed:", error);
      throw error;
    }
  },
};

export default geminiService;