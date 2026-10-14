import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, ensureDefaultAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await ensureDefaultAdmin();
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }
    return NextResponse.json({ authenticated: true, user });
  } catch (err: any) {
    return NextResponse.json({ authenticated: false, error: err?.message }, { status: 500 });
  }
}
