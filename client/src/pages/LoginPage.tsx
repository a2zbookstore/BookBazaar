import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import SEO from "@/components/SEO";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, EyeOff, Mail, Lock, Phone, LogIn, X } from "lucide-react";

export default function LoginPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState("email");
  const [isOpen, setIsOpen] = useState(true);
  
  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState("");
  const [isForgotDialogOpen, setIsForgotDialogOpen] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  // Handle closing the modal
  const handleClose = () => {
    setIsOpen(false);
    // Go back to previous page or home
    window.history.length > 1 ? window.history.back() : setLocation("/");
  };

  // Ensure modal is open when component mounts
  useEffect(() => {
    setIsOpen(true);
  }, []);
  
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
    onSuccess: () => {
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      // Invalidate auth queries and redirect
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
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
        keywords="login, sign in, customer account, user login"
        url="https://a2zbookshop.com/login"
        type="website"
      />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-lg space-y-6 relative">
          <Button
            onClick={handleClose}
            variant="ghost"
            size="icon"
            className="absolute right-2 top-8 z-10 h-10 w-10 hover:rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </Button>

          <Card className="shadow-2xl border-0 overflow-hidden">
            <CardHeader className="space-y-3 text-center text-white rounded-t-lg py-8 px-6" style={{ background: 'linear-gradient(135deg, rgb(41, 128, 185) 0%, rgb(52, 152, 219) 100%)' }}>
              <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3 text-white">
                <LogIn className="h-7 w-7 text-white" />
                Welcome Back
              </CardTitle>
              <p className="text-white text-lg font-semibold mt-2">Sign in to your A2Z BOOKSHOP account</p>
            </CardHeader>
          <CardContent className="p-6">
            <Tabs value={loginType} onValueChange={setLoginType} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-4">
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={emailFormData.email}
                        onChange={(e) => setEmailFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="pl-10"
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={emailFormData.password}
                        onChange={(e) => setEmailFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="pl-10 pr-10"
                        placeholder="Enter your password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loginMutation.isPending}
                    className="w-full bg-primary-aqua hover:bg-secondary-aqua"
                  >
                    {loginMutation.isPending ? "Signing in..." : "Sign In with Email"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="phone" className="space-y-4">
                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="phoneLogin">Phone Number</Label>
                    <div className="flex gap-2">
                      <select
                        value={phoneFormData.countryCode}
                        onChange={(e) => setPhoneFormData(prev => ({ ...prev, countryCode: e.target.value }))}
                        className="flex h-9 w-32 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {countries.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.flag} {country.code}
                          </option>
                        ))}
                      </select>
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="phoneLogin"
                          type="tel"
                          value={phoneFormData.phoneNumber}
                          onChange={(e) => setPhoneFormData(prev => ({ ...prev, phoneNumber: e.target.value.replace(/\D/g, '') }))}
                          className="pl-10"
                          placeholder="1234567890"
                          required
                          minLength={10}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {phoneFormData.countryCode}{phoneFormData.phoneNumber}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="phonePassword">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="phonePassword"
                        type={showPassword ? "text" : "password"}
                        value={phoneFormData.password}
                        onChange={(e) => setPhoneFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="pl-10 pr-10"
                        placeholder="Enter your password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loginMutation.isPending}
                    className="w-full bg-primary-aqua hover:bg-secondary-aqua"
                  >
                    {loginMutation.isPending ? "Signing in..." : "Sign In with Phone"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center space-y-3">
              <Dialog open={isForgotDialogOpen} onOpenChange={setIsForgotDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="link" className="text-sm text-gray-600 hover:text-gray-900 p-0">
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
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSendingReset}
                        className="flex-1 bg-primary-aqua hover:bg-secondary-aqua"
                      >
                        {isSendingReset ? "Sending..." : "Send Reset Link"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link href="/register" className="text-primary-aqua hover:underline font-medium">
                  Create one here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}