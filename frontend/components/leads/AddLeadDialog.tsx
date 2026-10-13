"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { ApiError, createLead, errorMessage } from "@/lib/api";
import type { Lead, LeadStatus } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusSelect } from "./StatusSelect";

interface AddLeadDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (lead: Lead) => void;
}

export function AddLeadDialog({ open, onClose, onCreated }: AddLeadDialogProps) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="add-lead-title" size="sm">
      <AddLeadForm onClose={onClose} onCreated={onCreated} />
    </Modal>
  );
}

interface FormErrors {
  name?: string;
  company?: string;
  phone?: string;
  status?: string;
  form?: string;
}

const INPUT_CLASS =
  "mt-1 block h-10 w-full rounded-lg border-0 px-3 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 focus:outline-none aria-invalid:ring-red-500";

function AddLeadForm({ onClose, onCreated }: Omit<AddLeadDialogProps, "open">) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<LeadStatus>("NEW");
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setErrors({ name: "Name is required." });
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      const lead = await createLead({
        name: name.trim(),
        company: company.trim() || undefined,
        phone: phone.trim() || undefined,
        status,
      });
      onCreated(lead);
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
        setErrors(error.fieldErrors);
      } else {
        setErrors({ form: errorMessage(error) });
      }
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 p-5">
      <div>
        <h2 id="add-lead-title" className="text-lg font-semibold text-slate-900">
          Add lead
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">Only the name is required.</p>
      </div>

      <Field id="lead-name" label="Name" required error={errors.name}>
        <input
          id="lead-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={120}
          autoFocus
          autoComplete="off"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "lead-name-error" : undefined}
          className={INPUT_CLASS}
        />
      </Field>

      <Field id="lead-company" label="Company" error={errors.company}>
        <input
          id="lead-company"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          maxLength={120}
          autoComplete="off"
          aria-invalid={Boolean(errors.company)}
          className={INPUT_CLASS}
        />
      </Field>

      <Field id="lead-phone" label="Phone" error={errors.phone}>
        <input
          id="lead-phone"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          maxLength={30}
          placeholder="+91 98765 43210"
          autoComplete="off"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "lead-phone-error" : undefined}
          className={INPUT_CLASS}
        />
      </Field>

      <Field id="lead-status-new" label="Status" error={errors.status}>
        <div className="mt-1">
          <StatusSelect id="lead-status-new" value={status} onChange={setStatus} />
        </div>
      </Field>

      {errors.form && (
        <p role="alert" className="text-sm text-red-600">
          {errors.form}
        </p>
      )}

      <div className="mt-1 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Adding…" : "Add lead"}
        </Button>
      </div>
    </form>
  );
}

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}

function Field({ id, label, required, error, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
