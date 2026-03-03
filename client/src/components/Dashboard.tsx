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

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const CONTRACT_ADDRESS =
  "0x6A2c4F0A5faAe8594aa127861A14ebCd441906Cd" as `0x${string}`;
const TOKEN_ADDRESS =
  "0x91E4eBe667fac488efE1eEd352314f127794835D" as `0x${string}`;

const DECIMALS = 2; // whole KSh
const MAX_LOAN_DISPLAY = 60000; // KSh

// ─────────────────────────────────────────────
// ABIs
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function Dashboard() {
  const theme = useTheme();
  const { address, isConnected, chain } = useAccount();

  // ─── State ─────────────────────────────────────────────
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [borrowOpen, setBorrowOpen] = useState(false);
  const [borrowAmount, setBorrowAmount] = useState("");

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

  // ─── Contract Reads ─────────────────────────────────────

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
      ? Number(formatUnits(totalRaw, DECIMALS)).toLocaleString("en-KE")
      : "0";

  // Verification
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

  // Overdue check
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
    ? Number(formatUnits(tokenBalanceRaw, DECIMALS)).toLocaleString("en-KE")
    : "0";

  // Allowances
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

  // ─── Writes ────────────────────────────────────────────────

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

  // ─── Handlers ──────────────────────────────────────────────

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
      showToast(
        `Max loan is KSh ${MAX_LOAN_DISPLAY.toLocaleString("en-KE")}`,
        "error",
      );
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

  // Loan calculations (moved here so activityContent can access them)
  const loanPrincipal = userLoan
    ? Number(formatUnits(userLoan.principal, DECIMALS))
    : 0;
  const loanRepay = userLoan
    ? Number(formatUnits(userLoan.repayAmount, DECIMALS))
    : 0;

  const dueDateMs = userLoan?.startTime
    ? Number(userLoan.startTime) * 1000 + (120 + 20) * 24 * 60 * 60 * 1000
    : null;

  const dueDateStr = dueDateMs
    ? new Date(dueDateMs).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  const repaidPercent = hasActiveLoan ? 0 : userLoan?.repaid ? 100 : 0;

  const roleDisplay: Record<"borrower" | "lender" | "none", string> = {
    borrower: "Verified Student / Borrower",
    lender: "Lender",
    none: "Explore Options",
  };

  const userRole: "borrower" | "lender" | "none" = hasActiveLoan
    ? "borrower"
    : isVerified
      ? "borrower"
      : "none";

  // ─── Activity Content ─────────────────────────────────────────

  const activityContent = () => {
    if (isLoadingLoan) {
      return (
        <Box pt={1}>
          <Skeleton variant="text" width="50%" height={40} />
          <Skeleton variant="text" width="70%" />
          <Skeleton
            variant="rectangular"
            height={10}
            sx={{ mt: 2, borderRadius: 5 }}
          />
        </Box>
      );
    }

    if (hasActiveLoan) {
      return (
        <>
          <Typography variant="h6" gutterBottom>
            Active Loan
          </Typography>
          <Typography variant="h4" fontWeight="bold">
            KSh {loanPrincipal.toLocaleString("en-KE")}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Total to repay: KSh {loanRepay.toLocaleString("en-KE")} (incl. 5%
            interest)
          </Typography>
          {isOverdue && (
            <Alert severity="error" sx={{ mt: 2 }}>
              This loan is overdue!
            </Alert>
          )}
          <Box mt={2}>
            <LinearProgress
              variant="determinate"
              value={repaidPercent}
              sx={{ height: 10, borderRadius: 5, mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              {repaidPercent}% repaid • Due: {dueDateStr}
            </Typography>
          </Box>
          <Button
            variant="contained"
            color={needsRepayApproval ? "warning" : "primary"}
            fullWidth
            sx={{ mt: 3 }}
            onClick={needsRepayApproval ? handleApproveRepay : handleRepay}
            disabled={
              isBusy &&
              (pendingAction === "repay" || pendingAction === "approve_repay")
            }
          >
            {isBusy && pendingAction === "approve_repay"
              ? "Approving…"
              : isBusy && pendingAction === "repay"
                ? "Repaying…"
                : needsRepayApproval
                  ? "Step 1: Approve Tokens"
                  : "Repay Now"}
          </Button>
          {needsRepayApproval && (
            <Typography
              variant="caption"
              color="warning.main"
              display="block"
              mt={1}
              textAlign="center"
            >
              You need to approve token spending first, then repay.
            </Typography>
          )}
        </>
      );
    }

    if (userLoan?.repaid) {
      return (
        <Alert severity="success">
          Your previous loan has been fully repaid. You can apply for a new one!
        </Alert>
      );
    }

    return (
      <Typography variant="body1" color="text.secondary" mt={4}>
        No activity yet. Start by depositing to the pool or applying for a loan.
      </Typography>
    );
  };

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
                    Token Balance: KSh {formattedBalance}
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

        {/* Pool Overview */}
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
                    KSh {totalFormatted}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    available for loans
                  </Typography>
                </>
              )}
              <Box mt={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Max loan per student: KSh{" "}
                  {MAX_LOAN_DISPLAY.toLocaleString("en-KE")}
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

        {/* Footer */}
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
            Your balance: KSh {formattedBalance}
          </Typography>
          <TextField
            label="Amount (KSh)"
            type="number"
            fullWidth
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            inputProps={{ min: 0, step: "1" }}
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
            Enter the amount you want to borrow (max KSh{" "}
            {MAX_LOAN_DISPLAY.toLocaleString("en-KE")}). You will repay{" "}
            {borrowAmount
              ? `KSh ${Math.round(Number(borrowAmount) * 1.05).toLocaleString("en-KE")}`
              : "principal + 5%"}{" "}
            within 120 days + 20-day grace period.
          </Typography>
          <TextField
            label={`Amount (KSh, max ${MAX_LOAN_DISPLAY.toLocaleString("en-KE")})`}
            type="number"
            fullWidth
            value={borrowAmount}
            onChange={(e) => setBorrowAmount(e.target.value)}
            inputProps={{ min: 0, max: MAX_LOAN_DISPLAY, step: "1" }}
            autoFocus
          />
          {borrowAmount && (
            <Alert severity="info" sx={{ mt: 2 }}>
              You will repay KSh{" "}
              {Math.round(Number(borrowAmount) * 1.05).toLocaleString("en-KE")}{" "}
              by{" "}
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
