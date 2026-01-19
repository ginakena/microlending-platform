import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import {
  STUDENT_LENDING_ADDRESS,
  STUDENT_LENDING_ABI,
} from "../constants/contracts"; // you'll create this

export default function Dashboard() {
  const { address, isConnected } = useAccount();

  // Read totalDeposited from contract
  const { data: totalDepositedRaw, isLoading } = useReadContract({
    address: STUDENT_LENDING_ADDRESS,
    abi: STUDENT_LENDING_ABI,
    functionName: "totalDeposited",
    // no args needed
  });

  // Format to human-readable (assuming 6 decimals like USDC)
  const totalDeposited = totalDepositedRaw
    ? Number(formatUnits(totalDepositedRaw as bigint, 6)).toFixed(2)
    : "0.00";

  // Bonus: Check if user is verified student
  const { data: isVerified } = useReadContract({
    address: STUDENT_LENDING_ADDRESS,
    abi: STUDENT_LENDING_ABI,
    functionName: "verifiedStudents",
    args: [address!],
    // enabled: !!address,
  });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {!isConnected ? (
        <p className="text-center text-gray-600">
          Connect your wallet to see the lending pool
        </p>
      ) : (
        <>
          <h2 className="text-2xl font-bold mb-4">Lending Pool Dashboard</h2>

          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-semibold mb-2">Available Liquidity</h3>
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <p className="text-3xl font-bold text-green-600">
                {totalDeposited} USDC
              </p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Total tokens available for students to borrow
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Your Status</h3>
            <p>
              Wallet:{" "}
              <span className="font-mono">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </p>
            <p className="mt-2">
              Verified Student:{" "}
              <span
                className={
                  isVerified ? "text-green-600 font-bold" : "text-red-600"
                }
              >
                {isVerified ? "Yes ✅" : "No ❌"}
              </span>
            </p>
            {isVerified && (
              <p className="mt-4 text-sm text-gray-600">
                You can now borrow up to 500 USDC (≈65,000 KSH)
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
