import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidCharacterForGender, isCharacterName } from "@/lib/characters";

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
<<<<<<< HEAD
  const { instagram_id, gender, department, is_visible, character } =
    body ?? {};
=======
  const { instagram_id, gender, is_visible } = body ?? {};
>>>>>>> develop

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
<<<<<<< HEAD
      department: department ?? null,
      character,
=======
>>>>>>> develop
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

    if (character !== undefined) {
      if (!isCharacterName(character)) {
        return NextResponse.json(
          { error: "유효하지 않은 캐릭터" },
          { status: 400 },
        );
      }
      // 본인 gender와 캐릭터 성별 일치 확인 필요
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
      if (!isValidCharacterForGender(character, existing.gender)) {
        return NextResponse.json(
          { error: "성별에 맞는 캐릭터를 선택해주세요" },
          { status: 400 },
        );
      }
      updates.character = character;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "변경할 내용이 없습니다" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (error) {
      console.error("[user/profile PATCH]", error);
      return NextResponse.json({ error: "프로필 수정 실패" }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
