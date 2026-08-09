import { ClientLifecycle, ConsultationRequestIntent } from "../enums";

/** The shape a User has when populated inside a ConsultationRequest response — never includes auth-sensitive fields. */
export interface ConsultationRequestUserSummary {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
}

/** The shape a ClientProfile has when populated inside a ConsultationRequest response. */
export interface ConsultationRequestClientProfileSummary {
  _id: string;
  lifecycle: ClientLifecycle;
}

/**
 * One public form submission, exactly as received — `name`/`phone`/
 * `email` are a snapshot at submission time, not a live view of `User`
 * (which staff may since have corrected). `userId`/`clientProfileId` are
 * populated relations to whichever identity the submission resolved to.
 */
export interface ConsultationRequest {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  intent: ConsultationRequestIntent;
  packageKey?: string;
  message?: string;
  userId: ConsultationRequestUserSummary;
  clientProfileId?: ConsultationRequestClientProfileSummary;
  ip?: string;
  createdAt: string;
  updatedAt: string;
}
