import { MethodType, type Endpoint, type PaginatedResponse, type PaginationQuery } from "@kira-joo/frontend-toolkit-core";
import type { Book, CreateBookFormValues } from "../src/common/interfaces/book.interface";

// GET/DELETE are plain JSON; POST (create) is plain JSON too (a Book is
// always created empty, no assets on create). PUT (update) is backed by a
// multipart route (cover/back-cover/override images), so its body is typed
// loosely — see review.endpoints.ts for the same convention elsewhere.

export const getBooksEndpoint: Endpoint<{
  query: PaginationQuery & Record<string, unknown>;
  returnType: PaginatedResponse<Book>;
}> = { url: "/books", methodType: MethodType.GET };

export const getBookByIdEndpoint: Endpoint<{ params: { id: string }; returnType: Book }> = {
  url: "/books/:id",
  methodType: MethodType.GET,
};

export const createBookEndpoint: Endpoint<{ body: CreateBookFormValues; returnType: Book }> = {
  url: "/books",
  methodType: MethodType.POST,
};

export const updateBookEndpoint: Endpoint<{
  params: { id: string };
  body: Record<string, unknown>;
  returnType: Book;
}> = {
  url: "/books/:id",
  methodType: MethodType.PUT,
};

export const deleteBookEndpoint: Endpoint<{ params: { id: string }; returnType: void }> = {
  url: "/books/:id",
  methodType: MethodType.DELETE,
};
