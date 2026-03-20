import { ReportStatus } from "@prisma/client";
import { z } from "zod";

export const createUploadBatchSchema = z.object({
  label: z.string().trim().max(120).optional().or(z.literal("")),
  expectedFilesCount: z.number().int().positive(),
});

export const createCaseSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(3000).optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1).max(60)).default([]),
});

export const updateCaseSchema = createCaseSchema.partial().extend({
  title: z.string().trim().min(1).max(160).optional(),
});

export const attachStudySchema = z.object({
  studyId: z.string().trim().min(1),
});

export const createReportSchema = z.object({
  title: z.string().trim().min(1).max(120).optional().or(z.literal("")),
  authorDisplayName: z.string().trim().max(120).optional().or(z.literal("")),
});

export const updateReportSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  authorDisplayName: z.string().trim().max(120).optional().or(z.literal("")),
  clinicalInfo: z.string().max(10000).optional(),
  technique: z.string().max(10000).optional(),
  findings: z.string().max(10000).optional(),
  impression: z.string().max(10000).optional(),
  status: z.nativeEnum(ReportStatus).optional(),
});

export const finalizeReportSchema = z.object({
  status: z.nativeEnum(ReportStatus).default(ReportStatus.FINAL),
});

export const createShareSchema = z.object({
  caseId: z.string().trim().min(1),
  label: z.string().trim().max(120).optional().or(z.literal("")),
});
