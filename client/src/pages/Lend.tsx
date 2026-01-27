import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import SpeedIcon from "@mui/icons-material/Speed";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";

const GridItem = Grid as React.ElementType;

export default function Lend() {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Typography
        variant="h3"
        component="h1"
        gutterBottom
        align="center"
        color="primary"
      >
        Lend & Earn
      </Typography>

      <Typography
        variant="h6"
        color="text.secondary"
        align="center"
        paragraph
        sx={{ mb: 6 }}
      >
        Deposit funds to the pool and earn 5% fixed interest while helping
        students.
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        <GridItem xs={12} md={8}>
          <Card sx={{ bgcolor: "background.paper", boxShadow: 6 }}>
            <CardContent sx={{ p: 6 }}>
              <Typography variant="h5" gutterBottom color="primary">
                Deposit to Lending Pool
              </Typography>

              <Box component="form" sx={{ mt: 4 }}>
                <TextField
                  fullWidth
                  label="Amount to Deposit (tokens)"
                  type="number"
                  variant="outlined"
                  placeholder="e.g. 1000"
                  helperText="You will earn 5% simple interest over 90 days"
                  sx={{ mb: 4 }}
                />

                <Box mt={5} textAlign="center">
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    sx={{ px: 8, py: 2 }}
                  >
                    Deposit Now
                  </Button>
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
                Why Lend with MicroLend?
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="5% fixed interest" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SpeedIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Funds used for verified student loans" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <VerifiedUserIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="All on-chain, transparent" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </GridItem>
      </Grid>
    </Container>
  );
}
