# Kiln Widget Integration Example

This project provides an easy way to integrate the **Kiln Widget** into your application. It acts as a bridge, handling communication between your app and the Kiln Widget via **RPC methods**.

## Installation

Clone the repository and install dependencies:

```sh
bun install
```

## Usage

Start the development server:

```sh
bun run dev
```

This will launch your app, including the Kiln Widget inside an iframe.

## How It Works

### RPC Message Handling
This project listens for **message events** from the Kiln Widget and processes RPC method calls using an internal **handlers** object on which you can plug your application logic.

The supported Ethereum RPC methods include:
- `eth_accounts` – Get the current connected wallet.
- `eth_chainId` – Get the current chain ID.
- `wallet_switchEthereumChain` – Handle a switch chain interraction from the Widget.
- `eth_sendTransaction` – Handle a sign transaction interaction from the Widget, then return the broadcasted transaction hash.

### Communication Flow
1. The Kiln Widget sends an **RPC request** via `postMessage` on the `window.top` (your application).
2. The event listener then captures and processes the message coming from the Kiln Widget.
3. If the requested method is supported, the appropriate handler is called.
4. The result is sent back to the widget using `postMessage` on the `iframe.contentWindow`.

## Configuration
Ensure that the **Kiln Widget URL** is correctly set in `iframe`:

```tsx
<iframe
  ref={ref}
  title="Kiln Widget"
  src="https://kiln.testnet.widget.kiln.fi/overview"
  className="iframe"
  allow="clipboard-read; clipboard-write"
/>
```

## Integration
You should modify the content of the handlers to bridge the gap between your application's logic and the widget.
If you already have such a mechanism in place to handle other dApps, please contact us we can integrate it on our end to save you some time.

## Contributing
Feel free to submit **issues** or **pull requests** if you have improvements!

## License
This project is licensed under the **MIT License**.
