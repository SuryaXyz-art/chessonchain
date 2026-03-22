// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ChessGame {
    uint256 public gameCount;

    enum GameStatus {
        Waiting,
        Active,
        Ended
    }

    struct Game {
        address player1;
        address player2;
        string currentFEN;
        address currentTurn;
        GameStatus status;
        uint256 wager;
    }

    mapping(uint256 => Game) public games;

    event GameCreated(uint256 indexed gameId, address indexed player1);
    event PlayerJoined(uint256 indexed gameId, address indexed player2);
    event MoveMade(
        uint256 indexed gameId,
        address indexed player,
        string moveUCI,
        string newFEN
    );
    event GameEnded(
        uint256 indexed gameId,
        address indexed winner,
        string reason
    );

    function createGame() external payable returns (uint256 gameId) {
        gameCount++;
        gameId = gameCount;

        games[gameId] = Game({
            player1: msg.sender,
            player2: address(0),
            currentFEN: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            currentTurn: address(0),
            status: GameStatus.Waiting,
            wager: msg.value
        });

        emit GameCreated(gameId, msg.sender);
    }

    function joinGame(uint256 gameId) external payable {
        Game storage game = games[gameId];
        require(game.status == GameStatus.Waiting, "Game is not waiting for a player");
        require(msg.sender != game.player1, "Cannot join your own game");
        require(msg.value == game.wager, "Must match the wager amount");

        game.player2 = msg.sender;
        game.currentTurn = game.player1;
        game.status = GameStatus.Active;

        emit PlayerJoined(gameId, msg.sender);
    }

    function makeMove(
        uint256 gameId,
        string calldata moveUCI,
        string calldata newFEN
    ) external {
        Game storage game = games[gameId];
        require(game.status == GameStatus.Active, "Game is not active");
        require(msg.sender == game.currentTurn, "Not your turn");

        game.currentFEN = newFEN;
        game.currentTurn = (msg.sender == game.player1)
            ? game.player2
            : game.player1;

        emit MoveMade(gameId, msg.sender, moveUCI, newFEN);
    }

    function endGame(
        uint256 gameId,
        address winner,
        string calldata reason
    ) external {
        Game storage game = games[gameId];
        require(game.status == GameStatus.Active, "Game is not active");
        require(
            msg.sender == game.player1 || msg.sender == game.player2,
            "Not a player in this game"
        );

        game.status = GameStatus.Ended;

        uint256 payout = game.wager * 2;
        if (payout > 0) {
            (bool sent, ) = winner.call{value: payout}("");
            require(sent, "Failed to send payout");
        }

        emit GameEnded(gameId, winner, reason);
    }

    function getGame(uint256 gameId) external view returns (Game memory) {
        return games[gameId];
    }
}
