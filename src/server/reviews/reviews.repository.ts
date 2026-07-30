import { createMongooseRepository } from "@kira-joo/backend-toolkit-mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ReviewModel } from "src/server/reviews/review.schema";

export const reviewRepository = createMongooseRepository({ model: ReviewModel, entityName: EntityName.REVIEW });
