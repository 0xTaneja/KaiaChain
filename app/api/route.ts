import Groq from "groq-sdk";




const grokobj= new Groq({apiKey:process.env.GROK_API_KEY})




export async function POST(request:Request) 
{
 const {message,address}=await request.json();

 try{
   console.log("Recieved Query",message)
   console.log("Recieved Address",address)
   const response = await processwithGrok(message);
   console.log(response.choices[0].message);
   const action = await perform(response.choices[0].message.content||"",address);
   console.log("Action:",getCircularReplacer())
 }
 catch(e)
 {
   console.log("Something went Wrong",e)
 }
}


function getCircularReplacer() {
    const seen = new WeakSet();
    return (key: string, value: any) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return;
        }
        seen.add(value);
      }
      return value;
    };
  }


async function perform(task:string,address:string) 
{
    const lines = task?.split("\n");
    const taskType= lines[0].split(": ")[1];
    const params = lines?.splice(1);
    const getParam = (key: string) => {
        const param = params.find((p) =>
          p.toLowerCase().startsWith(key.toLowerCase())
        );
        return param ? param.split(":")[1].trim() : null;
    };

  const walletType = getParam("walletType") || "MY_WALLET";
  let addressToUse =
    walletType === "SPECIFIED_WALLET" ? getParam("address") : address;

  // If address is still undefined or "unspecified", use the walletAddress
  if (!addressToUse || addressToUse === "unspecified") {
    addressToUse = address;
  }

  if (!addressToUse) {
    throw new Error("Wallet address is required for this action.");
  }

  let network: "mainnet" | "testnet" | "devnet" = "mainnet";
  if (taskType.includes("TESTNET")) {
    network = "testnet";
  } else if (taskType.includes("DEVNET")) {
    network = "devnet";
  } else {
    network =
      (getParam("network") as "mainnet" | "testnet" | "devnet") || "mainnet";
  }
  
  switch(taskType)
  {
    case "GET_BALANCE":
    case "GET_TESTNET_BALANCE":
    case "GET_DEVNET_BALANCE":
        console.log(`Fetching Balance for ${addressToUse} on ${network}`);
        const amountres=await requestBalance(addressToUse,network);
        if ("error" in amountres)
        {
            return amountres.error;
        }
        return `Balance under ${amountres.network} is ${amountres.amount}KAIA`;
    
   
    case "GET_TRANSACTIONS":
    case "GENERATE_SUMMARY":
        const count = parseInt(getParam("count") || "10");
        console.log(
          `Fetching ${count} transactions for address: ${addressToUse} on ${network}`
        );
        const transactions = await getLastTransactionsData(
          addressToUse,
          count,
          network
        );
        return { transactions, network, taskType };

    case "GET_ALL_BALANCES":
        console.log(`Fetching all token balances for address: ${addressToUse}`);
        const allBalances = await getAllTokenBalances(addressToUse);
        return { balances: allBalances, actionType: "GET_ALL_BALANCES" };

    case "GET_TRANSACTION_INFO":
            const txHash = getParam("txHash");
            if (txHash) {
              console.log(
                `Fetching details for transaction: ${txHash} on ${network}`
              );
              const txInfo = await getTransactionInfo(txHash, network);
              return {
                transactionInfo: txInfo,
                actionType: "GET_TRANSACTION_INFO",
                network,
              };
            }
            return "Transaction hash is required for this action.";
      
    case "REQUEST_AIRDROP":
            const airdropAmount = parseFloat(getParam("amount") || "1");
            const airdropNetwork = getParam("network") || "devnet";
            if (airdropNetwork === "mainnet") {
              return "Airdrop is not available on mainnet. Please use devnet or testnet for testing purposes.";
            }
            if (airdropNetwork !== "devnet" && airdropNetwork !== "testnet") {
              return "Invalid network specified. Airdrop is only available on devnet or testnet.";
            }
            const maxAirdrop = airdropNetwork === "devnet" ? 2 : 1;
            if (airdropAmount > maxAirdrop) {
              return `Airdrop request rejected. The maximum allowed airdrop on ${airdropNetwork} is ${maxAirdrop} SOL. Please request ${maxAirdrop} SOL or less.`;
            }
            console.log(
              `Requesting airdrop of ${airdropAmount} SOL to ${addressToUse} on ${airdropNetwork}`
            );
            const airdropResult = await requestFaucet(
              addressToUse,
              airdropAmount,
              airdropNetwork
            );
            return airdropResult;
      
    case "SEND_TRANSACTION":
    case "SEND_TESTNET_TRANSACTION":
    case "SEND_DEVNET_TRANSACTION":
            const recipient = getParam("recipient");
            const amount = parseFloat(getParam("amount") || "0");
            if (recipient && amount) {
              console.log(
                `Sending ${amount} SOL to ${recipient} from ${addressToUse} on ${network}`
              );
              const result = await sendTransaction(
                addressToUse,
                recipient,
                amount,
                network
              );
              if (result.error) {
                return result.error;
              }
              return result;
            }
            return `Insufficient parameters for ${taskType}`;
    case "SWAP_TOKENS":
              const fromToken = getParam("fromToken");
              const toToken = getParam("toToken");
              const swapAmount = parseFloat(getParam("amount") || "0");
              if (fromToken && toToken && swapAmount) {
                console.log(
                  `Fetching swap quote for ${swapAmount} ${fromToken} to ${toToken} from ${addressToUse} on ${network}`
                );
                const result = await swapTokens(
                  addressToUse,
                  fromToken,
                  toToken,
                  swapAmount,
                  network
                );
                return {
                  ...result,
                  showSwapConfirmation: !!result.quoteData && !result.error,
                };
              }
              return {
                error: "Insufficient parameters for SWAP_TOKENS",
                actionType: "SWAP_TOKENS",
                showSwapConfirmation: false,
              };      
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

async function getAllTokenBalances(address:string) {
    
}

async function sendTransaction(address:string,recipientaddress:string,amount:number,network:"testnet"|"mainnet"|"devnet"="mainnet") {
    
}

async function getTransactionInfo(address:string,network:"testnet"|"mainnet"|"devnet"="mainnet") {
    
}

async function swap(address:string,
    fromToken:,
    toToken:,
    swapAmount:number,
    network:"testnet"|"mainnet"|"devnet"="mainnet") {
    
}

async function getCryptoPrice(symbol:string) {
    
}

async function getLastTransactionsData(address:string,
    count:number,
    network:"testnet"|"mainnet"|"devnet"="mainnet") {
    
        
}




async function requestBalance(
address:string,
network:"mainnet"|"devnet"|"testnet" = "mainnet"
)
{
    //use caver.rpc.klay.getBalance  just figure something out either devnet , mainnet , testnet
}


async function requestFaucet(address:string,
    amount:number,
    network:"devnet"|"testnet"
) 
{
  //fetch data here 
  https://api-homepage.kaia.io/faucet/run?address=0x0670db6F3dC6dAb67956e358Bb2f48EeeB606B0D    
}





async function processwithGrok(messager:string) 
{
    return grokobj.chat.completions.create({
        //
        // Required parameters
        //
        messages: [
          // Set an optional system message. This sets the behavior of the
          // assistant and can be used to provide specific instructions for
          // how it should behave throughout the conversation.
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

                      User request: "Airdrop me 0.5 sol on my testnet"
                      classification: REQUEST_AIRDROP
                      walletType: MY_WALLET
                      amount:0.5
                      network: testnet

                      User request: "Send 2 SOL to address Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
                      Classification: SEND_TRANSACTION
                      walletType: MY_WALLET
                      recipient:Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr
                      amount:2

                      User request: "What's my account balance?"
                      Classification: GET_BALANCE
                      walletType: MY_WALLET

                      User request: "Swap 1 SOL for USDC from my wallet"
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

                      User request: "Show me all token balances in my wallet"
                      Classification: GET_ALL_BALANCES
                      walletType: MY_WALLET

                      User request: "tell me about the transaction with hash ywCMhvfUSuBngxKxd1Dz3v8uqW7aooxwV1TNdAjmy7mPutXR6ri5ky8BQp1bmu95LdoKdp3yDpph9oojKD6Fhyq on devnet"
                      Classification: GET_TRANSACTION_INFO 
                      txHash: ywCMhvfUSuBngxKxd1Dz3v8uqW7aooxwV1TNdAjmy7mPutXR6ri5ky8BQp1bmu95LdoKdp3yDpph9oojKD6Fhyq
                      network: devnet

                      Now, interpret this user request:`,
          },
          // Set a user message for the assistant to respond to.
          {
            role: "user",
            content:messager,
          },
        ],
    
        // The language model which will generate the completion.
        model: "llama3-8b-8192",
    
        //
        // Optional parameters
        //
    
        // Controls randomness: lowering results in less random completions.
        // As the temperature approaches zero, the model will become deterministic
        // and repetitive.
        temperature: 0.5,
    
        // The maximum number of tokens to generate. Requests can use up to
        // 2048 tokens shared between prompt and completion.
        max_tokens: 1024,
    
        // Controls diversity via nucleus sampling: 0.5 means half of all
        // likelihood-weighted options are considered.
        top_p: 1,
    
        // A stop sequence is a predefined or user-specified text string that
        // signals an AI to stop generating content, ensuring its responses
        // remain focused and concise. Examples include punctuation marks and
        // markers like "[end]".
        stop: null,
    
        // If set, partial message deltas will be sent.
        stream: false,
      });
}