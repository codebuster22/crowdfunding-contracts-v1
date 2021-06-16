const DAO = artifacts.require('DAO');
const { expect } = require('chai');
const { BN, expectRevert, expectEvent, time, constants } = require('@openzeppelin/test-helpers');
const { toWei } = web3.utils;

const events = [
    'NewOwnerAdded',
    'NewProposalCreated',
    'VoteCasted',
    'CampaignDeployed'
];

contract('DAO', async (accounts) => {
    let [deployer, owner2, nonOwner, manager] = accounts;
    let dao;
    let options;
    let trx;
    let zeroBn = new BN(0);
    context('# Deploy new DAO', async () => {
        before("!! Deploy dao for testing", async () => {
            dao = await DAO.new({from: deployer});
        })
        it(">> Deployer should be an owner", async () => {
            expect((await dao.isOwner(deployer)).toString()).to.equal('1');
        });
        it(">> totalOwners should increase by 1", async () => {
            expect((await dao.totalOwners()).toString()).to.equal('1');
        });
        it(`>> should emit event ${events[0]} with correct values`, async () => {
            await expectEvent.inTransaction(
                dao.transactionHash,
                dao,
                events[0],
                {
                    inviter: constants.ZERO_ADDRESS,
                    newOwner: deployer
                }
            );
        });
    });
    context('# Add new Owner', () => {
        context('$ inviter is not owner', async () => {
            it(">> reverts", async () => {
                await expectRevert(
                    dao.addNewOwner(owner2, {from: nonOwner} ),
                    'DAO: onlyOnwer function'
                );
            });
        });
        context('$ inviter is owner', async () => {
            it(">> Owner can only be added by another owner", async () => {
                expect((await dao.isOwner(owner2)).toString()).to.equal('0');
                trx = await dao.addNewOwner(owner2, {from: deployer});
                expect((await dao.isOwner(owner2)).toString()).to.equal('1');
            });
            it(">> totalOwners should increase by 1", async () => {
                expect((await dao.totalOwners()).toString()).to.equal('2');
            });
            it(`>> should emit an event ${events[0]}`, async () => {
                await expectEvent(
                    trx.receipt,
                    events[0],
                    {
                        inviter: deployer,
                        newOwner: owner2
                    }
                );
            });
        });
        context('$ adding already existing owner as new owner', async () => {
            it(">> reverts", async () => {
                await expectRevert(
                    dao.addNewOwner(owner2, {from: deployer} ),
                    'DAO: already an owner'
                );
            });
        });
    });
    context('# Add new proposal', async () => {
        before("!! Create argument options for new proposal", async () => {
            options = [
                "Fundraiser for Blockchain batch-2",
                '0x',
                toWei('100'),
                toWei('10'),
                30
            ];
        });
        it(">> should add new proposal", async () => {
            trx = await dao.addProposal(...options, {from: manager});
            const proposal = await dao.proposals(0);
            expect(proposal['0']).to.equal(options[0]);
            expect(proposal['1']).to.equal(null);
            expect(proposal['2']).to.equal(manager);
            expect(proposal['3'].toString()).to.equal(options[2].toString());
            expect(proposal['4'].toString()).to.equal(options[3].toString());
            expect(proposal['5'].toString()).to.equal(options[4].toString());
            expect(proposal['6'].toString()).to.equal('0');
            expect((await dao.campaignManagers(deployer)).toString()).to.equal('0')
        });
        it(`>> should emit an event ${events[1]}`, async () => {
            await expectEvent(
                trx.receipt,
                events[1],
                {
                    manager: manager,
                    proposalId: zeroBn
                }
            );
        });
    });
    context('# voting', async () => {
        context('$ voter in not an owner', async () => {
            it('>> reverts', async () => {
                await expectRevert(
                    dao.vote(0, {from: nonOwner}),
                    "DAO: onlyOnwer function"
                )
            });
        });
        context('$ voter is an owner', async () => {
            it('>> increases total vote count for proposal', async () => {
                await dao.vote(0, {from: deployer});
                expect((await dao.campaignVotes(0)).toString()).to.equal('1');
            });
            it('>> cannot vote again on same proposal', async () => {
                await expectRevert(
                    dao.vote(0, {from: deployer}),
                    "DAO: already casted vote for this proposal"
                )
            });
        });
    })
    context('# get all proposals', async () => {
        it('>> should return all proposals', async() => {
            expect((await dao.getProposals()).length).to.equal(1);
        });
    });
});