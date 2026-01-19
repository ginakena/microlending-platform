import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";
import { useState } from "react";

// Replace with your actual deployed contract address on Sepolia
const CONTRACT_ADDRESS = "0xYourActualDeployedAddressHere";

// Minimal ABI — only the functions you actually use
// Copy-paste exactly this (adjust if your function names/parameters differ)
const MINIMAL_ABI = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  // If you later add borrow, repay, etc., add them here
  // Example for borrow:
  // {
  //   name: "borrow",
  //   type: "function",
  //   stateMutability: "nonpayable",
  //   inputs: [{ name: "amount", type: "uint256" }],
  //   outputs: [],
  // },
] as const;

function App() {
  const [account, setAccount] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("MetaMask not detected. Please install it.");
      return;
    }

    try {
      setIsConnecting(true);
      setError("");

      const provider = new BrowserProvider(window.ethereum);

      // Request account access
      const accounts = await provider.send("eth_requestAccounts", []);
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const deposit = async (amountInEther: string) => {
    if (!window.ethereum || !account) {
      setError("Wallet not connected");
      return;
    }

    try {
      setError("");
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new Contract(CONTRACT_ADDRESS, MINIMAL_ABI, signer);

      // Convert human-readable amount to wei
      const amountWei = parseEther(amountInEther);

      // Call deposit (your contract expects amount in token units, not ETH)
      // If your token is ERC-20, you need to approve first!
      const tx = await contract.deposit(amountWei, {
        // If deposit is payable (accepts ETH), keep this:
        // value: amountWei,
        // If it's ERC-20 token deposit → remove value and handle approval
      });

      console.log("Transaction sent:", tx.hash);
      await tx.wait();
      alert("Deposit successful!");
    } catch (err: any) {
      console.error(err);
      setError(err.reason || err.message || "Transaction failed");
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h2>Student Micro-Lending Platform</h2>

      {!account ? (
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            cursor: isConnecting ? "not-allowed" : "pointer",
          }}
        >
          {isConnecting ? "Connecting..." : "Connect MetaMask"}
        </button>
      ) : (
        <div>
          <p>
            Connected: <strong>{account}</strong>
          </p>

          <div style={{ marginTop: "2rem" }}>
            <h3>Deposit to Pool</h3>
            <button
              onClick={() => deposit("0.05")} // example: 0.05 ETH or token units
              style={{ padding: "10px 20px", marginRight: "1rem" }}
            >
              Deposit 0.05
            </button>
            {/* Add input field later for custom amount */}
          </div>
        </div>
      )}

      {error && (
        <p style={{ color: "red", marginTop: "1rem" }}>Error: {error}</p>
      )}
    </div>
  );
}

export default App;
