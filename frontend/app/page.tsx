'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    useAccount,
    useConnect,
    useDisconnect,
    useWriteContract,
    usePublicClient,
} from 'wagmi';
import { parseEther, decodeEventLog } from 'viem';
import { injected } from 'wagmi/connectors';
import { CHESS_GAME_ABI, CHESS_GAME_ADDRESS } from '../lib/contracts';

export default function LobbyPage() {
    const router = useRouter();
    const { address, isConnected } = useAccount();
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();
    const { writeContractAsync } = useWriteContract();
    const publicClient = usePublicClient();

    const [wagerInput, setWagerInput] = useState('');
    const [joinGameId, setJoinGameId] = useState('');
    const [loading, setLoading] = useState('');
    const [error, setError] = useState('');

    const handleCreateGame = async () => {
        if (!isConnected) return;
        setLoading('Creating game...');
        setError('');
        try {
            const hash = await writeContractAsync({
                address: CHESS_GAME_ADDRESS,
                abi: CHESS_GAME_ABI,
                functionName: 'createGame',
                value: parseEther(wagerInput || '0'),
            });

            const receipt = await publicClient!.waitForTransactionReceipt({ hash });

            let gameId: string | null = null;
            for (const log of receipt.logs) {
                try {
                    const decoded = decodeEventLog({
                        abi: CHESS_GAME_ABI,
                        data: log.data,
                        topics: log.topics,
                    });
                    if (decoded.eventName === 'GameCreated') {
                        gameId = (decoded.args as any).gameId.toString();
                        break;
                    }
                } catch {
                    // not our event
                }
            }

            if (gameId) {
                router.push('/game/' + gameId);
            } else {
                setError('Game created but could not read gameId from receipt.');
            }
        } catch (err: any) {
            setError(err?.shortMessage || err?.message || 'Failed to create game');
        } finally {
            setLoading('');
        }
    };

    const handleJoinGame = async () => {
        if (!isConnected || !joinGameId) return;
        setLoading('Joining game...');
        setError('');
        try {
            const gameData = await publicClient!.readContract({
                address: CHESS_GAME_ADDRESS,
                abi: CHESS_GAME_ABI,
                functionName: 'getGame',
                args: [BigInt(joinGameId)],
            });

            const wager = (gameData as any).wager;

            const hash = await writeContractAsync({
                address: CHESS_GAME_ADDRESS,
                abi: CHESS_GAME_ABI,
                functionName: 'joinGame',
                args: [BigInt(joinGameId)],
                value: wager,
            });

            await publicClient!.waitForTransactionReceipt({ hash });
            router.push('/game/' + joinGameId);
        } catch (err: any) {
            setError(err?.shortMessage || err?.message || 'Failed to join game');
        } finally {
            setLoading('');
        }
    };

    return (
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 48,
                }}
            >
                <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>
                    ♟ Chess on Somnia
                </h1>
                {isConnected ? (
                    <button
                        onClick={() => disconnect()}
                        style={{
                            padding: '10px 18px',
                            borderRadius: 10,
                            border: '1px solid #333',
                            background: '#1a1a2e',
                            color: '#aaa',
                            cursor: 'pointer',
                            fontSize: 13,
                        }}
                    >
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                    </button>
                ) : (
                    <button
                        onClick={() => connect({ connector: injected() })}
                        style={{
                            padding: '10px 22px',
                            borderRadius: 10,
                            border: 'none',
                            background: 'linear-gradient(135deg, #7c6ff7, #5a4fcf)',
                            color: '#fff',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: 14,
                        }}
                    >
                        Connect Wallet
                    </button>
                )}
            </div>

            {/* Error */}
            {error && (
                <div
                    style={{
                        padding: '12px 16px',
                        borderRadius: 10,
                        background: '#2a1a1a',
                        border: '1px solid #442222',
                        color: '#ff6b6b',
                        marginBottom: 24,
                        fontSize: 13,
                    }}
                >
                    {error}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div
                    style={{
                        padding: '12px 16px',
                        borderRadius: 10,
                        background: '#1a1a2e',
                        border: '1px solid #333',
                        color: '#7c6ff7',
                        marginBottom: 24,
                        fontSize: 13,
                        textAlign: 'center',
                    }}
                >
                    ⏳ {loading}
                </div>
            )}

            {/* Create Game */}
            <div
                style={{
                    background: '#111118',
                    border: '1px solid #222',
                    borderRadius: 14,
                    padding: 28,
                    marginBottom: 24,
                }}
            >
                <h2 style={{ fontSize: 18, marginBottom: 6, fontWeight: 600 }}>
                    Create a New Game
                </h2>
                <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>
                    Set an optional wager in STT. Your opponent must match it to join.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                    <input
                        type="text"
                        placeholder="Wager (STT) — optional"
                        value={wagerInput}
                        onChange={(e) => setWagerInput(e.target.value)}
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            borderRadius: 10,
                            border: '1px solid #333',
                            background: '#0d0d14',
                            color: '#fff',
                            fontSize: 14,
                            outline: 'none',
                        }}
                    />
                    <button
                        onClick={handleCreateGame}
                        disabled={!isConnected || !!loading}
                        style={{
                            padding: '12px 24px',
                            borderRadius: 10,
                            border: 'none',
                            background:
                                isConnected && !loading
                                    ? 'linear-gradient(135deg, #7c6ff7, #5a4fcf)'
                                    : '#333',
                            color: '#fff',
                            fontWeight: 600,
                            cursor: isConnected && !loading ? 'pointer' : 'not-allowed',
                            fontSize: 14,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Create Game
                    </button>
                </div>
            </div>

            {/* Join Game */}
            <div
                style={{
                    background: '#111118',
                    border: '1px solid #222',
                    borderRadius: 14,
                    padding: 28,
                }}
            >
                <h2 style={{ fontSize: 18, marginBottom: 6, fontWeight: 600 }}>
                    Join an Existing Game
                </h2>
                <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>
                    Enter the game ID to join. You&apos;ll need to match the wager amount.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                    <input
                        type="text"
                        placeholder="Game ID"
                        value={joinGameId}
                        onChange={(e) => setJoinGameId(e.target.value)}
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            borderRadius: 10,
                            border: '1px solid #333',
                            background: '#0d0d14',
                            color: '#fff',
                            fontSize: 14,
                            outline: 'none',
                        }}
                    />
                    <button
                        onClick={handleJoinGame}
                        disabled={!isConnected || !joinGameId || !!loading}
                        style={{
                            padding: '12px 24px',
                            borderRadius: 10,
                            border: 'none',
                            background:
                                isConnected && joinGameId && !loading
                                    ? 'linear-gradient(135deg, #34d399, #059669)'
                                    : '#333',
                            color: '#fff',
                            fontWeight: 600,
                            cursor:
                                isConnected && joinGameId && !loading
                                    ? 'pointer'
                                    : 'not-allowed',
                            fontSize: 14,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Join Game
                    </button>
                </div>
            </div>

            {/* Footer */}
            <p
                style={{
                    textAlign: 'center',
                    color: '#555',
                    fontSize: 12,
                    marginTop: 40,
                }}
            >
                Powered by Somnia Testnet (Chain 50312) · Reactive Smart Contracts
            </p>
        </div>
    );
}
