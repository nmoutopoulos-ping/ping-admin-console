import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ALCHEMY_API_KEY = Deno.env.get('ALCHEMY_API_KEY');
    if (!ALCHEMY_API_KEY) {
      console.error("ALCHEMY_API_KEY not configured");
      throw new Error("Alchemy API key not configured");
    }

    const { method, params, contractAddress, abi, functionName, functionParams } = await req.json();
    console.log("Request received:", { method, contractAddress, functionName });

    // Sepolia network
    const ALCHEMY_URL = `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

    if (method === 'eth_call') {
      // Encode function call using ethers-like encoding
      const response = await fetch(ALCHEMY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [
            {
              to: contractAddress,
              data: params.data,
            },
            'latest',
          ],
        }),
      });

      const result = await response.json();
      console.log("eth_call result:", result);

      if (result.error) {
        throw new Error(result.error.message);
      }

      return new Response(JSON.stringify({ result: result.result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'getLogs') {
      // Get Transfer events for token holder tracking
      const response = await fetch(ALCHEMY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getLogs',
          params: [{
            address: contractAddress,
            topics: params.topics,
            fromBlock: params.fromBlock || '0x0',
            toBlock: 'latest',
          }],
        }),
      });

      const result = await response.json();
      console.log("getLogs result count:", result.result?.length || 0);

      if (result.error) {
        throw new Error(result.error.message);
      }

      return new Response(JSON.stringify({ logs: result.result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'getTransferHistory') {
      // Get Transfer events with block timestamps for transaction history
      // Transfer event topic: keccak256("Transfer(address,address,uint256)")
      const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
      
      const logsResponse = await fetch(ALCHEMY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getLogs',
          params: [{
            address: contractAddress,
            topics: [transferTopic],
            fromBlock: '0x0',
            toBlock: 'latest',
          }],
        }),
      });

      const logsResult = await logsResponse.json();
      console.log("getTransferHistory logs count:", logsResult.result?.length || 0);

      if (logsResult.error) {
        throw new Error(logsResult.error.message);
      }

      const logs = logsResult.result || [];
      
      // Get unique block numbers
      const blockNumbers = [...new Set(logs.map((log: any) => log.blockNumber))];
      
      // Fetch block timestamps in batches
      const blockTimestamps: Record<string, number> = {};
      
      for (const blockNum of blockNumbers) {
        const blockResponse = await fetch(ALCHEMY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getBlockByNumber',
            params: [blockNum, false],
          }),
        });
        const blockResult = await blockResponse.json();
        if (blockResult.result?.timestamp) {
          blockTimestamps[blockNum as string] = parseInt(blockResult.result.timestamp, 16);
        }
      }

      // Parse logs into readable format
      const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
      const transfers = logs.map((log: any) => {
        const from = '0x' + log.topics[1].slice(26);
        const to = '0x' + log.topics[2].slice(26);
        const amount = parseInt(log.data, 16);
        const blockNumber = parseInt(log.blockNumber, 16);
        const timestamp = blockTimestamps[log.blockNumber] || 0;
        
        // Determine event type
        let eventType = 'Transfer';
        if (from.toLowerCase() === ZERO_ADDRESS) {
          eventType = 'Mint';
        } else if (to.toLowerCase() === ZERO_ADDRESS) {
          eventType = 'Burn';
        }
        
        return {
          txHash: log.transactionHash,
          blockNumber,
          timestamp,
          from,
          to,
          amount,
          eventType,
        };
      });

      // Sort by block number descending (newest first)
      transfers.sort((a: any, b: any) => b.blockNumber - a.blockNumber);

      console.log("getTransferHistory parsed:", transfers.length, "transfers");

      return new Response(JSON.stringify({ transfers }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'alchemy_getTokenBalances') {
      // Get all token balances for a wallet address
      const response = await fetch(ALCHEMY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'alchemy_getTokenBalances',
          params: [params.address, 'erc20'],
        }),
      });

      const result = await response.json();
      console.log("alchemy_getTokenBalances result:", result.result?.tokenBalances?.length || 0, "tokens");

      if (result.error) {
        throw new Error(result.error.message);
      }

      return new Response(JSON.stringify({ result: result.result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'alchemy_getTokenMetadata') {
      // Read token metadata directly from the contract (not Alchemy cache)
      // This ensures we get the latest on-chain data
      const tokenAddress = params.contractAddress;
      
      // Function selectors for ERC20 standard methods
      const nameSelector = '0x06fdde03';     // name()
      const symbolSelector = '0x95d89b41';   // symbol()
      const decimalsSelector = '0x313ce567'; // decimals()
      
      // Make parallel calls to get name, symbol, and decimals
      const [nameRes, symbolRes, decimalsRes] = await Promise.all([
        fetch(ALCHEMY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0', id: 1, method: 'eth_call',
            params: [{ to: tokenAddress, data: nameSelector }, 'latest'],
          }),
        }),
        fetch(ALCHEMY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0', id: 2, method: 'eth_call',
            params: [{ to: tokenAddress, data: symbolSelector }, 'latest'],
          }),
        }),
        fetch(ALCHEMY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0', id: 3, method: 'eth_call',
            params: [{ to: tokenAddress, data: decimalsSelector }, 'latest'],
          }),
        }),
      ]);

      const [nameData, symbolData, decimalsData] = await Promise.all([
        nameRes.json(),
        symbolRes.json(),
        decimalsRes.json(),
      ]);

      // Decode string from ABI-encoded response
      const decodeString = (hex: string): string => {
        if (!hex || hex === '0x') return '';
        try {
          // Remove 0x prefix
          const data = hex.slice(2);
          // For dynamic string: offset (32 bytes) + length (32 bytes) + data
          if (data.length >= 128) {
            const lengthHex = data.slice(64, 128);
            const length = parseInt(lengthHex, 16);
            const stringHex = data.slice(128, 128 + length * 2);
            let result = '';
            for (let i = 0; i < stringHex.length; i += 2) {
              result += String.fromCharCode(parseInt(stringHex.slice(i, i + 2), 16));
            }
            return result;
          }
          // Fallback: try direct hex to string
          let result = '';
          for (let i = 0; i < data.length; i += 2) {
            const charCode = parseInt(data.slice(i, i + 2), 16);
            if (charCode > 0) result += String.fromCharCode(charCode);
          }
          return result.trim();
        } catch {
          return '';
        }
      };

      const name = decodeString(nameData.result);
      const symbol = decodeString(symbolData.result);
      const decimals = decimalsData.result ? parseInt(decimalsData.result, 16) : 18;

      console.log("Direct contract read result:", { name, symbol, decimals, address: tokenAddress });

      return new Response(JSON.stringify({ 
        result: { name, symbol, decimals, logo: null } 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'getBalance') {
      const response = await fetch(ALCHEMY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [
            {
              to: contractAddress,
              data: params.data,
            },
            'latest',
          ],
        }),
      });

      const result = await response.json();
      console.log("getBalance result:", result);

      if (result.error) {
        throw new Error(result.error.message);
      }

      return new Response(JSON.stringify({ balance: result.result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`Unknown method: ${method}`);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Alchemy RPC error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
