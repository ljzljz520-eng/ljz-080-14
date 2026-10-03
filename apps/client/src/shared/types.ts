export type MedCategory = "hypertension" | "diabetes" | "other_chronic";
export type BuyerChannel = "family" | "pharmacy" | "online";
export type CheckCondition =
  | "normal"
  | "suspected_missed"
  | "suspected_mixed"
  | "low_stock";

export interface FamilyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
}

export interface Elder {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female";
  address: string;
  roomNo: string;
  caregiverIds: string[];
  family: FamilyContact[];
  primaryFamilyId: string;
}
