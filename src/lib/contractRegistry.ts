export type TrackedContract = {
  id: string;
  label: string;
  address: string;
  type: "asset" | "fiat";
  decimals: number;
  abi: string[];
};

// Base ERC20 ABI (standard functions)
const BASE_ERC20_ABI: string[] = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 value) returns (bool)",
];

// Ownable + Mintable/Burnable extensions
const OWNABLE_ABI: string[] = [
  "function owner() view returns (address)",
  "function transferOwnership(address newOwner)",
  "function renounceOwnership()",
  "function mint(address to, uint256 amount)",
  "function burn(address from, uint256 amount)",
];

// Full ERC20 ABI (base + ownable/mintable/burnable)
export const ERC20_ABI: string[] = [...BASE_ERC20_ABI, ...OWNABLE_ABI];

// Extended ABI for asset tokens with holder tracking
export const ASSET_TOKEN_ABI: string[] = [
  ...ERC20_ABI,
  "function holders() view returns (address[])",
  "function holdersWithBalances() view returns (address[] addresses, uint256[] balances)",
  "function INITIAL_SUPPLY() view returns (uint256)",
  "function MAX_SUPPLY() view returns (uint256)",
];

export const TRACKED_CONTRACTS: TrackedContract[] = [
  {
    id: "1315TH",
    label: "1315th Avenue",
    address: "0x1E66c3BB1C7d2050965023eef6fbd5d81A5511Ea",
    type: "asset",
    decimals: 0,
    abi: ASSET_TOKEN_ABI,
  },
  {
    id: "19ORCHARD",
    label: "19 Orchard Court",
    address: "0x6F45682A8bf304eBB94a384FD07E21f484de40e5",
    type: "asset",
    decimals: 0,
    abi: ASSET_TOKEN_ABI,
  },
  {
    id: "24WILLOW",
    label: "24 Willow Street",
    address: "0x6BDA01CC7CE813940aDEdbB816BF05703c684Bb8",
    type: "asset",
    decimals: 0,
    abi: ASSET_TOKEN_ABI,
  },
  {
    id: "500MAPLE",
    label: "500 Maple Avenue",
    address: "0x0c61795382aa3CAb74C57B41F0Fc3fb1c96ea54F",
    type: "asset",
    decimals: 0,
    abi: ASSET_TOKEN_ABI,
  },
  {
    id: "88HARBOR",
    label: "88 Harbor Plaza",
    address: "0xb7d8F5032e6499CD34E5E6AD6f69Ebe95992B1d0",
    type: "asset",
    decimals: 0,
    abi: ASSET_TOKEN_ABI,
  },
];

// Explorer base URL - swap for different networks
export const EXPLORER_BASE_URL = "https://sepolia.etherscan.io";
