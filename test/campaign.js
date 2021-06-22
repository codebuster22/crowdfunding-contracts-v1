const {
    Campaign,
    Certificate,
    Token,
    expect,
    BN,
    expectRevert,
    expectEvent,
    constants,
    balance,
    toWei,
    time
} = require('./helpers/setup.js');

contract('Campaign', (accounts) => {
    let [deployer, manager, user1, user2] = accounts;
    let campaign;
    let certificate;
    let test;
    let testCertificate;
    let token;
    let trx;
    let event;
    let price = 5;
    let name = "Fundraiser for Blockchain batch-2";
    let duration = 30;
    let maximumTarget = toWei('100');
    let minimumTarget = toWei('10');
    let hash = '0x00';
    context('# Deploy & Initialize new Campaign', async () => {
        before('!! Deploy campaign & New Token', async () => {
            campaign = await Campaign.new();
            token = await Token.new('Nobel Token', 'NBT', toWei('1000000'));
        })
        it('>> should initialize new campaign contract', async () => {
            trx = await campaign.initialize(
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
            expect((await campaign.duration()).toString()).to.equal((duration*(24*60*60)).toString());
            expect((await campaign.maximumTarget()).toString()).to.equal(maximumTarget);
            expect((await campaign.minimumTarget()).toString()).to.equal(minimumTarget);
            expect(await campaign.hash()).to.equal(hash);
        });
        it('>> deploy new NobelCertificate Contract', async () => {
            event = await expectEvent(
                trx.receipt,
                'CertificateDeployed'
            );
            certificate = await Certificate.at(event.args.certificate);
            expect(await certificate.name()).to.equal("Nobel Certificate");
            expect(await certificate.controller()).to.equal(campaign.address);
        });
        it('>> cannot start campaign is token not set', async () => {
            await expectRevert(
                campaign.startCampaign({from: manager}),
                'Campaign: distribution token not set'
            );
        });
        it('>> reverts when token address is zero', async () => {
            await expectRevert(
                campaign.setToken(constants.ZERO_ADDRESS, price, {from: manager}),
                "Campaign: token cannot be null"
            );
        });
        it('>> should set distribution token', async () => {
            trx = await campaign.setToken(token.address, price);
            expect((await campaign.token())).to.equal(token.address);
            expect((await campaign.price()).toString()).to.equal(price.toString());
        });
        it('>> shoulde emit event TokenUpdated', async () => {
            await expectEvent(
                trx.receipt,
                'TokenUpdated'
            );
        });
        it('>> reverts when trying to initialise again', async () => {
            await expectRevert(
                campaign.setToken(token.address, price),
                "Campaign: contract already initialized"
            )
        })
    });
    context('# start campaign', async () => {
        context('$ trying to contribute', async () => {
            it('>> reverts', async () => {
                await expectRevert(
                    campaign.contribute({from: user1, value: toWei('1')}),
                    "Campaign: not yet started"
                );
            });
        });
        context('$ sender is not manager', async () => {
            it('>> reverts', async () => {
                await expectRevert(
                    campaign.startCampaign({from: deployer}),
                    "Campaign: onlyManager function"
                );
            });
        });
        context('$ sender is manager', async () => {
            it('>> should start campaign', async () => {
                trx = await campaign.startCampaign({from: manager});
                expect((await campaign.isActive()).toString()).to.equal('1');
                expect((await campaign.startTime()).toString()).to.equal((await time.latest()).toString());
            });
            it('>> should emit event CampaingStarted', async () => {
                await expectEvent(
                    trx.receipt,
                    'CampaingStarted'
                );
            });
        });
        context('$ campaign already active', async()=> {
            it('>> reverts', async () => {
                await expectRevert(
                    campaign.startCampaign({from: manager}),
                    "Campaign: alrerady active"
                );
            });
        });
    });
    context('# contribute to campaign', async () => {
        context('$ campaign is active', async () => {
            context('* campaign is not funded', async () => {
                it('>> reverts', async () => {
                    await expectRevert(
                        campaign.contribute({from: user1, value: toWei('1')}),
                        'Campaign: not yet funded'
                    );
                });
            });
            context('* campaign is funded', async () => {
                before('!! fund campaign with required tokens', async () => {
                    const requiredTokens = new BN(maximumTarget).mul(new BN(price));
                    await token.transfer(campaign.address, requiredTokens, {from: deployer});
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
                    );
                });
                it('>> should set isMinimumReached = 1 when funds collected is > minimumTarget', async () => {
                    trx = await campaign.contribute({from: user1, value: toWei('10')});
                    expect((await campaign.isMinimumReached()).toString()).to.equal('1');
                });
                it('>> should emit event CampaignFinalaised', async () => {
                    await expectEvent(
                        trx.receipt,
                        'CampaignFinalaised'
                    );
                });
                it('>> should set isMaximumReached = 1 when funds collected is > maximumTarget', async ()=> {
                    trx = await campaign.contribute({from: user2, value: toWei('89')});
                    expect((await campaign.isMaximumReached()).toString()).to.equal('1');
                });
                it('>> should emit event MaximumReached', async () => {
                    await expectEvent(
                        trx.receipt,
                        'MaximumReached'
                    );
                });
                it('>> cannot collect funds more than maximum target', async () => {
                    await expectRevert(
                        campaign.contribute({from: user2, value: toWei('1')}),
                        'Campaign: contribution exceeds maximum target'
                    );
                });
            });
        });
    });
    context('# retrieve contribution', async () => {
        before('!! deploy test campaign', async () => {
            test = await Campaign.new();
            await test.initialize(
                name,
                manager,
                10,
                maximumTarget,
                minimumTarget,
                hash,
                {from: deployer}
            );
            testCertificate = await Certificate.at(await test.nbc());
            await test.setToken(token.address, price);
            await test.startCampaign({from: manager});
            const requiredTokens = new BN(maximumTarget).mul(new BN(price));
            await token.transfer(test.address, requiredTokens, {from: deployer});
            await test.contribute({from: user1, value: toWei('1')});
        });
        context('$ Campaign not yet finalized', async () => {
            it('>> should not claim any tokens', async () => {
                await expectRevert(
                    test.claimTokens(),
                    'Campaign: The campaign have not been finalised'
                );
            });
            it('>> should retrieve contribution', async () => {
                const prevBalance = await balance.current(user1, 'wei');
                const contribution = await test.contributors(user1);
                trx = await test.retrieveContribution({from: user1});
                expect((await test.totalCollected()).toString()).to.equal('0');
                expect((await test.contributors(user1)).toString()).to.equal('0');
                const currentBalance = new BN(await balance.current(user1, 'wei'));
                expect
                    (
                        (currentBalance.divRound(new BN(toWei('0.01')))).toString()
                    ).to.equal(
                    (prevBalance.add(contribution).divRound(new BN(toWei('0.01')))).toString()
                );
            });
            it('>> should emit event RetrievedContribution', async () => {
                await expectEvent(
                    trx.receipt,
                    'RetrievedContribution'
                );
            });
            it('>> cannot generate certificate from nor controller', async () => {
                await expectRevert(
                    testCertificate.generateCertificate(user2, toWei('10'),{from: user1}),
                    'NobelCertificate: onlyController function'
                );
            });
        });
        context('$ Campaign is finalized', async ()=> {
            before('!! finalize the campaign', async () => {
                await test.contribute({from: user1, value: toWei('11')});
                await time.increase(time.duration.days(11));
            });
            it('>> cannot retrieve contribution', async () => {
                await expectRevert(
                    test.retrieveContribution({from: user1}),
                    'Campaign: The campaign have been finalised'
                );
            });
            it('>> can claim tokens', async () => {
                trx = await test.claimTokens({from: user1});
                expect((await test.haveClaimed(user1)).toString()).to.equal('1');
                expect((await token.balanceOf(user1)).toString()).to.equal(
                    toWei((11*price).toString())
                );
                event = await expectEvent.inTransaction(
                    trx.tx,
                    testCertificate,
                    'Transfer',
                    {
                        to: user1
                    }
                );
                expect(await testCertificate.ownerOf(event.args.tokenId)).to.equal(user1);
            });
            it('>> should emit event TokensClaimed', async () => {
                await expectEvent(
                    trx.receipt,
                    'TokensClaimed'
                );
            });
        });
    });
    context('# withdraw ethers', async () => {
        context('$ Campaign is not yet finalized', async () => {
            it('>> reverts', async () => {            
                await expectRevert(
                    campaign.withdraw(toWei('1'), {from: manager}),
                    "Campaign: The campaign have not been finalised"
                );
            });
        });
        context('$ Campaign is finalized', async () => {
            before("!! jump 20 days ahead", async () => {
                await time.increase(time.duration.days(20));
            })
            it('>> cannot withdraw more than collected', async () => {
                await expectRevert(
                    campaign.withdraw(toWei('101'), {from: manager}),
                    "Campaign: Cannot withdraw more than collected"
                );
            });
            it('>> can withdraw amount in bounds', async () => {
                const prevBalance = await balance.current(manager, 'wei');
                trx = await campaign.withdraw(toWei('50'), {from: manager});
                const amountToWithdraw = new BN(toWei('50'));
                const currentBalance = new BN(await balance.current(manager, 'wei'));  
                expect
                    (
                        (currentBalance.divRound(new BN(toWei('1')))).toString()
                    ).to.equal(
                    (prevBalance.add(amountToWithdraw).divRound(new BN(toWei('1')))).toString()
                );
                expect((await campaign.totalWithdrawn()).toString()).to.equal(amountToWithdraw.toString())
            });
            it('>> should emit event ContributionWithdrawen', async () => {
                await expectEvent(
                    trx.receipt,
                    'ContributionWithdrawen'
                );
            })
        });
    });
    context('# close campaign', async () => {
        context('$ campaign have been finalized', async () => {
            it('>> reverts', async () => {
                await expectRevert(
                    campaign.closeCampaign({from: manager}),
                    "Campaign: The campaign have been finalised"
                );
            });
        });
        context('$ campaign have not been finalized', async () => {
            before("!! deploy new campaign", async () => {
                campaign = await Campaign.new();
                await campaign.initialize(
                    name,
                    manager,
                    10,
                    maximumTarget,
                    minimumTarget,
                    hash,
                    {from: deployer}
                );
                await campaign.setToken(token.address, price);
                await campaign.startCampaign({from: manager});
                const requiredTokens = new BN(maximumTarget).mul(new BN(price));
                await token.transfer(campaign.address, requiredTokens, {from: deployer});
                await campaign.contribute({from: user1, value: toWei('1')});
            });
            it('>> closes campaign', async () => {
                trx = await campaign.closeCampaign({from: manager});
                expect( (await campaign.isClosed()).toString() ).to.equal('1');
            });
            it('>> should emit event CampaignClosed', async () => {
                await expectEvent(
                    trx.receipt,
                    'CampaignClosed'
                );
            });
        });
    });
})