"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type WorkspaceHeaderProps = {
  currentPage: "Overview" | "Departments";
  contextLabel: string;
};

type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: "super_admin" | "department_admin" | "worker";
};

const roleLabels: Record<SessionUser["role"], string> = {
  super_admin: "Super Admin",
  department_admin: "Department Admin",
  worker: "Worker",
};

export default function WorkspaceHeader({
  currentPage,
  contextLabel,
}: WorkspaceHeaderProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json();
        if (active && payload.user) setUser(payload.user as SessionUser);
      } catch {
        // Keep the header usable if profile information is temporarily unavailable.
      }
    }

    void loadUser();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  async function handleLogout() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/");
      router.refresh();
    }
  }

  const initial = user?.name?.trim().charAt(0).toUpperCase();

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
        <span className="workspace-breadcrumb-separator" aria-hidden="true">/</span>
        <span className="workspace-breadcrumb-current" aria-current="page">{currentPage}</span>
      </nav>

      <div className="workspace-header-meta">
        <span className="workspace-header-context">{contextLabel}</span>
        <div className="workspace-account" ref={menuRef}>
          <button
            className="workspace-user-avatar"
            type="button"
            aria-label="Open account menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {initial || "•"}
          </button>

          {menuOpen && (
            <section className="workspace-account-menu" aria-label="Account menu">
              {user ? (
                <>
                  <div className="workspace-account-menu__identity">
                    <span className="workspace-account-menu__avatar">{initial}</span>
                    <div className="workspace-account-menu__name">
                      <strong>{user.name}</strong>
                      <span>{roleLabels[user.role]}</span>
                    </div>
                  </div>
                  <div className="workspace-account-menu__details">
                    <span className="workspace-account-menu__label">EMAIL ADDRESS</span>
                    <span className="workspace-account-menu__value">{user.email}</span>
                    <span className="workspace-account-menu__label">ACCOUNT ID</span>
                    <span className="workspace-account-menu__value">#{user.id}</span>
                  </div>
                  <button
                    type="button"
                    className="workspace-account-menu__logout"
                    onClick={handleLogout}
                    disabled={signingOut}
                  >
                    <span aria-hidden="true">↪</span>
                    {signingOut ? "Signing out…" : "Sign out"}
                  </button>
                </>
              ) : (
                <p className="workspace-account-menu__loading">Loading account details…</p>
              )}
            </section>
          )}
        </div>
      </div>
    </header>
  );
}
