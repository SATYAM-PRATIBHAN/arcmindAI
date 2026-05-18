import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DEFAULT_MAX_BYTES = 750 * 1024;
const MAX_BYTES = Number(process.env.API_BODY_LIMIT_BYTES) || DEFAULT_MAX_BYTES;

export function middleware(req: NextRequest) {
  if (!["POST", "PUT", "PATCH"].includes(req.method)) return;

  const declared = req.headers.get("content-length");
  if (!declared) return;

  const size = Number(declared);
  if (!Number.isFinite(size)) return;

  if (size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Body payload too large (max ${MAX_BYTES} bytes)` },
      { status: 413 },
    );
  }
}

export const config = {
  matcher: ["/api/:path*"],
};
