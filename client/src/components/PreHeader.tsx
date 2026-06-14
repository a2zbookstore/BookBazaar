import React from 'react';

const PreHeader: React.FC = () => (
  <div className="hidden sm:flex items-center justify-center w-full bg-black text-primary-foreground text-sm py-2 gap-8">
    <span>Free Shipping all Over the World.</span>
    <span className="opacity-50">|</span>
    <span>We Deliver Within 3-7 Business Days.</span>
  </div>
);

export default PreHeader;
