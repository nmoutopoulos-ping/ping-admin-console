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
      // Get token metadata (name, symbol, decimals)
      const response = await fetch(ALCHEMY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'alchemy_getTokenMetadata',
          params: [params.contractAddress],
        }),
      });

      const result = await response.json();
      console.log("alchemy_getTokenMetadata result:", result.result);

      if (result.error) {
        throw new Error(result.error.message);
      }

      return new Response(JSON.stringify({ result: result.result }), {
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
