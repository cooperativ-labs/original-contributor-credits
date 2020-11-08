// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.6.8;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract C2 is ERC20, Ownable {
    string public constant version = "cc v0.1.1";

    IERC20 private _backingToken;
    using SafeMath for uint256;

    bool _isLive = false;
    modifier isLive() {
        require(
            _isLive == true,
            "token must be established with a ratio first"
        );
        _;
    }
    modifier isNotLive() {
        require(_isLive == false, "token is already established");
        _;
    }

    constructor(IERC20 backingToken) public ERC20("ContributorCredits", "C^2") {
        _backingToken = backingToken;
    }

    function establish(uint256 initialBac, uint256 initialC2)
        public
        onlyOwner
        isNotLive
    {
        _backingToken.transferFrom(this.owner(), address(this), initialBac);
        _mint(this.owner(), initialC2);
        _isLive = true;
    }

    function backingToken() public view returns (address) {
        return address(_backingToken);
    }

    event Issued(
        address indexed account,
        uint256 c2Issued,
        uint256 backingAmount
    );

    function issue(address account, uint256 amount) public onlyOwner isLive {
        uint256 backingNeeded = _backingNeededFor(amount);
        _mint(account, amount);
        _backingToken.transferFrom(_msgSender(), address(this), backingNeeded);
        emit Issued(account, amount, backingNeeded);
    }

    event Burned(
        address indexed account,
        uint256 c2Burned,
        uint256 backingReturned
    );

    function burn(uint256 amount) public isLive {
        uint256 associatedBacking = _backingNeededFor(amount);
        _burn(_msgSender(), amount);
        _backingToken.transfer(this.owner(), associatedBacking);
        emit Burned(_msgSender(), amount, associatedBacking);
    }

    event CashedOut(
        address indexed account,
        uint256 c2Exchanged,
        uint256 backingReceived
    );

    function cashout(uint256 amount) public isLive {
        uint256 associatedBacking = _backingNeededFor(amount);
        _burn(_msgSender(), amount);
        _backingToken.transfer(_msgSender(), associatedBacking);
        emit CashedOut(_msgSender(), amount, associatedBacking);
    }

    function _bacBalance() internal view returns (uint256) {
        return _backingToken.balanceOf(address(this));
    }

    function _backingNeededFor(uint256 amountC2) public view returns (uint256) {
        // The -1 +1 is to get the ceiling division, rather than the floor so that you always err on the side of having more backing
        if (_bacBalance() == 0) {
            return 0;
        } else {
            return amountC2.mul(_bacBalance()).sub(1).div(totalSupply()).add(1);
        }
    }
}
