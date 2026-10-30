"use client";

import "./dashboard.css";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type User = {
  id: number;
  name: string;
  email: string;
  role: "super_admin" | "department_admin" | "worker";
  department_id: number | null;
  is_active: boolean;
};

const roleLabels: Record<User["role"], string> = {
  super_admin: "Super Admin",
  department_admin: "Department Admin",
  worker: "Worker",
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) {
          if (active) router.replace("/");
          return;
        }
        const payload = await response.json();
        if (active) setUser(payload.user);
      } catch {
        if (active) router.replace("/");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadSession();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogout() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/");
      router.refresh();
    }
  }

  if (loading || !user) {
    return (
      <main className="dashboard-loading">
        <span className="loading-mark"><Image src="/myaayaam-mark.svg" alt="" width={34} height={34} /></span>
        <p>Preparing your workspace…</p>
      </main>
    );
  }

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <Image src="/myaayaam-mark.svg" alt="" width={36} height={36} />
          <span>myaayaam<span>.</span></span>
        </div>
        <div className="workspace-switcher">
          <span className="workspace-avatar">M</span>
          <span><strong>MyAayaam</strong><small>Inventory workspace</small></span>
        </div>
        <p className="nav-caption">WORKSPACE</p>
        <nav className="side-navigation" aria-label="Main navigation">
          <a className="side-link active" href="/dashboard"><span className="nav-icon">◫</span> Overview</a>
          {user.role === "super_admin" && <a className="side-link" href="/dashboard/departments"><span className="nav-icon">▦</span> Departments</a>}
          {(user.role === "super_admin" || user.role === "department_admin") && <span className="side-link disabled" aria-disabled="true"><span className="nav-icon">♙</span> User management <span className="coming-soon">Soon</span></span>}
          <span className="side-link disabled" aria-disabled="true"><span className="nav-icon">▤</span> Inventory <span className="coming-soon">Soon</span></span>
          <span className="side-link disabled" aria-disabled="true"><span className="nav-icon">◇</span> Products <span className="coming-soon">Soon</span></span>
          <span className="side-link disabled" aria-disabled="true"><span className="nav-icon">▥</span> Reports <span className="coming-soon">Soon</span></span>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><span className="help-spark">✳</span><strong>Need a hand?</strong><p>Your workspace is just getting started.</p><span className="help-contact-disabled">Support options coming soon</span></div>
          <div className="profile-mini">
            <span className="profile-avatar">{user.name.slice(0, 1).toUpperCase()}</span>
            <span className="profile-details"><strong>{user.name}</strong><small>{roleLabels[user.role]}</small></span>
            <span className="profile-menu">···</span>
          </button>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="breadcrumb"><span className="breadcrumb-root">Workspace</span><span className="breadcrumb-separator">/</span><strong aria-current="page">Overview</strong></div>
          <div className="topbar-actions"><span className="today-label">YOUR WORKSPACE, AT A GLANCE</span><span className="topbar-avatar">{user.name.slice(0, 1).toUpperCase()}</span></div>
        </header>

        <div className="dashboard-content">
          <div className="dashboard-welcome">
            <div><span className="eyebrow"><span className="eyebrow-line" /> YOUR SPACE, IN SYNC</span><h1>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {user.name.split(" ")[0]}<span>.</span></h1><p>Here’s what’s happening across your workspace today.</p></div>
            <div className="date-chip"><span className="date-dot" /> Workspace active</div>
          </div>

          <section className="welcome-banner">
            <div><span className="banner-kicker">A CLEARER WAY TO WORK</span><h2>Your inventory workspace<br /><em>is ready to take shape.</em></h2><p>We’re building your operational overview. Your connected modules will appear here as they become available.</p></div>
            <div className="banner-art" aria-hidden="true"><div className="art-ring ring-a" /><div className="art-ring ring-b" /><div className="art-box"><span> M </span></div><i className="art-star">✳</i><i className="art-dot" /></div>
          </section>

          <div className="section-heading"><div><span className="eyebrow">YOUR OVERVIEW</span><h2>A good place to begin</h2></div><span className="section-note">More insights will appear as you add data</span></div>
          <div className="overview-grid">
            <article className="overview-card card-lavender"><div className="card-top"><span className="card-icon">▦</span><span className="card-status">Workspace</span></div><strong>Departments</strong><p>{user.role === "super_admin" ? "Organize your business into focused teams." : "Your department workspace and its people."}</p><span className="card-foot">{user.role === "super_admin" ? "Organization-wide access" : "Department access"} <span>↗</span></span></article>
            <article className="overview-card card-sage"><div className="card-top"><span className="card-icon">♙</span><span className="card-status">People</span></div><strong>Team members</strong><p>Keep the right people connected to the right work.</p><span className="card-foot">{roleLabels[user.role]} access <span>↗</span></span></article>
            <article className="overview-card card-peach"><div className="card-top"><span className="card-icon">◇</span><span className="card-status">Coming next</span></div><strong>Inventory health</strong><p>Get a clear view of products, stock levels and movement.</p><span className="card-foot">Inventory module <span>↗</span></span></article>
          </div>

          <section className="account-panel"><div><span className="eyebrow">SIGNED IN AS</span><h3>{user.name}</h3><p>{user.email}</p></div><div className="account-meta"><span className="role-pill">{roleLabels[user.role]}</span><span className="account-id">Account #{user.id}</span></div><button className="logout-button" type="button" onClick={handleLogout} disabled={signingOut}>{signingOut ? "Signing out…" : "Sign out"} <span>↗</span></button></section>
          <p className="dashboard-footnote">MyAayaam <span>·</span> Thoughtful tools for better control.</p>
        </div>
      </section>
    </main>
  );
}
