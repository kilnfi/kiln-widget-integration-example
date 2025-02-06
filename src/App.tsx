import { useEffect, useMemo, useRef, useState } from "react";
import { type EIP1474Methods, hexToNumber, toHex } from "viem";
import KilnSvg from "./assets/kiln.svg";
import "viem/window";

type WidgetRpcMethods =
	| "eth_accounts"
	| "eth_chainId"
	| "wallet_switchEthereumChain"
	| "eth_estimateGas"
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

const isRpcMessage = (
	message: unknown,
): message is { id: string; args: { method: string; params?: any[] } } => {
	return (
		typeof message === "object" &&
		message !== null &&
		"id" in message &&
		"args" in message &&
		typeof message.id === "string" &&
		typeof message.args === "object" &&
		message.args !== null &&
		"method" in message.args &&
		typeof message.args.method === "string" &&
		("params" in message.args ? Array.isArray(message.args.params) : true)
	);
};

function App() {
	const ref = useRef<HTMLIFrameElement>(null);

	const [chainId, setChainId] = useState<number>(1);

	const handlers = useMemo(
		(): RpcHandlers => ({
			eth_accounts: async () => {
				return ["0x991c468AbcE2b4DD627a6210C145373EbABdd186"];
			},

			eth_chainId: async () => {
				return toHex(chainId);
			},

			wallet_switchEthereumChain: async ({ chainId }) => {
				setChainId(hexToNumber(chainId as `0x${string}`));
				return null;
			},

			eth_estimateGas: async () => {
				throw new Error("Not implemented.");
			},

			eth_sendTransaction: async () => {
				throw new Error("Not implemented.");
			},
		}),
		[chainId],
	);

	useEffect(() => {
		const handler = async (event: MessageEvent) => {
			const data = event.data as unknown;

			if (!isRpcMessage(data) || !ref.current?.contentWindow) {
				return;
			}

			if (!(data.args.method in handlers)) {
				throw new Error(`Method: ${data.args.method} is not implemented.`);
			}

			const id = data.id;
			const method = data.args.method as WidgetRpcMethods;
			const result = await handlers[method](...(data.args.params ?? []));

			ref.current.contentWindow.postMessage({ id, result }, "*");
		};

		window.addEventListener("message", handler);

		return () => {
			window.removeEventListener("message", handler);
		};
	}, [handlers]);

	return (
		<>
			<h1 className="title">
				<img src={KilnSvg} alt="kiln logo" className="title-image" />
				<span>Kiln Widget Integration Example</span>
			</h1>

			<iframe
				ref={ref}
				title="Kiln Widget"
				src="http://kiln.localhost:8081/overview"
				className="iframe"
				// For copy address interactions
				allow="clipboard-read; clipboard-write"
			/>
		</>
	);
}

export default App;
