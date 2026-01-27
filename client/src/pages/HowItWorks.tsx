import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Avatar,
  Button,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import SecurityIcon from "@mui/icons-material/Security";
import SpeedIcon from "@mui/icons-material/Speed";

const GridItem = Grid as React.ElementType;

export default function HowItWorks() {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Typography
        variant="h3"
        component="h1"
        gutterBottom
        align="center"
        color="primary"
      >
        How MicroLend Works
      </Typography>

      <Typography
        variant="h6"
        color="text.secondary"
        align="center"
        paragraph
        sx={{ mb: 6 }}
      >
        This platform is a simple, transparent, blockchain-powered micro-lending
        solution built for Kenyan university students. It enables verified
        students to access short-term loans of up to 120 days, with a 30-day
        grace period before repayment begins. By using smart contracts, the
        platform ensures secure loan disbursement, automated repayments, and
        fully transparent transactions without relying on traditional financial
        intermediaries. Our goal is to promote financial inclusion by giving
        students fair, accessible, and traceable credit when they need it most.
      </Typography>

      <Grid container spacing={4}>
        {/* Step 1 */}
        <GridItem xs={12} md={4}>
          <Paper
            elevation={4}
            sx={{ p: 4, height: "100%", bgcolor: "background.paper" }}
          >
            <Box textAlign="center" mb={3}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: "primary.main",
                  mx: "auto",
                  mb: 2,
                }}
              >
                <SecurityIcon fontSize="large" />
              </Avatar>
              <Typography variant="h5" gutterBottom color="primary">
                1. Connect Wallet
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary">
              Use Brave Wallet, MetaMask or any Web3 wallet. We support Sepolia
              testnet for zero real-money risk during development.
            </Typography>
          </Paper>
        </GridItem>

        {/* Step 2 */}
        <GridItem xs={12} md={4}>
          <Paper
            elevation={4}
            sx={{ p: 4, height: "100%", bgcolor: "background.paper" }}
          >
            <Box textAlign="center" mb={3}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: "primary.main",
                  mx: "auto",
                  mb: 2,
                }}
              >
                <InfoIcon fontSize="large" />
              </Avatar>
              <Typography variant="h5" gutterBottom color="primary">
                2. Verify as Student
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary">
              Only verified students can borrow. Submit your student ID or email
              verification — all data is private and on-chain.
            </Typography>
          </Paper>
        </GridItem>

        {/* Step 3 */}
        <GridItem xs={12} md={4}>
          <Paper
            elevation={4}
            sx={{ p: 4, height: "100%", bgcolor: "background.paper" }}
          >
            <Box textAlign="center" mb={3}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: "primary.main",
                  mx: "auto",
                  mb: 2,
                }}
              >
                <SpeedIcon fontSize="large" />
              </Avatar>
              <Typography variant="h5" gutterBottom color="primary">
                3. Borrow or Lend
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary">
              Borrowers get fast, 5% fixed-rate loans. Lenders earn interest.
              Everything is transparent, immutable, and on the blockchain.
            </Typography>
          </Paper>
        </GridItem>
      </Grid>

      <Box mt={10} textAlign="center">
        <Typography variant="h5" gutterBottom color="primary">
          Ready to get started?
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          sx={{ mt: 3, px: 6, py: 2 }}
        >
          Connect Wallet
        </Button>
      </Box>
    </Container>
  );
}
