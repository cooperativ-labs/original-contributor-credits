var C2 = artifacts.require("C2");
var BackingToken = artifacts.require("BackingToken");
var BackingToken21 = artifacts.require("BackingToken21");
var BackingToken15 = artifacts.require("BackingToken15");
var BackingToken6 = artifacts.require("BackingToken6");

module.exports = function(deployer, network, accounts) {

    if (network === "live") {
        return deployer.deploy(C2);
    } else {
        deployer.deploy(BackingToken, accounts[0])
        deployer.deploy(BackingToken21, accounts[0])
        deployer.deploy(BackingToken15, accounts[0])
        deployer.deploy(BackingToken6, accounts[0])
        return deployer.deploy(C2);
    }
}
