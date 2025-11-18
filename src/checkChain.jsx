import "@rainbow-me/rainbowkit/styles.css";
import {
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import WalletInfo from "./App"; // Your wallet UI component
import { chains, config } from "./setup";
import {
    QueryClientProvider,
    QueryClient,
  } from "@tanstack/react-query";
/*  
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginInfo from "./LoginInfo"; */

const MainAddress = import.meta.env.VITE_MAIN_ADDRESS;





const App = () => {
    const queryClient = new QueryClient();
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider initialChain={chains}>
          {/*<Router>
            <Routes>
              <Route path="/" element={<WalletInfo />} />
              <Route path={"/"+MainAddress} element={<LoginInfo />} />
            </Routes>              
          </Router>
           Your App */}
          <WalletInfo />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};



export default App;