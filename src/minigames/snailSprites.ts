import type { ImageSourcePropType } from "react-native";

import businessman from "../../assets/snails/businessman.png";
import compsci from "../../assets/snails/compsci.png";
import graduate from "../../assets/snails/graduate.png";
import redbull from "../../assets/snails/redbull.png";
import train from "../../assets/snails/train.png";

// Snail portrait art (illustrations: a snail with a prop). Shown on a DARK card
// so the black-background pieces blend in. These are PORTRAITS only — the
// in-game snail stays code-drawn so it can recolor per hatched snail.
const PORTRAIT_BY_KEY: Record<string, ImageSourcePropType> = {
  businessman,
  compsci,
  graduate,
  redbull,
  train
};

export const SNAIL_PORTRAITS: ImageSourcePropType[] = Object.values(
  PORTRAIT_BY_KEY
);

// Hatched snails have random ids and no art field. If the id is one of the known
// portrait keys (used by the demo harness) we return it directly; otherwise we
// pick a portrait deterministically from the id so it's stable per snail. Swap
// for a direct lookup once the team adds a sprite/type field to the Snail.
export function portraitForSnail(snailId: string): ImageSourcePropType {
  const keyed = PORTRAIT_BY_KEY[snailId];
  if (keyed) {
    return keyed;
  }
  let hash = 0;
  for (let index = 0; index < snailId.length; index += 1) {
    hash = (hash * 31 + snailId.charCodeAt(index)) >>> 0;
  }
  return SNAIL_PORTRAITS[hash % SNAIL_PORTRAITS.length];
}
