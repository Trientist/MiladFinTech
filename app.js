// Replace these with your deployed contract addresses
const TOKEN_ADDRESS = "0x511442E74A1B6AB59f10866F8A3fDb84283D16b7";
const SWAP_ADDRESS = "0xYourSwapContractAddressHere";

// 0.001 SepETH per token
const PRICE_PER_TOKEN_ETH = "0.001";

const tokenAbi = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

const swapAbi = [
  "function buyTokens() payable",
  "function redeem(uint256 tokenAmount)"
];

let provider;
let signer;
let userAddress;
let tokenContract;
let swapContract;

const connectBtn = document.getElementById("connectBtn");
const buyBtn = document.getElementById("buyBtn");
const redeemBtn = document.getElementById("redeemBtn");

connectBtn.onclick = connectWallet;
buyBtn.onclick = buyTokens;
redeemBtn.onclick = redeemTokens;

async function connectWallet() {
  if (!window.ethereum) {
    setStatus("MetaMask not found.");
    return;
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  userAddress = await signer.getAddress();

  tokenContract = new ethers.Contract(TOKEN_ADDRESS, tokenAbi, signer);
  swapContract = new ethers.Contract(SWAP_ADDRESS, swapAbi, signer);

  document.getElementById("wallet").innerText = "Connected: " + userAddress;

  await updateBalance();
  setStatus("Wallet connected.");
}

async function updateBalance() {
  const balance = await tokenContract.balanceOf(userAddress);

  document.getElementById("tokenBalance").innerText =
    "Token balance: " + balance.toString();

  if (balance >= 50n) {
    document.getElementById("holderContent").classList.remove("hidden");
  } else {
    document.getElementById("holderContent").classList.add("hidden");
  }
}

async function buyTokens() {
  try {
    const amount = document.getElementById("buyAmount").value;

    if (!amount || amount <= 0) {
      setStatus("Enter a token amount.");
      return;
    }

    const ethCost = Number(amount) * Number(PRICE_PER_TOKEN_ETH);
    const value = ethers.parseEther(ethCost.toString());

    setStatus("Transaction pending...");
    const tx = await swapContract.buyTokens({ value });
    await tx.wait();

    await updateBalance();
    setStatus("Tokens bought.");
  } catch (err) {
    console.error(err);
    setStatus("Transaction failed.");
  }
}

async function redeemTokens() {
  try {
    const amount = document.getElementById("redeemAmount").value;

    if (!amount || amount <= 0) {
      setStatus("Enter a token amount.");
      return;
    }

    const tokenAmount = BigInt(amount);

    setStatus("Approving tokens...");
    const approveTx = await tokenContract.approve(SWAP_ADDRESS, tokenAmount);
    await approveTx.wait();

    setStatus("Redeeming tokens...");
    const redeemTx = await swapContract.redeem(tokenAmount);
    await redeemTx.wait();

    await updateBalance();
    setStatus("Tokens redeemed.");
  } catch (err) {
    console.error(err);
    setStatus("Transaction failed.");
  }
}

function setStatus(message) {
  document.getElementById("status").innerText = message;
}
