// Publishes a new Edition of the QA book "دليل البدائل الغذائية"
// (food-substitutes-guide) from its current draft content, then generates
// the PDF artifact for that new Edition — via the real
// publishBookEdition/generateBookArtifact services (validation, content
// freezing, recipe snapshotting, asset collection, PDF render + upload),
// not a raw Mongo write.
//
// Usage: node --env-file=.env --import tsx scripts/qa/publish-food-substitutes-guide.ts
import mongoose from "mongoose";
import { connectToDatabase } from "../../src/server/core/db/connect";
import { bookRepository } from "../../src/server/books/books.repository";
import { publishBookEdition } from "../../src/server/books/publishing/publish-book-edition";
import { generateBookArtifact } from "../../src/server/books/artifacts/generate-book-artifact";
import { BookArtifactStatus } from "../../src/server/books/artifacts/book-artifact.schema";
import { UserModel } from "../../src/server/users/user.schema";
import { RoleModel } from "../../src/server/core/authorization/role.model";
import { assertBookStatusTransition } from "../../src/server/books/assert-book-status-transition";
import { BookStatus } from "../../src/common/enums";

const BOOK_ID = "6a7f11ba3076b9a7fe93a8cc";

async function main() {
  await connectToDatabase();

  const adminRole = await RoleModel.findOne({ name: "admin" }).lean();
  if (!adminRole) throw new Error('No role named "admin" found.');
  const actor = await UserModel.findOne({ roles: adminRole._id }).lean();
  if (!actor) throw new Error("No admin user found to attribute this publish/generate action to.");
  console.log(`Acting as admin user ${actor.email ?? actor._id}`);

  let book = await bookRepository.findOne({ where: { _id: BOOK_ID } });
  console.log(`Publishing "${book.title}" — revision ${book.revision}, contentRevision ${book.contentRevision}, currently ${book.status}`);

  // The content script bumped contentRevision but left the Book's own
  // `status` at PUBLISHED (its previous edition is still live and
  // unaffected) — `publishBookEdition` only accepts DRAFT/READY_FOR_REVIEW,
  // matching the real staff UI's own flow of moving a published book back
  // to Draft before republishing. PUBLISHED -> DRAFT is an allowed
  // transition (see assert-book-status-transition.ts), the same guard the
  // real book-header PUT route runs.
  if (book.status === BookStatus.PUBLISHED) {
    assertBookStatusTransition(book.status, BookStatus.DRAFT);
    book = await bookRepository.update({ where: { _id: BOOK_ID, revision: book.revision } }, { status: BookStatus.DRAFT, revision: book.revision + 1 });
    console.log(`Moved book to DRAFT (revision ${book.revision}) so it can be republished.`);
  }

  const { book: updatedBook, edition } = await publishBookEdition(BOOK_ID, actor._id.toString(), {
    expectedRevision: book.revision,
    expectedContentRevision: book.contentRevision,
    acknowledgedWarningCodes: [],
    notes: "QA content refresh — full manuscript rewrite for manual review.",
  });
  console.log(`Published edition ${edition.editionNumber} (${edition._id}). Book status: ${updatedBook.status}, currentEditionId: ${updatedBook.currentEditionId}`);

  const artifact = await generateBookArtifact(BOOK_ID, edition._id.toString(), actor._id.toString());
  console.log(`PDF artifact status: ${artifact.status} (${artifact.pageCount ?? "?"} pages, ${artifact.fileSize ?? "?"} bytes)`);
  if (artifact.status !== BookArtifactStatus.READY) {
    console.error("PDF artifact did not reach READY:", artifact);
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
