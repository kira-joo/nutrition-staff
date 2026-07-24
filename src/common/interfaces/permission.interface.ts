export interface Permission {
  _id: string;
  entity: string;
  action: string;
  key: string;
  name: string;
  isSystem: boolean;
  isActive: boolean;
}
