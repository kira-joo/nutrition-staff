import { MethodType, type Endpoint } from "@kira-joo/frontend-toolkit-core";
import type { DoctorProfile } from "../src/common/interfaces/doctor-profile.interface";

// Backed by src/app/api/doctor-profile/**. The main profile endpoints use a
// multipart upload-on-submit body (see review.endpoints.ts for why it's
// typed loosely); the gallery endpoints are their own sub-resource routes
// — see the plan's Campaign-blocks precedent for why: an array of embedded
// objects each with its own asset can't be bundled into one multipart
// request, so each gallery item is added/replaced/removed independently.

export const getDoctorProfileEndpoint: Endpoint<{ returnType: DoctorProfile }> = {
  url: "/doctor-profile",
  methodType: MethodType.GET,
};

export const updateDoctorProfileEndpoint: Endpoint<{ body: Record<string, unknown>; returnType: DoctorProfile }> = {
  url: "/doctor-profile",
  methodType: MethodType.PUT,
};

export const addGalleryItemEndpoint: Endpoint<{ body: Record<string, unknown>; returnType: DoctorProfile }> = {
  url: "/doctor-profile/gallery",
  methodType: MethodType.POST,
};

export const replaceGalleryItemEndpoint: Endpoint<{
  params: { itemId: string };
  body: Record<string, unknown>;
  returnType: DoctorProfile;
}> = {
  url: "/doctor-profile/gallery/:itemId",
  methodType: MethodType.PUT,
};

export const removeGalleryItemEndpoint: Endpoint<{ params: { itemId: string }; returnType: DoctorProfile }> = {
  url: "/doctor-profile/gallery/:itemId",
  methodType: MethodType.DELETE,
};

export const reorderGalleryEndpoint: Endpoint<{ body: { itemIds: string[] }; returnType: DoctorProfile }> = {
  url: "/doctor-profile/gallery/reorder",
  methodType: MethodType.PUT,
};
