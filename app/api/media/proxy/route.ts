import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOST_SUFFIX = ".twimg.com";

function isAllowedHost(hostname: string): boolean {
  return hostname === "video.twimg.com" || hostname.endsWith(ALLOWED_HOST_SUFFIX);
}

function buildProxyHeaders(upstream: Response): Headers {
  const headers = new Headers();
  const pass = [
    "content-type",
    "content-length",
    "accept-ranges",
    "content-range",
    "cache-control",
    "etag",
    "last-modified",
  ];

  for (const key of pass) {
    const value = upstream.headers.get(key);
    if (value) headers.set(key, value);
  }

  return headers;
}

async function proxyRequest(request: NextRequest, method: "GET" | "HEAD") {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) {
    return NextResponse.json({ ok: false, message: "Missing url" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid url" }, { status: 400 });
  }

  if (target.protocol !== "https:" || !isAllowedHost(target.hostname)) {
    return NextResponse.json({ ok: false, message: "Forbidden target" }, { status: 403 });
  }

  const range = request.headers.get("range");
  const upstream = await fetch(target.toString(), {
    method,
    headers: range ? { Range: range } : undefined,
    redirect: "follow",
    cache: "no-store",
  });

  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json({ ok: false, message: "Upstream fetch failed" }, { status: upstream.status });
  }

  const headers = buildProxyHeaders(upstream);
  return new NextResponse(method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    headers,
  });
}

export async function GET(request: NextRequest) {
  return proxyRequest(request, "GET");
}

export async function HEAD(request: NextRequest) {
  return proxyRequest(request, "HEAD");
}
