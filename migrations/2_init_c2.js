var C2 = artifacts.require("C2");
var BackingToken = artifacts.require("BackingToken");

module.exports = function(deployer, network, accounts) {

    if (network === "live") {
        /* TODO */
    } else {
        deployer.deploy(BackingToken, accounts[0]).then(function() {
            return deployer.deploy(C2, BackingToken.address);
        });
    }
}
