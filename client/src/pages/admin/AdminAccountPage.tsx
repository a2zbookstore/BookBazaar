import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/useAdminAuth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, User, Lock, Mail, AtSign, Loader2, ShieldCheck, KeyRound } from "lucide-react";

export default function AdminAccountPage() {
  const { admin: adminRaw } = useAdminAuth();
  const admin = adminRaw as { username?: string; name?: string; email?: string } | undefined;
  const { toast } = useToast();
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      return await apiRequest("POST", "/api/admin/change-password", data);
    },
    onSuccess: () => {
      toast({ title: "Password Updated", description: "Your password has been changed successfully." });
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (error: any) => {
      toast({ title: "Password Change Failed", description: error.message || "Failed to update password", variant: "destructive" });
    },
  });

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast({ title: "Password Mismatch", description: "New password and confirmation don't match", variant: "destructive" });
      return;
    }
    if (formData.newPassword.length < 6) {
      toast({ title: "Password Too Short", description: "New password must be at least 6 characters long", variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate({ currentPassword: formData.currentPassword, newPassword: formData.newPassword });
  };

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-indigo-600/20" />
        <div className="relative flex items-center gap-4">
        
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Account</h1>
            <p className="mt-0.5 text-sm text-slate-300">Manage your account details and security settings</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Account Information */}
        <Card className="border-0 shadow-md bg-white">
          <CardHeader className="pb-4 border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-700">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100">
                <ShieldCheck className="h-4 w-4 text-violet-600" />
              </div>
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Username</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input value={admin?.username || ""} disabled className="pl-9 bg-slate-50 border-slate-200 text-slate-600" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input value={admin?.name || ""} disabled className="pl-9 bg-slate-50 border-slate-200 text-slate-600" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input value={admin?.email || ""} disabled className="pl-9 bg-slate-50 border-slate-200 text-slate-600" />
              </div>
            </div>
            <p className="text-xs text-slate-400 pt-1">
              Contact your system administrator to change username or email.
            </p>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="border-0 shadow-md bg-white">
          <CardHeader className="pb-4 border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-700">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100">
                <KeyRound className="h-4 w-4 text-amber-600" />
              </div>
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {(["current", "new", "confirm"] as const).map((field) => {
                const labels = { current: "Current Password", new: "New Password", confirm: "Confirm New Password" };
                const ids = { current: "currentPassword", new: "newPassword", confirm: "confirmPassword" };
                const keys = { current: "currentPassword", new: "newPassword", confirm: "confirmPassword" } as const;
                return (
                  <div key={field} className="space-y-1.5">
                    <Label htmlFor={ids[field]} className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      {labels[field]}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id={ids[field]}
                        type={showPasswords[field] ? "text" : "password"}
                        value={formData[keys[field]]}
                        onChange={(e) => setFormData(prev => ({ ...prev, [keys[field]]: e.target.value }))}
                        required
                        minLength={field !== "current" ? 6 : undefined}
                        className="pl-9 pr-10 border-slate-200 focus:border-violet-400 focus:ring-violet-400/20"
                        placeholder={`Enter ${labels[field].toLowerCase()}`}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        onClick={() => togglePasswordVisibility(field)}
                      >
                        {showPasswords[field] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="rounded-full w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md transition-all duration-200 disabled:opacity-60"
                >
                  {changePasswordMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating Password…</>
                  ) : (
                    <><KeyRound className="mr-2 h-4 w-4" /> Change Password</>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}