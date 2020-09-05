const C2 = artifacts.require("C2");
const BackingToken = artifacts.require("BackingToken");
const truffleAssert = require('truffle-assertions');


const getBalance = async (instance, addr) => {
    const bal = await instance.balanceOf.call(addr);
    return bal.toNumber();
}
const assertBalance = async (instance, addr, amount) => {
    const bal = await getBalance(instance, addr);
    assert.equal(bal, amount, `Balance is ${bal}, not ${amount}`);
}

function testStakingRatio(establishBac, establishC2) {
    const initialStakingRatio = establishBac/establishC2;

    contract("C2", async (acc) => {
        const issue = async (addr, amount) => {
            const backingNeeded = await this.c2._backingNeededFor.call(amount);
            await this.bac.approve(this.c2.address, amount);
            await this.c2.issue(addr, amount);
        }
        
        before(async () =>{
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
    
        it("should issue BackingToken to account 0", async () => {
            const supply = await this.bac.totalSupply();
            assert.isAbove(supply.toNumber(), 0);
            assert.equal(this.bacBal[0], supply.toNumber());
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

        it("can issue tokens", async () => {
            const c2ToIssue = 1;
            await issue(acc[1], c2ToIssue);

            await assertBalance(this.c2, acc[1], c2ToIssue);
            await assertBalance(this.bac, acc[0], this.bacBal[0] - int(c2ToIssue * initialStakingRatio);
        });

        it("must stake backing tokens to issue c2", async() => {
            truffleAssert.reverts(this.c2.issue(acc[1], this.bacBal[0] + 1));
        });

        it("should only allow the owner to issue tokens", async() => {
            const c2ToIssue = 1;
            await this.bac.transfer(acc[1], c2ToIssue);
            await this.bac.approve(this.c2.address, c2ToIssue, { from: acc[1] });
            truffleAssert.reverts(this.c2.issue(acc[1], 1, { from: acc[1] }))
        });

        it("can relinquish tokens", async() => {
            const amountToRelinquish = 5;
            await issue(acc[1], amountToRelinquish);

            await assertBalance(this.c2, acc[1], this.c2Bal[1] + amountToRelinquish);
            await assertBalance(this.bac, acc[0], this.bacBal[0] - amountToRelinquish);
            
            await this.c2.burn(amountToRelinquish, { from: acc[1] });

            await assertBalance(this.c2, acc[1], this.c2Bal[1]);
            await assertBalance(this.bac, acc[0], this.bacBal[0]);
        });

        it("can cash out", async() => {
            const amountToIssue = 11;
            const amountToCashOut = 7;
            await issue(acc[2], amountToIssue);

            await assertBalance(this.c2, acc[2], this.c2Bal[2] + amountToIssue);

            await this.c2.cashout(amountToCashOut, { from: acc[2] });

            await assertBalance(this.c2, acc[2], this.c2Bal[2] + amountToIssue - amountToCashOut);
            await assertBalance(this.bac, acc[2], this.bacBal[2] + amountToCashOut);
        });
    });
}

describe("100% inital staking ratio", () => {
    testStakingRatio(100, 100)
});

describe("10% intial staking ratio", () => {
    testStakingRatio(100, 1000)
});

describe("1% initial staking ratio", () => {
    testStakingRatio(50, 5000)
})