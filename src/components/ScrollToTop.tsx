import { useEffect } from "react";
import { useLocation } from "react-router";

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scroll(0, 0);
  }, [location.pathname]);

  return null;
}

export default ScrollToTop;
