import { SortOrder } from "@kira-joo/toolkit-common";
import { CreateNutritionAssessmentDto } from "src/server/assessments/dto/create-nutrition-assessment.dto";
import { nutritionAssessmentRepository } from "src/server/assessments/nutrition-assessments.repository";

/** Auto-resolves `previousAssessmentId` to this client's most recent existing assessment when not explicitly given — the "compare to previous" convenience link, without making the doctor pick it manually. */
export async function createNutritionAssessment(body: CreateNutritionAssessmentDto, assessedByUserId: string) {
  let previousAssessmentId = body.previousAssessmentId;

  if (!previousAssessmentId) {
    const [latest] = await nutritionAssessmentRepository.findAll({
      where: { clientProfileId: body.clientProfileId },
      sort: { field: "assessedAt", order: SortOrder.DESC },
      take: 1,
    });
    previousAssessmentId = latest ? String(latest._id) : undefined;
  }

  return nutritionAssessmentRepository.save({ ...body, previousAssessmentId, assessedByUserId });
}
