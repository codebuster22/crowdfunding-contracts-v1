const DAO = artifacts.require("DAO");
const Campaign = artifacts.require("Campaign");
const Token = artifacts.require("NobelToken");
const {toWei} = web3.utils;

module.exports = async (deployer) => {
  await deployer.deploy(DAO);
  await deployer.deploy(Campaign);
  await deployer.deploy(Token, 'Nobel Token', 'NBT', toWei('100000000000000000000'));
  
  const dao = await DAO.deployed();
  const campaign = await Campaign.deployed();
  await dao.setMasterCopy(campaign.address);
};
