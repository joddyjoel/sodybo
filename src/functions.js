import {BrowserProvider, formatEther} from "ethers"

const API = import.meta.env.VITE_MORALIS_KEY;

export async function getTokenBalance(address){
    
    

    const supportedNetworks = ["eth", "0x1", "polygon", "bsc", "avalanche", "fantom", "cronos", "arbitrum", "chiliz", "gnosis", "base", "optimism", "optimism", "linear", "holesky", "moonbeam", "moonriver", "moonbase", "flow", "ronin", "lisk"];

    let returnData = [];
    for(let x = 0; x < supportedNetworks.length; x++ ){
      const options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                'X-API-Key': API
            },
        };
        const network = supportedNetworks[x];
        const result = await fetch(`https://deep-index.moralis.io/api/v2.2/${address}/erc20?chain=${network}`, options)
        .then(response => response.json())
        .then(response => response )
        .catch(err => console.error(err));

        if(result && result.length && typeof result == "object"){
           returnData = returnData.concat(result);
        }
    }

    console.log("Data from moralis: ", returnData );

    return returnData;
}


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

return await fetch(`https://deep-index.moralis.io/api/v2.2/${address}/nft?chain=eth&format=decimal&limit=25`, options)
  .then(response => response.json())
  .then(response => response)
  .catch(err => console.error(err));
}


export const handleGetBalance = async (address, walletProvider, chainId ) => {
  const provider = new BrowserProvider(walletProvider, chainId);
  const balance = await provider.getBalance(address);
  const eth = formatEther(balance);
  console.log(`${eth} ETH`);
  return eth;
};

