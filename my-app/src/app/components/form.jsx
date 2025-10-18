'use client'
// components/Form.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';

const Form = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]); // To store actual file objects
  const [creditScore, setCreditScore] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState([]);
  const [progress, setProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const inputRef = useRef(null); // Ref for the hidden file input

  // --- Helper Functions (Simplified) ---
  const validateRawFiles = (fileList) => {
    const validationErrors = [];
    if (fileList.length === 0) {
      validationErrors.push("No files selected.");
    }
    // You can add more general validation here (e.g., file size limit)
    // Example: Check if any file exceeds 5MB
    // const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    // for (const file of fileList) {
    //   if (file.size > MAX_FILE_SIZE) {
    //     validationErrors.push(`File "${file.name}" exceeds the 5MB limit.`);
    //   }
    // }
    return validationErrors;
  };

  // --- End Helper Functions ---

  const handleCreditScoreChange = (e) => {
    setCreditScore(e.target.value);
  }

  const handleFiles = useCallback(async (fileList) => {
    setErrors([]);
    setProgress(5);
    setShowSuccess(false);
    setUploadedFiles([]); // Clear previous files

    const vErrs = validateRawFiles(fileList);
    if (vErrs.length) {
      setErrors(vErrs);
      setProgress(0);
      return;
    }
    setProgress(35); // Initial processing

    // No dataset grouping needed, directly process files
    setUploadedFiles(Array.from(fileList)); // Store the actual File objects

    setTimeout(() => {
      setProgress(100);
      setShowSuccess(true);
      console.log("Files ready for upload:", Array.from(fileList));
      setTimeout(() => {
        setProgress(0);
        setShowSuccess(false);
      }, 2000);
    }, 250);
  }, []); // Dependencies are empty as no external state is used in handleFiles anymore


  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const onBrowse = (e) => {
    handleFiles(e.target.files);
    e.target.value = ''; // Clear input value so same file can be selected again
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default browser form submission
    console.log("Form Submitted!");
    console.log("Files to Upload:", uploadedFiles);

    if (uploadedFiles.length === 0) {
        setErrors(["Please select at least one file to upload."]);
        return;
    }
    alert(`Submitting ${uploadedFiles.length} file(s). Check console for details.`);
    // Here you would typically send `uploadedFiles` to your backend
    // Example: sendToServer(uploadedFiles);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow-md max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Upload Tax Forms</h2> {/* Adjusted text color */}
      <label className="dz-title text-xl font-semibold text-gray-900 mb-2" >Enter your credit score: </label>
      <input type = "number" value = {creditScore} onChange = {handleCreditScoreChange} className="dz-title text-xl font-semibold text-gray-900 mb-2" /> <br></br>
      
      {/* Drag & Drop Area */}
      <div
        className={`dropzone border-2 border-dashed rounded-xl p-8 transition-all text-center ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-gray-400' // Adjusted highlight color
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <div className="text-center">
          <p className="dz-title text-xl font-semibold text-gray-800 mb-2"> {/* Adjusted text color */}
            Drag & drop your files here
          </p>
          <p className="dz-sub text-gray-600 mb-4">or</p> {/* Adjusted text color */}
          {/* Hidden file input, triggered by the "Browse device" button */}
          <input
            ref={inputRef}
            type="file"
            multiple // Allow multiple file selection
            className="hidden" // Hide the default input
            accept=".pdf, .docx, .xlsx, .csv, .jpg, .jpeg, .png" // Broadened accepted file types
            onChange={onBrowse} // Correct onChange handler
          />
          <button
            type="button" // Use type="button" to prevent form submission
            className="btn px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium" // Adjusted button color
            onClick={() => inputRef.current?.click()} // Programmatically click the hidden input
          >
            Browse device
          </button>
        </div>
      </div>

      {/* Progress / Errors / File List */}
      {progress > 0 && progress < 100 && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
      {showSuccess && (
        <p className="text-green-600 mt-2 text-center text-gray-800">Files processed successfully!</p>
      )}

      {errors.length > 0 && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <p className="font-bold">Errors:</p>
          <ul className="list-disc list-inside">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <p className="font-bold text-gray-800">Selected Files:</p> {/* Adjusted text color */}
          <ul className="list-disc list-inside text-gray-700"> {/* Adjusted text color */}
            {uploadedFiles.map((file, index) => (
              <li key={index}>{file.name} ({Math.round(file.size / 1024)} KB)</li> 
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between mt-6">
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" // Adjusted button color
        >
          Submit Upload
        </button>
      </div>
    </form>
  );
};

export default Form;