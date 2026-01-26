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
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import WarningIcon from "@mui/icons-material/Warning";

const GridItem = Grid as React.ElementType;

export default function Dashboard() {
  const theme = useTheme();

  // Mock data - replace with real Wagmi/contract reads later
  const isVerified = false; // from contract: verifiedStudents[address]
  const userRole = "none" as "none" | "borrower" | "lender"; // explicit union type
  const totalDeposited = 1234567; // from contract
  const activeLoan = {
    amount: 15000,
    dueDate: "Feb 15, 2026",
    repaidPercent: 40,
  };
  const userDeposits = 50000;

  // Fix 1: Role display using object map (no more TS warnings)
  const roleDisplay: Record<typeof userRole, string> = {
    borrower: "Borrower",
    lender: "Lender",
    none: "Explore Options",
  };

  // Fix 2: Activity content using helper function (clear, exhaustive, no warnings)
  const activityContent = () => {
    if (userRole === "borrower" && activeLoan) {
      return (
        <>
          <Typography variant="h6" gutterBottom>
            Active Loan
          </Typography>
          <Typography variant="h4" fontWeight="bold">
            KSh {activeLoan.amount.toLocaleString()}
          </Typography>
          <Box mt={2}>
            <LinearProgress
              variant="determinate"
              value={activeLoan.repaidPercent}
              sx={{ height: 10, borderRadius: 5, mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              {activeLoan.repaidPercent}% repaid • Due: {activeLoan.dueDate}
            </Typography>
          </Box>
          <Button variant="contained" color="primary" fullWidth sx={{ mt: 3 }}>
            Repay Now
          </Button>
        </>
      );
    }

    if (userRole === "lender" && userDeposits > 0) {
      return (
        <>
          <Typography variant="h6" gutterBottom>
            Your Deposits
          </Typography>
          <Typography variant="h4" fontWeight="bold">
            KSh {userDeposits.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Earning 5% interest
          </Typography>
          <Button variant="contained" color="primary" fullWidth sx={{ mt: 3 }}>
            Withdraw
          </Button>
        </>
      );
    }

    // Default case (covers 'none' and any unexpected value)
    return (
      <Typography variant="body1" color="text.secondary" mt={4}>
        No activity yet. Start by depositing or applying for a loan.
      </Typography>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      {/* Hero Greeting */}
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
        <Chip
          label={isVerified ? "Verified Student" : "Not Verified"}
          color={isVerified ? "success" : "warning"}
          icon={isVerified ? <VerifiedUserIcon /> : <WarningIcon />}
          sx={{ mt: 2, fontSize: "1rem", px: 2, py: 1.5 }}
        />
      </Box>

      <Grid container spacing={4}>
        {/* User Status & Role */}
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
                  R
                </Avatar>
                <Box flex={1}>
                  <Typography variant="body1" color="text.secondary">
                    Wallet: 0xcb17...1df7
                  </Typography>
                  <Typography variant="body1" color="text.secondary" mt={1}>
                    Role: {roleDisplay[userRole]}
                  </Typography>
                  {!isVerified && (
                    <Button variant="outlined" color="warning" sx={{ mt: 2 }}>
                      Verify as Student
                    </Button>
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
              <Typography variant="h3" fontWeight="bold" color="text.primary">
                KSh {totalDeposited.toLocaleString()}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                available for loans
              </Typography>
              <Box mt={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Loans Issued: KSh 987,654
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Average Interest: 5% fixed
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
            >
              Deposit to Pool
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              fullWidth
              sx={{ py: 3 }}
            >
              Apply for Loan
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
    </Container>
  );
}
