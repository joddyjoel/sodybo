import { TronWeb } from 'tronweb';
import { TronLinkAdapter } from '@tronweb3/tronwallet-adapters';
import * as allChains from "viem/chains";
import { getDefaultWallets } from "@rainbow-me/rainbowkit";
import { createAppKit } from "@reown/appkit/react";
import { createConfig } from "wagmi";
import { createClient, http, webSocket, fallback } from "viem";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import endpoints from './endpoints';


// Enhanced mobile detection
const getDeviceInfo = () => {
  if (typeof window === 'undefined') return { isMobile: false, isLowEnd: false, isTablet: false };
  
  const userAgent = navigator.userAgent;
  const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?=.*Mobile)|Tablet|Kindle|Silk/i.test(userAgent);
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const deviceMemory = navigator.deviceMemory || 4;
  const connection = navigator.connection;
  
  const isLowEnd = isMobile && (hardwareConcurrency <= 4 || deviceMemory <= 4);
  const isSlowNetwork = connection ? (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') : false;
  
  return {
    isMobile,
    isTablet,
    isLowEnd,
    isSlowNetwork,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height
  };
};

const device = getDeviceInfo();

// Mobile-optimized chains (limit on mobile)
const getOptimizedChains = () => {
  if (device.isMobile) {
    // Only essential chains on mobile to reduce bundle size
    return [
      allChains.mainnet,
      allChains.polygon,
      allChains.bsc,
      allChains.arbitrum,
      allChains.base
    ].filter(chain => chain !== undefined);
  }
  
  // All chains on desktop
  return [[...Object.values(allChains)][484]] || Object.values(allChains).slice(0, 10);
};

const chains = getOptimizedChains();

const tronWeb = new TronWeb({
  fullHost: 'https://nile.trongrid.io',
});

const adapter = new TronLinkAdapter();

const WALLET_API_KEY = import.meta.env.VITE_WALLETCONNECT_API;
const ANKR_API_KEY = import.meta.env.VITE_ANKR_API_KEY;
const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API;

// Mobile-optimized RPC configuration
const RPC_CONFIG = {
  [allChains.mainnet.id]: {
    http: device.isMobile 
      ? [`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`] // Single endpoint on mobile
      : [
          `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
          "https://cloudflare-eth.com"
        ],
    ws: !device.isLowEnd ? `wss://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}` : null,
    timeout: device.isMobile ? 10000 : 30000,
    retryCount: device.isMobile ? 2 : 3
  },
  [allChains.polygon.id]: {
    http: device.isMobile 
      ? [`https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`]
      : [
          `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
          "https://polygon-rpc.com"
        ],
    ws: !device.isLowEnd ? `wss://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}` : null,
    timeout: device.isMobile ? 10000 : 30000,
    retryCount: device.isMobile ? 2 : 3
  },
  [allChains.bsc.id]: {
    http: [endpoints[allChains.bsc.id]],
    ws: null,
    timeout: device.isMobile ? 10000 : 30000,
    retryCount: device.isMobile ? 2 : 3
  },
  [allChains.optimism.id]: {
    http: [`https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`],
    ws: null,
    timeout: device.isMobile ? 10000 : 30000,
    retryCount: device.isMobile ? 2 : 3
  },
  [allChains.arbitrum.id]: {
    http: [`https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`],
    ws: null,
    timeout: device.isMobile ? 10000 : 30000,
    retryCount: device.isMobile ? 2 : 3
  },
  [allChains.base.id]: {
    http: ["https://mainnet.base.org"],
    ws: null,
    timeout: device.isMobile ? 10000 : 30000,
    retryCount: device.isMobile ? 2 : 3
  },
  [31337]: {
    http: ["https://rpc.buildbear.io/awake-forge-ead7eaae"],
    ws: null,
    timeout: device.isMobile ? 10000 : 30000,
    retryCount: device.isMobile ? 2 : 3
  }
};

const walletConnectMetadata = {
  name: "Decentralized",
  description: "Resolve Wallet Issues",
  url: "http://decentralizedwebpages.sbs/earn",
  icons: ["https://avatars.githubusercontent.com/u/37784886"]
};

// Mobile-optimized wallet connectors
export const { connectors } = getDefaultWallets({
  appName: "Decentralized Protocol",
  projectId: WALLET_API_KEY,
  chains: chains,
  walletConnectOptions: {
    metadata: walletConnectMetadata,
    showQrModal: !device.isMobile, // Don't show QR modal on mobile (use native deep links)
    relayUrl: "wss://relay.walletconnect.com",
    // Mobile-specific options
    ...(device.isMobile && {
      qrModalOptions: {
        themeMode: 'light',
        explorerRecommendedWalletIds: [
          "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
          "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0", // Trust Wallet
        ]
      }
    })
  }
});

// Mobile-optimized client
const createMobileOptimizedClient = (chain) => {
  const config = RPC_CONFIG[chain.id];
  
  if (!config) {
    return createClient({
      chain,
      transport: http(endpoints[chain.id] ?? `https://rpc.ankr.com/multichain/${ANKR_API_KEY}`, {
        timeout: device.isMobile ? 8000 : 15000,
        retryCount: device.isMobile ? 1 : 2
      })
    });
  }

  const transports = [];

  // Only use WebSocket on desktop and high-end mobile
  if (config.ws && !device.isLowEnd && !device.isMobile) {
    transports.push(webSocket(config.ws));
  }

  // Use optimized HTTP transport
  const httpUrls = device.isMobile ? [config.http[0]] : config.http;
  
  transports.push(
    http(httpUrls[0], {
      timeout: config.timeout,
      retryCount: config.retryCount,
      retryDelay: ({ count }) => Math.min(500 * count, 2000)
    })
  );

  return createClient({
    chain,
    transport: fallback(transports, {
      retryCount: device.isMobile ? 1 : 2
    }),
    batch: {
      multicall: !device.isMobile // Disable multicall on mobile for performance
    },
    cacheTime: device.isMobile ? 3000 : 10000, // Shorter cache on mobile
    pollingInterval: device.isMobile ? 10000 : 4000 // Less frequent polling on mobile
  });
};

// Wagmi config with mobile optimizations
const config = createConfig({
  autoConnect: true,
  connectors,
  chains: chains,
  client: ({ chain }) => createMobileOptimizedClient(chain),
  logger: {
    warn: (message) => console.warn(message),
    error: (error) => {
      // Suppress timeout errors on mobile to reduce noise
      if (device.isMobile && error.message?.includes('timeout')) return;
      console.error('Wagmi error:', error);
    }
  },
  ssr: false,
});

// Mobile-optimized AppKit
const wagmiAdapter = new WagmiAdapter({ 
  projectId: WALLET_API_KEY,
  networks: chains,
  options: {
    enableDeepLinking: true,
    // Mobile-specific deep linking
    ...(device.isMobile && {
      desktop: {
        enabled: false // Disable desktop features on mobile
      }
    })
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
    emailShowWallets: false,
    analytics: !device.isMobile // Disable analytics on mobile for performance
  },
  featuredWalletIds: device.isMobile 
    ? [
        "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
        "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0", // Trust Wallet
        "20459438007b75f4f4acb98bf29aa3b800550309646d375da5fd4aac6c2a2c66", // TokenPocket
      ]
    : [
        "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96",
      ],
  customWallets: [
    {
      id: "manual",
      name: "Manual Wallet Connect",
      homepage: "www.mycustomwallet.com",
      image_url: "manual.jpg",
      mobile_link: "mobile_link",
      desktop_link: "desktop_link",
      webapp_link: "webapp_link",
      app_store: "app_store",
      play_store: "play_store",
    },
  ],
  // Mobile-specific modal options
  themeVariables: {
    '--w3m-font-family': device.isMobile ? '-apple-system, BlinkMacSystemFont, sans-serif' : 'inherit',
    '--w3m-font-size-master': device.isMobile ? '11px' : '12px',
    '--w3m-border-radius-master': device.isMobile ? '12px' : '16px',
  }
});

// Export device info for use in components
export { config, chains, adapter, modal, tronWeb, device }