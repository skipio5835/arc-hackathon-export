import type { BigNumberish } from "@ethersproject/bignumber";
import type { BytesLike } from "@ethersproject/bytes";

// Unchanged interfaces from @ethersproject/abstract-signer 5.8.0 (MIT).
export interface TypedDataDomain {
  name?: string;
  version?: string;
  chainId?: BigNumberish;
  verifyingContract?: string;
  salt?: BytesLike;
}

export interface TypedDataField {
  name: string;
  type: string;
}
