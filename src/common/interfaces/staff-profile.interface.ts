export interface StaffProfile {
  _id: string;
  userId: string;
  salary?: number;
  joinedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertStaffProfileDto {
  salary?: number;
  joinedAt?: string;
}
