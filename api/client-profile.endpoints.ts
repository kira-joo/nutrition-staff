import { MethodType, type Endpoint } from "@kira-joo/frontend-toolkit-core";
import type { AttachClientProfileFormValues, Client } from "../src/common/interfaces/client.interface";

// Backed by the MongoDB-backed route handlers under src/app/api/client-profiles/[userId].

export const getClientByUserIdEndpoint: Endpoint<{ params: { userId: string }; returnType: Client | null }> = {
  url: "/client-profiles/:userId",
  methodType: MethodType.GET,
};

export const attachClientProfileEndpoint: Endpoint<{
  params: { userId: string };
  body: AttachClientProfileFormValues;
  returnType: Client;
}> = {
  url: "/client-profiles/:userId",
  methodType: MethodType.POST,
};
