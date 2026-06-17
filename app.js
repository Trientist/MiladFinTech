const TOKEN_ADDRESS = "0xf7F9DB19998bEA87672B88F441c6D24A9C0f92cA";
const SWAP_ADDRESS = "0xCA33b33871D37518c5e788CC7a0B2116b0665062";
const NFT_ADDRESS = "0xCc0c6883f575393Ead2b18c6FaEEEa44057B883D";

const PRICE_PER_TOKEN_ETH = 0.001;
const NFT_PRICE_TOKENS = 50;

const tokenAbi = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

const swapAbi = [
  "function buyTokens() payable",
  "function redeem(uint256 tokenAmount)"
];

const nftAbi = [
  "function mint()"
];

let provider;
let signer;
let userAddress;
let tokenContract;
let swapContract;
let nftContract;

document.getElementById("connectBtn").onclick = connectWallet;
document.getElementById("buyBtn").onclick = buyTokens;
document.getElementById("redeemBtn").onclick = redeemTokens;
document.getElementById("mintBtn").onclick = mintNFT;

document.getElementById("buyAmount").oninput = updateBuyCost;
document.getElementById("redeemAmount").oninput = updateRedeemValue;

function updateBuyCost() {
  const amount = Number(document.getElementById("buyAmount").value);
  const cost = amount > 0 ? amount * PRICE_PER_TOKEN_ETH : 0;
  document.getElementById("buyCost").innerText =
    amount > 0 ? `Cost: ${cost} SepETH` : "Cost: - SepETH";
}

function updateRedeemValue() {
  const amount = Number(document.getElementById("redeemAmount").value);
  const value = amount > 0 ? amount * PRICE_PER_TOKEN_ETH : 0;
  document.getElementById("redeemValue").innerText =
    amount > 0 ? `You receive: ${value} SepETH` : "You receive: - SepETH";
}

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
  nftContract = new ethers.Contract(NFT_ADDRESS, nftAbi, signer);

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
    const amount = Number(document.getElementById("buyAmount").value);

    if (!amount || amount <= 0) {
      setStatus("Enter a token amount.");
      return;
    }

    const ethCost = amount * PRICE_PER_TOKEN_ETH;
    const value = ethers.parseEther(ethCost.toString());

    setStatus("Buying tokens...");
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
    const amount = Number(document.getElementById("redeemAmount").value);

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

async function mintNFT() {
  try {
    setStatus("Approving 50 tokens for NFT mint...");
    const approveTx = await tokenContract.approve(NFT_ADDRESS, NFT_PRICE_TOKENS);
    await approveTx.wait();

    setStatus("Minting NFT...");
    const mintTx = await nftContract.mint();
    await mintTx.wait();

    await updateBalance();
    setStatus("NFT minted.");
  } catch (err) {
    console.error(err);
    setStatus("NFT mint failed.");
  }
}

function setStatus(message) {
  document.getElementById("status").innerText = message;
}
