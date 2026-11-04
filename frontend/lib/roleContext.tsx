"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type UserRole = "Creator" | "Reviewer" | "Manager" | "Admin";

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextType>({
  role: "Creator",
  setRole: () => {},
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>("Creator");

  useEffect(() => {
    const saved = localStorage.getItem("brandlens_demo_role");
    if (saved && ["Creator", "Reviewer", "Manager", "Admin"].includes(saved)) {
      setRoleState(saved as UserRole);
    }
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem("brandlens_demo_role", newRole);
  };

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
