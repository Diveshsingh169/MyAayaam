import Card from "@/components/ui/card";
import type { Department } from "../types/department";

type DepartmentStatsProps = {
  departments: Department[];
};

export default function DepartmentStats({ departments }: DepartmentStatsProps) {
  const activeCount = departments.filter((department) => department.is_active).length;
  const stats = [
    { label: "Total departments", value: departments.length, icon: "▦", tone: "lavender" },
    { label: "Active departments", value: activeCount, icon: "✓", tone: "sage" },
    { label: "Inactive departments", value: departments.length - activeCount, icon: "Ⅱ", tone: "peach" },
  ];

  return (
    <div className="department-stats">
      {stats.map((stat) => (
        <Card key={stat.label} padding="sm" className="department-stat-card">
          <span className={`department-stat-icon ${stat.tone}`} aria-hidden="true">{stat.icon}</span>
          <div><small>{stat.label}</small><strong>{stat.value}</strong></div>
        </Card>
      ))}
    </div>
  );
}
