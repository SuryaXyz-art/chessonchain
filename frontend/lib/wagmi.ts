import { defineChain } from "viem";
import { createConfig, http } from "wagmi";

export const somniaTestnet = defineChain({
    id: 50312,
    name: "Somnia Testnet",
    nativeCurrency: {
        name: "STT",
        symbol: "STT",
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ["https://dream-rpc.somnia.network"],
        },
    },
    blockExplorers: {
        default: {
            name: "Somnia Explorer",
            url: "https://shannon-explorer.somnia.network",
        },
    },
    testnet: true,
});

export const wagmiConfig = createConfig({
    chains: [somniaTestnet],
    transports: {
        [somniaTestnet.id]: http("https://dream-rpc.somnia.network"),
    },
});
