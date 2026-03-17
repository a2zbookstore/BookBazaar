import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Truck, Plus, Edit, Trash2, Star, Globe,
  DollarSign, Clock, Hash, MapPin, Sparkles, CheckCircle2, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    if (countryCode === "REST_OF_WORLD") {
      setForm(prev => ({
        ...prev,
        countryCode: "REST_OF_WORLD",
        countryName: "Rest of Countries (Default)",
      }));
    } else {
      const country = COUNTRIES.find(c => c.code === countryCode);
      if (country) {
        setForm(prev => ({
          ...prev,
          countryCode: country.code,
          countryName: country.name,
        }));
      }
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingRate(null);
  };

  const defaultRate = shippingRates.find(rate => rate.isDefault);

  const activeCount  = shippingRates.filter(r => r.isActive).length;
  const inactiveCount = shippingRates.filter(r => !r.isActive).length;

  return (
    <div className="space-y-6 sm:space-y-8">

      {/* ── Page Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-50 via-white to-cyan-50 border border-teal-100 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-teal-100/50 to-transparent rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Shipping Management</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage shipping rates and delivery times by country</p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Shipping Rate
              </Button>
            </DialogTrigger>

            {/* ── Dialog ── */}
            <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto rounded-2xl p-0 gap-0">
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
                <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          
                  {editingRate ? "Edit Shipping Rate" : "New Shipping Rate"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
                {/* Country */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" /> Country <span className="text-red-400">*</span>
                  </Label>
                  <Select value={form.countryCode} onValueChange={handleCountrySelect}>
                    <SelectTrigger className="rounded-lg border-gray-200 focus:ring-teal-400 h-10">
                      <SelectValue placeholder="Select a country…" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="REST_OF_WORLD" className="font-semibold text-teal-600">
                        🌍 Rest of Countries (Default Rate)
                      </SelectItem>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Shipping Cost */}
                <div className="space-y-1.5">
                  <Label htmlFor="shippingCost" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-gray-400" /> Shipping Cost (USD) <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="shippingCost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.shippingCost}
                    onChange={(e) => setForm(prev => ({ ...prev, shippingCost: e.target.value }))}
                    placeholder="0.00"
                    required
                    className="rounded-lg border-gray-200 focus-visible:ring-teal-400 h-10"
                  />
                </div>

                {/* Delivery Days */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="minDays" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" /> Min Days <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="minDays"
                      type="number"
                      min="1"
                      value={form.minDeliveryDays}
                      onChange={(e) => setForm(prev => ({ ...prev, minDeliveryDays: e.target.value }))}
                      placeholder="e.g. 3"
                      required
                      className="rounded-lg border-gray-200 focus-visible:ring-teal-400 h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="maxDays" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" /> Max Days <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="maxDays"
                      type="number"
                      min="1"
                      value={form.maxDeliveryDays}
                      onChange={(e) => setForm(prev => ({ ...prev, maxDeliveryDays: e.target.value }))}
                      placeholder="e.g. 7"
                      required
                      className="rounded-lg border-gray-200 focus-visible:ring-teal-400 h-10"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 divide-y divide-gray-100 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-400" /> Default Rate
                      </p>
                      <p className="text-xs text-gray-400">Use for countries not specifically configured</p>
                    </div>
                    <Switch
                      checked={form.isDefault}
                      onCheckedChange={(c) => setForm(prev => ({ ...prev, isDefault: c }))}
                    />
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Active</p>
                      <p className="text-xs text-gray-400">Enable this rate for checkout</p>
                    </div>
                    <Switch
                      checked={form.isActive}
                      onCheckedChange={(c) => setForm(prev => ({ ...prev, isActive: c }))}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <Button
                    type="submit"
                    disabled={createRateMutation.isPending || updateRateMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-xl h-10 font-medium shadow-sm"
                  >
                    {createRateMutation.isPending || updateRateMutation.isPending
                      ? "Saving…"
                      : editingRate ? "Update Rate" : "Create Rate"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="rounded-xl h-10 border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats strip */}
        <div className="relative mt-5 flex flex-wrap gap-3">
          {[
            { label: "Total",    value: shippingRates.length, color: "bg-teal-100 text-teal-700"     },
            { label: "Active",   value: activeCount,          color: "bg-emerald-100 text-emerald-700" },
            { label: "Inactive", value: inactiveCount,        color: "bg-gray-100 text-gray-600"     },
            { label: "Default",  value: defaultRate ? defaultRate.countryName : "None", color: "bg-amber-100 text-amber-700" },
          ].map(({ label, value, color }) => (
            <span key={label} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
              {label} <span className="font-bold">{value}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Default rate banner ── */}
      {defaultRate && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 px-5 py-4">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
            <Star className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Default Rate &mdash; {defaultRate.countryName}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              ${defaultRate.shippingCost} &nbsp;&bull;&nbsp; {defaultRate.minDeliveryDays}–{defaultRate.maxDeliveryDays} day delivery
              &nbsp;&bull;&nbsp; Applied to countries without a specific rate
            </p>
          </div>
        </div>
      )}

      {/* ── Rates list ── */}
      {shippingRates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-16 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-teal-300" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">No shipping rates yet</h3>
          <p className="text-sm text-gray-400 mb-5 max-w-xs">
            Add rates for different countries to enable international shipping at checkout.
          </p>
          <Button
            onClick={resetForm}
            className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-xl shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Add First Shipping Rate
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {shippingRates.map((rate) => {
            const isGlobal  = rate.countryCode === "REST_OF_WORLD";
            const isDefault = rate.isDefault || isGlobal;

            return (
              <div
                key={rate.id}
                className={`group flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border bg-white px-5 py-4 shadow-sm hover:shadow-md transition-all duration-200
                  ${isDefault ? "border-amber-200 ring-1 ring-amber-100" : "border-gray-100"}`}
              >
                {/* Country icon */}
                <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl
                  ${isGlobal ? "bg-teal-50" : "bg-gray-50"}`}>
                  {isGlobal ? "🌍" : <Globe className="w-5 h-5 text-gray-400" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-semibold text-sm ${ isGlobal ? "text-teal-700" : "text-gray-900"}`}>
                      {rate.countryName}
                    </span>
                    {rate.countryCode !== "REST_OF_WORLD" && (
                      <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">{rate.countryCode}</span>
                    )}
                    {isGlobal && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                        Global Default
                      </span>
                    )}
                    {rate.isDefault && !isGlobal && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                        <Star className="w-3 h-3" /> Default
                      </span>
                    )}
                    {rate.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
                        <XCircle className="w-3 h-3" /> Inactive
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-gray-300" />
                      <span className="font-semibold text-gray-700">${rate.shippingCost}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-300" />
                      {rate.minDeliveryDays}–{rate.maxDeliveryDays} day delivery
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  {!isDefault && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDefaultMutation.mutate(rate.id)}
                      disabled={setDefaultMutation.isPending}
                      title="Set as default"
                      className="rounded-xl border-gray-200 text-gray-500 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-colors h-8 w-8 p-0"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(rate)}
                    className="rounded-xl border-gray-200 text-gray-600 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 transition-colors h-8 text-xs px-3"
                  >
                    <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteRateMutation.mutate(rate.id)}
                    disabled={deleteRateMutation.isPending}
                    className="rounded-xl border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors h-8 text-xs px-3"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}