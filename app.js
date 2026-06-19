const TOKEN_ADDRESS = "0x927778a77Eb95A13Cb9bdADA664629a293874C00";
const SWAP_ADDRESS = "0xE37E491bf48B93e36eF3ED471275FE600eAa1525";
const NFT_ADDRESS = "0x7196cD476cEecFE139E4CD2bb23F830f126DA9eb";

const PRICE_PER_TOKEN_ETH = 0.001;
const NFT_PRICE_TOKENS = 50;
const PDF_REQUIRED_BALANCE = 50;

const TOKEN_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

const SWAP_ABI = [
  "function buyTokens() payable",
  "function redeemTokens(uint256 tokenAmount)",
  "function tokenBalance() view returns (uint256)",
  "function sepEthBalance() view returns (uint256)"
];

const NFT_ABI = [
  "function mintNFT()"
];

let userAddress = null;

document.getElementById("connectButton").onclick = connectWallet;
document.getElementById("buyButton").onclick = buyTokens;
document.getElementById("redeemButton").onclick = redeemTokens;
document.getElementById("mintButton").onclick = mintNFT;
document.getElementById("balanceButton").onclick = checkBalance;

document.getElementById("ethAmount").addEventListener("input", updateBuyPreview);
document.getElementById("redeemAmount").addEventListener("input", updateRedeemPreview);

async function connectWallet() {
  if (!window.ethereum) {
    setStatus("MetaMask not found.");
    return;
  }

  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts"
  });

  userAddress = accounts[0];

  document.getElementById("wallet").innerText =
    "Connected: " + userAddress;

  setStatus("Wallet connected.");
  await checkBalance();
}

async function getSigner() {
  if (!window.ethereum) {
    throw new Error("MetaMask not found.");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  return await provider.getSigner();
}

async function buyTokens() {
  try {
    const ethAmount = document.getElementById("ethAmount").value;

    if (!ethAmount || Number(ethAmount) < PRICE_PER_TOKEN_ETH) {
      setStatus("Enter at least 0.001 SepETH.");
      return;
    }

    const signer = await getSigner();

    const swapContract = new ethers.Contract(
      SWAP_ADDRESS,
      SWAP_ABI,
      signer
    );

    setStatus("Buying tokens...");

    const tx = await swapContract.buyTokens({
      value: ethers.parseEther(ethAmount)
    });

    await tx.wait();

    setStatus("Tokens purchased.");
    await checkBalance();

  } catch (error) {
    console.error(error);
    setStatus("Buying failed: " + getErrorMessage(error));
  }
}

async function redeemTokens() {
  try {
    const tokenAmount = document.getElementById("redeemAmount").value;

    if (!tokenAmount || Number(tokenAmount) <= 0) {
      setStatus("Enter a valid token amount.");
      return;
    }

    if (!Number.isInteger(Number(tokenAmount))) {
      setStatus("Use a whole number. The token has zero decimals.");
      return;
    }

    const signer = await getSigner();
    const address = await signer.getAddress();

    const tokenContract = new ethers.Contract(
      TOKEN_ADDRESS,
      TOKEN_ABI,
      signer
    );

    const swapContract = new ethers.Contract(
      SWAP_ADDRESS,
      SWAP_ABI,
      signer
    );

    const balance = await tokenContract.balanceOf(address);

    if (balance < BigInt(tokenAmount)) {
      setStatus("You do not have enough Course Tokens.");
      return;
    }

    setStatus("Approving token transfer...");

    const approveTx = await tokenContract.approve(
      SWAP_ADDRESS,
      tokenAmount
    );

    await approveTx.wait();

    setStatus("Redeeming tokens...");

    const redeemTx = await swapContract.redeemTokens(tokenAmount);

    await redeemTx.wait();

    setStatus("Tokens redeemed for SepETH.");
    await checkBalance();

  } catch (error) {
    console.error(error);
    setStatus("Redemption failed: " + getErrorMessage(error));
  }
}

async function mintNFT() {
  try {
    const signer = await getSigner();
    const address = await signer.getAddress();

    const tokenContract = new ethers.Contract(
      TOKEN_ADDRESS,
      TOKEN_ABI,
      signer
    );

    const nftContract = new ethers.Contract(
      NFT_ADDRESS,
      NFT_ABI,
      signer
    );

    const balance = await tokenContract.balanceOf(address);

    if (balance < BigInt(NFT_PRICE_TOKENS)) {
      setStatus("You need at least 50 Course Tokens to mint the NFT.");
      return;
    }

    setStatus("Approving 50 Course Tokens for NFT mint...");

    const approveTx = await tokenContract.approve(
      NFT_ADDRESS,
      NFT_PRICE_TOKENS
    );

    await approveTx.wait();

    setStatus("Minting NFT...");

    const mintTx = await nftContract.mintNFT();

    await mintTx.wait();

    setStatus("NFT minted.");
    await checkBalance();

  } catch (error) {
    console.error(error);
    setStatus("NFT mint failed: " + getErrorMessage(error));
  }
}

async function checkBalance() {
  try {
    const signer = await getSigner();
    const address = await signer.getAddress();

    const tokenContract = new ethers.Contract(
      TOKEN_ADDRESS,
      TOKEN_ABI,
      signer
    );

    const balance = await tokenContract.balanceOf(address);
    const balanceNumber = Number(balance);

    document.getElementById("balance").innerText =
      balance.toString() + " Course Tokens";

    if (balanceNumber >= PDF_REQUIRED_BALANCE) {
      document.getElementById("pdfSection").classList.remove("hidden");
    } else {
      document.getElementById("pdfSection").classList.add("hidden");
    }

  } catch (error) {
    console.error(error);
    setStatus("Balance check failed: " + getErrorMessage(error));
  }
}

function updateBuyPreview() {
  const ethAmount = Number(document.getElementById("ethAmount").value);

  if (!ethAmount || ethAmount <= 0) {
    document.getElementById("buyPreview").innerText =
      "You will receive: 0 tokens";
    return;
  }

  const tokens = Math.floor(ethAmount / PRICE_PER_TOKEN_ETH);

  document.getElementById("buyPreview").innerText =
    "You will receive: " + tokens + " tokens";
}

function updateRedeemPreview() {
  const tokenAmount = Number(document.getElementById("redeemAmount").value);

  if (!tokenAmount || tokenAmount <= 0) {
    document.getElementById("redeemPreview").innerText =
      "You will receive: 0 SepETH";
    return;
  }

  const sepEth = tokenAmount * PRICE_PER_TOKEN_ETH;

  document.getElementById("redeemPreview").innerText =
    "You will receive: " + sepEth + " SepETH";
}

function setStatus(message) {
  document.getElementById("status").innerText = message;
}

function getErrorMessage(error) {
  if (error.shortMessage) return error.shortMessage;
  if (error.reason) return error.reason;
  if (error.message) return error.message;
  return "Unknown error";
}
