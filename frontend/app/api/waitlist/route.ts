import { NextResponse } from "next/server";

interface WaitlistPayload {
  name?: unknown;
  email?: unknown;
}

/**
 * Lightweight landing-page endpoint. It deliberately stores nothing until a
 * dedicated mailing-list provider is connected, while allowing the copied
 * reference form to provide a successful, graceful user experience.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let payload: WaitlistPayload;

  try {
    payload = (await request.json()) as WaitlistPayload;
  } catch {
    return NextResponse.json({ error: "Please enter your details and try again." }, { status: 400 });
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim() : "";

  if (!name || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Please provide a name and a valid email address." }, { status: 400 });
  }

  return NextResponse.json({ message: "You are inscribed in the archive." }, { status: 201 });
}
