"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import DepartmentStats from "@/features/departments/components/department-stats";
import DepartmentTable from "@/features/departments/components/department-table";
import DepartmentFormModal from "@/features/departments/components/department-form-modal";
import { emptyDepartmentForm, type Department, type DepartmentFormValues } from "@/features/departments/types/department";

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

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/departments?include_inactive=" + includeInactive, { cache: "no-store" });
      if (response.status === 401) { router.replace("/"); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load departments.");
      setItems(data.departments || []);
    } catch (err) {
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
      const response = await fetch(editing ? "/api/departments/" + editing.id : "/api/departments", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), code: form.code.trim().toUpperCase(), description: form.description.trim() || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save department.");
      setDialog(false);
      setNotice(editing ? "Department updated successfully." : "Department created successfully.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save department.");
    } finally { setSaving(false); }
  }

  async function toggle(item: Department) {
    const action = item.is_active ? "deactivate" : "activate";
    const confirmed = window.confirm(item.is_active
      ? "Deactivate " + item.name + "? Assigned users will lose access until it is reactivated."
      : "Activate " + item.name + "?");
    if (!confirmed) return;
    setBusyId(item.id); setError(""); setNotice("");
    try {
      const response = await fetch("/api/departments/" + item.id, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !item.is_active }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to " + action + " department.");
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
            <div className="department-toolbar"><label className="department-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search departments..." aria-label="Search departments" /></label><span className="department-result-count">{filtered.length} departments</span></div>
            {loading ? <div className="department-empty"><span className="department-loader" /><p>Loading departments…</p></div> : filtered.length === 0 ? <div className="department-empty"><span className="empty-illustration">▦</span><strong>{search ? "No matching departments" : "No departments yet"}</strong><p>{search ? "Try another name or department code." : "Create your first department to organize your workspace."}</p>{!search && <Button variant="secondary" onClick={openCreate}>Create department</Button>}</div> : (
              <DepartmentTable departments={filtered} busyId={busyId} onEdit={openEdit} onToggle={(item) => void toggle(item)} />
            )}
          </section>
          <p className="departments-footnote">Changes to department status immediately affect access for assigned users.</p>
</div>
      <DepartmentFormModal open={dialog} editing={editing} values={form} onChange={setForm} onClose={() => { if (!saving) setDialog(false); }} onSubmit={save} saving={saving} error={error} />
    </>
  );
}
