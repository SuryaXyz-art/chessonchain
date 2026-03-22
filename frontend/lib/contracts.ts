export const CHESS_GAME_ADDRESS = process.env
    .NEXT_PUBLIC_CHESS_CONTRACT as `0x${string}`;

export const CHESS_GAME_ABI = [
    {
        type: "function",
        name: "gameCount",
        inputs: [],
        outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "games",
        inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
        outputs: [
            { name: "player1", type: "address", internalType: "address" },
            { name: "player2", type: "address", internalType: "address" },
            { name: "currentFEN", type: "string", internalType: "string" },
            { name: "currentTurn", type: "address", internalType: "address" },
            { name: "status", type: "uint8", internalType: "enum ChessGame.GameStatus" },
            { name: "wager", type: "uint256", internalType: "uint256" },
        ],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "createGame",
        inputs: [],
        outputs: [{ name: "gameId", type: "uint256", internalType: "uint256" }],
        stateMutability: "payable",
    },
    {
        type: "function",
        name: "joinGame",
        inputs: [{ name: "gameId", type: "uint256", internalType: "uint256" }],
        outputs: [],
        stateMutability: "payable",
    },
    {
        type: "function",
        name: "makeMove",
        inputs: [
            { name: "gameId", type: "uint256", internalType: "uint256" },
            { name: "moveUCI", type: "string", internalType: "string" },
            { name: "newFEN", type: "string", internalType: "string" },
        ],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "endGame",
        inputs: [
            { name: "gameId", type: "uint256", internalType: "uint256" },
            { name: "winner", type: "address", internalType: "address" },
            { name: "reason", type: "string", internalType: "string" },
        ],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "getGame",
        inputs: [{ name: "gameId", type: "uint256", internalType: "uint256" }],
        outputs: [
            {
                name: "",
                type: "tuple",
                internalType: "struct ChessGame.Game",
                components: [
                    { name: "player1", type: "address", internalType: "address" },
                    { name: "player2", type: "address", internalType: "address" },
                    { name: "currentFEN", type: "string", internalType: "string" },
                    { name: "currentTurn", type: "address", internalType: "address" },
                    { name: "status", type: "uint8", internalType: "enum ChessGame.GameStatus" },
                    { name: "wager", type: "uint256", internalType: "uint256" },
                ],
            },
        ],
        stateMutability: "view",
    },
    {
        type: "event",
        name: "GameCreated",
        inputs: [
            { name: "gameId", type: "uint256", indexed: true, internalType: "uint256" },
            { name: "player1", type: "address", indexed: true, internalType: "address" },
        ],
        anonymous: false,
    },
    {
        type: "event",
        name: "PlayerJoined",
        inputs: [
            { name: "gameId", type: "uint256", indexed: true, internalType: "uint256" },
            { name: "player2", type: "address", indexed: true, internalType: "address" },
        ],
        anonymous: false,
    },
    {
        type: "event",
        name: "MoveMade",
        inputs: [
            { name: "gameId", type: "uint256", indexed: true, internalType: "uint256" },
            { name: "player", type: "address", indexed: true, internalType: "address" },
            { name: "moveUCI", type: "string", indexed: false, internalType: "string" },
            { name: "newFEN", type: "string", indexed: false, internalType: "string" },
        ],
        anonymous: false,
    },
    {
        type: "event",
        name: "GameEnded",
        inputs: [
            { name: "gameId", type: "uint256", indexed: true, internalType: "uint256" },
            { name: "winner", type: "address", indexed: true, internalType: "address" },
            { name: "reason", type: "string", indexed: false, internalType: "string" },
        ],
        anonymous: false,
    },
] as const;
