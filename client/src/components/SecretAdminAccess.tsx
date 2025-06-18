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
import { Settings, Lock, Eye, EyeOff } from "lucide-react";

interface SecretAdminAccessProps {
  children?: React.ReactNode;
  className?: string;
}

export function SecretAdminAccess({ children, className }: SecretAdminAccessProps) {
  const { isSecretAdmin, isLoading } = useSecretAdmin();
  const [, setLocation] = useLocation();
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
        onClick={() => setLocation('/admin')}
        className={`bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 ${className}`}
      >
        <Settings className="w-4 h-4 mr-1" />
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
        setLocation('/admin');
        window.location.reload(); // Refresh to update admin state
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

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="ghost"
            size="sm"
            className={`text-gray-400 hover:text-gray-600 opacity-50 hover:opacity-100 ${className}`}
          >
            <Lock className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-red-600" />
            Admin Access
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-username">Username</Label>
            <Input
              id="admin-username"
              type="text"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              placeholder="Enter admin username"
              disabled={isLoggingIn}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <div className="relative">
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
                disabled={isLoggingIn}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAdminLogin();
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoggingIn}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleAdminLogin}
              disabled={isLoggingIn || !adminUsername || !adminPassword}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {isLoggingIn ? "Logging in..." : "Access Admin"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setAdminUsername("");
                setAdminPassword("");
                setError("");
              }}
              disabled={isLoggingIn}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}