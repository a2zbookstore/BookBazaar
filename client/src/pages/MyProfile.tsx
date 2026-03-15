import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
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
    Eye, EyeOff, AlertCircle, Pencil, Save, X, Star, RefreshCw, SendHorizonal
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
        console.log(user, "user in account overview");

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

    // ── Forgot-password OTP flow ───────────────────────────────────────────
    type OtpStep = 'idle' | 'sending' | 'otp' | 'resetting' | 'done';
    const [otpStep, setOtpStep] = useState<OtpStep>('idle');
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [maskedEmail, setMaskedEmail] = useState('');
    const [otpNewPw, setOtpNewPw] = useState({ newPassword: '', confirmPassword: '' });
    const [showOtpPw, setShowOtpPw] = useState({ new: false, confirm: false });
    const [otpResendCooldown, setOtpResendCooldown] = useState(0);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (otpResendCooldown <= 0) return;
        const t = setTimeout(() => setOtpResendCooldown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [otpResendCooldown]);

    const handleSendOtp = async () => {
        setOtpStep('sending');
        try {
            const res = await fetch('/api/auth/send-password-otp', {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
            setMaskedEmail(data.maskedEmail);
            setOtpDigits(['', '', '', '', '', '']);
            setOtpStep('otp');
            setOtpResendCooldown(60);
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        } catch (err: any) {
            toast({ title: 'Could not send code', description: err.message, variant: 'destructive' });
            setOtpStep('idle');
        }
    };

    const handleOtpInput = (idx: number, val: string) => {
        const digit = val.replace(/\D/g, '').slice(-1);
        const next = [...otpDigits];
        next[idx] = digit;
        setOtpDigits(next);
        if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
    };

    const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
        if (e.key === 'ArrowLeft' && idx > 0) otpRefs.current[idx - 1]?.focus();
        if (e.key === 'ArrowRight' && idx < 5) otpRefs.current[idx + 1]?.focus();
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pasted) return;
        const next = pasted.split('').concat(['', '', '', '', '', '']).slice(0, 6);
        setOtpDigits(next);
        otpRefs.current[Math.min(pasted.length, 5)]?.focus();
        e.preventDefault();
    };

    const enteredOtp = otpDigits.join('');

    const handleResetWithOtp = async () => {
        if (enteredOtp.length < 6) { toast({ title: 'Enter the 6-digit code', variant: 'destructive' }); return; }
        if (!otpNewPw.newPassword || otpNewPw.newPassword.length < 6) { toast({ title: 'Password too short', description: 'At least 6 characters required.', variant: 'destructive' }); return; }
        if (otpNewPw.newPassword !== otpNewPw.confirmPassword) { toast({ title: 'Passwords do not match', variant: 'destructive' }); return; }
        setOtpStep('resetting');
        try {
            const res = await fetch('/api/auth/verify-otp-reset', {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otp: enteredOtp, newPassword: otpNewPw.newPassword, confirmPassword: otpNewPw.confirmPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed');
            setOtpStep('done');
            setOtpDigits(['', '', '', '', '', '']);
            setOtpNewPw({ newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            toast({ title: 'Reset failed', description: err.message, variant: 'destructive' });
            setOtpStep('otp');
        }
    };

    const otpPwStrength = (() => {
        const p = otpNewPw.newPassword;
        if (!p) return 0;
        return (p.length >= 6 ? 1 : 0) + (p.length >= 10 ? 1 : 0) +
            (/[A-Z]/.test(p) || /[0-9]/.test(p) ? 1 : 0) + (/[^a-zA-Z0-9]/.test(p) ? 1 : 0);
    })();

    const [activeTab, setActiveTab] = useState('profile');

    return (
        <>
            <SEO
                title="My Profile"
                description="Manage your A2Z Bookshop profile — update your photo, personal info, and account security."
                url="https://a2zbookshop.com/my-profile"
                type="website"
                noindex
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
                                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight truncate text-gray-900 md:text-white">
                                            {(user?.firstName || user?.lastName)
                                                ? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()
                                                : 'Your Name'}
                                        </h1>
                                        <p className="text-gray-500 md:text-gray-400 text-sm mt-0.5 truncate">{user?.email || (user as any)?.phone || '—'}</p>
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
                                    <div className="flex gap-2 sm:gap-2.5 w-full md:w-auto justify-between md:justify-start">
                                        {[
                                            { value: orders.length, label: 'Orders', icon: <ShoppingBag className="w-3.5 h-3.5 text-blue-500" /> },
                                            { value: wishlistItems.length, label: 'Wishlist', icon: <Heart className="w-3.5 h-3.5 text-rose-500" /> },
                                            { value: user?.createdAt ? new Date(user.createdAt).getFullYear() : '—', label: 'Joined', icon: <Calendar className="w-3.5 h-3.5 text-violet-500" /> },
                                        ].map(stat => (
                                            <div key={stat.label} className="flex flex-col items-center bg-slate-50 rounded-xl px-3 sm:px-3.5 py-2.5 border border-slate-100 flex-1 md:flex-none md:min-w-[60px]">
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
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-6 bg-white border border-slate-200 rounded-xl md:rounded-full p-1.5 shadow-sm h-auto gap-1">
                            {[
                                { value: 'profile', icon: <User className="w-4 h-4" />, label: 'Personal Info' },
                                { value: 'security', icon: <Shield className="w-4 h-4" />, label: 'Security' },
                                { value: 'account', icon: <Settings className="w-4 h-4" />, label: 'Account' },
                            ].map(tab => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className="flex items-center justify-center gap-2 rounded-lg py-2.5 font-medium text-sm data-[state=active]:bg-primary-aqua data-[state=active]:text-white data-[state=active]:shadow transition-all data-[state=active]:rounded-xl md:data-[state=active]:rounded-full"
                                >
                                    {tab.icon}
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 14, filter: 'blur(5px)' }}
                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
                                transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
                            >
                                {/* ── Personal Info Tab ──────────────────────────────────────── */}
                                {activeTab === 'profile' && (
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
                                                        className="ml-auto rounded-full gap-1.5 bg-primary-aqua hover:bg-secondary-aqua text-white hover:text-white "
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" /> 
                                                        Edit
                                                    </Button>
                                                ) : (
                                                    <div className="flex gap-2 ml-auto">
                                                        <Button variant="ghost" size="sm"
                                                            onClick={() => {
                                                                setProfileEdit(false);
                                                                setProfileForm({ firstName: user?.firstName || '', lastName: user?.lastName || '', email: user?.email || '', phone: (user as any)?.phone || '' });
                                                            }}
                                                            className="gap-1.5 text-gray-500 hover:text-gray-700 rounded-full"
                                                        >
                                                            <X className="w-3.5 h-3.5" /> Cancel
                                                        </Button>
                                                        <Button size="sm" onClick={handleProfileSave} disabled={profileSaving}
                                                            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full"
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
                                                        <div className="flex items-center gap-3 h-10 px-3 rounded-[4px] bg-slate-50 border border-slate-100">
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
                                                        <div className="flex items-center gap-3 h-10 px-3 rounded-[4px] bg-slate-50 border border-slate-100">
                                                            <User className="w-4 h-4 text-slate-400 shrink-0" />
                                                            <span className="text-gray-800 font-medium">{user?.lastName || <span className="text-gray-400 font-normal italic">Not set</span>}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Email */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</Label>
                                                    {profileEdit && !user?.isEmailVerified ? (
                                                        <Input id="email" type="email" value={profileForm.email}
                                                            onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                                                            placeholder="Email address"
                                                            className="border-slate-200 focus-visible:border-indigo-400 focus-visible:ring-indigo-200"
                                                        />
                                                    ) : (
                                                        <div className="flex rounded-[4px] items-center gap-3 h-10 px-3 bg-slate-50 border border-slate-100">
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
                                                        <div className="flex items-center gap-3 h-10 px-3 rounded-[4px] bg-slate-50 border border-slate-100">
                                                            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                                                            <span className="text-gray-800 font-medium">{(user as any)?.phone || <span className="text-gray-400 font-normal italic">Not set</span>}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* ── Security Tab ──────────────────────────────────────────── */}
                                {activeTab === 'security' && (
                                    <div className="space-y-6">
                                        {!canChangePassword && (
                                            <Card className="border-0 shadow-sm rounded-2xl">
                                                <CardContent className="p-10 text-center">
                                                    <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                                    <p className="text-gray-600 font-medium">Password is managed by {authLabel}.</p>
                                                    <p className="text-sm text-gray-400 mt-1">You signed in via Replit — manage your password there.</p>
                                                </CardContent>
                                            </Card>
                                        )}
                                        {canChangePassword && (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                                            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                                                <CardHeader className="bg-gradient-to-r from-slate-50 to-red-50/30 border-b border-slate-100 pb-4">
                                                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                                        <Lock className="w-5 h-5 text-rose-500" /> Change Password
                                                    </CardTitle>
                                                    <CardDescription className="text-gray-500 text-sm">Keep your account secure with a strong password</CardDescription>
                                                </CardHeader>
                                                <CardContent className="p-6 md:p-8">
                                                    <div className="space-y-5">
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
                                                                    className={`pr-10 border-slate-200 transition-colors ${pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword
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
                                                            className="w-full rounded-full bg-primary-aqua hover:bg-secondary-aqua text-white gap-2 mt-2"
                                                        >
                                                            {pwSaving
                                                                ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                                                : <Lock className="w-4 h-4" />}
                                                            Update Password
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <Card className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm self-start">
                                                <CardHeader className="bg-gradient-to-r from-slate-50 to-violet-50/40 border-b border-slate-100 pb-4">
                                                    <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                                                        Forgot Your Current Password?
                                                    </CardTitle>
                                                    <CardDescription className="text-gray-500 text-xs">Reset it right here — we'll send a one-time code to your email</CardDescription>
                                                </CardHeader>
                                                <CardContent className="p-6">
                                                    <AnimatePresence mode="wait">

                                                        {/* Step: idle */}
                                                        {otpStep === 'idle' && (
                                                            <motion.div key="idle"
                                                                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                                                                transition={{ duration: 0.18 }}
                                                                className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
                                                            >
                                                                <div className="flex-1">
                                                                    <p className="text-sm text-gray-600">A <span className="font-semibold text-gray-800">6-digit code</span> will be sent to your registered email address. Enter it here to set a new password instantly — no page redirect needed.</p>
                                                                </div>
                                                                <Button onClick={handleSendOtp}
                                                                    className="shrink-0 rounded-full bg-violet-600 hover:bg-violet-700 text-white gap-2 px-5"
                                                                >
                                                                    <SendHorizonal className="w-4 h-4" /> Send Code
                                                                </Button>
                                                            </motion.div>
                                                        )}

                                                        {/* Step: sending */}
                                                        {otpStep === 'sending' && (
                                                            <motion.div key="sending"
                                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                                className="flex items-center gap-3 py-2"
                                                            >
                                                                <div className="w-5 h-5 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
                                                                <span className="text-sm text-gray-500">Sending verification code…</span>
                                                            </motion.div>
                                                        )}

                                                        {/* Step: otp entry */}
                                                        {otpStep === 'otp' && (
                                                            <motion.div key="otp"
                                                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="space-y-5"
                                                            >
                                                                <div className="flex items-center gap-2 text-sm text-gray-600 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
                                                                    <Mail className="w-4 h-4 text-violet-500 shrink-0" />
                                                                    <span>Code sent to <span className="font-semibold text-violet-700">{maskedEmail}</span>. Check your inbox (and spam folder).</span>
                                                                </div>

                                                                {/* OTP boxes */}
                                                                <div>
                                                                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3 block">Enter 6-digit code</Label>
                                                                    <div className="flex gap-1.5 sm:gap-2.5" onPaste={handleOtpPaste}>
                                                                        {otpDigits.map((d, i) => (
                                                                            <input
                                                                                key={i}
                                                                                ref={el => { otpRefs.current[i] = el; }}
                                                                                type="text" inputMode="numeric" maxLength={1}
                                                                                value={d}
                                                                                onChange={e => handleOtpInput(i, e.target.value)}
                                                                                onKeyDown={e => handleOtpKeyDown(i, e)}
                                                                                className={`w-9 h-10 sm:w-11 sm:h-12 text-center text-base sm:text-lg font-bold rounded-xl border-2 outline-none transition-all duration-150 bg-white ${d ? 'border-violet-500 text-violet-700 shadow-sm shadow-violet-100' : 'border-slate-200 text-gray-800'
                                                                                    } focus:border-violet-500 focus:ring-2 focus:ring-violet-100`}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                <Separator />

                                                                {/* New password */}
                                                                <div className="space-y-2">
                                                                    <Label className="text-sm font-semibold text-gray-700">New Password</Label>
                                                                    <div className="relative">
                                                                        <Input type={showOtpPw.new ? 'text' : 'password'}
                                                                            value={otpNewPw.newPassword}
                                                                            onChange={e => setOtpNewPw(f => ({ ...f, newPassword: e.target.value }))}
                                                                            placeholder="Min. 6 characters"
                                                                            className="pr-10 border-slate-200"
                                                                        />
                                                                        <button type="button" onClick={() => setShowOtpPw(s => ({ ...s, new: !s.new }))}
                                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                                            {showOtpPw.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                                        </button>
                                                                    </div>
                                                                    {otpNewPw.newPassword && (
                                                                        <div className="pt-0.5 space-y-1">
                                                                            <div className="flex gap-1 h-1">
                                                                                {[0, 1, 2, 3].map(i => (
                                                                                    <div key={i} className={`flex-1 rounded-full transition-colors duration-200 ${i < otpPwStrength ? ['bg-slate-200', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-500'][otpPwStrength] : 'bg-slate-200'}`} />
                                                                                ))}
                                                                            </div>
                                                                            <p className="text-[11px] text-slate-400">{['Too weak', 'Weak', 'Fair', 'Strong', 'Very Strong'][otpPwStrength]}</p>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <Label className="text-sm font-semibold text-gray-700">Confirm New Password</Label>
                                                                    <div className="relative">
                                                                        <Input type={showOtpPw.confirm ? 'text' : 'password'}
                                                                            value={otpNewPw.confirmPassword}
                                                                            onChange={e => setOtpNewPw(f => ({ ...f, confirmPassword: e.target.value }))}
                                                                            placeholder="Re-enter new password"
                                                                            className={`pr-10 border-slate-200 transition-colors ${otpNewPw.confirmPassword && otpNewPw.newPassword !== otpNewPw.confirmPassword ? 'border-red-300 bg-red-50/30' :
                                                                                otpNewPw.confirmPassword && otpNewPw.newPassword === otpNewPw.confirmPassword ? 'border-emerald-300 bg-emerald-50/30' : ''
                                                                                }`}
                                                                        />
                                                                        <button type="button" onClick={() => setShowOtpPw(s => ({ ...s, confirm: !s.confirm }))}
                                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                                            {showOtpPw.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                                        </button>
                                                                    </div>
                                                                    {otpNewPw.confirmPassword && otpNewPw.newPassword !== otpNewPw.confirmPassword && (
                                                                        <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Passwords do not match</p>
                                                                    )}
                                                                </div>

                                                                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                                                    <Button onClick={handleResetWithOtp}
                                                                        disabled={enteredOtp.length < 6 || !otpNewPw.newPassword || !otpNewPw.confirmPassword}
                                                                        className="flex-1 bg-violet-600 hover:bg-violet-700 text-white gap-2"
                                                                    >
                                                                        <Lock className="w-4 h-4" /> Reset Password
                                                                    </Button>
                                                                    <Button variant="ghost" size="sm"
                                                                        onClick={() => otpResendCooldown <= 0 ? handleSendOtp() : undefined}
                                                                        disabled={otpResendCooldown > 0}
                                                                        className="text-slate-500 gap-1.5"
                                                                    >
                                                                        <RefreshCw className="w-3.5 h-3.5" />
                                                                        {otpResendCooldown > 0 ? `Resend in ${otpResendCooldown}s` : 'Resend Code'}
                                                                    </Button>
                                                                </div>
                                                            </motion.div>
                                                        )}

                                                        {/* Step: resetting spinner */}
                                                        {otpStep === 'resetting' && (
                                                            <motion.div key="resetting"
                                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                                className="flex items-center gap-3 py-2"
                                                            >
                                                                <div className="w-5 h-5 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
                                                                <span className="text-sm text-gray-500">Verifying code and updating password…</span>
                                                            </motion.div>
                                                        )}

                                                        {/* Step: done */}
                                                        {otpStep === 'done' && (
                                                            <motion.div key="done"
                                                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                                                transition={{ duration: 0.25, type: 'spring', stiffness: 260, damping: 20 }}
                                                                className="flex flex-col items-center text-center gap-3 py-4"
                                                            >
                                                                <h3 className="text-lg font-bold text-gray-900">Password Updated!</h3>
                                                                <p className="text-sm text-gray-500 max-w-xs">Your password has been reset successfully. Use it the next time you log in.</p>
                                                                <Button variant="outline" size="sm" onClick={() => setOtpStep('idle')}
                                                                    className="mt-1 text-slate-600 border-slate-200"
                                                                >
                                                                    Close
                                                                </Button>
                                                            </motion.div>
                                                        )}

                                                    </AnimatePresence>
                                                </CardContent>
                                            </Card>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── Account Tab ───────────────────────────────────────────── */}
                                {activeTab === 'account' && (
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
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </Tabs>
                </div>
            </div>
        </>
    );
};

export default MyProfile;