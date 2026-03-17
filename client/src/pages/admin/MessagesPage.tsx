import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Mail, CheckCircle, Reply, Clock, User, MessageSquare,
  Inbox, MailOpen, MailCheck, Search, Filter, AtSign, CalendarDays, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type FilterStatus = "all" | "unread" | "read" | "replied";

export default function MessagesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: contactMessages = [], isLoading } = useQuery<ContactMessage[]>({
    queryKey: ["/api/contact"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PUT", `/api/contact/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact"] });
      toast({ title: "Status updated", description: "Message status updated successfully." });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const unreadCount  = contactMessages.filter(m => m.status === "unread").length;
  const readCount    = contactMessages.filter(m => m.status === "read").length;
  const repliedCount = contactMessages.filter(m => m.status === "replied").length;

  const filtered = contactMessages.filter(m => {
    const matchesFilter = filter === "all" || m.status === filter;
    const q = search.toLowerCase();
    const matchesSearch = !q || [m.firstName, m.lastName, m.email, m.subject, m.message]
      .some(v => v?.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  const statusMeta: Record<string, { label: string; dot: string; bg: string; text: string }> = {
    unread:  { label: "Unread",  dot: "bg-red-500",    bg: "bg-red-50",    text: "text-red-700"    },
    read:    { label: "Read",    dot: "bg-sky-500",    bg: "bg-sky-50",    text: "text-sky-700"    },
    replied: { label: "Replied", dot: "bg-emerald-500",bg: "bg-emerald-50",text: "text-emerald-700"},
  };

  const initials = (m: ContactMessage) =>
    `${m.firstName?.[0] ?? ""}${m.lastName?.[0] ?? ""}`.toUpperCase();

  const avatarColor = (id: number) => {
    const colors = [
      "bg-violet-100 text-violet-600",
      "bg-sky-100 text-sky-600",
      "bg-emerald-100 text-emerald-600",
      "bg-amber-100 text-amber-600",
      "bg-rose-100 text-rose-600",
      "bg-indigo-100 text-indigo-600",
    ];
    return colors[id % colors.length];
  };

  return (
    <div className="space-y-6 sm:space-y-8">

      {/* ── Page Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-50 via-white to-indigo-50 border border-sky-100 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-sky-100/50 to-transparent rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Customer Messages</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage customer inquiries and support requests</p>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative mt-5 flex flex-wrap gap-3">
          {[
            { label: "Total",    value: contactMessages.length, color: "bg-indigo-100 text-indigo-700", Icon: Inbox },
            { label: "Unread",   value: unreadCount,            color: "bg-red-100 text-red-700",    Icon: Mail      },
            { label: "Read",     value: readCount,              color: "bg-sky-100 text-sky-700",    Icon: MailOpen  },
            { label: "Replied",  value: repliedCount,           color: "bg-emerald-100 text-emerald-700", Icon: MailCheck },
          ].map(({ label, value, color, Icon }) => (
            <span key={label} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
              <Icon className="w-3.5 h-3.5" />
              {label} <span className="font-bold">{value}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Filter + Search bar ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, subject…"
            className="pl-9 rounded-xl border-gray-200 focus-visible:ring-sky-400 h-10 text-sm"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex gap-1.5 p-1 rounded-xl bg-gray-100/80 flex-shrink-0">
          {(["all", "unread", "read", "replied"] as FilterStatus[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
                ${filter === f ? "bg-white shadow-sm text-sky-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== "all" && (
                <span className="ml-1.5 font-bold">
                  {f === "unread" ? unreadCount : f === "read" ? readCount : repliedCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 animate-pulse flex gap-4">
              <div className="w-11 h-11 rounded-full bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-2.5">
                <div className="h-4 w-1/3 rounded bg-gray-100" />
                <div className="h-3 w-1/2 rounded bg-gray-100" />
                <div className="h-3 w-full rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-16 px-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center mb-4">
            <Mail className="w-7 h-7 text-sky-300" />
          </div>
          <h3 className="text-sm font-semibold text-gray-800 mb-1">
            {search || filter !== "all" ? "No messages match your filters" : "No messages yet"}
          </h3>
          <p className="text-xs text-gray-400 max-w-xs">
            {search || filter !== "all"
              ? "Try adjusting your search or filter."
              : "Customer messages will appear here when they contact you through the contact form."}
          </p>
          {(search || filter !== "all") && (
            <button onClick={() => { setSearch(""); setFilter("all"); }}
              className="mt-4 text-xs text-sky-600 hover:text-sky-700 font-medium underline underline-offset-2">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((message) => {
            const meta = statusMeta[message.status] ?? statusMeta.read;
            const isExpanded = expandedId === message.id;
            const isUnread = message.status === "unread";

            return (
              <div
                key={message.id}
                className={`group rounded-2xl border bg-white transition-all duration-200
                  ${isUnread
                    ? "border-red-200 shadow-sm shadow-red-50 ring-1 ring-red-100"
                    : "border-gray-100 shadow-sm hover:shadow-md"
                  }`}
              >
                {/* ── Row header (always visible) ── */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : message.id)}
                  className="w-full text-left px-5 py-4 flex items-start gap-4"
                >
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ${avatarColor(message.id)}`}>
                    {initials(message)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-semibold text-gray-900 text-sm ${isUnread ? "font-bold" : ""}`}>
                        {message.firstName} {message.lastName}
                      </span>
                      {/* Status pill */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${meta.bg} ${meta.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </div>
                    <p className={`text-xs text-gray-500 flex items-center gap-1 mt-0.5 ${isUnread ? "font-medium text-gray-600" : ""}`}>
                      <AtSign className="w-3 h-3 flex-shrink-0" />{message.email}
                    </p>
                    <p className={`text-sm mt-1 truncate ${isUnread ? "text-gray-800 font-medium" : "text-gray-600"}`}>
                      {message.subject}
                    </p>
                  </div>

                  {/* Date + expand chevron */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-2 ml-2">
                    <span className="flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap">
                      <CalendarDays className="w-3 h-3" />{formatDate(message.createdAt)}
                    </span>
                    <span className="text-gray-300 group-hover:text-gray-400 transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </div>
                </button>

                {/* ── Expanded body ── */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-100">
                    <div className="pt-4 space-y-4">
                      {/* Subject line */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Subject</span>
                        <span className="text-sm font-medium text-gray-800">{message.subject}</span>
                      </div>

                      {/* Message body */}
                      <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {message.message}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {message.status === "unread" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({ id: message.id, status: "read" })}
                            disabled={updateStatusMutation.isPending}
                            className="rounded-xl border-gray-200 text-gray-600 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 h-8 text-xs px-3"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                            Mark as Read
                          </Button>
                        )}
                        {message.status === "read" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({ id: message.id, status: "unread" })}
                            disabled={updateStatusMutation.isPending}
                            className="rounded-xl border-gray-200 text-gray-500 hover:bg-gray-100 h-8 text-xs px-3"
                          >
                            <Mail className="w-3.5 h-3.5 mr-1.5" />
                            Mark Unread
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => {
                            const subj = `Re: ${message.subject}`;
                            const body = `Dear ${message.firstName},\n\nThank you for contacting A2Z BOOKSHOP.\n\n\n\nBest regards,\nA2Z BOOKSHOP Team`;
                            window.open(`mailto:${message.email}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`);
                            if (message.status !== "replied") {
                              updateStatusMutation.mutate({ id: message.id, status: "replied" });
                            }
                          }}
                          className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white shadow-sm h-8 text-xs px-3"
                        >
                          <Reply className="w-3.5 h-3.5 mr-1.5" />
                          Reply via Email
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}