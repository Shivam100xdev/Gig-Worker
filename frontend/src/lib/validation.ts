import type { ValidationIssue } from "@/types";

export interface IncomeFormValues {
  incomeAmount: string;
  correspondingTax: string;
  workStartDate: string;
  workEndDate: string;
  taxPayDeadline: string;
  clientName: string;
  clientEmail: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export function validateIncomeForm(values: IncomeFormValues): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const income = Number(values.incomeAmount);
  if (!values.incomeAmount || Number.isNaN(income) || income <= 0) {
    issues.push({ field: "incomeAmount", message: "Enter an income amount greater than ₹0." });
  }

  const tax = Number(values.correspondingTax);
  if (values.correspondingTax !== "" && (Number.isNaN(tax) || tax < 0)) {
    issues.push({ field: "correspondingTax", message: "Tax amount can't be negative." });
  }
  if (!Number.isNaN(income) && !Number.isNaN(tax) && tax > income) {
    issues.push({ field: "correspondingTax", message: "Tax can't exceed the reported income." });
  }

  if (!values.workStartDate) {
    issues.push({ field: "workStartDate", message: "Add a work start date." });
  }
  if (!values.workEndDate) {
    issues.push({ field: "workEndDate", message: "Add a work end date." });
  }
  if (
    values.workStartDate &&
    values.workEndDate &&
    new Date(values.workEndDate) < new Date(values.workStartDate)
  ) {
    issues.push({ field: "workEndDate", message: "End date can't be before the start date." });
  }

  if (!values.taxPayDeadline) {
    issues.push({ field: "taxPayDeadline", message: "Add the tax pay deadline for this income." });
  }

  if (!values.clientName.trim()) {
    issues.push({ field: "clientName", message: "Add the client's name." });
  }
  if (!values.clientEmail.trim() || !EMAIL_RE.test(values.clientEmail)) {
    issues.push({ field: "clientEmail", message: "Enter a valid client email." });
  }

  return issues;
}

export function validatePan(pan: string): boolean {
  return PAN_RE.test(pan.toUpperCase());
}
