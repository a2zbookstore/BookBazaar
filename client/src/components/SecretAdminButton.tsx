import React from "react";
import { useSecretAdmin } from "@/hooks/useSecretAdmin";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Settings, BarChart3 } from "lucide-react";

interface SecretAdminButtonProps {
  className?: string;
}

export function SecretAdminButton({ className }: SecretAdminButtonProps) {
  const { isSecretAdmin, isLoading } = useSecretAdmin();

  // Don't show anything if loading or not admin
  if (isLoading || !isSecretAdmin) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <Link href="/admin">
        <Button
          variant="outline"
          size="sm"
          className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 shadow-lg"
          title="Admin Panel (Secret Access)"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Admin
        </Button>
      </Link>
    </div>
  );
}

export function SecretAdminNav() {
  // Completely hidden - no admin button in navigation
  return null;
}