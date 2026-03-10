import React, { useRef } from 'react';

interface ImageUploaderProps {
  onFilesSelected: (files: FileList) => void;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onFilesSelected, disabled = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
    // Reset input so the same files can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${
        disabled ? 'border-gray-300 bg-gray-50 cursor-not-allowed' : 'border-blue-400 hover:border-blue-600 hover:bg-blue-50 bg-white'
      }`}
    >
      <input
        type="file"
        multiple
        accept="image/png, image/jpeg, image/webp, image/gif"
        ref={fileInputRef}
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
      <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      <p className="text-gray-600 text-center font-medium">
        Click or drag and drop images here
      </p>
      <p className="text-gray-400 text-sm mt-2 text-center">
        Supports JPG, PNG, WEBP, GIF (Max 4 images, 10MB each)
      </p>
    </div>
  );
};
