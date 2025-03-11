import React, { useState } from "react";
import './App.css';

function App() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cv: null,
  });
  const [status, setStatus] = useState({ loading: false, error: null, success: false });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      console.log('Submitting form data...');
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: data,
      });
      
      console.log('Response status:', response.status);
      const contentType = response.headers.get("content-type");
      
      if (!response.ok) {
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
      console.log('Submission result:', result);
      
      setStatus({ loading: false, error: null, success: true });
      setFormData({ name: "", email: "", phone: "", cv: null });
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Submission error:', error);
      setStatus({ 
        loading: false, 
        error: error.message || 'Failed to submit application. Please try again.', 
        success: false 
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
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
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Job Application Form</h1>
      </header>
      <main>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={status.loading}
            />
          </div>
          <div>
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={status.loading}
            />
          </div>
          <div>
            <label htmlFor="phone">Phone:</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              disabled={status.loading}
              pattern="[0-9+\-\s]+"
              title="Please enter a valid phone number"
            />
          </div>
          <div>
            <label htmlFor="cv">CV (PDF or Word, max 10MB):</label>
            <input
              type="file"
              id="cv"
              name="cv"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              required
              disabled={status.loading}
            />
          </div>
          {status.error && (
            <div className="error-message">
              {status.error}
            </div>
          )}
          {status.success && (
            <div className="success-message">
              Application submitted successfully!
            </div>
          )}
          <button type="submit" disabled={status.loading}>
            {status.loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </main>
    </div>
  );
}

export default App;
