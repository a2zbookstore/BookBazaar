import React, { useState } from "react";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import Breadcrumb from "@/components/Breadcrumb";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SiWhatsapp } from "react-icons/si";


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
  const { data: storeInfo, isLoading: isLoadingStoreInfo } = useQuery<{
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
      <SEO
        title="Contact Us"
        description="Get in touch with A2Z BOOKSHOP. Contact our customer service team for book inquiries, orders, shipping questions, or general assistance. We're here to help!"
        keywords="contact a2z bookshop, book store contact, customer service, book inquiries"
        url="https://a2zbookshop.com/contact"
        type="website"
      />
      <div className="container-custom py-8">
        <Breadcrumb items={[{ label: "Contact" }]} />

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
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
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={contactMutation.isPending}
                  variant="outline"
                  className="border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white rounded-xl"
                >
                  {contactMutation.isPending ? "Sending..." : "Send Message"}
                </Button>
              </div>

            </form>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-bookerly font-bold text-base-black mb-6">Contact Information</h2>

            {isLoadingStoreInfo ? (
              <div className="space-y-6 mb-8">
                {/* Address Skeleton */}
                <Card className="rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Skeleton className="w-12 h-12 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Phone Skeleton */}
                <Card className="rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Skeleton className="w-12 h-12 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Email Skeleton */}
                <Card className="rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Skeleton className="w-12 h-12 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-36" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Business Hours Skeleton */}
                <Card className="rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Skeleton className="w-12 h-12 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-6 mb-8">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeInfo?.storeAddress || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="rounded-xl hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary-aqua/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-6 w-6 text-primary-aqua" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-base-black mb-1">Address</h3>
                          <p className="text-secondary-black ">
                            {storeInfo?.storeAddress || "Address not available"}
                          </p>
                          <p className="text-xs text-tertiary-black">Click to view on map</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </a>

                <a
                  href={`tel:${storeInfo?.storePhone || ''}`}
                  className="block"
                >
                  <Card className="rounded-xl hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary-aqua/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <SiWhatsapp className="h-6 w-6 text-primary-aqua" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-base-black mb-1">Phone</h3>
                          <p className="text-secondary-black">{storeInfo?.storePhone || "Phone not available"}</p>
                          <p className="text-xs text-tertiary-black">Available 24/7 • Click to call</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </a>

                <a
                  href={`mailto:${storeInfo?.storeEmail || ''}`}
                  className="block"
                >
                  <Card className="rounded-xl hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary-aqua/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Mail className="h-6 w-6 text-primary-aqua" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-base-black mb-1">Email</h3>
                          <p className="text-secondary-black">{storeInfo?.storeEmail || "Email not available"}</p>
                          <p className="text-xs text-tertiary-black">We respond within 24 hours</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </a>

                <a
                  href="https://wa.me/14145956843"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="rounded-xl hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                          <SiWhatsapp className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-base-black mb-1">WhatsApp</h3>
                          <p className="text-xs text-tertiary-black">Chat with us instantly</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </a>

                <Card className="rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary-aqua/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Clock className="h-6 w-6 text-primary-aqua" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base-black mb-1">Business Hours</h3>
                        <div className="text-secondary-black text-sm space-y-1">
                          <p className="font-semibold text-primary-aqua">Open 24/7</p>
                          <p className="text-xs text-tertiary-black">We're available around the clock to serve you</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* <div className="mb-8">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
                alt="Book consultation atmosphere"
                className="rounded-lg shadow-lg w-full h-auto"
              />
            </div> */}

            {/* FAQ Section */}
            <Card className="rounded-xl">
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
