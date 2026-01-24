import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

const GridItem = Grid as React.ElementType;

export default function Dashboard() {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Typography
        variant="h3"
        component="h1"
        gutterBottom
        align="center"
        color="primary"
      >
        Student Micro-Lending Platform
      </Typography>

      <Grid container spacing={4}>
        {/* Pool Card */}
        <GridItem xs={12} md={6}>
          <Card sx={{ bgcolor: "background.paper", height: "100%" }}>
            <CardContent>
              <Typography variant="h5" gutterBottom color="primary">
                Lending Pool
              </Typography>
              <Typography variant="h3" color="text.primary">
                12,345 tokens
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available for loans
              </Typography>
            </CardContent>
          </Card>
        </GridItem>

        {/* Deposit Card */}
        <GridItem xs={12} md={6}>
          <Card sx={{ bgcolor: "background.paper", height: "100%" }}>
            <CardContent>
              <Typography variant="h5" gutterBottom color="primary">
                Deposit to Pool
              </Typography>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2 }}
              >
                Deposit Now
              </Button>
            </CardContent>
          </Card>
        </GridItem>
      </Grid>
    </Container>
  );
}
