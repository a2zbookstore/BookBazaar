import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import SEO from '@/components/SEO';
import Breadcrumb from '@/components/Breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Order } from '@/types';
import {
  User, Camera, Shield, Settings, ShoppingBag, Heart,
  Mail, Phone, Calendar, CheckCircle2, XCircle, Lock,
  Eye, EyeOff, AlertCircle, Pencil, Save, X, Star
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────
function getInitials(firstName?: string | null, lastName?: string | null) {
  return `${(firstName?.[0] || '').toUpperCase()}${(lastName?.[0] || '').toUpperCase()}` || '?';
}

function formatDate(dateStr?: string | Date | null) {
  if (!dateStr) return '—';
  return new Date(dateStr as string).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ─── Component ───────────────────────────────────────────────────────────────
const MyProfile: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Orders & wishlist counts
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['/api/my-orders'],
    enabled: isAuthenticated,
  });
  const { data: wishlistItems = [] } = useQuery<any[]>({
    queryKey: ['/api/wishlist'],
    enabled: isAuthenticated,
  });

  // ── Profile form ─────────────────────────────────────────────────────────
  const [profileEdit, setProfileEdit] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: (user as any).phone || '',
      });
    }
  }, [user]);

  // ── Password form ────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  // ── Avatar ───────────────────────────────────────────────────────────────
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleAvatarSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch('/api/auth/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      setAvatarPreview(data.profileImageUrl);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({ title: 'Photo updated!', description: 'Your profile photo has been changed.' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [queryClient, toast]);

  const handleProfileSave = async () => {
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      toast({ title: 'Required fields missing', description: 'First and last name are required.', variant: 'destructive' });
      return;
    }
    setProfileSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setProfileEdit(false);
      toast({ title: 'Profile updated!', description: 'Your information has been saved.' });
    } catch (err: any) {
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      toast({ title: 'Fill all fields', description: 'All password fields are required.', variant: 'destructive' });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast({ title: 'Too short', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast({ title: 'Passwords do not match', description: 'New password and confirmation must match.', variant: 'destructive' });
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pwForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast({ title: 'Password changed!', description: 'Your password has been updated successfully.' });
    } catch (err: any) {
      toast({ title: 'Failed', description: err.message, variant: 'destructive' });
    } finally {
      setPwSaving(false);
    }
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const authProvider = (user as any)?.authProvider;
  const authLabel =
    authProvider === 'replit' ? 'Replit Account' :
    authProvider === 'phone' ? 'Phone Number' :
    'Email & Password';
  const canChangePassword = !authProvider || authProvider === 'email' || authProvider === 'phone';
  const isAdmin = user?.role === 'admin';
  const displayAvatar = avatarPreview || user?.profileImageUrl;

  const pwStrength = (() => {
    const p = pwForm.newPassword;
    if (!p) return 0;
    return (p.length >= 6 ? 1 : 0) + (p.length >= 10 ? 1 : 0) +
      (/[A-Z]/.test(p) || /[0-9]/.test(p) ? 1 : 0) + (/[^a-zA-Z0-9]/.test(p) ? 1 : 0);
  })();
  const pwStrengthLabel = ['Too weak', 'Weak', 'Fair', 'Strong', 'Very Strong'][pwStrength] || '';
  const pwStrengthColor = ['bg-slate-200', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-500'][pwStrength];

  return (
    <>
      <SEO
        title="My Profile"
        description="Manage your A2Z Bookshop profile — update your photo, personal info, and account security."
        keywords="my profile, account settings, personal information"
        url="https://a2zbookshop.com/my-profile"
        type="website"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/20">
        <div className="container-custom pb-16">
          <Breadcrumb items={[{ label: 'My Profile' }]} />

          {/* ── Hero Banner ─────────────────────────────────────────────── */}
          <div className="relative rounded-2xl overflow-hidden mb-8 shadow-xl">
            {/* Gradient top strip */}
            <div className="h-44 bg-gradient-to-r from-[#0f172a] via-[#1e3a5f] to-[#0f172a] relative overflow-hidden">
              <div className="absolute top-4 right-20 w-36 h-36 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-28 w-52 h-20 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.08)_0%,_transparent_70%)]" />
              {isAdmin && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-amber-400/15 backdrop-blur-sm border border-amber-400/30 rounded-full px-3.5 py-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-amber-300 text-xs font-semibold tracking-wide">Administrator</span>
                </div>
              )}
            </div>

            {/* White base */}
            <div className="bg-white px-5 pb-6 pt-0 md:px-10">
              <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6 -mt-14 relative z-10">

                {/* Avatar */}
                <div
                  className="relative self-start group shrink-0 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to change photo"
                >
                  <div className="w-28 h-28 md:w-[120px] md:h-[120px] rounded-2xl border-[3px] border-white shadow-2xl overflow-hidden bg-gradient-to-br from-indigo-500 to-blue-600 ring-2 ring-indigo-100 group-hover:ring-4 group-hover:ring-indigo-300 transition-all duration-200">
                    {displayAvatar ? (
                      <img src={displayAvatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white text-4xl font-bold">
                          {getInitials(user?.firstName, user?.lastName)}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1 rounded-[13px]">
                      {avatarUploading
                        ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        : <>
                            <Camera className="w-5 h-5 text-white" />
                            <span className="text-white text-[10px] font-semibold">Change Photo</span>
                          </>
                      }
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleAvatarSelect} />
                </div>

                {/* Name / meta / stats */}
                <div className="flex-1 flex flex-col md:flex-row md:items-end md:justify-between gap-3 pb-1 min-w-0">
                  <div className="min-w-0">
                    <h1 className="text-5xl font-bold text-gray-900 leading-tight truncate text-white">
                      {(user?.firstName || user?.lastName)
                        ? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()
                        : 'Your Name'}
                    </h1>
                    <p className="text-gray-400 text-sm mt-0.5 truncate">{user?.email || (user as any)?.phone || '—'}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge variant="secondary" className="text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {authLabel}
                      </Badge>
                      {isAdmin && (
                        <Badge className="text-[11px] bg-amber-100 text-amber-800 border border-amber-300">
                          <Star className="w-3 h-3 mr-1 fill-amber-600" /> Admin
                        </Badge>
                      )}
                      {(user as any)?.isEmailVerified && (
                        <Badge className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Stats pills */}
                  <div className="flex gap-2.5 shrink-0">
                    {[
                      { value: orders.length, label: 'Orders', icon: <ShoppingBag className="w-3.5 h-3.5 text-blue-500" /> },
                      { value: wishlistItems.length, label: 'Wishlist', icon: <Heart className="w-3.5 h-3.5 text-rose-500" /> },
                      { value: user?.createdAt ? new Date(user.createdAt).getFullYear() : '—', label: 'Joined', icon: <Calendar className="w-3.5 h-3.5 text-violet-500" /> },
                    ].map(stat => (
                      <div key={stat.label} className="flex flex-col items-center bg-slate-50 rounded-xl px-3.5 py-2.5 border border-slate-100 min-w-[60px]">
                        <div className="flex items-center gap-1 mb-0.5">{stat.icon}<span className="text-sm font-bold text-gray-800">{stat.value}</span></div>
                        <span className="text-[10px] text-gray-400 font-medium">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Tabs ────────────────────────────────────────────────────── */}
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm h-auto gap-1">
              {[
                { value: 'profile', icon: <User className="w-4 h-4" />, label: 'Personal Info' },
                { value: 'security', icon: <Shield className="w-4 h-4" />, label: 'Security' },
                { value: 'account', icon: <Settings className="w-4 h-4" />, label: 'Account' },
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center justify-center gap-2 rounded-lg py-2.5 font-medium text-sm data-[state=active]:bg-[#0f172a] data-[state=active]:text-white data-[state=active]:shadow transition-all"
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── Personal Info Tab ──────────────────────────────────────── */}
            <TabsContent value="profile">
              <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/40 border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-900">Personal Information</CardTitle>
                      <CardDescription className="text-gray-500 text-sm mt-0.5">Manage your name, email, and contact details</CardDescription>
                    </div>
                    {!profileEdit ? (
                      <Button
                        variant="outline" size="sm"
                        onClick={() => setProfileEdit(true)}
                        className="gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm"
                          onClick={() => {
                            setProfileEdit(false);
                            setProfileForm({ firstName: user?.firstName || '', lastName: user?.lastName || '', email: user?.email || '', phone: (user as any)?.phone || '' });
                          }}
                          className="gap-1.5 text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-3.5 h-3.5" /> Cancel
                        </Button>
                        <Button size="sm" onClick={handleProfileSave} disabled={profileSaving}
                          className="gap-1.5 bg-[#0f172a] hover:bg-[#1e293b] text-white"
                        >
                          {profileSaving
                            ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            : <Save className="w-3.5 h-3.5" />}
                          Save
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-6 md:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* First Name */}
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">First Name</Label>
                      {profileEdit ? (
                        <Input id="firstName" value={profileForm.firstName}
                          onChange={e => setProfileForm(f => ({ ...f, firstName: e.target.value }))}
                          placeholder="First name"
                          className="border-slate-200 focus-visible:border-indigo-400 focus-visible:ring-indigo-200"
                        />
                      ) : (
                        <div className="flex items-center gap-3 h-10 px-3 rounded-lg bg-slate-50 border border-slate-100">
                          <User className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-gray-800 font-medium">{user?.firstName || <span className="text-gray-400 font-normal italic">Not set</span>}</span>
                        </div>
                      )}
                    </div>

                    {/* Last Name */}
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">Last Name</Label>
                      {profileEdit ? (
                        <Input id="lastName" value={profileForm.lastName}
                          onChange={e => setProfileForm(f => ({ ...f, lastName: e.target.value }))}
                          placeholder="Last name"
                          className="border-slate-200 focus-visible:border-indigo-400 focus-visible:ring-indigo-200"
                        />
                      ) : (
                        <div className="flex items-center gap-3 h-10 px-3 rounded-lg bg-slate-50 border border-slate-100">
                          <User className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-gray-800 font-medium">{user?.lastName || <span className="text-gray-400 font-normal italic">Not set</span>}</span>
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</Label>
                      {profileEdit ? (
                        <Input id="email" type="email" value={profileForm.email}
                          onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                          placeholder="Email address"
                          className="border-slate-200 focus-visible:border-indigo-400 focus-visible:ring-indigo-200"
                        />
                      ) : (
                        <div className="flex items-center gap-3 h-10 px-3 rounded-lg bg-slate-50 border border-slate-100">
                          <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-gray-800 font-medium">{user?.email || <span className="text-gray-400 font-normal italic">Not set</span>}</span>
                        </div>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">Phone Number</Label>
                      {profileEdit ? (
                        <Input id="phone" type="tel" value={profileForm.phone}
                          onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                          placeholder="Phone number (optional)"
                          className="border-slate-200 focus-visible:border-indigo-400 focus-visible:ring-indigo-200"
                        />
                      ) : (
                        <div className="flex items-center gap-3 h-10 px-3 rounded-lg bg-slate-50 border border-slate-100">
                          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-gray-800 font-medium">{(user as any)?.phone || <span className="text-gray-400 font-normal italic">Not set</span>}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Photo hint */}
                  <div className="mt-8 flex items-start gap-3 p-4 bg-indigo-50/70 rounded-xl border border-indigo-100/80">
                    <Camera className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-indigo-800">Profile Photo</p>
                      <p className="text-xs text-indigo-500 mt-0.5">Click on your avatar at the top to upload a new photo. JPG, PNG, WebP — max 5 MB.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Security Tab ──────────────────────────────────────────── */}
            <TabsContent value="security">
              <div className="space-y-6">
                {canChangePassword ? (
                  <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-red-50/30 border-b border-slate-100 pb-4">
                      <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-rose-500" /> Change Password
                      </CardTitle>
                      <CardDescription className="text-gray-500 text-sm">Keep your account secure with a strong password</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8">
                      <div className="max-w-md space-y-5">
                        {/* Current password */}
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">Current Password</Label>
                          <div className="relative">
                            <Input type={showPw.current ? 'text' : 'password'}
                              value={pwForm.currentPassword}
                              onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                              placeholder="Enter current password"
                              className="pr-10 border-slate-200"
                            />
                            <button type="button"
                              onClick={() => setShowPw(s => ({ ...s, current: !s.current }))}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              {showPw.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <Separator />

                        {/* New password */}
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">New Password</Label>
                          <div className="relative">
                            <Input type={showPw.new ? 'text' : 'password'}
                              value={pwForm.newPassword}
                              onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                              placeholder="Min. 6 characters"
                              className="pr-10 border-slate-200"
                            />
                            <button type="button"
                              onClick={() => setShowPw(s => ({ ...s, new: !s.new }))}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              {showPw.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {pwForm.newPassword && (
                            <div className="pt-1 space-y-1">
                              <div className="flex gap-1 h-1.5">
                                {[0, 1, 2, 3].map(i => (
                                  <div key={i} className={`flex-1 rounded-full transition-colors duration-200 ${i < pwStrength ? pwStrengthColor : 'bg-slate-200'}`} />
                                ))}
                              </div>
                              <p className="text-xs text-slate-500">{pwStrengthLabel}</p>
                            </div>
                          )}
                        </div>

                        {/* Confirm password */}
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">Confirm New Password</Label>
                          <div className="relative">
                            <Input type={showPw.confirm ? 'text' : 'password'}
                              value={pwForm.confirmPassword}
                              onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                              placeholder="Re-enter new password"
                              className={`pr-10 border-slate-200 transition-colors ${
                                pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword
                                  ? 'border-red-300 bg-red-50/30'
                                  : pwForm.confirmPassword && pwForm.newPassword === pwForm.confirmPassword
                                  ? 'border-emerald-300 bg-emerald-50/30'
                                  : ''
                              }`}
                            />
                            <button type="button"
                              onClick={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              {showPw.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Passwords do not match
                            </p>
                          )}
                        </div>

                        <Button onClick={handlePasswordChange} disabled={pwSaving}
                          className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white gap-2 mt-2"
                        >
                          {pwSaving
                            ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            : <Lock className="w-4 h-4" />}
                          Update Password
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-0 shadow-sm rounded-2xl">
                    <CardContent className="p-10 text-center">
                      <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium">Password is managed by {authLabel}.</p>
                      <p className="text-sm text-gray-400 mt-1">You signed in via Replit — manage your password there.</p>
                    </CardContent>
                  </Card>
                )}

                {/* Forgot password card */}
                {canChangePassword && (
                  <Card className="shadow-sm rounded-2xl bg-amber-50/40 border border-amber-100">
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">Forgot your current password?</p>
                        <p className="text-xs text-gray-500 mt-0.5">Request a reset link sent to your email.</p>
                      </div>
                      <a href="/forgot-password"
                        className="shrink-0 text-sm text-indigo-600 font-semibold hover:text-indigo-800 hover:underline transition-colors"
                      >
                        Reset →
                      </a>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* ── Account Tab ───────────────────────────────────────────── */}
            <TabsContent value="account">
              <div className="space-y-6">
                {/* Account Overview */}
                <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-emerald-50/30 border-b border-slate-100 pb-4">
                    <CardTitle className="text-lg font-bold text-gray-900">Account Overview</CardTitle>
                    <CardDescription className="text-gray-500 text-sm">Your account details and status</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 md:p-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        {
                          icon: <Settings className="w-5 h-5 text-slate-600" />,
                          bg: 'bg-slate-100',
                          label: 'Account ID',
                          value: <span className="font-mono text-xs truncate">{user?.id || '—'}</span>,
                        },
                        {
                          icon: <Calendar className="w-5 h-5 text-blue-600" />,
                          bg: 'bg-blue-100',
                          label: 'Member Since',
                          value: formatDate(user?.createdAt),
                        },
                        {
                          icon: <Shield className="w-5 h-5 text-indigo-600" />,
                          bg: 'bg-indigo-100',
                          label: 'Sign-in Method',
                          value: authLabel,
                        },
                        {
                          icon: (user as any)?.isEmailVerified
                            ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            : <XCircle className="w-5 h-5 text-rose-500" />,
                          bg: (user as any)?.isEmailVerified ? 'bg-emerald-100' : 'bg-rose-100',
                          label: 'Email Verified',
                          value: <span className={(user as any)?.isEmailVerified ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                            {(user as any)?.isEmailVerified ? 'Yes' : 'Not Verified'}
                          </span>,
                        },
                        {
                          icon: isAdmin
                            ? <Star className="w-5 h-5 text-amber-600 fill-amber-500" />
                            : <User className="w-5 h-5 text-slate-600" />,
                          bg: isAdmin ? 'bg-amber-100' : 'bg-slate-100',
                          label: 'Role',
                          value: <span className={`capitalize font-semibold ${isAdmin ? 'text-amber-700' : 'text-gray-700'}`}>{user?.role || 'Customer'}</span>,
                        },
                        {
                          icon: <Pencil className="w-5 h-5 text-purple-600" />,
                          bg: 'bg-purple-100',
                          label: 'Last Updated',
                          value: formatDate(user?.updatedAt),
                        },
                      ].map(item => (
                        <div key={item.label} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                          <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                            {item.icon}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{item.label}</p>
                            <p className="text-sm text-gray-800 mt-0.5 truncate">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick links */}
                <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="border-b border-slate-100 pb-4">
                    <CardTitle className="text-lg font-bold text-gray-900">Quick Links</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <a href="/my-orders"
                        className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-100 hover:border-blue-200 transition-all group"
                      >
                        <ShoppingBag className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-blue-800">My Orders</p>
                          <p className="text-xs text-blue-500">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
                        </div>
                      </a>
                      <a href="/wishlist"
                        className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-100 hover:border-rose-200 transition-all group"
                      >
                        <Heart className="w-5 h-5 text-rose-500 group-hover:scale-110 transition-transform shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-rose-800">Wishlist</p>
                          <p className="text-xs text-rose-500">{wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''}</p>
                        </div>
                      </a>
                      {isAdmin && (
                        <a href="/admin"
                          className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-100 hover:border-amber-200 transition-all group"
                        >
                          <Star className="w-5 h-5 text-amber-600 fill-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-amber-800">Admin Panel</p>
                            <p className="text-xs text-amber-500">Manage your store</p>
                          </div>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default MyProfile;