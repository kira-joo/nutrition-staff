import { MethodType, type Endpoint } from "@kira-joo/frontend-toolkit-core";
import type { StaffProfile, UpsertStaffProfileDto } from "../src/common/interfaces/staff-profile.interface";

// Backed by src/app/api/staff-profiles/[userId]/route.ts.

export const getStaffProfileByUserIdEndpoint: Endpoint<{ params: { userId: string }; returnType: StaffProfile | null }> = {
  url: "/staff-profiles/:userId",
  methodType: MethodType.GET,
};

export const upsertStaffProfileEndpoint: Endpoint<{
  params: { userId: string };
  body: UpsertStaffProfileDto;
  returnType: StaffProfile;
}> = {
  url: "/staff-profiles/:userId",
  methodType: MethodType.PUT,
};
