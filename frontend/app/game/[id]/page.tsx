'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import {
    useAccount,
    useWriteContract,
    usePublicClient,
} from 'wagmi';
import { CHESS_GAME_ABI, CHESS_GAME_ADDRESS } from '../../../lib/contracts';
import { initSDK } from '../../../lib/reactivity';
import useChessReactivity from '../../../hooks/useReactivity';
import type { SDK } from '@somnia-chain/reactivity';

export default function GamePage() {
    const params = useParams();
    const id = params.id as string;

    const { address } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const publicClient = usePublicClient();

    const game = useRef(new Chess());
    const [fen, setFen] = useState(game.current.fen());
    const [moveHistory, setMoveHistory] = useState<string[]>([]);
    const [gameStatus, setGameStatus] = useState<'waiting' | 'active' | 'ended'>(
        'waiting'
    );
    const [winner, setWinner] = useState<string | null>(null);
    const [sdk, setSdk] = useState<SDK | null>(null);
    const [txPending, setTxPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const moveHistoryEndRef = useRef<HTMLDivElement>(null);

    // Fetch initial game state from contract
    useEffect(() => {
        async function fetchGame() {
            if (!publicClient || !id) return;
            try {
                const data = await publicClient.readContract({
                    address: CHESS_GAME_ADDRESS,
                    abi: CHESS_GAME_ABI,
                    functionName: 'getGame',
                    args: [BigInt(id)],
                });
                const g = data as any;
                // Status: 0=Waiting, 1=Active, 2=Ended
                const statusMap: Record<number, 'waiting' | 'active' | 'ended'> = {
                    0: 'waiting',
                    1: 'active',
                    2: 'ended',
                };
                setGameStatus(statusMap[Number(g.status)] ?? 'waiting');

                // Load FEN from contract if the game has started
                if (g.currentFEN && g.currentFEN !== '') {
                    game.current.load(g.currentFEN);
                    setFen(g.currentFEN);
                }
            } catch {
                // game may not exist yet
            }
        }
        fetchGame();
    }, [publicClient, id]);

    // SDK init — demo only (prompt for private key)
    useEffect(() => {
        try {
            const key = window.prompt(
                'Enter your private key for Reactivity SDK (demo only):'
            );
            if (key) {
                const sdkInstance = initSDK(key as `0x${string}`);
                setSdk(sdkInstance);
            }
        } catch {
            // user cancelled
        }
    }, []);

    // Reactive event callbacks
    const onMoveMade = useCallback(
        (data: {
            gameId: string;
            player: string;
            moveUCI: string;
            newFEN: string;
        }) => {
            setMoveHistory((prev) => {
                if (prev.includes(data.moveUCI)) return prev;
                try {
                    game.current.move({
                        from: data.moveUCI.slice(0, 2),
                        to: data.moveUCI.slice(2, 4),
                        promotion: 'q',
                    });
                } catch {
                    // move may already have been applied locally
                    game.current.load(data.newFEN);
                }
                setFen(game.current.fen());
                return [...prev, data.moveUCI];
            });
        },
        []
    );

    const onGameEnded = useCallback(
        (data: { gameId: string; winner: string; reason: string }) => {
            setGameStatus('ended');
            setWinner(data.winner);
        },
        []
    );

    const onPlayerJoined = useCallback(
        (data: { gameId: string; player2: string }) => {
            setGameStatus('active');
        },
        []
    );

    const { connected } = useChessReactivity({
        sdk,
        contractAddress: CHESS_GAME_ADDRESS,
        gameId: id,
        onMoveMade,
        onGameEnded,
        onPlayerJoined,
    });

    // Auto-scroll move history
    useEffect(() => {
        moveHistoryEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [moveHistory]);

    // Handle piece drop
    const onPieceDrop = (
        sourceSquare: string,
        targetSquare: string
    ): boolean => {
        if (gameStatus !== 'active' || txPending) return false;

        const move = game.current.move({
            from: sourceSquare,
            to: targetSquare,
            promotion: 'q',
        });
        if (!move) return false;

        const newFEN = game.current.fen();
        const moveUCI = sourceSquare + targetSquare;

        setFen(newFEN);
        setMoveHistory((prev) => [...prev, moveUCI]);
        setError(null);

        // Send move to contract
        setTxPending(true);
        writeContractAsync({
            address: CHESS_GAME_ADDRESS,
            abi: CHESS_GAME_ABI,
            functionName: 'makeMove',
            args: [BigInt(id), moveUCI, newFEN],
        })
            .then((hash) => publicClient!.waitForTransactionReceipt({ hash }))
            .then(() => {
                // Check for checkmate / draw after move
                if (game.current.isCheckmate()) {
                    writeContractAsync({
                        address: CHESS_GAME_ADDRESS,
                        abi: CHESS_GAME_ABI,
                        functionName: 'endGame',
                        args: [BigInt(id), address!, 'checkmate'],
                    }).catch(() => { });
                }
            })
            .catch((err: any) => {
                // Revert move on error
                game.current.undo();
                setFen(game.current.fen());
                setMoveHistory((prev) => prev.slice(0, -1));
                setError(err?.shortMessage || 'Transaction failed');
            })
            .finally(() => setTxPending(false));

        return true;
    };

    return (
        <div
            style={{
                maxWidth: 900,
                margin: '0 auto',
                padding: '30px 20px',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                }}
            >
                <a href="/" style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
                    ♟ Chess on Somnia
                </a>
                {address && (
                    <span
                        style={{
                            fontSize: 12,
                            color: '#888',
                            background: '#1a1a2e',
                            padding: '6px 14px',
                            borderRadius: 8,
                            border: '1px solid #333',
                        }}
                    >
                        {address.slice(0, 6)}...{address.slice(-4)}
                    </span>
                )}
            </div>

            <div style={{ display: 'flex', gap: 28 }}>
                {/* Left column — Board */}
                <div style={{ flexShrink: 0 }}>
                    <Chessboard
                        id="chess-board"
                        boardWidth={400}
                        position={fen}
                        onPieceDrop={onPieceDrop}
                        arePiecesDraggable={gameStatus === 'active' && !txPending}
                        customDarkSquareStyle={{ backgroundColor: '#4a3f6b' }}
                        customLightSquareStyle={{ backgroundColor: '#e8dff5' }}
                    />
                    {txPending && (
                        <div
                            style={{
                                textAlign: 'center',
                                color: '#7c6ff7',
                                fontSize: 13,
                                marginTop: 10,
                            }}
                        >
                            ⏳ Submitting move on-chain...
                        </div>
                    )}
                </div>

                {/* Right column — Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Game ID */}
                    <div
                        style={{
                            background: '#111118',
                            border: '1px solid #222',
                            borderRadius: 12,
                            padding: 20,
                            marginBottom: 16,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Game #{id}</h2>
                            {/* Reactivity badge */}
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    fontSize: 12,
                                    color: connected ? '#34d399' : '#888',
                                }}
                            >
                                <span
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: connected ? '#34d399' : '#555',
                                        display: 'inline-block',
                                    }}
                                />
                                {connected ? 'Live' : 'Connecting...'}
                            </span>
                        </div>
                    </div>

                    {/* Game Status */}
                    <div
                        style={{
                            background: '#111118',
                            border: '1px solid #222',
                            borderRadius: 12,
                            padding: 20,
                            marginBottom: 16,
                        }}
                    >
                        <h3
                            style={{ fontSize: 13, color: '#888', marginBottom: 8, fontWeight: 500 }}
                        >
                            Status
                        </h3>
                        {gameStatus === 'waiting' && (
                            <p style={{ color: '#f59e0b', fontSize: 15 }}>
                                ⏳ Waiting for opponent...
                            </p>
                        )}
                        {gameStatus === 'active' && (
                            <p style={{ color: '#34d399', fontSize: 15 }}>♟ Game Active</p>
                        )}
                        {gameStatus === 'ended' && (
                            <div>
                                <p style={{ color: '#7c6ff7', fontSize: 15, marginBottom: 6 }}>
                                    🏆 Game Over
                                </p>
                                {winner && (
                                    <p style={{ color: '#aaa', fontSize: 12 }}>
                                        Winner: {winner.slice(0, 6)}...{winner.slice(-4)}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div
                            style={{
                                background: '#2a1a1a',
                                border: '1px solid #442222',
                                borderRadius: 12,
                                padding: '12px 16px',
                                marginBottom: 16,
                                color: '#ff6b6b',
                                fontSize: 13,
                            }}
                        >
                            {error}
                        </div>
                    )}

                    {/* Move History */}
                    <div
                        style={{
                            background: '#111118',
                            border: '1px solid #222',
                            borderRadius: 12,
                            padding: 20,
                            marginBottom: 16,
                        }}
                    >
                        <h3
                            style={{ fontSize: 13, color: '#888', marginBottom: 10, fontWeight: 500 }}
                        >
                            Move History
                        </h3>
                        <div
                            style={{
                                maxHeight: 180,
                                overflowY: 'auto',
                                fontFamily: 'monospace',
                                fontSize: 13,
                                lineHeight: '22px',
                            }}
                        >
                            {moveHistory.length === 0 ? (
                                <p style={{ color: '#555' }}>No moves yet</p>
                            ) : (
                                moveHistory.map((move, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: 'flex',
                                            gap: 10,
                                            color: i % 2 === 0 ? '#e8dff5' : '#aaa',
                                        }}
                                    >
                                        <span style={{ color: '#555', minWidth: 28 }}>
                                            {Math.floor(i / 2) + 1}.
                                        </span>
                                        <span>{move}</span>
                                    </div>
                                ))
                            )}
                            <div ref={moveHistoryEndRef} />
                        </div>
                    </div>

                    {/* Share Link */}
                    <div
                        style={{
                            background: '#111118',
                            border: '1px solid #222',
                            borderRadius: 12,
                            padding: 20,
                        }}
                    >
                        <h3
                            style={{ fontSize: 13, color: '#888', marginBottom: 8, fontWeight: 500 }}
                        >
                            Share with opponent
                        </h3>
                        <div
                            style={{
                                padding: '10px 14px',
                                background: '#0d0d14',
                                borderRadius: 8,
                                border: '1px solid #333',
                                fontSize: 12,
                                color: '#7c6ff7',
                                wordBreak: 'break-all',
                                cursor: 'pointer',
                            }}
                            onClick={() => {
                                navigator.clipboard.writeText(
                                    typeof window !== 'undefined' ? window.location.href : ''
                                );
                            }}
                            title="Click to copy"
                        >
                            {typeof window !== 'undefined' ? window.location.href : ''}
                        </div>
                        <p style={{ fontSize: 11, color: '#555', marginTop: 6 }}>
                            Click to copy link
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
