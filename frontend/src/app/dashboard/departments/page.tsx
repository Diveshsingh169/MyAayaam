"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import SearchField from "@/components/ui/search-field";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/feedback-state";
import DepartmentStats from "@/features/departments/components/department-stats";
import DepartmentTable from "@/features/departments/components/department-table";
import DepartmentFormModal from "@/features/departments/components/department-form-modal";
import { emptyDepartmentForm, type Department, type DepartmentFormValues } from "@/features/departments/types/department";
import { DepartmentApiError, listDepartments, saveDepartment, setDepartmentActive } from "@/features/departments/services/department-service";

export default function DepartmentsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeInactive, setIncludeInactive] = useState(true);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState<DepartmentFormValues>(emptyDepartmentForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingDepartment, setPendingDepartment] = useState<Department | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await listDepartments(includeInactive));
    } catch (err) {
      if (err instanceof DepartmentApiError && err.status === 401) {
        router.replace("/");
        return;
      }
      setError(err instanceof Error ? err.message : "Unable to load departments.");
    } finally {
      setLoading(false);
    }
  }, [includeInactive, router]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => !term || [item.name, item.code, item.description || ""].some((value) => value.toLowerCase().includes(term)));
  }, [items, search]);

  function openCreate() {
    setEditing(null); setForm(emptyDepartmentForm); setError(""); setNotice(""); setDialog(true);
  }

  function openEdit(item: Department) {
    setEditing(item);
    setForm({ name: item.name, code: item.code, description: item.description || "" });
    setError(""); setNotice(""); setDialog(true);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError("");
    try {
      await saveDepartment(form, editing?.id);
      setDialog(false);
      setNotice(editing ? "Department updated successfully." : "Department created successfully.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save department.");
    } finally { setSaving(false); }
  }

  async function toggle(item: Department) {
    setBusyId(item.id); setError(""); setNotice("");
    try {
      await setDepartmentActive(item, !item.is_active);
      setNotice(item.name + (item.is_active ? " deactivated." : " activated."));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update department status.");
    } finally { setBusyId(null); }
  }

  return (
    <>
    <div className="departments-content">
          <div className="departments-heading"><div><span className="eyebrow"><span className="eyebrow-line" /> ORGANIZATION STRUCTURE</span><h1>Departments<span>.</span></h1><p>Create and manage the departments that organize your inventory operations.</p></div><Button onClick={openCreate} leadingIcon="＋">Add department</Button></div>
          <DepartmentStats departments={items} />
          {notice && <div className="department-alert success" role="status">{notice}</div>}
          {error && !dialog && <div className="department-alert error" role="alert">{error}</div>}
          <section className="department-list-panel">
            <div className="department-list-heading"><div><h2>All departments</h2><p>Manage names, codes and department access.</p></div><label className="inactive-toggle"><input type="checkbox" checked={includeInactive} onChange={(event) => setIncludeInactive(event.target.checked)} /> Show inactive</label></div>
            <div className="department-toolbar"><SearchField value={search} onChange={setSearch} placeholder="Search departments..." label="Search departments" /><span className="department-result-count">{filtered.length} departments</span></div>
            {loading ? <LoadingState label="Loading departments…" /> : filtered.length === 0 ? <EmptyState title={search ? "No matching departments" : "No departments yet"} description={search ? "Try another name or department code." : "Create your first department to organize your workspace."} action={!search ? <Button variant="secondary" onClick={openCreate}>Create department</Button> : undefined} /> : (
              <DepartmentTable departments={filtered} busyId={busyId} onEdit={openEdit} onToggle={(item) => setPendingDepartment(item)} />
            )}
          </section>
          <p className="departments-footnote">Changes to department status immediately affect access for assigned users.</p>
</div>
      <ConfirmDialog open={pendingDepartment !== null} title={pendingDepartment?.is_active ? "Deactivate department?" : "Activate department?"} description={pendingDepartment?.is_active ? `Users assigned to ${pendingDepartment.name} will lose access until it is reactivated.` : `Reactivate ${pendingDepartment?.name ?? "this department"}?`} confirmLabel={pendingDepartment?.is_active ? "Deactivate" : "Activate"} destructive={Boolean(pendingDepartment?.is_active)} busy={busyId !== null} onCancel={() => setPendingDepartment(null)} onConfirm={() => { if (pendingDepartment) { void toggle(pendingDepartment); setPendingDepartment(null); } }} />
      <DepartmentFormModal open={dialog} editing={editing} values={form} onChange={setForm} onClose={() => { if (!saving) setDialog(false); }} onSubmit={save} saving={saving} error={error} />
    </>
  );
}
