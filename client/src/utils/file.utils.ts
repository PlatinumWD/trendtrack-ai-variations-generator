export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES = 4;

export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { isValid: false, error: `File type ${file.type} is not allowed.` };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: `File size exceeds 10MB limit.` };
  }
  
  return { isValid: true };
};
