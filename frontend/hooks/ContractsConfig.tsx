import { VOTING_CONTRACT_ADDRESS } from "../lib/constants";
import VotingABI from '../abis/Voting.json';


export const votingConfig = {
    address: VOTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: VotingABI.abi,
};