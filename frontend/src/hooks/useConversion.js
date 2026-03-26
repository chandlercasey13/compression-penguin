import { useState, useCallback, useRef, useEffect } from "react";
import {
  getUploadUrl,
  uploadFileToS3,
  createJob,
  getJobStatus,
  getDownloadUrl,
} from "../lib/api.js";

const POLL_INTERVAL = 2000;
const CONVERSION_TYPE = "image-to-webp";

export function useConversion() {
  const [file, setFile] = useState(null);
  const [phase, setPhase] = useState("idle"); // idle | uploading | processing | completed | error
  const [uploadProgress, setUploadProgress] = useState(0);
  const [job, setJob] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const reset = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    setFile(null);
    setPhase("idle");
    setUploadProgress(0);
    setJob(null);
    setDownloadUrl(null);
    setError(null);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const startPolling = useCallback((jobId) => {
    pollRef.current = setInterval(async () => {
      try {
        const { job: updatedJob } = await getJobStatus(jobId);
        setJob(updatedJob);

        if (updatedJob.status === "COMPLETED") {
          stopPolling();
          setPhase("completed");
          const { downloadUrl: url } = await getDownloadUrl(jobId);
          setDownloadUrl(url);
        } else if (updatedJob.status === "FAILED") {
          stopPolling();
          setPhase("error");
          setError(updatedJob.error || "Compression failed");
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, POLL_INTERVAL);
  }, [stopPolling]);

  const submit = useCallback(async () => {
    if (!file) return;

    try {
      setError(null);
      setPhase("uploading");
      setUploadProgress(0);

      const { uploadUrl, key, jobId } = await getUploadUrl(file.name, file.type || "application/octet-stream");

      await uploadFileToS3(uploadUrl, file, setUploadProgress);

      setPhase("processing");
      const { job: newJob } = await createJob(jobId, file.name, key, CONVERSION_TYPE);
      setJob(newJob);

      startPolling(jobId);
    } catch (err) {
      setPhase("error");
      setError(err.message);
    }
  }, [file, startPolling]);

  return {
    file,
    setFile,
    phase,
    uploadProgress,
    job,
    downloadUrl,
    error,
    submit,
    reset,
  };
}
