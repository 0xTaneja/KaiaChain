import coinbaseWalletModule from "@web3-onboard/coinbase";
import walletConnectModule from "@web3-onboard/walletconnect";
import injectedModule from "@web3-onboard/injected-wallets";
import { ethers } from "ethers";
import Onboard from "@web3-onboard/core";
const coinbaseWalletSdk = coinbaseWalletModule();
const walletConnect = walletConnectModule();
const injected = injectedModule();

const modules = [coinbaseWalletSdk, walletConnect, injected];
const KAIA_MAINNET_URL = `https://public-en.node.kaia.io`
const KAIROS_TESTNET_URL = `https://public-en-kairos.node.kaia.io`

const onboard = Onboard({
  wallets: modules, // created in previous step
  chains: [
    {
      id: "0x2019", // chain ID must be in hexadecimal
      token: "KAIA",
      namespace: "evm",
      label: "Kaia Mainnet",
      rpcUrl: KAIA_MAINNET_URL
    },
    {
      id: "0x3e9", // chain ID must be in hexadecimel
      token: "KAIA",
      namespace: "evm",
      label: "Kairos Testnet",
      rpcUrl: KAIROS_TESTNET_URL
    },
   // you can add as much supported chains as possible
  ],
  appMetadata: {
    name: "Kaia-web3-onboard-App", // change to your dApp name
    icon: "https://pbs.twimg.com/profile_images/1620693002149851137/GbBC5ZjI_400x400.jpg", // paste your icon 
    logo: "https://pbs.twimg.com/profile_images/1620693002149851137/GbBC5ZjI_400x400.jpg", // paste your logo
    description: "Web3Onboard-Kaia",
    recommendedInjectedWallets: [
      { name: "Coinbase", url: "https://wallet.coinbase.com/" },
      { name: "MetaMask", url: "https://metamask.io" }
    ]
  }
});