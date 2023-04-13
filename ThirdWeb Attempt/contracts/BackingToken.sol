// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "@thirdweb-dev/contracts/base/ERC20Base.sol";

contract BackingToken is ERC20Base {
    constructor(address account) ERC20Base("BackingToken", "BAC") public {
        _mint(account, 1000000000000000);
    }

    function mint(uint256 amount) public {
        _mint(_msgSender(), amount);
    }

}

contract BackingToken21 is ERC20Base {
    constructor(address account) ERC20Base("BackingToken", "BAC21") public {
        _mint(account, 1000000000000000 * (10 ** decimals()));
    }    
    
    function decimals() public view override returns (uint8) {
        return 21;
    }
}

contract BackingToken15 is ERC20Base {
    constructor(address account) ERC20Base("BackingToken", "BAC15") public {
        _mint(account, 1000000000000000 * (10 ** decimals()));
    }    
    
    function decimals() public view override returns (uint8) {
        return 15;
    }
}

contract BackingToken6 is ERC20Base {
    constructor(address account) ERC20Base("BackingToken", "BAC6") public {
        _mint(account, 1000000000000000 * (10 ** decimals()));
    }    
    
    function decimals() public view override returns (uint8) {
        return 6;
    }
}

