import crypto from "node:crypto";
import type { Response } from "express";
import { prisma } from "../lib/prisma.js";
import { redisService } from "./redisService.js";
import { issueSession, clearSession } from "../middleware/auth.js";

/**
 * Mobile-OTP authentication.
 *
 * Request OTP -> code stored in Redis (5-min TTL) -> verify -> JWT session
 * cookie. Rate limits: 3 sends/hour/mobile, 5 verify attempts/15min.
 *
 * SMS delivery: with no SMS_PROVIDER_API_KEY set, the code is logged and
 * (outside production) returned in the API response so the flow is fully
 * testable locally without an SMS vendor. Wire a real provider in
 * `sendSms` — that's the only function that changes.
 */

const OTP_TTL_SECONDS = 300; // 5 minutes
const OTP_LENGTH = 6;
const MAX_SENDS_PER_HOUR = 3;
const MAX_VERIFY_ATTEMPTS = 5;

export type OtpPurpose = "login" | "pan_update";

function normalizeMobile(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // Accept 10-digit Indian numbers and +91-prefixed forms; store E.164.
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  return `+91${local}`;
}

async function sendSms(mobile: string, code: string): Promise<void> {
  if (process.env.SMS_PROVIDER_API_KEY) {
    // TODO: call your SMS provider here (MSG91, Twilio, etc.) with `code`.
    console.log(`[sms] OTP ${code} -> ${mobile} (via provider)`);
    return;
  }
  console.log(`[sms:dev] OTP for ${mobile}: ${code}`);
}

export const authService = {
  normalizeMobile,

  async requestOtp(rawMobile: string, purpose: OtpPurpose) {
    const mobile = normalizeMobile(rawMobile);
    if (mobile.length !== 13) { // +91 followed by 10 digits
      const err = new Error("Enter a valid 10-digit Indian mobile number.");
      (err as Error & { status?: number }).status = 400;
      throw err;
    }

    const allowed = await redisService.hitRateLimit(`otp:req:${mobile}`, MAX_SENDS_PER_HOUR, 3600);
    if (!allowed) {
      const err = new Error("Too many OTP requests. Try again after an hour.");
      (err as Error & { status?: number }).status = 429;
      throw err;
    }

    const code = crypto.randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, "0");
    await redisService.setOtp(mobile, code, purpose, OTP_TTL_SECONDS);
    await sendSms(mobile, code);

    return {
      mobile,
      expiresInSec: OTP_TTL_SECONDS,
      // Dev convenience only; never exposed when NODE_ENV=production.
      devCode: process.env.NODE_ENV === "production" || process.env.SMS_PROVIDER_API_KEY ? undefined : code,
    };
  },

  async verifyOtp(rawMobile: string, code: string, purpose: OtpPurpose) {
    const mobile = normalizeMobile(rawMobile);
    const attemptsKey = `otp:ver:${mobile}`;
    const allowed = await redisService.hitRateLimit(attemptsKey, MAX_VERIFY_ATTEMPTS, 900);
    if (!allowed) {
      const err = new Error("Too many wrong attempts. Request a fresh OTP.");
      (err as Error & { status?: number }).status = 429;
      throw err;
    }

    const stored = await redisService.getOtp(mobile, purpose);
    if (!stored || stored !== code.trim()) {
      const err = new Error("That code is invalid or expired. Request a new one.");
      (err as Error & { status?: number }).status = 401;
      throw err;
    }

    await redisService.deleteOtp(mobile, purpose);

    // First successful login creates the account — OTP *is* the signup.
    const user = await prisma.user.upsert({
      where: { mobile },
      update: {},
      create: { mobile },
    });
    return user;
  },

  startSession(res: Response, userId: string, mobile: string) {
    issueSession(res, { userId, mobile });
  },

  endSession(res: Response) {
    clearSession(res);
  },

  async updatePan(userId: string, pan: string) {
    return prisma.user.update({ where: { id: userId }, data: { pan } });
  },

  async updateProfile(userId: string, data: { name?: string; email?: string; gstin?: string }) {
    return prisma.user.update({ where: { id: userId }, data });
  },
};
