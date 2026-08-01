import { clientProfileRepository } from "src/server/clients/client-profiles.repository";
import { ListClientsQueryDto } from "src/server/clients/dto/list-clients-query.dto";
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
  const where: Record<string, unknown> = {};

  if (query.search) {
    const matchingUsers = await userRepository.findAll({
      where: { $or: [{ name: { $regex: query.search, $options: "i" } }, { phone: { $regex: query.search, $options: "i" } }, { email: { $regex: query.search, $options: "i" } }] },
    });
    where.userId = { $in: matchingUsers.map((user) => user._id) };
  }

  return clientProfileRepository.findAllAndCountPublic({
    query,
    where,
    relations: ["userId", "assignedToUserId"],
  });
}
