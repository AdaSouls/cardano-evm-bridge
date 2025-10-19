use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use bridge/types.{BridgeDatum, SpendRedeemer}
use cardano/transaction.{OutputReference, Transaction}

validator bridge {
  spend(
    datum: Option<BridgeDatum>,
    redeemer: SpendRedeemer,
    _utxo: OutputReference,
    transaction: Transaction,
  ) {
    expect Some(BridgeDatum { owner }) = datum
    let SpendRedeemer { provided_owner_hash } = redeemer

    // Ensure the transaction is signed by the owner
    let must_be_signed_by_owner = must_be_signed_by(transaction, owner)

    // Ensure the redeemer provides the correct owner hash
    provided_owner_hash == owner && must_be_signed_by_owner
  }

  else(_) {
    fail
  }
}

fn must_be_signed_by(transaction: Transaction, vk: VerificationKeyHash) {
  list.has(transaction.extra_signatories, vk)
}
