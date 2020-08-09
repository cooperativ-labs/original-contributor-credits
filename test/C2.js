const C2 = artifacts.require("C2");

contract("C2", async (accounts) => {
    it("shouldn't have any tokens to start", async () => {
        const instance = await C2.deployed();
        const totalSupply = await instance.totalSupply.call();
        assert.equal(
            totalSupply.toNumber(),
            0,
            "tokens were created when none should have been"
        );

    it("should only allow transfers to and from owner"), () => {
        assert.fail()
    }
    });
});