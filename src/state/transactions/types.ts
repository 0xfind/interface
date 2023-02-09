export interface SerializableTransactionReceipt {
  to: string
  from: string
  contractAddress: string
  transactionIndex: number
  blockHash: string
  transactionHash: string
  blockNumber: number
  status?: number
}

export enum TransactionType {
  APPROVAL = 0,
  CREATE_OSP,
  CLAIM_ONFT,
  COLLECT_FEES,
  MORTGAGE,
  REDEEM,
  CASH,
  MULTIPLY,
}

export interface BaseTransactionInfo {
  type: TransactionType
}

export interface CreateOspTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.CREATE_OSP
  name: string
  symbol: string
  multiply: string
}

export interface ClaimOnftTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.CLAIM_ONFT
  spender: string
  claimId: string
}

export interface CollectFeesTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.COLLECT_FEES
}

export interface ApproveTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.APPROVAL
  tokenAddress: string
  spender: string
}

export interface MortgageTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.MORTGAGE
  
}

export interface RedeemTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.REDEEM
}

export interface CashTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.CASH
}

export interface MultiplyTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.MULTIPLY
}

export type TransactionInfo =
  | ApproveTransactionInfo
  | CreateOspTransactionInfo
  | ClaimOnftTransactionInfo
  | MortgageTransactionInfo
  | RedeemTransactionInfo
  | CashTransactionInfo
  | MultiplyTransactionInfo
  | CollectFeesTransactionInfo

export interface TransactionDetails {
  hash: string
  receipt?: SerializableTransactionReceipt
  lastCheckedBlockNumber?: number
  addedTime: number
  confirmedTime?: number
  from: string
  info: TransactionInfo
}
