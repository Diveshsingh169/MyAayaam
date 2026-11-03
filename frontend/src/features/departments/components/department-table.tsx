import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import DataTable, { type DataTableColumn } from "@/components/ui/data-table";
import type { Department } from "../types/department";

type DepartmentTableProps = {
  departments: Department[];
  busyId: number | null;
  onEdit: (department: Department) => void;
  onToggle: (department: Department) => void;
};

export default function DepartmentTable({ departments, busyId, onEdit, onToggle }: DepartmentTableProps) {
  const columns: DataTableColumn<Department>[] = [
    {
      key: "department",
      header: "DEPARTMENT",
      render: (department) => (
        <div className="department-name-cell">
          <span className="department-row-icon">{department.name.slice(0, 1).toUpperCase()}</span>
          <div><strong>{department.name}</strong><small>{department.description || "No description added"}</small></div>
        </div>
      ),
    },
    { key: "code", header: "CODE", render: (department) => <span className="department-code">{department.code}</span> },
    { key: "status", header: "STATUS", render: (department) => <Badge tone={department.is_active ? "success" : "neutral"} dot>{department.is_active ? "Active" : "Inactive"}</Badge> },
    { key: "created", header: "CREATED", render: (department) => <span className="department-date">{new Date(department.created_at).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}</span> },
    {
      key: "actions",
      header: "ACTIONS",
      className: "department-actions-cell",
      render: (department) => (
        <div className="department-actions">
          <Button size="sm" variant="secondary" onClick={() => onEdit(department)}>Edit</Button>
          <Button size="sm" variant={department.is_active ? "danger" : "secondary"} disabled={busyId === department.id} onClick={() => onToggle(department)}>
            {busyId === department.id ? "Please wait…" : department.is_active ? "Deactivate" : "Activate"}
          </Button>
        </div>
      ),
    },
  ];

  return <DataTable rows={departments} columns={columns} getRowKey={(department) => department.id} className="department-table-wrap" tableClassName="department-table" />;
}
