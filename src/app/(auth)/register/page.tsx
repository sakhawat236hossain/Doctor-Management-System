"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Activity, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteSettings } from "@/components/shared/SiteSettings";

export default function RegisterPage() {
  const router = useRouter();
  const t = useT();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const registerSchema = z
    .object({
      name: z.string().min(2, t("auth.nameMinLength")),
      email: z.string().email(t("auth.invalidEmail")),
      phone: z.string().min(10, t("auth.phoneMinLength")),
      password: z.string().min(6, t("auth.passwordMinLength")),
      confirmPassword: z.string().min(6, t("auth.passwordMinLength")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("auth.passwordMismatch"),
      path: ["confirmPassword"],
    });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = registerSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        const key = err.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      toast.error(parsed.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || t("auth.registrationFailed"));
        return;
      }

      toast.success(t("auth.registrationSuccess"));
      router.push("/login");
    } catch {
      toast.error(t("auth.registrationError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8 dark:bg-slate-900">
      <div className="absolute top-4 right-4">
        <SiteSettings />
      </div>
      <Card className="w-full max-w-md dark:bg-slate-800 dark:border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">MediFlow</span>
          </div>
          <CardTitle className="dark:text-white">{t("auth.createAccount")}</CardTitle>
          <CardDescription className="dark:text-slate-400">{t("auth.registerAsPatient")}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="dark:text-slate-200">{t("auth.fullName")}</Label>
              <Input
                id="name"
                placeholder={t("auth.fullNamePlaceholder")}
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                disabled={isLoading}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="dark:text-slate-200">{t("auth.emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("auth.emailPlaceholder")}
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                disabled={isLoading}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="dark:text-slate-200">{t("auth.phoneLabel")}</Label>
              <Input
                id="phone"
                type="tel"
                placeholder={t("auth.phonePlaceholder")}
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                disabled={isLoading}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="dark:text-slate-200">{t("auth.passwordLabel")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("auth.passwordPlaceholder")}
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                disabled={isLoading}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="dark:text-slate-200">{t("auth.confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t("auth.confirmPasswordPlaceholder")}
                value={formData.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                disabled={isLoading}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("auth.creatingAccount")}
                </>
              ) : (
                t("auth.createAccount")
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground dark:text-slate-400">
              {t("auth.alreadyHaveAccount")}{" "}
              <Link href="/login" className="text-primary hover:underline">
                {t("auth.signIn")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
