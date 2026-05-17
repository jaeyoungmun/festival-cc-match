import type { SupabaseClient } from "@supabase/supabase-js";
import { type CharacterName, type Gender, oppositeGender } from "./characters";

// 피드 후보 풀 상한. 행사 규모(<= 1000명)에서는 사실상 전수 조회.
const CANDIDATE_POOL_LIMIT = 1000;

export type FeedCandidate = {
  id: string;
  instagram_id: string;
  character: CharacterName;
};

// 다음 카드를 한 장 뽑아 반환. 없으면 null.
//
// 필터:
//  - 이성(반대 성별)
//  - 본인 제외
//  - character가 설정된 프로필(미완성 프로필 제외)
//  - is_visible != false (탈퇴/숨김 처리된 유저 제외)
//  - 본인의 character_preference가 있으면 해당 캐릭터로 한정
//  - 이미 seen_users에 있는 대상 제외
//
// 후보 풀에서 무작위로 1명 선정.
//
// 호출자는 반드시 라우트에서 auth 검증 후 service_role 클라이언트를 넘긴다.
// profiles 테이블 RLS가 본인 row로 한정돼 있어 다른 유저 후보 SELECT가 막히기 때문.
// 반환 컬럼이 코드에서 명시적으로 좁혀지므로 컬럼 노출 통제는 여기서 한다.
export async function pickNextProfile(
  supabase: SupabaseClient,
  viewerId: string,
): Promise<FeedCandidate | null> {
  const [viewerRes, seenRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("gender, character_preference")
      .eq("id", viewerId)
      .maybeSingle(),
    supabase
      .from("seen_users")
      .select("target_id")
      .eq("viewer_id", viewerId),
  ]);

  type Viewer = { gender: Gender; character_preference: CharacterName | null };
  let viewer: Viewer | null = null;

  if (viewerRes.error?.code === "42703") {
    // character_preference 컬럼 미적용 환경 — gender만 가져오고 선호 필터는 비활성화.
    const fallback = await supabase
      .from("profiles")
      .select("gender")
      .eq("id", viewerId)
      .maybeSingle();
    if (fallback.data) {
      viewer = {
        gender: fallback.data.gender as Gender,
        character_preference: null,
      };
    }
  } else if (viewerRes.data) {
    viewer = viewerRes.data as unknown as Viewer;
  }

  if (!viewer) return null;

  const seenSet = new Set(
    (seenRes.data ?? []).map((r) => r.target_id as string),
  );

  let query = supabase
    .from("profiles")
    .select("id, instagram_id, character")
    .eq("gender", oppositeGender(viewer.gender))
    .neq("id", viewerId)
    .not("character", "is", null)
    .or("is_visible.is.null,is_visible.eq.true");

  if (viewer.character_preference) {
    query = query.eq("character", viewer.character_preference);
  }

  const { data, error } = await query.limit(CANDIDATE_POOL_LIMIT);
  if (error) throw error;

  const pool = ((data ?? []) as FeedCandidate[]).filter(
    (c) => !seenSet.has(c.id),
  );
  if (pool.length === 0) return null;

  return pool[Math.floor(Math.random() * pool.length)];
}
