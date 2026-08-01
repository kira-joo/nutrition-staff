import { BmrFormula, BmrSex } from "src/common/enums";

export interface CalculateBmrParams {
  formula: BmrFormula;
  sex: BmrSex;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  bodyFatPercentage?: number;
}

/**
 * Accepted alternatives: Mifflin-St Jeor (1990, default — matches the
 * clinic's own public calculator and current dietetics practice),
 * Revised Harris-Benedict (1984, kept for continuity/older records),
 * Katch-McArdle (needs bodyFatPercentage; more accurate when known, but
 * never auto-selected — the doctor must explicitly pick it).
 */
export function calculateBmr(params: CalculateBmrParams) {
  const { formula, sex, ageYears, heightCm, weightKg, bodyFatPercentage } = params;

  switch (formula) {
    case BmrFormula.MIFFLIN_ST_JEOR: {
      const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
      const value = Math.round(sex === BmrSex.MALE ? base + 5 : base - 161);
      return { value, unit: "kcal/day", formula: "mifflin-st-jeor", formulaVersion: "1990" };
    }
    case BmrFormula.HARRIS_BENEDICT_REVISED: {
      const value = Math.round(
        sex === BmrSex.MALE
          ? 13.397 * weightKg + 4.799 * heightCm - 5.677 * ageYears + 88.362
          : 9.247 * weightKg + 3.098 * heightCm - 4.33 * ageYears + 447.593
      );
      return { value, unit: "kcal/day", formula: "harris-benedict-revised", formulaVersion: "1984" };
    }
    case BmrFormula.KATCH_MCARDLE: {
      if (bodyFatPercentage === undefined) {
        throw new Error("Katch-McArdle requires bodyFatPercentage");
      }
      const leanMassKg = weightKg * (1 - bodyFatPercentage / 100);
      const value = Math.round(370 + 21.6 * leanMassKg);
      return { value, unit: "kcal/day", formula: "katch-mcardle", formulaVersion: "1996" };
    }
  }
}
