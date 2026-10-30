"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Department = {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
};

const blank = { name: "", code: "", description: "" };

export default function DepartmentsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeInactive, setIncludeInactive] = useState(true);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState(blank);
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
    setEditing(null); setForm(blank); setError(""); setNotice(""); setDialog(true);
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

  const activeCount = items.filter((item) => item.is_active).length;

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand"><Image src="/myaayaam-mark.svg" alt="" width={36} height={36} /><span>myaayaam<span>.</span></span></div>
        <div className="workspace-switcher"><span className="workspace-avatar">M</span><span><strong>MyAayaam</strong><small>Inventory workspace</small></span></div>
        <p className="nav-caption">WORKSPACE</p>
        <nav className="side-navigation" aria-label="Main navigation">
          <a className="side-link" href="/dashboard"><span className="nav-icon">◫</span> Overview</a>
          <a className="side-link active" href="/dashboard/departments"><span className="nav-icon">▦</span> Departments</a>
          <span className="side-link disabled" aria-disabled="true"><span className="nav-icon">♙</span> User management <span className="coming-soon">Soon</span></span>
          <span className="side-link disabled"><span className="nav-icon">▤</span> Inventory <span className="coming-soon">Soon</span></span>
          <span className="side-link disabled"><span className="nav-icon">◇</span> Products <span className="coming-soon">Soon</span></span>
          <span className="side-link disabled"><span className="nav-icon">▥</span> Reports <span className="coming-soon">Soon</span></span>
        </nav>
        <div className="sidebar-bottom"><div className="help-card"><span className="help-spark">✳</span><strong>Need a hand?</strong><p>Your workspace is just getting started.</p><span className="help-contact-disabled">Support options coming soon</span></div></div>
      </aside>
      <section className="dashboard-main">
        <header className="dashboard-topbar"><div className="breadcrumb"><a href="/dashboard">Workspace</a><span>/</span><strong>Departments</strong></div><div className="topbar-actions"><span className="today-label">ORGANIZE YOUR WORKSPACE</span><span className="topbar-avatar">M</span></div></header>
        <div className="departments-content">
          <div className="departments-heading"><div><span className="eyebrow"><span className="eyebrow-line" /> ORGANIZATION STRUCTURE</span><h1>Departments<span>.</span></h1><p>Create and manage the departments that organize your inventory operations.</p></div><button className="department-primary-button" onClick={openCreate} type="button">＋ Add department</button></div>
          <div className="department-stats">
            <article><span className="department-stat-icon lavender">▦</span><div><small>Total departments</small><strong>{items.length}</strong></div></article>
            <article><span className="department-stat-icon sage">✓</span><div><small>Active departments</small><strong>{activeCount}</strong></div></article>
            <article><span className="department-stat-icon peach">Ⅱ</span><div><small>Inactive departments</small><strong>{items.length - activeCount}</strong></div></article>
          </div>
          {notice && <div className="department-alert success" role="status">{notice}</div>}
          {error && !dialog && <div className="department-alert error" role="alert">{error}</div>}
          <section className="department-list-panel">
            <div className="department-list-heading"><div><h2>All departments</h2><p>Manage names, codes and department access.</p></div><label className="inactive-toggle"><input type="checkbox" checked={includeInactive} onChange={(event) => setIncludeInactive(event.target.checked)} /> Show inactive</label></div>
            <div className="department-toolbar"><label className="department-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search departments..." aria-label="Search departments" /></label><span className="department-result-count">{filtered.length} departments</span></div>
            {loading ? <div className="department-empty"><span className="department-loader" /><p>Loading departments…</p></div> : filtered.length === 0 ? <div className="department-empty"><span className="empty-illustration">▦</span><strong>{search ? "No matching departments" : "No departments yet"}</strong><p>{search ? "Try another name or department code." : "Create your first department to organize your workspace."}</p>{!search && <button className="department-secondary-button" onClick={openCreate} type="button">Create department</button>}</div> : (
              <div className="department-table-wrap"><table className="department-table"><thead><tr><th>DEPARTMENT</th><th>CODE</th><th>STATUS</th><th>CREATED</th><th className="actions-heading">ACTIONS</th></tr></thead><tbody>
                {filtered.map((item) => <tr key={item.id}><td><div className="department-name-cell"><span className="department-row-icon">{item.name.slice(0, 1).toUpperCase()}</span><div><strong>{item.name}</strong><small>{item.description || "No description added"}</small></div></div></td><td><span className="department-code">{item.code}</span></td><td><span className={item.is_active ? "department-status active" : "department-status inactive"}><i />{item.is_active ? "Active" : "Inactive"}</span></td><td className="department-date">{new Date(item.created_at).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}</td><td><div className="department-actions"><button type="button" onClick={() => openEdit(item)}>Edit</button><button type="button" disabled={busyId === item.id} onClick={() => void toggle(item)}>{busyId === item.id ? "Please wait…" : item.is_active ? "Deactivate" : "Activate"}</button></div></td></tr>)}
              </tbody></table></div>
            )}
          </section>
          <p className="departments-footnote">Changes to department status immediately affect access for assigned users.</p>
        </div>
      </section>
      {dialog && <div className="department-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setDialog(false); }}>
        <section className="department-modal" role="dialog" aria-modal="true" aria-labelledby="department-dialog-title">
          <div className="department-modal-heading"><div><span className="eyebrow">ORGANIZATION STRUCTURE</span><h2 id="department-dialog-title">{editing ? "Edit department" : "Create department"}</h2><p>{editing ? "Update this department's details." : "Add a department to your organization."}</p></div><button type="button" aria-label="Close dialog" onClick={() => setDialog(false)} disabled={saving}>×</button></div>
          <form onSubmit={save}>
            <label className="department-form-field"><span>Department name</span><input required minLength={1} maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Electronics" /></label>
            <label className="department-form-field"><span>Department code</span><input required minLength={1} maxLength={30} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })} placeholder="e.g. ELEC" /><small>Unique code using letters, numbers, hyphens or underscores.</small></label>
            <label className="department-form-field"><span>Description <em>Optional</em></span><textarea rows={3} maxLength={500} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What does this department handle?" /></label>
            {error && <div className="department-alert error" role="alert">{error}</div>}
            <div className="department-modal-actions"><button className="department-secondary-button" type="button" onClick={() => setDialog(false)} disabled={saving}>Cancel</button><button className="department-primary-button" type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Create department"}</button></div>
          </form>
        </section>
      </div>}
    </main>
  );
}
