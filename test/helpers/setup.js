const DAO = artifacts.require('DAO');
const Campaign = artifacts.require('Campaign');
const Token = artifacts.require('NobelToken');
const { expect } = require('chai');
const { BN, expectRevert, expectEvent, time, constants, balance } = require('@openzeppelin/test-helpers');
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
    Token,
    expect,
    BN,
    expectRevert,
    expectEvent,
    time,
    constants,
    balance,
    toWei,
    daoEvents
};