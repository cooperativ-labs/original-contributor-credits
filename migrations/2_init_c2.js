var C2 = artifacts.require("C2");
var BackingToken = artifacts.require("BackingToken");

module.exports = function(deployer, network, accounts) {

    if (network === "live") {
        const daiAddress = "0x6b175474e89094c44da98b954eedeac495271d0f";
        return deployer.deploy(C2, daiAddress);
    } else {
        deployer.deploy(BackingToken, accounts[0], 18).then(() => {
            return deployer.deploy(C2, BackingToken.address);
        });
    }
}
