import { NextRequest, NextResponse } from "next/server";

const POSTGREST_URL =
  process.env.POSTGREST_URL ?? "http://localhost:3001";

// Proxy all requests to PostgREST
async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const postgrestPath = "/" + path.join("/");
  const search = request.nextUrl.search; // includes ?
  const url = `${POSTGREST_URL}${postgrestPath}${search}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Forward Prefer header if present
  const prefer = request.headers.get("Prefer");
  if (prefer) headers["Prefer"] = prefer;

  const body =
    request.method !== "GET" && request.method !== "HEAD"
      ? await request.text()
      : undefined;

  try {
    const res = await fetch(url, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });

    const responseBody = res.status === 204 ? null : await res.text();

    return new NextResponse(responseBody, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to database" },
      { status: 502 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
