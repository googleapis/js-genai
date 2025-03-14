import {File as GenAIFile} from '@google/genai';
import React, {useCallback, useRef, useState} from 'react';

interface ImageUploadProps {
  onUploadSuccess?: (response: GenAIFile) => void;
  onUploadError?: (error: Error) => void;
  ai: any;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  ai,
}) => {
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setFileToUpload(file);
      setPreviewImageUrl(URL.createObjectURL(file));
      setUploadedImageUrl(null);
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      setFileToUpload(file);
      setPreviewImageUrl(URL.createObjectURL(file));
      setUploadedImageUrl(null);
    }
  }, []);

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
    },
    [],
  );

  const handleUpload = async () => {
    if (!fileToUpload) return;

    setIsUploading(true);
    try {
      const response = await ai.files.upload({file: fileToUpload});
      setIsUploading(false);

      if (response && response.url) {
        setUploadedImageUrl(response.url);
      }

      if (onUploadSuccess) {
        onUploadSuccess(response);
      }
    } catch (error) {
      setIsUploading(false);
      if (onUploadError) {
        if (error instanceof Error) {
          onUploadError(error);
        } else {
          onUploadError(new Error('An unknown error occurred during upload.'));
        }
      }
      console.error('Upload error:', error);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{
        border: '2px dashed #ccc',
        padding: '20px',
        textAlign: 'center',
        cursor: 'pointer',
      }}>
      {previewImageUrl ? ( // Show preview if available
        <div>
          <img
            src={previewImageUrl}
            alt="Preview"
            style={{maxWidth: '300px', maxHeight: '300px'}}
          />
          {isUploading ? ( // Show uploading indicator if uploading
            <div className="d-flex justify-content-center align-items-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <span className="ms-2">Uploading...</span>
            </div>
          ) : uploadedImageUrl ? ( // Show uploaded image if available
            <div>
              <p>Image uploaded successfully!</p>
              <button
                className="btn btn-secondary mt-2"
                onClick={() => {
                  setUploadedImageUrl(null);
                  setPreviewImageUrl(null);
                }}>
                Upload new Image
              </button>
            </div>
          ) : (
            // Show upload button if not uploading and no uploaded image
            <div>
              <p>File: {fileToUpload?.name}</p>
              <button className="btn btn-primary" onClick={handleUpload}>
                Upload
              </button>
            </div>
          )}
        </div>
      ) : (
        // Show file selection if no preview
        <div>
          <p>Drag and drop an image here, or click to select a file.</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{display: 'none'}}
          />
          <button
            className="btn btn-outline-secondary"
            onClick={() => fileInputRef.current?.click()}>
            Select File
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
