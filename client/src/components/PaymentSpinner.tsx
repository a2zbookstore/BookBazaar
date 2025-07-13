import React from 'react';

interface PaymentSpinnerProps {
  message?: string;
  paymentMethod?: 'paypal' | 'razorpay' | 'general';
}

export function PaymentSpinner({ message = "Processing payment...", paymentMethod = 'general' }: PaymentSpinnerProps) {
  const getSpinnerColor = () => {
    switch (paymentMethod) {
      case 'paypal': return 'border-blue-500';
      case 'razorpay': return 'border-purple-500';
      default: return 'border-indigo-500';
    }
  };

  const getAccentColor = () => {
    switch (paymentMethod) {
      case 'paypal': return 'bg-blue-500';
      case 'razorpay': return 'bg-purple-500';
      default: return 'bg-indigo-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center">
        {/* Main Spinner */}
        <div className="relative mx-auto w-16 h-16 mb-4">
          {/* Outer rotating ring */}
          <div className={`absolute inset-0 border-4 border-gray-200 rounded-full animate-spin ${getSpinnerColor()}`}
               style={{ 
                 borderTopColor: 'transparent',
                 animation: 'spin 1s linear infinite'
               }}>
          </div>
          
          {/* Inner pulsing circle */}
          <div className={`absolute inset-2 ${getAccentColor()} rounded-full animate-pulse`}
               style={{ 
                 animation: 'pulse 2s ease-in-out infinite'
               }}>
          </div>
          
          {/* Center dot */}
          <div className="absolute inset-6 bg-white rounded-full animate-bounce"
               style={{ 
                 animation: 'bounce 1.5s ease-in-out infinite'
               }}>
          </div>
        </div>

        {/* Animated dots */}
        <div className="flex justify-center space-x-1 mb-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 ${getAccentColor()} rounded-full animate-bounce`}
              style={{
                animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`
              }}
            />
          ))}
        </div>

        {/* Message */}
        <p className="text-gray-700 font-medium mb-2">{message}</p>
        
        {/* Payment method specific message */}
        {paymentMethod === 'paypal' && (
          <p className="text-sm text-gray-500">You will be redirected to PayPal shortly...</p>
        )}
        {paymentMethod === 'razorpay' && (
          <p className="text-sm text-gray-500">Opening secure payment gateway...</p>
        )}
        
        {/* Cute loading bars */}
        <div className="mt-4 space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className={`h-1 ${getAccentColor()} rounded-full animate-pulse`}
              style={{
                width: '60%',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className={`h-1 ${getAccentColor()} rounded-full animate-pulse`}
              style={{
                width: '40%',
                animation: 'pulse 1.8s ease-in-out infinite'
              }}
            />
          </div>
        </div>

        {/* Secure payment indicator */}
        <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Secure Payment Processing
        </div>
      </div>
    </div>
  );
}

// Additional cute mini spinner for inline use
export function MiniPaymentSpinner({ className = "", paymentMethod = 'general' }: { className?: string, paymentMethod?: 'paypal' | 'razorpay' | 'general' }) {
  const getSpinnerColor = () => {
    switch (paymentMethod) {
      case 'paypal': return 'border-blue-500';
      case 'razorpay': return 'border-purple-500';
      default: return 'border-indigo-500';
    }
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      <div className={`w-4 h-4 border-2 border-gray-300 rounded-full animate-spin ${getSpinnerColor()}`}
           style={{ borderTopColor: 'transparent' }}>
      </div>
      <span className="ml-2 text-sm">Processing...</span>
    </div>
  );
}