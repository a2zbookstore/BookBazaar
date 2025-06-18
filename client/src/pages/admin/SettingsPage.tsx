import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, User, Store, Mail, Plus, Edit, Trash2, Send, CheckCircle, AlertCircle } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
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
      await apiRequest("POST", "/api/categories", data);
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
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bookerly font-bold text-base-black">Settings</h1>
          <p className="text-secondary-black">Manage your store configuration and account settings.</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Store Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleStoreSettingsSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="storeName">Store Name</Label>
                      <Input 
                        id="storeName" 
                        value={storeSettings.storeName}
                        onChange={(e) => setStoreSettings((prev: StoreSettingsForm) => ({ ...prev, storeName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="storeEmail">Store Email</Label>
                      <Input 
                        id="storeEmail" 
                        type="email" 
                        value={storeSettings.storeEmail}
                        onChange={(e) => setStoreSettings((prev: StoreSettingsForm) => ({ ...prev, storeEmail: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="storeDescription">Store Description</Label>
                    <Textarea 
                      id="storeDescription" 
                      rows={3}
                      value={storeSettings.storeDescription}
                      onChange={(e) => setStoreSettings((prev: StoreSettingsForm) => ({ ...prev, storeDescription: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="storePhone">Phone Number</Label>
                      <Input 
                        id="storePhone" 
                        value={storeSettings.storePhone}
                        onChange={(e) => setStoreSettings((prev: StoreSettingsForm) => ({ ...prev, storePhone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Input 
                        id="currency" 
                        value={storeSettings.currency}
                        onChange={(e) => setStoreSettings((prev: StoreSettingsForm) => ({ ...prev, currency: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="storeAddress">Store Address</Label>
                    <Textarea 
                      id="storeAddress" 
                      rows={3}
                      value={storeSettings.storeAddress}
                      onChange={(e) => setStoreSettings((prev: StoreSettingsForm) => ({ ...prev, storeAddress: e.target.value }))}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      type="submit" 
                      className="bg-primary-aqua hover:bg-secondary-aqua"
                      disabled={updateStoreSettingsMutation.isPending}
                    >
                      {updateStoreSettingsMutation.isPending ? "Saving..." : "Save Store Settings"}
                    </Button>
                  </div>
                </form>

                {/* SMTP Configuration Test Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Configuration (SMTP)
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>Current SMTP Settings:</strong>
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Server: smtp-relay.brevo.com (Brevo)</li>
                          <li>• Port: 587 (TLS)</li>
                          <li>• Authentication: Brevo API Key</li>
                          <li>• Used for: Order confirmations, status updates</li>
                          <li>• Admin notifications to your Brevo email</li>
                        </ul>
                        
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800 mb-2">
                            <strong>Brevo Credentials Required</strong>
                          </p>
                          <p className="text-sm text-yellow-700 mb-2">
                            Please provide your Brevo credentials to enable email functionality:
                          </p>
                          <ul className="text-sm text-yellow-700 space-y-1">
                            <li>1. BREVO_EMAIL: Your verified email address from Brevo</li>
                            <li>2. BREVO_API_KEY: Your SMTP API key from Brevo settings</li>
                          </ul>
                          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-xs text-blue-700">
                              <strong>Ready:</strong> Email system will work immediately after providing credentials
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => testSmtpMutation.mutate()}
                        disabled={testSmtpMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        {testSmtpMutation.isPending ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Test SMTP
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500">
                      Click "Test SMTP" to verify email configuration. A test email will be sent to verify the connection.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Management */}
          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Book Categories
                  </span>
                  <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={resetCategoryForm} className="bg-primary-aqua hover:bg-secondary-aqua">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Category
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Category</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCategorySubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="categoryName">Category Name *</Label>
                          <Input
                            id="categoryName"
                            value={categoryForm.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            required
                            placeholder="e.g., Science Fiction"
                          />
                        </div>
                        <div>
                          <Label htmlFor="categorySlug">URL Slug *</Label>
                          <Input
                            id="categorySlug"
                            value={categoryForm.slug}
                            onChange={(e) => setCategoryForm(prev => ({ ...prev, slug: e.target.value }))}
                            required
                            placeholder="e.g., science-fiction"
                          />
                          <p className="text-xs text-secondary-black mt-1">
                            Used in URLs. Auto-generated from name if left empty.
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="categoryDescription">Description</Label>
                          <Textarea
                            id="categoryDescription"
                            value={categoryForm.description}
                            onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            placeholder="Optional description for the category"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsCategoryDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createCategoryMutation.isPending}
                            className="bg-primary-aqua hover:bg-secondary-aqua"
                          >
                            Create Category
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categories.length > 0 ? (
                  <div className="space-y-4">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h3 className="font-semibold text-base-black">{category.name}</h3>
                          <p className="text-sm text-secondary-black">Slug: {category.slug}</p>
                          {category.description && (
                            <p className="text-sm text-tertiary-black mt-1">{category.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-abe-red hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-base-black mb-2">No categories yet</h3>
                    <p className="text-secondary-black mb-4">
                      Create your first book category to organize your inventory.
                    </p>
                    <Button 
                      onClick={() => setIsCategoryDialogOpen(true)}
                      className="bg-primary-aqua hover:bg-secondary-aqua"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Category
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Messages */}
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Messages ({contactMessages.filter(m => m.status === 'unread').length} unread)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contactMessages.length > 0 ? (
                  <div className="space-y-4">
                    {contactMessages.map((message) => (
                      <div key={message.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-base-black">
                              {message.firstName} {message.lastName}
                            </h3>
                            <p className="text-sm text-secondary-black">{message.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs ${getMessageStatusColor(message.status)}`}>
                              {message.status}
                            </span>
                            <span className="text-xs text-tertiary-black">
                              {new Date(message.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <p className="font-medium text-base-black mb-2">Subject: {message.subject}</p>
                        <p className="text-secondary-black text-sm leading-relaxed">{message.message}</p>
                        {message.status === 'unread' && (
                          <div className="mt-3 flex gap-2">
                            <Button size="sm" className="bg-primary-aqua hover:bg-secondary-aqua">
                              Reply
                            </Button>
                            <Button size="sm" variant="outline">
                              Mark as Read
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-base-black mb-2">No messages yet</h3>
                    <p className="text-secondary-black">
                      Customer messages will appear here when they contact you.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Settings */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        id="firstName" 
                        value={userProfile.firstName}
                        onChange={(e) => setUserProfile(prev => ({ ...prev, firstName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName" 
                        value={userProfile.lastName}
                        onChange={(e) => setUserProfile(prev => ({ ...prev, lastName: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={userProfile.email}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" value={user?.role || "admin"} disabled />
                    <p className="text-xs text-secondary-black mt-1">
                      Contact support to change your role.
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-semibold text-base-black mb-4">Account Actions</h3>
                    <div className="flex gap-4">
                      <Button 
                        type="submit" 
                        className="bg-primary-aqua hover:bg-secondary-aqua"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                      </Button>
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => window.location.href = "/api/logout"}
                      >
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </form>

                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-base-black mb-2">Account Information</h3>
                  <div className="text-sm text-secondary-black space-y-1">
                    <p><strong>User ID:</strong> {user?.id}</p>
                    <p><strong>Account Created:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Last Updated:</strong> {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
