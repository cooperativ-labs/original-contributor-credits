// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "@thirdweb-dev/contracts/base/ERC20Base.sol";

contract BackingToken200 is ERC20Base {
    constructor(address account) ERC20Base("Dai Stablecoin Test", "DAI*") public {
        _mint(account, 1000000000000000 * (10 ** decimals()));
    }    
    
    function decimals() public view override returns (uint8) {
        return 18;
    }

    function mint(uint256 amount) public {
        _mint(_msgSender(), amount);
    }
}


