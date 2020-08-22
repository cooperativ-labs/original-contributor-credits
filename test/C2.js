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

const issue = async (addr, amount) => {
    await this.bac.approve(this.c2.address, amount);
    await this.c2.issue(addr, amount);
}

contract("C2", async (acc) => {
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
    it("shouldn't have any tokens to start", async () => {
        const totalSupply = await this.c2.totalSupply.call();
        assert.equal(
            totalSupply.toNumber(),
            0,
            "tokens were created when none should have been"
        );
    });
    it("can issue tokens", async () => {
        const amountToIssue = 1;
        await issue(acc[1], amountToIssue);

        await assertBalance(this.c2, acc[1], amountToIssue);
        await assertBalance(this.bac, acc[0], this.bacBal[0] - amountToIssue);
    });
    it("must stake backing tokens to issue c2", async() => {
        truffleAssert.reverts(this.c2.issue(acc[1], this.bacBal[0] + 1));
    })
    it("should only allow the owner to issue tokens", async() => {
        const amountToIssue = 1;
        await this.bac.transfer(acc[1], amountToIssue);
        await this.bac.approve(this.c2.address, amountToIssue, { from: acc[1] });
        truffleAssert.reverts(this.c2.issue(acc[1], 1, { from: acc[1] }))
    })
    it("can relinquish tokens", async() => {
        const amountToRelinquish = 5;
        await issue(acc[1], amountToRelinquish);

        await assertBalance(this.c2, acc[1], this.c2Bal[1] + amountToRelinquish);
        await assertBalance(this.bac, acc[0], this.bacBal[0] - amountToRelinquish);
        
        await this.c2.burn(amountToRelinquish, { from: acc[1] });

        await assertBalance(this.c2, acc[1], this.c2Bal[1]);
        await assertBalance(this.bac, acc[0], this.bacBal[0]);
    });
    // it("should only allow transfers to and from owner", () => {
    //     assert.fail();
    // });
});
