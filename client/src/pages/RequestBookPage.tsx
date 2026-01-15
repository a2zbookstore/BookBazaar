import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { insertBookRequestSchema, type InsertBookRequest } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { BookOpen, Mail, Phone, User, DollarSign, Hash, Package, Book } from "lucide-react";

const RequestBookPage = () => {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<InsertBookRequest>({
    resolver: zodResolver(insertBookRequestSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      bookTitle: "",
      author: "",
      isbn: "",
      binding: "",
      expectedPrice: "",
      quantity: 1,
      notes: "",
    },
  });

  const createBookRequestMutation = useMutation({
    mutationFn: async (data: InsertBookRequest) => {
      console.log("About to call apiRequest with:", { method: "POST", url: "/api/book-requests", data });
      const response = await apiRequest("POST", "/api/book-requests", data);
      console.log("API request successful:", response);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Request Submitted Successfully!",
        description: "We have received your book request. Our team will review it and get back to you soon.",
      });
      setIsSubmitted(true);
      form.reset();
    },
    onError: (error: any) => {
      console.error("Error submitting book request:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));

      let errorMessage = "Failed to submit book request. Please try again.";
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Request Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: InsertBookRequest) => {
    // Manually trigger validation on all fields
    const isValid = await form.trigger();

    if (!isValid) {
      // Get the first error field and focus on it
      const errors = form.formState.errors;
      const firstErrorField = Object.keys(errors)[0] as keyof InsertBookRequest;

      if (firstErrorField) {
        // Focus on the first invalid field
        const element = document.getElementsByName(firstErrorField)[0] as HTMLElement;
        if (element) {
          element.focus();
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        toast({
          title: "Validation Error",
          description: "Please fill in all required fields correctly.",
          variant: "destructive",
        });
      }

      return; // Don't submit if invalid
    }

    console.log("Form data before submission:", data);

    // Clean up data for submission - isbn and binding are now required
    const cleanedData = {
      ...data,
      customerPhone: data.customerPhone || null,
      author: data.author || null,
      expectedPrice: data.expectedPrice || null,
      notes: data.notes || null,
    };

    console.log("Cleaned data for submission:", cleanedData);
    createBookRequestMutation.mutate(cleanedData);
  };

  if (isSubmitted) {
    return (
      <Layout>
        <SEO
          title="Request Submitted - A2Z BOOKSHOP"
          description="Your book request has been submitted successfully. We'll get back to you soon."
          keywords="request book, find book, book search service"
          url="https://a2zbookshop.com/request-book"
          type="website"
        />
        <div className="container-custom py-12">
          <Card className="border-2 border-green-200 shadow-xl">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <BookOpen className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Request Submitted Successfully!
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Thank you for your request. We're on it!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  What's Next?
                </h3>
                <ul className="space-y-2 text-sm text-green-800">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">→</span>
                    <span>Our team will search our supplier network for your book</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">→</span>
                    <span>You'll receive an email update within 1-3 business days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">→</span>
                    <span>Once found, we'll notify you with pricing and availability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">→</span>
                    <span>No payment required until you decide to purchase</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={() => setIsSubmitted(false)}
                  variant="outline"
                  className="flex-1 border-2 border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white rounded-xl transition-all duration-300"
                >
                  Submit Another Request
                </Button>
                <Button
                  onClick={() => window.location.href = "/catalog"}
                  className="flex-1 bg-gradient-to-r from-primary-aqua to-blue-500 hover:from-primary-aqua/90 hover:to-blue-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Browse Catalog
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title="Request a Book"
        description="Can't find the book you're looking for? Request a book at A2Z BOOKSHOP and we'll do our best to find it for you."
        keywords="request book, find book, book search service, special book order"
        url="https://a2zbookshop.com/request-book"
        type="website"
      />
      <div className="container-custom py-8 mt-6">
        {/* Header with gradient background */}
        <div className="mb-8 ">
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-aqua to-blue-500 rounded-full mb-4 shadow-lg">
              <BookOpen className="h-8 w-8 text-primary-aqua" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-3">
              Request a Book
            </h1>
          </div>

          <p className="text-gray-600 text-base">
            Can't find what you're looking for? Share your book details and we'll source it for you!
          </p>
        </div>

        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Customer Information */}
                <Card className="border-2 hover:border-primary-aqua/50 transition-all duration-300 shadow-sm hover:shadow-md">
                  <CardHeader className="bg-gradient-to-r from-primary-aqua/5 to-blue-50 pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="w-8 h-8 rounded-lg bg-primary-aqua/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary-aqua" />
                      </div>
                      Your Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Full Name *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="John Doe"
                                className="pl-10 border-gray-200 focus:border-primary-aqua"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Email Address *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                type="email"
                                placeholder="john@example.com"
                                className="pl-10 border-gray-200 focus:border-primary-aqua"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Phone Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="+1 (555) 000-0000"
                                className="pl-10 border-gray-200 focus:border-primary-aqua"
                                {...field}
                                value={field.value || ""}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Right Column - Book Information */}
                <Card className="border-2 hover:border-primary-aqua/50 transition-all duration-300 shadow-sm hover:shadow-md">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-primary-aqua/5 pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="w-8 h-8 rounded-lg bg-primary-aqua/10 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-primary-aqua" />
                      </div>
                      Book Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <FormField
                      control={form.control}
                      name="bookTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Book Title *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="The Great Gatsby"
                                className="pl-10 border-gray-200 focus:border-primary-aqua"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="author"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Author Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="F. Scott Fitzgerald"
                              className="border-gray-200 focus:border-primary-aqua"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isbn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">ISBN *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="978-0-123456-78-9"
                                className="pl-10 border-gray-200 focus:border-primary-aqua"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Additional Details - Full Width */}
              <Card className="border-2 hover:border-primary-aqua/50 transition-all duration-300 shadow-sm hover:shadow-md">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 rounded-lg bg-primary-aqua/10 flex items-center justify-center">
                      <Package className="h-4 w-4 text-primary-aqua" />
                    </div>
                    Additional Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="binding"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Binding Type *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Book className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                              <select
                                {...field}
                                className="flex h-10 w-full rounded-md border border-gray-200 bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary-aqua focus:border-primary-aqua disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="">Select binding</option>
                                <option value="softcover">Softcover</option>
                                <option value="hardcover">Hardcover</option>
                                <option value="spiral">Spiral</option>
                                <option value="no_binding">No Binding</option>
                              </select>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Quantity</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                type="number"
                                min="1"
                                placeholder="1"
                                className="pl-10 border-gray-200 focus:border-primary-aqua"
                                {...field}
                                value={field.value || 1}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expectedPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Expected Price ($)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Optional"
                                className="pl-10 border-gray-200 focus:border-primary-aqua"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? e.target.value : "")}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Edition preferences, condition requirements, or any other specific details..."
                            className="min-h-[80px] resize-none border-gray-200 focus:border-primary-aqua"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Info Box & Submit */}
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-100">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900 text-sm mb-1">What happens next?</h4>
                      <p className="text-xs text-blue-700">
                        We'll search our network • Email update in 1-3 days • No payment until purchase
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="bg-gradient-to-r from-primary-aqua to-blue-500 hover:from-primary-aqua/90 hover:to-blue-600 text-white rounded-xl px-8 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={createBookRequestMutation.isPending}
                >
                  {createBookRequestMutation.isPending ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Request
                      <BookOpen className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </Layout>
  );
};

export default RequestBookPage;