"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { decodeQr } from "@/lib/tickets/qr-decode";

const MAX_SIDE = 1000;

// Two ways to read a ticket QR: the camera, or a picture from the device.
// When a code is found, onCode is called with its text.
export function QrReader({ onCode }: { onCode: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const onCodeRef = useRef(onCode);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    onCodeRef.current = onCode;
  }, [onCode]);

  // Switch the camera off if the page is left while it is on.
  useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function stopCamera() {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  }

  async function startCamera() {
    setMessage(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage("The camera is not available here. It needs HTTPS or localhost.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();
      setScanning(true);

      const tick = () => {
        const canvas = canvasRef.current;
        if (!canvas || !videoRef.current) return;
        const current = videoRef.current;

        if (current.readyState >= 2 && current.videoWidth > 0) {
          canvas.width = current.videoWidth;
          canvas.height = current.videoHeight;
          const context = canvas.getContext("2d", { willReadFrequently: true });
          if (context) {
            context.drawImage(current, 0, 0, canvas.width, canvas.height);
            const image = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = decodeQr(image.data, image.width, image.height);
            if (code) {
              stopCamera();
              onCodeRef.current(code);
              return;
            }
          }
        }
        frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
    } catch {
      setMessage("Could not open the camera. Allow camera access, or upload a picture instead.");
    }
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setMessage(null);

    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("no canvas");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();

      const image = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = decodeQr(image.data, image.width, image.height);
      if (code) {
        onCodeRef.current(code);
      } else {
        setMessage("No QR code was found in that picture. Try a clearer one.");
      }
    } catch {
      setMessage("That file could not be read as a picture.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {scanning ? (
          <button type="button" onClick={stopCamera} className="btn btn-outline">
            Stop camera
          </button>
        ) : (
          <button type="button" onClick={startCamera} className="btn btn-outline">
            Scan with camera
          </button>
        )}
        <label className="btn btn-outline cursor-pointer">
          Upload QR picture
          <input type="file" accept="image/*" onChange={onFile} className="sr-only" />
        </label>
      </div>

      <video
        ref={videoRef}
        muted
        playsInline
        className={scanning ? "border-line w-full max-w-sm rounded-xl border" : "hidden"}
      />
      <canvas ref={canvasRef} className="hidden" />

      {message ? (
        <p role="alert" className="alert-warning">
          {message}
        </p>
      ) : null}
    </div>
  );
}
