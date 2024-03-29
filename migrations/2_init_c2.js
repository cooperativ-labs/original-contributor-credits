const C2 = artifacts.require("C2");
const BackingToken = artifacts.require("BackingToken");
const BackingToken21 = artifacts.require("BackingToken21");
const BackingToken15 = artifacts.require("BackingToken15");
const BackingToken6 = artifacts.require("BackingToken6");
const TestDAI = artifacts.require("TestDAI");
const TestUSDC = artifacts.require("TestUSDC");

module.exports = function (deployer, network, accounts) {
  if (network === "live" || network === "live-fork") {
    return deployer.deploy(C2);
  } else if (network === "ropsten") {
    deployer.deploy(BackingToken, accounts[0]);
    deployer.deploy(TestDAI, accounts[0]);
    deployer.deploy(TestUSDC, accounts[0]);
    return deployer.deploy(C2);
  } else {
    deployer.deploy(BackingToken, accounts[0]);
    deployer.deploy(BackingToken21, accounts[0]);
    deployer.deploy(BackingToken15, accounts[0]);
    deployer.deploy(BackingToken6, accounts[0]);
    return deployer.deploy(C2);
  }
};
