declare module 'react-chessboard' {
    import { FC } from 'react';

    interface ChessboardProps {
        id?: string;
        boardWidth?: number;
        position?: string;
        onPieceDrop?: (sourceSquare: string, targetSquare: string, piece: string) => boolean;
        arePiecesDraggable?: boolean;
        customDarkSquareStyle?: React.CSSProperties;
        customLightSquareStyle?: React.CSSProperties;
        boardOrientation?: 'white' | 'black';
        [key: string]: any;
    }

    export const Chessboard: FC<ChessboardProps>;
}

declare module '@somnia-chain/reactivity' {
    export class SDK {
        constructor(clients: any);
        subscribe(opts: {
            origin: `0x${string}`;
            eventTopics: readonly string[];
            onData: (data: any) => void;
        }): Promise<{ unsubscribe: () => void }>;
    }
}
