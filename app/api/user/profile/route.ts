import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isValidCharacterForGender,
  isCharacterName,
  isValidPreferenceForGender,
} from "@/lib/characters";

// POST /api/user/profile  → 가입 시 프로필 최초 생성
// PATCH /api/user/profile → 마이페이지 수정 (또는 기존 유저가 character만 채울 때)
export async function POST(request: NextRequest) {
  return upsertProfile(request, "insert");
}

export async function PATCH(request: NextRequest) {
  return upsertProfile(request, "update");
}

async function upsertProfile(request: NextRequest, mode: "insert" | "update") {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const {
    instagram_id,
    gender,
    is_visible,
    character,
    character_preference,
  } = body ?? {};

  // 최초 생성 시 필수값 검증
  if (mode === "insert") {
    if (!instagram_id || !gender || !character) {
      return NextResponse.json(
        { error: "instagram_id, gender, character는 필수입니다" },
        { status: 400 },
      );
    }
    if (!["male", "female"].includes(gender)) {
      return NextResponse.json(
        { error: "유효하지 않은 gender 값" },
        { status: 400 },
      );
    }
    if (!isValidCharacterForGender(character, gender)) {
      return NextResponse.json(
        { error: "성별에 맞는 캐릭터를 선택해주세요" },
        { status: 400 },
      );
    }
  }

  // instagram_id 공백 제거
  const cleanId = instagram_id?.trim().replace(/^@/, "");

  if (mode === "insert") {
    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      email: user.email!,
      instagram_id: cleanId,
      gender,
      character,
      consent_agreed: true,
    });
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "이미 프로필이 존재합니다" },
          { status: 409 },
        );
      }
      console.error("[user/profile POST]", error);
      return NextResponse.json({ error: "프로필 생성 실패" }, { status: 500 });
    }
  } else {
    // PATCH: 전달된 필드만 업데이트
    const updates: Record<string, unknown> = {};
    if (cleanId !== undefined) updates.instagram_id = cleanId;
    if (is_visible !== undefined) updates.is_visible = is_visible;

    // character / character_preference는 본인 gender 기반 검증이 필요하므로
    // 둘 중 하나라도 들어오면 기존 프로필을 한 번만 조회한다.
    const needsGender =
      character !== undefined || character_preference !== undefined;
    let existingGender: string | null = null;
    if (needsGender) {
      const { data: existing } = await supabase
        .from("profiles")
        .select("gender")
        .eq("id", user.id)
        .maybeSingle();
      if (!existing) {
        return NextResponse.json(
          { error: "프로필이 없습니다" },
          { status: 404 },
        );
      }
      existingGender = existing.gender;
    }

    if (character !== undefined) {
      if (!isCharacterName(character)) {
        return NextResponse.json(
          { error: "유효하지 않은 캐릭터" },
          { status: 400 },
        );
      }
      if (!isValidCharacterForGender(character, existingGender!)) {
        return NextResponse.json(
          { error: "성별에 맞는 캐릭터를 선택해주세요" },
          { status: 400 },
        );
      }
      updates.character = character;
    }

    if (character_preference !== undefined) {
      // null = "둘다" (필터 없음).
      if (!isValidPreferenceForGender(character_preference, existingGender!)) {
        return NextResponse.json(
          { error: "유효하지 않은 선호 캐릭터" },
          { status: 400 },
        );
      }
      updates.character_preference = character_preference;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "변경할 내용이 없습니다" },
        { status: 400 },
      );
    }

    let { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    // character_preference 컬럼 마이그레이션 미적용 시 폴백: 해당 키 제거 후 재시도.
    // PostgREST는 쓰기(write)에서 누락 컬럼을 PGRST204로, 읽기는 Postgres 네이티브 42703으로 반환한다.
    if (
      (error?.code === "42703" || error?.code === "PGRST204") &&
      "character_preference" in updates
    ) {
      const { character_preference: _omit, ...rest } = updates;
      void _omit;
      ({ error } = await supabase
        .from("profiles")
        .update(rest)
        .eq("id", user.id));
    }

    if (error) {
      console.error("[user/profile PATCH]", error);
      return NextResponse.json({ error: "프로필 수정 실패" }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
