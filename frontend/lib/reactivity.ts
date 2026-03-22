import { SDK } from '@somnia-chain/reactivity';
import {
    createPublicClient,
    createWalletClient,
    http,
    keccak256,
    toBytes,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

export const somniaChain = {
    id: 50312,
    name: 'Somnia Testnet',
    network: 'somnia-testnet',
    nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://dream-rpc.somnia.network'] },
        public: { http: ['https://dream-rpc.somnia.network'] },
    },
    blockExplorers: {
        default: {
            name: 'Shannon Explorer',
            url: 'https://shannon-explorer.somnia.network',
        },
    },
} as const;

// Event topic hashes — precomputed so we never typo them at runtime
export const TOPICS = {
    MoveMade: keccak256(toBytes('MoveMade(uint256,address,string,string)')),
    GameEnded: keccak256(toBytes('GameEnded(uint256,address,string)')),
    PlayerJoined: keccak256(toBytes('PlayerJoined(uint256,address)')),
} as const;

export function initSDK(privateKey: `0x${string}`): SDK {
    const account = privateKeyToAccount(privateKey);

    const publicClient = createPublicClient({
        chain: somniaChain as any,
        transport: http(),
    });

    const walletClient = createWalletClient({
        account,
        chain: somniaChain as any,
        transport: http(),
    });

    return new SDK({ public: publicClient, wallet: walletClient });
}
