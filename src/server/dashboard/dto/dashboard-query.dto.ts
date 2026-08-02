import { IsDateString, IsMongoId, IsOptional } from "class-validator";
import "reflect-metadata";

/**
 * Shared across every dashboard endpoint. `from`/`to` are honored only by
 * period-based widgets (New Leads, New Clients, Measurements Recorded,
 * Nutrition Calculations Saved, Client Growth, Source Distribution, Recent
 * Activity) — snapshot widgets (Today's/Overdue Follow-ups, Active Clients,
 * Total Clients, Lifecycle Distribution, attention lists) always reflect
 * "right now" and simply ignore these two fields. `assignedToUserId`
 * applies consistently everywhere.
 */
export class DashboardQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsMongoId()
  assignedToUserId?: string;
}
