"use client";

import { useState, useEffect } from "react";
import { connectSocket, disconnectSocket, SOCKET_EVENTS } from "@/lib/socket";
import { Card, CardContent } from "@/components/ui/card";
import { useT } from "@/lib/i18n";
import type { Socket } from "socket.io-client";

interface LiveQueueWidgetProps {
  doctorId: string;
  patientSerial: number;
}

interface QueueUpdate {
  doctorId: string;
  currentSerial: number;
  status: string;
  totalBooked?: number;
}

export function LiveQueueWidget({ doctorId, patientSerial }: LiveQueueWidgetProps) {
  const t = useT();
  const [currentSerial, setCurrentSerial] = useState(0);
  const [queueStatus, setQueueStatus] = useState<string>("open");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let socket: Socket;
    try {
      socket = connectSocket();
      setConnected(true);

      const handleQueueUpdate = (data: QueueUpdate) => {
        if (data.doctorId === doctorId) {
          setCurrentSerial(data.currentSerial);
          setQueueStatus(data.status);
        }
      };

      socket.on(SOCKET_EVENTS.QUEUE_UPDATED, handleQueueUpdate);
      socket.on("connect", () => setConnected(true));
      socket.on("disconnect", () => setConnected(false));

      const today = new Date().toISOString().split("T")[0];
      fetch(`/api/queue?doctorId=${doctorId}&date=${today}`)
        .then((r) => r.json())
        .then((res) => {
          if (res.success && res.data.length > 0) {
            setCurrentSerial(res.data[0].currentSerial);
            setQueueStatus(res.data[0].status);
          }
        })
        .catch(() => {});
    } catch {
      // Socket not available
    }

    return () => {
      try {
        disconnectSocket();
      } catch {
        // ignore
      }
    };
  }, [doctorId]);

  const ahead = Math.max(0, patientSerial - currentSerial);
  const progress =
    patientSerial > 0
      ? Math.min(100, Math.round((currentSerial / patientSerial) * 100))
      : 0;
  const isAlmostTime = ahead <= 2 && ahead > 0 && queueStatus === "open";

  if (queueStatus === "closed") {
    return (
      <Card className="border-gray-200 dark:border-slate-700 dark:bg-slate-800">
        <CardContent className="p-4 text-center text-sm text-gray-500 dark:text-slate-400">
          {t("queue.queueClosed")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20">
      <CardContent className="p-4 space-y-3">
        {/* Connection indicator */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-300">{t("queue.liveQueue")}</p>
          <span className="flex items-center gap-1 text-xs dark:text-slate-300">
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? "bg-green-500 animate-pulse" : "bg-gray-400"
              }`}
            />
            {connected ? t("queue.connected") : t("queue.reconnecting")}
          </span>
        </div>

        {/* Alert when almost time */}
        {isAlmostTime && (
          <div className="rounded-lg bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 p-3 text-center animate-pulse">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
              {t("queue.almostTime")}
            </p>
          </div>
        )}

        {/* Queue info */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400">{t("queue.currentSerial")}</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">#{currentSerial}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400">{t("queue.yourNumber")}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">#{patientSerial}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400">{t("queue.aheadOfYou")}</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {ahead > 0 ? `${ahead} ${t("queue.people")}` : t("queue.now")}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 mb-1">
            <span>{t("queue.progress")}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
"use client";

import { useState, useEffect } from "react";
import { connectSocket, disconnectSocket, SOCKET_EVENTS } from "@/lib/socket";
import { Card, CardContent } from "@/components/ui/card";
import type { Socket } from "socket.io-client";

interface LiveQueueWidgetProps {
  doctorId: string;
  patientSerial: number;
}

interface QueueUpdate {
  doctorId: string;
  currentSerial: number;
  status: string;
  totalBooked?: number;
}

export function LiveQueueWidget({ doctorId, patientSerial }: LiveQueueWidgetProps) {
  const [currentSerial, setCurrentSerial] = useState(0);
  const [queueStatus, setQueueStatus] = useState<string>("open");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let socket: Socket;
    try {
      socket = connectSocket();
      setConnected(true);

      // Listen for queue updates
      const handleQueueUpdate = (data: QueueUpdate) => {
        if (data.doctorId === doctorId) {
          setCurrentSerial(data.currentSerial);
          setQueueStatus(data.status);
        }
      };

      socket.on(SOCKET_EVENTS.QUEUE_UPDATED, handleQueueUpdate);

      // Auto-reconnect on disconnect
      socket.on("connect", () => setConnected(true));
      socket.on("disconnect", () => setConnected(false));

      // Fetch initial queue state
      const today = new Date().toISOString().split("T")[0];
      fetch(`/api/queue?doctorId=${doctorId}&date=${today}`)
        .then((r) => r.json())
        .then((res) => {
          if (res.success && res.data.length > 0) {
            setCurrentSerial(res.data[0].currentSerial);
            setQueueStatus(res.data[0].status);
          }
        })
        .catch(() => {});
    } catch {
      // Socket not available
    }

    return () => {
      try {
        disconnectSocket();
      } catch {
        // ignore
      }
    };
  }, [doctorId]);

  const ahead = Math.max(0, patientSerial - currentSerial);
  const progress =
    patientSerial > 0
      ? Math.min(100, Math.round((currentSerial / patientSerial) * 100))
      : 0;
  const isAlmostTime = ahead <= 2 && ahead > 0 && queueStatus === "open";

  if (queueStatus === "closed") {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-4 text-center text-sm text-gray-500">
          Queue closed for today
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardContent className="p-4 space-y-3">
        {/* Connection indicator */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-blue-700">Live Queue</p>
          <span className="flex items-center gap-1 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? "bg-green-500 animate-pulse" : "bg-gray-400"
              }`}
            />
            {connected ? "Connected" : "Reconnecting..."}
          </span>
        </div>

        {/* Alert when almost time */}
        {isAlmostTime && (
          <div className="rounded-lg bg-amber-100 border border-amber-300 p-3 text-center animate-pulse">
            <p className="text-sm font-bold text-amber-800">
              আপনার পালা আসছে! 🔔
            </p>
          </div>
        )}

        {/* Queue info */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-gray-500">এখন চলছে</p>
            <p className="text-2xl font-bold text-blue-600">#{currentSerial}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">আপনার নম্বর</p>
            <p className="text-2xl font-bold text-gray-900">#{patientSerial}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">আপনার আগে</p>
            <p className="text-2xl font-bold text-orange-600">
              {ahead > 0 ? `${ahead} জন` : "এখনই!"}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
