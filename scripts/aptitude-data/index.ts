import type { AptitudeSeed } from "./types.js";
import { QUANT_ARITHMETIC } from "./quant-arithmetic.js";
import { QUANT_APPLIED } from "./quant-applied.js";
import { LOGICAL } from "./logical.js";
import { VERBAL } from "./verbal.js";
import { DATA_INTERPRETATION } from "./data-interpretation.js";
import { BANK_NUMBER_SYSTEM } from "./bank-number-system.js";
import { BANK_PERCENTAGES } from "./bank-percentages.js";
import { BANK_PROFIT_LOSS } from "./bank-profit-loss.js";
import { BANK_RATIO } from "./bank-ratio.js";
import { BANK_AVERAGES } from "./bank-averages.js";
import { BANK_AGES } from "./bank-ages.js";
import { BANK_TIME_WORK } from "./bank-time-work.js";
import { BANK_TSD } from "./bank-tsd.js";
import { BANK_INTEREST } from "./bank-interest.js";
import { BANK_PNC_PROBABILITY } from "./bank-pnc-probability.js";
import { BANK_MIXTURES_MENSURATION } from "./bank-mixtures-mensuration.js";
import { BANK_SERIES } from "./bank-series.js";
import { BANK_CODING } from "./bank-coding.js";
import { BANK_RELATIONS_DIRECTIONS } from "./bank-relations-directions.js";
import { BANK_ANALOGIES } from "./bank-analogies.js";
import { BANK_SYLLOGISMS_SEATING } from "./bank-syllogisms-seating.js";
import { BANK_MATH_REASONING } from "./bank-math-reasoning.js";
import { BANK_VOCABULARY } from "./bank-vocabulary.js";
import { BANK_GRAMMAR } from "./bank-grammar.js";
import { BANK_READING } from "./bank-reading.js";
import { BANK_DI } from "./bank-di.js";
import { BANK_QUANT_TOPUP } from "./bank-quant-topup.js";
import { BANK_REASONING_TOPUP } from "./bank-reasoning-topup.js";
import { BANK_FINAL } from "./bank-final.js";
import { BANK_EXTRA } from "./bank-extra.js";

/**
 * The whole aptitude bank, in the order topics appear in the syllabus.
 * scripts/seed-aptitude.ts validates and upserts this; add a file here and
 * its questions are picked up automatically.
 */
export const APTITUDE_QUESTIONS: AptitudeSeed[] = [
  ...QUANT_ARITHMETIC,
  ...QUANT_APPLIED,
  ...LOGICAL,
  ...VERBAL,
  ...DATA_INTERPRETATION,
  ...BANK_NUMBER_SYSTEM,
  ...BANK_PERCENTAGES,
  ...BANK_PROFIT_LOSS,
  ...BANK_RATIO,
  ...BANK_AVERAGES,
  ...BANK_AGES,
  ...BANK_TIME_WORK,
  ...BANK_TSD,
  ...BANK_INTEREST,
  ...BANK_PNC_PROBABILITY,
  ...BANK_MIXTURES_MENSURATION,
  ...BANK_SERIES,
  ...BANK_CODING,
  ...BANK_RELATIONS_DIRECTIONS,
  ...BANK_ANALOGIES,
  ...BANK_SYLLOGISMS_SEATING,
  ...BANK_MATH_REASONING,
  ...BANK_VOCABULARY,
  ...BANK_GRAMMAR,
  ...BANK_READING,
  ...BANK_DI,
  ...BANK_QUANT_TOPUP,
  ...BANK_REASONING_TOPUP,
  ...BANK_FINAL,
  ...BANK_EXTRA,
];
