import { Web3ReactHooks, Web3ReactProvider } from "@web3-react/core";
import { Connector } from "@web3-react/types";
import { ReactNode, useMemo } from "react";
import { Connection } from "../connectors";
import { getConnectionName } from "../connectors/utils";
import useOrderedConnections from "../hooks/useConnectors";
import useEagerlyConnect from "../hooks/useEagerlyConnect";

export default function Web3Provider({ children }: { children: ReactNode }) {
  useEagerlyConnect()
  const connections = useOrderedConnections()
  const connectors: [Connector, Web3ReactHooks][] = connections.map(({ hooks, connector }) => [connector, hooks])

  const key = useMemo(() => connections.map(({ type }: Connection) => getConnectionName(type)).join('-'), [connections])
  
  return (
    <Web3ReactProvider connectors={connectors} key={key}>
      {children}
    </Web3ReactProvider>
  );
}
