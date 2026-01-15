import { ethers } from "ethers";
import { useState } from "react";
import abi from "./abi.json";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const CONTRACT_ADDRESS = "0xYourContractAddress";

function App() {
  const [account, setAccount] = useState<string>("");

  const connectWallet = async (): Promise<void> => {
    if (!window.ethereum) return alert("Install MetaMask");

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    setAccount(await signer.getAddress());
  };

  const fundLoan = async (): Promise<void> => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      abi,
      signer
    );

    await contract.fundLoan({
      value: ethers.parseEther("0.05"),
    });
  };

  return (
    <>
      <h2>Student Micro-Lending Platform</h2>
      <button onClick={connectWallet}>Connect Wallet</button>
      <p>{account}</p>
      <button onClick={fundLoan}>Fund Loan</button>
    </>
  );
}

export default App;
