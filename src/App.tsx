import { useEffect, useRef } from "react";
import { type EIP1474Methods, hexToNumber, toHex } from "viem";
import KilnSvg from "./assets/kiln.svg";
import "viem/window";

type WidgetRpcMethods =
  | "eth_accounts"
  | "eth_chainId"
  | "wallet_switchEthereumChain"
  | "eth_sendTransaction";

type RpcMethod<method extends WidgetRpcMethods> = Extract<
  EIP1474Methods[number],
  { Method: method }
>;

/**
 * helper type to get auto-complete on methods, params and return types
 */
type RpcHandlers = {
  [method in WidgetRpcMethods]: RpcMethod<method>["Parameters"] extends unknown[]
    ? (
        ...args: RpcMethod<method>["Parameters"]
      ) => Promise<RpcMethod<method>["ReturnType"]>
    : () => Promise<RpcMethod<method>["ReturnType"]>;
};

/**
 * Type of a request sent by the Widget
 */
type WidgetRpcRequest = {
  id: string;
  method: string;
  params?: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
};

/**
 * Type of a response to send back to the widget
 */
type WidgetRpcResponse = { id: string } & (
  | { success: true; data: unknown }
  | { success: false; error: unknown }
);

const isValidRpcMessage = (
  event: MessageEvent,
): event is Omit<typeof event, "data"> & { data: WidgetRpcRequest } => {
  const data = event.data as unknown;
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    "method" in data &&
    typeof data.id === "string" &&
    typeof data.method === "string" &&
    ("params" in data ? Array.isArray(data.params) : true)
  );
};

function App() {
  const ref = useRef<HTMLIFrameElement>(null);

  const walletRef = useRef<`0x${string}`>(
    "0x991c468AbcE2b4DD627a6210C145373EbABdd186",
  );

  const chainIdRef = useRef<number>(1);

  const handlersRef = useRef<RpcHandlers>({
    /**
     * Get the current connected wallet
     */
    eth_accounts: async () => {
      return [walletRef.current];
    },

    /**
     * Get the current chain ID
     */
    eth_chainId: async () => {
      return toHex(chainIdRef.current);
    },

    /**
     * Handle a switch chain interraction from the Widget
     */
    wallet_switchEthereumChain: async ({ chainId }) => {
      chainIdRef.current = hexToNumber(chainId as `0x${string}`);
      return null;
    },

    /**
     * Handle a sign transaction interaction from the Widget
     * then return the broadcasted transaction hash
     */
    eth_sendTransaction: async (transaction) => {
      void transaction;
      throw new Error("Not implemented.");
    },
  });

  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      if (
        !ref.current?.contentWindow ||
        // Check the message comes from the widget
        event.source !== ref.current.contentWindow
      ) {
        return;
      }

      if (!isValidRpcMessage(event)) return;

      if (!(event.data.method in handlersRef.current)) {
        throw new Error(`Method: ${event.data.method} is not implemented.`);
      }

      const id = event.data.id;
      const method = event.data.method as WidgetRpcMethods;

      const response: WidgetRpcResponse = await handlersRef.current[method](
        ...(event.data.params ?? []),
      )
        .then((data) => ({ id, success: true, data }) as const)
        .catch((error) => ({ id, success: false, error }) as const);

      ref.current.contentWindow.postMessage(response, "*");
    };

    window.addEventListener("message", handler);

    return () => {
      window.removeEventListener("message", handler);
    };
  }, []);

  return (
    <>
      <h1 className="title">
        <img src={KilnSvg} alt="kiln logo" className="title-image" />
        <span>Kiln Widget Integration Example</span>
      </h1>

      <iframe
        ref={ref}
        title="Kiln Widget"
        src="https://iframe.widget.testnet.kiln.fi"
        className="iframe"
        // For copy address interactions
        allow="clipboard-read; clipboard-write"
      />
    </>
  );
}

export default App;
