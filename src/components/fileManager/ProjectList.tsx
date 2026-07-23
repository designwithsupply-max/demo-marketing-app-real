import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2, Layers, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type GalleryViewItem } from "@/lib/imageService";

interface ProjectListProps {
    projects: GalleryViewItem[];
    loading: boolean;
    onDelete: (project: GalleryViewItem) => void;
    onAddImages: (project: GalleryViewItem) => void;
    onEdit: (project: GalleryViewItem) => void;
}

export default function ProjectList({ projects, loading, onDelete, onAddImages, onEdit }: ProjectListProps) {
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-brand-copper" />
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <Card className="p-12 text-center border-brand-border bg-white">
                <Layers className="w-12 h-12 mx-auto mb-4 text-brand-muted" />
                <p className="text-brand-muted mb-4">No gallery projects yet. Use the Gallery folder in the upload dialog to create one.</p>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-brand-muted px-1">
                <span>{projects.length} project(s)</span>
            </div>
            {projects.map((project) => (
                <Card key={project.id} className="p-4 border-brand-border bg-white">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-start gap-4 min-w-0">
                            {project.thumbnail && (
                                <img src={project.thumbnail} alt={project.title} className="w-16 h-16 rounded-lg object-cover border flex-shrink-0" />
                            )}
                            <div className="min-w-0 space-y-1">
                                <p className="font-medium text-brand-espresso break-words sm:truncate">{project.title}</p>
                                <p className="text-xs text-brand-muted break-words">/{project.slug}</p>
                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                    <Badge variant="secondary" className="text-[10px]">{project.category}</Badge>
                                    <Badge variant="outline" className="text-[10px] capitalize">{project.type}</Badge>
                                    <span className="text-xs text-brand-muted">{project.images.length} image(s)</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-1 shrink-0 w-full sm:w-auto border-t border-brand-border/70 pt-2 sm:border-t-0 sm:pt-0">
                            <Button variant="ghost" size="icon" onClick={() => onEdit(project)} className="h-8 w-8" title="Edit project">
                                <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => onAddImages(project)} className="h-8 text-xs gap-1">
                                <Plus className="w-3 h-3" /> Add Images
                            </Button>
                            {deleteConfirm === project.id ? (
                                <div className="flex items-center gap-1">
                                    <Button variant="destructive" size="sm" onClick={() => onDelete(project)} className="h-8 text-xs">Confirm</Button>
                                    <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)} className="h-8 text-xs">Cancel</Button>
                                </div>
                            ) : (
                                <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(project.id)} className="text-red-600 hover:text-red-700 h-8 w-8" title="Delete project">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}