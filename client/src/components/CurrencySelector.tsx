import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/hooks/useCurrency";

interface CurrencySelectorProps {
  showLabel?: boolean;
  compact?: boolean;
  className?: string;
}

export default function CurrencySelector({ 
  showLabel = true, 
  compact = false, 
  className = "" 
}: CurrencySelectorProps) {
  const { userCurrency, setCurrency, getSupportedCurrencies, isLoading } = useCurrency();
  const currencies = getSupportedCurrencies();

  const handleCurrencyChange = (currencyCode: string) => {
    console.log("set up form here");
    setCurrency(currencyCode);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showLabel && !compact && (
          <span className="text-sm text-secondary-black">Currency:</span>
        )}
        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && !compact && (
        <span className="text-sm text-secondary-black">Currency:</span>
      )}
      <Select value={userCurrency} onValueChange={handleCurrencyChange}>
        <SelectTrigger className={compact ? "w-20 h-8 text-xs" : "w-24"}>
          <SelectValue>
            {compact ? (
              <span className="font-medium">{userCurrency}</span>
            ) : (
              <div className="flex items-center gap-1">
                <span className="font-medium">{currencies.find(c => c.code === userCurrency)?.symbol}</span>
                <span className="text-xs">{userCurrency}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {currencies.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{currency.symbol}</span>
                  <span className="text-sm">{currency.code}</span>
                </div>
                <span className="text-xs text-secondary-black ml-2">
                  {currency.name}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {userCurrency !== 'USD' && !compact && (
        <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
          Auto-converted
        </Badge>
      )}
    </div>
  );
}