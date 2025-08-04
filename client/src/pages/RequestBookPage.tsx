import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertBookRequestSchema, type InsertBookRequest } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { BookOpen, Mail, Phone, User, DollarSign, Hash, Package } from "lucide-react";

const RequestBookPage = () => {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<InsertBookRequest>({
    resolver: zodResolver(insertBookRequestSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      bookTitle: "",
      author: "",
      isbn: "",
      expectedPrice: "",
      quantity: 1,
      notes: "",
    },
  });

  const createBookRequestMutation = useMutation({
    mutationFn: async (data: InsertBookRequest) => {
      return apiRequest("/api/book-requests", "POST", data);
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

  const onSubmit = (data: InsertBookRequest) => {
    console.log("Form data before submission:", data);
    
    // Clean up data for submission
    const cleanedData = {
      ...data,
      customerPhone: data.customerPhone || null,
      author: data.author || null,
      isbn: data.isbn || null,
      expectedPrice: data.expectedPrice || null,
      notes: data.notes || null,
    };
    
    console.log("Cleaned data for submission:", cleanedData);
    createBookRequestMutation.mutate(cleanedData);
  };

  if (isSubmitted) {
    return (
      <div className="container-custom py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">Request Submitted!</CardTitle>
              <CardDescription className="text-lg">
                Thank you for your book request. We'll review it and get back to you soon.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Our team will search for your requested book and notify you via email once we have an update. 
                This typically takes 1-3 business days.
              </p>
              <div className="space-y-2">
                <Button
                  onClick={() => setIsSubmitted(false)}
                  variant="outline"
                  className="mr-4"
                >
                  Submit Another Request
                </Button>
                <Button
                  onClick={() => window.location.href = "/catalog"}
                  className="bg-primary-aqua hover:bg-primary-aqua/90"
                >
                  Browse Our Catalog
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Request a Book</h1>
          <p className="text-gray-600 text-lg">
            Can't find a book you're looking for? Let us know and we'll do our best to find it for you!
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Book Request Form
            </CardTitle>
            <CardDescription>
              Fill out the form below with as much detail as possible. We'll search for your book and get back to you with availability and pricing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Your Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Full Name *
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} />
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
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Address *
                        </FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter your email address" {...field} />
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
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Phone Number
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your phone number" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Book Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Book Details</h3>
                  
                  <FormField
                    control={form.control}
                    name="bookTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Book Title *
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter the book title" {...field} />
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
                        <FormLabel>Author Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter the author's name" {...field} value={field.value || ""} />
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
                        <FormLabel className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          ISBN
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter ISBN if known" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Quantity
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              placeholder="1" 
                              {...field}
                              value={field.value || 1}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
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
                          <FormLabel className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Expected Price ($)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              min="0" 
                              placeholder="Optional" 
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? e.target.value : "")}
                            />
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
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any additional details about the book, edition preferences, condition requirements, etc."
                            className="min-h-[100px]"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• We'll search our network of suppliers for your requested book</li>
                    <li>• You'll receive an email update within 1-3 business days</li>
                    <li>• If we find the book, we'll add it to our inventory and notify you</li>
                    <li>• No payment required until you decide to purchase</li>
                  </ul>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary-aqua hover:bg-primary-aqua/90"
                  disabled={createBookRequestMutation.isPending}
                >
                  {createBookRequestMutation.isPending ? "Submitting..." : "Submit Book Request"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RequestBookPage;