const DAO = artifacts.require('DAO');
const Campaign = artifacts.require('Campaign');
const { expect } = require('chai');
const { BN, expectRevert, expectEvent, time, constants } = require('@openzeppelin/test-helpers');
const { toWei } = web3.utils;

const daoEvents = [
    'NewOwnerAdded',
    'NewProposalCreated',
    'VoteCasted',
    'CampaignDeployed'
];

module.exports = {
    DAO,
    Campaign,
    expect,
    BN,
    expectRevert,
    expectEvent,
    time,
    constants,
    toWei,
    daoEvents
};