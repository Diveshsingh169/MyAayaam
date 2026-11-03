"use client";

import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import type { Department, DepartmentFormValues } from "../types/department";

type DepartmentFormModalProps = {
  open: boolean;
  editing: Department | null;
  values: DepartmentFormValues;
  onChange: (values: DepartmentFormValues) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  saving: boolean;
  error: string;
};

export default function DepartmentFormModal({
  open, editing, values, onChange, onClose, onSubmit, saving, error,
}: DepartmentFormModalProps) {
  return (
    <Modal
      open={open}
      title={editing ? "Edit department" : "Create department"}
      description={editing ? "Update this department's details." : "Add a department to your organization."}
      onClose={onClose}
      size="md"
    >
      <form onSubmit={onSubmit} className="department-form">
        <label className="department-form-field">
          <span>Department name</span>
          <input required minLength={1} maxLength={120} value={values.name}
            onChange={(event) => onChange({ ...values, name: event.target.value })}
            placeholder="e.g. Electronics" />
        </label>
        <label className="department-form-field">
          <span>Department code</span>
          <input required minLength={1} maxLength={30} value={values.code}
            onChange={(event) => onChange({ ...values, code: event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })}
            placeholder="e.g. ELEC" />
          <small>Unique code using letters, numbers, hyphens or underscores.</small>
        </label>
        <label className="department-form-field">
          <span>Description <em>Optional</em></span>
          <textarea rows={3} maxLength={500} value={values.description}
            onChange={(event) => onChange({ ...values, description: event.target.value })}
            placeholder="What does this department handle?" />
        </label>
        {error && <div className="department-alert error" role="alert">{error}</div>}
        <div className="department-modal-actions">
          <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Create department"}</Button>
        </div>
      </form>
    </Modal>
  );
}
