"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/lib/i18n";
import { connectSocket, disconnectSocket, SOCKET_EVENTS } from "@/lib/socket";
import type { INotification } from "@/types";

export function NotificationBell() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const t = useT();

  useEffect(() => {
    if (!session?.user) return;

    const socket = connectSocket();

    const handleNewNotification = () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };

    socket.on(SOCKET_EVENTS.NOTIFICATION, handleNewNotification);
    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off(SOCKET_EVENTS.NOTIFICATION, handleNewNotification);
      socket.off("notification:new", handleNewNotification);
      disconnectSocket();
    };
  }, [session, queryClient]);

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as {
        notifications: INotification[];
        unreadCount: number;
      };
    },
    enabled: !!session?.user,
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  if (!session?.user) return null;

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full p-0 text-[10px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 dark:bg-slate-800 dark:border-slate-700" align="end">
        <div className="flex items-center justify-between border-b dark:border-slate-700 px-4 py-3">
          <h4 className="font-semibold text-sm dark:text-white">{t("notification.title")}</h4>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs dark:bg-slate-700 dark:text-slate-300">
              {unreadCount} {t("notification.new")}
            </Badge>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground dark:text-slate-400">
              {t("notification.none")}
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                className={`flex items-start gap-3 border-b dark:border-slate-700 px-4 py-3 last:border-0 hover:bg-muted/50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${
                  !n.isRead ? "bg-blue-50/50 dark:bg-blue-950/30" : ""
                }`}
                onClick={() => {
                  if (!n.isRead && n._id) {
                    markReadMutation.mutate(n._id);
                  }
                  if (n.link) {
                    setOpen(false);
                    window.location.href = n.link;
                  }
                }}
              >
                <div
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    n.type === "alert"
                      ? "bg-red-500"
                      : n.type === "warning"
                        ? "bg-yellow-500"
                        : n.type === "success"
                          ? "bg-green-500"
                          : "bg-blue-500"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight dark:text-white">{n.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground dark:text-slate-400 line-clamp-2">
                    {n.message}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground dark:text-slate-500">
                    {n.createdAt
                      ? new Date(n.createdAt).toLocaleString("bn-BD", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "numeric",
                          month: "short",
                        })
                      : ""}
                  </p>
                </div>
                {!n.isRead && (
                  <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground dark:text-slate-400" />
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
