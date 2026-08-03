import { ClientLifecycle, ClientSource, Gender } from "../enums";

/** The shape a User has when embedded/populated inside a Client response — never includes auth-sensitive fields. */
export interface ClientUserSummary {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
}

/** A `ClientProfile` document with its `userId`/`assignedToUserId` relations populated. */
export interface Client {
  _id: string;
  userId: ClientUserSummary;
  lifecycle: ClientLifecycle;
  dateOfBirth?: string;
  birthYear?: number;
  gender?: Gender;
  heightCm?: number;
  targetWeightKg?: number;
  source?: ClientSource;
  sourceNote?: string;
  assignedToUserId?: ClientUserSummary;
  marketingConsent?: boolean;
  marketingConsentAt?: string;
  lastContactedAt?: string;
  nextFollowUpAt?: string;
  tags: string[];
  generalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientDto {
  name: string;
  phone: string;
  email?: string;
  source?: ClientSource;
  sourceNote?: string;
  assignedToUserId?: string;
}

export interface UpdateClientDto {
  name?: string;
  phone?: string;
  email?: string;
  lifecycle?: ClientLifecycle;
  dateOfBirth?: string;
  birthYear?: number;
  gender?: Gender;
  heightCm?: number;
  targetWeightKg?: number;
  source?: ClientSource;
  sourceNote?: string;
  assignedToUserId?: string;
  marketingConsent?: boolean;
  nextFollowUpAt?: string;
  tags?: string[];
  generalNotes?: string;
}

export type CreateClientFormValues = CreateClientDto;

export type ClientProfileFormValues = Omit<UpdateClientDto, "name" | "phone" | "email">;

/** Same field set as `ClientProfileFormValues` — `lifecycle` is simply never rendered in "attach" mode, defaulting server-side to LEAD. */
export type AttachClientProfileFormValues = ClientProfileFormValues;

/** The structured `details` of a 409 Conflict from `createClient` — an existing identity matched by phone/email. */
export interface CreateClientConflictDetails {
  field: "phone" | "email";
  existingUserId: string;
  existingUserName: string;
  hasClientProfile: boolean;
  clientProfileId?: string;
}
