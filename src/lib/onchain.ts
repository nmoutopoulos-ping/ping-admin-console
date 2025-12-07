import { ethers } from "ethers";
import { TRACKED_CONTRACTS, TrackedContract } from "./contractRegistry";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export type WalletInfo = {
  address: string;
  chainId: number;
};

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

export async function readTokenInfo(contractId: string): Promise<TokenInfo> {
  const signer = await getSigner();
  const meta = getTrackedContract(contractId);
  const contract = new ethers.Contract(meta.address, meta.abi, signer);

  const [name, symbol, decimals, totalSupply] = await Promise.all([
    contract.name(),
    contract.symbol(),
    contract.decimals(),
    contract.totalSupply(),
  ]);

  const formattedSupply = ethers.formatUnits(totalSupply, decimals);

  return {
    name,
    symbol,
    decimals: Number(decimals),
    totalSupplyRaw: totalSupply.toString(),
    totalSupplyFormatted: formattedSupply,
  };
}

export type BalanceResult = {
  raw: string;
  formatted: string;
};

export async function getTokenBalance(
  contractId: string,
  wallet: string
): Promise<BalanceResult> {
  const signer = await getSigner();
  const meta = getTrackedContract(contractId);
  const contract = new ethers.Contract(meta.address, meta.abi, signer);

  const balance = await contract.balanceOf(wallet);
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

export async function getAllowance(
  contractId: string,
  owner: string,
  spender: string
): Promise<BalanceResult> {
  const signer = await getSigner();
  const meta = getTrackedContract(contractId);
  const contract = new ethers.Contract(meta.address, meta.abi, signer);

  const allowance = await contract.allowance(owner, spender);
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

export async function getContractOwner(contractId: string): Promise<string> {
  const signer = await getSigner();
  const meta = getTrackedContract(contractId);
  const contract = new ethers.Contract(meta.address, meta.abi, signer);

  return contract.owner();
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

export async function getHolders(contractId: string): Promise<string[]> {
  const signer = await getSigner();
  const meta = getTrackedContract(contractId);
  const contract = new ethers.Contract(meta.address, meta.abi, signer);

  try {
    return await contract.holders();
  } catch (err) {
    console.warn("holders() function not available on contract:", err);
    throw new Error("This contract does not support the holders() function. The contract may not have this feature implemented.");
  }
}

export async function getHoldersWithBalance(contractId: string): Promise<string[]> {
  const signer = await getSigner();
  const meta = getTrackedContract(contractId);
  
  console.log("Calling holdersWithBalance on:", {
    contractId,
    address: meta.address,
    network: await signer.provider?.getNetwork(),
  });
  
  const contract = new ethers.Contract(meta.address, meta.abi, signer);

  try {
    const result = await contract.holdersWithBalance();
    console.log("holdersWithBalance result:", result);
    return result;
  } catch (err: any) {
    console.error("holdersWithBalance() error details:", {
      message: err?.message,
      code: err?.code,
      data: err?.data,
      reason: err?.reason,
      fullError: err,
    });
    throw new Error("This contract does not support the holdersWithBalance() function. The contract may not have this feature implemented.");
  }
}

export function shortenAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}
