import React, { useState } from "react";
import { Link } from "wouter";
import { ChevronRight, MapPin, Phone, Mail, Clock } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
// Removed Select components to fix runtime error
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

interface StoreSettings {
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

export default function ContactPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ContactForm>({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: "",
  });

  // Fetch public store information for contact details
  const { data: storeInfo } = useQuery<{
    storeName: string;
    storeEmail: string;
    storePhone?: string;
    storeAddress?: string;
  }>({
    queryKey: ["/api/store-info"],
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactForm) => {
      await apiRequest("POST", "/api/contact", data);
    },
    onSuccess: () => {
      toast({
        title: "Message sent!",
        description: "Thank you for your message. We'll get back to you soon.",
      });
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        subject: "",
        message: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    contactMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Layout>
      <div className="container-custom py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-secondary-black">
            <Link href="/" className="hover:text-primary-aqua">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span>Contact</span>
          </div>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <h1 className="text-3xl font-bookerly font-bold text-base-black mb-6">Get in Touch</h1>
            <p className="text-secondary-black mb-8">
              Have a question about a book, need help with an order, or looking for something specific? 
              We'd love to hear from you!
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-base-black font-semibold">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className="mt-1 focus:border-primary-aqua"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-base-black font-semibold">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className="mt-1 focus:border-primary-aqua"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-base-black font-semibold">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="mt-1 focus:border-primary-aqua"
                />
              </div>

              <div>
                <Label htmlFor="subject" className="text-base-black font-semibold">
                  Subject *
                </Label>
                <select
                  id="subject"
                  required
                  value={formData.subject}
                  onChange={(e) => handleInputChange("subject", e.target.value)}
                  className="mt-1 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:border-primary-aqua"
                >
                  <option value="" disabled>Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="order">Order Question</option>
                  <option value="book-request">Book Request</option>
                  <option value="technical">Technical Issue</option>
                  <option value="feedback">Feedback</option>
                  <option value="partnership">Partnership Inquiry</option>
                </select>
              </div>

              <div>
                <Label htmlFor="message" className="text-base-black font-semibold">
                  Message *
                </Label>
                <Textarea
                  id="message"
                  rows={5}
                  required
                  placeholder="How can we help you?"
                  value={formData.message}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                  className="mt-1 focus:border-primary-aqua resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={contactMutation.isPending}
                className="bg-primary-aqua hover:bg-secondary-aqua text-white px-8 py-3"
              >
                {contactMutation.isPending ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-bookerly font-bold text-base-black mb-6">Contact Information</h2>
            
            <div className="space-y-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-aqua/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-6 w-6 text-primary-aqua" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base-black mb-1">Address</h3>
                      <p className="text-secondary-black whitespace-pre-line">
                        {storeInfo?.storeAddress || "123 Book Street\nLiterary District\nBooktown, BT 12345\nEurope"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-aqua/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="h-6 w-6 text-primary-aqua" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base-black mb-1">Phone</h3>
                      <p className="text-secondary-black">{storeInfo?.storePhone || "+31 (20) 123-BOOK"}</p>
                      <p className="text-xs text-tertiary-black">Mon-Fri: 9 AM - 6 PM CET</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-aqua/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="h-6 w-6 text-primary-aqua" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base-black mb-1">Email</h3>
                      <p className="text-secondary-black">{storeInfo?.storeEmail || "hello@a2zbookshop.com"}</p>
                      <p className="text-xs text-tertiary-black">We respond within 24 hours</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-aqua/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="h-6 w-6 text-primary-aqua" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base-black mb-1">Business Hours</h3>
                      <div className="text-secondary-black text-sm space-y-1">
                        <p>Monday - Friday: 9 AM - 6 PM</p>
                        <p>Saturday: 10 AM - 4 PM</p>
                        <p>Sunday: Closed</p>
                        <p className="text-xs text-tertiary-black mt-2">All times in Central European Time (CET)</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mb-8">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
                alt="Book consultation atmosphere"
                className="rounded-lg shadow-lg w-full h-auto"
              />
            </div>

            {/* FAQ Section */}
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-base-black mb-2">Do you ship internationally?</h4>
                  <p className="text-secondary-black text-sm">Yes, we ship to over 50 countries worldwide with tracking and insurance.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-base-black mb-2">How do you grade book conditions?</h4>
                  <p className="text-secondary-black text-sm">We follow industry standards: New, Like New, Very Good, Good, and Fair conditions.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-base-black mb-2">Can you help find a specific book?</h4>
                  <p className="text-secondary-black text-sm">Absolutely! Send us a book request and we'll do our best to locate it for you.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
