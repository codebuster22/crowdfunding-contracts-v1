const DAO = artifacts.require('DAO');
const { expect } = require('chai');
const {BN} = web3.utils;

contract('DAO', async (accounts) => {
    let [deployer, owner2] = accounts;
    let dao;
    context('# Deploy new DAO',() => {
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
});