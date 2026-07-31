import { BadRequestError, validateDto } from "@kira-joo/backend-toolkit-core";
import type { ClassConstructor } from "class-transformer";
import { CampaignBlockType } from "src/common/enums";
import { HeroBlockDto } from "./dto/hero-block.dto";
import { RichTextBlockDto } from "./dto/rich-text-block.dto";

/**
 * Each block type gets its own DTO (per the plan), but blocks are never
 * validated as a heterogeneous array in one request — each sub-resource
 * route (add/replace) only ever carries *one* block, dispatched by its own
 * `type` field. class-transformer's array-discriminator feature is built
 * for validating a mixed array in a single shot, which doesn't fit this
 * one-block-per-request shape; a plain lookup table achieves the same
 * "each type has its own DTO/validation" goal without forcing that fit.
 *
 * Add a new block type by adding one entry here (and to the frontend block
 * registry) — nothing else about this dispatch changes.
 */
const BLOCK_DTO_BY_TYPE: Record<CampaignBlockType, ClassConstructor<object>> = {
  [CampaignBlockType.HERO]: HeroBlockDto,
  [CampaignBlockType.RICH_TEXT]: RichTextBlockDto,
};

/** Validated first, standalone — asset processing needs a known block type before validation ever runs (to know which asset field(s) to look for). */
export function assertValidBlockType(type: unknown): CampaignBlockType {
  if (typeof type !== "string" || !Object.values(CampaignBlockType).includes(type as CampaignBlockType)) {
    throw new BadRequestError(`Unknown or missing block type: ${JSON.stringify(type)}`, {
      knownTypes: Object.values(CampaignBlockType),
    });
  }
  return type as CampaignBlockType;
}

export async function validateCampaignBlock(payload: Record<string, unknown>): Promise<object> {
  const type = assertValidBlockType(payload.type);
  const DtoClass = BLOCK_DTO_BY_TYPE[type];
  return validateDto(DtoClass, payload);
}
