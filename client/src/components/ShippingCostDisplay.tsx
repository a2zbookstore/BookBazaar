import React, { useState, useEffect } from "react";
import { Truck, MapPin, Clock, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useShipping } from "@/hooks/useShipping";
import { useCurrency } from "@/hooks/useCurrency";
import { formatDeliveryTime, calculateDeliveryDate } from "@/lib/locationUtils";
import CurrencySelector from "@/components/CurrencySelector";

interface ShippingCostDisplayProps {
  className?: string;
  showLocationDetection?: boolean;
  showCurrencySelector?: boolean;
  compact?: boolean;
}

export default function ShippingCostDisplay({ 
  className = "",
  showLocationDetection = true,
  showCurrencySelector = true,
  compact = false
}: ShippingCostDisplayProps) {
  const { location, shipping, isLoading, error, refreshLocation } = useShipping();
  const { userCurrency, convertPrice, formatAmount, isLoading: currencyLoading } = useCurrency(location?.countryCode);
  const [convertedShipping, setConvertedShipping] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  // Convert shipping cost to user's currency
  useEffect(() => {
    const convertShippingCost = async () => {
      if (shipping && userCurrency !== 'USD') {
        setIsConverting(true);
        try {
          const converted = await convertPrice(parseFloat(shipping.cost));
          if (converted) {
            setConvertedShipping(formatAmount(converted.convertedAmount, userCurrency));
          } else {
            setConvertedShipping(null);
          }
        } catch (error) {
          console.error('Error converting shipping cost:', error);
          setConvertedShipping(null);
        } finally {
          setIsConverting(false);
        }
      } else if (shipping) {
        setConvertedShipping(formatAmount(parseFloat(shipping.cost), 'USD'));
      }
    };

    convertShippingCost();
  }, [shipping, userCurrency, convertPrice, formatAmount]);

  const deliveryInfo = shipping ? calculateDeliveryDate(shipping.minDeliveryDays, shipping.maxDeliveryDays) : null;

  if (isLoading || currencyLoading) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin">
              <RefreshCw className="h-4 w-4 text-primary-aqua" />
            </div>
            <span className="text-sm text-secondary-black">
              Calculating shipping costs...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !shipping) {
    return (
      <Card className={`border-red-200 bg-red-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
            {showLocationDetection && (
              <Button
                size="sm"
                variant="outline"
                onClick={refreshLocation}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!shipping) {
    return (
      <Card className={`border-gray-200 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-secondary-black">
              Shipping rates will be calculated at checkout
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isUsingDefaultRate = shipping.isDefault || location?.country === 'Rest of Countries (Default)';
  const isFreeShipping = parseFloat(shipping.cost) === 0;

  return (
    <Card className={`${className}`}>
      <CardContent className={compact ? "p-3" : "p-4"}>
        <div className="space-y-3">
          {/* Header with currency selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary-aqua" />
              <span className={`font-medium text-base-black ${compact ? 'text-sm' : ''}`}>
                Shipping
              </span>
            </div>
            {showCurrencySelector && !compact && (
              <CurrencySelector compact={true} showLabel={false} />
            )}
          </div>

          {/* Location info */}
          {location && showLocationDetection && (
            <div className="flex items-center gap-2 text-sm text-secondary-black">
              <MapPin className="h-3 w-3" />
              <span>
                {location.city ? `${location.city}, ` : ''}{location.country}
              </span>
              {isUsingDefaultRate && (
                <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                  Default Rate
                </Badge>
              )}
            </div>
          )}

          {/* Shipping cost */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isFreeShipping ? (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-primary-aqua">Standard Shipping</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                    {formatAmount(parseFloat(shipping.cost), 'USD')}
                  </Badge>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {isConverting ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        <span className="text-sm">Converting...</span>
                      </div>
                    ) : (
                      <>
                        <span className="font-semibold text-primary-aqua text-lg">
                          {convertedShipping || formatAmount(parseFloat(shipping.cost), 'USD')}
                        </span>
                        {userCurrency !== 'USD' && convertedShipping && (
                          <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                            from ${parseFloat(shipping.cost).toFixed(2)} USD
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Delivery time */}
          <div className="flex items-center gap-2 text-sm text-secondary-black">
            <Clock className="h-3 w-3" />
            <span>
              Estimated delivery: {formatDeliveryTime(shipping.minDeliveryDays, shipping.maxDeliveryDays)}
            </span>
          </div>

          {deliveryInfo && (
            <div className="text-xs text-secondary-black border-t pt-2">
              Expected arrival: {deliveryInfo.formatted}
            </div>
          )}

          {/* Currency selector for compact mode */}
          {showCurrencySelector && compact && (
            <div className="border-t pt-2">
              <CurrencySelector compact={true} showLabel={true} className="text-xs" />
            </div>
          )}

          {/* Refresh button */}
          {showLocationDetection && !compact && (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={refreshLocation}
                className="text-xs text-secondary-black hover:text-primary-aqua"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Update Location
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}