import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings, User, Store, Mail, Send, CheckCircle,
  MessageSquare, Shield, ChevronRight, Loader2,
  Phone, Globe, MapPin, Building2, AtSign, BadgeCheck,
  ServerCog, Inbox,
} from "lucide-react";
import CategoriesManagement from "@/components/admin/CategoriesManagement";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { Category, ContactMessage } from "@/types";

interface StoreSettingsDB {
  id: number;
  storeName: string;
  storeEmail: string;
  storeDescription?: string;
  storePhone?: string;
  currency: string;
  storeAddress?: string;
  createdAt: string;
  updatedAt: string;
}

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
}

interface StoreSettingsForm {
  storeName: string;
  storeEmail: string;
  storeDescription: string;
  storePhone: string;
  currency: string;
  storeAddress: string;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
}

const initialCategoryForm: CategoryForm = {
  name: "",
  slug: "",
  description: "",
};

const initialStoreSettings: StoreSettingsForm = {
  storeName: "A2Z BOOKSHOP",
  storeEmail: "hello@a2zbookshop.com",
  storeDescription: "Your premier destination for rare, collectible, and contemporary books from around the world.",
  storePhone: "+31 (20) 123-BOOK",
  currency: "EUR",
  storeAddress: "123 Book Street\nLiterary District\nBooktown, BT 12345\nEurope",
};

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { setIsAuthTransitioning } = useGlobalContext();
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(initialCategoryForm);
  const [storeSettings, setStoreSettings] = useState<StoreSettingsForm>(initialStoreSettings);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: contactMessages = [] } = useQuery<ContactMessage[]>({
    queryKey: ["/api/contact"],
  });

  const { data: storeSettingsData } = useQuery<StoreSettingsDB>({
    queryKey: ["/api/settings/store"],
  });

  // Sync user profile state when user data loads
  useEffect(() => {
    if (user) {
      setUserProfile({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
      });
    }
  }, [user]);

  // Sync store settings state when data loads
  useEffect(() => {
    if (storeSettingsData) {
      setStoreSettings({
        storeName: storeSettingsData.storeName || "",
        storeEmail: storeSettingsData.storeEmail || "",
        storeDescription: storeSettingsData.storeDescription || "",
        storePhone: storeSettingsData.storePhone || "",
        currency: storeSettingsData.currency || "EUR",
        storeAddress: storeSettingsData.storeAddress || "",
      });
    }
  }, [storeSettingsData]);

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryForm) => {
      await apiRequest("POST", "/api/createCategory", data);
    },
    onSuccess: () => {
      toast({
        title: "Category created",
        description: "The category has been created successfully.",
      });
      setIsCategoryDialogOpen(false);
      setCategoryForm(initialCategoryForm);
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create category",
        variant: "destructive",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UserProfile) => {
      await apiRequest("PUT", "/api/auth/user", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const updateStoreSettingsMutation = useMutation({
    mutationFn: async (data: StoreSettingsForm) => {
      await apiRequest("PUT", "/api/settings/store", data);
    },
    onSuccess: () => {
      toast({
        title: "Store settings updated",
        description: "Store settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/store"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update store settings",
        variant: "destructive",
      });
    },
  });

  const testSmtpMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/test-smtp", {});
    },
    onSuccess: (data: any) => {
      toast({
        title: "SMTP Test Successful",
        description: "Test email sent successfully. Check your inbox to confirm SMTP configuration is working.",
      });
    },
    onError: (error) => {
      toast({
        title: "SMTP Test Failed",
        description: error instanceof Error ? error.message : "Failed to send test email. Check SMTP configuration.",
        variant: "destructive",
      });
    },
  });

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Auto-generate slug from name if not provided
    const slug = categoryForm.slug || categoryForm.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    createCategoryMutation.mutate({
      ...categoryForm,
      slug,
    });
  };

  const handleStoreSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettingsMutation.mutate(storeSettings);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(userProfile);
  };

  const resetCategoryForm = () => {
    setCategoryForm(initialCategoryForm);
    setEditingCategory(null);
  };

  const handleNameChange = (name: string) => {
    setCategoryForm(prev => ({
      ...prev,
      name,
      // Auto-generate slug if not manually edited
      slug: prev.slug === prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        : prev.slug
    }));
  };

  const getMessageStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "unread":
        return "bg-yellow-100 text-yellow-800";
      case "read":
        return "bg-blue-100 text-blue-800";
      case "replied":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-indigo-500/10" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-slate-400/10" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-4">

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-sm text-slate-400 mt-0.5">Manage your store configuration and account</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="general" className="space-y-6">
        {/* Tab bar */}
        <TabsList className="flex h-auto w-full flex-wrap gap-1 rounded-2xl bg-white border border-gray-200 shadow-sm p-1.5">
          {[
            { value: "general", label: "Store", icon: <Store className="h-4 w-4" /> },
            { value: "categories", label: "Categories", icon: <Globe className="h-4 w-4" /> },
            { value: "messages", label: "Messages", icon: <Inbox className="h-4 w-4" /> },
            { value: "account", label: "Account", icon: <User className="h-4 w-4" /> },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-1 min-w-[80px] flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all
                data-[state=active]:bg-gradient-to-br data-[state=active]:from-slate-800 data-[state=active]:to-slate-700
                data-[state=active]:text-white data-[state=active]:shadow-md
                text-gray-500 hover:text-gray-700"
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ════════════ GENERAL ════════════ */}
        <TabsContent value="general" className="space-y-6">

          {/* Store Info card */}
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-gray-100 border-b border-gray-200 px-5 py-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 shadow">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Store Information</p>
                <p className="text-xs text-gray-500">Public-facing details for your bookshop</p>
              </div>
            </div>
            <CardContent className="p-5 sm:p-6">
              <form onSubmit={handleStoreSettingsSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="storeName" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Store Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <Input
                        id="storeName"
                        className="pl-9 rounded-xl border-slate-200 focus:ring-2 focus:ring-slate-300 h-10"
                        value={storeSettings.storeName}
                        onChange={(e) => setStoreSettings((prev: StoreSettingsForm) => ({ ...prev, storeName: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="storeEmail" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Store Email</Label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <Input
                        id="storeEmail"
                        type="email"
                        className="pl-9 rounded-xl border-slate-200 focus:ring-2 focus:ring-slate-300 h-10"
                        value={storeSettings.storeEmail}
                        onChange={(e) => setStoreSettings((prev: StoreSettingsForm) => ({ ...prev, storeEmail: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="storeDescription" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Store Description</Label>
                  <Textarea
                    id="storeDescription"
                    rows={3}
                    className="rounded-xl border-slate-200 focus:ring-2 focus:ring-slate-300 resize-none"
                    value={storeSettings.storeDescription}
                    onChange={(e) => setStoreSettings((prev: StoreSettingsForm) => ({ ...prev, storeDescription: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="storePhone" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <Input
                        id="storePhone"
                        className="pl-9 rounded-xl border-slate-200 focus:ring-2 focus:ring-slate-300 h-10"
                        value={storeSettings.storePhone}
                        onChange={(e) => setStoreSettings((prev: StoreSettingsForm) => ({ ...prev, storePhone: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="currency" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Currency</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <Input
                        id="currency"
                        className="pl-9 rounded-xl border-slate-200 focus:ring-2 focus:ring-slate-300 h-10"
                        value={storeSettings.currency}
                        onChange={(e) => setStoreSettings((prev: StoreSettingsForm) => ({ ...prev, currency: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="storeAddress" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Store Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Textarea
                      id="storeAddress"
                      rows={3}
                      className="pl-9 rounded-xl border-slate-200 focus:ring-2 focus:ring-slate-300 resize-none"
                      value={storeSettings.storeAddress}
                      onChange={(e) => setStoreSettings((prev: StoreSettingsForm) => ({ ...prev, storeAddress: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="submit"
                    disabled={updateStoreSettingsMutation.isPending}
                    className="rounded-full bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white px-6 h-10 shadow-md hover:shadow-lg transition-all"
                  >
                    {updateStoreSettingsMutation.isPending ? (
                      <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving…</span>
                    ) : (
                      <span className="flex items-center gap-2 "> Save Settings</span>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* SMTP card */}

        </TabsContent>

        {/* ════════════ CATEGORIES ════════════ */}
        <TabsContent value="categories">
          <CategoriesManagement />
        </TabsContent>

        {/* ════════════ MESSAGES ════════════ */}
        <TabsContent value="messages">
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-gray-100 border-b border-gray-200 px-5 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Contact Messages</p>
                  <p className="text-xs text-gray-500">Customer enquiries from the contact form</p>
                </div>
              </div>
              {contactMessages.filter(m => m.status === 'unread').length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  {contactMessages.filter(m => m.status === 'unread').length} unread
                </span>
              )}
            </div>
            <CardContent className="p-0">
              {contactMessages.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {contactMessages.map((message) => (
                    <div key={message.id} className="p-5 hover:bg-gray-50/60 transition-colors">
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{message.firstName} {message.lastName}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{message.email}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getMessageStatusColor(message.status)}`}>
                            {message.status}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(message.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Subject</p>
                      <p className="text-sm font-medium text-gray-800 mb-2">{message.subject}</p>
                      <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl px-3 py-2.5">{message.message}</p>
                      {message.status === 'unread' && (
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 rounded-xl text-white gap-1.5 h-8">
                            <Send className="h-3.5 w-3.5" /> Reply
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-xl h-8">
                            Mark as Read
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                  <Inbox className="h-12 w-12 opacity-30" />
                  <p className="font-medium text-sm">No messages yet</p>
                  <p className="text-xs text-center max-w-xs">Customer messages from the contact form will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════ ACCOUNT ════════════ */}
        <TabsContent value="account" className="space-y-6">

          {/* Profile card */}
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-gray-100 border-b border-gray-200 px-5 py-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 shadow">
                <User className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Profile Information</p>
                <p className="text-xs text-gray-500">Your personal account details</p>
              </div>
            </div>
            <CardContent className="p-5 sm:p-6">
              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">First Name</Label>
                    <Input
                      id="firstName"
                      className="rounded-xl border-slate-200 focus:ring-2 focus:ring-violet-200 h-10"
                      value={userProfile.firstName}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Last Name</Label>
                    <Input
                      id="lastName"
                      className="rounded-xl border-slate-200 focus:ring-2 focus:ring-violet-200 h-10"
                      value={userProfile.lastName}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Email Address</Label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-9 rounded-xl border-slate-200 focus:ring-2 focus:ring-violet-200 h-10"
                      value={userProfile.email}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="role" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Role</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="role"
                      className="pl-9 rounded-xl bg-gray-50 border-slate-200 h-10 text-gray-500 cursor-not-allowed"
                      value={user?.role || "admin"}
                      disabled
                    />
                  </div>
                  <p className="text-xs text-gray-400">Contact support to change your role.</p>
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl px-6 h-10 shadow-md hover:shadow-lg transition-all"
                  >
                    {updateProfileMutation.isPending ? (
                      <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Updating…</span>
                    ) : (
                      <span className="flex items-center gap-2"><BadgeCheck className="h-4 w-4" /> Update Profile</span>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-10 px-5 transition-all"
                    onClick={() => {
                      setIsAuthTransitioning(true);
                      setTimeout(() => { window.location.href = "/api/logout"; }, 300);
                    }}
                  >
                    Sign Out
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Account Info card */}
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-gray-100 border-b border-gray-200 px-5 py-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-700 shadow">
                <Settings className="h-4 w-4 text-white" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">Account Details</p>
            </div>
            <CardContent className="p-5 sm:p-6">
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "User ID", value: user?.id || "—" },
                  { label: "Account Created", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A" },
                  { label: "Last Updated", value: user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "N/A" },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 space-y-1">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</dt>
                    <dd className="text-sm font-semibold text-gray-800 font-mono truncate">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
