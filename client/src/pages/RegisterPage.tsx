import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import SEO from "@/components/SEO";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, User, Mail, Lock, Phone, Globe, X } from "lucide-react";

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationType, setRegistrationType] = useState("email");

  const [emailFormData, setEmailFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [phoneFormData, setPhoneFormData] = useState({
    firstName: "",
    lastName: "",
    countryCode: "+91",
    phoneNumber: "",
    password: "",
    confirmPassword: ""
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

  const registerMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; email?: string; phone?: string; password: string }) => {
      return await apiRequest("POST", "/api/auth/register", data);
    },
    onSuccess: () => {
      toast({
        title: "Registration Successful",
        description: "Your account has been created. You can now login.",
      });
      setLocation("/login");
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (emailFormData.password !== emailFormData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (emailFormData.password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate({
      firstName: emailFormData.firstName,
      lastName: emailFormData.lastName,
      email: emailFormData.email,
      password: emailFormData.password,
    });
  };
  const handleClose = () => {
    setIsOpen(false);
    // Go back to previous page or home
    window.history.length > 1 ? window.history.back() : setLocation("/");
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (phoneFormData.password !== phoneFormData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (phoneFormData.password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long",
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
    registerMutation.mutate({
      firstName: phoneFormData.firstName,
      lastName: phoneFormData.lastName,
      phone: fullPhone,
      password: phoneFormData.password,
    });
  };

  return (
    <>
      <SEO
        title="Create Account"
        description="Create your A2Z BOOKSHOP account. Join our community of book lovers and enjoy exclusive benefits, personalized recommendations, and more."
        keywords="register, sign up, create account, new account"
        url="https://a2zbookshop.com/register"
        type="website"
      />
      <div className="fixed inset-0 bg-gradient-to-br from-primary-aqua/10 via-blue-50/50 to-purple-100/30 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -left-1/2 w-96 h-96 bg-primary-aqua/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-1/2 -right-1/2 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="w-full max-w-lg space-y-3 sm:space-y-6 relative z-10 my-4 sm:my-8">
          <Button
            onClick={handleClose}
            variant="ghost"
            size="icon"
            className="absolute right-8 top-12 z-10 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-lg hover:shadow-xl transition-all hover:scale-110"
          >
            <X className="h-5 w-5 text-gray-700" />
          </Button>
          <Card className="shadow-2xl border-2 border-white/50 overflow-hidden backdrop-blur-xl bg-white/90 rounded-2xl transform transition-all duration-300 hover:shadow-3xl">
            <CardHeader className="relative space-y-3 text-center text-white rounded-t-2xl py-10 px-6 overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(188, 100%, 29%) 0%, hsl(188, 100%, 26%) 50%, hsl(188, 79%, 38%) 100%)' }}>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>

              <div className="relative">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-4 shadow-lg">
                  <User className="h-8 w-8 text-white drop-shadow-lg" />
                </div>
                <CardTitle className="text-4xl font-extrabold text-white drop-shadow-lg">
                  Join Us Today!
                </CardTitle>
                <p className="text-white/95 text-base font-medium mt-3 drop-shadow-md">
                  Create your A2Z BOOKSHOP account
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-8">
              <Tabs value={registrationType} onValueChange={setRegistrationType} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-8 bg-gray-100 p-1 rounded-xl">
                  <TabsTrigger value="email" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">
                    <Mail className="h-4 w-4" />
                    <span className="font-semibold">Email</span>
                  </TabsTrigger>
                  <TabsTrigger value="phone" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">
                    <Phone className="h-4 w-4" />
                    <span className="font-semibold">Phone</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="email" className="space-y-4 sm:space-y-5">
                  <form onSubmit={handleEmailSubmit} className="space-y-4 sm:space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">First Name</Label>
                        <Input
                          id="firstName"
                          type="text"
                          value={emailFormData.firstName}
                          onChange={(e) => setEmailFormData(prev => ({ ...prev, firstName: e.target.value }))}
                          className="h-12 border-2 border-gray-200 rounded-xl focus:border-primary-aqua focus:ring-2 focus:ring-primary-aqua/20 transition-all"
                          placeholder="John"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">Last Name</Label>
                        <Input
                          id="lastName"
                          type="text"
                          value={emailFormData.lastName}
                          onChange={(e) => setEmailFormData(prev => ({ ...prev, lastName: e.target.value }))}
                          className="h-12 border-2 border-gray-200 rounded-xl focus:border-primary-aqua focus:ring-2 focus:ring-primary-aqua/20 transition-all"
                          placeholder="Doe"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</Label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-aqua transition-colors" />
                        <Input
                          id="email"
                          type="email"
                          value={emailFormData.email}
                          onChange={(e) => setEmailFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="pl-12 h-12 border-2 border-gray-200 rounded-xl focus:border-primary-aqua focus:ring-2 focus:ring-primary-aqua/20 transition-all"
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
                          type={showPassword ? "text" : "password"}
                          value={emailFormData.password}
                          onChange={(e) => setEmailFormData(prev => ({ ...prev, password: e.target.value }))}
                          className="pl-12 pr-12 h-12 border-2 border-gray-200 rounded-xl focus:border-primary-aqua focus:ring-2 focus:ring-primary-aqua/20 transition-all"
                          placeholder="At least 6 characters"
                          required
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-gray-100 rounded-lg transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">Confirm Password</Label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-aqua transition-colors" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={emailFormData.confirmPassword}
                          onChange={(e) => setEmailFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="pl-12 pr-12 h-12 border-2 border-gray-200 rounded-xl focus:border-primary-aqua focus:ring-2 focus:ring-primary-aqua/20 transition-all"
                          placeholder="Repeat your password"
                          required
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-gray-100 rounded-lg transition-colors"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                        </Button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={registerMutation.isPending}
                      className="w-full h-12 bg-gradient-to-r from-primary-aqua to-secondary-aqua hover:from-secondary-aqua hover:to-primary-aqua text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                    >
                      {registerMutation.isPending ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating Account...
                        </span>
                      ) : "Create Account with Email"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="phone" className="space-y-4 sm:space-y-5">
                  <form onSubmit={handlePhoneSubmit} className="space-y-4 sm:space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phoneFirstName" className="text-sm font-semibold text-gray-700">First Name</Label>
                        <Input
                          id="phoneFirstName"
                          type="text"
                          value={phoneFormData.firstName}
                          onChange={(e) => setPhoneFormData(prev => ({ ...prev, firstName: e.target.value }))}
                          className="h-12 border-2 border-gray-200 rounded-xl focus:border-primary-aqua focus:ring-2 focus:ring-primary-aqua/20 transition-all"
                          placeholder="John"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phoneLastName" className="text-sm font-semibold text-gray-700">Last Name</Label>
                        <Input
                          id="phoneLastName"
                          type="text"
                          value={phoneFormData.lastName}
                          onChange={(e) => setPhoneFormData(prev => ({ ...prev, lastName: e.target.value }))}
                          className="h-12 border-2 border-gray-200 rounded-xl focus:border-primary-aqua focus:ring-2 focus:ring-primary-aqua/20 transition-all"
                          placeholder="Doe"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">Phone Number</Label>
                      <div className="flex gap-2">
                        <select
                          value={phoneFormData.countryCode}
                          onChange={(e) => setPhoneFormData(prev => ({ ...prev, countryCode: e.target.value }))}
                          className="flex h-12 w-32 rounded-xl border-2 border-gray-200 bg-white px-3 py-1 text-sm font-medium transition-all focus:outline-none focus:border-primary-aqua focus:ring-2 focus:ring-primary-aqua/20"
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
                            id="phone"
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
                      <p className="text-xs text-gray-500 mt-1 ml-1">
                        📱 {phoneFormData.countryCode}{phoneFormData.phoneNumber}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phonePassword" className="text-sm font-semibold text-gray-700">Password</Label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-aqua transition-colors" />
                        <Input
                          id="phonePassword"
                          type={showPassword ? "text" : "password"}
                          value={phoneFormData.password}
                          onChange={(e) => setPhoneFormData(prev => ({ ...prev, password: e.target.value }))}
                          className="pl-12 pr-12 h-12 border-2 border-gray-200 rounded-xl focus:border-primary-aqua focus:ring-2 focus:ring-primary-aqua/20 transition-all"
                          placeholder="At least 6 characters"
                          required
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-gray-100 rounded-lg transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phoneConfirmPassword" className="text-sm font-semibold text-gray-700">Confirm Password</Label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-aqua transition-colors" />
                        <Input
                          id="phoneConfirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={phoneFormData.confirmPassword}
                          onChange={(e) => setPhoneFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="pl-12 pr-12 h-12 border-2 border-gray-200 rounded-xl focus:border-primary-aqua focus:ring-2 focus:ring-primary-aqua/20 transition-all"
                          placeholder="Repeat your password"
                          required
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-gray-100 rounded-lg transition-colors"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                        </Button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={registerMutation.isPending}
                      className="w-full h-12 bg-gradient-to-r from-primary-aqua to-secondary-aqua hover:from-secondary-aqua hover:to-primary-aqua text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                    >
                      {registerMutation.isPending ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating Account...
                        </span>
                      ) : "Create Account with Phone"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t-2 border-gray-200"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-gray-500 font-semibold">Already a member?</span>
                  </div>
                </div>

                <div className="text-center">
                  <Link href="/login" className="inline-flex items-center gap-1 text-primary-aqua hover:text-secondary-aqua font-bold hover:underline transition-colors">
                    Sign in here
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-2 sm:mt-4">
            <Link href="/" className="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-white/50 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}