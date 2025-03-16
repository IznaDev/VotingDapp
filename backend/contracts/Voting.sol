// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

///@title Voting Contract
///@author Alyra
///@notice This contract allow you to create a voting session
///@dev Security improvements added to prevent DOS attacks and other vulnerabilities
contract Voting is Ownable, ReentrancyGuard {
    uint public winningProposalID;
    uint public constant MAX_PROPOSALS = 100;

    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
    }

    struct Proposal {
        string description;
        uint voteCount;
    }

    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    WorkflowStatus public workflowStatus;
    Proposal[] private proposalsArray;
    mapping(address => Voter) private voters;
    mapping(string => bool) private proposalExists;

    event VoterRegistered(address voterAddress);
    event WorkflowStatusChange(
        WorkflowStatus previousStatus,
        WorkflowStatus newStatus
    );
    event ProposalRegistered(uint proposalId);
    event Voted(address voter, uint proposalId);

    ///@notice Initialize the contract
    ///@dev Sets up the contract with default state
    constructor() {
        _transferOwnership(msg.sender);
    }

    modifier onlyVoters() {
        require(voters[msg.sender].isRegistered, "You're not a voter");
        _;
    }

    ///@notice Get voter information
    ///@dev Only registered voters can access this information
    ///@param _addr Address of the voter to get information about
    ///@return Getvoter return the voter's information (isRegistered, hasVoted, votedProposalId)
    function getVoter(
        address _addr
    ) external view onlyVoters returns (Voter memory) {
        return voters[_addr];
    }

    ///@notice Get information about a specific proposal
    ///@dev Only registered voters can access this information
    ///@param _id ID of the proposal to query
    ///@return GetOneProposal return the proposal's information (description, voteCount)
    function getOneProposal(
        uint _id
    ) external view onlyVoters returns (Proposal memory) {
        return proposalsArray[_id];
    }

    ///@notice Add a new voter to the voting system
    ///@dev Can only be called by the contract owner during the RegisteringVoters status
    ///@param _addr Address of the voter to register
    function addVoter(address _addr) external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.RegisteringVoters,
            "Voters registration is not open yet"
        );
        require(voters[_addr].isRegistered != true, "Already registered");
        require(_addr != address(0), "Invalid address"); // Prevent zero address

        voters[_addr].isRegistered = true;
        emit VoterRegistered(_addr);
    }

    ///@notice Register a new proposal for voting
    ///@dev Only registered voters can add proposals during ProposalsRegistrationStarted status
    ///@param _desc Description of the proposal
    function addProposal(string calldata _desc) external onlyVoters {
        require(
            workflowStatus == WorkflowStatus.ProposalsRegistrationStarted,
            "Proposals are not allowed yet"
        );
        require(
            keccak256(abi.encode(_desc)) != keccak256(abi.encode("")),
            "Vous ne pouvez pas ne rien proposer"
        ); // facultatif
        // voir que desc est different des autres

        Proposal memory proposal;
        proposal.description = _desc;
        proposalsArray.push(proposal);
        require(bytes(_desc).length <= 1000, "Proposal too long");
        require(!proposalExists[_desc], "Duplicate proposal");
        require(proposalsArray.length < MAX_PROPOSALS, "Max proposals reached");

        proposalExists[_desc] = true;

        emit ProposalRegistered(proposalsArray.length - 1);
    }

    ///@notice Record a vote for a specific proposal
    ///@dev Only registered voters can vote once during VotingSessionStarted status
    ///@param _id ID of the proposal to vote for
    function setVote(uint _id) external onlyVoters nonReentrant {
        require(
            workflowStatus == WorkflowStatus.VotingSessionStarted,
            "Voting session havent started yet"
        );
        require(!voters[msg.sender].hasVoted, "You have already voted");
        require(_id < proposalsArray.length, "Proposal not found");

        voters[msg.sender].votedProposalId = _id;
        voters[msg.sender].hasVoted = true;
        proposalsArray[_id].voteCount++;

        emit Voted(msg.sender, _id);
    }

    ///@notice Start the proposal registration phase
    ///@dev Can only be called by the owner, work flow status transitions from RegisteringVoters to ProposalsRegistrationStarted
    function startProposalsRegistering() external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.RegisteringVoters,
            "Registering proposals cant be started now"
        );
        workflowStatus = WorkflowStatus.ProposalsRegistrationStarted;

        Proposal memory proposal;
        proposal.description = "GENESIS";
        proposalsArray.push(proposal);

        emit WorkflowStatusChange(
            WorkflowStatus.RegisteringVoters,
            WorkflowStatus.ProposalsRegistrationStarted
        );
    }

    ///@notice End the proposal registration phase
    ///@dev Can only be called by the owner, workflow status transitions from ProposalsRegistrationStarted to ProposalsRegistrationEnded
    function endProposalsRegistering() external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.ProposalsRegistrationStarted,
            "Registering proposals havent started yet"
        );
        workflowStatus = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(
            WorkflowStatus.ProposalsRegistrationStarted,
            WorkflowStatus.ProposalsRegistrationEnded
        );
    }

    ///@notice Start the voting session
    ///@dev Can only be called by the owner, transitions from ProposalsRegistrationEnded to VotingSessionStarted
    function startVotingSession() external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.ProposalsRegistrationEnded,
            "Registering proposals phase is not finished"
        );
        workflowStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(
            WorkflowStatus.ProposalsRegistrationEnded,
            WorkflowStatus.VotingSessionStarted
        );
    }

    ///@notice End the voting session
    ///@dev Can only be called by the owner, workflow status transitions from VotingSessionStarted to VotingSessionEnded
    function endVotingSession() external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.VotingSessionStarted,
            "Voting session havent started yet"
        );
        workflowStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(
            WorkflowStatus.VotingSessionStarted,
            WorkflowStatus.VotingSessionEnded
        );
    }

    ///@notice Count votes and determine the winning proposal
    ///@dev Can only be called by the owner, transitions from VotingSessionEnded to VotesTallied
    ///@dev Iterates through all proposals to find the one with highest vote count
    function tallyVotes() external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.VotingSessionEnded,
            "Current status is not voting session ended"
        );
        require(proposalsArray.length > 0, "No proposals to tally");

        uint _winningProposalId;
        for (uint256 p = 0; p < proposalsArray.length; p++) {
            if (
                proposalsArray[p].voteCount >
                proposalsArray[_winningProposalId].voteCount
            ) {
                _winningProposalId = p;
            }
        }

        winningProposalID = _winningProposalId;
        workflowStatus = WorkflowStatus.VotesTallied;

        emit WorkflowStatusChange(
            WorkflowStatus.VotingSessionEnded,
            WorkflowStatus.VotesTallied
        );
    }
}
