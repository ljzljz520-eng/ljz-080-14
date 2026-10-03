import { createContext, useContext } from "react";
import type { RoleIdentity } from "../shared/api";

interface IdentityCtx {
  identity: RoleIdentity;
  setIdentity: (i: RoleIdentity) => void;
}

export const IdentityContext = createContext<IdentityCtx>({
  identity: { role: "caregiver", id: "c1", name: "李护工" },
  setIdentity: () => {},
});

export const useIdentity = () => useContext(IdentityContext);
