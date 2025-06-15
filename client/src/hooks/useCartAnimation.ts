import { useState, useCallback } from 'react';

export function useCartAnimation() {
  const [isAnimating, setIsAnimating] = useState(false);

  const triggerAnimation = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
    }, 3000); // Animation lasts for 3 seconds
  }, []);

  return { isAnimating, triggerAnimation };
}