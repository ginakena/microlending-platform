export const STUDENT_LENDING_ADDRESS = "0xYourDeployedAddressHere"; // update after Sepolia deploy

export const STUDENT_LENDING_ABI = [
  // Only the parts you need (copy from artifacts or Etherscan)
  {
    inputs: [],
    name: "totalDeposited",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "verifiedStudents",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  // Add more as needed: borrow, deposit, repay, getLoanDetails...
] as const;
