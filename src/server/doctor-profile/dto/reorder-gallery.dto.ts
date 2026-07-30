import { ArrayNotEmpty, IsString } from "class-validator";

/** Body for the reorder route — content-free by design: just the gallery item ids in their new order. */
export class ReorderGalleryDto {
  @ArrayNotEmpty()
  @IsString({ each: true })
  itemIds!: string[];
}
