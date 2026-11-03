"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type SessionUser = {
  name: string;
  role: "super_admin" | "department_admin" | "worker";
};

type WorkspaceSidebarProps = {
  activePage: "Overview" | "Departments";
};

const roleLabels: Record<SessionUser["role"], string> = {
  super_admin: "Super Admin",
  department_admin: "Department Admin",
  worker: "Worker",
};

export default function WorkspaceSidebar({ activePage }: WorkspaceSidebarProps) {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json();
        if (active && payload.user) setUser(payload.user as SessionUser);
      } catch {
        // The page-level session guard handles authentication failures.
      }
    }

    void loadUser();
    return () => {
      active = false;
    };
  }, []);

  return (
    <aside className="dashboard-sidebar">
      <Link className="dashboard-brand" href="/dashboard" aria-label="MyAayaam home">
        <Image src="/myaayaam-mark.svg" alt="" width={36} height={36} priority />
        <span>myaayaam<span>.</span></span>
      </Link>

      <div className="workspace-switcher" aria-label="Current workspace">
        <span className="workspace-avatar">M</span>
        <span>
          <strong>MyAayaam</strong>
          <small>Inventory workspace</small>
        </span>
      </div>

      <p className="nav-caption">WORKSPACE</p>
      <nav className="side-navigation" aria-label="Main navigation">
        <Link className={activePage === "Overview" ? "side-link active" : "side-link"} href="/dashboard" aria-current={activePage === "Overview" ? "page" : undefined}>
          <span className="nav-icon">◫</span> Overview
        </Link>
        {user?.role === "super_admin" && (
          <Link className={activePage === "Departments" ? "side-link active" : "side-link"} href="/dashboard/departments" aria-current={activePage === "Departments" ? "page" : undefined}>
            <span className="nav-icon">▦</span> Departments
          </Link>
        )}
        {(user?.role === "super_admin" || user?.role === "department_admin") && (
          <span className="side-link disabled" aria-disabled="true">
            <span className="nav-icon">♙</span> User management <span className="coming-soon">Soon</span>
          </span>
        )}
        <span className="side-link disabled" aria-disabled="true">
          <span className="nav-icon">▤</span> Inventory <span className="coming-soon">Soon</span>
        </span>
        <span className="side-link disabled" aria-disabled="true">
          <span className="nav-icon">◇</span> Products <span className="coming-soon">Soon</span>
        </span>
        <span className="side-link disabled" aria-disabled="true">
          <span className="nav-icon">▥</span> Reports <span className="coming-soon">Soon</span>
        </span>
      </nav>

      <div className="sidebar-bottom">
        <div className="help-card">
          <span className="help-spark">✳</span>
          <strong>Need a hand?</strong>
          <p>Your workspace is just getting started.</p>
          <span className="help-contact-disabled">Support options coming soon</span>
        </div>
        {user && (
          <div className="profile-mini">
            <span className="profile-avatar">{user.name.trim().charAt(0).toUpperCase()}</span>
            <span className="profile-details">
              <strong>{user.name}</strong>
              <small>{roleLabels[user.role]}</small>
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
