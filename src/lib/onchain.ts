import { ethers } from "ethers";
import { TRACKED_CONTRACTS, TrackedContract } from "./contractRegistry";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export type WalletInfo = {
  address: string;
  chainId: number;
};

// Alchemy RPC helper for read-only operations
async function alchemyCall(method: string, contractAddress: string, params: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('alchemy-rpc', {
    body: { method, contractAddress, params },
  });

  if (error) throw new Error(error.message || 'Alchemy RPC call failed');
  if (data?.error) throw new Error(data.error);
  return data;
}

// Encode function call data
function encodeFunctionCall(functionSig: string, params: unknown[] = []): string {
  const iface = new ethers.Interface([functionSig]);
  const functionName = functionSig.match(/function (\w+)/)?.[1];
  if (!functionName) throw new Error('Invalid function signature');
  return iface.encodeFunctionData(functionName, params);
}

// Decode function result
function decodeFunctionResult(functionSig: string, data: string): unknown {
  const iface = new ethers.Interface([functionSig]);
  const functionName = functionSig.match(/function (\w+)/)?.[1];
  if (!functionName) throw new Error('Invalid function signature');
  return iface.decodeFunctionResult(functionName, data);
}

export async function connectWallet(): Promise<WalletInfo> {
  if (!window.ethereum) {
    throw new Error("No wallet provider found. Please install MetaMask.");
  }
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const network = await provider.getNetwork();
  
  return {
    address,
    chainId: Number(network.chainId),
  };
}

export async function getSigner() {
  if (!window.ethereum) {
    throw new Error("No wallet provider found. Please install MetaMask.");
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
}

export function getTrackedContract(id: string): TrackedContract {
  const c = TRACKED_CONTRACTS.find((c) => c.id === id);
  if (!c) throw new Error(`Unknown contract id: ${id}`);
  return c;
}

export type TokenInfo = {
  name: string;
  symbol: string;
  decimals: number;
  totalSupplyRaw: string;
  totalSupplyFormatted: string;
};

// Read-only version using Alchemy (no wallet required)
export async function readTokenInfo(contractId: string): Promise<TokenInfo> {
  const meta = getTrackedContract(contractId);

  const nameSig = "function name() view returns (string)";
  const symbolSig = "function symbol() view returns (string)";
  const decimalsSig = "function decimals() view returns (uint8)";
  const totalSupplySig = "function totalSupply() view returns (uint256)";

  const [nameRes, symbolRes, decimalsRes, supplyRes] = await Promise.all([
    alchemyCall('eth_call', meta.address, { data: encodeFunctionCall(nameSig) }),
    alchemyCall('eth_call', meta.address, { data: encodeFunctionCall(symbolSig) }),
    alchemyCall('eth_call', meta.address, { data: encodeFunctionCall(decimalsSig) }),
    alchemyCall('eth_call', meta.address, { data: encodeFunctionCall(totalSupplySig) }),
  ]);

  const name = decodeFunctionResult(nameSig, nameRes.result)[0] as string;
  const symbol = decodeFunctionResult(symbolSig, symbolRes.result)[0] as string;
  const decimals = Number(decodeFunctionResult(decimalsSig, decimalsRes.result)[0]);
  const totalSupply = decodeFunctionResult(totalSupplySig, supplyRes.result)[0] as bigint;

  const formattedSupply = ethers.formatUnits(totalSupply, decimals);

  return {
    name,
    symbol,
    decimals,
    totalSupplyRaw: totalSupply.toString(),
    totalSupplyFormatted: formattedSupply,
  };
}

export type BalanceResult = {
  raw: string;
  formatted: string;
};

// Read-only version using Alchemy (no wallet required)
export async function getTokenBalance(
  contractId: string,
  wallet: string
): Promise<BalanceResult> {
  const meta = getTrackedContract(contractId);
  const balanceOfSig = "function balanceOf(address) view returns (uint256)";
  
  const result = await alchemyCall('eth_call', meta.address, { 
    data: encodeFunctionCall(balanceOfSig, [wallet]) 
  });

  const balance = decodeFunctionResult(balanceOfSig, result.result)[0] as bigint;
  const formatted = ethers.formatUnits(balance, meta.decimals);

  return { raw: balance.toString(), formatted };
}

export type TransferResult = {
  txHash: string;
};

export async function transferTokens(
  contractId: string,
  to: string,
  amountHuman: string
): Promise<TransferResult> {
  const signer = await getSigner();
  const meta = getTrackedContract(contractId);
  const contract = new ethers.Contract(meta.address, meta.abi, signer);

  const amount = ethers.parseUnits(amountHuman, meta.decimals);
  const tx = await contract.transfer(to, amount);
  const receipt = await tx.wait();

  return { txHash: receipt?.hash ?? tx.hash };
}

// Asset token functions
export async function mintTokens(
  contractId: string,
  to: string,
  amountHuman: string
): Promise<TransferResult> {
  const signer = await getSigner();
  const meta = getTrackedContract(contractId);
  const contract = new ethers.Contract(meta.address, meta.abi, signer);

  const amount = ethers.parseUnits(amountHuman, meta.decimals);
  const tx = await contract.mint(to, amount);
  const receipt = await tx.wait();

  return { txHash: receipt?.hash ?? tx.hash };
}

export async function burnTokens(
  contractId: string,
  from: string,
  amountHuman: string
): Promise<TransferResult> {
  const signer = await getSigner();
  const meta = getTrackedContract(contractId);
  const contract = new ethers.Contract(meta.address, meta.abi, signer);

  const amount = ethers.parseUnits(amountHuman, meta.decimals);
  const tx = await contract.burn(from, amount);
  const receipt = await tx.wait();

  return { txHash: receipt?.hash ?? tx.hash };
}

export async function approveTokens(
  contractId: string,
  spender: string,
  amountHuman: string
): Promise<TransferResult> {
  const signer = await getSigner();
  const meta = getTrackedContract(contractId);
  const contract = new ethers.Contract(meta.address, meta.abi, signer);

  const amount = ethers.parseUnits(amountHuman, meta.decimals);
  const tx = await contract.approve(spender, amount);
  const receipt = await tx.wait();

  return { txHash: receipt?.hash ?? tx.hash };
}

// Read-only version using Alchemy (no wallet required)
export async function getAllowance(
  contractId: string,
  owner: string,
  spender: string
): Promise<BalanceResult> {
  const meta = getTrackedContract(contractId);
  const allowanceSig = "function allowance(address,address) view returns (uint256)";
  
  const result = await alchemyCall('eth_call', meta.address, { 
    data: encodeFunctionCall(allowanceSig, [owner, spender]) 
  });

  const allowance = decodeFunctionResult(allowanceSig, result.result)[0] as bigint;
  const formatted = ethers.formatUnits(allowance, meta.decimals);

  return { raw: allowance.toString(), formatted };
}

export async function transferFromTokens(
  contractId: string,
  from: string,
  to: string,
  amountHuman: string
): Promise<TransferResult> {
  const signer = await getSigner();
  const meta = getTrackedContract(contractId);
  const contract = new ethers.Contract(meta.address, meta.abi, signer);

  const amount = ethers.parseUnits(amountHuman, meta.decimals);
  const tx = await contract.transferFrom(from, to, amount);
  const receipt = await tx.wait();

  return { txHash: receipt?.hash ?? tx.hash };
}

// Read-only version using Alchemy (no wallet required)
export async function getContractOwner(contractId: string): Promise<string> {
  const meta = getTrackedContract(contractId);
  const ownerSig = "function owner() view returns (address)";
  
  const result = await alchemyCall('eth_call', meta.address, { 
    data: encodeFunctionCall(ownerSig) 
  });

  return decodeFunctionResult(ownerSig, result.result)[0] as string;
}

export async function transferOwnership(
  contractId: string,
  newOwner: string
): Promise<TransferResult> {
  const signer = await getSigner();
  const meta = getTrackedContract(contractId);
  const contract = new ethers.Contract(meta.address, meta.abi, signer);

  const tx = await contract.transferOwnership(newOwner);
  const receipt = await tx.wait();

  return { txHash: receipt?.hash ?? tx.hash };
}

export async function renounceOwnership(contractId: string): Promise<TransferResult> {
  const signer = await getSigner();
  const meta = getTrackedContract(contractId);
  const contract = new ethers.Contract(meta.address, meta.abi, signer);

  const tx = await contract.renounceOwnership();
  const receipt = await tx.wait();

  return { txHash: receipt?.hash ?? tx.hash };
}

export type HoldersResult = {
  addresses: string[];
  balances: string[];
};

// Read-only version using Alchemy (no wallet required)
export async function getHolders(contractId: string): Promise<string[]> {
  const meta = getTrackedContract(contractId);
  const holdersSig = "function holders() view returns (address[])";

  console.log("Getting holders for:", meta.address);

  try {
    const result = await alchemyCall('eth_call', meta.address, { 
      data: encodeFunctionCall(holdersSig) 
    });
    const addresses = decodeFunctionResult(holdersSig, result.result)[0] as string[];
    console.log("holders() result:", addresses);
    return addresses;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error("holders() failed:", message);
    throw new Error("Could not fetch holders. Check contract permissions.");
  }
}

// Read-only version using Alchemy (no wallet required)
export async function getHoldersWithBalances(contractId: string): Promise<HoldersResult> {
  const meta = getTrackedContract(contractId);
  const holdersSig = "function holdersWithBalances() view returns (address[], uint256[])";

  console.log("Getting holdersWithBalances for:", meta.address);

  try {
    const result = await alchemyCall('eth_call', meta.address, { 
      data: encodeFunctionCall(holdersSig) 
    });
    const decoded = decodeFunctionResult(holdersSig, result.result);
    const addresses = decoded[0] as string[];
    const balances = (decoded[1] as bigint[]).map(b => b.toString());
    console.log("holdersWithBalances() result:", { addresses, balances });
    return { addresses, balances };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error("holdersWithBalances() failed:", message);
    throw new Error("Could not fetch holders with balances. Check contract permissions.");
  }
}

// Backwards compatibility alias
export async function getHoldersWithBalance(contractId: string): Promise<string[]> {
  const result = await getHoldersWithBalances(contractId);
  return result.addresses;
}

export function shortenAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}
