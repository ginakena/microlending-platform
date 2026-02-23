import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  LinearProgress,
  Avatar,
  Skeleton,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import WarningIcon from "@mui/icons-material/Warning";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { useState, useEffect } from "react";
import { maxUint256 } from "viem";
import { sepolia } from "wagmi/chains";

const GridItem = Grid as React.ElementType;

// Your real deployed contract address
const CONTRACT_ADDRESS =
  "0x6A2c4F0A5faAe8594aa127861A14ebCd441906Cd" as `0x${string}`;

// Your deployed ERC-20 token address
const TOKEN_ADDRESS =
  "0x91E4eBe667fac488efE1eEd352314f127794835D" as `0x${string}`;

// Token decimals (6 like USDC)
const DECIMALS = 6;
// Max loan amount in USD
const MAX_LOAN_DISPLAY = 500;

// ABI for StudentLending contract
const ABI = [
  {
    name: "totalDeposited",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "verifiedStudents",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "getLoanDetails",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "borrower", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "principal", type: "uint256" },
          { name: "startTime", type: "uint256" },
          { name: "repayAmount", type: "uint256" },
          { name: "active", type: "bool" },
          { name: "repaid", type: "bool" },
        ],
      },
    ],
  },
  {
    name: "isOverdue",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "borrower", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    name: "borrow",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    name: "repay",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
] as const;

// ERC20 ABI (for allowance, approve, balanceOf)
const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export default function Dashboard() {
  const theme = useTheme();
  const { address, isConnected, chain } = useAccount();

  // Dialogs
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [borrowOpen, setBorrowOpen] = useState(false);
  const [borrowAmount, setBorrowAmount] = useState("");

  // Toast
  const [toast, setToast] = useState<{
    open: boolean;
    msg: string;
    severity: "success" | "error";
  }>({
    open: false,
    msg: "",
    severity: "success",
  });

  const showToast = (msg: string, severity: "success" | "error" = "success") =>
    setToast({ open: true, msg, severity });

  // ─── Contract READS ────────────────────────────────────────────

  // Total Deposited
  const {
    data: totalRaw,
    isLoading: isLoadingPool,
    error: poolError,
    refetch: refetchPool,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "totalDeposited",
    query: { enabled: isConnected && chain?.id === sepolia.id },
  });

  const totalFormatted =
    totalRaw !== undefined
      ? Number(formatUnits(totalRaw, DECIMALS)).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00";

  // Verification Status
  const {
    data: isVerifiedRaw,
    isLoading: isLoadingVerified,
    error: verifiedError,
    refetch: refetchVerified,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "verifiedStudents",
    args: [address!],
    query: { enabled: isConnected && !!address && chain?.id === sepolia.id },
  });

  const isVerified = isVerifiedRaw ?? false;

  // Loan Details
  const {
    data: loanData,
    isLoading: isLoadingLoan,
    error: loanError,
    refetch: refetchLoan,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "getLoanDetails",
    args: [address!],
    query: { enabled: isConnected && !!address && chain?.id === sepolia.id },
  });

  const userLoan = loanData as
    | {
        principal: bigint;
        startTime: bigint;
        repayAmount: bigint;
        active: boolean;
        repaid: boolean;
      }
    | undefined;

  const hasActiveLoan = userLoan?.active && !userLoan?.repaid;

  // Is Overdue
  const { data: isOverdue, refetch: refetchOverdue } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "isOverdue",
    args: [address!],
    query: {
      enabled:
        isConnected && !!address && chain?.id === sepolia.id && hasActiveLoan,
    },
  });

  // Token Balance
  const { data: tokenBalanceRaw, refetch: refetchBalance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: isConnected && !!address && chain?.id === sepolia.id },
  });

  const formattedBalance = tokenBalanceRaw
    ? Number(formatUnits(tokenBalanceRaw, DECIMALS)).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";

  // Allowance for deposit
  const { data: depositAllowance, refetch: refetchDepositAllowance } =
    useReadContract({
      address: TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [address!, CONTRACT_ADDRESS],
      query: {
        enabled:
          isConnected && !!address && depositOpen && chain?.id === sepolia.id,
      },
    });

  // Allowance for repay
  const { data: repayAllowance, refetch: refetchRepayAllowance } =
    useReadContract({
      address: TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [address!, CONTRACT_ADDRESS],
      query: {
        enabled:
          isConnected && !!address && hasActiveLoan && chain?.id === sepolia.id,
      },
    });

  // ─── Contract WRITES ───────────────────────────────────────────

  const {
    writeContract,
    data: txHash,
    isPending: isTxPending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const [pendingAction, setPendingAction] = useState<
    "deposit" | "borrow" | "repay" | "approve_deposit" | "approve_repay" | null
  >(null);

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  // Refetch after tx confirms
  useEffect(() => {
    if (isConfirmed) {
      refetchPool();
      refetchVerified();
      refetchLoan();
      refetchOverdue();
      refetchDepositAllowance();
      refetchRepayAllowance();
      refetchBalance();

      const msgs: Record<string, string> = {
        deposit: "Deposit confirmed!",
        borrow: "Loan disbursed!",
        repay: "Loan repaid successfully!",
        approve_deposit: "Approval confirmed! Now deposit.",
        approve_repay: "Approval confirmed! Now repay.",
      };

      showToast(msgs[pendingAction ?? "deposit"] ?? "Transaction confirmed!");

      if (!pendingAction?.startsWith("approve_")) {
        setDepositAmount("");
        setBorrowAmount("");
        setDepositOpen(false);
        setBorrowOpen(false);
      }

      setPendingAction(null);
      resetWrite();
    }
  }, [isConfirmed]);

  useEffect(() => {
    if (writeError) {
      const msg =
        (writeError as Error).message?.split("\n")[0] ?? "Transaction failed";
      showToast(msg, "error");
      setPendingAction(null);
    }
  }, [writeError]);

  // ─── Handlers ──────────────────────────────────────────────────

  const handleApproveDeposit = () => {
    setPendingAction("approve_deposit");
    writeContract({
      address: TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [CONTRACT_ADDRESS, maxUint256],
    });
  };

  const handleApproveRepay = () => {
    setPendingAction("approve_repay");
    writeContract({
      address: TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [CONTRACT_ADDRESS, maxUint256],
    });
  };

  const handleDeposit = () => {
    if (
      !depositAmount ||
      isNaN(Number(depositAmount)) ||
      Number(depositAmount) <= 0
    ) {
      showToast("Enter a valid amount", "error");
      return;
    }
    const raw = parseUnits(depositAmount, DECIMALS);

    if (!depositAllowance || depositAllowance < raw) {
      showToast("Token approval required first", "error");
      return;
    }

    setPendingAction("deposit");
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "deposit",
      args: [raw],
    });
  };

  const handleBorrow = () => {
    if (
      !borrowAmount ||
      isNaN(Number(borrowAmount)) ||
      Number(borrowAmount) <= 0
    ) {
      showToast("Enter a valid amount", "error");
      return;
    }
    if (Number(borrowAmount) > MAX_LOAN_DISPLAY) {
      showToast(`Max loan is $${MAX_LOAN_DISPLAY}`, "error");
      return;
    }
    const raw = parseUnits(borrowAmount, DECIMALS);
    setPendingAction("borrow");
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "borrow",
      args: [raw],
    });
  };

  const handleRepay = () => {
    if (!userLoan?.repayAmount) return;

    if (!repayAllowance || repayAllowance < userLoan.repayAmount) {
      showToast("Token approval required first", "error");
      return;
    }

    setPendingAction("repay");
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "repay",
    });
  };

  // ─── Derived values ────────────────────────────────────────────

  const isBusy = isTxPending || isConfirming;

  const depositAmountRaw = depositAmount
    ? parseUnits(depositAmount, DECIMALS)
    : 0n;
  const needsDepositApproval =
    !depositAllowance || depositAllowance < depositAmountRaw;

  const needsRepayApproval =
    userLoan?.repayAmount && repayAllowance
      ? repayAllowance < userLoan.repayAmount
      : true;

  // ─── Render ────────────────────────────────────────────────────

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      {/* Network Check */}
      {isConnected && chain?.id !== sepolia.id && (
        <Alert severity="warning" sx={{ mb: 4, maxWidth: 600, mx: "auto" }}>
          Please switch to Sepolia network in your wallet to see real data
        </Alert>
      )}

      {/* Hero */}
      <Box textAlign="center" mb={10}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          fontWeight="bold"
          color="primary"
        >
          Welcome to MicroLend
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Secure, low-interest loans for Kenyan students
        </Typography>

        {isLoadingVerified ? (
          <Skeleton
            variant="rounded"
            width={180}
            height={36}
            sx={{ mx: "auto", mt: 2 }}
          />
        ) : (
          <Chip
            label={isVerified ? "Verified Student" : "Not Verified"}
            color={isVerified ? "success" : "warning"}
            icon={isVerified ? <VerifiedUserIcon /> : <WarningIcon />}
            sx={{ mt: 2, fontSize: "1rem", px: 2, py: 1.5 }}
          />
        )}
      </Box>

      {/* Errors */}
      {poolError && (
        <Alert severity="error" sx={{ mb: 4 }}>
          Failed to load pool data:{" "}
          {poolError.message || "Check network/contract"}
        </Alert>
      )}

      {verifiedError && (
        <Alert severity="error" sx={{ mb: 4 }}>
          Verification check failed: {verifiedError.message}
        </Alert>
      )}

      {loanError && (
        <Alert severity="error" sx={{ mb: 4 }}>
          Failed to load loan details: {loanError.message}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* User Status */}
        <GridItem xs={12}>
          <Card sx={{ bgcolor: "background.paper", boxShadow: 6 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom color="primary">
                Your Status
              </Typography>
              <Box
                display="flex"
                flexDirection={{ xs: "column", md: "row" }}
                gap={4}
                alignItems="center"
              >
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: "primary.main",
                    fontSize: "3rem",
                  }}
                >
                  {address ? address.slice(2, 3).toUpperCase() : "?"}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="body1" color="text.secondary">
                    Wallet:{" "}
                    {isConnected
                      ? `${address?.slice(0, 6)}...${address?.slice(-4)}`
                      : "Not connected"}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" mt={1}>
                    Role: {roleDisplay[userRole]}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" mt={1}>
                    Token Balance: ${formattedBalance}
                  </Typography>
                  {!isVerified && isConnected && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      To borrow, your wallet must be verified by the platform
                      admin. Share your address with the admin:{" "}
                      <strong>{address}</strong>
                    </Alert>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </GridItem>

        {/* Pool Overview – LIVE */}
        <GridItem xs={12} md={6}>
          <Card
            sx={{ height: "100%", bgcolor: "background.paper", boxShadow: 6 }}
          >
            <CardContent>
              <Typography variant="h5" gutterBottom color="primary">
                Platform Pool
              </Typography>
              {isLoadingPool ? (
                <Box sx={{ pt: 1 }}>
                  <Skeleton variant="text" width="60%" height={60} />
                  <Skeleton variant="text" width="40%" />
                </Box>
              ) : (
                <>
                  <Typography
                    variant="h3"
                    fontWeight="bold"
                    color="text.primary"
                  >
                    ${totalFormatted}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    available for loans
                  </Typography>
                </>
              )}
              <Box mt={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Max loan per student: ${MAX_LOAN_DISPLAY}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Interest: 5% fixed • Term: 120 days + 20 day grace
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </GridItem>

        {/* Your Activity */}
        <GridItem xs={12} md={6}>
          <Card
            sx={{ height: "100%", bgcolor: "background.paper", boxShadow: 6 }}
          >
            <CardContent>
              <Typography variant="h5" gutterBottom color="primary">
                Your Activity
              </Typography>
              {activityContent()}
            </CardContent>
          </Card>
        </GridItem>

        {/* Quick Actions */}
        <GridItem xs={12}>
          <Box
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }}
            gap={3}
            justifyContent="center"
          >
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              sx={{ py: 3 }}
              onClick={() => setDepositOpen(true)}
              disabled={!isConnected || isBusy || chain?.id !== sepolia.id}
            >
              Deposit to Pool
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              fullWidth
              sx={{ py: 3 }}
              onClick={() => setBorrowOpen(true)}
              disabled={
                !isConnected ||
                !isVerified ||
                hasActiveLoan ||
                isBusy ||
                chain?.id !== sepolia.id
              }
            >
              {!isConnected
                ? "Connect Wallet to Borrow"
                : !isVerified
                  ? "Verification Required"
                  : hasActiveLoan
                    ? "Loan Already Active"
                    : "Apply for Loan"}
            </Button>
          </Box>
        </GridItem>

        {/* Trust & Safety */}
        <GridItem xs={12}>
          <Box textAlign="center" mt={6}>
            <Typography variant="body2" color="text.secondary">
              Secured by Blockchain (Sepolia Testnet) • 5% fixed interest • No
              hidden fees
            </Typography>
          </Box>
        </GridItem>
      </Grid>

      {/* Deposit Dialog */}
      <Dialog
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Deposit to Pool</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Enter the amount of lending tokens to deposit.
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Your balance: ${formattedBalance}
          </Typography>
          <TextField
            label="Amount (USD)"
            type="number"
            fullWidth
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            inputProps={{ min: 0, step: "0.01" }}
            autoFocus
          />
          {depositAmount && needsDepositApproval && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              You need to approve token spending first (one-time step).
            </Alert>
          )}
          {depositAmount && !needsDepositApproval && (
            <Alert severity="success" sx={{ mt: 2 }}>
              ✅ Token approval sufficient. Ready to deposit!
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepositOpen(false)} disabled={isBusy}>
            Cancel
          </Button>
          {needsDepositApproval && depositAmount ? (
            <Button
              variant="contained"
              color="warning"
              onClick={handleApproveDeposit}
              disabled={isBusy || !depositAmount}
            >
              {isBusy && pendingAction === "approve_deposit"
                ? isConfirming
                  ? "Confirming…"
                  : "Approving…"
                : "Approve Tokens"}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleDeposit}
              disabled={isBusy || !depositAmount}
            >
              {isBusy && pendingAction === "deposit"
                ? isConfirming
                  ? "Confirming…"
                  : "Waiting…"
                : "Deposit"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Borrow Dialog */}
      <Dialog
        open={borrowOpen}
        onClose={() => setBorrowOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Apply for Loan</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Enter the amount you want to borrow (max ${MAX_LOAN_DISPLAY}). You
            will repay{" "}
            {borrowAmount
              ? `$${(Number(borrowAmount) * 1.05).toFixed(2)}`
              : "principal + 5%"}{" "}
            within 120 days.
          </Typography>
          <TextField
            label={`Amount (USD, max $${MAX_LOAN_DISPLAY})`}
            type="number"
            fullWidth
            value={borrowAmount}
            onChange={(e) => setBorrowAmount(e.target.value)}
            inputProps={{ min: 0, max: MAX_LOAN_DISPLAY, step: "0.01" }}
            autoFocus
          />
          {borrowAmount && (
            <Alert severity="info" sx={{ mt: 2 }}>
              You will repay ${(Number(borrowAmount) * 1.05).toFixed(2)} by{" "}
              {new Date(
                Date.now() + 140 * 24 * 60 * 60 * 1000,
              ).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBorrowOpen(false)} disabled={isBusy}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleBorrow} disabled={isBusy}>
            {isBusy && pendingAction === "borrow"
              ? isConfirming
                ? "Confirming…"
                : "Waiting…"
              : "Borrow"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          sx={{ width: "100%" }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
