import React, { useState } from "react";
import { useSecretAdmin } from "@/hooks/useSecretAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  Settings,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  User,
  AlertCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface SecretAdminAccessProps {
  children?: React.ReactNode;
  className?: string;
}

export function SecretAdminAccess({ children, className }: SecretAdminAccessProps) {
  const { isSecretAdmin, isLoading } = useSecretAdmin();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState("");

  // If already admin, show direct access
  if (isSecretAdmin) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setLocation("/admin")}
        className={`group relative overflow-hidden bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-700 hover:from-red-600 hover:to-rose-600 hover:text-white hover:border-transparent transition-all duration-300 shadow-sm hover:shadow-md ${className}`}
      >
        <Settings className="w-4 h-4 mr-1.5 group-hover:rotate-90 transition-transform duration-500" />
        Admin Panel
      </Button>
    );
  }

  // If loading, don't show anything
  if (isLoading) {
    return null;
  }

  const handleAdminLogin = async () => {
    if (!adminUsername || !adminPassword) {
      setError("Please enter both username and password");
      return;
    }

    setIsLoggingIn(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: adminUsername,
          password: adminPassword,
        }),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        setAdminUsername("");
        setAdminPassword("");
        // Invalidate the cached admin session so useSecretAdmin re-fetches
        // without triggering a full page reload
        await queryClient.invalidateQueries({ queryKey: ["/api/admin/user"] });
        setLocation("/admin");
      } else {
        const data = await response.json();
        setError(data.message || "Invalid credentials");
      }
    } catch (error) {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setAdminUsername("");
    setAdminPassword("");
    setError("");
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) handleClose(); else setIsDialogOpen(true); }}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="ghost"
            size="sm"
            className={`text-gray-300 hover:text-gray-500 opacity-40 hover:opacity-100 transition-all duration-300 hover:bg-gray-100 rounded-full ${className}`}
          >
            <Lock className="w-3.5 h-3.5" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="p-0 gap-0 max-w-[92vw] sm:max-w-md rounded-2xl overflow-hidden border-0 shadow-2xl">
        {/* ── Gradient header banner ── */}
        <div className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-red-950 px-6 pt-8 pb-6 text-white overflow-hidden">
          {/* decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-slate-500/10 rounded-full blur-2xl pointer-events-none" />

          <DialogHeader className="relative z-10 space-y-3">
            {/* icon badge */}
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm mx-auto shadow-lg">
              <ShieldCheck className="w-7 h-7 text-red-400" />
            </div>
            <div className="text-center space-y-1">
              <DialogTitle className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Admin Access
              </DialogTitle>
              <p className="text-slate-400 text-sm">
                Authorised personnel only
              </p>
            </div>
          </DialogHeader>
        </div>

        {/* ── Form body ── */}
        <div className="px-6 py-6 bg-white space-y-5">
          {/* Username */}
          <div className="space-y-1.5">
            <Label htmlFor="admin-username" className="text-sm font-semibold text-slate-700">
              Username
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                id="admin-username"
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="Enter admin username"
                disabled={isLoggingIn}
                className="pl-9 h-11 border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 rounded-xl transition-all duration-200 text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="admin-password" className="text-sm font-semibold text-slate-700">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
                disabled={isLoggingIn}
                className="pl-9 pr-10 h-11 border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 rounded-xl transition-all duration-200 text-slate-800 placeholder:text-slate-400"
                onKeyDown={(e) => { if (e.key === "Enter") handleAdminLogin(); }}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-150 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoggingIn}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 text-sm px-3.5 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoggingIn}
              className="flex-none border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl h-11 px-4 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdminLogin}
              disabled={isLoggingIn || !adminUsername || !adminPassword}
              className="flex-1 group relative overflow-hidden bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold h-11 rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoggingIn ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Access Admin
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                </span>
              )}
            </Button>
          </div>

          {/* Security note */}
          <p className="text-center text-xs text-slate-400 pt-1">
            🔒 All access attempts are logged &amp; monitored
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}