import { ethers } from "ethers";
import Cors from 'cors';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
const { TxType, parseKlay } = require("@kaiachain/ethers-ext/v6");
import axios from "axios";
import NodeCache from "node-cache";



console.log(process.env.GEMINI_API_KEY);
const geminiobj = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = geminiobj.getGenerativeModel({model:"gemini-1.5-flash"})
const cors = Cors({ methods: ['GET', 'POST', 'HEAD'] });
const mainnetprovider = new URL("https://public-en.node.kaia.io")
const testnetprovider = new URL("https://public-en-kairos.node.kaia.io")
const priceCache = new NodeCache({ stdTTL: 60 });
const addressch = new NodeCache();
export async function POST(request) 
{
 const {message,address}=await request.json();
 const addressc = addressch.get('Address');
 console.log(addressc)

 try{
   console.log("Recieved Query",message)
   console.log("Recieved Address",address)
   const result = await processwithGemini(message);
   console.log(result.response.text());
   const action = await performAction(result.response.text(),address);
   console.log(
    "Action result:",
    JSON.stringify(action, getCircularReplacer())
  );
  let finalResponse;
  let showSwapConfirmation = false;

  if(action.actionType=="GET_TRANSACTION_INFO")
  {
    finalResponse = await generateHumanReadableResponse(action.transactionInfo,action.network,action.type)
  }
  else if (
    action.actionType === "GET_TRANSACTIONS" ||
    action.actionType === "GENERATE_SUMMARY"
  ) {
    finalResponse = await generateHumanReadableResponse(
      action.transactions,
      action.network,
      action.actionType
    );
  } else {
    finalResponse = await generateHumanReadableResponse(
      action,
      action.network || "unknown",
      action.actionType || "unknown"
    );
  }

  console.log("Final response:", finalResponse);

  return NextResponse.json({
    response: finalResponse,
    priceData: action.priceData,
    quoteData: action.quoteData,
    transactionDetails: action.transaction
      ? {
          transaction: action.transaction,
            network: action.network,
            connection: action.connection?.rpcEndpoint,
        }
      : null,
      showSwapConfirmation: showSwapConfirmation,
  });
} catch (error) {
  console.error("Error:", error);
  return NextResponse.json(
    { error: "An error occurred while processing your request." },
    { status: 500 }
  );
}
}


function getCircularReplacer() {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return;
        }
        seen.add(value);
      }
      if (typeof value === "bigint") {
        return value.toString(); // Convert BigInt to string
    }
      return value;
    };
  }


  async function performAction(action, walletAddress) {
    const lines = action.split("\n");
    console.log(lines);
    let actionType = "";
  
    // Extracting actionType from the input lines
    for (const line of lines) {
      if (line.startsWith("Classification:")) {
        actionType = line.split(": ")[1];
        break;
      }
    }
    console.log(actionType);
    const params = lines.slice(1);
  
    // Helper function to get a parameter value by its key
    const getParam = (key) => {
      const param = params.find((p) =>
        p.trim().toLowerCase().startsWith(key.toLowerCase())
      );
      return param ? param.split(":").slice(1).join(":").trim() : null;
    };
  
    // Determine wallet type and address to use
    const walletType = getParam("walletType") || "MY_WALLET";
    let addressToUse =
      walletType === "SPECIFIED_WALLET" ? getParam("address") : walletAddress;
    console.log(walletAddress);
    // Validate address
    if (!addressToUse || !/^0x[a-fA-F0-9]{40}$/.test(addressToUse)) {
      addressToUse = walletAddress;
    }
  
    // If address is still unspecified, use the walletAddress
    if (!addressToUse || addressToUse === "unspecified") {
      addressToUse = walletAddress;
    }
  
    // If no address is available at this point, throw an error
    if (!addressToUse) {
      throw new Error("Wallet address is required for this action.");
    }
  
    // Determine network type
    let network = "mainnet";
    if (actionType.includes("TESTNET")) {
      network = "testnet";
    } else {
      network = getParam("network") || "mainnet";
    }
  
    switch (actionType) {
      case "GET_BALANCE":
      case "GET_TESTNET_BALANCE":
      case "GET_DEVNET_BALANCE":
        console.log(`Fetching balance for address: ${addressToUse} on ${network}`);
        const balanceResult = await getBalance(addressToUse, network);
      
        if ("error" in balanceResult) {
          console.error(balanceResult.error);
          return balanceResult.error;
        }
      
        return `Balance on ${balanceResult.network} is ${balanceResult.balance} KAIA`;
  
      case "GET_TRANSACTIONS":
      case "GENERATE_SUMMARY":
        const count = parseInt(getParam("count") || "10");
        console.log(
          `Fetching ${count} transactions for address: ${addressToUse} on ${network}`
        );
        const transactions = await getLastTransactions(
          addressToUse,
          count,
          network
        );
        return { transactions, network, actionType };
  
     
        case "GET_TRANSACTION_INFO":
          const txHash = getParam("txHash");
          let transactiondata = [];
          if (txHash) {
            console.log(
              `Fetching details for transaction: ${txHash} on ${network}`
            );
        
            const txInfo = await getTransactionInfo(txHash, network);
            txInfo[0].value=parseInt(txInfo[0].value,16);
            txInfo[0].value=txInfo[0].value/1e18;
            const hexa = txInfo;
            console.log(hexa[0].value);
            return {
              transactionInfo: txInfo,
              actionType: "GET_TRANSACTION_INFO",
              network,
            };
          }
          return "Transaction hash is required for this action.";
        
      case "SEND_TRANSACTION":
      case "SEND_TESTNET_TRANSACTION":
      case "SEND_DEVNET_TRANSACTION":
        const recipient = getParam("recipient");
        const amount = parseFloat(getParam("amount") || "0");
        if (recipient && amount) {
          console.log(
            `Sending ${amount} KAIA to ${recipient} from ${addressToUse} on ${network}`
          );
          const result = await sendTransactionKaiaViaWallet(
            addressToUse,
            recipient,
            amount,
            network,
            signTransactionWithKaiaWallet
          );
          if (result.error) {
            return result.error;
          }
          return result;
        }
        return `Insufficient parameters for ${actionType}`;
    case "GET_CRYPTO_PRICE":
        const symbol = getParam("symbol");
        if (!symbol) {
          return { response: "Error: No cryptocurrency symbol provided." };
        }
        console.log(`Fetching price for ${symbol}`);
        try {
          const priceData = await getCryptoPrice(symbol);
          return {
            response: `The current price of ${
              priceData.symbol
            } is $${priceData.price.toFixed(
              2
            )}. 24h change: ${priceData.priceChange24h.toFixed(2)}%`,
            priceData: priceData,
          };
        } catch (error) {
          return { response: `Error: ${error.message}` };
        }
  
      default:
        return "I'm sorry, I couldn't understand your request. Could you please rephrase it?";
    }
  }




async function callKaiaRPC(method, params,connection) {
    try {
      const response = await fetch(`${connection}/kaia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method,
          params,
          id: 1,
        }),
      });
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }
      return data.result;
    } catch (error) {
      console.error(`Error calling ${method}: ${error.message}`);
      throw error;
    }
  }
  
  // Get the latest block number
  async function getLatestBlock(connection) {
    try {
      const blockNumberHex = await callKaiaRPC("kaia_blockNumber", [],connection);
      console.log(blockNumberHex);
      console.log(parseInt(blockNumberHex,16));
      return parseInt(blockNumberHex, 16); // Convert hex to integer
    } catch (error) {
      throw new Error(`Failed to fetch block number: ${error.message}`);
    }
  }
  
  async function getTransactionsForRange(blockRange, address, connectiontouse) {
    const transactions = [];
    
    // Make parallel requests for multiple blocks at once
    const blockPromises = blockRange.map(async (block) => {
        let index = 0;
        const blockTransactions = [];
        while (true) {
            try {
                const transaction = await callRPC("kaia_getTransactionByBlockNumberAndIndex", [block, `0x${index.toString(16)}`], connectiontouse);
                if (!transaction) {
                    break; // No more transactions in this block
                }
                if (transaction.from.toLowerCase() === address.toLowerCase() || transaction.to.toLowerCase() === address.toLowerCase()) {
                    blockTransactions.push({
                        hash: transaction.hash,
                        from: transaction.from,
                        to: transaction.to,
                        value: `${parseInt(transaction.value, 16) / 1e18} KLAY`, // Convert value to KLAY
                        blockNumber: parseInt(transaction.blockNumber, 16),
                    });
                }
                index++;
            } catch (e) {
                break; // Error fetching transaction, exit the loop
            }
        }
        return blockTransactions;
    });

    // Wait for all block data to be fetched in parallel
    const allTransactions = await Promise.all(blockPromises);

    // Combine all transactions from each block
    allTransactions.forEach((blockTxs) => {
        transactions.push(...blockTxs);
    });

    return transactions;
}
 async function getLastTransactions(address, count, network) {
    const connectiontouse = network === "testnet" ? testnetprovider : mainnetprovider;
    try {
        const transactions = [];
        let latestBlock = await getLatestBlock(connectiontouse);

        // Limit the number of blocks to search
        const blocksToSearch = 100; // Search the last 100 blocks (increase if needed)
        const blockRange = [];
        
        // Create a range of blocks to search
        for (let i = 0; i < blocksToSearch; i++) {
            if (latestBlock - i >= 0) {
                blockRange.push(latestBlock - i);
            }
        }

        // Fetch transactions in parallel from the specified block range
        const allTransactions = await getTransactionsForRange(blockRange, address, connectiontouse);

        // Filter transactions to match the required count
        let filteredTransactions = allTransactions.filter(tx => tx.from.toLowerCase() === address.toLowerCase() || tx.to.toLowerCase() === address.toLowerCase());

        // If no transactions found, return a message
        if (filteredTransactions.length === 0) {
            return `No transactions found for wallet address: ${address}`;
        }

        // Return the latest `count` transactions
        return filteredTransactions.slice(0, count);
    } catch (e) {
        console.error("Error fetching transactions:", e.message);
        return [];
    }
}

async function getTransactionInfo(txHash,network) 
{
 const connectionToUse = network === "testnet"?testnetprovider:mainnetprovider;
 try{
   const transactions = [];
   const transaction = await callKaiaRPC("kaia_getTransactionByHash",[txHash],connectionToUse);
   transactions.push(transaction);
   return transactions;
 }
 catch(e)
 {
  console.log("Something went wrong ",e);

 }

}




async function getCryptoPrice(symbol) {
  const cacheKey = `price_${symbol.toLowerCase()}`;
  const cachedData = priceCache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await axios.get(
      `https://min-api.cryptocompare.com/data/v2/histohour?fsym=${symbol}&tsym=USD&limit=24`,
      { timeout: 5000 }
    );

    if (!response.data || !response.data.Data || !response.data.Data.Data) {
      throw new Error("Invalid response from CryptoCompare");
    }

    const historicalData = response.data.Data.Data;
    const currentPrice = historicalData[historicalData.length - 1].close;
    const sparklineData = historicalData.map((dataPoint) => dataPoint.close);
    const priceChange24h =
      ((currentPrice - sparklineData[0]) / sparklineData[0]) * 100;

    const result = {
      symbol: symbol.toUpperCase(),
      price: currentPrice,
      priceChange24h: priceChange24h,
      sparklineData: sparklineData,
      lastUpdated: new Date().toISOString(),
    };

    console.log(`Price fetched from CryptoCompare`);
    priceCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`Error fetching from CryptoCompare:`, error);
    throw new Error(`Unable to fetch price for ${symbol}`);
  }
}

async function getCryptoPriceFromCryptoCompare(symbol) {
  const [priceResponse, historyResponse] = await Promise.all([
    axios.get(
      `https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=USD`,
      { timeout: 5000 }
    ),
    axios.get(
      `https://min-api.cryptocompare.com/data/v2/histohour?fsym=${symbol}&tsym=USD&limit=24`,
      { timeout: 5000 }
    ),
  ]);

  if (!priceResponse.data || !priceResponse.data.USD) {
    throw new Error("Invalid response from CryptoCompare for current price");
  }

  if (
    !historyResponse.data ||
    !historyResponse.data.Data ||
    !historyResponse.data.Data.Data
  ) {
    throw new Error("Invalid response from CryptoCompare for historical data");
  }

  const currentPrice = priceResponse.data.USD;
  const sparklineData = historyResponse.data.Data.Data.map(
    (dataPoint) => dataPoint.close
  );

  // Calculate 24h change
  const priceChange24h =
    ((currentPrice - sparklineData[0]) / sparklineData[0]) * 100;

  return {
    symbol: symbol.toUpperCase(),
    price: currentPrice,
    priceChange24h: priceChange24h,
    sparklineData: sparklineData,
    lastUpdated: new Date().toISOString(),
  };
}

async function getCryptoPriceFromBinance(symbol) {
  const response = await axios.get(
    `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`,
    { timeout: 5000 }
  );
  if (!response.data || !response.data.price) {
    throw new Error("Invalid response from Binance");
  }
  return {
    symbol: symbol.toUpperCase(),
    price: parseFloat(response.data.price),
    lastUpdated: new Date().toISOString(),
  };
}

async function getCryptoPriceFromCoinbase(symbol) {
  const response = await axios.get(
    `https://api.coinbase.com/v2/prices/${symbol}-USD/spot`,
    { timeout: 5000 }
  );
  if (!response.data || !response.data.data || !response.data.data.amount) {
    throw new Error("Invalid response from Coinbase");
  }
  return {
    symbol: symbol.toUpperCase(),
    price: parseFloat(response.data.data.amount),
    lastUpdated: new Date().toISOString(),
  };
}

async function getBalance(
  address,
  network
) {
    console.log(network);
  // Select provider based on network
  const connectionToUse = network === "testnet" ? testnetprovider : mainnetprovider;
  
  console.log(`Using network: ${network}`);
  try {
    
    let config = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          method: "kaia_getBalance",
          id: 1,
          jsonrpc: "2.0",
          params: [address, "latest"],  // Address and block parameter
        }),
      };
    
      const response = await fetch(`${connectionToUse}kaia/getBalance`, config);
    
      // Check if the response is OK (status 200)
      if (response.ok) {
        const data = await response.json();  // Parse JSON from the response body
        console.log("Balance data:", data);   // Log the response data
        const hexBalance = data.result;
        const decimalBalance = parseInt(hexBalance, 16);
         // Convert from hex to decimal
        const balance = decimalBalance / 1e18;
        console.log(decimalBalance);
        console.log(balance)
        // Check if the response contains an error
        if (data.error) {
          console.error("Error fetching balance:", data.error.message);
          return { error: `Failed to fetch balance: ${data.error.message}` };
        }
        
        return {network,balance};
       }  
}catch (err) {
    // Log and return error
    console.error("Error fetching balance:", err);
    return { error: `Failed to fetch balance: ${err.message || err}` };
  }
}
const signTransactionWithKaiaWallet = async (tx) => {
  if (typeof window !== "undefined" && typeof window.kaia !== "undefined") {
    try {
      console.log("Requesting transaction signing from Kaia Wallet.");
      const signedTransaction = await window.kaia.request({
        method: "kaia_signTransaction",
        params: [tx],
      });
      return signedTransaction;
    } catch (error) {
      console.error("Error signing transaction:", error.message || error);
      throw new Error("Transaction signing failed. Ensure Kaia Wallet is connected.");
    }
  } else {
    throw new Error("Kaia Wallet is not detected or window is not defined.");
  }
};

// Function to send a transaction via Kaia Wallet and broadcast to the blockchain
const sendTransactionKaiaViaWallet = async (
  senderAddress,
  receiverAddress,
  amount,
  network = "testnet" // Default to testnet
) => {
  try {
    // Validate addresses and input
    if (!senderAddress || !receiverAddress || !amount) {
      throw new Error("Invalid parameters. Ensure sender, receiver, and amount are provided.");
    }

    // Public EN node endpoints for Kaia blockchain
    const rpcEndpoint =
      network === "testnet"
        ? "https://public-en-kairos.node.kaia.io"
        : "https://public-en.node.kaia.io";

    // Prepare the transaction object
    const tx = {
      from: senderAddress,
      to: receiverAddress,
      gas: "0x76c0", // Hexadecimal for gas limit (30,000)
      gasPrice: "0x5d21dba00", // Hexadecimal for gas price (25 gwei)
      value: `0x${parseInt(amount).toString(16)}`, // Convert amount to hexadecimal
      input: "0x", // Empty data field for basic value transfer
    };

    console.log("Prepared transaction:", tx);

    // Sign the transaction using Kaia Wallet
    const signedTx = await signTransactionWithKaiaWallet(tx);

    if (!signedTx) {
      throw new Error("Transaction signing was canceled or failed.");
    }

    console.log("Signed transaction:", signedTx);

    // Send the signed transaction to the blockchain
    const response = await axios.post(rpcEndpoint, {
      method: "kaia_sendTransaction",
      jsonrpc: "2.0",
      id: 1,
      params: [signedTx],
    });

    if (response.data.error) {
      throw new Error(response.data.error.message || "Transaction failed.");
    }

    console.log("Transaction broadcasted successfully. Hash:", response.data.result);

    return {
      hash: response.data.result,
      message: `Transaction sent successfully! Hash: ${response.data.result}`,
    };
  } catch (error) {
    console.error("Error sending transaction:", error.message || error);
    return {
      error: `Transaction failed: ${error.message}`,
    };
  }
};














async function  processwithGemini(messager) {
    const prompt = `  You are a helpful assistant that interprets user requests related to Kaia blockchain transactions and cryptocurrency information. Interpret the following user request and classify it into one of these actions: GET_BALANCE, GET_TRANSACTIONS,GET_TRANSACTION_INFO SEND_TRANSACTION, SWAP_TOKENS, GENERATE_SUMMARY, GET_CRYPTO_PRICE, GET_TESTNET_BALANCE, GET_DEVNET_BALANCE, REQUEST_AIRDROP, SEND_DEVNET_TRANSACTION, SEND_TESTNET_TRANSACTION, or UNKNOWN. Also, extract any relevant parameters. Also, there are only 2 types of wallets that can be there - MY_WALLET and SPECIFIED_WALLET.
                      Some sample examples are included below for your understanding. Use them to understand in what format you have to classify the requests. Do note that inputs can vary, and you would need to classify as per the best action.
                      
                      Examples:

                      User request: "tell me about the transaction with hash ywCMhvfUSuBngxKxd1Dz3v8uqW7aooxwV1TNdAjmy7mPutXR6ri5ky8BQp1bmu95LdoKdp3yDpph9oojKD6Fhyq on testnet"
                      Classification: GET_TRANSACTION_INFO 
                      txHash: ywCMhvfUSuBngxKxd1Dz3v8uqW7aooxwV1TNdAjmy7mPutXR6ri5ky8BQp1bmu95LdoKdp3yDpph9oojKD6Fhyq
                      network: testnet


                      User request: "tell me about my last 5 transactions"
                      Classification: GET_TRANSACTIONS
                      walletType: MY_WALLET
                      count: 5
                      network: mainnet

                      User request: "Tell me about my last 5 transactions on testnet"
                      Classification: GET_TRANSACTIONS
                      walletType: MY_WALLET
                      count: 5
                      network: testnet

                      User request: "Airdrop me Kaia on my testnet"
                      classification: REQUEST_AIRDROP
                      walletType: MY_WALLET
                      network: testnet

                      User request: "Send 2 Kaia to address Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
                      Classification: SEND_TRANSACTION
                      walletType: MY_WALLET
                      recipient:Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr
                      amount:2

                      User request: "What's my account balance?"
                      Classification: GET_BALANCE
                      walletType: MY_WALLET

                      User request: "Swap 1 Kaia for USDC from my wallet"
                      Classification: SWAP_TOKENS
                      walletType: MY_WALLET
                      fromToken:SOL
                      toToken:USDC
                      amount:1

                      User request: "Generate a summary of my transactions for the last 30 days"
                      Classification: GENERATE_SUMMARY
                      walletType: MY_WALLET
                      days:30

                      User request: "What's the current price of Bitcoin?"
                      Classification: GET_CRYPTO_PRICE
                      symbol:BTC

                      User request: "What's my testnet balance?"
                      Classification: GET_TESTNET_BALANCE
                      walletType: MY_WALLET

                      User request: "Generate a summary of my transactions for the last 6 months"
                      Classification: GENERATE_SUMMARY
                      walletType: MY_WALLET
                      timePeriod: 6 months

                      User request: "last 25 transactions of ob2htHLoCu2P6tX7RrNVtiG1mYTas8NGJEVLaFEUngk"
                      Classification: GET_TRANSACTIONS
                      walletType: SPECIFIED_WALLET
                      address: ob2htHLoCu2P6tX7RrNVtiG1mYTas8NGJEVLaFEUngk
                      count: 25
                      network: mainnet




                      Now, interpret this user request: "${messager}"`;
                       
        const result = await model.generateContent(prompt);
        return result;
}
                  
async function processwithGrok(messager) 
{
    return grokobj.chat.completions.create({
        messages: [

          {
            role: "assistant",
            content: `You are a helpful assistant that interprets user requests related to Kaia blockchain transactions and cryptocurrency information. Interpret the following user request and classify it into one of these actions: GET_BALANCE, GET_TRANSACTIONS, SEND_TRANSACTION, SWAP_TOKENS, GENERATE_SUMMARY, GET_CRYPTO_PRICE, GET_TESTNET_BALANCE, GET_DEVNET_BALANCE, REQUEST_AIRDROP, SEND_DEVNET_TRANSACTION, SEND_TESTNET_TRANSACTION, or UNKNOWN. Also, extract any relevant parameters. Also, there are only 2 types of wallets that can be there - MY_WALLET and SPECIFIED_WALLET.
                      Some sample examples are included below for your understanding. Use them to understand in what format you have to classify the requests. Do note that inputs can vary, and you would need to classify as per the best action.
                      
                      Examples:
                      User request: "tell me about my last 5 transactions"
                      Classification: GET_TRANSACTIONS
                      walletType: MY_WALLET
                      count: 5
                      network: mainnet

                      User request: "Tell me about my last 5 transactions on testnet"
                      Classification: GET_TRANSACTIONS
                      walletType: MY_WALLET
                      count: 5
                      network: testnet

                      User request: "Airdrop me Kaia on my testnet"
                      classification: REQUEST_AIRDROP
                      walletType: MY_WALLET
                      network: testnet

                      User request: "Send 2 Kaia to address Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
                      Classification: SEND_TRANSACTION
                      walletType: MY_WALLET
                      recipient:Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr
                      amount:2

                      User request: "What's my account balance?"
                      Classification: GET_BALANCE
                      walletType: MY_WALLET

                      User request: "Swap 1 Kaia for USDC from my wallet"
                      Classification: SWAP_TOKENS
                      walletType: MY_WALLET
                      fromToken:SOL
                      toToken:USDC
                      amount:1

                      User request: "Generate a summary of my transactions for the last 30 days"
                      Classification: GENERATE_SUMMARY
                      walletType: MY_WALLET
                      days:30

                      User request: "What's the current price of Bitcoin?"
                      Classification: GET_CRYPTO_PRICE
                      symbol:BTC

                      User request: "What's my testnet balance?"
                      Classification: GET_TESTNET_BALANCE
                      walletType: MY_WALLET

                      User request: "Generate a summary of my transactions for the last 6 months"
                      Classification: GENERATE_SUMMARY
                      walletType: MY_WALLET
                      timePeriod: 6 months

                      User request: "last 25 transactions of ob2htHLoCu2P6tX7RrNVtiG1mYTas8NGJEVLaFEUngk"
                      Classification: GET_TRANSACTIONS
                      walletType: SPECIFIED_WALLET
                      address: ob2htHLoCu2P6tX7RrNVtiG1mYTas8NGJEVLaFEUngk
                      count: 25
                      network: mainnet


                      User request: "tell me about the transaction with hash ywCMhvfUSuBngxKxd1Dz3v8uqW7aooxwV1TNdAjmy7mPutXR6ri5ky8BQp1bmu95LdoKdp3yDpph9oojKD6Fhyq on devnet"
                      Classification: GET_TRANSACTION_INFO 
                      txHash: ywCMhvfUSuBngxKxd1Dz3v8uqW7aooxwV1TNdAjmy7mPutXR6ri5ky8BQp1bmu95LdoKdp3yDpph9oojKD6Fhyq
                      network: devnet

                      Now, interpret this user request:`,
          },
    
          {
            role: "user",
            content:messager,
          },
        ],
        model: "llama3-8b-8192",
        temperature: 0.5,
        max_tokens: 1024,
        top_p: 1,
        stop: null,
        stream: false,
      });
}

async function generateHumanReadableResponse(
  result,
  network,
  action
) {
  let resultString = "";
  let fullTransactionList = "";
  let finalResponse = "";

  
  if (action === "GET_TRANSACTIONS" || action === "GENERATE_SUMMARY") {
    if (typeof result === "string") {
      // This means no transactions were found
      resultString = result;
      fullTransactionList = "No transactions found.";
    } else if (Array.isArray(result) && result.length > 0) {
      fullTransactionList = result
        .map(
          (tx, index) => `Transaction ${index + 1}:
Signature: ${tx.signature}
Time: ${tx.blockTime}
Status: ${tx.status}
Fee: ${tx.fee}
Amount: ${tx.amount}
Type: ${tx.type}
Sender: ${tx.sender}
Receiver: ${tx.receiver}`
        )
        .join("\n\n");

      resultString = `Summary of ${result.length} transactions on the ${network} network.`;
    } else {
      resultString = "No transaction data available.";
      fullTransactionList = "No transactions found.";
    }
  }

  else if (action === "GET_ALL_BALANCES") {
    result.balances.forEach((balance) => {
      resultString += `${balance.token}: ${balance.uiAmount}\n`;
    });
  }
  if (action === "SWAP_TOKENS") {
    if (result.quoteData) {
      const quote = result.quoteData;
      resultString = `Swap Quote Details:
From: ${result.fromToken} (${quote.inputMint})
To: ${result.toToken} (${quote.outputMint})
Input Amount: ${result.amount} ${result.fromToken}
Expected Output: ${quote.outAmount / 1e6} ${result.toToken}
Price: 1 ${result.fromToken} = ${(quote.outAmount / (result.amount * 1e9) * 1e6).toFixed(6)} ${result.toToken}
Price Impact: ${(quote.priceImpactPct * 100).toFixed(2)}%
Minimum Output Amount: ${quote.otherAmountThreshold / 1e6} ${result.toToken}

Route: ${quote.routePlan.map((step) => step.swapInfo.label).join(" -> ")}

This quote is valid for a limited time. Would you like to proceed with the swap?`;
    } else if (result.error) {
      resultString = `Error fetching swap quote: ${result.error}`;
    } else {
      resultString = "Unable to fetch swap quote. Please try again later.";
    }
  }
  
  else if (action === "GET_TRANSACTION_INFO") {
    if (result.error) {
      resultString = `Error: ${result.message}`;
    } else if (
      result.transactionInfo &&
      result.transactionInfo.transactionInfo
    ) {
      const txInfo = result.transactionInfo.transactionInfo;
      resultString = `Transaction Details on ${network}: 
Signature: ${txInfo.signature}
Block Time: ${txInfo.blockTime}
Slot: ${txInfo.slot}
Fee: ${txInfo.fee}
Status: ${txInfo.status}
Instructions: ${
        Array.isArray(txInfo.instructions)
          ? txInfo.instructions.join(", ")
          : JSON.stringify(txInfo.instructions)
      }
Accounts Involved: ${txInfo.accounts.map((acc) => acc.pubkey).join(", ")}
Balance Changes: ${txInfo.balanceChanges
        .map((change) => `${change.account}: ${change.change} KAIA`)
        .join(", ")}
${txInfo.logs ? `Logs: ${txInfo.logs.join("\n")}` : ""}`;
    } else {
      resultString = "Unable to process transaction information.";
    }
  } else if (
    Array.isArray(result) &&
    result.length > 0 &&
    "signature" in result[0]
  ) {
    // This is a transaction list
    fullTransactionList = result
      .map(
        (tx, index) => `Transaction ${index + 1}:
Signature: ${tx.signature}
Time: ${tx.blockTime}
Status: ${tx.status}
Fee: ${tx.fee}
Amount: ${tx.amount}
Type: ${tx.type}`
      )
      .join("\n");

    resultString = `Summary of ${result.length} transactions on the ${network} network.`;
  } else if (typeof result === "string") {
    resultString = result;
  } else {
    resultString = JSON.stringify(result, getCircularReplacer(), 2);
  }

// const prompt = `You are a helpful assistant that explains Solana blockchain transactions and cryptocurrency information in simple terms.
// Convert the following data into a human-readable format, keeping in mind that this information is from the ${network} network , 
// if "unknown" network is mentioned then dont include that in your response:

// ${resultString}

// Provide a clear and concise explanation of the information or action described in the data. Keep your tone helpful and professional. Include all the data you received without missing anything. You don't have to mention that you are explicitly showing the data in "human readable format". Conclude with an invitation for the user to ask for further assistance if needed.`;
const prompt = `You are a helpful assistant that explains Kaia blockchain transactions and cryptocurrency information in simple terms. Convert the following data into a human-readable format, keeping in mind that this information is from the ${network} network , if "unknown" network is mentioned then dont include that in your response:

${resultString}

Provide a clear and concise explanation of the information or action described in the data. Keep your tone helpful and professional. Include all the data you received without missing anything. You don't have to mention that you are explicitly showing the data in "human readable format". Conclude with an invitation for the user to ask for further assistance if needed.`;

const response = await model.generateContent(prompt)

// Log or return the response
  console.log(response);

  console.log("\n Action type is", action);
  console.log(fullTransactionList);

  // For GET_TRANSACTIONS and GENERATE_SUMMARY, append the full transaction list
  if (action === "GET_TRANSACTIONS" || action === "GENERATE_SUMMARY") {
    finalResponse = `${response.response.text()}\n\nHere is the full list of transactions:\n${fullTransactionList}`;
  } else {
    finalResponse = response.response.text()||"";
  }

  return finalResponse;
}
