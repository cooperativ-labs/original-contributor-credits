import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';

contract C2 is ERC20 {
    constructor() ERC20("ContributorCredits", "C^2") public{
    }
}
