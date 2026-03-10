import React, { useRef } from 'react';

interface ImageUploaderProps {
  onFilesSelected: (files: FileList) => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onFilesSelected, disabled = false, label, hint }) => {
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
      className={`relative group border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 overflow-hidden ${
        disabled 
          ? 'border-zinc-200 bg-zinc-50 cursor-not-allowed' 
          : 'border-zinc-300 hover:border-zinc-900 hover:bg-zinc-50/50 bg-white'
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br from-zinc-100/50 to-transparent opacity-0 transition-opacity duration-300 ${!disabled && 'group-hover:opacity-100'}`} />
      
      <input
        type="file"
        multiple
        accept="image/png, image/jpeg, image/webp, image/gif"
        ref={fileInputRef}
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
      
      <div className="relative z-10 flex flex-col items-center">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors ${disabled ? 'bg-zinc-100 text-zinc-400' : 'bg-zinc-100 text-zinc-600 group-hover:bg-zinc-900 group-hover:text-white'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-zinc-900 text-center font-semibold text-base mb-1">
          {label || 'Select images to upload'}
        </p>
        <p className="text-zinc-500 text-sm text-center">
          or drag and drop here
        </p>
        <p className="text-zinc-400 text-xs mt-4 text-center font-medium uppercase tracking-wider">
          {hint || 'JPG, PNG, WEBP up to 10MB'}
        </p>
      </div>
    </div>
  );
};
