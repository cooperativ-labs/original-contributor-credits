// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.6.8;


import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';
import 'openzeppelin-solidity/contracts/access/Ownable.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';

contract C2 is ERC20, Ownable {

    string constant public version = "cc v0.1.0";

    IERC20 private _backingToken;
    using SafeMath for uint256;

    bool _isLive = false;
    modifier isLive() {
        require(_isLive == true, "token must be established with a ratio first");
        _;
    }
    modifier isNotLive() {
        require(_isLive == false, "token is already established");
        _;
    }

    constructor(IERC20 backingToken) ERC20("ContributorCredits", "C^2") public {
        _backingToken = backingToken;
    }

    function establish(uint256 initialBac, uint256 initialC2) public onlyOwner isNotLive {
        _backingToken.transferFrom(this.owner(), address(this), initialBac);
        _mint(this.owner(), initialC2);
        _isLive = true;
    }

    function issue(address account, uint256 amount) public onlyOwner isLive {
        uint256 backingNeeded = _backingNeededFor(amount);
        _backingToken.transferFrom(_msgSender(), address(this), backingNeeded);
        _mint(account, amount);
    }

    function burn(uint256 amount) public isLive {
        uint256 associatedBacking = _backingNeededFor(amount);
        _backingToken.transfer(this.owner(), associatedBacking);
        _burn(_msgSender(), amount);
    }

    function cashout(uint256 amount) public isLive {
        uint256 associatedBacking = _backingNeededFor(amount);
        _backingToken.transfer(_msgSender(), associatedBacking);
        _burn(_msgSender(), amount);
    }

    function _bacBalance() internal view returns (uint256) {
        return _backingToken.balanceOf(address(this));
    }

    function _backingNeededFor(uint256 amountC2) public view returns (uint256) {
        // The -1 +1 is to get the ceiling division, rather than the floor so that you always err on the side of having more backing
        return amountC2.mul(_bacBalance()).sub(1).div(totalSupply()).add(1); 
    }

}
