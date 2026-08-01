"use client";

import { Modal, PageShell, CustomButton } from "@kira-joo/frontend-toolkit-tailwind";
import { FlaskConical, RotateCcw, UserPlus } from "lucide-react";
import { useState } from "react";
import { NutritionCalculationInputForm } from "src/common/forms/nutrition-calculation-input-form";
import { NutritionCalculationResultsView } from "src/common/forms/nutrition-calculation-results";
import { AssignNutritionCalculationForm } from "src/common/forms/assign-nutrition-calculation-form";
import { ComputeNutritionCalculationResponse } from "src/common/interfaces/nutrition-calculation.interface";

export default function CalculatorsPage() {
  const [computed, setComputed] = useState<ComputeNutritionCalculationResponse | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  return (
    <PageShell
      icon={FlaskConical}
      title="Nutrition Calculators"
      description="Calculate BMI, BMR, calorie targets, macros, and more from one set of inputs — nothing is saved until you assign it to a client."
    >
      <div className="flex flex-col gap-4">
        {!computed ? (
          <NutritionCalculationInputForm onComputed={setComputed} />
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <CustomButton variant="outline" leftIcon={RotateCcw} onClick={() => setComputed(null)}>
                Start over
              </CustomButton>
              <CustomButton leftIcon={UserPlus} onClick={() => setAssignDialogOpen(true)}>
                Assign to Client
              </CustomButton>
            </div>
            <NutritionCalculationResultsView results={computed.results} assumptions={computed.assumptions} />
          </>
        )}
      </div>

      {computed ? (
        <Modal open={assignDialogOpen} onOpenChange={setAssignDialogOpen} title="Assign to Client" size="lg">
          <AssignNutritionCalculationForm computed={computed} onSuccess={() => setAssignDialogOpen(false)} />
        </Modal>
      ) : null}
    </PageShell>
  );
}
