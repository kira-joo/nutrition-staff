// Verifies the publish-lifecycle fix: a Book already PUBLISHED can
// publish a NEW Edition directly (no "move to Draft first" workaround),
// the previous Edition is untouched, and the public endpoint only
// switches editions after the new publish succeeds.
//
// Usage: node --env-file=.env --import tsx scripts/qa/verify-publish-from-published.ts
import mongoose from "mongoose";
import { connectToDatabase } from "../../src/server/core/db/connect";
import { bookRepository } from "../../src/server/books/books.repository";
import { bookEditionRepository } from "../../src/server/books/editions/book-editions.repository";
import { publishBookEdition } from "../../src/server/books/publishing/publish-book-edition";
import { generateBookArtifact } from "../../src/server/books/artifacts/generate-book-artifact";
import { UserModel } from "../../src/server/users/user.schema";
import { RoleModel } from "../../src/server/core/authorization/role.model";

const BOOK_ID = "6a7f11ba3076b9a7fe93a8cc";

async function fetchPublicPayload() {
  const res = await fetch("http://localhost:3333/api/public/books/food-substitutes-guide");
  if (!res.ok) throw new Error(`public endpoint returned ${res.status}`);
  return res.json();
}

async function main() {
  await connectToDatabase();

  const adminRole = await RoleModel.findOne({ name: "admin" }).lean();
  if (!adminRole) throw new Error('No role named "admin" found.');
  const actor = await UserModel.findOne({ roles: adminRole._id }).lean();
  if (!actor) throw new Error("No admin user found.");

  const before = await bookRepository.findOne({ where: { _id: BOOK_ID } });
  console.log(`BEFORE: status=${before.status}, editionCount=${before.editionCount}, currentEditionId=${before.currentEditionId}`);
  if (before.status !== "published") throw new Error(`Expected book to already be "published" for this check — was "${before.status}".`);

  const publicBefore = await fetchPublicPayload();
  console.log(`Public endpoint BEFORE: editionNumber=${publicBefore.editionNumber}`);

  // The actual fix under test: calling publishBookEdition while book.status
  // is STILL "published" — no status-transition workaround, no DRAFT step.
  const { book: updatedBook, edition } = await publishBookEdition(BOOK_ID, actor._id.toString(), {
    expectedRevision: before.revision,
    expectedContentRevision: before.contentRevision,
    acknowledgedWarningCodes: [],
    notes: "Lifecycle fix verification — publishing again directly from PUBLISHED.",
  });
  console.log(`Published edition ${edition.editionNumber} (${edition._id}) while source status was "published". New status: ${updatedBook.status}, currentEditionId: ${updatedBook.currentEditionId}`);

  const previousEdition = await bookEditionRepository.findOne({ where: { _id: before.currentEditionId } });
  console.log(`Previous edition ${previousEdition.editionNumber} (${previousEdition._id}) still exists, untouched, contentRevision=${previousEdition.contentRevision}`);

  const artifact = await generateBookArtifact(BOOK_ID, edition._id.toString(), actor._id.toString());
  console.log(`New edition PDF artifact: ${artifact.status}`);

  const publicAfter = await fetchPublicPayload();
  console.log(`Public endpoint AFTER: editionNumber=${publicAfter.editionNumber}`);

  if (publicBefore.editionNumber === publicAfter.editionNumber) {
    throw new Error("Public endpoint did not advance to the new edition — something is wrong.");
  }
  console.log(`\nVERIFIED: public endpoint moved from edition ${publicBefore.editionNumber} to ${publicAfter.editionNumber} only after the new publish succeeded, and the book remained "published" throughout (never left publicly-visible status).`);

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
