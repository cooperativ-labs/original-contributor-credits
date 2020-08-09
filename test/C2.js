
const C2 = artifacts.require("C2");
const truffleAssert = require('truffle-assertions');

contract("C2", async (accounts) => {
    it("shouldn't have any tokens to start", async () => {
        const instance = await C2.deployed();
        const totalSupply = await instance.totalSupply.call();
        assert.equal(
            totalSupply.toNumber(),
            0,
            "tokens were created when none should have been"
        );
        });
    it("can issue tokens", async () => {
        const instance = await C2.deployed();
        await instance.issue(accounts[1], 1);
        
        const account1Bal = await instance.balanceOf.call(accounts[1]);
        assert.equal(account1Bal.toNumber(), 1, "1 token was not issued");

    });
    it("should only allow the owner to issue tokens", async() => {
        const instance = await C2.deployed({ from: accounts[0] });
        truffleAssert.reverts(instance.issue(accounts[1], 1, { from: accounts[1] }))
    })
    // it("should only allow transfers to and from owner", () => {
    //     assert.fail();
    // });
});