use aiken/crypto.{VerificationKeyHash}

pub type BridgeDatum {
  owner: VerificationKeyHash,
}

// Define the structure of the Redeemer
pub type SpendRedeemer {
  provided_owner_hash: VerificationKeyHash,
}
