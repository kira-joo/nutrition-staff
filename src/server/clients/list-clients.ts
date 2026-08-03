import { clientProfileRepository } from "src/server/clients/client-profiles.repository";
import { ListClientsQueryDto } from "src/server/clients/dto/list-clients-query.dto";
import { clientMeasurementRepository } from "src/server/measurements/client-measurements.repository";
import { userRepository } from "src/server/users/users.repository";

/**
 * `ClientProfile` itself has no name/phone/email fields (identity lives on
 * `User` — see the plan's "no duplicated Customer collection" rule), so a
 * free-text `search` term can't be resolved by `ClientProfile`'s own
 * `@Searchable()` fields (it has none — the base query builder correctly
 * no-ops on that). Resolve it against `User` first, then filter
 * `ClientProfile` by the matched `userId`s.
 */
export async function listClients(query: ListClientsQueryDto) {
  const { followUpDue, ...rest } = query;
  const where: Record<string, unknown> = {};

  if (query.search) {
    const matchingUsers = await userRepository.findAll({
      where: { $or: [{ name: { $regex: query.search, $options: "i" } }, { phone: { $regex: query.search, $options: "i" } }, { email: { $regex: query.search, $options: "i" } }] },
    });
    where.userId = { $in: matchingUsers.map((user) => user._id) };
  }

  if (followUpDue) {
    where.nextFollowUpAt = { $exists: true, $lte: new Date() };
  }

  const result = await clientProfileRepository.findAllAndCountPublic({
    query: rest,
    where,
    relations: ["userId", "assignedToUserId"],
  });

  // One extra query for the whole page (not per row) so profile completeness
  // — shown here and on the Client Overview — can use the exact same
  // definition in both places. See `calculateProfileCompleteness`.
  const clientIds = result.data.map((client) => (client as { _id: unknown })._id);
  const measurements = await clientMeasurementRepository.findAll({
    where: { clientProfileId: { $in: clientIds } },
    select: { clientProfileId: true },
  });
  const clientIdsWithMeasurement = new Set(
    (measurements as unknown as { clientProfileId: unknown }[]).map((measurement) => String(measurement.clientProfileId))
  );

  return {
    ...result,
    data: result.data.map((client) => ({
      ...client,
      hasMeasurement: clientIdsWithMeasurement.has(String((client as { _id: unknown })._id)),
    })),
  };
}
