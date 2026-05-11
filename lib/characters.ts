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

const PLACEHOLDER_QUOTE = "좋은 인연을 기다리는 평범한 한 사람의 짧은 이야기";

export const CHARACTERS: Record<CharacterName, CharacterMeta> = {
  마님: {
    name: "마님",
    svg: "/characters/manim.svg",
    gender: "female",
    quote: PLACEHOLDER_QUOTE,
  },
  아씨: {
    name: "아씨",
    svg: "/characters/assi.svg",
    gender: "female",
    quote: PLACEHOLDER_QUOTE,
  },
  돌쇠: {
    name: "돌쇠",
    svg: "/characters/dolsoe.svg",
    gender: "male",
    quote: PLACEHOLDER_QUOTE,
  },
  도령: {
    name: "도령",
    svg: "/characters/doryeong.svg",
    gender: "male",
    quote: PLACEHOLDER_QUOTE,
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
    typeof value === "string" &&
    (CHARACTER_NAMES as string[]).includes(value)
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
