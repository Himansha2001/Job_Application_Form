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
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import WorkIcon from '@mui/icons-material/Work';
import PlaceIcon from '@mui/icons-material/Place';
import backgroundImage from './img/96160.jpg';
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

const ImageSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  height: '100%',
  minHeight: '100vh',
  backgroundImage: `url(${backgroundImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  padding: theme.spacing(6),
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.7))',
    zIndex: 1,
  },
  [theme.breakpoints.down('md')]: {
    minHeight: '40vh',
  },
}));

const ContentWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 2,
}));

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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
    <Grid container sx={{ minHeight: '100vh' }}>
      {/* Form Section */}
      <Grid item xs={12} md={6} sx={{ 
        bgcolor: '#fff',
        p: { xs: 2, sm: 4 },
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            Apply for this role
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
            <Chip
              icon={<WorkIcon />}
              label="Full time"
              color="primary"
              variant="outlined"
              size="small"
            />
            <Chip
              icon={<PlaceIcon />}
              label="Remote"
              color="primary"
              variant="outlined"
              size="small"
            />
          </Stack>
        </Box>

        <form onSubmit={handleSubmit} style={{ flex: 1 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={status.loading}
                variant="outlined"
                placeholder="Enter your name"
              />
            </Grid>
            
            <Grid item xs={12}>
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
                placeholder="Enter your email"
              />
            </Grid>
            
            <Grid item xs={12}>
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
                placeholder="Enter your phone number"
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
                  bgcolor: 'grey.50',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'grey.100'
                  }
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
                  py: 1.5,
                  bgcolor: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                }}
              >
                {status.loading ? 'Submitting...' : 'Submit'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Grid>

      {/* Image Section */}
      <Grid item xs={12} md={6} sx={{ display: { xs: isMobile ? 'none' : 'block', md: 'block' } }}>
        <ImageSection>
          <ContentWrapper>
            <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 500 }}>
              We believe in hiring smart, diverse, and interesting people and giving them full autonomy to do the best work of their careers. We'd love to chat to you.
            </Typography>
            <Typography variant="h6" sx={{ mt: 2, opacity: 0.9 }}>
              Himansha Thunmuduna
            </Typography>
          </ContentWrapper>
        </ImageSection>
      </Grid>
    </Grid>
  );
}

export default App;
