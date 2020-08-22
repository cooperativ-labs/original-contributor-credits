// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';

contract BackingToken is ERC20 {
    constructor(address account) ERC20("BackingToken", "BAC") public {
        _mint(account, 1000000);
    }
}
