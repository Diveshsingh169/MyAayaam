"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type WorkspaceHeaderProps = {
  currentPage: "Overview" | "Departments";
  contextLabel: string;
};

type SessionUser = {
  name: string;
};

export default function WorkspaceHeader({
  currentPage,
  contextLabel,
}: WorkspaceHeaderProps) {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json();
        const user = payload.user as SessionUser | undefined;
        if (active && user?.name) setUserName(user.name);
      } catch {
        // Keep the header stable if profile information is temporarily unavailable.
      }
    }

    void loadUser();
    return () => {
      active = false;
    };
  }, []);

  const initial = userName.trim().charAt(0).toUpperCase();

  return (
    <header className="workspace-header">
      <nav className="workspace-breadcrumb" aria-label="Breadcrumb">
        {currentPage === "Overview" ? (
          <span className="workspace-breadcrumb-root" aria-current="page">
            Workspace
          </span>
        ) : (
          <Link className="workspace-breadcrumb-root" href="/dashboard">
            Workspace
          </Link>
        )}
        <span className="workspace-breadcrumb-separator" aria-hidden="true">
          /
        </span>
        <span className="workspace-breadcrumb-current" aria-current="page">
          {currentPage}
        </span>
      </nav>

      <div className="workspace-header-meta">
        <span className="workspace-header-context">{contextLabel}</span>
        {initial && (
          <span className="workspace-user-avatar" aria-label={userName}>
            {initial}
          </span>
        )}
      </div>
    </header>
  );
}
