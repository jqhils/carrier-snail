import { CHARACTERS, DEFAULT_CHARACTER_ID, getCharacter } from "./characters";

describe("character roster", () => {
  it("has several snails with unique ids", () => {
    expect(CHARACTERS.length).toBeGreaterThan(1);
    const ids = CHARACTERS.map((character) => character.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("resolves the default character", () => {
    expect(getCharacter(DEFAULT_CHARACTER_ID).id).toBe(DEFAULT_CHARACTER_ID);
  });

  it("falls back to the first snail for an unknown id", () => {
    expect(getCharacter("nope")).toBe(CHARACTERS[0]);
  });

  it("gives only the redbull snail a live power-up; the rest are cosmetic", () => {
    for (const character of CHARACTERS) {
      const hasModifier = Object.keys(character.modifier).length > 0;
      if (character.id === "redbull") {
        expect(hasModifier).toBe(true);
        expect(character.powerUp).not.toBe("");
      } else {
        expect(hasModifier).toBe(false);
        expect(character.powerUp).toBe("");
      }
    }
  });
});
