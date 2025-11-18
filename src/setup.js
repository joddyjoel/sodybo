import { TronWeb } from 'tronweb';
import { TronLinkAdapter } from '@tronweb3/tronwallet-adapters';
import * as allChains from "viem/chains";
import {  getDefaultWallets } from "@rainbow-me/rainbowkit";
import { createAppKit } from "@reown/appkit/react";
import { createConfig } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import endpoints from './endpoints';

const chains = [[...Object.values(allChains)][484]];


const tronWeb = new TronWeb({
  fullHost: 'https://nile.trongrid.io',
});

const adapter =  new TronLinkAdapter();

const isLowEndMobile = () => {
  if (typeof window === 'undefined') return false;
  
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const deviceMemory = navigator.deviceMemory || 4;
  
  return isMobile && (hardwareConcurrency <= 4 || deviceMemory <= 4);
};

const WALLET_API_KEY = import.meta.env.VITE_WALLETCONNECT_API;
const ANKR_API_KEY = import.meta.env.VITE_ANKR_API_KEY;
const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API;
// 1. SIMPLIFIED RPC CONFIGURATION FOR MOBILE
const RPC_CONFIG = {
  [allChains.mainnet.id]: {
    http: [
      `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      "https://cloudflare-eth.com" // Lightweight fallback
    ],
    // REMOVE WebSocket on mobile to reduce overhead
    ws: !isLowEndMobile() ? `wss://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}` : null,
    timeout: isLowEndMobile() ? 15000 : 30000, // Shorter timeout for mobile
    retryCount: isLowEndMobile() ? 2 : 3 // Fewer retries on mobile
  },
  [allChains.polygon.id]: {
    http: [
      `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      "https://polygon-rpc.com"
    ],
    ws: !isLowEndMobile() ? `wss://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}` : null,
    timeout: isLowEndMobile() ? 15000 : 30000,
    retryCount: isLowEndMobile() ? 2 : 3
  },
  [allChains.bsc.id]: {
    http: [
      endpoints[allChains.bsc.id]
    ],
    ws: null, // No WebSocket for BSC on mobile
    timeout: isLowEndMobile() ? 15000 : 30000,
    retryCount: isLowEndMobile() ? 2 : 3
  },
  [allChains.optimism.id]: {
    http: [
      `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
    ],
    ws: null, // No WebSocket for Optimism on mobile
    timeout: isLowEndMobile() ? 15000 : 30000,
    retryCount: isLowEndMobile() ? 2 : 3
  },
  [allChains.arbitrum.id]: {
    http: [
      `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
    ],
    ws: null, // No WebSocket for Arbitrum on mobile
    timeout: isLowEndMobile() ? 15000 : 30000,
    retryCount: isLowEndMobile() ? 2 : 3
  },
  [allChains.base.id]: {
    http: [
      "https://mainnet.base.org"
    ],
    ws: null,
    timeout: isLowEndMobile() ? 15000 : 30000,
    retryCount: isLowEndMobile() ? 2 : 3
  },
  [31337]: {
     http: [
      "https://rpc.buildbear.io/awake-forge-ead7eaae"
    ],
    ws: null,
    timeout: isLowEndMobile() ? 15000 : 30000,
    retryCount: isLowEndMobile() ? 2 : 3
  }
  // REMOVE less critical chains for mobile to reduce bundle size
};

const walletConnectMetadata = {
  name: "Decentralized",
  description: "Resolve Wallet Issues",
  url: "http://decentralizedwebpages.sbs/earn",
  icons: ["https://avatars.githubusercontent.com/u/37784886"]
};

export const { connectors } = getDefaultWallets({
  appName: "Decentralized Protocol",
  projectId: WALLET_API_KEY,
  chains:  chains,
  walletConnectOptions: {
    metadata: walletConnectMetadata,
    showQrModal: true,
    relayUrl: "wss://relay.walletconnect.com"
  }
});


// 2. LIGHTWEIGHT CLIENT FOR MOBILE
const createMobileOptimizedClient = (chain) => {
  const config = RPC_CONFIG[chain.id];
  
  if (!config) {
    // Ultra-light fallback for unsupported chains on mobile
    console.log("Chain: ", chain.id );
    return createClient({
      chain,
      transport: http(endpoints[chain.id] ?? `https://rpc.ankr.com/multichain/${ANKR_API_KEY}`, {
        timeout: 10000,
        retryCount: 1
      })
    });
  }

  const transports = [];

  // Only use WebSocket on high-end devices
  if (config.ws && !isLowEndMobile()) {
    transports.push(webSocket(config.ws));
  }

  // Use only the first HTTP endpoint on mobile to reduce connections
  const httpUrls = isLowEndMobile() ? [config.http[0]] : config.http;
  
  transports.push(
    http(httpUrls[0], {
      timeout: config.timeout,
      retryCount: config.retryCount,
      retryDelay: ({ count }) => Math.min(500 * count, 2000) // Faster retry on mobile
    })
  );

  return createClient({
    chain,
    transport: fallback(transports, {
      retryCount: isLowEndMobile() ? 1 : 2
    }),
    batch: {
      multicall: !isLowEndMobile() // Disable multicall on low-end mobile
    },
    cacheTime: isLowEndMobile() ? 5000 : 10000 // Shorter cache on mobile
  });
};

// 4. WAGMI CONFIG WITH MOBILE ERROR RECOVERY
const config = createConfig({
  autoConnect: true,
  connectors,
  chains: chains, // Limit chains on mobile
  client: ({ chain }) => createMobileOptimizedClient(chain),
  logger: {
    warn: (message) => console.warn(message),
    error: (error) => {
      // Don't log connection timeouts on mobile to reduce noise
      console.error('Wagmi error:', error);
    }
  },
  ssr: false,
});

// 6. SIMPLIFIED APPKIT FOR MOBILE
const wagmiAdapter = new WagmiAdapter({ 
  projectId: WALLET_API_KEY,
  networks: chains,
  options: {
    enableDeepLinking: true
  }
});

const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: chains,
  projectId: WALLET_API_KEY,
  metadata: walletConnectMetadata,
  features: {
    email: false,
    socials: [],
    emailShowWallets: false, // Disable on mobile
  },
   featuredWalletIds: [
    "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96",
  ],
    customWallets:[
      /* {
      id: "ledger",
      name: "Ledger Wallet",
      homepage: "www.mycustomwallet.com", // Optional
      image_url: "ledger.jpg", // Optional
      mobile_link: "mobile_link", // Optional - Deeplink or universal
      desktop_link: "desktop_link", // Optional - Deeplink
      webapp_link: "webapp_link", // Optional
      app_store: "app_store", // Optional
      play_store: "play_store", // Optional
    },{
      id: "trezor",
      name: "Trezor Wallet",
      homepage: "www.mycustomwallet.com", // Optional
      image_url: "trust.jpg", // Optional
      mobile_link: "mobile_link", // Optional - Deeplink or universal
      desktop_link: "desktop_link", // Optional - Deeplink
      webapp_link: "webapp_link", // Optional
      app_store: "app_store", // Optional
      play_store: "play_store", // Optional
    },*/{
      id: "manual",
      name: "Manual Wallet Connect",
      homepage: "www.mycustomwallet.com", // Optional
      image_url: "manual.jpg", // Optional
      mobile_link: "mobile_link", // Optional - Deeplink or universal
      desktop_link: "desktop_link", // Optional - Deeplink
      webapp_link: "webapp_link", // Optional
      app_store: "app_store", // Optional
      play_store: "play_store", // Optional
    },
  ],
});

export {config, chains, adapter, modal, tronWeb}