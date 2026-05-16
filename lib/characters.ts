// 캐릭터 메타데이터 — 4종 (마님/아씨/돌쇠/도령)
//
// 멘트는 일단 테스트용으로 4종 모두 동일. 추후 캐릭터마다 다른 문구로 교체 예정.

export type CharacterName = "마님" | "아씨" | "돌쇠" | "도령";

export type Gender = "male" | "female";

export type CharacterMeta = {
  name: CharacterName;
  svg: string;
  gender: Gender;
  quote: string;
};

const CHA_QUOTE = {
  manim: "내 곁에 머무는 것만으로도 당신을 특별하게 만들어 줄 여유",
  assi: "흩날리는 꽃잎처럼, 당신의 마음에 사뿐히 내려앉고 싶어요",
  dolsoe: "어떤 바람에도 흔들리지 않고 당신을 지켜낼 단단한 버팀목",
  doryeong: "어지러운 글공부보다, 당신의 눈동자를 읽는 것이 더 즐겁구료",
};

export const CHARACTERS: Record<CharacterName, CharacterMeta> = {
  마님: {
    name: "마님",
    svg: "/characters/manim.svg",
    gender: "female",
    quote: CHA_QUOTE.manim,
  },
  아씨: {
    name: "아씨",
    svg: "/characters/assi.svg",
    gender: "female",
    quote: CHA_QUOTE.assi,
  },
  돌쇠: {
    name: "돌쇠",
    svg: "/characters/dolsoe.svg",
    gender: "male",
    quote: CHA_QUOTE.dolsoe,
  },
  도령: {
    name: "도령",
    svg: "/characters/doryeong.svg",
    gender: "male",
    quote: CHA_QUOTE.doryeong,
  },
};

export const CHARACTER_NAMES: CharacterName[] = [
  "마님",
  "아씨",
  "돌쇠",
  "도령",
];

export function charactersByGender(gender: Gender): CharacterMeta[] {
  return CHARACTER_NAMES.map((n) => CHARACTERS[n]).filter(
    (c) => c.gender === gender,
  );
}

export function isCharacterName(value: unknown): value is CharacterName {
  return (
    typeof value === "string" && (CHARACTER_NAMES as string[]).includes(value)
  );
}

export function isValidCharacterForGender(
  character: string,
  gender: string,
): boolean {
  if (!isCharacterName(character)) return false;
  if (gender !== "male" && gender !== "female") return false;
  return CHARACTERS[character].gender === gender;
}

export function oppositeGender(gender: Gender): Gender {
  return gender === "male" ? "female" : "male";
}

// 선호 캐릭터는 본인 성별의 반대여야 함 (피드는 이성만 노출).
// null은 "둘다" (= 필터 없음).
export function isValidPreferenceForGender(
  value: unknown,
  myGender: string,
): value is CharacterName | null {
  if (value === null) return true;
  if (!isCharacterName(value)) return false;
  if (myGender !== "male" && myGender !== "female") return false;
  return CHARACTERS[value].gender === oppositeGender(myGender);
}
