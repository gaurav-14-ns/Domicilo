import jsPDF from "jspdf";
import type { Transaction, Settings } from "@/store/types";
import type { Tenant } from "@/store/types";

const UNITS = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
const TEENS = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function toIndianWords(n: number): string {
  if (n === 0) return "Zero";
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = Math.floor((n % 1000) / 100);
  const rest = n % 100;

  const parts: string[] = [];
  if (crore) parts.push(`${toWordsUnder1000(crore)} Crore`);
  if (lakh) parts.push(`${toWordsUnder1000(lakh)} Lakh`);
  if (thousand) parts.push(`${toWordsUnder1000(thousand)} Thousand`);
  if (hundred) parts.push(`${UNITS[hundred]} Hundred`);
  if (rest) parts.push(toWordsUnder100(rest));
  return parts.join(" ");
}

function toWordsUnder1000(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const p: string[] = [];
  if (h) p.push(`${UNITS[h]} Hundred`);
  if (r) p.push(toWordsUnder100(r));
  return p.join(" ");
}

function toWordsUnder100(n: number): string {
  if (n < 10) return UNITS[n];
  if (n < 20) return TEENS[n - 10];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return `${TENS[t]}${o ? " " + UNITS[o] : ""}`;
}

type RentReceiptInput = {
  transaction: Transaction;
  tenant: Tenant;
  settings?: Partial<Settings>;
  ownerName?: string;
};

export function generateRentReceiptPDF({ transaction: tx, tenant, settings, ownerName }: RentReceiptInput): void {
  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const pageW = 210;
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = margin;

  const companyName = settings?.companyName || "Domicilo";
  const ownerDisplay = ownerName || settings?.displayName || "Property Owner";

  const period = tx.date ? new Date(tx.date).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "";
  const payDate = tx.date ? new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "";

  const fmtAmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Math.abs(tx.amount));
  const amtWords = toIndianWords(Math.round(Math.abs(tx.amount)));

  const drawLine = (yPos: number) => {
    doc.setDrawColor(200);
    doc.line(margin, yPos, pageW - margin, yPos);
  };

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("RENT RECEIPT", pageW / 2, y, { align: "center" });
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Receipt No: ${tx.receiptNo || `RCP-${tx.id?.slice(0, 8).toUpperCase() || "N/A"}`}`, margin, y);
  doc.text(`Date: ${payDate}`, pageW - margin, y, { align: "right" });
  y += 8;
  drawLine(y);
  y += 6;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Received with thanks from:", margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const tenantInfo = [
    `Tenant Name: ${tenant.name}`,
    `Property: ${tenant.property}${tenant.room ? `, Room ${tenant.room}` : ""}`,
  ];
  for (const line of tenantInfo) {
    doc.text(line, margin + 2, y);
    y += 5;
  }
  y += 3;

  drawLine(y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Payment Details", margin, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const details = [
    ["Rent Period", period],
    ["Payment Date", payDate],
    ["Amount Paid", fmtAmt],
    ["Payment Mode", tx.method || "N/A"],
    ["Transaction Type", tx.type],
    ["Amount in Words", amtWords + " Only"],
  ];

  for (const [label, value] of details) {
    if (!value) continue;
    doc.setFont("helvetica", "bold");
    doc.text(label + ":", margin + 2, y);
    const lw = doc.getTextWidth(label + ": ");
    doc.setFont("helvetica", "normal");
    doc.text(value, margin + 4 + lw, y);
    y += 6;
  }

  y += 3;
  drawLine(y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`For ${companyName}`, margin, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(ownerDisplay, margin, y);
  y += 5;
  doc.text("(Authorised Signatory)", margin, y);

  y = pageW - margin - 20;
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text("This is a computer-generated receipt and does not require a physical signature.", pageW / 2, 285, { align: "center" });

  doc.save(`rent-receipt-${tx.receiptNo || tx.id?.slice(0, 8) || "download"}.pdf`);
}
