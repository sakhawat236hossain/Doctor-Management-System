"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

interface PrintTokenProps {
  doctorName: string;
  patientName: string;
  serialNumber: number;
  date: string;
  type: "new" | "follow-up";
  fee: number;
}

export function PrintToken({
  doctorName,
  patientName,
  serialNumber,
  date,
  type,
  fee,
}: PrintTokenProps) {
  const t = useT();

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print Button - hidden when printing */}
      <Button onClick={handlePrint} variant="outline" className="print:hidden">
        <Printer className="mr-2 h-4 w-4" />
        {t("token.printToken")}
      </Button>

      {/* Printable Token - only visible when printing */}
      <div className="hidden print:block print:m-0">
        <div
          style={{
            width: "80mm",
            padding: "8mm",
            fontFamily: "monospace",
            fontSize: "12px",
            lineHeight: "1.6",
            border: "2px dashed #000",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "8px" }}>
            <div style={{ fontSize: "16px", fontWeight: "bold" }}>
              🏥 MediFlow Clinic
            </div>
            <div style={{ fontSize: "10px", color: "#666" }}>
              {t("token.appointmentToken")}
            </div>
          </div>

          <div style={{ borderTop: "1px dashed #000", paddingTop: "6px" }}>
            <div>
              <strong>{t("roles.doctor")}:</strong> {doctorName}
            </div>
            <div>
              <strong>{t("roles.patient")}:</strong> {patientName}
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                textAlign: "center",
                margin: "8px 0",
                padding: "6px",
                border: "1px solid #000",
              }}
            >
              {t("token.serial")}: #{serialNumber}
            </div>
            <div>
              <strong>{t("common.date")}:</strong> {date}
            </div>
            <div>
              <strong>{t("common.type")}:</strong>{" "}
              {type === "new" ? t("appointment.newVisit") : t("appointment.followUp")}
            </div>
            <div>
              <strong>{t("common.fee")}:</strong> ৳ {fee}
            </div>
          </div>

          <div
            style={{
              borderTop: "1px dashed #000",
              marginTop: "8px",
              paddingTop: "6px",
              textAlign: "center",
              fontSize: "10px",
              color: "#666",
            }}
          >
            {t("token.thankYou")}
          </div>
        </div>
      </div>

      {/* Screen preview of token */}
      <div className="print:hidden">
        <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 max-w-xs mx-auto bg-white dark:bg-slate-800 font-mono text-sm">
          <div className="text-center mb-4">
            <div className="text-lg font-bold text-gray-900 dark:text-white">🏥 MediFlow Clinic</div>
            <div className="text-xs text-gray-500 dark:text-slate-400">{t("token.appointmentToken")}</div>
          </div>
          <div className="border-t border-dashed border-gray-300 dark:border-slate-600 pt-3 space-y-1.5">
            <div className="dark:text-slate-300"><span className="font-semibold">{t("roles.doctor")}:</span> {doctorName}</div>
            <div className="dark:text-slate-300"><span className="font-semibold">{t("roles.patient")}:</span> {patientName}</div>
            <div className="text-3xl font-bold text-center text-blue-600 dark:text-blue-400 py-3 my-2 border border-gray-200 dark:border-slate-600 rounded">
              #{serialNumber}
            </div>
            <div className="dark:text-slate-300"><span className="font-semibold">{t("common.date")}:</span> {date}</div>
            <div className="dark:text-slate-300"><span className="font-semibold">{t("common.type")}:</span> {type === "new" ? t("appointment.newVisit") : t("appointment.followUp")}</div>
            <div className="dark:text-slate-300"><span className="font-semibold">{t("common.fee")}:</span> ৳ {fee}</div>
          </div>
          <div className="border-t border-dashed border-gray-300 dark:border-slate-600 mt-4 pt-3 text-center text-xs text-gray-400 dark:text-slate-500">
            {t("token.thankYou")}
          </div>
        </div>
      </div>
    </>
  );
}
"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrintTokenProps {
  doctorName: string;
  patientName: string;
  serialNumber: number;
  date: string;
  type: "new" | "follow-up";
  fee: number;
}

export function PrintToken({
  doctorName,
  patientName,
  serialNumber,
  date,
  type,
  fee,
}: PrintTokenProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print Button - hidden when printing */}
      <Button onClick={handlePrint} variant="outline" className="print:hidden">
        <Printer className="mr-2 h-4 w-4" />
        Print Token
      </Button>

      {/* Printable Token - only visible when printing */}
      <div className="hidden print:block print:m-0">
        <div
          style={{
            width: "80mm",
            padding: "8mm",
            fontFamily: "monospace",
            fontSize: "12px",
            lineHeight: "1.6",
            border: "2px dashed #000",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "8px" }}>
            <div style={{ fontSize: "16px", fontWeight: "bold" }}>
              🏥 MediFlow Clinic
            </div>
            <div style={{ fontSize: "10px", color: "#666" }}>
              Appointment Token
            </div>
          </div>

          <div style={{ borderTop: "1px dashed #000", paddingTop: "6px" }}>
            <div>
              <strong>ডাক্তার:</strong> {doctorName}
            </div>
            <div>
              <strong>রোগী:</strong> {patientName}
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                textAlign: "center",
                margin: "8px 0",
                padding: "6px",
                border: "1px solid #000",
              }}
            >
              সিরিয়াল: #{serialNumber}
            </div>
            <div>
              <strong>তারিখ:</strong> {date}
            </div>
            <div>
              <strong>ধরন:</strong>{" "}
              {type === "new" ? "নতুন রোগী" : "ফলো-আপ"}
            </div>
            <div>
              <strong>ফি:</strong> ৳ {fee}
            </div>
          </div>

          <div
            style={{
              borderTop: "1px dashed #000",
              marginTop: "8px",
              paddingTop: "6px",
              textAlign: "center",
              fontSize: "10px",
              color: "#666",
            }}
          >
            Thank you for choosing MediFlow
          </div>
        </div>
      </div>

      {/* Screen preview of token */}
      <div className="print:hidden">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 max-w-xs mx-auto bg-white font-mono text-sm">
          <div className="text-center mb-4">
            <div className="text-lg font-bold text-gray-900">🏥 MediFlow Clinic</div>
            <div className="text-xs text-gray-500">Appointment Token</div>
          </div>
          <div className="border-t border-dashed border-gray-300 pt-3 space-y-1.5">
            <div><span className="font-semibold">ডাক্তার:</span> {doctorName}</div>
            <div><span className="font-semibold">রোগী:</span> {patientName}</div>
            <div className="text-3xl font-bold text-center text-blue-600 py-3 my-2 border border-gray-200 rounded">
              #{serialNumber}
            </div>
            <div><span className="font-semibold">তারিখ:</span> {date}</div>
            <div><span className="font-semibold">ধরন:</span> {type === "new" ? "নতুন রোগী" : "ফলো-আপ"}</div>
            <div><span className="font-semibold">ফি:</span> ৳ {fee}</div>
          </div>
          <div className="border-t border-dashed border-gray-300 mt-4 pt-3 text-center text-xs text-gray-400">
            Thank you for choosing MediFlow
          </div>
        </div>
      </div>
    </>
  );
}
