"use client";

import { usePathname } from "next/navigation";
import WorkspaceHeader from "@/components/workspace-header";
import WorkspaceSidebar from "@/components/workspace-sidebar";

type WorkspaceShellProps = {
  children: React.ReactNode;
};

const pageContext: Record<string, { title: "Overview" | "Departments" | "User management"; context: string }> = {
  "/dashboard": { title: "Overview", context: "YOUR WORKSPACE, AT A GLANCE" },
  "/dashboard/departments": { title: "Departments", context: "ORGANIZE YOUR WORKSPACE" },
  "/dashboard/users": { title: "User management", context: "MANAGE PEOPLE & ACCESS" },
};

export default function WorkspaceShell({ children }: WorkspaceShellProps) {
  const pathname = usePathname();
  const page = pageContext[pathname] ?? {
    title: "Overview" as const,
    context: "YOUR WORKSPACE",
  };

  return (
    <div className="dashboard-shell">
      <WorkspaceSidebar activePage={page.title} />
      <div className="dashboard-main">
        <WorkspaceHeader currentPage={page.title} contextLabel={page.context} />
        <main className="workspace-page-content">{children}</main>
      </div>
    </div>
  );
}
