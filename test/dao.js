const DAO = artifacts.require('DAO');
const { expect } = require('chai');
const { BN, toWei } = web3.utils;

contract('DAO', async (accounts) => {
    let [deployer, owner2] = accounts;
    let dao;
    let options;
    context('# Deploy new DAO', async () => {
        before("!! Deploy dao for testing", async () => {
            dao = await DAO.new();
        })
        it(">> Deployer should be an owner", async () => {
            expect((await dao.isOwner(deployer)).toString()).to.equal('1');
        });
        it(">> totalOwners should increase by 1", async () => {
            expect((await dao.totalOwners()).toString()).to.equal('1');
        });
    });
    context('# Add new Owner', () => {
        it(">> Owner can only be added by another owner", async () => {
            expect((await dao.isOwner(owner2)).toString()).to.equal('0');
            await dao.addNewOwner(owner2);
            expect((await dao.isOwner(owner2)).toString()).to.equal('1');
        });
        it(">> totalOwners should increase by 1", async () => {
            expect((await dao.totalOwners()).toString()).to.equal('2');
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
            await dao.addProposal(...options);
            const proposal = await dao.proposals(0);
            expect(proposal['0']).to.equal(options[0]);
            expect(proposal['1']).to.equal(null);
            expect(proposal['2']).to.equal(deployer);
            expect(proposal['3'].toString()).to.equal(options[2].toString());
            expect(proposal['4'].toString()).to.equal(options[3].toString());
            expect(proposal['5'].toString()).to.equal(options[4].toString());
            expect(proposal['6'].toString()).to.equal('0');
            expect((await dao.campaignManagers(deployer)).toString()).to.equal('0')
        });
    });
});