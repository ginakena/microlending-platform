import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Alert,
  LinearProgress,
  Chip,
} from "@mui/material";
import { useState, useEffect } from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

interface VerificationDialogProps {
  open: boolean;
  onClose: () => void;
  walletAddress: string | undefined;
  isVerified?: boolean; // Make optional
}

interface VerificationRequest {
  address: string;
  studentId: string;
  institution: string;
  documentBase64?: string;
  documentName?: string;
  status: "pending" | "approved" | "rejected";
  timestamp: number;
}

export default function VerificationDialog({
  open,
  onClose,
  walletAddress,
  isVerified,
}: VerificationDialogProps) {
  const [studentId, setStudentId] = useState("");
  const [institution, setInstitution] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Check if verification request already exists in localStorage
  const [existingRequest, setExistingRequest] =
    useState<VerificationRequest | null>(null);

  useEffect(() => {
    if (walletAddress && open) {
      const stored = localStorage.getItem(
        `verification_${walletAddress.toLowerCase()}`,
      );
      if (stored) {
        setExistingRequest(JSON.parse(stored));
      }
    }
  }, [walletAddress, open]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Limit to 2MB for localStorage
      if (file.size > 2 * 1024 * 1024) {
        alert("File too large. Please upload a file smaller than 2MB.");
        return;
      }
      setDocumentFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!walletAddress || !studentId || !institution) {
      alert("Please fill in all required fields");
      return;
    }

    setUploading(true);

    try {
      let documentBase64 = "";
      let documentName = "";

      // Convert file to base64 if provided
      if (documentFile) {
        documentBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result as string;
            resolve(base64.split(",")[1]); // Remove data:image/... prefix
          };
          reader.onerror = reject;
          reader.readAsDataURL(documentFile);
        });
        documentName = documentFile.name;
      }

      // Store in localStorage
      const request: VerificationRequest = {
        address: walletAddress.toLowerCase(),
        studentId,
        institution,
        documentBase64,
        documentName,
        status: "pending",
        timestamp: Date.now(),
      };

      localStorage.setItem(
        `verification_${walletAddress.toLowerCase()}`,
        JSON.stringify(request),
      );

      setExistingRequest(request);
      setSubmitted(true);
      setUploading(false);

      // Reset form
      setStudentId("");
      setInstitution("");
      setDocumentFile(null);
    } catch (error) {
      console.error("Failed to submit verification:", error);
      alert("Failed to submit verification request. Please try again.");
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    onClose();
  };

  // If already verified on-chain
  if (isVerified) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Verification Status</DialogTitle>
        <DialogContent>
          <Box textAlign="center" py={4}>
            <CheckCircleIcon
              sx={{ fontSize: 80, color: "success.main", mb: 2 }}
            />
            <Typography variant="h5" gutterBottom color="success.main">
              Already Verified!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your wallet has been verified by the platform admin. You can now
              apply for loans.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  // If request already submitted
  if (existingRequest && !submitted) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Verification Status</DialogTitle>
        <DialogContent>
          <Box py={2}>
            <Alert severity="info" sx={{ mb: 3 }}>
              You have already submitted a verification request.
            </Alert>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Student ID:</strong> {existingRequest.studentId}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Institution:</strong> {existingRequest.institution}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Submitted:</strong>{" "}
              {new Date(existingRequest.timestamp).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Typography>

            <Box mt={3}>
              <Chip
                label={
                  existingRequest.status === "pending"
                    ? "Pending Admin Review"
                    : existingRequest.status === "approved"
                      ? "Approved"
                      : "Rejected"
                }
                color={
                  existingRequest.status === "pending"
                    ? "warning"
                    : existingRequest.status === "approved"
                      ? "success"
                      : "error"
                }
                icon={
                  existingRequest.status === "pending" ? (
                    <WarningIcon />
                  ) : (
                    <CheckCircleIcon />
                  )
                }
              />
            </Box>

            <Box mt={3} p={2} bgcolor="background.default" borderRadius={2}>
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight="bold"
                gutterBottom
              >
                Share this address with the admin for approval:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  wordBreak: "break-all",
                  fontFamily: "monospace",
                  bgcolor: "background.paper",
                  p: 1,
                  borderRadius: 1,
                }}
              >
                {walletAddress}
              </Typography>
              <Button
                size="small"
                sx={{ mt: 1 }}
                onClick={() => {
                  navigator.clipboard.writeText(walletAddress || "");
                  alert("Address copied to clipboard!");
                }}
              >
                Copy Address
              </Button>
            </Box>

            <Alert severity="info" sx={{ mt: 3 }}>
              The admin will review your documents and verify your wallet
              on-chain. This may take 1-2 business days.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Submit new verification request
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Request Student Verification</DialogTitle>
      <DialogContent>
        {submitted ? (
          <Box textAlign="center" py={4}>
            <CheckCircleIcon
              sx={{ fontSize: 80, color: "success.main", mb: 2 }}
            />
            <Typography variant="h5" gutterBottom color="success.main">
              Request Submitted!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your verification request has been saved. Please share your wallet
              address with the platform admin for approval.
            </Typography>

            <Box mt={3} p={2} bgcolor="background.default" borderRadius={2}>
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight="bold"
                gutterBottom
              >
                Your Wallet Address:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  wordBreak: "break-all",
                  fontFamily: "monospace",
                  bgcolor: "background.paper",
                  p: 1,
                  borderRadius: 1,
                }}
              >
                {walletAddress}
              </Typography>
              <Button
                size="small"
                sx={{ mt: 1 }}
                onClick={() => {
                  navigator.clipboard.writeText(walletAddress || "");
                  alert("Address copied to clipboard!");
                }}
              >
                Copy Address
              </Button>
            </Box>

            <Alert severity="info" sx={{ mt: 3 }}>
              The admin will verify your wallet on-chain after reviewing your
              information. Check back in 1-2 business days.
            </Alert>
          </Box>
        ) : (
          <Box py={2}>
            <Alert severity="info" sx={{ mb: 3 }}>
              To borrow, you must be verified as a student. Upload your student
              ID and institutional details.
            </Alert>

            <TextField
              fullWidth
              label="Student ID / Registration Number"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g., STU/2024/001234"
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Institution Name"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g., University of Nairobi"
              required
              sx={{ mb: 3 }}
            />

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Upload Student ID / Proof of Enrollment (optional but
                recommended)
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{ mb: 1 }}
              >
                {documentFile ? documentFile.name : "Choose File"}
                <input
                  type="file"
                  hidden
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                />
              </Button>
              <Typography variant="caption" color="text.secondary">
                Max 2MB • Accepted: JPG, PNG, PDF
              </Typography>
            </Box>

            {uploading && (
              <Box mt={2}>
                <LinearProgress />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Saving verification request...
                </Typography>
              </Box>
            )}

            <Alert severity="warning" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Note:</strong> Your information will be stored locally
                and shared with the admin for verification. The admin will
                verify your wallet address on the blockchain.
              </Typography>
            </Alert>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {!submitted && (
          <>
            <Button onClick={handleClose} disabled={uploading}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={uploading || !studentId || !institution}
            >
              {uploading ? "Submitting..." : "Submit Request"}
            </Button>
          </>
        )}
        {submitted && <Button onClick={handleClose}>Close</Button>}
      </DialogActions>
    </Dialog>
  );
}