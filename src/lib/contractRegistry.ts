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
    address: "0xdc2321323ceff7cb9c9853c463538de0e9450f08",
    type: "fiat",
    decimals: 18,
    abi: ERC20_ABI,
  },
  {
    id: "PUSD",
    label: "PingUSD (PUSD)",
    address: "0xf222f34D8c413B3A0A78290166cC9698634d57A0",
    type: "fiat",
    decimals: 18,
    abi: ERC20_ABI,
  },
  {
    id: "NYUSD",
    label: "New York USD (NYUSD)",
    address: "0x480c6d5e5447613407D510afa42AD5Ba2F9Eb725",
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
    address: "0x1E66c3BB1C7d2050965023eef6fbd5d81A5511Ea",
    type: "asset",
    decimals: 0,
    abi: ERC20_ABI,
  },
  {
    id: "24WILLOW",
    label: "24 Willow Street",
    address: "0x6BDA01CC7CE813940aDEdbB816BF05703c684Bb8",
    type: "asset",
    decimals: 0,
    abi: ERC20_ABI,
  },
  {
    id: "500MAPLE",
    label: "500 Maple Avenue",
    address: "0x0c61795382aa3CAb74C57B41F0Fc3fb1c96ea54F",
    type: "asset",
    decimals: 0,
    abi: ERC20_ABI,
  },
  {
    id: "88HARBOR",
    label: "88 Harbor Plaza",
    address: "0xb7d8F5032e6499CD34E5E6AD6f69Ebe95992B1d0",
    type: "asset",
    decimals: 0,
    abi: ERC20_ABI,
  },
];

// Explorer base URL - swap for different networks
export const EXPLORER_BASE_URL = "https://etherscan.io";
