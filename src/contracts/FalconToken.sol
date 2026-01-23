// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FalconToken is ERC20 {
    address public admin;

    constructor() ERC20("Wrapped FALCON", "wFALCON") {
        admin = msg.sender;
    }

    // Override decimals to 0 (matching Cardano FALCON token)
    function decimals() public pure override returns (uint8) {
        return 0;
    }

    function updateAdmin(address newAdmin) external {
        require(msg.sender == admin, "only admin");
        admin = newAdmin;
    }

    function mint(address to, uint amount) external {
        require(msg.sender == admin, "only admin");
        _mint(to, amount);
    }

    function burn(address owner, uint amount) external {
        require(msg.sender == admin, "only admin");
        _burn(owner, amount);
    }
}
