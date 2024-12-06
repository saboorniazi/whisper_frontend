import { useState, useRef } from "react";

export default function RecordAudio() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

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

    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");

    try {
      const res = await fetch("http://127.0.0.1:8000/upload-audio", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload audio");

      const data = await res.json();
      setResponse(data.message);
      setError(null);
    } catch (err) {
      setError(err.message);
      setResponse(null);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Record and Upload Audio</h1>
      {recording ? (
        <button onClick={stopRecording}>Stop Recording</button>
      ) : (
        <button onClick={startRecording}>Start Recording</button>
      )}
      <button onClick={uploadAudio} disabled={!audioBlob}>
        Upload Audio
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {response && <p style={{ color: "green" }}>Response: {response}</p>}
    </div>
  );
}