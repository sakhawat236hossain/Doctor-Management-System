"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, MoreHorizontal, ChevronLeft, ChevronRight, Loader2, Trash2, ShieldOff, Shield } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { Loading } from "@/components/shared/Loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserDetailDialog } from "@/components/admin/UserDetailDialog";
import { EditUserDialog } from "@/components/admin/EditUserDialog";
import { ChangeRoleDialog } from "@/components/admin/ChangeRoleDialog";
import { DeleteUserDialog } from "@/components/admin/DeleteUserDialog";

interface UserRow {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  profileImage: string;
  authProviders: string[];
  createdAt: string;
  doctorInfo: { speciality: string; status: string } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ROLE_COLORS: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  admin: "destructive",
  doctor: "success",
  receptionist: "warning",
  patient: "default",
};

export default function AdminUsersPage() {
  const t = useT();
  const queryClient = useQueryClient();

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Dialogs
  const [detailUser, setDetailUser] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [roleUser, setRoleUser] = useState<UserRow | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter, statusFilter, providerFilter, sortBy]);

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: "20",
    sort: sortBy,
  });
  if (debouncedSearch) queryParams.set("search", debouncedSearch);
  if (roleFilter) queryParams.set("role", roleFilter);
  if (statusFilter) queryParams.set("status", statusFilter);
  if (providerFilter) queryParams.set("provider", providerFilter);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, debouncedSearch, roleFilter, statusFilter, providerFilter, sortBy],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users?${queryParams}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as { users: UserRow[]; pagination: Pagination };
    },
  });

  const users = data?.users || [];
  const pagination = data?.pagination;

  // Mutations
  const toggleStatusMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}/status`, { method: "PATCH" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      toast.success(t("users.statusToggled"));
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const bulkDeactivateMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      await Promise.all(
        userIds.map((id) =>
          fetch(`/api/admin/users/${id}/status`, { method: "PATCH" }).then((r) => r.json())
        )
      );
    },
    onSuccess: () => {
      toast.success(t("users.statusToggled"));
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === users.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(users.map((u) => u._id)));
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold dark:text-white">{t("users.title")}</h1>
        <p className="text-muted-foreground dark:text-slate-400">{t("users.description")}</p>
      </div>

      {/* Controls */}
      <Card className="p-4 dark:bg-slate-800 dark:border-slate-700">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("users.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px] dark:bg-slate-700 dark:border-slate-600">
              <SelectValue placeholder={t("users.allRoles")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("users.allRoles")}</SelectItem>
              <SelectItem value="admin">{t("roles.admin")}</SelectItem>
              <SelectItem value="doctor">{t("roles.doctor")}</SelectItem>
              <SelectItem value="receptionist">{t("roles.receptionist")}</SelectItem>
              <SelectItem value="patient">{t("roles.patient")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] dark:bg-slate-700 dark:border-slate-600">
              <SelectValue placeholder={t("users.allStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("users.allStatus")}</SelectItem>
              <SelectItem value="active">{t("common.active")}</SelectItem>
              <SelectItem value="inactive">{t("common.inactive")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={providerFilter} onValueChange={setProviderFilter}>
            <SelectTrigger className="w-[160px] dark:bg-slate-700 dark:border-slate-600">
              <SelectValue placeholder={t("users.allProviders")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("users.allProviders")}</SelectItem>
              <SelectItem value="credentials">Email</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] dark:bg-slate-700 dark:border-slate-600">
              <SelectValue placeholder={t("users.sortBy")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("users.newest")}</SelectItem>
              <SelectItem value="oldest">{t("users.oldest")}</SelectItem>
              <SelectItem value="name">{t("users.nameAZ")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-md bg-muted p-2 dark:bg-slate-700">
            <span className="text-sm dark:text-slate-300">
              {selected.size} {t("users.selected")}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkDeactivateMutation.mutate(Array.from(selected))}
              disabled={bulkDeactivateMutation.isPending}
            >
              {t("users.bulkDeactivate")}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (confirm(`${t("users.bulkDelete")}?`)) {
                  // Bulk delete would need individual calls
                  toast.error("Use individual delete for safety");
                }
              }}
            >
              {t("users.bulkDelete")}
            </Button>
          </div>
        )}
      </Card>

      {/* Table */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="dark:border-slate-700">
              <TableHead className="w-[40px] dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={selected.size === users.length && users.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </TableHead>
              <TableHead className="dark:text-slate-300">{t("common.name")}</TableHead>
              <TableHead className="dark:text-slate-300">{t("common.email")}</TableHead>
              <TableHead className="hidden md:table-cell dark:text-slate-300">{t("common.phone")}</TableHead>
              <TableHead className="dark:text-slate-300">Role</TableHead>
              <TableHead className="hidden lg:table-cell dark:text-slate-300">{t("users.loginMethod")}</TableHead>
              <TableHead className="dark:text-slate-300">{t("common.status")}</TableHead>
              <TableHead className="hidden lg:table-cell dark:text-slate-300">{t("users.joinDate")}</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 dark:text-slate-400">
                  {t("users.noUsersFound")}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id} className="dark:border-slate-700">
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.has(user._id)}
                      onChange={() => toggleSelect(user._id)}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {user.profileImage && <AvatarImage src={user.profileImage} />}
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm dark:text-white">{user.name}</p>
                        {user.doctorInfo && (
                          <p className="text-xs text-muted-foreground dark:text-slate-400">{user.doctorInfo.speciality}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm dark:text-slate-300">{user.email}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm dark:text-slate-300">{user.phone || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={ROLE_COLORS[user.role] || "secondary"}>
                      {t(`roles.${user.role}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {user.authProviders.map((p) => (
                        <Badge key={p} variant="outline" className="text-[10px] px-1.5 dark:border-slate-600 dark:text-slate-300">
                          {p === "credentials" ? "Email" : p === "google" ? "Google" : "Facebook"}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "success" : "destructive"}>
                      {user.isActive ? t("common.active") : t("common.inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm dark:text-slate-300">
                    {new Date(user.createdAt).toLocaleDateString("bn-BD")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setDetailUser(user._id)}>
                          {t("users.viewDetails")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditUser(user)}>
                          {t("users.editUser")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRoleUser(user)}>
                          {t("users.changeRole")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => toggleStatusMutation.mutate(user._id)}>
                          {user.isActive ? (
                            <>
                              <ShieldOff className="mr-2 h-4 w-4" />
                              {t("users.deactivate")}
                            </>
                          ) : (
                            <>
                              <Shield className="mr-2 h-4 w-4" />
                              {t("users.activate")}
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteUser(user)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("users.deleteUser")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t p-4 dark:border-slate-700">
            <p className="text-sm text-muted-foreground dark:text-slate-400">
              {t("users.page")} {pagination.page} {t("users.of")} {pagination.totalPages} ({pagination.total})
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" /> {t("users.previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("users.next")} <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Dialogs */}
      {detailUser && (
        <UserDetailDialog userId={detailUser} onClose={() => setDetailUser(null)} />
      )}
      {editUser && (
        <EditUserDialog user={editUser} onClose={() => setEditUser(null)} />
      )}
      {roleUser && (
        <ChangeRoleDialog user={roleUser} onClose={() => setRoleUser(null)} />
      )}
      {deleteUser && (
        <DeleteUserDialog user={deleteUser} onClose={() => setDeleteUser(null)} />
      )}
    </div>
  );
}
