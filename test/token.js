const {
    Token,
    expect,
    BN,
    expectRevert,
    expectEvent,
    constants,
    toWei
} = require('./helpers/setup.js');

contract('Token', async (accounts) => {
    let [deployer, buyer1, buyer2] = accounts;
    let token;

    context('# Deploy token', async () => {
        it('>> should set correct values', async () => {
            token = await Token.new('Nobel Token', 'NBT', toWei('1000000'));
            expect((await token.totalSupply()).toString()).to.equal(toWei('1000000'));
            expect(await token.name()).to.equal('Nobel Token');
            expect(await token.symbol()).to.equal('NBT');
        });
    });
});
