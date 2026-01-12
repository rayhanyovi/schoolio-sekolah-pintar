'use client';

import * as React from "react";
import { Role } from "@/lib/constants";

interface RoleContextValue {
  role: Role;
}

const RoleContext = React.createContext<RoleContextValue | null>(null);

interface RoleProviderProps {
  role: Role;
  children: React.ReactNode;
}

export function RoleProvider({ role, children }: RoleProviderProps) {
  return <RoleContext.Provider value={{ role }}>{children}</RoleContext.Provider>;
}

export function useRoleContext() {
  const context = React.useContext(RoleContext);
  if (!context) {
    throw new Error("useRoleContext must be used within RoleProvider");
  }
  return context;
}
