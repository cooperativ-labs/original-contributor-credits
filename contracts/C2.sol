// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';
import 'openzeppelin-solidity/contracts/access/Ownable.sol';

contract C2 is ERC20, Ownable {

    IERC20 private _backingToken;

    constructor(IERC20 backingToken) ERC20("ContributorCredits", "C^2") public {
        _backingToken = backingToken;
    }
    
    function issue(address account, uint256 amount) public onlyOwner {
        _mint(account, amount);
        _backingToken.transferFrom(_msgSender(), address(this), amount);
    }

    function burn(uint256 amount) public {
        _burn(_msgSender(), amount);
        _backingToken.transfer(this.owner(), amount);
    }

    function cashout(uint256 amount) public {
        _burn(_msgSender(), amount);
        _backingToken.transfer(_msgSender(), amount);
    }
}
