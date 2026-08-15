// Sets the QA book's coverMode to "uploaded" — it already has a real
// coverImage (firstBookCover.png) from earlier setup, which previously
// rendered WITH a title/subtitle/doctor-name overlay. Per the newest
// cover-mode design, "uploaded" now means the image becomes the entire
// page with NOTHING rendered over it, so this explicitly opts in via the
// new coverMode field rather than relying on image presence alone.
//
// Usage: node --env-file=.env --import tsx scripts/qa/set-food-substitutes-guide-cover-mode.ts
import mongoose from "mongoose";
import { connectToDatabase } from "../../src/server/core/db/connect";
import { bookRepository } from "../../src/server/books/books.repository";

const BOOK_ID = "6a7f11ba3076b9a7fe93a8cc";

async function main() {
  await connectToDatabase();
  const book = await bookRepository.findOne({ where: { _id: BOOK_ID } });
  console.log(`Current coverMode: ${book.coverMode}, coverImage: ${book.coverImage ? book.coverImage.secureUrl : "none"}`);
  console.log(`Current backCoverMode: ${book.backCoverMode}, backCoverImage: ${book.backCoverImage ? book.backCoverImage.secureUrl : "none"}`);

  const updated = await bookRepository.update({ where: { _id: BOOK_ID, revision: book.revision } }, { coverMode: "uploaded", revision: book.revision + 1 });
  console.log(`Updated coverMode: ${updated.coverMode}, revision: ${updated.revision}`);
  await mongoose.disconnect();
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
