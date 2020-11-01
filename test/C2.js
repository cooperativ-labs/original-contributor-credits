const C2 = artifacts.require("C2");
const BackingToken = artifacts.require("BackingToken");
const truffleAssert = require('truffle-assertions');
const bn = require('bn.js');


const getBalance = async (instance, addr) => {
    return await instance.balanceOf.call(addr);
}
const assertBalance = async (instance, addr, amount) => {
    const bal = await getBalance(instance, addr);
    assert.isTrue(bal.eq(amount), `Balance is ${bal}, not ${amount}`);
}
// describe("1% initial staking ratio", () => {
//     testStakingRatio(50, 5000)
// })

function testStakingRatio(establishBac, establishC2) {
    const initialStakingRatio = establishBac / establishC2;

    const equivBac = function (amountC2) {
        return Math.ceil(amountC2 * initialStakingRatio);
    }

    contract("C2", async (acc) => {
        const issueC2 = async (addr, amount) => {
            const backingNeeded = await this.c2._backingNeededFor.call(amount);
            await this.bac.approve(this.c2.address, backingNeeded);
            return await this.c2.issue(addr, amount);
        }

        before(async () => {
            this.c2 = await C2.deployed();
            this.bac = await BackingToken.deployed();
            this.testAccountIndex = 0;
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

        it("Can retrieve backing token address", async () => {
          const address = await this.c2.backingToken();
          assert.equal(this.bac.address, address);
        })
    
        it("Can access version string", async () => {
            const version = await this.c2.version.call();
            assert.equal(version, "cc v0.1.0");
        })

        it("should issue BackingToken to account 0", async () => {
            const supply = await this.bac.totalSupply();
            assert.isTrue(supply.gt(0));
            assert.isTrue(this.bacBal[0].eq(supply));
        })

        it("needs to be established first", async () => {
            await this.bac.approve(this.c2.address, establishBac);
            // not established yet so this reverts
            truffleAssert.reverts(this.c2.issue(acc[0], establishC2));

            await this.c2.establish(establishBac, establishC2)

            await assertBalance(this.c2, acc[0], establishC2)
            assert.equal(await this.c2.totalSupply.call(), establishC2)

            await assertBalance(this.bac, this.c2.address, establishBac);
            await assertBalance(this.bac, acc[0], this.bacBal[0] - establishBac);
        })

        it("cannot be established twice", async () => {
            await this.bac.approve(this.c2.address, establishBac);
            truffleAssert.reverts(this.c2.establish(establishBac, establishC2));
        })

        it("correctly calculates equivalent bac", async () => {
            for (c2Amount of [1, 2, 100, 12854, 324774, 234443, 25011]) {
                const backingNeeded = await this.c2._backingNeededFor.call(c2Amount);
                assert.equal(backingNeeded, equivBac(c2Amount))
            }
        })

        it("can issue tokens", async () => {
            const c2ToIssue = new bn(1);
            const tx = await issueC2(acc[1], c2ToIssue);

            truffleAssert.eventEmitted(tx, 'Issued', (ev) => {
                return ev.account === acc[1] && ev.c2Issued.eq(c2ToIssue) && ev.backingAmount.eq(equivBac(c2ToIssue))
            })
            await assertBalance(this.c2, acc[1], c2ToIssue);
            await assertBalance(this.bac, acc[0], this.bacBal[0] - equivBac(c2ToIssue));
        });

        it("must stake backing tokens to issue c2", async () => {
            const c2ToIssue = new bn(1);
            truffleAssert.reverts(this.c2.issue(acc[1], c2ToIssue));
        });

        it("should only allow the owner to issue tokens", async () => {
            const c2ToIssue = new bn(1000);
            const bacNeeded = equivBac(c2ToIssue);
            await this.bac.transfer(acc[1], bacNeeded);
            await this.bac.approve(this.c2.address, bacNeeded, { from: acc[1] });
            truffleAssert.reverts(this.c2.issue(acc[1], c2ToIssue, { from: acc[1] }))
        });

        it("can relinquish tokens", async () => {
            const amountToRelinquish = new bn(5);
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
    });
}

// describe("100% inital staking ratio", () => {
//     testStakingRatio(100, 100)
// });

describe("10% intial staking ratio", () => {
    testStakingRatio(100, 1000)
});

// describe("1% initial staking ratio", () => {
//     testStakingRatio(50, 5000)
// })
