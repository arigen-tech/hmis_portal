import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop
 * Automatically scrolls window to top on route change or search param navigation.
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    const mainPanel = document.querySelector('.main-panel');
    if (mainPanel) {
      mainPanel.scrollTop = 0;
    }
  }, [pathname, search]);

  return null;
}
