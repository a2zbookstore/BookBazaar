import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Truck, Plus, Edit, Trash2, Star, Globe } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ShippingRate {
  id: number;
  countryCode: string;
  countryName: string;
  shippingCost: string;
  minDeliveryDays: number;
  maxDeliveryDays: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ShippingRateForm {
  countryCode: string;
  countryName: string;
  shippingCost: string;
  minDeliveryDays: string;
  maxDeliveryDays: string;
  isDefault: boolean;
  isActive: boolean;
}

// Complete list of countries with ISO codes
const COUNTRIES = [
  { code: "AF", name: "Afghanistan" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "AD", name: "Andorra" },
  { code: "AO", name: "Angola" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BS", name: "Bahamas" },
  { code: "BH", name: "Bahrain" },
  { code: "BD", name: "Bangladesh" },
  { code: "BB", name: "Barbados" },
  { code: "BY", name: "Belarus" },
  { code: "BE", name: "Belgium" },
  { code: "BZ", name: "Belize" },
  { code: "BJ", name: "Benin" },
  { code: "BT", name: "Bhutan" },
  { code: "BO", name: "Bolivia" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "BW", name: "Botswana" },
  { code: "BR", name: "Brazil" },
  { code: "BN", name: "Brunei" },
  { code: "BG", name: "Bulgaria" },
  { code: "BF", name: "Burkina Faso" },
  { code: "BI", name: "Burundi" },
  { code: "KH", name: "Cambodia" },
  { code: "CM", name: "Cameroon" },
  { code: "CA", name: "Canada" },
  { code: "CV", name: "Cape Verde" },
  { code: "CF", name: "Central African Republic" },
  { code: "TD", name: "Chad" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "KM", name: "Comoros" },
  { code: "CG", name: "Congo" },
  { code: "CD", name: "Congo (Democratic Republic)" },
  { code: "CR", name: "Costa Rica" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "HR", name: "Croatia" },
  { code: "CU", name: "Cuba" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "DJ", name: "Djibouti" },
  { code: "DM", name: "Dominica" },
  { code: "DO", name: "Dominican Republic" },
  { code: "EC", name: "Ecuador" },
  { code: "EG", name: "Egypt" },
  { code: "SV", name: "El Salvador" },
  { code: "GQ", name: "Equatorial Guinea" },
  { code: "ER", name: "Eritrea" },
  { code: "EE", name: "Estonia" },
  { code: "SZ", name: "Eswatini" },
  { code: "ET", name: "Ethiopia" },
  { code: "FJ", name: "Fiji" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "GA", name: "Gabon" },
  { code: "GM", name: "Gambia" },
  { code: "GE", name: "Georgia" },
  { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" },
  { code: "GR", name: "Greece" },
  { code: "GD", name: "Grenada" },
  { code: "GT", name: "Guatemala" },
  { code: "GN", name: "Guinea" },
  { code: "GW", name: "Guinea-Bissau" },
  { code: "GY", name: "Guyana" },
  { code: "HT", name: "Haiti" },
  { code: "HN", name: "Honduras" },
  { code: "HU", name: "Hungary" },
  { code: "IS", name: "Iceland" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "JM", name: "Jamaica" },
  { code: "JP", name: "Japan" },
  { code: "JO", name: "Jordan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KE", name: "Kenya" },
  { code: "KI", name: "Kiribati" },
  { code: "KP", name: "Korea (North)" },
  { code: "KR", name: "Korea (South)" },
  { code: "KW", name: "Kuwait" },
  { code: "KG", name: "Kyrgyzstan" },
  { code: "LA", name: "Laos" },
  { code: "LV", name: "Latvia" },
  { code: "LB", name: "Lebanon" },
  { code: "LS", name: "Lesotho" },
  { code: "LR", name: "Liberia" },
  { code: "LY", name: "Libya" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MG", name: "Madagascar" },
  { code: "MW", name: "Malawi" },
  { code: "MY", name: "Malaysia" },
  { code: "MV", name: "Maldives" },
  { code: "ML", name: "Mali" },
  { code: "MT", name: "Malta" },
  { code: "MH", name: "Marshall Islands" },
  { code: "MR", name: "Mauritania" },
  { code: "MU", name: "Mauritius" },
  { code: "MX", name: "Mexico" },
  { code: "FM", name: "Micronesia" },
  { code: "MD", name: "Moldova" },
  { code: "MC", name: "Monaco" },
  { code: "MN", name: "Mongolia" },
  { code: "ME", name: "Montenegro" },
  { code: "MA", name: "Morocco" },
  { code: "MZ", name: "Mozambique" },
  { code: "MM", name: "Myanmar" },
  { code: "NA", name: "Namibia" },
  { code: "NR", name: "Nauru" },
  { code: "NP", name: "Nepal" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NI", name: "Nicaragua" },
  { code: "NE", name: "Niger" },
  { code: "NG", name: "Nigeria" },
  { code: "MK", name: "North Macedonia" },
  { code: "NO", name: "Norway" },
  { code: "OM", name: "Oman" },
  { code: "PK", name: "Pakistan" },
  { code: "PW", name: "Palau" },
  { code: "PS", name: "Palestine" },
  { code: "PA", name: "Panama" },
  { code: "PG", name: "Papua New Guinea" },
  { code: "PY", name: "Paraguay" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "QA", name: "Qatar" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" },
  { code: "RW", name: "Rwanda" },
  { code: "WS", name: "Samoa" },
  { code: "SM", name: "San Marino" },
  { code: "ST", name: "São Tomé and Príncipe" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SN", name: "Senegal" },
  { code: "RS", name: "Serbia" },
  { code: "SC", name: "Seychelles" },
  { code: "SL", name: "Sierra Leone" },
  { code: "SG", name: "Singapore" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "SB", name: "Solomon Islands" },
  { code: "SO", name: "Somalia" },
  { code: "ZA", name: "South Africa" },
  { code: "SS", name: "South Sudan" },
  { code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" },
  { code: "SD", name: "Sudan" },
  { code: "SR", name: "Suriname" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "SY", name: "Syria" },
  { code: "TW", name: "Taiwan" },
  { code: "TJ", name: "Tajikistan" },
  { code: "TZ", name: "Tanzania" },
  { code: "TH", name: "Thailand" },
  { code: "TL", name: "Timor-Leste" },
  { code: "TG", name: "Togo" },
  { code: "TO", name: "Tonga" },
  { code: "TT", name: "Trinidad and Tobago" },
  { code: "TN", name: "Tunisia" },
  { code: "TR", name: "Turkey" },
  { code: "TM", name: "Turkmenistan" },
  { code: "TV", name: "Tuvalu" },
  { code: "UG", name: "Uganda" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "UY", name: "Uruguay" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "VU", name: "Vanuatu" },
  { code: "VA", name: "Vatican City" },
  { code: "VE", name: "Venezuela" },
  { code: "VN", name: "Vietnam" },
  { code: "YE", name: "Yemen" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" }
];

const initialForm: ShippingRateForm = {
  countryCode: "",
  countryName: "",
  shippingCost: "",
  minDeliveryDays: "",
  maxDeliveryDays: "",
  isDefault: false,
  isActive: true,
};

export default function ShippingPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ShippingRate | null>(null);
  const [form, setForm] = useState<ShippingRateForm>(initialForm);

  const { data: shippingRates = [] } = useQuery<ShippingRate[]>({
    queryKey: ["/api/shipping-rates"],
  });

  const createRateMutation = useMutation({
    mutationFn: async (data: ShippingRateForm) => {
      await apiRequest("POST", "/api/shipping-rates", {
        ...data,
        shippingCost: parseFloat(data.shippingCost),
        minDeliveryDays: parseInt(data.minDeliveryDays),
        maxDeliveryDays: parseInt(data.maxDeliveryDays),
      });
    },
    onSuccess: () => {
      toast({
        title: "Shipping rate created",
        description: "The shipping rate has been created successfully.",
      });
      setIsDialogOpen(false);
      setForm(initialForm);
      queryClient.invalidateQueries({ queryKey: ["/api/shipping-rates"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create shipping rate",
        variant: "destructive",
      });
    },
  });

  const updateRateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ShippingRateForm }) => {
      await apiRequest("PUT", `/api/shipping-rates/${id}`, {
        ...data,
        shippingCost: parseFloat(data.shippingCost),
        minDeliveryDays: parseInt(data.minDeliveryDays),
        maxDeliveryDays: parseInt(data.maxDeliveryDays),
      });
    },
    onSuccess: () => {
      toast({
        title: "Shipping rate updated",
        description: "The shipping rate has been updated successfully.",
      });
      setIsDialogOpen(false);
      setEditingRate(null);
      setForm(initialForm);
      queryClient.invalidateQueries({ queryKey: ["/api/shipping-rates"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update shipping rate",
        variant: "destructive",
      });
    },
  });

  const deleteRateMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/shipping-rates/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Shipping rate deleted",
        description: "The shipping rate has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shipping-rates"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete shipping rate",
        variant: "destructive",
      });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/shipping-rates/${id}/set-default`);
    },
    onSuccess: () => {
      toast({
        title: "Default rate updated",
        description: "The default shipping rate has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shipping-rates"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to set default rate",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingRate) {
      updateRateMutation.mutate({ id: editingRate.id, data: form });
    } else {
      createRateMutation.mutate(form);
    }
  };

  const handleEdit = (rate: ShippingRate) => {
    setEditingRate(rate);
    setForm({
      countryCode: rate.countryCode,
      countryName: rate.countryName,
      shippingCost: rate.shippingCost,
      minDeliveryDays: rate.minDeliveryDays.toString(),
      maxDeliveryDays: rate.maxDeliveryDays.toString(),
      isDefault: rate.isDefault,
      isActive: rate.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleCountrySelect = (countryCode: string) => {
    const country = COUNTRIES.find(c => c.code === countryCode);
    if (country) {
      setForm(prev => ({
        ...prev,
        countryCode: country.code,
        countryName: country.name,
      }));
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingRate(null);
  };

  const defaultRate = shippingRates.find(rate => rate.isDefault);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bookerly font-bold text-base-black">Shipping Management</h1>
            <p className="text-secondary-black">Manage shipping rates and delivery times by country</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary-aqua hover:bg-secondary-aqua" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Shipping Rate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingRate ? "Edit Shipping Rate" : "Add New Shipping Rate"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select value={form.countryCode} onValueChange={handleCountrySelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="shippingCost">Shipping Cost (EUR)</Label>
                  <Input
                    id="shippingCost"
                    type="number"
                    step="0.01"
                    value={form.shippingCost}
                    onChange={(e) => setForm(prev => ({ ...prev, shippingCost: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minDeliveryDays">Min Delivery Days</Label>
                    <Input
                      id="minDeliveryDays"
                      type="number"
                      value={form.minDeliveryDays}
                      onChange={(e) => setForm(prev => ({ ...prev, minDeliveryDays: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxDeliveryDays">Max Delivery Days</Label>
                    <Input
                      id="maxDeliveryDays"
                      type="number"
                      value={form.maxDeliveryDays}
                      onChange={(e) => setForm(prev => ({ ...prev, maxDeliveryDays: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={form.isDefault}
                    onChange={(e) => setForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isDefault">Set as default rate</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={form.isActive}
                    onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary-aqua hover:bg-secondary-aqua"
                    disabled={createRateMutation.isPending || updateRateMutation.isPending}
                  >
                    {createRateMutation.isPending || updateRateMutation.isPending
                      ? "Saving..."
                      : editingRate
                      ? "Update Rate"
                      : "Create Rate"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Default Rate Info */}
        {defaultRate && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <Star className="h-5 w-5" />
                Default Shipping Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-700">
                <strong>{defaultRate.countryName}</strong> - ${defaultRate.shippingCost} 
                ({defaultRate.minDeliveryDays}-{defaultRate.maxDeliveryDays} days)
              </p>
              <p className="text-sm text-yellow-600 mt-1">
                This rate will be used for countries not specifically configured.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Shipping Rates List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Shipping Rates ({shippingRates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {shippingRates.length > 0 ? (
              <div className="space-y-4">
                {shippingRates.map((rate) => (
                  <div
                    key={rate.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-base-black">{rate.countryName}</span>
                        <span className="text-sm text-secondary-black">({rate.countryCode})</span>
                      </div>
                      <div className="flex gap-2">
                        {rate.isDefault && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            Default
                          </Badge>
                        )}
                        {!rate.isActive && (
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-medium text-base-black">€{rate.shippingCost}</div>
                        <div className="text-sm text-secondary-black">
                          {rate.minDeliveryDays}-{rate.maxDeliveryDays} days
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {!rate.isDefault && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDefaultMutation.mutate(rate.id)}
                            disabled={setDefaultMutation.isPending}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(rate)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteRateMutation.mutate(rate.id)}
                          disabled={deleteRateMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-base-black mb-2">No shipping rates configured</h3>
                <p className="text-secondary-black mb-4">
                  Add shipping rates for different countries to enable international shipping.
                </p>
                <Button className="bg-primary-aqua hover:bg-secondary-aqua" onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Shipping Rate
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}