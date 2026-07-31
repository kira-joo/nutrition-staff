import { createMongooseRepository } from "@kira-joo/backend-toolkit-mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { VideoModel } from "src/server/videos/video.schema";

export const videoRepository = createMongooseRepository({
  model: VideoModel,
  entityName: EntityName.VIDEO,
});
