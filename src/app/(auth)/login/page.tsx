"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Activity, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteSettings } from "@/components/shared/SiteSettings";

const roleHomePaths: Record<string, string> = {
  admin: "/admin",
  doctor: "/doctor",
  receptionist: "/receptionist",
  patient: "/patient",
};

export default function LoginPage() {
  const router = useRouter();
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(t("auth.invalidCredentials"));
        return;
      }

      toast.success(t("auth.welcomeBack"));

      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const role = session?.user?.role as string | undefined;
      const redirectPath = role ? (roleHomePaths[role] || "/") : "/";

      router.push(redirectPath);
      router.refresh();
    } catch {
      toast.error(t("auth.signInError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 dark:bg-slate-900">
      {/* Top-right settings */}
      <div className="absolute top-4 right-4">
        <SiteSettings />
      </div>
      <Card className="w-full max-w-md dark:bg-slate-800 dark:border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">MediFlow</span>
          </div>
          <CardTitle className="dark:text-white">{t("auth.welcomeBack")}</CardTitle>
          <CardDescription className="dark:text-slate-400">{t("auth.signInToContinue")}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="dark:text-slate-200">{t("auth.emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("auth.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="dark:text-slate-200">{t("auth.passwordLabel")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("auth.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("auth.signingIn")}
                </>
              ) : (
                t("auth.signIn")
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground dark:text-slate-400">
              {t("auth.noAccount")}{" "}
              <Link href="/register" className="text-primary hover:underline">
                {t("auth.registerAsPatient")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
