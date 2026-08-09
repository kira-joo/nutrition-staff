import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import "reflect-metadata";
import { ConsultationRequestIntent } from "src/common/enums";

/**
 * Public lead-capture shape — deliberately not `CreateClientDto`. A public
 * caller needs different validation (no `assignedToUserId`, an `intent`
 * instead of a raw `ClientSource`, a honeypot) and must never see the
 * conflict details `createClient`'s 409 exposes to staff — see
 * create-consultation-request.ts for how this DTO's fields get mapped onto
 * the real Client/ClientProfile creation.
 */
export class CreateConsultationRequestDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(6)
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsEnum(ConsultationRequestIntent)
  intent!: ConsultationRequestIntent;

  /** Free-text context from the public form (package interest, intake answers, etc.) — kept as an opaque blob rather than a rigid schema; mirrors ClientProfile's own free-text-notes convention. */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  /** Package.key (not an ObjectId) — public callers never see internal ids. */
  @IsOptional()
  @IsString()
  packageKey?: string;

  /** Honeypot — real visitors never fill this in; a filled value marks the submission as a bot without revealing that to the caller. */
  @IsOptional()
  @IsString()
  website?: string;

  /** Client-recorded render timestamp (ms since epoch) — used to reject submissions faster than a human could plausibly fill the form. */
  @IsOptional()
  @IsString()
  formRenderedAt?: string;
}
