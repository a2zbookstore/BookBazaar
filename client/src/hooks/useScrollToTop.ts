import { useEffect } from 'react';
import { useLocation } from 'wouter';

export function useScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    // Scroll to top whenever location changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth' // You can change to 'auto' for instant scroll
    });
  }, [location]);
}