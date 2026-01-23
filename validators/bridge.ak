use aiken/collection/list
use bridge/types.{BridgeDatum}
use cardano/transaction.{OutputReference, Transaction}

validator bridge {
  spend(
    datum: Option<BridgeDatum>,
    _redeemer: Data,
    _utxo: OutputReference,
    transaction: Transaction,
  ) {
    expect Some(BridgeDatum { owner }) = datum

    // Ensure the transaction is signed by the owner
    list.has(transaction.extra_signatories, owner)
  }

  else(_) {
    fail
  }
}
