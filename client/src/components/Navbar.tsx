import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

export default function Navbar() {
  return (
    <AppBar position="sticky" color="primary" elevation={4}>
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, fontWeight: "bold" }}
        >
          MicroLend
        </Typography>
        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 3 }}>
          <Button color="inherit">Dashboard</Button>
          <Button color="inherit">How It Works</Button>
          <Button color="inherit">Borrow</Button>
          <Button color="inherit">Lend</Button>
        </Box>
        <Button variant="contained" color="secondary" sx={{ ml: 2 }}>
          Connect Wallet
        </Button>
      </Toolbar>
    </AppBar>
  );
}
