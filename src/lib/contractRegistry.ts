export type TrackedContract = {
  id: string;
  label: string;
  address: string;
  type: "fiat" | "asset";
  decimals: number;
  abi: string[];
};

// Generic ERC20-style ABI; adjust/extend as needed
export const ERC20_ABI: string[] = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

export const TRACKED_CONTRACTS: TrackedContract[] = [
  {
    id: "WYUSD",
    label: "Wyoming USD (WYUSD)",
    address: "0x...WYUSD_ADDRESS_HERE",
    type: "fiat",
    decimals: 18,
    abi: ERC20_ABI,
  },
  {
    id: "PUSD",
    label: "PingUSD (PUSD)",
    address: "0x...PUSD_ADDRESS_HERE",
    type: "fiat",
    decimals: 18,
    abi: ERC20_ABI,
  },
  {
    id: "NYUSD",
    label: "New York USD (NYUSD)",
    address: "0x...NYUSD_ADDRESS_HERE",
    type: "fiat",
    decimals: 18,
    abi: ERC20_ABI,
  },
  {
    id: "1315TH",
    label: "1315th Avenue",
    address: "0x...1315TH_ADDRESS_HERE",
    type: "asset",
    decimals: 0,
    abi: ERC20_ABI,
  },
  {
    id: "19ORCHARD",
    label: "19 Orchard Court",
    address: "0x...19_ORCHARD_ADDRESS_HERE",
    type: "asset",
    decimals: 0,
    abi: ERC20_ABI,
  },
  {
    id: "24WILLOW",
    label: "24 Willow Street",
    address: "0x...24_WILLOW_ADDRESS_HERE",
    type: "asset",
    decimals: 0,
    abi: ERC20_ABI,
  },
  {
    id: "500MAPLE",
    label: "500 Maple Avenue",
    address: "0x...500_MAPLE_ADDRESS_HERE",
    type: "asset",
    decimals: 0,
    abi: ERC20_ABI,
  },
  {
    id: "88HARBOR",
    label: "88 Harbor Plaza",
    address: "0x...88_HARBOR_ADDRESS_HERE",
    type: "asset",
    decimals: 0,
    abi: ERC20_ABI,
  },
];

// Explorer base URL - swap for different networks
export const EXPLORER_BASE_URL = "https://etherscan.io";
