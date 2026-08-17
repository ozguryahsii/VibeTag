import type { CardBandKey } from "@/lib/card-bands";
import type { Scene } from "@/components/card/scene";

import { monochrome } from "./monochrome";
import { ash } from "./ash";
import { clay } from "./clay";
import { sand } from "./sand";
import { amber } from "./amber";
import { coral } from "./coral";
import { sunset } from "./sunset";
import { bloom } from "./bloom";
import { radiant } from "./radiant";
import { aurora } from "./aurora";
import { fireworks } from "./fireworks";
import { supernova } from "./supernova";

/**
 * Every Vibe Card scene, keyed by band.
 *
 * `Record<CardBandKey, Scene>` is the whole safety net: add a band to
 * `lib/card-bands.ts` without writing its scene and this file stops compiling,
 * rather than a card silently rendering as `undefined` for somebody.
 */
export const SCENES: Record<CardBandKey, Scene> = {
  monochrome,
  ash,
  clay,
  sand,
  amber,
  coral,
  sunset,
  bloom,
  radiant,
  aurora,
  fireworks,
  supernova,
};
