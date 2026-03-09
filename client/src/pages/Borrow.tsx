import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import SpeedIcon from "@mui/icons-material/Speed";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import WarningIcon from "@mui/icons-material/Warning";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useState, useEffect } from "react";
import { parseUnits } from "viem";
import { sepolia } from "wagmi/chains";
import VerificationDialog from "../components/verificationDialog";

const GridItem = Grid as React.ElementType;

const CONTRACT_ADDRESS =
  "0x6A2c4F0A5faAe8594aa127861A14ebCd441906Cd" as `0x${string}`;
const DECIMALS = 2;
const MAX_LOAN_DISPLAY = 60000;

const ABI = [
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
    name: "borrow",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
] as const;

export default function Borrow() {
  const { address, isConnected, chain } = useAccount();
  const [borrowAmount, setBorrowAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  // Check verification status
  const { data: isVerifiedRaw, refetch: refetchVerified } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "verifiedStudents",
    args: [address!],
    query: { enabled: isConnected && !!address && chain?.id === sepolia.id },
  });

  const isVerified = isVerifiedRaw ?? false;

  // Check loan status
  const { data: loanData, refetch: refetchLoan } = useReadContract({
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

  // Write contract
  const {
    writeContract,
    data: txHash,
    isPending: isTxPending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  // Handle success
  useEffect(() => {
    if (isConfirmed) {
      refetchLoan();
      refetchVerified();
      setSuccessOpen(true);
      setBorrowAmount("");
      setPurpose("");
      resetWrite();
    }
  }, [isConfirmed]);

  const handleApplyForLoan = () => {
    // First check if wallet is connected
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    // Check network
    if (chain?.id !== sepolia.id) {
      alert("Please switch to Sepolia network");
      return;
    }

    // Check if verified
    if (!isVerified) {
      setVerificationOpen(true);
      return;
    }

    // Check if already has active loan
    if (hasActiveLoan) {
      alert("You already have an active loan. Please repay it first.");
      return;
    }

    // Validate amount
    if (!borrowAmount || isNaN(Number(borrowAmount)) || Number(borrowAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (Number(borrowAmount) > MAX_LOAN_DISPLAY) {
      alert(`Maximum loan amount is KSh ${MAX_LOAN_DISPLAY.toLocaleString("en-KE")}`);
      return;
    }

    // Submit borrow request
    const raw = parseUnits(borrowAmount, DECIMALS);
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "borrow",
      args: [raw],
    });
  };

  const isBusy = isTxPending || isConfirming;

  const repayAmount = borrowAmount
    ? Math.round(Number(borrowAmount) * 1.05).toLocaleString("en-KE")
    : "0";

  const dueDate = new Date(Date.now() + 140 * 24 * 60 * 60 * 1000).toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Typography
        variant="h3"
        component="h1"
        gutterBottom
        align="center"
        color="primary"
      >
        Borrow a Loan
      </Typography>

      <Typography
        variant="h6"
        color="text.secondary"
        align="center"
        paragraph
        sx={{ mb: 6 }}
      >
        Apply for a fast, low-interest loan to cover school fees, books, or
        living expenses.
      </Typography>

      {/* Network warning */}
      {isConnected && chain?.id !== sepolia.id && (
        <Alert severity="warning" sx={{ mb: 4, maxWidth: 800, mx: "auto" }}>
          Please switch to Sepolia network in your wallet
        </Alert>
      )}

      {/* Verification warning */}
      {isConnected && !isVerified && chain?.id === sepolia.id && (
        <Alert severity="warning" sx={{ mb: 4, maxWidth: 800, mx: "auto" }}>
          <Typography variant="body2" gutterBottom>
            <strong>Verification Required</strong>
          </Typography>
          <Typography variant="body2">
            You need to be verified as a student before applying for a loan.
            Click the button below to request verification.
          </Typography>
          <Button
            variant="outlined"
            color="warning"
            size="small"
            sx={{ mt: 2 }}
            onClick={() => setVerificationOpen(true)}
          >
            Request Verification
          </Button>
        </Alert>
      )}

      {/* Active loan warning */}
      {hasActiveLoan && (
        <Alert severity="info" sx={{ mb: 4, maxWidth: 800, mx: "auto" }}>
          You already have an active loan. Please repay it before applying for a
          new one.
        </Alert>
      )}

      {/* Error display */}
      {writeError && (
        <Alert severity="error" sx={{ mb: 4, maxWidth: 800, mx: "auto" }}>
          Transaction failed: {(writeError as Error).message?.split("\n")[0]}
        </Alert>
      )}

      <Grid container spacing={4} justifyContent="center">
        <GridItem xs={12} md={8}>
          <Card sx={{ bgcolor: "background.paper", boxShadow: 6 }}>
            <CardContent sx={{ p: 6 }}>
              <Typography variant="h5" gutterBottom color="primary">
                Loan Application
              </Typography>

              <Box component="form" sx={{ mt: 4 }}>
                <Grid container spacing={3}>
                  <GridItem xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Amount Needed (KSh)"
                      type="number"
                      variant="outlined"
                      placeholder="e.g. 15000"
                      value={borrowAmount}
                      onChange={(e) => setBorrowAmount(e.target.value)}
                      inputProps={{ min: 0, max: MAX_LOAN_DISPLAY, step: "1" }}
                      disabled={isBusy || !isConnected || !isVerified || hasActiveLoan}
                    />
                  </GridItem>
                  <GridItem xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Purpose"
                      variant="outlined"
                      placeholder="e.g. School fees, books"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      disabled={isBusy || !isConnected || !isVerified || hasActiveLoan}
                    />
                  </GridItem>
                  <GridItem xs={12}>
                    <TextField
                      fullWidth
                      label="Repayment Period"
                      variant="outlined"
                      value="120 days + 20-day grace period (Fixed)"
                      disabled
                    />
                  </GridItem>
                </Grid>

                {borrowAmount && Number(borrowAmount) > 0 && (
                  <Alert severity="info" sx={{ mt: 3 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Loan Summary:</strong>
                    </Typography>
                    <Typography variant="body2">
                      • Borrow: KSh {Number(borrowAmount).toLocaleString("en-KE")}
                    </Typography>
                    <Typography variant="body2">
                      • Interest (5%): KSh{" "}
                      {Math.round(Number(borrowAmount) * 0.05).toLocaleString("en-KE")}
                    </Typography>
                    <Typography variant="body2">
                      • Total Repayment: KSh {repayAmount}
                    </Typography>
                    <Typography variant="body2">• Due by: {dueDate}</Typography>
                  </Alert>
                )}

                <Box mt={5} textAlign="center">
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    sx={{ px: 8, py: 2 }}
                    onClick={handleApplyForLoan}
                    disabled={
                      isBusy ||
                      !isConnected ||
                      hasActiveLoan ||
                      chain?.id !== sepolia.id
                    }
                  >
                    {isBusy
                      ? isConfirming
                        ? "Confirming…"
                        : "Processing…"
                      : !isConnected
                        ? "Connect Wallet"
                        : !isVerified
                          ? "Request Verification First"
                          : hasActiveLoan
                            ? "Active Loan Exists"
                            : "Apply for Loan"}
                  </Button>
                  <Typography variant="body2" color="text.secondary" mt={2}>
                    5% fixed interest • Repayment due in 120 days + 20-day grace
                    period
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </GridItem>

        <GridItem xs={12} md={4}>
          <Card
            sx={{ bgcolor: "background.paper", boxShadow: 6, height: "100%" }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Loan Requirements
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    {isVerified ? (
                      <VerifiedUserIcon color="success" />
                    ) : (
                      <WarningIcon color="warning" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary="Verified student account"
                    secondary={
                      isVerified
                        ? "✓ Verified"
                        : "Not verified - click to verify"
                    }
                    secondaryTypographyProps={{
                      color: isVerified ? "success.main" : "warning.main",
                    }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon
                      color={
                        isConnected && chain?.id === sepolia.id
                          ? "success"
                          : "warning"
                      }
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="Wallet connected on Sepolia"
                    secondary={
                      isConnected && chain?.id === sepolia.id
                        ? "✓ Connected"
                        : "Not connected"
                    }
                    secondaryTypographyProps={{
                      color:
                        isConnected && chain?.id === sepolia.id
                          ? "success.main"
                          : "warning.main",
                    }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SpeedIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="No collateral needed" />
                </ListItem>
              </List>

              {isConnected && !isVerified && (
                <Box mt={2}>
                  <Button
                    variant="contained"
                    color="warning"
                    fullWidth
                    onClick={() => setVerificationOpen(true)}
                  >
                    Request Verification
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </GridItem>
      </Grid>

      {/* Verification Dialog */}
      <VerificationDialog
        open={verificationOpen}
        onClose={() => setVerificationOpen(false)}
        walletAddress={address ?? ""}
        isVerified={isVerified}
      />

      {/* Success Dialog */}
      <Dialog
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Loan Approved! 🎉</DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            Your loan has been successfully disbursed to your wallet!
          </Alert>
          <Typography variant="body2" color="text.secondary">
            <strong>What's next?</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            • Your loan of KSh {borrowAmount ? Number(borrowAmount).toLocaleString("en-KE") : "0"} has been
            transferred
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Remember to repay KSh {repayAmount} by {dueDate}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Check your dashboard to track repayment progress
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuccessOpen(false)} autoFocus>
            Got it!
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}