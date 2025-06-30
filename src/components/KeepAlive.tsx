import { useKeepAliveRef } from "keepalive-for-react";
import KeepAliveRouteOutlet from "keepalive-for-react-router";

export default function KeepAlive() {
  const aliveRef = useKeepAliveRef();

  return (
    <div>
      <KeepAliveRouteOutlet aliveRef={aliveRef} />
    </div>
  );
}
