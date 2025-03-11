import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  LinearProgress,
  Alert,
  Stack,
  Grid,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

const VisuallyHiddenInput = styled('input')`
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  bottom: 0;
  left: 0;
  white-space: nowrap;
  width: 1px;
`;

function App() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cv: null,
  });
  const [status, setStatus] = useState({ loading: false, error: null, success: false });
  const [fileName, setFileName] = useState("");
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size too large. Please select a file under 10MB.');
        e.target.value = '';
        return;
      }
      
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Please select a PDF or Word document.');
        e.target.value = '';
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        cv: file
      }));
      setFileName(file.name);
    }
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({
      ...prev,
      cv: null
    }));
    setFileName("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: false });
    
    if (!formData.cv) {
      setStatus({ 
        loading: false, 
        error: "Please select a CV file", 
        success: false 
      });
      return;
    }

    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('phone', formData.phone);
    data.append('cv', formData.cv);

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: data,
      });
      
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage;
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || 'Submission failed';
        } else {
          const textError = await response.text();
          errorMessage = `Submission failed: ${textError || response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setStatus({ loading: false, error: null, success: true });
      setFormData({ name: "", email: "", phone: "", cv: null });
      setFileName("");
    } catch (error) {
      setStatus({ 
        loading: false, 
        error: error.message || 'Failed to submit application. Please try again.', 
        success: false 
      });
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        py: 4,
        px: 2
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 4 },
            borderRadius: 2,
            background: 'linear-gradient(to right bottom, #ffffff, #fafafa)'
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: '#1a237e',
              textAlign: 'center',
              mb: 4
            }}
          >
            Job Application Form
          </Typography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={status.loading}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={status.loading}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  disabled={status.loading}
                  variant="outlined"
                  inputProps={{
                    pattern: "[0-9+\\-\\s]+",
                    title: "Please enter a valid phone number"
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    borderStyle: 'dashed',
                    borderColor: fileName ? 'primary.main' : 'grey.400',
                    bgcolor: 'grey.50'
                  }}
                >
                  {fileName ? (
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Typography color="primary">{fileName}</Typography>
                      <IconButton
                        size="small"
                        onClick={handleRemoveFile}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  ) : (
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<CloudUploadIcon />}
                      sx={{ mb: 1 }}
                    >
                      Upload CV
                      <VisuallyHiddenInput
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx"
                        required
                        disabled={status.loading}
                      />
                    </Button>
                  )}
                  <Typography variant="caption" display="block" color="text.secondary">
                    Accepted formats: PDF, DOC, DOCX (Max 10MB)
                  </Typography>
                </Paper>
              </Grid>

              {status.loading && (
                <Grid item xs={12}>
                  <LinearProgress />
                </Grid>
              )}

              {status.error && (
                <Grid item xs={12}>
                  <Alert severity="error">{status.error}</Alert>
                </Grid>
              )}

              {status.success && (
                <Grid item xs={12}>
                  <Alert severity="success">
                    Application submitted successfully! We'll be in touch soon.
                  </Alert>
                </Grid>
              )}

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={status.loading}
                  sx={{
                    mt: 2,
                    py: 1.5,
                    bgcolor: 'primary.main',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                  }}
                >
                  {status.loading ? 'Submitting...' : 'Submit Application'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}

export default App;
