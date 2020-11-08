// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.6.8;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract C2 is ERC20, Ownable {
    string public constant version = "cc v0.1.2";

    ERC20 public backingToken;
    using SafeMath for uint256;

    bool public isEstablished = false;
    modifier isLive() {
        require(
            isEstablished == true,
            "token must be established with a ratio first"
        );
        _;
    }
    modifier isNotLive() {
        require(isEstablished == false, "token is already established");
        _;
    }

    constructor() public ERC20("ContributorCredits", "C^2") {
    }

    function establish(ERC20 backingTokenAddress, uint256 initialBac, uint256 initialC2)
        public
        onlyOwner
        isNotLive
    {
        backingToken = backingTokenAddress;
        backingToken.transferFrom(this.owner(), address(this), initialBac);
        _mint(this.owner(), initialC2);
        isEstablished = true;
    }

    event Issued(
        address indexed account,
        uint256 c2Issued,
        uint256 backingAmount
    );

    function issue(address account, uint256 amount) public onlyOwner isLive {
        uint256 backingNeeded = backingNeededFor(amount);
        _mint(account, amount);
        backingToken.transferFrom(_msgSender(), address(this), backingNeeded);
        emit Issued(account, amount, backingNeeded);
    }

    event Burned(
        address indexed account,
        uint256 c2Burned,
        uint256 backingReturned
    );

    function burn(uint256 amount) public isLive {
        uint256 associatedBacking = backingNeededFor(amount);
        _burn(_msgSender(), amount);
        backingToken.transfer(this.owner(), associatedBacking);
        emit Burned(_msgSender(), amount, associatedBacking);
    }

    event CashedOut(
        address indexed account,
        uint256 c2Exchanged,
        uint256 backingReceived
    );

    function cashout(uint256 amount) public isLive {
        uint256 associatedBacking = backingNeededFor(amount);
        _burn(_msgSender(), amount);
        backingToken.transfer(_msgSender(), associatedBacking);
        emit CashedOut(_msgSender(), amount, associatedBacking);
    }

    function bacBalance() public view returns (uint256) {
        return backingToken.balanceOf(address(this));
    }

    function backingNeededFor(uint256 amountC2) public view returns (uint256) {
        // The -1 +1 is to get the ceiling division, rather than the floor so that you always err on the side of having more backing
        if (bacBalance() == 0) {
            return 0;
        } else {
            return amountC2.mul(bacBalance()).sub(1).div(totalSupply()).add(1);
        }
    }

    function totalBackingNeededToFund() public view returns (uint256) {
        // decimals normalization
        if (decimals() > backingToken.decimals()) {
            // ceiling division
            return (totalSupply().sub(1)).div(uint256(10) ** (decimals() - backingToken.decimals())).add(1);
        } else {
            return totalSupply().mul(uint256(10) ** (backingToken.decimals() - decimals()));
        }
    }

    function isFunded() public view returns (bool) {
        return bacBalance() >= totalBackingNeededToFund();
    }
}
