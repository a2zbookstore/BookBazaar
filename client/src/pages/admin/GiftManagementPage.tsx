import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift } from "lucide-react";

export default function GiftManagementPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Gift className="h-8 w-8 text-primary-aqua" />
        <h1 className="text-3xl font-bold text-gray-900">Gift Management</h1>
        <Badge variant="secondary">Coming Soon</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gift Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Gift className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Gift Management Coming Soon
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              This feature will allow you to manage gift cards, gift wrapping options, 
              and special promotional gifts for your customers.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}