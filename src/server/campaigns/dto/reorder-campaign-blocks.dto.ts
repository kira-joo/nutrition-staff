import { ArrayNotEmpty, IsString } from "class-validator";

/** Body for the reorder route — content-free by design: just the block ids in their new order. */
export class ReorderCampaignBlocksDto {
  @ArrayNotEmpty()
  @IsString({ each: true })
  blockIds!: string[];
}
