const C2 = artifacts.require("C2");
const BackingToken = artifacts.require("BackingToken");
const truffleAssert = require("truffle-assertions");

// Owner - Owner
// Contributor - Con1, Con2, Con3

const getBalance = async (instance, addr) => {
  const bal = await instance.balanceOf.call(addr);
  return bal.toNumber();
};
const assertBalance = async (instance, addr, amount) => {
  const bal = await getBalance(instance, addr);
  assert.equal(bal, amount, `Balance is ${bal}, not ${amount}`);
};

contract("Integration_Test", async (acc) => {
  const issueAmount = async (addr, amount) => {
    const backingNeeded = await this.c2.backingNeededFor.call(amount);
    await this.bac.approve(this.c2.address, backingNeeded);
    await this.c2.issue(addr, amount);
  };

  before(async () => {
    this.c2 = await C2.deployed();
    this.bac = await BackingToken.deployed();
  });

  beforeEach(async () => {
    this.c2Bal = await Promise.all(
      [...Array(10).keys()].map((x) => getBalance(this.c2, acc[x]))
    );

    this.bacBal = await Promise.all(
      [...Array(10).keys()].map((x) => getBalance(this.bac, acc[x]))
    );
  });

  it("Owner sets up a token at 1% staking", async () => {
    const establishBac = 1;
    const establishC2 = 100;
    await this.bac.approve(this.c2.address, establishBac);
    await this.c2.establish(this.bac.address, establishBac, establishC2);

    await assertBalance(this.c2, acc[0], establishC2);
  });

  it("Owner pays pays 100 C2 to Con1, Con2 and Con3", async () => {
    await issueAmount(acc[1], 100);
    await issueAmount(acc[2], 100);
    await issueAmount(acc[3], 100);

    await assertBalance(this.bac, acc[0], this.bacBal[0] - 3);
    await assertBalance(this.c2, acc[1], 100);
    await assertBalance(this.c2, acc[2], 100);
    await assertBalance(this.c2, acc[3], 100);
  });

  it("Con2 cashes out", async () => {
    await this.c2.cashout(100, { from: acc[2] });
    await assertBalance(this.c2, acc[2], 0);
    await assertBalance(this.bac, acc[2], this.bacBal[2] + 1);
  });

  it("Con3 burns", async () => {
    await this.c2.burn(100, { from: acc[3] });
    await assertBalance(this.c2, acc[3], 0);
    await assertBalance(this.bac, acc[3], this.bacBal[3]);
  });

  it("Owner increases stake to 2%", async () => {
    await this.bac.transfer(this.c2.address, 2);

    const c2 = await this.c2.totalSupply.call();
    await assertBalance(this.bac, this.c2.address, 4);
    const ratio = await this.c2.backingNeededFor.call(100);

    assert.equal(c2, 200);
    assert.equal(ratio, 2);
  });

  it("Owner pays pays 100 C2 to Con1, Con2 and Con3", async () => {
    await issueAmount(acc[1], 100);
    await issueAmount(acc[2], 100);
    await issueAmount(acc[3], 100);

    await assertBalance(this.bac, acc[0], this.bacBal[0] - 6);
    await assertBalance(this.c2, acc[1], 200);
    await assertBalance(this.c2, acc[2], 100);
    await assertBalance(this.c2, acc[3], 100);
  });

  it("Con2 cashes out", async () => {
    await this.c2.cashout(100, { from: acc[2] });
    await assertBalance(this.c2, acc[2], 0);
    await assertBalance(this.bac, acc[2], this.bacBal[2] + 2);
  });

  it("Con3 burns", async () => {
    await this.c2.burn(100, { from: acc[3] });
    await assertBalance(this.c2, acc[3], 0);
    await assertBalance(this.bac, acc[3], this.bacBal[3]);
  });

  it("Owner increases stake to 10%", async () => {
    await this.bac.transfer(this.c2.address, 24);

    const c2 = await this.c2.totalSupply.call();
    await assertBalance(this.bac, this.c2.address, 30);
    const ratio = await this.c2.backingNeededFor.call(100);

    assert.equal(c2, 300);
    assert.equal(ratio, 10);
  });

  it("Owner pays pays 100 C2 to Con1, Con2 and Con3", async () => {
    await issueAmount(acc[1], 100);
    await issueAmount(acc[2], 100);
    await issueAmount(acc[3], 100);

    await assertBalance(this.bac, acc[0], this.bacBal[0] - 30);
    await assertBalance(this.c2, acc[1], 300);
    await assertBalance(this.c2, acc[2], 100);
    await assertBalance(this.c2, acc[3], 100);
  });

  it("Con2 cashes out", async () => {
    await this.c2.cashout(100, { from: acc[2] });
    await assertBalance(this.c2, acc[2], 0);
    await assertBalance(this.bac, acc[2], this.bacBal[2] + 10);
  });

  it("Con3 burns", async () => {
    await this.c2.burn(100, { from: acc[3] });
    await assertBalance(this.c2, acc[3], 0);
    await assertBalance(this.bac, acc[3], this.bacBal[3]);
  });

  it("Owner increases stake to 100%", async () => {
    await this.bac.transfer(this.c2.address, 360);

    const c2 = await this.c2.totalSupply.call();
    await assertBalance(this.bac, this.c2.address, 400);
    const ratio = await this.c2.backingNeededFor.call(100);

    assert.equal(c2, 400);
    assert.equal(ratio, 100);
  });

  it("Owner pays pays 100 C2 to Con1, Con2 and Con3", async () => {
    await issueAmount(acc[1], 100);
    await issueAmount(acc[2], 100);
    await issueAmount(acc[3], 100);

    await assertBalance(this.bac, acc[0], this.bacBal[0] - 300);
    await assertBalance(this.c2, acc[1], 400);
    await assertBalance(this.c2, acc[2], 100);
    await assertBalance(this.c2, acc[3], 100);
  });

  it("Con2 cashes out", async () => {
    await this.c2.cashout(100, { from: acc[2] });
    await assertBalance(this.c2, acc[2], 0);
    await assertBalance(this.bac, acc[2], this.bacBal[2] + 100);
  });

  it("Con3 burns", async () => {
    await this.c2.burn(100, { from: acc[3] });
    await assertBalance(this.c2, acc[3], 0);
    await assertBalance(this.bac, acc[3], this.bacBal[3]);
  });

  it("Con1 cashes out", async () => {
    await this.c2.cashout(400, { from: acc[1] });
    await assertBalance(this.c2, acc[1], 0);
    await assertBalance(this.bac, acc[1], this.bacBal[1] + 400);
  });
});
