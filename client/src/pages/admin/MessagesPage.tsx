import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, CheckCircle, Reply, Trash2, Clock, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ContactMessage {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

export default function MessagesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contactMessages = [], isLoading } = useQuery<ContactMessage[]>({
    queryKey: ["/api/contact"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PUT", `/api/contact/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact"] });
      toast({
        title: "Status updated",
        description: "Message status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "unread":
        return "bg-red-100 text-red-800 border-red-200";
      case "read":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "replied":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const unreadCount = contactMessages.filter(m => m.status === 'unread').length;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-aqua"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-base-black">Customer Messages</h1>
            <p className="text-secondary-black mt-2">
              Manage customer inquiries and support requests
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm">
              {unreadCount} unread messages
            </Badge>
          </div>
        </div>

        {/* Messages List */}
        {contactMessages.length > 0 ? (
          <div className="space-y-4">
            {contactMessages.map((message) => (
              <Card key={message.id} className={`${message.status === 'unread' ? 'border-l-4 border-l-red-500' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-aqua/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary-aqua" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {message.firstName} {message.lastName}
                        </CardTitle>
                        <p className="text-sm text-secondary-black">{message.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(message.status)}>
                        {message.status}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-tertiary-black">
                        <Clock className="h-3 w-3" />
                        {formatDate(message.createdAt)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-base-black mb-2">
                      Subject: {message.subject}
                    </h3>
                    <p className="text-secondary-black leading-relaxed whitespace-pre-wrap">
                      {message.message}
                    </p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    {message.status === 'unread' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({ id: message.id, status: 'read' })}
                        disabled={updateStatusMutation.isPending}
                        className="flex items-center gap-1"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Mark as Read
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      onClick={() => {
                        const subject = `Re: ${message.subject}`;
                        const body = `Dear ${message.firstName},\n\nThank you for contacting A2Z BOOKSHOP.\n\n\n\nBest regards,\nA2Z BOOKSHOP Team`;
                        window.open(`mailto:${message.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                        if (message.status !== 'replied') {
                          updateStatusMutation.mutate({ id: message.id, status: 'replied' });
                        }
                      }}
                      className="flex items-center gap-1 bg-primary-aqua hover:bg-secondary-aqua"
                    >
                      <Reply className="h-4 w-4" />
                      Reply via Email
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-base-black mb-2">No messages yet</h3>
              <p className="text-secondary-black">
                Customer messages will appear here when they contact you through the contact form.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}