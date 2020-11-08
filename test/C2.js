const C2 = artifacts.require("C2");
const BackingToken = artifacts.require("BackingToken");
var BackingToken21 = artifacts.require("BackingToken21");
var BackingToken15 = artifacts.require("BackingToken15");
var BackingToken6 = artifacts.require("BackingToken6");
const truffleAssert = require('truffle-assertions');
const BN = require('bn.js')


const getBalance = async (instance, addr) => {
    const bal = await instance.balanceOf.call(addr);
    return bal.toNumber();
}
const assertBalance = async (instance, addr, amount) => {
    const bal = await getBalance(instance, addr);
    assert.equal(bal, amount, `Balance is ${bal}, not ${amount}`);
}

function testStakingRatio(establishBac, establishC2) {
    const initialStakingRatio = establishBac / establishC2;

    const equivBac = function (amountC2) {
        return Math.ceil(amountC2 * initialStakingRatio);
    }

    contract("C2", async (acc) => {
        const issueC2 = async (addr, amount) => {
            const backingNeeded = await this.c2.backingNeededFor.call(amount);
            await this.bac.approve(this.c2.address, backingNeeded);
            return await this.c2.issue(addr, amount);
        }

        before(async () => {
            this.bac = await BackingToken.deployed();
            this.c2 = await C2.deployed();
        })

        beforeEach(async () => {
            this.c2Bal = await Promise.all(
                [...Array(10).keys()]
                    .map(x => getBalance(this.c2, acc[x]))
            );

            this.bacBal = await Promise.all(
                [...Array(10).keys()]
                    .map(x => getBalance(this.bac, acc[x]))
            );
        })
    
        it("Can access version string", async () => {
            const version = await this.c2.version.call();
            assert.equal(version, "cc v0.1.2");
        })

        it("issues BackingToken to account 0 in the migration", async () => {
            const supply = await this.bac.totalSupply();
            assert.isAbove(supply.toNumber(), 0);
            assert.equal(this.bacBal[0], supply.toNumber());
        })

        it("needs to be established first", async () => {
            assert.isFalse(await this.c2.isEstablished.call())
            await this.bac.approve(this.c2.address, establishBac);
            // not established yet so this reverts
            truffleAssert.reverts(this.c2.issue(acc[0], establishC2));

            await this.c2.establish(this.bac.address, establishBac, establishC2)

            assert.isTrue(await this.c2.isEstablished.call())
            await assertBalance(this.c2, acc[0], establishC2)
            assert.equal(await this.c2.totalSupply.call(), establishC2)

            await assertBalance(this.bac, this.c2.address, establishBac);
            await assertBalance(this.bac, acc[0], this.bacBal[0] - establishBac);
        })

        it("cannot be established twice", async () => {
            await this.bac.approve(this.c2.address, establishBac);
            truffleAssert.reverts(this.c2.establish(this.bac.address, establishBac, establishC2));
        })

        it("Can retrieve backing token address", async () => {
            const address = await this.c2.backingToken();
            assert.equal(this.bac.address, address);
          })

        it("correctly calculates equivalent bac", async () => {
            for (c2Amount of [1, 2, 100, 12854, 324774, 234443, 25011]) {
                const backingNeeded = await this.c2.backingNeededFor.call(c2Amount);
                assert.equal(backingNeeded, equivBac(c2Amount))
            }
        })

        it("can issue tokens", async () => {
            const c2ToIssue = 1;
            const tx = await issueC2(acc[1], c2ToIssue);

            truffleAssert.eventEmitted(tx, 'Issued', (ev) => {
                return ev.account === acc[1] && ev.c2Issued.toNumber() === c2ToIssue && ev.backingAmount.toNumber() === equivBac(c2ToIssue)
            })
            await assertBalance(this.c2, acc[1], this.c2Bal[1] + c2ToIssue);
            await assertBalance(this.bac, acc[0], this.bacBal[0] - equivBac(c2ToIssue));
        });

        if (initialStakingRatio > 0){
            it("must stake backing tokens to issue c2", async () => {
                const c2ToIssue = 1;
                truffleAssert.reverts(this.c2.issue(acc[1], c2ToIssue));
            });
        } else {
            it("can issue c2 for free", async () => {
                const c2ToIssue = 1;
                this.c2.issue(acc[1], c2ToIssue)
                await assertBalance(this.c2, acc[1], this.c2Bal[1] + c2ToIssue)
            })
        }

        it("should only allow the owner to issue tokens", async () => {
            const c2ToIssue = 1000;
            const bacNeeded = equivBac(c2ToIssue);
            await this.bac.transfer(acc[1], bacNeeded);
            await this.bac.approve(this.c2.address, bacNeeded, { from: acc[1] });
            truffleAssert.reverts(this.c2.issue(acc[1], c2ToIssue, { from: acc[1] }))
        });

        it("can relinquish tokens", async () => {
            const amountToRelinquish = 5;
            await issueC2(acc[1], amountToRelinquish);

            await assertBalance(this.c2, acc[1], this.c2Bal[1] + amountToRelinquish);
            await assertBalance(this.bac, acc[0], this.bacBal[0] - equivBac(amountToRelinquish));

            const tx = await this.c2.burn(amountToRelinquish, { from: acc[1] });

            truffleAssert.eventEmitted(tx, 'Burned', (ev) => {
                return ev.account === acc[1] && ev.c2Burned.toNumber() === amountToRelinquish, ev.backingReturned.toNumber() === equivBac(amountToRelinquish)
            })
            await assertBalance(this.c2, acc[1], this.c2Bal[1]);
            await assertBalance(this.bac, acc[0], this.bacBal[0]);
        });

        it("can cash out", async () => {
            const amountToIssue = 11;
            const amountToCashOut = 7;
            await issueC2(acc[2], amountToIssue);

            await assertBalance(this.c2, acc[2], this.c2Bal[2] + amountToIssue);

            const tx = await this.c2.cashout(amountToCashOut, { from: acc[2] });

            truffleAssert.eventEmitted(tx, 'CashedOut', (ev) => {
                return ev.account === acc[2], ev.c2Exchanged.toNumber() === amountToCashOut, ev.backingReceived.toNumber() === equivBac(amountToCashOut)
            })
            await assertBalance(this.c2, acc[2], this.c2Bal[2] + amountToIssue - amountToCashOut);
            await assertBalance(this.bac, acc[2], this.bacBal[2] + equivBac(amountToCashOut));
        });

        it("requires the totalC2 amount of BAC to be funded", async () => {
            const totalC2 = await this.c2.totalSupply()
            const backingNeeded = await this.c2.totalBackingNeededToFund.call()
            assert.isTrue(backingNeeded.eq(totalC2))
        })
    });
}

function testBacDecimals(bacContract, bacDec, establishBac, establishC2) {
    contract(`C2 backed by BAC${bacDec}`, async (acc) => {
        const initialStakingRatio = establishBac / establishC2;

        before(async () => {
            this.bac = await bacContract.deployed();
            this.c2 = await C2.deployed();

            const c2Decimals = await this.c2.decimals.call()
            const bacDecimals = await this.bac.decimals.call()
            assert.isTrue(bacDecimals.eq(new BN(bacDec)));
            this.deltaDecimals = bacDecimals.sub(c2Decimals);

            // Adjust establishing amounts so that the funding ratio stays correct
            const minDecimals = BN.min(bacDecimals, c2Decimals)
            const adjEstablishBac = new BN(establishBac).mul(new BN(10).pow(bacDecimals.sub(minDecimals)))
            const adjEstablishC2 = new BN(establishC2).mul(new BN(10).pow(c2Decimals.sub(minDecimals)))

            // establish
            await this.bac.approve(this.c2.address, adjEstablishBac);
            await this.c2.establish(this.bac.address, adjEstablishBac, adjEstablishC2);
        });
        
        it(`gives accurate funding data when BAC has ${bacDec} decimals`, async () => {
            const totalC2 = await this.c2.totalSupply();
            const expectedBacForFunded = (this.deltaDecimals >= 0 ) ? totalC2.mul(new BN(10).pow(this.deltaDecimals)) : (totalC2.divmod(new BN(10).pow(this.deltaDecimals))).div
            const realBacForFunded = await this.c2.totalBackingNeededToFund.call();

            assert.isTrue(realBacForFunded.eq(expectedBacForFunded));
        });

        if (initialStakingRatio >= 1) {
            it("is already fully funded", async () => {
                assert.isTrue(await this.c2.isFunded.call())
            })
        } else {
            it("requires BAC to be funded", async () => {
                assert.isFalse(await this.c2.isFunded.call())
            });
        }
        
    });
}

function testAllBacDecimals(establishBac, establishC2) {
    testBacDecimals(BackingToken, 18, establishBac, establishC2);
    testBacDecimals(BackingToken21, 21, establishBac, establishC2);
    testBacDecimals(BackingToken15, 15, establishBac, establishC2);
    testBacDecimals(BackingToken6, 6, establishBac, establishC2);
}

describe("100% inital staking ratio", () => {
    testStakingRatio(100, 100)
    testAllBacDecimals(100, 100)
});

describe("10% intial staking ratio", () => {
    testStakingRatio(100, 1000)
    testAllBacDecimals(100, 1000)
});

describe("1% initial staking ratio", () => {
    testStakingRatio(50, 5000)
    testAllBacDecimals(50, 5000)

});

describe("0% initial staking ratio", () => {
    testStakingRatio(0, 5000)
    testAllBacDecimals(0, 5000)
});
