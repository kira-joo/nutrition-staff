import {
  MethodType,
  type Endpoint,
  type PaginatedResponse,
  type PaginationQuery,
} from "@kira-joo/frontend-toolkit-core";
import type { Package, PackageFormValues } from "../src/common/interfaces/package.interface";

export const getPackagesEndpoint: Endpoint<{
  query: PaginationQuery & Record<string, unknown>;
  returnType: PaginatedResponse<Package>;
}> = { url: "/packages", methodType: MethodType.GET };

export const getPackageByIdEndpoint: Endpoint<{ params: { id: string }; returnType: Package }> = {
  url: "/packages/:id",
  methodType: MethodType.GET,
};

export const createPackageEndpoint: Endpoint<{ body: PackageFormValues; returnType: Package }> = {
  url: "/packages",
  methodType: MethodType.POST,
};

export const updatePackageEndpoint: Endpoint<{
  params: { id: string };
  body: Partial<PackageFormValues>;
  returnType: Package;
}> = {
  url: "/packages/:id",
  methodType: MethodType.PUT,
};

export const deletePackageEndpoint: Endpoint<{ params: { id: string }; returnType: void }> = {
  url: "/packages/:id",
  methodType: MethodType.DELETE,
};
