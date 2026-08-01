export enum NutritionGoal {
  WEIGHT_LOSS = "weight_loss",
  WEIGHT_GAIN = "weight_gain",
  MAINTENANCE = "maintenance",
  MUSCLE_GAIN = "muscle_gain",
  /** Doesn't use standard calorie/protein defaults — a medical condition (e.g. renal, diabetic) drives the plan instead. Flagged in the Calculation Workspace. */
  MEDICAL_MANAGEMENT = "medical_management",
  OTHER = "other",
}
