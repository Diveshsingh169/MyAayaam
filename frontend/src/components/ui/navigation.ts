export type WorkspaceRole = "super_admin" | "department_admin" | "worker";

export type WorkspaceNavigationItem = {
  label: string;
  href: string;
  icon: string;
  roles?: WorkspaceRole[];
  comingSoon?: boolean;
};

export const workspaceNavigation: WorkspaceNavigationItem[] = [
  { label: "Overview", href: "/dashboard", icon: "◫" },
  { label: "Departments", href: "/dashboard/departments", icon: "▦", roles: ["super_admin"] },
  { label: "User management", href: "/dashboard/users", icon: "♙", roles: ["super_admin", "department_admin"], comingSoon: true },
  { label: "Inventory", href: "/dashboard/inventory", icon: "▤", comingSoon: true },
  { label: "Products", href: "/dashboard/products", icon: "◇", comingSoon: true },
  { label: "Reports", href: "/dashboard/reports", icon: "▥", comingSoon: true },
];

export function getWorkspaceNavigation(role?: WorkspaceRole) {
  return workspaceNavigation.filter((item) => !item.roles || (role !== undefined && item.roles.includes(role)));
}
