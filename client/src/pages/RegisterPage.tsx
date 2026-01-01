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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
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
                <User className="h-7 w-7 text-white" />
                Create Your Account
              </CardTitle>
              <p className="text-white text-lg font-semibold mt-2">Join A2Z BOOKSHOP community today!</p>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs value={registrationType} onValueChange={setRegistrationType} className="w-full">
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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          type="text"
                          value={emailFormData.firstName}
                          onChange={(e) => setEmailFormData(prev => ({ ...prev, firstName: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          type="text"
                          value={emailFormData.lastName}
                          onChange={(e) => setEmailFormData(prev => ({ ...prev, lastName: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

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
                          placeholder="At least 6 characters"
                          required
                          minLength={6}
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

                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={emailFormData.confirmPassword}
                          onChange={(e) => setEmailFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="pl-10 pr-10"
                          placeholder="Repeat your password"
                          required
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={registerMutation.isPending}
                      className="w-full bg-primary-aqua hover:bg-secondary-aqua"
                    >
                      {registerMutation.isPending ? "Creating Account..." : "Create Account with Email"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="phone" className="space-y-4">
                  <form onSubmit={handlePhoneSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phoneFirstName">First Name</Label>
                        <Input
                          id="phoneFirstName"
                          type="text"
                          value={phoneFormData.firstName}
                          onChange={(e) => setPhoneFormData(prev => ({ ...prev, firstName: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phoneLastName">Last Name</Label>
                        <Input
                          id="phoneLastName"
                          type="text"
                          value={phoneFormData.lastName}
                          onChange={(e) => setPhoneFormData(prev => ({ ...prev, lastName: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
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
                            id="phone"
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
                        Full number: {phoneFormData.countryCode}{phoneFormData.phoneNumber}
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
                          placeholder="At least 6 characters"
                          required
                          minLength={6}
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

                    <div>
                      <Label htmlFor="phoneConfirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="phoneConfirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={phoneFormData.confirmPassword}
                          onChange={(e) => setPhoneFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="pl-10 pr-10"
                          placeholder="Repeat your password"
                          required
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={registerMutation.isPending}
                      className="w-full bg-primary-aqua hover:bg-secondary-aqua"
                    >
                      {registerMutation.isPending ? "Creating Account..." : "Create Account with Phone"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary-aqua hover:underline font-medium">
                    Sign in here
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