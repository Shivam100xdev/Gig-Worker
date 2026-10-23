import type { IncomeRecord, TaxDeductionSource } from "@/types";
import { api } from "./client";

/**
 * Income-record CRUD backed by Postgres (the DB is the source of truth in
 * real mode). Mock mode never calls this — useIncomeRecordActions keeps its
 * localStorage behaviour there.
 */

interface RecordApiRow {
  id: string;
  platformId: string;
  platformName?: string;
  incomeAmount: number;
  correspondingTax: number;
  taxDeductionSource: TaxDeductionSource;
  paymentStatus: IncomeRecord["paymentStatus"];
  receiptConfirmed: boolean;
  receiptFileName: string | null;
  workStartDate: string | Date;
  workEndDate: string | Date;
  taxPayDeadline: string | Date;
  client: { name: string | null; email: string | null };
  source: string;
  createdAt: string | Date;
}

export function mapRecordRow(r: RecordApiRow): IncomeRecord {
  const iso = (d: string | Date) => new Date(d).toISOString();
  return {
    id: r.id,
    platformId: r.platformId,
    incomeAmount: Number(r.incomeAmount),
    correspondingTax: Number(r.correspondingTax),
    taxDeductionSource: r.taxDeductionSource,
    paymentStatus: r.paymentStatus,
    receiptConfirmed: r.receiptConfirmed,
    receiptFileName: r.receiptFileName ?? undefined,
    workStartDate: iso(r.workStartDate),
    workEndDate: iso(r.workEndDate),
    taxPayDeadline: iso(r.taxPayDeadline),
    client: { name: r.client?.name ?? "", email: r.client?.email ?? "" },
    notes: undefined,
    createdAt: iso(r.createdAt),
    updatedAt: iso(r.createdAt),
  };
}

export interface CreateRecordInput {
  platformId: string;
  incomeAmount: number;
  correspondingTax: number;
  taxDeductionSource: TaxDeductionSource;
  workStartDate: string; // yyyy-mm-dd from the form
  workEndDate: string;
  taxPayDeadline: string;
  clientName: string;
  clientEmail: string;
}

export const recordService = {
  async list(): Promise<IncomeRecord[]> {
    const res = await api.get<{ records: RecordApiRow[] }>("/records");
    return res.records.map(mapRecordRow);
  },

  async create(input: CreateRecordInput): Promise<IncomeRecord> {
    const res = await api.post<{ recordId: string }>("/records", {
      platformId: input.platformId,
      incomeAmount: input.incomeAmount,
      correspondingTax: input.correspondingTax,
      taxDeductionSource: input.taxDeductionSource,
      workStartDate: input.workStartDate,
      workEndDate: input.workEndDate,
      taxPayDeadline: input.taxPayDeadline,
      clientName: input.clientName,
      clientEmail: input.clientEmail,
    });
    const now = new Date().toISOString();
    return {
      id: res.recordId,
      platformId: input.platformId,
      incomeAmount: input.incomeAmount,
      correspondingTax: input.correspondingTax,
      taxDeductionSource: input.taxDeductionSource,
      paymentStatus: "not_paid",
      receiptConfirmed: input.taxDeductionSource === "none",
      workStartDate: new Date(input.workStartDate).toISOString(),
      workEndDate: new Date(input.workEndDate).toISOString(),
      taxPayDeadline: new Date(input.taxPayDeadline).toISOString(),
      client: { name: input.clientName, email: input.clientEmail },
      createdAt: now,
      updatedAt: now,
    };
  },

  async update(recordId: string, patch: { paymentStatus?: IncomeRecord["paymentStatus"]; receiptConfirmed?: boolean; receiptFileName?: string }): Promise<void> {
    await api.patch(`/records/${recordId}`, patch);
  },

  async remove(recordId: string): Promise<void> {
    await api.delete(`/records/${recordId}`);
  },
};
