import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Copy, Download, Trash2, FileIcon, ImageIcon, VideoIcon, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type FileManagerFile, FOLDER_OPTIONS } from "./types";

function getFileIcon(file: FileManagerFile) {
    if (file.folder === "gallery" || file.folder === "service" || file.folder === "before-after" || file.resource_type === "image") {
        return <ImageIcon className="w-5 h-5 text-blue-500" />;
    }
    if (file.resource_type === "video") return <VideoIcon className="w-5 h-5 text-purple-500" />;
    return <FileIcon className="w-5 h-5 text-brand-muted" />;
}

interface FileListProps {
    files: FileManagerFile[];
    loading: boolean;
    page: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPreview: (file: FileManagerFile) => void;
    onCopyUrl: (url: string) => void;
    onDelete: (file: FileManagerFile) => void;
}

export default function FileList({ files, loading, page, pageSize, onPageChange, onPreview, onCopyUrl, onDelete }: FileListProps) {
    const totalPages = Math.max(1, Math.ceil(files.length / pageSize));
    const paged = files.slice(page * pageSize, (page + 1) * pageSize);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-brand-copper" />
            </div>
        );
    }

    if (files.length === 0) {
        return (
            <Card className="p-12 text-center border-brand-border bg-white">
                <FileIcon className="w-12 h-12 mx-auto mb-4 text-brand-muted" />
                <p className="text-brand-muted">No files yet. Upload your first file to Supabase Storage.</p>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-brand-muted px-1">
                <span>{files.length} file(s) total</span>
            </div>
            {paged.map((file) => (
                <Card key={file.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-brand-border bg-white">
                    <div className="flex items-start gap-3 min-w-0">
                        <span className="mt-0.5 shrink-0">{getFileIcon(file)}</span>
                        <div className="min-w-0 space-y-1">
                            <p className="text-sm font-medium break-words sm:truncate">{file.original_name || file.public_id}</p>
                            <div className="flex flex-wrap items-center gap-1.5">
                                {file.folder && (
                                    <Badge variant="secondary" className="text-xs shrink-0">
                                        {FOLDER_OPTIONS.find((f) => f.value === file.folder)?.label || file.folder}
                                    </Badge>
                                )}
                                {file.type && file.type !== "image" && (
                                    <Badge variant="outline" className="text-[10px] shrink-0 capitalize">{file.type}</Badge>
                                )}
                                <span className="text-xs text-brand-muted">{new Date(file.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-1 shrink-0 w-full sm:w-auto border-t border-brand-border/70 pt-2 sm:border-t-0 sm:pt-0">
                        {(file.resource_type === "image" || file.resource_type === "video") && (
                            <Button variant="ghost" size="icon" onClick={() => onPreview(file)} title="Preview"><Eye className="w-4 h-4" /></Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => onCopyUrl(file.url)} title="Copy URL"><Copy className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => window.open(file.url, "_blank")} title="Open in new tab"><Download className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(file)} className="text-red-600 hover:text-red-700" title="Delete"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                </Card>
            ))}

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                    <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(0, page - 1))} disabled={page === 0} className="h-8 text-xs">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                    </Button>
                    <span className="text-sm text-brand-muted">Page {page + 1} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="h-8 text-xs">
                        Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            )}
        </div>
    );
}