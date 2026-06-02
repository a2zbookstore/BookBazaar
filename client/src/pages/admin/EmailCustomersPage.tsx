import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Mail, Send, Users, Search, CheckSquare, Square, AlertCircle,
  CheckCircle2, Loader2, RefreshCw, X,
} from "lucide-react";

interface Customer {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  totalOrders: number;
}

function buildPreviewHtml(subject: string, content: string): string {
  const year = new Date().getFullYear();
  // Convert plain-text newlines to <p> tags if the content doesn't look like HTML
  const bodyHtml = content.includes("<") ? content
    : content.split(/\n\n+/).map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif; }
    .email-wrapper { width: 100%; background: #f1f5f9; padding: 24px 12px; }
    .email-card { width: 100%; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.10); }
    .email-header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f766e 100%); padding: 40px 32px 32px; text-align: center; }
    .email-header .brand { margin: 0 0 8px; font-size: 11px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; color: #94a3b8; }
    .email-header h1 { margin: 0 0 8px; font-size: 24px; font-weight: 800; color: #ffffff; line-height: 1.3; }
    .email-header .tagline { margin: 0; font-size: 14px; color: #cbd5e1; }
    .gradient-bar { height: 4px; background: linear-gradient(90deg, #0f766e, #0891b2, #6366f1); }
    .email-body { padding: 32px; }
    .email-body p { margin: 0 0 14px; font-size: 15px; color: #475569; line-height: 1.75; }
    .email-body a { color: #0891b2; }
    .email-body strong, .email-body b { color: #0f172a; }
    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
    .footer-note { font-size: 12px; color: #94a3b8; text-align: center; }
    .footer-note a { color: #60a5fa; }
    .bottom-bar { background: #1e293b; padding: 20px 32px; text-align: center; }
    .bottom-bar .brand-name { margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #e2e8f0; letter-spacing: 1px; }
    .bottom-bar .copy { margin: 0; font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-card">
      <div class="email-header">
        <p class="brand">A2Z BOOKSHOP</p>
        <h1>${subject || "(No subject)"}</h1>
        <p class="tagline">A message from the A2Z BOOKSHOP team</p>
      </div>
      <div class="gradient-bar"></div>
      <div class="email-body">
        ${bodyHtml}
        <hr class="divider">
        <p class="footer-note">
          This email was sent by A2Z BOOKSHOP.<br>
          For help: <a href="mailto:support@a2zbookshop.com">support@a2zbookshop.com</a>
        </p>
      </div>
      <div class="bottom-bar">
        <p class="brand-name">A2Z BOOKSHOP</p>
        <p class="copy">&copy; ${year} A2Z BOOKSHOP. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export default function EmailCustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [sendResult, setSendResult] = useState<{
    sent: number; failed: number; total: number;
    results: { email: string; success: boolean }[];
  } | null>(null);

  // Fetch all customers (up to 500 at a time)
  const { data, isLoading, refetch } = useQuery<{ customers: Customer[]; total: number }>({
    queryKey: ["/api/admin/customers-all"],
    queryFn: async () => {
      const r = await fetch("/api/admin/customers?limit=500&offset=0");
      if (!r.ok) throw new Error("Failed to fetch customers");
      return r.json();
    },
    refetchOnWindowFocus: false,
  });

  const customers = data?.customers ?? [];

  const customersWithEmail = useMemo(
    () => customers.filter((c) => c.email),
    [customers],
  );

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return customersWithEmail;
    const q = searchQuery.toLowerCase();
    return customersWithEmail.filter(
      (c) =>
        c.email?.toLowerCase().includes(q) ||
        c.firstName?.toLowerCase().includes(q) ||
        c.lastName?.toLowerCase().includes(q),
    );
  }, [customersWithEmail, searchQuery]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((c) => next.delete(c.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((c) => next.add(c.id));
        return next;
      });
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedEmails = useMemo(() => {
    return customers
      .filter((c) => selectedIds.has(c.id) && c.email)
      .map((c) => c.email as string);
  }, [customers, selectedIds]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/admin/send-customer-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          messageContent,
          recipients: selectedEmails,
        }),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.message || "Send failed");
      }
      return r.json();
    },
    onSuccess: (data) => {
      setSendResult(data);
      setResultOpen(true);
    },
  });

  const canSend =
    subject.trim().length > 0 &&
    messageContent.trim().length > 0 &&
    selectedEmails.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="h-6 w-6 text-teal-600" />
            Email Customers
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Compose and send emails to individual customers or in bulk.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Customer selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Select Recipients
              {selectedIds.size > 0 && (
                <Badge className="ml-auto bg-teal-100 text-teal-800 border-teal-200">
                  {selectedIds.size} selected
                </Badge>
              )}
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-9"
                placeholder="Search by name or email…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading customers…</span>
              </div>
            ) : (
              <div className="overflow-auto max-h-[420px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allFilteredSelected}
                          onCheckedChange={toggleAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-gray-400">
                          No customers with email found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((c) => (
                        <TableRow
                          key={c.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => toggleOne(c.id)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedIds.has(c.id)}
                              onCheckedChange={() => toggleOne(c.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm text-gray-900">
                              {c.firstName || c.lastName
                                ? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim()
                                : "—"}
                            </div>
                            <div className="text-xs text-gray-500">{c.email}</div>
                          </TableCell>
                          <TableCell className="text-right text-sm text-gray-600">
                            {c.totalOrders}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Quick-select footer */}
            <div className="border-t px-4 py-2 flex items-center gap-3 text-xs text-gray-500 bg-gray-50">
              <button
                className="hover:text-teal-700 underline"
                onClick={() => {
                  const next = new Set<string>();
                  customersWithEmail.forEach((c) => next.add(c.id));
                  setSelectedIds(next);
                }}
              >
                Select all ({customersWithEmail.length})
              </button>
              <span>·</span>
              <button
                className="hover:text-teal-700 underline"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear
              </button>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT: Compose */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Compose Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="subject" className="text-sm font-medium">
                Subject
              </Label>
              <Input
                id="subject"
                className="mt-1"
                placeholder="e.g. Exclusive offer for you 🎉"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
              />
            </div>

            <div>
              <Label htmlFor="body" className="text-sm font-medium">
                Message
              </Label>
              <p className="text-xs text-gray-400 mt-0.5 mb-1">
                Write your message below. Basic formatting supported — use{" "}
                <code className="bg-gray-100 px-1 rounded">&lt;b&gt;</code>,{" "}
                <code className="bg-gray-100 px-1 rounded">&lt;p&gt;</code>,{" "}
                <code className="bg-gray-100 px-1 rounded">&lt;a&gt;</code>, etc.
                The A2Z BOOKSHOP branded header &amp; footer are added automatically.
              </p>
              <Textarea
                id="body"
                className="mt-1 text-sm min-h-[220px]"
                placeholder={`Hi there,\n\nWe have exciting news for you — check out our latest arrivals!\n\nVisit us at a2zbookshop.com\n\nWarm regards,\nThe A2Z BOOKSHOP Team`}
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
              />
            </div>

            {/* Selected recipients summary */}
            {selectedEmails.length > 0 && (
              <div className="rounded-lg bg-teal-50 border border-teal-200 px-4 py-3 text-sm">
                <div className="flex items-center gap-2 text-teal-800 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  {selectedEmails.length} recipient
                  {selectedEmails.length !== 1 ? "s" : ""} selected
                </div>
                {selectedEmails.length <= 5 && (
                  <ul className="mt-1 text-teal-700 text-xs space-y-0.5 ml-6">
                    {selectedEmails.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {sendMutation.isError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                {(sendMutation.error as Error).message}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setPreviewOpen(true)}
                disabled={!messageContent.trim()}
              >
                Preview
              </Button>
              <Button
                className="flex-1 bg-teal-600 hover:bg-teal-700"
                disabled={!canSend || sendMutation.isPending}
                onClick={() => sendMutation.mutate()}
              >
                {sendMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send to {selectedEmails.length || "…"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded bg-gray-100 px-3 py-2 text-sm">
              <span className="text-gray-500 font-medium">Subject: </span>
              {subject || <span className="italic text-gray-400">No subject</span>}
            </div>
            <iframe
              title="email-preview"
              className="w-full border rounded"
              style={{ minHeight: 420, background: "#f1f5f9" }}
              srcDoc={buildPreviewHtml(subject, messageContent)}
              sandbox="allow-same-origin"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {sendResult && sendResult.failed === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-500" />
              )}
              Send Complete
            </DialogTitle>
          </DialogHeader>

          {sendResult && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                  <div className="text-2xl font-bold text-green-700">{sendResult.sent}</div>
                  <div className="text-xs text-green-600">Sent</div>
                </div>
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <div className="text-2xl font-bold text-red-700">{sendResult.failed}</div>
                  <div className="text-xs text-red-600">Failed</div>
                </div>
                <div className="rounded-lg bg-gray-50 border p-3">
                  <div className="text-2xl font-bold text-gray-700">{sendResult.total}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
              </div>

              {sendResult.failed > 0 && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">Failed deliveries:</p>
                  <ul className="text-xs text-red-600 space-y-0.5 max-h-40 overflow-y-auto">
                    {sendResult.results
                      .filter((r) => !r.success)
                      .map((r) => (
                        <li key={r.email} className="flex items-center gap-1">
                          <X className="h-3 w-3 flex-shrink-0" />
                          {r.email}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setResultOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
