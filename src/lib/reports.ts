import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { ReportStatus } from "@prisma/client";

import type { ReportDto, StudySummaryDto } from "@/lib/data";

type CaseHeader = {
  title: string;
  description: string | null;
  tags: string[];
};

type Snapshot = Pick<
  ReportDto,
  | "title"
  | "authorDisplayName"
  | "status"
  | "clinicalInfo"
  | "technique"
  | "findings"
  | "impression"
  | "revisionNumber"
>;

export function buildReportSnapshot(report: Snapshot) {
  return {
    title: report.title,
    authorDisplayName: report.authorDisplayName,
    status: report.status,
    clinicalInfo: report.clinicalInfo,
    technique: report.technique,
    findings: report.findings,
    impression: report.impression,
    revisionNumber: report.revisionNumber,
  };
}

function wrapText(text: string, font: PDFFont, size: number, width: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= width) {
      current = candidate;
    } else {
      if (current) {
        lines.push(current);
      }
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [""];
}

function drawBlock(
  page: PDFPage,
  font: PDFFont,
  boldFont: PDFFont,
  cursorY: number,
  title: string,
  body: string,
) {
  const margin = 54;
  const width = page.getWidth() - margin * 2;
  let y = cursorY;

  page.drawText(title.toUpperCase(), {
    x: margin,
    y,
    size: 11,
    font: boldFont,
    color: rgb(0.76, 0.25, 0.08),
  });

  y -= 18;

  const lines = wrapText(body || "-", font, 11, width);
  for (const line of lines) {
    page.drawText(line, {
      x: margin,
      y,
      size: 11,
      font,
      color: rgb(0.1, 0.15, 0.25),
    });
    y -= 14;
  }

  return y - 12;
}

export async function createReportPdf(params: {
  caseHeader: CaseHeader;
  report: ReportDto;
  studies: StudySummaryDto[];
}) {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const margin = 54;
  let y = 730;

  page.drawText(params.caseHeader.title, {
    x: margin,
    y,
    size: 22,
    font: boldFont,
    color: rgb(0.08, 0.12, 0.2),
  });
  y -= 24;

  page.drawText(
    `Status: ${params.report.status === ReportStatus.FINAL ? "Final" : "Draft"} | Author: ${params.report.authorDisplayName || "Unspecified"}`,
    {
      x: margin,
      y,
      size: 11,
      font,
      color: rgb(0.3, 0.36, 0.44),
    },
  );
  y -= 24;

  if (params.caseHeader.description) {
    const lines = wrapText(params.caseHeader.description, font, 11, page.getWidth() - margin * 2);
    for (const line of lines) {
      page.drawText(line, {
        x: margin,
        y,
        size: 11,
        font,
        color: rgb(0.18, 0.22, 0.31),
      });
      y -= 14;
    }
    y -= 10;
  }

  if (params.caseHeader.tags.length > 0) {
    page.drawText(`Tags: ${params.caseHeader.tags.join(", ")}`, {
      x: margin,
      y,
      size: 10,
      font,
      color: rgb(0.3, 0.36, 0.44),
    });
    y -= 24;
  }

  page.drawText("Linked studies", {
    x: margin,
    y,
    size: 11,
    font: boldFont,
    color: rgb(0.76, 0.25, 0.08),
  });
  y -= 18;

  for (const study of params.studies) {
    const line = `${study.displayTitle} (${study.modalities.join("/") || "DICOM"}) | ${study.studyInstanceUid}`;
    for (const wrapped of wrapText(line, font, 10, page.getWidth() - margin * 2)) {
      page.drawText(wrapped, {
        x: margin,
        y,
        size: 10,
        font,
        color: rgb(0.18, 0.22, 0.31),
      });
      y -= 13;
    }
  }

  y -= 18;

  for (const section of [
    ["Clinical info", params.report.clinicalInfo],
    ["Technique", params.report.technique],
    ["Findings", params.report.findings],
    ["Impression", params.report.impression],
  ] as const) {
    if (y < 120) {
      page = pdf.addPage([612, 792]);
      y = 730;
    }
    y = drawBlock(page, font, boldFont, y, section[0], section[1]);
  }

  return pdf.save();
}
