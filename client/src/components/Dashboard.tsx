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

const GridItem = Grid as React.ElementType;

const CONTRACT_ADDRESS =
  "0x6A2c4F0A5faAe8594aa127861A14ebCd441906Cd" as `0x${string}`;

// Full ABI derived from the Solidity source
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
  // Events (needed for type completeness, wagmi doesn't require them for writes)
  {
    name: "Deposited",
    type: "event",
    inputs: [
      { name: "lender", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    name: "Borrowed",
    type: "event",
    inputs: [
      { name: "borrower", type: "address", indexed: true },
      { name: "principal", type: "uint256", indexed: false },
      { name: "repayAmount", type: "uint256", indexed: false },
    ],
  },
  {
    name: "Repaid",
    type: "event",
    inputs: [
      { name: "borrower", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;

// Token decimals (USDC-style, 6 decimals)
const DECIMALS = 6;
// Max loan: $500 in token units
const MAX_LOAN_DISPLAY = 500;

export default function Dashboard() {
  const theme = useTheme();
  const { address, isConnected } = useAccount();

  // ─── Dialog state ──────────────────────────────────────────────
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [borrowOpen, setBorrowOpen] = useState(false);
  const [borrowAmount, setBorrowAmount] = useState("");

  // ─── Toast state ───────────────────────────────────────────────
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

  const {
    data: totalRaw,
    isLoading: isLoadingPool,
    error: poolError,
    refetch: refetchPool,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "totalDeposited",
    query: { enabled: isConnected },
  });

  const {
    data: isVerified,
    isLoading: isLoadingVerified,
    refetch: refetchVerified,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "verifiedStudents",
    args: [address!],
    query: { enabled: isConnected && !!address },
  });

  const {
    data: loanData,
    isLoading: isLoadingLoan,
    refetch: refetchLoan,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "getLoanDetails",
    args: [address!],
    query: { enabled: isConnected && !!address },
  });

  const { data: isOverdue } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "isOverdue",
    args: [address!],
    query: { enabled: isConnected && !!address && !!loanData?.active },
  });

  // ─── Contract WRITES ───────────────────────────────────────────

  const {
    writeContract,
    data: txHash,
    isPending: isTxPending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  // Track which action is in flight so we can show the right pending state
  const [pendingAction, setPendingAction] = useState<
    "deposit" | "borrow" | "repay" | null
  >(null);

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  // Refetch & notify after tx confirms
  useEffect(() => {
    if (isConfirmed) {
      refetchPool();
      refetchLoan();
      refetchVerified();

      const msgs: Record<string, string> = {
        deposit: "Deposit confirmed!",
        borrow: "Loan disbursed!",
        repay: "Loan repaid successfully!",
      };
      showToast(msgs[pendingAction ?? "deposit"] ?? "Transaction confirmed!");
      setPendingAction(null);
      resetWrite();
      setDepositAmount("");
      setBorrowAmount("");
      setDepositOpen(false);
      setBorrowOpen(false);
    }
  }, [isConfirmed]);

  // Surface write errors
  useEffect(() => {
    if (writeError) {
      const msg =
        (writeError as Error).message?.split("\n")[0] ?? "Transaction failed";
      showToast(msg, "error");
      setPendingAction(null);
    }
  }, [writeError]);

  // ─── Handlers ──────────────────────────────────────────────────

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
    setPendingAction("repay");
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "repay",
    });
  };

  // ─── Derived display values ────────────────────────────────────

  const totalFormatted =
    totalRaw !== undefined
      ? Number(formatUnits(totalRaw, DECIMALS)).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00";

  const loan = loanData as
    | {
        principal: bigint;
        startTime: bigint;
        repayAmount: bigint;
        active: boolean;
        repaid: boolean;
      }
    | undefined;

  const hasActiveLoan = loan?.active && !loan?.repaid;

  const loanPrincipal = loan
    ? Number(formatUnits(loan.principal, DECIMALS))
    : 0;
  const loanRepay = loan ? Number(formatUnits(loan.repayAmount, DECIMALS)) : 0;

  // Due date = startTime + 120 days + 20 days grace
  const dueDateMs = loan?.startTime
    ? Number(loan.startTime) * 1000 + (120 + 20) * 24 * 60 * 60 * 1000
    : null;
  const dueDateStr = dueDateMs
    ? new Date(dueDateMs).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  // Repaid % = (repayAmount - outstanding) / repayAmount — we don't track partial
  // repayments in this contract, so just show 0% until fully repaid.
  const repaidPercent = hasActiveLoan ? 0 : loan?.repaid ? 100 : 0;

  // Role derived from on-chain state
  const userRole: "borrower" | "lender" | "none" = hasActiveLoan
    ? "borrower"
    : isVerified
      ? "borrower"
      : "none";

  const roleDisplay: Record<typeof userRole, string> = {
    borrower: "Verified Student / Borrower",
    lender: "Lender",
    none: "Explore Options",
  };

  const isBusy = isTxPending || isConfirming;

  // ─── Activity card content ─────────────────────────────────────

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
            $
            {loanPrincipal.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Total to repay: ${loanRepay.toFixed(2)} (incl. 5% interest)
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
            color="primary"
            fullWidth
            sx={{ mt: 3 }}
            onClick={handleRepay}
            disabled={isBusy && pendingAction === "repay"}
          >
            {isBusy && pendingAction === "repay" ? "Repaying…" : "Repay Now"}
          </Button>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            mt={1}
            textAlign="center"
          >
            Make sure you have approved the token spend before repaying.
          </Typography>
        </>
      );
    }

    if (loan?.repaid) {
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

      {/* Contract error */}
      {poolError && (
        <Alert severity="error" sx={{ mb: 4 }}>
          Failed to load pool data:{" "}
          {poolError.message || "Check network and contract address"}
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
                    Verification:{" "}
                    {isLoadingVerified
                      ? "Checking…"
                      : isVerified
                        ? "✅ Student verified on-chain"
                        : "❌ Not verified (contact admin)"}
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

        {/* Your Activity – LIVE */}
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
              disabled={!isConnected || isBusy}
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
              disabled={!isConnected || !isVerified || hasActiveLoan || isBusy}
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

      {/* ── Deposit Dialog ── */}
      <Dialog
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Deposit to Pool</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Enter the amount of lending tokens to deposit. Make sure you have
            approved this contract to spend your tokens first.
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepositOpen(false)} disabled={isBusy}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleDeposit} disabled={isBusy}>
            {isBusy && pendingAction === "deposit"
              ? isConfirming
                ? "Confirming…"
                : "Waiting…"
              : "Deposit"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Borrow Dialog ── */}
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

      {/* ── Toast ── */}
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
