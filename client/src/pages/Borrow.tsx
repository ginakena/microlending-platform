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
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import SpeedIcon from "@mui/icons-material/Speed";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";

const GridItem = Grid as React.ElementType;

export default function Borrow() {
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
                    />
                  </GridItem>
                  <GridItem xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Purpose"
                      variant="outlined"
                      placeholder="e.g. School fees, books"
                    />
                  </GridItem>
                  <GridItem xs={12}>
                    <TextField
                      fullWidth
                      label="Repayment Period"
                      variant="outlined"
                      placeholder="e.g. 90 days"
                    />
                  </GridItem>
                </Grid>

                <Box mt={5} textAlign="center">
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    sx={{ px: 8, py: 2 }}
                  >
                    Apply for Loan
                  </Button>
                  <Typography variant="body2" color="text.secondary" mt={2}>
                    5% fixed interest • Repayment due in 90 days + 7-day grace
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
                    <VerifiedUserIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Verified student account" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Wallet connected on Sepolia" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SpeedIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="No collateral needed" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </GridItem>
      </Grid>
    </Container>
  );
}
