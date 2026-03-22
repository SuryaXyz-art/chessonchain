import { ethers } from "hardhat";

async function main() {
    console.log("Deploying to Somnia Testnet (chainId 50312)...");

    const ChessGame = await ethers.getContractFactory("ChessGame");
    const chess = await ChessGame.deploy();
    await chess.waitForDeployment();

    const address = await chess.getAddress();
    console.log("ChessGame deployed to:", address);
    console.log("Set NEXT_PUBLIC_CHESS_CONTRACT=" + address + " in .env.local");
}

main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
});
