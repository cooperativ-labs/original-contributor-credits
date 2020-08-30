const C2 = artifacts.require("C2");
const BackingToken = artifacts.require("BackingToken");
const truffleAssert = require('truffle-assertions');

// Owner - Owner
// Contributor - Con1, Con2, Con3


const getBalance = async (instance, addr) => {
    const bal = await instance.balanceOf.call(addr);
    return bal.toNumber();
}
const assertBalance = async (instance, addr, amount) => {
    const bal = await getBalance(instance, addr);
    assert.equal(bal, amount, `Balance is ${bal}, not ${amount}`);
}


contract("Integration_Test", async (acc) => {
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
  
    it("Owner sets up a token at 1% staking", async () => {
        const establishBac = 1;
        const establishC2 = 100;
        await this.bac.approve(this.c2.address, establishBac);
        await this.c2.approve(this.c2.address, establishBac);
        await this.c2.establish(establishBac, establishC2)
        
        await assertBalance(this.c2, acc[0], establishC2)
    })

    it("Owner pays pays 100 C2 to Con1, Con2 and Con3", async () => {
        issue(acc[1], 100);
        issue(acc[2], 100);
        issue(acc[3], 100);

        await assertBalance(this.bac, acc[0], this.bacBal[0] - 3);
        await assertBalance(this.c2, acc[1], 100);
        await assertBalance(this.c2, acc[2], 100);
        await assertBalance(this.c2, acc[3], 100);
    });

    it("Con2 cashes out", async () => {
        await this.c2.cashout(100, { from: acc[2] });
        await assertBalance(this.c2, acc[2], 0);
        await assertBalance(this.bac, acc[2], this.bacBal[2] + 1);
    })

    it("Con3 burns", async () => {
        await this.c2.burn(100, { from: acc[3] });
        await assertBalance(this.c2, acc[3], 0);
        await assertBalance(this.bac, acc[3], this.bacBal[3]);
    })

    it("Owner increases stake to 2%", async () => {
        await this.bac.transfer(acc[1], 3);
    });

    it("Owner pays pays 100 C2 to Con1, Con2 and Con3", async () => {
        issue(acc[1], 100);
        issue(acc[2], 100);
        issue(acc[3], 100);

        await assertBalance(this.bac, acc[0], this.bacBal[0] - 6);
        await assertBalance(this.c2, acc[1], 200);
        await assertBalance(this.c2, acc[2], 100);
        await assertBalance(this.c2, acc[3], 100);
    });

    it("Con2 cashes out", async () => {
        await this.c2.cashout(100, { from: acc[2] });
        await assertBalance(this.c2, acc[2], 0);
        await assertBalance(this.bc, acc[2], this.bacBal[2] + 2);
    })

    it("Con3 burns", async () => {
        await this.c2.burn(100, { from: acc[3] });
        await assertBalance(this.c2, acc[3], 0);
        await assertBalance(this.bac, acc[3], this.bacBal[3]);
    })

    it("Owner increases stake to 10%", async () => {
        await this.bac.transfer(acc[1], 26);
    });

    it("Owner pays pays 100 C2 to Con1, Con2 and Con3", async () => {
        issue(acc[1], 100);
        issue(acc[2], 100);
        issue(acc[3], 100);

        await assertBalance(this.bac, acc[0], this.bacBal[0] - 30);
        await assertBalance(this.c2, acc[1], 300);
        await assertBalance(this.c2, acc[2], 100);
        await assertBalance(this.c2, acc[3], 100);
    });

    it("Con2 cashes out", async () => {
        await this.c2.cashout(100, { from: acc[2] });
        await assertBalance(this.c2, acc[2], 0);
        await assertBalance(this.bac, acc[2], this.bacBal[2] + 10);
    })

    it("Con3 burns", async () => {
        await this.c2.burn(100, { from: acc[3] });
        await assertBalance(this.c2, acc[3], 0);
        await assertBalance(this.bac, acc[3], this.bacBal[3]);
    })

    it("Owner increases stake to 100%", async () => {
        await this.bac.transfer(acc[1], 370);
    });

    it("Owner pays pays 100 C2 to Con1, Con2 and Con3", async () => {
        issue(acc[1], 100);
        issue(acc[2], 100);
        issue(acc[3], 100);

        await assertBalance(this.bac, acc[0], this.bacBal[0] - 300);
        await assertBalance(this.c2, acc[1], 200);
        await assertBalance(this.c2, acc[2], 100);
        await assertBalance(this.c2, acc[3], 100);
    });

    it("Con2 cashes out", async () => {
        await this.c2.cashout(100, { from: acc[2] });
        await assertBalance(this.c2, acc[2], 0);
        await assertBalance(this.bac, acc[2], this.bacBal[2] + 100);
    })

    it("Con3 burns", async () => {
        await this.c2.burn(amountToRelinquish, { from: acc[1] });
        await assertBalance(this.c2, acc[3], 0);
        await assertBalance(this.bac, acc[3], this.bacBal[3]);
    })

    it("Con3 cashes out", async () => {
        await this.c2.cashout(100, { from: acc[2] });
        await assertBalance(this.c2, acc[2], 0);
        await assertBalance(this.bac, acc[2], this.bacBal[2] + 113);
    })
});
