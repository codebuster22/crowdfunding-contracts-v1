const {
    Campaign,
    Token,
    expect,
    BN,
    expectRevert,
    expectEvent,
    constants,
    toWei
} = require('./helpers/setup.js');

contract('Campaign', (accounts) => {
    let [deployer, manager, user1] = accounts;
    let campaign;
    let token;
    let trx;
    let name = "Fundraiser for Blockchain batch-2";
    let duration = 30;
    let maximumTarget = toWei('100');
    let minimumTarget = toWei('10');
    let hash = '0x00';
    context('# Deploy & Initialize new Capmaign', async () => {
        before('!! Deploy campaign & New Token', async () => {
            campaign = await Campaign.new();
            token = await Token.new('Nobel Token', 'NBT', toWei('1000000'));
        })
        it('>> should initialize new campaign contract', async () => {
            await campaign.initialize(
                name,
                manager,
                duration,
                maximumTarget,
                minimumTarget,
                hash,
                {from: deployer}
            );
            expect(await campaign.name()).to.equal(name);
            expect(await campaign.manager()).to.equal(manager);
            expect((await campaign.duration()).toString()).to.equal(duration.toString());
            expect((await campaign.maximumTarget()).toString()).to.equal(maximumTarget);
            expect((await campaign.minimumTarget()).toString()).to.equal(minimumTarget);
            expect(await campaign.hash()).to.equal(hash);
        });
        it('>> reverts when token address is zero', async => {
            
        });
        it('>> should set distribution token', async () => {
            await campaign.setToken(token.address, 5);
            expect((await campaign.token())).to.equal(token.address);
            expect((await campaign.price()).toString()).to.equal('5');
        });
    });
    context('# contribute to campaign', async () => {
        context('$ campaign is not active', async () => {
            it('>> reverts', async () => {
                await expectRevert(
                    campaign.contribute({from: user1, value: toWei('1')}),
                    "Campaign: not yet started"
                );
            });
        });
        context('$ campaign is active', async () => {
            before('!! activate campaign', async () => {
                await campaign.startCampaign({from: manager});
            });
            it('>> should contribute to the campaign', async () => {
                trx = await campaign.contribute({from: user1, value: toWei('1')});
                expect((await campaign.totalCollected()).toString()).to.equal(toWei('1'));
                expect((await campaign.contributors(user1)).toString()).to.equal(toWei('1'));
            });
            it('>> should emit an event NewContribution', async () => {
                await expectEvent(
                    trx.receipt,
                    'NewContribution'
                )
            });
        });
    });
})