import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Expense } from './types';
import { formatCurrency, formatDate } from './utils';

export type ExportFormat = 'csv' | 'json' | 'pdf';

export const FORMAT_EXTENSIONS: Record<ExportFormat, string> = {
  csv: 'csv',
  json: 'json',
  pdf: 'pdf',
};

export const FORMAT_LABELS: Record<ExportFormat, string> = {
  csv: 'CSV',
  json: 'JSON',
  pdf: 'PDF',
};

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function exportAsCSV(expenses: Expense[], filename: string): Promise<void> {
  const headers = ['Date', 'Category', 'Amount', 'Description'];
  const rows = expenses.map((e) =>
    [e.date, e.category, e.amount.toFixed(2), e.description].map(escapeCsvCell).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

export async function exportAsJSON(expenses: Expense[], filename: string): Promise<void> {
  const payload = {
    exportedAt: new Date().toISOString(),
    recordCount: expenses.length,
    totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
    expenses: expenses.map((e) => ({
      id: e.id,
      date: e.date,
      category: e.category,
      amount: e.amount,
      description: e.description,
      createdAt: e.createdAt,
    })),
  };
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  triggerDownload(blob, filename);
}

export async function exportAsPDF(expenses: Expense[], filename: string): Promise<void> {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const generatedAt = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('Expense Report', 40, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated ${generatedAt}`, 40, 68);
  doc.text(
    `${expenses.length} record${expenses.length === 1 ? '' : 's'}  ·  Total ${formatCurrency(total)}`,
    40,
    82
  );

  autoTable(doc, {
    startY: 100,
    head: [['Date', 'Category', 'Amount', 'Description']],
    body: expenses.map((e) => [
      formatDate(e.date),
      e.category,
      formatCurrency(e.amount),
      e.description,
    ]),
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 6, textColor: [30, 41, 59] },
    headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 90 },
      2: { cellWidth: 70, halign: 'right' },
      3: { cellWidth: 'auto' },
    },
    margin: { left: 40, right: 40 },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        pageWidth - 40,
        doc.internal.pageSize.getHeight() - 20,
        { align: 'right' }
      );
    },
  });

  doc.save(filename);
}

export async function runExport(
  format: ExportFormat,
  expenses: Expense[],
  filename: string
): Promise<void> {
  switch (format) {
    case 'csv':
      return exportAsCSV(expenses, filename);
    case 'json':
      return exportAsJSON(expenses, filename);
    case 'pdf':
      return exportAsPDF(expenses, filename);
  }
}
