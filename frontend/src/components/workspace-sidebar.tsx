"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getWorkspaceNavigation } from "@/components/ui/navigation";

type SessionUser = {
  name: string;
  role: "super_admin" | "department_admin" | "worker";
};

type WorkspaceSidebarProps = {
  activePage: "Overview" | "Departments" | "User management";
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
        {getWorkspaceNavigation(user?.role).map((item) => {
          const isActive = item.href === "/dashboard" ? activePage === "Overview" : item.label === activePage;
          return item.comingSoon ? (
            <span key={item.href} className="side-link disabled" aria-disabled="true">
              <span className="nav-icon">{item.icon}</span> {item.label} <span className="coming-soon">Soon</span>
            </span>
          ) : (
            <Link key={item.href} className={isActive ? "side-link active" : "side-link"} href={item.href} aria-current={isActive ? "page" : undefined}>
              <span className="nav-icon">{item.icon}</span> {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="help-card">
          <span className="help-spark">✳</span>
          <strong>Need a hand?</strong>
          <p>Your workspace is just getting started.</p>
          <span className="help-contact-disabled">Support options coming soon</span>
        </div>
</div>
    </aside>
  );
}
