// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./TokenBase.sol";

contract Token is TokenBase {
    constructor() TokenBase("ALDEA Test Token", "tALDEA") {}
}
