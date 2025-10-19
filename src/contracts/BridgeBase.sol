// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/Itoken.sol";

contract BridgeBase {
    address public admin;
    IToken public token;
    uint public nonce;
    mapping(bytes => bool) public processedNonces;

    enum Step {
        Burn,
        Mint
    }
    event Mint(
        address from,
        address to,
        uint amount,
        uint date,
        bytes nonce,
        Step indexed step
    );

    event Burn(
        address from,
        string to,
        uint amount,
        uint date,
        uint nonce,
        Step indexed step
    );

    constructor(address _token) {
        admin = msg.sender;
        token = IToken(_token);
    }

    function burn(string memory to, uint amount) external {
        token.burn(msg.sender, amount);
        emit Burn(msg.sender, to, amount, block.timestamp, nonce, Step.Burn);
        nonce++;
    }

    function mint(
        address to,
        uint amount,
        bytes memory otherChainNonce
    ) external {
        require(msg.sender == admin, "only admin");
        require(
            processedNonces[otherChainNonce] == false,
            "transfer already processed"
        );
        processedNonces[otherChainNonce] = true;
        token.mint(to, amount);
        emit Mint(
            msg.sender,
            to,
            amount,
            block.timestamp,
            otherChainNonce,
            Step.Mint
        );
    }
}
