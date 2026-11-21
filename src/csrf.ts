import type { RequestHandler } from "express";
import { timingSafeEqual } from "node:crypto";
import { sendErrorPage } from "./errors.ts";

export function validateRequestOrigin(appOrigin: string): RequestHandler {
  const trustedOrigin = new URL(appOrigin).origin;

  return (req, res, next) => {
    if (req.method !== "POST") {
      next();
      return;
    }

    const origin = req.header("origin");
    if (origin) {
      if (origin === trustedOrigin) {
        next();
        return;
      }

      sendErrorPage(
        res,
        403,
        "Forbidden",
        "The request did not come from the app.",
      );
      return;
    }

    const referer = req.header("referer");
    if (!referer) {
      sendErrorPage(
        res,
        403,
        "Forbidden",
        "The request did not come from the app.",
      );
      return;
    }

    try {
      if (new URL(referer).origin === trustedOrigin) {
        next();
        return;
      }
    } catch {
      // Malformed referrers fail closed.
    }

    sendErrorPage(
      res,
      403,
      "Forbidden",
      "The request did not come from the app.",
    );
  };
}

export function csrfTokensMatch(expected: string, actual: unknown): boolean {
  if (typeof actual !== "string") {
    return false;
  }

  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}
