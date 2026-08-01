"use client";

import { Card } from "@kira-joo/frontend-toolkit-tailwind";
import { AlertTriangle } from "lucide-react";
import type { NutritionCalculationResults as Results } from "../interfaces/nutrition-calculation.interface";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </Card>
  );
}

export interface NutritionCalculationResultsViewProps {
  results: Results;
  assumptions: string[];
}

/** Every stat shown is exactly what was computed — nothing here recomputes or reinterprets `results`; this is a pure display of the persisted/computed snapshot. */
export function NutritionCalculationResultsView({ results, assumptions }: NutritionCalculationResultsViewProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {results.bmi ? <StatCard label="BMI" value={`${results.bmi.value}`} sub={results.bmi.category} /> : null}
        {results.bmr ? <StatCard label="BMR" value={`${results.bmr.value} kcal/day`} sub={results.bmr.formula as string} /> : null}
        {results.maintenanceCalories ? (
          <StatCard
            label="Maintenance calories"
            value={`${results.maintenanceCalories.value} kcal/day`}
            sub={`x${results.maintenanceCalories.activityMultiplier} activity`}
          />
        ) : null}
        {results.goalCalories ? (
          <StatCard
            label="Goal calories"
            value={`${results.goalCalories.value} kcal/day`}
            sub={results.goalCalories.belowSafeFloor ? "Below standard safe floor" : `${results.goalCalories.delta > 0 ? "+" : ""}${results.goalCalories.delta} kcal vs. maintenance`}
          />
        ) : null}
        {results.proteinRangeGrams ? (
          <StatCard
            label="Protein range"
            value={`${results.proteinRangeGrams.min}-${results.proteinRangeGrams.max} g/day`}
            sub={`${results.proteinRangeGrams.gPerKgRange[0]}-${results.proteinRangeGrams.gPerKgRange[1]} g/kg`}
          />
        ) : null}
        {results.macros ? (
          <StatCard
            label="Macros"
            value={`P${results.macros.proteinGrams} / C${results.macros.carbGrams} / F${results.macros.fatGrams}`}
            sub={`g/day, ${results.macros.fatPercentOfCalories}% fat`}
          />
        ) : null}
        {results.targetWeightRangeKg ? (
          <StatCard label="Healthy weight range" value={`${results.targetWeightRangeKg.min}-${results.targetWeightRangeKg.max} kg`} />
        ) : null}
        {results.waterIntakeLiters ? (
          <StatCard label="Water intake" value={`${results.waterIntakeLiters.value} L/day`} />
        ) : null}
      </div>

      {assumptions.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm font-medium">Assumptions & notes</p>
          </div>
          <ul className="list-inside list-disc space-y-1 text-sm text-amber-900">
            {assumptions.map((assumption, index) => (
              <li key={index}>{assumption}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      <p className="text-xs text-slate-500">
        These results are calculated estimates based on standard population formulas. They are not medical diagnoses.
        Clinical interpretation and final recommendations remain the responsibility of the treating nutrition doctor.
      </p>
    </div>
  );
}
