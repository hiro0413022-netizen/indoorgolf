import Stripe from "stripe";

const apiKey = process.env.STRIPE_SECRET_KEY;

/**
 * Stripe クライアント。
 * STRIPE_SECRET_KEY が未設定の環境（開発初期など）では null を返し、
 * API 側で「Stripe 未設定」として安全にハンドリングする。
 */
export const stripe = apiKey
  ? new Stripe(apiKey, { apiVersion: "2026-05-27.dahlia" })
  : null;

export function requireStripe(): Stripe {
  if (!stripe) {
    throw new Error(
      "Stripe が未設定です。環境変数 STRIPE_SECRET_KEY を設定してください。"
    );
  }
  return stripe;
}

export const APP_URL = process.env.APP_URL ?? "http://localhost:3000";
