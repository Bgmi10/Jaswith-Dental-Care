import { NextRequest } from "next/server";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import prisma from "@/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================
   CONSTANTS
============================================================ */

const fontPath = path.join(
    process.cwd(),
    "app/fonts/Roboto-VariableFont_wdth,wght.ttf"
  );
  
const PURPLE = "#45458D";
const TEXT = "#222222";
const BORDER = "#555555";

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;

const MARGIN_X = 42;
const MARGIN_TOP = 32;

const CONTENT_WIDTH =
  PAGE_WIDTH - MARGIN_X * 2;

/* ============================================================
   HELPERS
============================================================ */

function formatDate(
  value: Date | string | null | undefined
) {
  if (!value) return "";

  const date = new Date(value);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function money(value: unknown) {
  const amount = Number(value || 0);

  return amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function safeString(value: unknown) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value);
}

function paymentMethodLabel(
  method: string
) {
  const methods: Record<string, string> = {
    CASH: "Cash",
    UPI: "UPI",
    CARD: "Card",
    BANK: "Bank Transfer",
    BANK_TRANSFER: "Bank Transfer",
    NET_BANKING: "Bank Transfer",
  };

  return (
    methods[method] ||
    method
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      )
  );
}

/* ============================================================
   PATIENT HELPERS
============================================================ */

function getPatientName(patient: any) {
  if (patient.name) {
    return patient.name;
  }

  if (patient.fullName) {
    return patient.fullName;
  }

  return [
    patient.firstName,
    patient.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function getPatientPhone(patient: any) {
  return (
    patient.phone ||
    patient.mobile ||
    patient.mobileNumber ||
    ""
  );
}

function getPatientGender(patient: any) {
  return (
    patient.gender ||
    patient.sex ||
    ""
  );
}

function getPatientAge(patient: any) {
  if (
    patient.age !== null &&
    patient.age !== undefined
  ) {
    return String(patient.age);
  }

  if (
    patient.dateOfBirth ||
    patient.dob
  ) {
    const dob = new Date(
      patient.dateOfBirth ||
        patient.dob
    );

    const today = new Date();

    let age =
      today.getFullYear() -
      dob.getFullYear();

    const month =
      today.getMonth() -
      dob.getMonth();

    if (
      month < 0 ||
      (month === 0 &&
        today.getDate() <
          dob.getDate())
    ) {
      age--;
    }

    return String(age);
  }

  return "";
}

/* ============================================================
   CLINIC HELPERS
============================================================ */

function getClinicName(clinic: any) {
  return (
    clinic.name ||
    clinic.clinicName ||
    "JASWITH DENTAL CARE"
  );
}

function getDoctorName(clinic: any) {
  return (
    clinic.doctorName ||
    clinic.doctor ||
    clinic.primaryDoctor ||
    "Dr. J. Sailakshmi, MDS"
  );
}

function getClinicAddress(clinic: any) {
  if (clinic.address) {
    return clinic.address;
  }

  const parts = [
    clinic.addressLine1,
    clinic.addressLine2,
    clinic.city,
    clinic.state,
    clinic.pincode ||
      clinic.postalCode,
  ].filter(Boolean);

  if (parts.length) {
    return parts.join(", ");
  }

  return (
    "48/58, Vadamalai Street, " +
    "Purasaiwakkam, Chennai - 600007"
  );
}

function getClinicPhone(clinic: any) {
  return (
    clinic.phone ||
    clinic.mobile ||
    clinic.phoneNumber ||
    "8525033464"
  );
}

/* ============================================================
   TOOTH NUMBER
============================================================ */

function getToothNumber(
  item: any
) {
  const record =
    item.treatmentRecord;

  if (!record) {
    return "";
  }

  return (
    record.toothNumber ||
    record.toothNo ||
    record.tooth ||
    record.toothNumberText ||
    ""
  );
}

/* ============================================================
   DRAW TOOTH LOGO
============================================================ */

function drawToothLogo(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  size: number
) {
  const cx = x + size / 2;

  doc
    .save()
    .lineWidth(1.4)
    .strokeColor(PURPLE);

  /*
   * Simple dental/tooth style icon.
   */

  doc
    .moveTo(cx - size * 0.30, y + size * 0.18)
    .bezierCurveTo(
      cx - size * 0.47,
      y + size * 0.08,
      cx - size * 0.48,
      y + size * 0.48,
      cx - size * 0.26,
      y + size * 0.52
    )
    .bezierCurveTo(
      cx - size * 0.13,
      y + size * 0.54,
      cx - size * 0.16,
      y + size * 0.88,
      cx - size * 0.04,
      y + size * 0.90
    )
    .bezierCurveTo(
      cx + size * 0.04,
      y + size * 0.90,
      cx + size * 0.04,
      y + size * 0.58,
      cx + size * 0.12,
      y + size * 0.55
    )
    .bezierCurveTo(
      cx + size * 0.20,
      y + size * 0.58,
      cx + size * 0.20,
      y + size * 0.88,
      cx + size * 0.30,
      y + size * 0.90
    )
    .bezierCurveTo(
      cx + size * 0.43,
      y + size * 0.87,
      cx + size * 0.45,
      y + size * 0.53,
      cx + size * 0.50,
      y + size * 0.36
    )
    .bezierCurveTo(
      cx + size * 0.56,
      y + size * 0.13,
      cx + size * 0.43,
      y + size * 0.03,
      cx + size * 0.30,
      y + size * 0.18
    )
    .stroke();

  doc.restore();
}

/* ============================================================
   MAIN API
============================================================ */

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } = await context.params;

    /* ========================================================
       FETCH INVOICE
    ======================================================== */

    const invoice =
      await prisma.invoice.findUnique({
        where: {
          id,
        },

        include: {
          clinic: true,

          patient: true,

          items: {
            include: {
              treatment: true,
              treatmentRecord: true,
            },

            orderBy: {
              id: "asc",
            },
          },

          payments: {
            orderBy: {
              paymentDate: "asc",
            },
          },
        },
      });

    if (!invoice) {
      return new Response(
        "Invoice not found",
        {
          status: 404,
        }
      );
    }

    /* ========================================================
       CALCULATE PAYMENT TOTALS
    ======================================================== */

    const totalPaid =
      invoice.payments.reduce(
        (total, payment) =>
          total +
          Number(payment.amount),
        0
      );

    const invoiceTotal =
      Number(invoice.total);

    const balanceDue = Math.max(
      invoiceTotal - totalPaid,
      0
    );

    const paymentMethods = [
      ...new Set(
        invoice.payments.map(
          (payment) =>
            paymentMethodLabel(
              String(payment.method)
            )
        )
      ),
    ];

    const paymentMode =
      paymentMethods.length
        ? paymentMethods.join(" / ")
        : "-";

    /* ========================================================
       DATA
    ======================================================== */

    const clinic = invoice.clinic as any;
    const patient = invoice.patient as any;

    const clinicName =
      getClinicName(clinic);

    const doctorName =
      getDoctorName(clinic);

    const clinicAddress =
      getClinicAddress(clinic);

    const clinicPhone =
      getClinicPhone(clinic);

    const patientName =
      getPatientName(patient);

    const patientPhone =
      getPatientPhone(patient);

    const patientAge =
      getPatientAge(patient);

    const patientGender =
      getPatientGender(patient);

    /* ========================================================
       PDF
    ======================================================== */

    const doc =
      new PDFDocument({
        size: "A4",
        font: fontPath,
        margin: 0,
        autoFirstPage: true,
        bufferPages: true,
      });

    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => {
      chunks.push(chunk);
    });

    const pdfPromise =
      new Promise<Buffer>(
        (resolve, reject) => {
          doc.on("end", () => {
            resolve(
              Buffer.concat(chunks)
            );
          });

          doc.on("error", reject);
        }
      );

    /* ========================================================
       OUTER BORDER
    ======================================================== */

    doc
      .lineWidth(0.8)
      .strokeColor(PURPLE)
      .rect(
        MARGIN_X,
        MARGIN_TOP,
        CONTENT_WIDTH,
        PAGE_HEIGHT -
          MARGIN_TOP -
          30
      )
      .stroke();

    /* ========================================================
       HEADER
    ======================================================== */

    const headerTop = 48;

    /*
     * Left tooth logo
     */

    drawToothLogo(
      doc,
      MARGIN_X + 17,
      headerTop + 4,
      42
    );

    /*
     * Main clinic title
     */

    doc
      .font(fontPath)
      .fontSize(18)
      .fillColor(PURPLE)
      .text(
        clinicName.toUpperCase(),
        MARGIN_X + 68,
        headerTop + 2,
        {
          width:
            CONTENT_WIDTH - 136,
          align: "center",
        }
      );

    /*
     * Doctor
     */

    doc
      .font(fontPath)
      .fontSize(8.5)
      .fillColor(TEXT)
      .text(
        doctorName,
        MARGIN_X + 68,
        headerTop + 25,
        {
          width:
            CONTENT_WIDTH - 136,
          align: "center",
        }
      );

    /*
     * Address
     */

    doc
      .font(fontPath)
      .fontSize(7)
      .fillColor(TEXT)
      .text(
        clinicAddress,
        MARGIN_X + 68,
        headerTop + 39,
        {
          width:
            CONTENT_WIDTH - 136,
          align: "center",
        }
      );

    /*
     * Phone
     */

    doc
      .fontSize(7)
      .text(
        clinicPhone,
        MARGIN_X + 68,
        headerTop + 52,
        {
          width:
            CONTENT_WIDTH - 136,
          align: "center",
        }
      );

    /* ========================================================
       RIGHT HEALTHY SMILE BADGE
    ======================================================== */

    const badgeWidth = 54;
    const badgeHeight = 54;

    const badgeX =
      MARGIN_X +
      CONTENT_WIDTH -
      badgeWidth -
      13;

    const badgeY = headerTop;

    doc
      .lineWidth(0.7)
      .strokeColor("#777")
      .roundedRect(
        badgeX,
        badgeY,
        badgeWidth,
        badgeHeight,
        2
      )
      .stroke();

    drawToothLogo(
      doc,
      badgeX + 13,
      badgeY + 4,
      27
    );

    doc
      .font(fontPath)
      .fontSize(5.3)
      .fillColor(PURPLE)
      .text(
        "HEALTHY SMILE",
        badgeX + 2,
        badgeY + 34,
        {
          width: badgeWidth - 4,
          align: "center",
        }
      );

    doc
      .font(fontPath)
      .fontSize(4.8)
      .text(
        "GROWING WITH YOU",
        badgeX + 2,
        badgeY + 42,
        {
          width: badgeWidth - 4,
          align: "center",
        }
      );

    /* ========================================================
       BILL / RECEIPT RIBBON
    ======================================================== */

    const ribbonY = 132;
    const ribbonHeight = 24;

    const ribbonWidth = 230;

    const ribbonX =
      MARGIN_X +
      (CONTENT_WIDTH -
        ribbonWidth) /
        2;

    /*
     * Main ribbon
     */

    doc
      .fillColor(PURPLE)
      .rect(
        ribbonX,
        ribbonY,
        ribbonWidth,
        ribbonHeight
      )
      .fill();

    /*
     * Left triangular end
     */

    doc
      .moveTo(
        ribbonX,
        ribbonY
      )
      .lineTo(
        ribbonX - 10,
        ribbonY + 12
      )
      .lineTo(
        ribbonX,
        ribbonY + ribbonHeight
      )
      .closePath()
      .fill(PURPLE);

    /*
     * Right triangular end
     */

    doc
      .moveTo(
        ribbonX + ribbonWidth,
        ribbonY
      )
      .lineTo(
        ribbonX + ribbonWidth + 10,
        ribbonY + 12
      )
      .lineTo(
        ribbonX + ribbonWidth,
        ribbonY + ribbonHeight
      )
      .closePath()
      .fill(PURPLE);

    /*
     * Small white cuts
     */


    doc
      .font(fontPath)
      .fontSize(11)
      .fillColor("#FFFFFF")
      .text(
        "BILL / RECEIPT",
        ribbonX,
        ribbonY + 6,
        {
          width: ribbonWidth,
          align: "center",
        }
      );

    /* ========================================================
       BILL META
    ======================================================== */

    let y = 170;

    const half =
      CONTENT_WIDTH / 2;

    doc
      .font(fontPath)
      .fontSize(8)
      .fillColor(TEXT)
      .text(
        "Bill No:",
        MARGIN_X + 10,
        y
      );

    doc
      .font(fontPath)
      .text(
        invoice.invoiceNumber,
        MARGIN_X + 53,
        y
      );

    doc
      .font(fontPath)
      .text(
        "Date:",
        MARGIN_X +
          half +
          15,
        y
      );

    doc
      .font(fontPath)
      .text(
        formatDate(
          invoice.invoiceDate
        ),
        MARGIN_X +
          half +
          53,
        y
      );

    /*
     * Underline for bill number
     */

    doc
      .strokeColor("#777")
      .lineWidth(0.5)
      .moveTo(
        MARGIN_X + 53,
        y + 11
      )
      .lineTo(
        MARGIN_X + half - 5,
        y + 11
      )
      .stroke();

    /*
     * Date underline
     */

    doc
      .moveTo(
        MARGIN_X +
          half +
          53,
        y + 11
      )
      .lineTo(
        MARGIN_X +
          CONTENT_WIDTH -
          10,
        y + 11
      )
      .stroke();

    /* ========================================================
       PATIENT DETAILS
    ======================================================== */

    y += 24;

    doc
      .font(fontPath)
      .fontSize(8)
      .fillColor(TEXT)
      .text(
        "Patient Name:",
        MARGIN_X + 10,
        y
      );

    doc
      .font(fontPath)
      .text(
        patientName,
        MARGIN_X + 82,
        y
      );

    doc
      .strokeColor("#777")
      .moveTo(
        MARGIN_X + 82,
        y + 11
      )
      .lineTo(
        MARGIN_X +
          half -
          8,
        y + 11
      )
      .stroke();

    doc
      .font(fontPath)
      .text(
        "Age/Sex:",
        MARGIN_X +
          half +
          15,
        y
      );

    doc
      .font(fontPath)
      .text(
        [
          patientAge,
          patientGender,
        ]
          .filter(Boolean)
          .join(" / "),
        MARGIN_X +
          half +
          67,
        y
      );

    doc
      .moveTo(
        MARGIN_X +
          half +
          67,
        y + 11
      )
      .lineTo(
        MARGIN_X +
          CONTENT_WIDTH -
          10,
        y + 11
      )
      .stroke();

    y += 24;

    doc
      .font(fontPath)
      .text(
        "Phone:",
        MARGIN_X + 10,
        y
      );

    doc
      .font(fontPath)
      .text(
        patientPhone,
        MARGIN_X + 52,
        y
      );

    doc
      .moveTo(
        MARGIN_X + 52,
        y + 11
      )
      .lineTo(
        MARGIN_X +
          CONTENT_WIDTH -
          10,
        y + 11
      )
      .stroke();

    /* ========================================================
       BILLING TABLE
    ======================================================== */

    y += 20;

    const tableX =
      MARGIN_X + 10;

    const tableWidth =
      CONTENT_WIDTH - 20;

    /*
     * Physical bill is approximately:
     *
     * 70% treatment
     * 30% summary
     */

    const summaryWidth =
      155;

    const treatmentWidth =
      tableWidth -
      summaryWidth;

    const summaryX =
      tableX +
      treatmentWidth;

    const tableHeaderHeight = 31;

    /*
     * Treatment columns
     */

    const serialWidth = 38;
    const treatmentNameWidth =
      174;
    const toothWidth = 45;
    const qtyWidth = 34;

    const amountWidth =
      treatmentWidth -
      serialWidth -
      treatmentNameWidth -
      toothWidth -
      qtyWidth;

    const treatmentX =
      tableX + serialWidth;

    const toothX =
      treatmentX +
      treatmentNameWidth;

    const qtyX =
      toothX + toothWidth;

    const amountX =
      qtyX + qtyWidth;

    /* ========================================================
       TABLE HEADER
    ======================================================== */

    doc
      .fillColor(PURPLE)
      .rect(
        tableX,
        y,
        treatmentWidth,
        tableHeaderHeight
      )
      .fill();

    /*
     * Header text
     */

    doc
      .font(fontPath)
      .fontSize(7)
      .fillColor("#FFFFFF");

    doc.text(
      "S.\nNo.",
      tableX + 3,
      y + 6,
      {
        width:
          serialWidth - 6,
        align: "center",
      }
    );

    doc.text(
      "TREATMENT",
      treatmentX,
      y + 10,
      {
        width: treatmentNameWidth,
        align: "center",
      }
    );

    doc.text(
      "TOOTH\nNO.",
      toothX,
      y + 6,
      {
        width:
          toothWidth,
        align: "center",
      }
    );

    doc.text(
      "QTY",
      qtyX,
      y + 10,
      {
        width:
          qtyWidth,
        align: "center",
      }
    );

    doc.text(
      "AMOUNT\n(₹)",
      amountX,
      y + 6,
      {
        width:
          amountWidth,
        align: "center",
      }
    );

    /* ========================================================
       TREATMENT ROWS
    ======================================================== */

    const rowHeight = 27;

    const totalRows = 9;

    const treatmentStartY =
      y + tableHeaderHeight;

    for (
      let row = 0;
      row < totalRows;
      row++
    ) {
      const rowY =
        treatmentStartY +
        row * rowHeight;

      /*
       * Row background
       */

      doc
        .fillColor("#FFFFFF")
        .rect(
          tableX,
          rowY,
          treatmentWidth,
          rowHeight
        )
        .fill();

      /*
       * Row border
       */

      doc
        .strokeColor(BORDER)
        .lineWidth(0.45)
        .rect(
          tableX,
          rowY,
          treatmentWidth,
          rowHeight
        )
        .stroke();

      /*
       * Vertical columns
       */

      [
        treatmentX,
        toothX,
        qtyX,
        amountX,
      ].forEach((lineX) => {
        doc
          .moveTo(
            lineX,
            rowY
          )
          .lineTo(
            lineX,
            rowY + rowHeight
          )
          .stroke();
      });

      /*
       * Actual invoice item
       */

      const item =
        invoice.items[row];

      if (item) {
        doc
          .font(fontPath)
          .fontSize(7)
          .fillColor(TEXT);

        /*
         * Serial
         */

        doc.text(
          `${row + 1}.`,
          tableX,
          rowY + 9,
          {
            width:
              serialWidth,
            align: "center",
          }
        );

        /*
         * Treatment
         */

        doc.text(
          item.description || "-",
          treatmentX + 5,
          rowY + 8,
          {
            width:
              treatmentNameWidth - 10,
            height: rowHeight - 8,
            ellipsis: true,
          }
        );

        /*
         * Tooth
         */

        doc.text(
          safeString(
            getToothNumber(item)
          ),
          toothX,
          rowY + 9,
          {
            width:
              toothWidth,
            align: "center",
          }
        );

        /*
         * Quantity
         */

        doc.text(
          String(
            item.quantity || 1
          ),
          qtyX,
          rowY + 9,
          {
            width:
              qtyWidth,
            align: "center",
          }
        );

        /*
         * Amount
         */

        doc.text(
          money(item.amount),
          amountX + 3,
          rowY + 9,
          {
            width:
              amountWidth - 6,
            align: "right",
          }
        );
      } else {
        /*
         * Empty row serial
         */

        doc
          .font(fontPath)
          .fontSize(7)
          .fillColor(TEXT)
          .text(
            `${row + 1}.`,
            tableX,
            rowY + 9,
            {
              width:
                serialWidth,
              align: "center",
            }
          );
      }
    }

    /* ========================================================
       SUMMARY BOX
    ======================================================== */

    const summaryY = y;

    const summaryHeight =
      tableHeaderHeight +
      totalRows * rowHeight;

    /*
     * Summary outer border
     */

    doc
      .fillColor("#FFFFFF")
      .strokeColor(BORDER)
      .lineWidth(0.6)
      .rect(
        summaryX,
        summaryY,
        summaryWidth,
        summaryHeight
      )
      .fillAndStroke();

    /*
     * Summary rows
     */

    const summaryRowHeight = 40;

    let sy = summaryY;

    const summaryEntries = [
      [
        "Subtotal",
        `₹ ${money(
          invoice.subtotal
        )}`,
      ],
      [
        "Discount",
        `₹ ${money(
          invoice.discount
        )}`,
      ],
      [
        "Advance\nPaid",
        `₹ ${money(
          totalPaid
        )}`,
      ],
      [
        "Balance Due",
        `₹ ${money(
          balanceDue
        )}`,
      ],
    ];

    for (
      let i = 0;
      i < summaryEntries.length;
      i++
    ) {
      const [label, value] =
        summaryEntries[i];

      doc
        .font(fontPath)
        .fontSize(7)
        .fillColor(TEXT)
        .text(
          label,
          summaryX + 7,
          sy + 8,
          {
            width: 67,
          }
        );

      doc
        .font(fontPath)
        .fontSize(7)
        .text(
          value,
          summaryX + 75,
          sy + 8,
          {
            width:
              summaryWidth - 82,
            align: "right",
          }
        );

      /*
       * Horizontal separator
       */

      doc
        .strokeColor(BORDER)
        .lineWidth(0.45)
        .moveTo(
          summaryX,
          sy + summaryRowHeight
        )
        .lineTo(
          summaryX + summaryWidth,
          sy + summaryRowHeight
        )
        .stroke();

      sy += summaryRowHeight;
    }

    /*
     * Total Paid
     */

    const totalPaidHeight =
      summaryHeight -
      summaryRowHeight * 4;

    doc
      .fillColor(PURPLE)
      .rect(
        summaryX,
        sy,
        summaryWidth,
        totalPaidHeight
      )
      .fill();

    doc
      .fontSize(8)
      .fillColor("#FFFFFF")
      .text(
        "Total Paid",
        summaryX + 7,
        sy + 12
      );

    doc
      .fontSize(8)
      .text(
        ` ₹ ${money(
          totalPaid
        )}`,
        summaryX + 7,
        sy + 12,
        {
          width:
            summaryWidth - 14,
          align: "right",
        }
      );

    /* ========================================================
       PAYMENT MODE
    ======================================================== */

    const tableBottom =
      treatmentStartY +
      totalRows * rowHeight;

    const paymentY =
      tableBottom + 18;

    const paymentWidth = 310;
    const paymentHeight = 26;

    doc
      .lineWidth(0.8)
      .strokeColor(PURPLE)
      .roundedRect(
        tableX,
        paymentY,
        paymentWidth,
        paymentHeight,
        12
      )
      .stroke();

    doc
      .font(fontPath)
      .fontSize(7.5)
      .fillColor(TEXT)
      .text(
        "Payment Mode:",
        tableX + 11,
        paymentY + 8
      );

    doc
      .font(fontPath)
      .fontSize(7.5)
      .text(
        paymentMode,
        tableX + 79,
        paymentY + 8
      );

    /* ========================================================
       RECEIVED BY
    ======================================================== */

    const signatureY =
      paymentY + 86;

    doc
      .font(fontPath)
      .fontSize(8)
      .fillColor(TEXT)
      .text(
        "Received By:",
        tableX,
        signatureY
      );

    doc
      .strokeColor(BORDER)
      .lineWidth(0.6)
      .moveTo(
        tableX + 65,
        signatureY + 9
      )
      .lineTo(
        tableX + 195,
        signatureY + 9
      )
      .stroke();

    /* ========================================================
       DOCTOR SIGNATURE
    ======================================================== */

    const doctorSignatureWidth =
      175;

    const doctorSignatureX =
      MARGIN_X +
      CONTENT_WIDTH -
      doctorSignatureWidth -
      10;

    doc
      .strokeColor(BORDER)
      .lineWidth(0.6)
      .moveTo(
        doctorSignatureX,
        signatureY + 9
      )
      .lineTo(
        doctorSignatureX +
          doctorSignatureWidth,
        signatureY + 9
      )
      .stroke();

    doc
      .font(fontPath)
      .fontSize(7.5)
      .fillColor(TEXT)
      .text(
        "Doctor's Signature & Seal",
        doctorSignatureX,
        signatureY + 15,
        {
          width:
            doctorSignatureWidth,
          align: "center",
        }
      );

    /* ========================================================
       FOOTER
    ======================================================== */

    const footerHeight = 38;

    const footerY =
      PAGE_HEIGHT -
      68;

    doc
      .fillColor(PURPLE)
      .rect(
        MARGIN_X,
        footerY,
        CONTENT_WIDTH,
        footerHeight
      )
      .fill();

    /*
     * Footer text
     */

    doc
      .font(fontPath)
      .fontSize(7)
      .fillColor("#FFFFFF")
      .text(
        "Thank you for choosing Jaswith Dental Care.",
        MARGIN_X,
        footerY + 7,
        {
          width:
            CONTENT_WIDTH,
          align: "center",
        }
      );

    doc
      .fontSize(6.2)
      .text(
        "Please preserve this bill for future reference and warranty claims (where applicable).",
        MARGIN_X,
        footerY + 20,
        {
          width:
            CONTENT_WIDTH,
          align: "center",
        }
      );

    /* ========================================================
       FOOTER TOOTH
    ======================================================== */

    /*
     * The original receipt has a circular tooth mark
     * overlapping the top edge of the footer.
     */

    const footerCircleSize = 28;

    const footerCircleX =
      MARGIN_X +
      CONTENT_WIDTH / 2 -
      footerCircleSize / 2;

    const footerCircleY =
      footerY -
      footerCircleSize / 2;

    doc
      .fillColor("#FFFFFF")
      .strokeColor(PURPLE)
      .lineWidth(1)
      .circle(
        footerCircleX +
          footerCircleSize / 2,
        footerCircleY +
          footerCircleSize / 2,
        footerCircleSize / 2
      )
      .fillAndStroke();

    drawToothLogo(
      doc,
      footerCircleX + 6,
      footerCircleY + 5,
      16
    );

    /* ========================================================
       FINISH
    ======================================================== */

    doc.end();

    const pdfBuffer =
      await pdfPromise;

    const filename =
      `${invoice.invoiceNumber}-jaswith-dental-care.pdf`;

    return new Response(
      new Uint8Array(pdfBuffer),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            `attachment; filename="${filename}"`,

          "Content-Length":
            String(pdfBuffer.length),

          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "Invoice PDF generation error:",
      error
    );

    return new Response(
      error instanceof Error
        ? error.message
        : "Failed to generate invoice PDF",
      {
        status: 500,
        headers: {
          "Content-Type":
            "text/plain",
        },
      }
    );
  }
}