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
      
      // First check if the response is ok
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || 'Submission failed';
        } catch (e) {
          // If parsing JSON fails, use status text
          errorMessage = `Submission failed: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Try to parse successful response
      const result = await response.json();
      setStatus({ loading: false, error: null, success: true });
      setFormData({ name: "", email: "", phone: "", cv: null }); // Reset form
      alert('Application submitted successfully!');
    } catch (error) {
      setStatus({ 
        loading: false, 
        error: error.message || 'Failed to submit application. Please try again.', 
        success: false 
      });
      alert(error.message || 'Failed to submit application. Please try again.');
    }
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      cv: e.target.files[0]
    }));
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
            />
          </div>
          <div>
            <label htmlFor="cv">CV:</label>
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
