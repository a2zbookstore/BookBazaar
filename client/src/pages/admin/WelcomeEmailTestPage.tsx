import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, Eye, User, Phone } from "lucide-react";

export default function WelcomeEmailTestPage() {
  const { toast } = useToast();
  
  const [emailFormData, setEmailFormData] = useState({
    firstName: "John",
    lastName: "Doe", 
    email: "john.doe@example.com",
    authProvider: "email"
  });

  const [phoneFormData, setPhoneFormData] = useState({
    firstName: "Jane",
    lastName: "Smith",
    phone: "+91-9876543210",
    authProvider: "phone"
  });

  const [previewData, setPreviewData] = useState(null);

  const sendTestEmailMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/admin/test-welcome-email", data);
    },
    onSuccess: () => {
      toast({
        title: "Test Email Sent",
        description: "Welcome email has been sent successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send test email",
        variant: "destructive",
      });
    },
  });

  const generatePreviewMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/admin/preview-welcome-email", data);
    },
    onSuccess: (response) => {
      setPreviewData(response.html);
    },
    onError: (error: any) => {
      toast({
        title: "Preview Failed",
        description: error.message || "Failed to generate preview",
        variant: "destructive",
      });
    },
  });

  const handleSendTestEmail = (userData: any) => {
    sendTestEmailMutation.mutate({ user: userData });
  };

  const handleGeneratePreview = (userData: any) => {
    generatePreviewMutation.mutate({ user: userData });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome Email Generator</h1>
        <p className="text-gray-600">Test and preview personalized welcome emails for new registrations</p>
      </div>

      <Tabs defaultValue="test" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="test">Test Email</TabsTrigger>
          <TabsTrigger value="preview">Email Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Email Registration Test */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Registration Welcome
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="emailFirstName">First Name</Label>
                  <Input
                    id="emailFirstName"
                    value={emailFormData.firstName}
                    onChange={(e) => setEmailFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="emailLastName">Last Name</Label>
                  <Input
                    id="emailLastName"
                    value={emailFormData.lastName}
                    onChange={(e) => setEmailFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={emailFormData.email}
                    onChange={(e) => setEmailFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleSendTestEmail(emailFormData)}
                    disabled={sendTestEmailMutation.isPending}
                    className="flex-1"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendTestEmailMutation.isPending ? "Sending..." : "Send Test Email"}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => handleGeneratePreview(emailFormData)}
                    disabled={generatePreviewMutation.isPending}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Phone Registration Test */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Phone Registration Welcome
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="phoneFirstName">First Name</Label>
                  <Input
                    id="phoneFirstName"
                    value={phoneFormData.firstName}
                    onChange={(e) => setPhoneFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="phoneLastName">Last Name</Label>
                  <Input
                    id="phoneLastName"
                    value={phoneFormData.lastName}
                    onChange={(e) => setPhoneFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={phoneFormData.phone}
                    onChange={(e) => setPhoneFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Phone-only registrations won't receive emails. 
                    Add an email address to the test data to send welcome emails to phone users.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleSendTestEmail({...phoneFormData, email: emailFormData.email})}
                    disabled={sendTestEmailMutation.isPending}
                    className="flex-1"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendTestEmailMutation.isPending ? "Sending..." : "Send Test Email"}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => handleGeneratePreview(phoneFormData)}
                    disabled={generatePreviewMutation.isPending}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Email Features */}
          <Card>
            <CardHeader>
              <CardTitle>Welcome Email Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900">Personalization</h4>
                  <p className="text-sm text-blue-700">Uses customer's name and registration method</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900">Mobile Responsive</h4>
                  <p className="text-sm text-green-700">Optimized for all devices and email clients</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900">A2Z Branding</h4>
                  <p className="text-sm text-purple-700">Consistent with website design and colors</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-900">Call-to-Action</h4>
                  <p className="text-sm text-orange-700">Encourages immediate browsing and shopping</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Preview</CardTitle>
              <p className="text-sm text-gray-600">
                Generate a preview using the test form above, or use the default preview below
              </p>
            </CardHeader>
            <CardContent>
              {previewData ? (
                <div className="border rounded-lg p-4 bg-white max-h-96 overflow-y-auto">
                  <div dangerouslySetInnerHTML={{ __html: previewData }} />
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No preview generated yet</p>
                  <p className="text-sm">Use the "Preview" button in the Test Email tab to generate a preview</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}