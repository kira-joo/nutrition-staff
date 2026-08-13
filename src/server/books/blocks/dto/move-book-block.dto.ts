import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import "reflect-metadata";

export class BlockContainerDescriptorDto {
  @IsOptional()
  @IsString()
  chapterId?: string;

  @IsOptional()
  @IsString()
  section?: "front-matter" | "back-matter";

  @IsOptional()
  @IsString()
  slot?: string;
}

/** Body for the cross-container move route — the only block mutation that needs TWO container descriptors, so it gets its own flat route rather than nesting under either container's URL. */
export class MoveBookBlockDto {
  @IsString()
  blockId!: string;

  @ValidateNested()
  @Type(() => BlockContainerDescriptorDto)
  from!: BlockContainerDescriptorDto;

  @ValidateNested()
  @Type(() => BlockContainerDescriptorDto)
  to!: BlockContainerDescriptorDto;

  @IsOptional()
  @IsInt()
  @Min(0)
  toIndex?: number;

  @IsInt()
  expectedRevision!: number;
}
