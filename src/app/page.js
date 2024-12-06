"use client"; // Enables client-side rendering

import { useState, useRef } from "react";

export default function AudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [error, setError] = useState(null);
  const [transcription, setTranscription] = useState(""); // State to store transcription
  const [loading, setLoading] = useState(false); // State to track loading
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      setError("Could not start recording: " + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const uploadAudio = async () => {
    if (!audioBlob) {
      setError("No audio to upload. Please record first.");
      return;
    }

    setLoading(true); // Start loading

    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");

    try {
      const res = await fetch("https://1be8-124-29-216-114.ngrok-free.app/upload-audio", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload audio");

      const data = await res.json();
      console.log("Response from server:", data); // Logs the response to the console

      if (data.transcription) {
        setTranscription(data.transcription); // Set the transcription from the server
      } else {
        alert("Transcription not found in the server response.");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Audio Recorder</h1>
      <div style={styles.buttons}>
        {recording ? (
          <button style={{ ...styles.button, ...styles.stopButton }} onClick={stopRecording}>
            Stop Recording
          </button>
        ) : (
          <button style={{ ...styles.button, ...styles.startButton }} onClick={startRecording}>
            Start Recording
          </button>
        )}
        <button
          style={{ ...styles.button, ...styles.uploadButton }}
          onClick={uploadAudio}
          disabled={!audioBlob || loading} // Disable button when loading or no audio
        >
          {loading ? (
            <span style={styles.loader}></span> // Display loader when loading
          ) : (
            "Upload Audio"
          )}
        </button>
      </div>
      {error && <p style={styles.error}>{error}</p>}
      {audioBlob && (
        <div style={styles.audioPreview}>
          <audio controls style={styles.audioPlayer}>
            <source src={URL.createObjectURL(audioBlob)} type="audio/webm" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
      {transcription && (
        <div style={styles.transcriptionContainer}>
          <h2 style={styles.transcriptionHeader}>Transcription:</h2>
          <p style={styles.transcription}>{transcription}</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    textAlign: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    maxWidth: "600px",
    margin: "50px auto",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  },
  header: {
    color: "#333",
    fontSize: "24px",
    marginBottom: "20px",
  },
  buttons: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "20px",
  },
  button: {
    padding: "10px 20px",
    fontSize: "16px",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.3s",
  },
  startButton: {
    backgroundColor: "#4caf50",
    color: "#fff",
  },
  stopButton: {
    backgroundColor: "#f44336",
    color: "#fff",
  },
  uploadButton: {
    backgroundColor: "#2196f3",
    color: "#fff",
  },
  error: {
    color: "#f44336",
    fontSize: "14px",
    marginTop: "10px",
  },
  audioPreview: {
    marginTop: "20px",
    textAlign: "center",
  },
  audioPlayer: {
    width: "100%",
    outline: "none",
  },
  transcriptionContainer: {
    marginTop: "20px",
    textAlign: "left",
    backgroundColor: "#f1f1f1",
    padding: "10px",
    borderRadius: "5px",
  },
  transcriptionHeader: {
    fontSize: "18px",
    fontWeight: "bold",
  },
  transcription: {
    fontSize: "16px",
    color: "#333",
  },
  loader: {
    border: "3px solid #f3f3f3", /* Light gray */
    borderTop: "3px solid #2196f3", /* Blue */
    borderRadius: "50%",
    width: "20px",
    height: "20px",
    animation: "spin 2s linear infinite",
    display: "inline-block",
  },

  "@keyframes spin": {
    "0%": {
      transform: "rotate(0deg)",
    },
    "100%": {
      transform: "rotate(360deg)",
    },
  },
};
