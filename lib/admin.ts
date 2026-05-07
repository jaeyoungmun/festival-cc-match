import { createClient } from "@/lib/supabase/server";

/**
 * 운영자 권한 체크 결과.
 *  - "unauthenticated": 로그인 안됨 → 401
 *  - "forbidden": 로그인은 됐지만 admin 아님 → 403
 *  - { adminId }: 관리자 통과
 */
export type AdminCheck =
  | { ok: true; adminId: string }
  | { ok: false; reason: "unauthenticated" | "forbidden" };

export async function requireAdmin(): Promise<AdminCheck> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, reason: "unauthenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) return { ok: false, reason: "forbidden" };
  return { ok: true, adminId: user.id };
}

/**
 * 코드 PIN 생성용 알파벳. 혼동되기 쉬운 글자(0/O, 1/I/L) 제외.
 * 31 chars × 8자리 ≈ 8.5×10^11 조합.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generatePinCode(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join(
    "",
  );
  return `${chars.slice(0, 4)}-${chars.slice(4)}`;
}

/**
 * 입력된 코드를 정규화. 대문자, 공백/하이픈 제거 후 4-4 형식으로.
 */
export function normalizePinCode(input: string): string | null {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length !== 8) return null;
  if (![...cleaned].every((c) => ALPHABET.includes(c))) return null;
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
}
