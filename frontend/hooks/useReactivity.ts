'use client';

import { useEffect, useRef, useState } from 'react';
import { decodeEventLog } from 'viem';
import type { SDK } from '@somnia-chain/reactivity';
import { TOPICS } from '../lib/reactivity';
import { CHESS_GAME_ABI } from '../lib/contracts';

interface UseChessReactivityParams {
    sdk: SDK | null;
    contractAddress: string;
    gameId: string;
    onMoveMade: (data: {
        gameId: string;
        player: string;
        moveUCI: string;
        newFEN: string;
    }) => void;
    onGameEnded: (data: {
        gameId: string;
        winner: string;
        reason: string;
    }) => void;
    onPlayerJoined: (data: {
        gameId: string;
        player2: string;
    }) => void;
}

function useChessReactivity({
    sdk,
    contractAddress,
    gameId,
    onMoveMade,
    onGameEnded,
    onPlayerJoined,
}: UseChessReactivityParams): { connected: boolean; error: string | null } {
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const subRef = useRef<any>(null);

    useEffect(() => {
        if (!sdk || !contractAddress || !gameId) return;

        let cancelled = false;

        async function subscribe() {
            try {
                const sub = await sdk!.subscribe({
                    origin: contractAddress as `0x${string}`,
                    eventTopics: [
                        TOPICS.MoveMade,
                        TOPICS.GameEnded,
                        TOPICS.PlayerJoined,
                    ],
                    onData: (data: any) => {
                        if (!data?.events) return;

                        for (const log of data.events) {
                            try {
                                const decoded = decodeEventLog({
                                    abi: CHESS_GAME_ABI,
                                    data: log.data,
                                    topics: log.topics,
                                });

                                const args = decoded.args as any;
                                const eventGameId = args.gameId?.toString();

                                if (eventGameId !== gameId) continue;

                                switch (decoded.eventName) {
                                    case 'MoveMade':
                                        onMoveMade({
                                            gameId: eventGameId,
                                            player: args.player,
                                            moveUCI: args.moveUCI,
                                            newFEN: args.newFEN,
                                        });
                                        break;
                                    case 'GameEnded':
                                        onGameEnded({
                                            gameId: eventGameId,
                                            winner: args.winner,
                                            reason: args.reason,
                                        });
                                        break;
                                    case 'PlayerJoined':
                                        onPlayerJoined({
                                            gameId: eventGameId,
                                            player2: args.player2,
                                        });
                                        break;
                                }
                            } catch {
                                // skip malformed logs
                            }
                        }
                    },
                });

                if (!cancelled) {
                    subRef.current = sub;
                    setConnected(true);
                    setError(null);
                } else {
                    sub.unsubscribe?.();
                }
            } catch (err: any) {
                if (!cancelled) {
                    setError(err?.message ?? 'Failed to subscribe to reactive events');
                    setConnected(false);
                }
            }
        }

        subscribe();

        return () => {
            cancelled = true;
            setConnected(false);
            if (subRef.current) {
                subRef.current.unsubscribe?.();
                subRef.current = null;
            }
        };
    }, [sdk, contractAddress, gameId]);

    return { connected, error };
}

export default useChessReactivity;
