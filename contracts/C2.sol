// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import 'openzeppelin-solidity/contracts/access/Ownable.sol';

contract C2 is ERC20, Ownable {

    constructor() ERC20("ContributorCredits", "C^2") public {
    }
    
    function issue(address account, uint256 amount) public onlyOwner {
        _mint(account, amount);
    }

    function burn(uint256 amount) public {
        _burn(_msgSender(), amount);
    }
}
