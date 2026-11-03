import "./dashboard.css";
import "@/components/ui/ui.css";
import WorkspaceShell from "@/components/layout/workspace-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
