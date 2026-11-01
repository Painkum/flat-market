export function describeTxError(error: unknown): string {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "Transaction failed.";

  if (/User rejected|user rejected|denied/i.test(message)) {
    return "Wallet rejected the transaction.";
  }
  if (/insufficient funds|exceeds the balance/i.test(message)) {
    return "Insufficient ETH for this purchase and gas.";
  }
  if (/ListingInactive/i.test(message)) {
    return "This listing is no longer active.";
  }
  if (/InsufficientPayment/i.test(message)) {
    return "Payment is below the listing price.";
  }
  if (/NotTokenOwner/i.test(message)) {
    return "The seller no longer holds this collectible.";
  }
  if (/NotApproved/i.test(message)) {
    return "The marketplace is not approved to move this collectible.";
  }
  if (/MaxSupplyExceeded/i.test(message)) {
    return "This edition is fully minted.";
  }
  if (/InsufficientUnredeemed/i.test(message)) {
    return "No unredeemed units remain for this wallet.";
  }
  if (/Expired/i.test(message)) {
    return "This utility has expired.";
  }
  if (/NotRedeemable/i.test(message)) {
    return "This collectible is not a redeemable utility.";
  }
  if (/NotTransferable/i.test(message)) {
    return "This collectible cannot be transferred.";
  }
  if (/network|chain/i.test(message) && /switch|wrong/i.test(message)) {
    return "Connected to the wrong network. Switch to Robinhood Chain testnet.";
  }

  const short = message.split("\n")[0];
  return short.slice(0, 220);
}
