import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import SEO from "@/components/SEO";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, EyeOff, Mail, Lock, Phone, LogIn, X } from "lucide-react";

export default function LoginPage() {
  const params = new URLSearchParams(window.location.search);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { setIsAuthTransitioning } = useGlobalContext();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [showPhonePassword, setShowPhonePassword] = useState(false);
  const [loginType, setLoginType] = useState("email");

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState("");
  const [isForgotDialogOpen, setIsForgotDialogOpen] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const redirect = params.get("redirect") || "/";

  // If user is already logged in, redirect them away from login page
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      setLocation(redirect);
    }
  }, [authLoading, isAuthenticated, redirect, setLocation]);

  // Handle OAuth errors from URL parameters
  useEffect(() => {
    const error = params.get("error");
    if (error) {
      let errorMessage = "Authentication failed. Please try again.";
      if (error === "google_auth_failed") {
        errorMessage = "Google authentication failed. Please try again or use email/phone login.";
      } else if (error === "facebook_auth_failed") {
        errorMessage = "Facebook authentication failed. Please try again or use email/phone login.";
      }
      
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Clean up the URL by removing the error parameter
      const newUrl = window.location.pathname + (redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : "");
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  // Handle closing the modal - always go to home for guests
  const handleClose = () => {
    setLocation("/");
  };

  // Ensure modal is open when component mounts
  const [emailFormData, setEmailFormData] = useState({
    email: "",
    password: ""
  });

  const [phoneFormData, setPhoneFormData] = useState({
    countryCode: "+91",
    phoneNumber: "",
    password: ""
  });

  const countries = [
    { code: "+1", name: "US/Canada", flag: "🇺🇸" },
    { code: "+91", name: "India", flag: "🇮🇳" },
    { code: "+44", name: "UK", flag: "🇬🇧" },
    { code: "+33", name: "France", flag: "🇫🇷" },
    { code: "+49", name: "Germany", flag: "🇩🇪" },
    { code: "+86", name: "China", flag: "🇨🇳" },
    { code: "+81", name: "Japan", flag: "🇯🇵" },
    { code: "+61", name: "Australia", flag: "🇦🇺" },
    { code: "+55", name: "Brazil", flag: "🇧🇷" },
    { code: "+34", name: "Spain", flag: "🇪🇸" },
    { code: "+39", name: "Italy", flag: "🇮🇹" },
    { code: "+7", name: "Russia", flag: "🇷🇺" },
    { code: "+82", name: "South Korea", flag: "🇰🇷" },
    { code: "+52", name: "Mexico", flag: "🇲🇽" },
    { code: "+31", name: "Netherlands", flag: "🇳🇱" },
  ];

  const loginMutation = useMutation({
    mutationFn: async (data: { email?: string; phone?: string; password: string }) => {
      return await apiRequest("POST", "/api/auth/login", data);
    },
    onSuccess: async () => {
      setIsAuthTransitioning(true);
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsAuthTransitioning(false);
      setLocation(redirect);
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailFormData.email || !emailFormData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    loginMutation.mutate({
      email: emailFormData.email,
      password: emailFormData.password,
    });
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneFormData.phoneNumber || !phoneFormData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (phoneFormData.phoneNumber.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    const fullPhone = `${phoneFormData.countryCode}${phoneFormData.phoneNumber}`;
    loginMutation.mutate({
      phone: fullPhone,
      password: phoneFormData.password,
    });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!forgotEmail) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    setIsSendingReset(true);

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Password Reset Email Sent",
          description: "If an account with that email exists, a password reset link has been sent.",
        });
        setForgotEmail("");
        setIsForgotDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to send password reset email",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Password reset error:", error);
      toast({
        title: "Error",
        description: "Failed to send password reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <>
      <SEO
        title="Login"
        description="Sign in to your A2Z BOOKSHOP account. Access your orders, wishlist, and personalized recommendations."
        url="https://a2zbookshop.com/login"
        type="website"
        noindex
      />
      <div className="fixed inset-0 bg-gradient-to-br from-primary-aqua/10 via-blue-50/50 to-purple-100/30 backdrop-blur-md z-50 overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 md:p-6">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-1/2 -left-1/2 w-96 h-96 bg-primary-aqua/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-1/2 -right-1/2 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>

          <div className="w-full max-w-lg space-y-1 sm:space-y-3 relative z-10 my-4 sm:my-8">
            <Card className="shadow-2xl border-2 border-white/50 overflow-hidden backdrop-blur-xl bg-white/90 rounded-xl sm:rounded-2xl transform transition-all duration-300 hover:shadow-3xl">
              <CardHeader className="relative space-y-2 sm:space-y-2 text-center text-white rounded-t-xl sm:rounded-t-2xl py-6 px-4 sm:px-6 overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(188, 100%, 29%) 0%, hsl(188, 100%, 26%) 50%, hsl(188, 79%, 38%) 100%)' }}>
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>
                <div className="flex justify-between items-center">
                  <Link href="/" className="inline-flex items-center gap-2 text-xs sm:text-sm text-white hover:text-gray-900 font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-white/50 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Home
                  </Link>

                  <Button
                    onClick={handleClose}
                    variant="ghost"
                    size="icon"
                    className=" z-10 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/90 hover:bg-white shadow-lg hover:shadow-xl transition-all hover:scale-110"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
                  </Button>
                </div>
                <div className="relative">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white backdrop-blur-sm mb-2 sm:mb-4 shadow-lg overflow-hidden">
                    <img src="/favicon.jpeg" alt="A2Z Bookshop Logo" className="w-full h-full object-contain" />
                  </div>
                  <CardTitle className="text-2xl sm:text-4xl font-extrabold text-white drop-shadow-lg">
                    Welcome Back!
                  </CardTitle>
                  <p className="text-white/95 text-sm sm:text-base font-medium mt-2 sm:mt-3 drop-shadow-md">
                    ✨ Sign in to access your bookshelf
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-8">
                <Tabs value={loginType} onValueChange={setLoginType} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-8 bg-gray-100 p-1 rounded-full">
                    <TabsTrigger value="email" className="flex items-center gap-2 rounded-full data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">
                      <Mail className="h-4 w-4" />
                      <span className="font-semibold">Email</span>
                    </TabsTrigger>
                    <TabsTrigger value="phone" className="flex items-center gap-2 rounded-full data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">
                      <Phone className="h-4 w-4" />
                      <span className="font-semibold">Phone</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="email" className="mt-16 sm:mt-0 space-y-4 sm:space-y-5">
                    <form onSubmit={handleEmailSubmit} className="space-y-4 sm:space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</Label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-aqua transition-colors" />
                          <Input
                            id="email"
                            type="email"
                            value={emailFormData.email}
                            onChange={(e) => setEmailFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="pl-12 h-10 sm:h-12 border-2 border-gray-200 rounded-xl focus:border-primary-aqua focus:ring-2 focus:ring-primary-aqua/20 transition-all"
                            placeholder="your.email@example.com"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-aqua transition-colors" />
                          <Input
                            id="password"
                            type={showEmailPassword ? "text" : "password"}
                            value={emailFormData.password}
                            onChange={(e) => setEmailFormData(prev => ({ ...prev, password: e.target.value }))}
                            className="pl-12 pr-12 h-10 sm:h-12 border-2 border-gray-200 rounded-xl focus:border-primary-aqua focus:ring-2 focus:ring-primary-aqua/20 transition-all"
                            placeholder="Enter your password"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-gray-100 rounded-full transition-colors"
                            onClick={() => setShowEmailPassword(!showEmailPassword)}
                          >
                            {showEmailPassword ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                          </Button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={loginMutation.isPending}
                        className="w-full h-12 bg-gradient-to-r from-primary-aqua to-secondary-aqua hover:from-secondary-aqua hover:to-primary-aqua text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                      >
                        {loginMutation.isPending ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Signing in...
                          </span>
                        ) : "Sign In with Email"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="phone" className="mt-16 sm:mt-0 space-y-4 sm:space-y-5">
                    <form onSubmit={handlePhoneSubmit} className="space-y-4 sm:space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="phoneLogin" className="text-sm font-semibold text-gray-700">Phone Number</Label>
                        <div className="flex gap-2">
                          <select
                            value={phoneFormData.countryCode}
                            onChange={(e) => setPhoneFormData(prev => ({ ...prev, countryCode: e.target.value }))}
                            className="flex h-10 sm:h-12 w-28 sm:w-32 rounded-xl border-2 border-gray-200 bg-white px-2 sm:px-3 py-1 text-sm font-medium transition-all focus:outline-none focus:border-primary-aqua focus:ring-2 focus:ring-primary-aqua/20"
                          >
                            {countries.map((country) => (
                              <option key={country.code} value={country.code}>
                                {country.flag} {country.code}
                              </option>
                            ))}
                          </select>
                          <div className="relative flex-1 group">
                            <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-aqua transition-colors" />
                            <Input
                              id="phoneLogin"
                              type="tel"
                              value={phoneFormData.phoneNumber}
                              onChange={(e) => setPhoneFormData(prev => ({ ...prev, phoneNumber: e.target.value.replace(/\D/g, '') }))}
                              className="pl-12 h-12 border-2 border-gray-200 rounded-xl focus:border-primary-aqua focus:ring-2 focus:ring-primary-aqua/20 transition-all"
                              placeholder="1234567890"
                              required
                              minLength={10}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phonePassword" className="text-sm font-semibold text-gray-700">Password</Label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-aqua transition-colors" />
                          <Input
                            id="phonePassword"
                            type={showPhonePassword ? "text" : "password"}
                            value={phoneFormData.password}
                            onChange={(e) => setPhoneFormData(prev => ({ ...prev, password: e.target.value }))}
                            className="pl-12 pr-12 h-10 sm:h-12 border-2 border-gray-200 rounded-xl focus:border-primary-aqua focus:ring-2 focus:ring-primary-aqua/20 transition-all"
                            placeholder="Enter your password"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-gray-100 rounded-full transition-colors"
                            onClick={() => setShowPhonePassword(!showPhonePassword)}
                          >
                            {showPhonePassword ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                          </Button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={loginMutation.isPending}
                        className="w-full h-12 bg-gradient-to-r from-primary-aqua to-secondary-aqua hover:from-secondary-aqua hover:to-primary-aqua text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                      >
                        {loginMutation.isPending ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Signing in...
                          </span>
                        ) : "Sign In with Phone"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                {/* OAuth Login Buttons */}
                <div className="mt-6 sm:mt-8 space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t-2 border-gray-200"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-3 text-gray-500 font-semibold">Or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 border-2 border-gray-200 hover:border-red-500 hover:bg-red-50 rounded-xl transition-all font-semibold text-gray-700 hover:text-red-600"
                      onClick={() => {
                        const params = new URLSearchParams(window.location.search);
                        const redirect = params.get("redirect") || "/";
                        window.location.href = `/api/auth/google?redirect=${encodeURIComponent(redirect)}`;
                      }}
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 border-2 border-gray-200 hover:border-blue-600 hover:bg-blue-50 rounded-xl transition-all font-semibold text-gray-700 hover:text-blue-600"
                      onClick={() => {
                        const params = new URLSearchParams(window.location.search);
                        const redirect = params.get("redirect") || "/";
                        window.location.href = `/api/auth/facebook?redirect=${encodeURIComponent(redirect)}`;
                      }}
                    >
                      <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Facebook
                    </Button>
                  </div>
                </div>

                <div className="mt-6 sm:mt-8 space-y-2">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t-2 border-gray-200"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className=" px-3 text-gray-500 font-semibold">Or</span>
                    </div>
                  </div>

                  <Dialog open={isForgotDialogOpen} onOpenChange={setIsForgotDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full h-10 sm:h-11 border-2 border-gray-200 hover:border-primary-aqua hover:bg-primary-aqua/5 rounded-xl transition-all font-semibold text-gray-700 hover:text-primary-aqua">
                        Forgot your password?
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                          Enter your email address and we'll send you a link to reset your password.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div>
                          <Label htmlFor="forgot-email">Email Address</Label>
                          <Input
                            id="forgot-email"
                            type="email"
                            placeholder="Enter your email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsForgotDialogOpen(false)}
                            className="flex-1 rounded-xl"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={isSendingReset}
                            className="rounded-xl flex-1 bg-primary-aqua hover:bg-secondary-aqua"
                          >
                            {isSendingReset ? "Sending..." : "Send Reset Link"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <div className="pt-2 border-t-2 border-gray-100">
                    <p className="text-sm text-gray-600 text-center">
                      Don't have an account?{"    "}
                      <Link href="/register" className="text-primary-aqua hover:text-secondary-aqua font-bold hover:underline inline-flex items-center gap-1 transition-colors">
                        Create one here
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Link>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}