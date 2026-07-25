// Importing "./toolkit.config" here (for its side effect) is a convenience to
// make configuration happen early — it is NOT what correctness depends on.
// createRoute() verifies configuration at request time on every request
// regardless of module import order; see backend-toolkit-next's docs.
import "./toolkit.config";

export { createDeleteRoute, createGetRoute, createPostRoute, createPutRoute } from "@kira-joo/backend-toolkit-next";
