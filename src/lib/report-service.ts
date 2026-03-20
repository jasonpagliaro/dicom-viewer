import { ReportStatus } from "@prisma/client";

import { REPORT_TEMPLATES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { buildReportSnapshot } from "@/lib/reports";

type ReportMutationInput = {
  title?: string;
  authorDisplayName?: string | null;
  clinicalInfo?: string;
  technique?: string;
  findings?: string;
  impression?: string;
  status?: ReportStatus;
};

export async function createReportForCase(caseId: string, input?: { title?: string; authorDisplayName?: string | null }) {
  const report = await prisma.report.create({
    data: {
      caseId,
      title: input?.title || "Primary Report",
      authorDisplayName: input?.authorDisplayName || null,
      ...REPORT_TEMPLATES,
      revisions: {
        create: {
          revisionNumber: 1,
          authorDisplayName: input?.authorDisplayName || null,
          status: ReportStatus.DRAFT,
          snapshot: buildReportSnapshot({
            title: input?.title || "Primary Report",
            authorDisplayName: input?.authorDisplayName || null,
            status: ReportStatus.DRAFT,
            clinicalInfo: REPORT_TEMPLATES.clinicalInfo,
            technique: REPORT_TEMPLATES.technique,
            findings: REPORT_TEMPLATES.findings,
            impression: REPORT_TEMPLATES.impression,
            revisionNumber: 1,
          }),
        },
      },
    },
  });

  await prisma.case.update({
    where: { id: caseId },
    data: { updatedAt: new Date() },
  });

  return report;
}

export async function updateReportWithRevision(reportId: string, input: ReportMutationInput) {
  const current = await prisma.report.findUnique({
    where: { id: reportId },
  });

  if (!current) {
    return null;
  }

  const nextRevisionNumber = current.revisionNumber + 1;
  const nextStatus = input.status ?? current.status;
  const updated = await prisma.report.update({
    where: { id: reportId },
    data: {
      title: input.title ?? current.title,
      authorDisplayName:
        input.authorDisplayName === undefined ? current.authorDisplayName : input.authorDisplayName,
      clinicalInfo: input.clinicalInfo ?? current.clinicalInfo,
      technique: input.technique ?? current.technique,
      findings: input.findings ?? current.findings,
      impression: input.impression ?? current.impression,
      status: nextStatus,
      finalizedAt:
        nextStatus === ReportStatus.FINAL
          ? current.finalizedAt ?? new Date()
          : null,
      revisionNumber: nextRevisionNumber,
      revisions: {
        create: {
          revisionNumber: nextRevisionNumber,
          authorDisplayName:
            input.authorDisplayName === undefined ? current.authorDisplayName : input.authorDisplayName,
          status: nextStatus,
          snapshot: buildReportSnapshot({
            title: input.title ?? current.title,
            authorDisplayName:
              input.authorDisplayName === undefined ? current.authorDisplayName : input.authorDisplayName,
            status: nextStatus,
            clinicalInfo: input.clinicalInfo ?? current.clinicalInfo,
            technique: input.technique ?? current.technique,
            findings: input.findings ?? current.findings,
            impression: input.impression ?? current.impression,
            revisionNumber: nextRevisionNumber,
          }),
        },
      },
    },
  });

  await prisma.case.update({
    where: { id: current.caseId },
    data: { updatedAt: new Date() },
  });

  return updated;
}
