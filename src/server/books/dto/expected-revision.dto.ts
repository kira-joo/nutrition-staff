import { IsInt } from "class-validator";
import "reflect-metadata";

/**
 * Every content-mutating route (chapters, blocks, reorder, duplicate,
 * move) takes this against `Book.contentRevision` — deliberately a
 * SEPARATE counter from the header `revision` `UpdateBookDto` uses, so
 * editing the header and editing content never falsely conflict with each
 * other.
 */
export class ExpectedRevisionDto {
  @IsInt()
  expectedRevision!: number;
}
