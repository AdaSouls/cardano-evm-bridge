// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/// @title WorldBridgeMinter
/// @notice Mints a world's token on an EVM chain when a threshold of
///         attesters confirm that the same amount was burned on Cardano.
///         One way: there is no path back to Cardano (docs/decisions.md, D6).
///
///         Nothing here trusts a single key:
///         - minting needs `threshold` attester signatures over one attestation (D5);
///         - caps per attestation, per 24 hours and in total live in the contract (D3);
///         - the admin role (a Safe) can pause, change caps and rotate attesters,
///           and cannot mint.
///
///         The AdaSouls attester agent is at most one attester of N (D4).
contract WorldBridgeMinter is ERC20, AccessControl, Pausable, EIP712 {
    using ECDSA for bytes32;

    bytes32 public constant ATTESTER_ROLE = keccak256("ATTESTER_ROLE");

    /// @dev EIP-712 type of what attesters sign. `worldId` and the chain id
    ///      (inside the domain) stop an attestation for one world or chain
    ///      being replayed on another.
    bytes32 public constant ATTESTATION_TYPEHASH = keccak256(
        "Attestation(bytes32 worldId,bytes32 cardanoTxHash,uint32 outputIndex,address recipient,uint256 amount)"
    );

    struct Attestation {
        bytes32 worldId;
        bytes32 cardanoTxHash; // the Cardano burn transaction
        uint32 outputIndex;    // which output of that tx (one burn tx may carry several)
        address recipient;     // from the burn tx metadata
        uint256 amount;        // in this token's decimals; the attester scales from Cardano's
    }

    bytes32 public immutable worldId;
    uint8 private immutable _decimals;

    uint256 public threshold;
    uint256 public capPerAttestation;
    uint256 public capPer24h;
    uint256 public capTotal;

    uint256 public mintedTotal;
    uint256 public mintedInWindow;
    uint256 public windowStart;

    /// @dev burn tx hash + output index -> already minted. The same Cardano burn can never mint twice.
    mapping(bytes32 => bool) public processed;

    event Minted(bytes32 indexed cardanoTxHash, uint32 outputIndex, address indexed recipient, uint256 amount);
    event CapsChanged(uint256 perAttestation, uint256 per24h, uint256 total);
    event ThresholdChanged(uint256 threshold);

    error AlreadyProcessed(bytes32 key);
    error WrongWorld(bytes32 got, bytes32 want);
    error NotEnoughSignatures(uint256 got, uint256 need);
    error SignerNotAttester(address signer);
    error SignersNotSorted();
    error CapPerAttestation(uint256 amount, uint256 cap);
    error CapPer24h(uint256 wouldBe, uint256 cap);
    error CapTotal(uint256 wouldBe, uint256 cap);
    error ZeroAmount();
    error ZeroRecipient();

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        bytes32 worldId_,
        address admin,          // a Safe. Can pause, set caps, rotate attesters. Cannot mint.
        address[] memory attesters,
        uint256 threshold_,
        uint256 capPerAttestation_,
        uint256 capPer24h_,
        uint256 capTotal_
    ) ERC20(name_, symbol_) EIP712("WorldBridgeMinter", "1") {
        require(admin != address(0), "admin");
        require(threshold_ > 0 && threshold_ <= attesters.length, "threshold");

        worldId = worldId_;
        _decimals = decimals_;
        threshold = threshold_;
        capPerAttestation = capPerAttestation_;
        capPer24h = capPer24h_;
        capTotal = capTotal_;
        windowStart = block.timestamp;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        for (uint256 i = 0; i < attesters.length; i++) {
            require(attesters[i] != address(0), "attester");
            _grantRole(ATTESTER_ROLE, attesters[i]);
        }
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    // ------------------------------------------------------------------ minting

    /// @notice Mint `a.amount` to `a.recipient` once `threshold` attesters have signed `a`.
    /// @param a           the attestation
    /// @param signatures  EIP-712 signatures by attesters, ordered by ascending signer address
    ///                    (so duplicates are impossible to sneak in).
    /// @dev Anyone may submit: the signatures carry the authority, not the caller.
    function mintWithAttestations(Attestation calldata a, bytes[] calldata signatures)
        external
        whenNotPaused
    {
        if (a.worldId != worldId) revert WrongWorld(a.worldId, worldId);
        if (a.amount == 0) revert ZeroAmount();
        if (a.recipient == address(0)) revert ZeroRecipient();
        if (signatures.length < threshold) revert NotEnoughSignatures(signatures.length, threshold);

        bytes32 key = keccak256(abi.encodePacked(a.cardanoTxHash, a.outputIndex));
        if (processed[key]) revert AlreadyProcessed(key);

        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(ATTESTATION_TYPEHASH, a.worldId, a.cardanoTxHash, a.outputIndex, a.recipient, a.amount))
        );

        address last = address(0);
        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = digest.recover(signatures[i]);
            if (signer <= last) revert SignersNotSorted();
            if (!hasRole(ATTESTER_ROLE, signer)) revert SignerNotAttester(signer);
            last = signer;
        }

        _enforceCaps(a.amount);

        processed[key] = true;
        _mint(a.recipient, a.amount);
        emit Minted(a.cardanoTxHash, a.outputIndex, a.recipient, a.amount);
    }

    function _enforceCaps(uint256 amount) internal {
        if (amount > capPerAttestation) revert CapPerAttestation(amount, capPerAttestation);

        if (block.timestamp >= windowStart + 24 hours) {
            windowStart = block.timestamp;
            mintedInWindow = 0;
        }
        uint256 inWindow = mintedInWindow + amount;
        if (inWindow > capPer24h) revert CapPer24h(inWindow, capPer24h);

        uint256 total = mintedTotal + amount;
        if (total > capTotal) revert CapTotal(total, capTotal);

        mintedInWindow = inWindow;
        mintedTotal = total;
    }

    // ------------------------------------------------------------------ world sinks

    /// @notice Holders burn their own tokens. The world's systems (seasons, upgrades, pacts)
    ///         call this on the player's behalf through an approved allowance.
    ///         There is no corresponding unlock on Cardano: this is the sink.
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function burnFrom(address from, uint256 amount) external {
        _spendAllowance(from, msg.sender, amount);
        _burn(from, amount);
    }

    // ------------------------------------------------------------------ admin (a Safe)

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function setCaps(uint256 perAttestation, uint256 per24h, uint256 total)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        capPerAttestation = perAttestation;
        capPer24h = per24h;
        capTotal = total;
        emit CapsChanged(perAttestation, per24h, total);
    }

    function setThreshold(uint256 newThreshold) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newThreshold > 0, "threshold");
        threshold = newThreshold;
        emit ThresholdChanged(newThreshold);
    }

    // Attesters are added and removed with grantRole / revokeRole(ATTESTER_ROLE, ...) by the admin.

    /// @dev Hash the admin would check against an attester's signature off-chain.
    function attestationDigest(Attestation calldata a) external view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(abi.encode(ATTESTATION_TYPEHASH, a.worldId, a.cardanoTxHash, a.outputIndex, a.recipient, a.amount))
        );
    }
}
