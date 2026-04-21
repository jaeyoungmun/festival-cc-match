import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase.from("profiles").select("count");

  if (error) {
    return NextResponse.json(
      {
        connected: false,
        error: error.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    connected: true,
    message: "Supabase 연결 성공!",
  });
}
