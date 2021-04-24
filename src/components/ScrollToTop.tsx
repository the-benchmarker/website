import { useEffect } from "react";
import { withRouter } from "react-router-dom";
import { History } from "history";

function ScrollToTop({ history }: { history: History }) {
  useEffect(() => {
    const unListen = history.listen(() => {
      window.scrollTo(0, 0);
    });
    return () => {
      unListen();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export default withRouter(ScrollToTop);
