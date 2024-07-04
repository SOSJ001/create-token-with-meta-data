
import { Connection } from "@solana/web3.js";
import { clusterApiUrl } from "@solana/web3.js";
export const connection = new Connection(clusterApiUrl("devnet"), "confirmed"); //connecting to devnet rpc