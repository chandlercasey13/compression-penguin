const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
}

export async function getUploadUrl(filename, contentType) {
  return request("/upload-url", {
    method: "POST",
    body: JSON.stringify({ filename, contentType }),
  });
}

export async function uploadFileToS3(uploadUrl, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);

    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(file);
  });
}

export async function createJob(jobId, filename, inputKey, conversionType) {
  return request("/jobs", {
    method: "POST",
    body: JSON.stringify({ jobId, filename, inputKey, conversionType }),
  });
}

export async function getJobStatus(jobId) {
  return request(`/jobs/${jobId}`);
}

export async function getDownloadUrl(jobId) {
  return request(`/jobs/${jobId}/download`);
}

export async function getConversionTypes() {
  return request("/conversion-types");
}
