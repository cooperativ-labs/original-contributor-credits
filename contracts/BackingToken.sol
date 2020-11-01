// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.6.8;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';

contract BackingToken is ERC20 {
    constructor(address account) ERC20("BackingToken", "BAC") public {
        _mint(account, 100000000000000000000000000);
    }
}
