"use client";

import Button from "./button";
import Modal from "./modal";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = false,
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} description={description} onClose={onCancel} size="sm">
      <div className="ui-confirm-dialog__actions">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button variant={destructive ? "danger" : "primary"} onClick={onConfirm} disabled={busy}>
          {busy ? "Please wait…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
