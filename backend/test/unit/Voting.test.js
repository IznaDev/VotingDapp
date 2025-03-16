const { loadFixture, } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting contract Tests :", function () {
    async function deployContract() {
        const [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();
        const VotingContract = await ethers.getContractFactory("Voting");
        const votingContract = await VotingContract.deploy();
        return { votingContract, owner, user1, user2, user3, user4, user5 };
    }
    async function registeringVotersSession() {
        const { votingContract, owner, user1, user2, user3, user4, user5 } = await loadFixture(deployContract);
        await votingContract.addVoter(user1.address);
        await votingContract.addVoter(user2.address);
        await votingContract.addVoter(user3.address);
        await votingContract.addVoter(user4.address);

        return { votingContract, owner, user1, user2, user3, user4, user5 };
    }
    async function proposalSessionOpen() {
        const { votingContract, owner, user1, user2, user3, user4, user5 } = await loadFixture(registeringVotersSession);
        await votingContract.startProposalsRegistering();
        return { votingContract, owner, user1, user2, user3, user4, user5 };
    }
    async function proposalSessionClosed() {
        const { votingContract, owner, user1, user2, user3, user4, user5 } = await loadFixture(proposalSessionOpen);
        await votingContract.connect(user1).addProposal("proposition of the voter 1");
        await votingContract.connect(user2).addProposal("proposition of the voter 2");
        await votingContract.endProposalsRegistering();
        return { votingContract, owner, user1, user2, user3, user4, user5 };
    }
    async function votingSessionOpen() {
        const { votingContract, owner, user1, user2, user3, user4, user5 } = await loadFixture(proposalSessionClosed);
        await votingContract.startVotingSession();
        return { votingContract, owner, user1, user2, user3, user4, user5 };

    }
    async function votingSessionClosed() {
        const { votingContract, owner, user1, user2, user3, user4, user5 } = await loadFixture(votingSessionOpen);
        await votingContract.connect(user1).setVote(2);
        await votingContract.connect(user2).setVote(2);
        await votingContract.connect(user3).setVote(1);
        await votingContract.connect(user4).setVote(2);
        await votingContract.endVotingSession();
        return { votingContract, owner, user1, user2, user3, user4, user5 };

    }

    describe("addVoter function Tests:", function () {
        beforeEach(async function () {
            const fixture = await loadFixture(registeringVotersSession);
            votingContract = fixture.votingContract;
            owner = fixture.owner;
            user1 = fixture.user1;
            user2 = fixture.user2;
            user3 = fixture.user3;
            user4 = fixture.user4;
            user5 = fixture.user5;

        })
        it("should revert if addVoter is called by a voter", async function () {
            await expect(votingContract.connect(user1).addVoter(user2.address))
                .to.be.revertedWithCustomError(votingContract, "OwnableUnauthorizedAccount")
                .withArgs(user1.address);
        })
        it("should be successfull if addVoter is called by the owner", async function () {

            await expect(votingContract.addVoter(user5.address)).to.be.not.reverted;
        })
        it("should revert if the voter is already registered", async function () {

            await expect(votingContract.addVoter(user2.address))
                .to.be.revertedWith("Already registered");
        })
        it("should emit an event if addVoter is called by the owner", async function () {
            await expect(votingContract.addVoter(user5.address))
                .to.emit(votingContract, "VoterRegistered")
                .withArgs(user5.address);
        })
    })



    describe("startProposalsRegistering function Tests:", function () {
        beforeEach(async function () {
            const fixture = await loadFixture(registeringVotersSession);
            votingContract = fixture.votingContract;
            owner = fixture.owner;
            user1 = fixture.user1;
            user2 = fixture.user2;
            user3 = fixture.user3;
            user4 = fixture.user4;
            user5 = fixture.user5;

        })
        it("should revert if it called by a non-owner", async function () {
            await expect(votingContract.connect(user3).startProposalsRegistering())
                .to.be.revertedWithCustomError(votingContract, "OwnableUnauthorizedAccount")
                .withArgs(user3.address);

        })
        it("the first proposal description = GENESIS if startProposalsRegistering is called ", async function () {
            await votingContract.startProposalsRegistering();
            const firstProposal = await votingContract.connect(user1).getOneProposal(0);
            await expect(firstProposal.description).to.equal("GENESIS");
        })
        it("should emit an event if startProposalsRegistering is called by the owner ", async function () {
            await expect(votingContract.startProposalsRegistering())
                .to.emit(votingContract, "WorkflowStatusChange")
                .withArgs(0, 1)
        })
        it("should update the workflowStatus to ProposalsRegistrationStarted status when startProposalsRegistering is called by the owner", async function () {
            await votingContract.startProposalsRegistering()
            expect(await votingContract.workflowStatus()).to.equal(1);
        })
    })



    describe("addProposal & getOneProposal functions Tests:", function () {
        it("should revert if the workflowStatus is different of ProposalsRegistrationStarted", async function () {
            const fixture = await loadFixture(registeringVotersSession);
            votingContract = fixture.votingContract;
            user1 = fixture.user1;

            await expect(votingContract.connect(user1).addProposal("poposition of the voter")).to.be.revertedWith("Proposals are not allowed yet");

        })
        beforeEach(async function () {
            const fixture = await loadFixture(proposalSessionOpen);
            votingContract = fixture.votingContract;
            owner = fixture.owner;
            user1 = fixture.user1;
            user2 = fixture.user2;
            user3 = fixture.user3;
            user4 = fixture.user4;
            user5 = fixture.user5;

        })
        it("should revert if addProposal function is called by the owner", async function () {
            await expect(votingContract.addProposal("poposition of the owner")).to.be.revertedWith("You're not a voter");
        })
        it("should revert if addProposal function is called by a non-voter", async function () {
            await expect(votingContract.connect(user5).addProposal("poposition of the non-voter")).to.be.revertedWith("You're not a voter");
        })
        it("should revert if addVoters is called without proposition", async function () {
            const emptyProposal = "";
            await expect(votingContract.connect(user1).addProposal(emptyProposal)).to.be.revertedWith("Vous ne pouvez pas ne rien proposer");
        })
        it("should be ok if addVoters is called by a voter with a proposition not empty", async function () {
            await expect(votingContract.connect(user1).addProposal("poposition of the voter")).to.be.not.reverted;
        })
        it("should  emit an event ProposalRegistered if addProposal is called by a voter with a non empty proposition", async function () {
            await expect(votingContract.connect(user1).addProposal("poposition of the voter"))
                .to.emit(votingContract, "ProposalRegistered")
                .withArgs(1);
        })
        it("should get the proposal submitted by a voter with getOneProposal", async function () {
            await votingContract.connect(user1).addProposal("proposition of the voter");
            const proposal1 = await votingContract.connect(user2).getOneProposal(1);

            await expect(proposal1.description).to.equal("proposition of the voter");

        })
        it("should revert if getOneProposal is called by a non-voter", async function () {
            await expect(votingContract.connect(user5).getOneProposal(1)).to.be.revertedWith("You're not a voter");
        })
        it("should revert if getOneProposal is called by th Owner", async function () {
            await expect(votingContract.getOneProposal(1)).to.be.revertedWith("You're not a voter");
        })

    })

    describe("endProposalsRegistering function Tests:", function () {

        it("should revert if the workflowStatus is different of ProposalsRegistrationStarted", async function () {
            const fixture = await loadFixture(registeringVotersSession);
            votingContract = fixture.votingContract;

            await expect(votingContract.endProposalsRegistering()).to.be.revertedWith("Registering proposals havent started yet");

        })

        beforeEach(async function () {
            const fixture = await loadFixture(proposalSessionOpen);
            votingContract = fixture.votingContract;
            owner = fixture.owner;
            user1 = fixture.user1;
            user2 = fixture.user2;
            user3 = fixture.user3;
            user4 = fixture.user4;
            user5 = fixture.user5;

        })

        it("should revert if it called by a non-owner", async function () {
            await expect(votingContract.connect(user4).endProposalsRegistering())
                .to.be.revertedWithCustomError(votingContract, "OwnableUnauthorizedAccount")
                .withArgs(user4.address);

        })
        it("should emit an event if endProposalsRegistering is called by the owner ", async function () {
            await expect(votingContract.endProposalsRegistering())
                .to.emit(votingContract, "WorkflowStatusChange")
                .withArgs(1, 2)
        })
        it("should update the workflowStatus to ProposalsRegistrationStarted status when endProposalsRegistering is called by the owner", async function () {
            await votingContract.endProposalsRegistering()
            expect(await votingContract.workflowStatus()).to.equal(2);
        })

    })

    describe("startVotingSession function Tests:", function () {

        it("should revert if the workflowStatus is different of ProposalsRegistrationEnded", async function () {
            const fixture = await loadFixture(proposalSessionOpen);
            votingContract = fixture.votingContract;

            await expect(votingContract.startVotingSession()).to.be.revertedWith("Registering proposals phase is not finished");
        })

        beforeEach(async function () {
            const fixture = await loadFixture(proposalSessionClosed);
            votingContract = fixture.votingContract;
            owner = fixture.owner;
            user1 = fixture.user1;
            user2 = fixture.user2;
            user3 = fixture.user3;
            user4 = fixture.user4;
            user5 = fixture.user5;
        })

        it("should revert if it's called by a non-owner", async function () {
            await expect(votingContract.connect(user3).startVotingSession())
                .to.be.revertedWithCustomError(votingContract, "OwnableUnauthorizedAccount")
                .withArgs(user3.address);
        })

        it("should emit an event if startVotingSession is called by the owner ", async function () {
            await expect(votingContract.startVotingSession())
                .to.emit(votingContract, "WorkflowStatusChange")
                .withArgs(2, 3)
        })
        it("should update the workflowStatus to VotingSessionStarted status when startVotingSession is called by the owner", async function () {
            await votingContract.startVotingSession()
            expect(await votingContract.workflowStatus()).to.equal(3);
        })
    })

    describe("setVote & getVote function Tests:", function () {
        it("should revert if the workflowStatus is different of VotingSessionStarted", async function () {
            const fixture = await loadFixture(proposalSessionClosed);
            votingContract = fixture.votingContract;

            await expect(votingContract.connect(user1).setVote(1)).to.be.revertedWith("Voting session havent started yet");
        })

        beforeEach(async function () {
            const fixture = await loadFixture(votingSessionOpen);
            votingContract = fixture.votingContract;
            owner = fixture.owner;
            user1 = fixture.user1;
            user2 = fixture.user2;
            user3 = fixture.user3;
            user4 = fixture.user4;
            user5 = fixture.user5;

        })

        it("should revert if setVote is called by the owner", async function () {
            await expect(votingContract.setVote(1)).to.be.revertedWith("You're not a voter");
        })
        it("should revert if setVote is called by a non-voter", async function () {
            await expect(votingContract.connect(user5).setVote(1)).to.be.revertedWith("You're not a voter");
        })
        it("should revert if setVote is called by a voter who already voted", async function () {
            await votingContract.connect(user2).setVote(1);
            await expect(votingContract.connect(user2).setVote(2)).to.be.revertedWith("You have already voted");
        })
        it("should revert if the voter vote for a no proposal", async function () {
            await expect(votingContract.connect(user1).setVote(3)).to.be.revertedWith("Proposal not found");
        })
        it("should emit a voted event if setVote is called by a voter", async function () {
            await expect(votingContract.connect(user4).setVote(1))
                .to.emit(votingContract, "Voted")
                .withArgs(user4.address, 1);
        })
        it("should turn hasVoted field of struc Voter to true when a Voter vote", async function () {
            await votingContract.connect(user3).setVote(1);
            const voter3 = await votingContract.connect(user1).getVoter(user3.address);
            await expect(voter3.hasVoted).equal(true);

        })
        it("should update the votedProposalId field of the struct Voter to the number of proposal voted", async function () {
            await votingContract.connect(user1).setVote(2);
            const voter1 = await votingContract.connect(user1).getVoter(user1.address);
            await expect(voter1.votedProposalId).equal(2);
        })
        it("should revert if getVoter is called by the owner", async function () {
            await expect(votingContract.getVoter(user2.address)).revertedWith("You're not a voter");
        })
        it("should revert if getVoter is called by a non-voter", async function () {
            await expect(votingContract.connect(user5).getVoter(user3.address)).revertedWith("You're not a voter");
        })

    })

    describe("endVotingSession function Tests:", function () {

        it("should revert if the workflowStatus is different of VotingSessionStarted", async function () {
            const fixture = await loadFixture(proposalSessionClosed);
            votingContract = fixture.votingContract;

            await expect(votingContract.endVotingSession()).to.be.revertedWith("Voting session havent started yet");

        })

        beforeEach(async function () {
            const fixture = await loadFixture(votingSessionOpen);
            votingContract = fixture.votingContract;
            owner = fixture.owner;
            user1 = fixture.user1;
            user2 = fixture.user2;
            user3 = fixture.user3;
            user4 = fixture.user4;
            user5 = fixture.user5;

        })

        it("should revert if it's called by a non-owner", async function () {
            await expect(votingContract.connect(user2).endVotingSession())
                .to.be.revertedWithCustomError(votingContract, "OwnableUnauthorizedAccount")
                .withArgs(user2.address);
        })

        it("should emit a WorkflowStatusChange event  if endVotingSession is called by the owner ", async function () {
            await expect(votingContract.endVotingSession())
                .to.emit(votingContract, "WorkflowStatusChange")
                .withArgs(3, 4)
        })
        it("should update the workflowStatus to VotingSessionEnded status when endVotingSession is called by the owner", async function () {
            await votingContract.endVotingSession()
            expect(await votingContract.workflowStatus()).to.equal(4);
        })
    })

    describe("tallyVotes function Tests:", function () {

        it("should revert if the workflowStatus is different of votingSessionClosed", async function () {
            const fixture = await loadFixture(votingSessionOpen);
            votingContract = fixture.votingContract;

            await expect(votingContract.tallyVotes()).to.be.revertedWith("Current status is not voting session ended");

        })

        beforeEach(async function () {
            const fixture = await loadFixture(votingSessionClosed);
            votingContract = fixture.votingContract;
            owner = fixture.owner;
            user1 = fixture.user1;
            user2 = fixture.user2;
            user3 = fixture.user3;
            user4 = fixture.user4;
            user5 = fixture.user5;

        })

        it("should revert if tallyVotes is called by a non-owner", async function () {
            await expect(votingContract.connect(user2).tallyVotes())
                .to.be.revertedWithCustomError(votingContract, "OwnableUnauthorizedAccount")
                .withArgs(user2.address);
        })

        it("should emit a WorkflowStatusChange event with the last and the new status", async function () {
            await expect(votingContract.tallyVotes())
                .emit(votingContract, "WorkflowStatusChange")
                .withArgs(4, 5);

        })

        it("should update the workflowStatus to VotesTallied when tallyVotes is called", async function () {
            await votingContract.tallyVotes();
            expect(await votingContract.workflowStatus()).equal(5);
        })

        it("should get the ID of the winning proposal after calling tallyVotes", async function () {
            await votingContract.tallyVotes();
            expect(await votingContract.winningProposalID()).equal(2);

        })

    })

})