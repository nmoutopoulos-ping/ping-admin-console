export type RequestStatus = "pending" | "approved" | "rejected" | "executed";

export interface InboundRequest {
  id: string;
  createdAt: string;
  tokenId: string;
  tokenLabel: string;
  tokenSymbol: string;
  fromAddress: string;
  fromLabel?: string;
  toAddress: string;
  toLabel?: string;
  amount: string;
  status: RequestStatus;
  notes?: string;
  rawPayload: object;
}

// Mock data for development
export const mockRequests: InboundRequest[] = [
  {
    id: "REQ-001",
    createdAt: "2024-01-15T10:30:00Z",
    tokenId: "1315th",
    tokenLabel: "131 5th Avenue",
    tokenSymbol: "1315TH",
    fromAddress: "0x1234567890abcdef1234567890abcdef12345678",
    fromLabel: "LP Alpha Fund",
    toAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    toLabel: "Ping Treasury",
    amount: "50000.00",
    status: "pending",
    notes: "Q1 capital contribution from Alpha Fund",
    rawPayload: {
      requestType: "mint",
      source: "bank_wire",
      bankRef: "WIRE-2024-0115-001",
      verified: true,
    },
  },
  {
    id: "REQ-002",
    createdAt: "2024-01-14T14:22:00Z",
    tokenId: "car",
    tokenLabel: "CAR Token",
    tokenSymbol: "CAR",
    fromAddress: "0x9876543210fedcba9876543210fedcba98765432",
    fromLabel: "GP Beta Holdings",
    toAddress: "0xfedcba9876543210fedcba9876543210fedcba98",
    amount: "1000.00",
    status: "pending",
    rawPayload: {
      requestType: "transfer",
      assetType: "vehicle",
      assetId: "VIN-123456",
    },
  },
  {
    id: "REQ-003",
    createdAt: "2024-01-13T09:15:00Z",
    tokenId: "19orchard",
    tokenLabel: "19 Orchard Court",
    tokenSymbol: "19ORCHARD",
    fromAddress: "0xaaaa111122223333444455556666777788889999",
    toAddress: "0xbbbb111122223333444455556666777788889999",
    toLabel: "Settlement Account",
    amount: "25000.00",
    status: "approved",
    notes: "Approved by compliance on 2024-01-13",
    rawPayload: {
      requestType: "mint",
      source: "ach_transfer",
      achRef: "ACH-2024-0113-042",
    },
  },
  {
    id: "REQ-004",
    createdAt: "2024-01-12T16:45:00Z",
    tokenId: "tungsten",
    tokenLabel: "Tungsten",
    tokenSymbol: "TNG",
    fromAddress: "0xcccc111122223333444455556666777788889999",
    fromLabel: "Metals Depot",
    toAddress: "0xdddd111122223333444455556666777788889999",
    toLabel: "Investor Wallet",
    amount: "500.00",
    status: "executed",
    rawPayload: {
      requestType: "transfer",
      assetType: "commodity",
      txHash: "0xabcd1234...",
    },
  },
  {
    id: "REQ-005",
    createdAt: "2024-01-11T11:00:00Z",
    tokenId: "24willow",
    tokenLabel: "24 Willow Street",
    tokenSymbol: "24WILLOW",
    fromAddress: "0xeeee111122223333444455556666777788889999",
    toAddress: "0xffff111122223333444455556666777788889999",
    amount: "10000.00",
    status: "rejected",
    notes: "Rejected: Source of funds not verified",
    rawPayload: {
      requestType: "mint",
      source: "wire",
      rejected_reason: "kyc_incomplete",
    },
  },
];

// Stub function for future on-chain execution
export async function executeInboundRequest(requestId: string): Promise<{ success: boolean; txHash?: string }> {
  // This will be connected to actual on-chain logic later
  console.log(`Executing request ${requestId}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, txHash: "0x" + Math.random().toString(16).slice(2, 66) });
    }, 1000);
  });
}
