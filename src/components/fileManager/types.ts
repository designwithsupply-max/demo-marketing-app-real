export interface FileManagerFile {
    id: string;
    url: string;
    public_id: string;
    folder: string | null;
    created_at: string;
    resource_type?: string | null;
    original_name?: string | null;
    uploaded_by?: string;
    title?: string | null;
    type?: string | null;
    description?: string | null;
}

export interface UploadProgress {
    fileName: string;
    progress: number;
    status: "pending" | "uploading" | "success" | "error";
    error?: string;
}

export const FOLDER_OPTIONS = [
    { value: "service", label: "Service Images" },
    { value: "gallery", label: "Gallery Images" },
    { value: "before-after", label: "Before & After Images" }
];

export const TYPE_OPTIONS = [
    { value: "closet", label: "Closets" },
    { value: "kitchen", label: "Kitchens" },
    { value: "garage", label: "Garage Cabinets" },
    { value: "other", label: "Others" },
];

export const MAX_FILE_SIZE = 100 * 1024 * 1024;
export const MAX_FILES_PER_UPLOAD = 20;