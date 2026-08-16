import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Upload, Loader2, ChevronUp, ChevronDown, Save } from "lucide-react";
import { type GalleryViewItem } from "@/lib/imageService";
import { FOLDER_OPTIONS, TYPE_OPTIONS } from "./types";

interface UploadDialogProps {
    targetProject?: GalleryViewItem | null;
    dialogMode?: "edit" | "add-images";
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pendingFilesArray: File[];
    selectedFolder: string;
    onFolderChange: (val: string) => void;
    uploading: boolean;
    onConfirm: () => void;
    onSaveEdit?: () => void;
    getFolderStats: (folder: string) => { count: number };
    uploadTitle: string; onTitleChange: (v: string) => void;
    uploadType: string; onTypeChange: (v: string) => void;
    uploadDescription: string; onDescChange: (v: string) => void;
    pendingBeforeFile: File | null; onBeforeChange: (f: File | null) => void;
    pendingAfterFile: File | null; onAfterChange: (f: File | null) => void;
    uploadSlug: string; onSlugChange: (v: string) => void;
    uploadCategory: string; onCategoryChange: (v: string) => void;
    uploadTags: string; onTagsChange: (v: string) => void;
    uploadCity: string; onCityChange: (v: string) => void;
    uploadClientNeeded: string; onClientNeededChange: (v: string) => void;
    uploadWhatWeDesigned: string; onWhatWeDesignedChange: (v: string) => void;
    uploadMainFeatures: string; onMainFeaturesChange: (v: string) => void;
    thumbnailIndex: number; onThumbChange: (i: number) => void;
    perImageSpecs: string[]; onSpecChange: (idx: number, v: string) => void;
    existingImages?: GalleryViewItem["images"];
    onReorderImage?: (fromIndex: number, toIndex: number) => void;
}

const formatSize = (bytes: number) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export default function UploadDialog(props: UploadDialogProps) {
    const {
        targetProject, dialogMode, open, onOpenChange, pendingFilesArray, selectedFolder, onFolderChange,
        uploading, onConfirm, onSaveEdit, getFolderStats,
        uploadTitle, onTitleChange, uploadType, onTypeChange, uploadDescription, onDescChange,
        pendingBeforeFile, onBeforeChange, pendingAfterFile, onAfterChange,
        uploadSlug, onSlugChange, uploadCategory, onCategoryChange, uploadTags, onTagsChange,
        uploadCity, onCityChange, uploadClientNeeded, onClientNeededChange,
        uploadWhatWeDesigned, onWhatWeDesignedChange, uploadMainFeatures, onMainFeaturesChange,
        thumbnailIndex, onThumbChange, perImageSpecs, onSpecChange,
        existingImages, onReorderImage,
    } = props;

    const isEdit = dialogMode === "edit";
    const isAddImages = dialogMode === "add-images";
    const isNormal = !dialogMode;

    const title = isEdit ? `Edit "${targetProject?.title}"` : isAddImages ? `Add Images to "${targetProject?.title}"` : "Upload Files";
    const desc = isEdit
        ? "Edit project metadata and reorder images below."
        : isAddImages
            ? "Select images and set titles to add them to this project."
            : `Select a folder, then fill in the details for ${pendingFilesArray.length} file(s)`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-brand-cream border-brand-border">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{desc}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    {/* Folder Selection — normal mode only */}
                    {isNormal && (
                        <div className="space-y-2">
                            <Label>Folder *</Label>
                            <Select value={selectedFolder} onValueChange={onFolderChange}>
                                <SelectTrigger><SelectValue placeholder="Select folder" /></SelectTrigger>
                                <SelectContent>
                                    {FOLDER_OPTIONS.map((opt) => {
                                        const stats = getFolderStats(opt.value);
                                        return (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                <span className="flex items-center gap-2">{opt.label}<span className="text-brand-muted text-xs">({stats.count} files)</span></span>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Existing images (reorder) — for edit and add-images modes */}
                    {(isEdit || isAddImages) && existingImages && existingImages.length > 0 && (
                        <div className="space-y-2">
                            <Label>Current Images ({existingImages.length})</Label>
                            <div className="space-y-1 max-h-48 overflow-y-auto border rounded-lg p-2">
                                {existingImages.map((img, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-1.5 rounded bg-brand-sand/20">
                                        <div className="flex flex-col">
                                            <button className="p-0.5 hover:text-brand-copper disabled:opacity-30" disabled={idx === 0} onClick={() => onReorderImage?.(idx, idx - 1)} title="Move up"><ChevronUp className="w-3 h-3" /></button>
                                            <button className="p-0.5 hover:text-brand-copper disabled:opacity-30" disabled={idx === existingImages.length - 1} onClick={() => onReorderImage?.(idx, idx + 1)} title="Move down"><ChevronDown className="w-3 h-3" /></button>
                                        </div>
                                        <img src={img.src} alt={img.title} className="w-10 h-10 rounded object-cover border flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-medium truncate">{img.title}</p>
                                            {img.spec && <p className="text-[10px] text-brand-muted truncate">{img.spec}</p>}
                                        </div>
                                        <span className="text-[10px] text-brand-muted shrink-0">#{idx + 1}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Edit mode: show all gallery text fields */}
                    {isEdit && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="upload-title">Project Title *</Label>
                                <Input id="upload-title" placeholder="e.g. The Belmont Walk-in" value={uploadTitle} onChange={(e) => onTitleChange(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="upload-slug">URL Slug *</Label>
                                    <Input id="upload-slug" placeholder="e.g. belmont-walk-in" value={uploadSlug} onChange={(e) => onSlugChange(e.target.value.replace(/\s+/g, '-').toLowerCase())} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Input placeholder="e.g. Walk-in Closets" value={uploadCategory} onChange={(e) => onCategoryChange(e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={uploadType} onValueChange={onTypeChange}>
                                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                    <SelectContent>
                                        {TYPE_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="upload-tags">Tags (comma separated)</Label>
                                <Input id="upload-tags" placeholder="e.g. Oak, Marble, LED Lighting" value={uploadTags} onChange={(e) => onTagsChange(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="upload-description">Project Description</Label>
                                <Textarea id="upload-description" placeholder="e.g. A stunning walk-in closet..." value={uploadDescription} onChange={(e) => onDescChange(e.target.value)} rows={3} />
                            </div>
                            <ProjectDetailFields
                                uploadCity={uploadCity} onCityChange={onCityChange}
                                uploadClientNeeded={uploadClientNeeded} onClientNeededChange={onClientNeededChange}
                                uploadWhatWeDesigned={uploadWhatWeDesigned} onWhatWeDesignedChange={onWhatWeDesignedChange}
                                uploadMainFeatures={uploadMainFeatures} onMainFeaturesChange={onMainFeaturesChange}
                            />
                        </>
                    )}

                    {/* Normal gallery — new project with all fields */}
                    {isNormal && selectedFolder === "gallery" && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="upload-title">Project Title *</Label>
                                <Input id="upload-title" placeholder="e.g. The Belmont Walk-in" value={uploadTitle} onChange={(e) => onTitleChange(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="upload-slug">URL Slug *</Label>
                                    <Input id="upload-slug" placeholder="e.g. belmont-walk-in" value={uploadSlug} onChange={(e) => onSlugChange(e.target.value.replace(/\s+/g, '-').toLowerCase())} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Input placeholder="e.g. Walk-in Closets" value={uploadCategory} onChange={(e) => onCategoryChange(e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Type *</Label>
                                <Select value={uploadType} onValueChange={onTypeChange}>
                                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                    <SelectContent>{TYPE_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="upload-tags">Tags (comma separated)</Label>
                                <Input id="upload-tags" placeholder="e.g. Oak, Marble, LED Lighting" value={uploadTags} onChange={(e) => onTagsChange(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="upload-description">Project Description</Label>
                                <Textarea id="upload-description" placeholder="e.g. A stunning walk-in closet..." value={uploadDescription} onChange={(e) => onDescChange(e.target.value)} rows={3} />
                            </div>
                            <ProjectDetailFields
                                uploadCity={uploadCity} onCityChange={onCityChange}
                                uploadClientNeeded={uploadClientNeeded} onClientNeededChange={onClientNeededChange}
                                uploadWhatWeDesigned={uploadWhatWeDesigned} onWhatWeDesignedChange={onWhatWeDesignedChange}
                                uploadMainFeatures={uploadMainFeatures} onMainFeaturesChange={onMainFeaturesChange}
                            />
                            {pendingFilesArray.length > 0 && <ImagePreviewList pendingFilesArray={pendingFilesArray} perImageSpecs={perImageSpecs} onSpecChange={onSpecChange} thumbnailIndex={thumbnailIndex} onThumbChange={onThumbChange} />}
                        </>
                    )}

                    {/* Add-images mode — show image upload section */}
                    {isAddImages && pendingFilesArray.length > 0 && <ImagePreviewList pendingFilesArray={pendingFilesArray} perImageSpecs={perImageSpecs} onSpecChange={onSpecChange} thumbnailIndex={thumbnailIndex} onThumbChange={onThumbChange} />}

                    {/* Normal service mode */}
                    {isNormal && selectedFolder === "service" && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="upload-title">Service Title *</Label>
                                <Input id="upload-title" placeholder="e.g. Kitchen Cabinets" value={uploadTitle} onChange={(e) => onTitleChange(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Category *</Label>
                                <Select value={uploadType} onValueChange={onTypeChange}>
                                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                    <SelectContent>{TYPE_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            {pendingFilesArray.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Image Preview</Label>
                                    <div className="rounded-lg border overflow-hidden bg-brand-sand-light">
                                        <img src={URL.createObjectURL(pendingFilesArray[0])} alt="Preview" className="w-full h-48 object-cover" />
                                    </div>
                                    <p className="text-xs text-brand-muted">{pendingFilesArray[0].name} ({formatSize(pendingFilesArray[0].size)})</p>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="upload-description">Description</Label>
                                <Textarea id="upload-description" placeholder="Describe the service features..." value={uploadDescription} onChange={(e) => onDescChange(e.target.value)} rows={4} />
                            </div>
                        </>
                    )}

                    {/* Normal before/after mode */}
                    {isNormal && selectedFolder === "before-after" && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="upload-title">Title *</Label>
                                <Input id="upload-title" placeholder="e.g. Kitchen Renovation" value={uploadTitle} onChange={(e) => onTitleChange(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Type *</Label>
                                <Select value={uploadType} onValueChange={onTypeChange}>
                                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                    <SelectContent>{TYPE_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="space-y-2">
                                    <Label>Before Image *</Label>
                                    <div className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-brand-sand-light/50 overflow-hidden relative" onClick={() => document.getElementById('before-file-input')?.click()}>
                                        {pendingBeforeFile ? <img src={URL.createObjectURL(pendingBeforeFile)} className="absolute inset-0 w-full h-full object-cover" alt="Before preview" /> : <><Upload className="w-6 h-6 text-brand-muted" /><span className="text-xs text-brand-muted font-medium">Select Before</span></>}
                                    </div>
                                    <input id="before-file-input" type="file" accept="image/*" className="hidden" onChange={(e) => onBeforeChange(e.target.files?.[0] || null)} />
                                    {pendingBeforeFile && <p className="text-[10px] text-brand-muted truncate">{pendingBeforeFile.name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>After Image *</Label>
                                    <div className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-brand-sand-light/50 overflow-hidden relative" onClick={() => document.getElementById('after-file-input')?.click()}>
                                        {pendingAfterFile ? <img src={URL.createObjectURL(pendingAfterFile)} className="absolute inset-0 w-full h-full object-cover" alt="After preview" /> : <><Upload className="w-6 h-6 text-brand-muted" /><span className="text-xs text-brand-muted font-medium">Select After</span></>}
                                    </div>
                                    <input id="after-file-input" type="file" accept="image/*" className="hidden" onChange={(e) => onAfterChange(e.target.files?.[0] || null)} />
                                    {pendingAfterFile && <p className="text-[10px] text-brand-muted truncate">{pendingAfterFile.name}</p>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="upload-description">Description</Label>
                                <Textarea id="upload-description" placeholder="e.g. Full kitchen overhaul with custom cabinetry" value={uploadDescription} onChange={(e) => onDescChange(e.target.value)} rows={2} />
                            </div>
                        </>
                    )}

                    {/* Normal — other folders */}
                    {isNormal && selectedFolder !== "service" && selectedFolder !== "gallery" && selectedFolder !== "before-after" && (
                        <>
                            <div className="space-y-2"><Label htmlFor="upload-title">Title</Label><Input id="upload-title" placeholder="Enter a title..." value={uploadTitle} onChange={(e) => onTitleChange(e.target.value)} /></div>
                            <div className="space-y-2"><Label htmlFor="upload-description">Description</Label><Textarea id="upload-description" placeholder="Enter a description..." value={uploadDescription} onChange={(e) => onDescChange(e.target.value)} rows={3} /></div>
                            <div className="rounded-md border p-3 max-h-32 overflow-auto space-y-1"><p className="text-xs font-medium text-brand-muted mb-1">Selected file(s):</p>{pendingFilesArray.map((file, i) => (<div key={i} className="flex items-center gap-2 text-sm"><span className="truncate">{file.name}</span><span className="text-brand-muted text-xs shrink-0">({formatSize(file.size)})</span></div>))}</div>
                        </>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        {isEdit ? (
                            <Button onClick={onSaveEdit} disabled={uploading || !uploadTitle.trim()}>
                                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Save Changes
                            </Button>
                        ) : (
                            <Button onClick={onConfirm} disabled={uploading || pendingFilesArray.length === 0 || (isNormal && (selectedFolder === "service" || selectedFolder === "gallery") && !uploadTitle.trim()) || (isNormal && selectedFolder === "before-after" && (!uploadTitle.trim() || !pendingBeforeFile || !pendingAfterFile))}>
                                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                {isAddImages ? "Add to Project" : selectedFolder === "before-after" ? "Upload Comparison" : `Upload ${pendingFilesArray.length} file(s)`}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ProjectDetailFields({
    uploadCity, onCityChange, uploadClientNeeded, onClientNeededChange,
    uploadWhatWeDesigned, onWhatWeDesignedChange, uploadMainFeatures, onMainFeaturesChange,
}: {
    uploadCity: string; onCityChange: (v: string) => void;
    uploadClientNeeded: string; onClientNeededChange: (v: string) => void;
    uploadWhatWeDesigned: string; onWhatWeDesignedChange: (v: string) => void;
    uploadMainFeatures: string; onMainFeaturesChange: (v: string) => void;
}) {
    return (
        <>
            <div className="space-y-2">
                <Label htmlFor="upload-city">City / Location</Label>
                <Input id="upload-city" placeholder="e.g. Laval, QC" value={uploadCity} onChange={(e) => onCityChange(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="upload-client-needed">What the Client Needed</Label>
                <Textarea id="upload-client-needed" placeholder="e.g. More hanging space and better shoe storage in a small walk-in." value={uploadClientNeeded} onChange={(e) => onClientNeededChange(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="upload-what-designed">What We Designed</Label>
                <Textarea id="upload-what-designed" placeholder="e.g. A floor-to-ceiling oak system with a dedicated shoe wall and LED shelving." value={uploadWhatWeDesigned} onChange={(e) => onWhatWeDesignedChange(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="upload-main-features">Main Features (comma separated)</Label>
                <Input id="upload-main-features" placeholder="e.g. LED Shelving, Soft-Close Drawers, Custom Shoe Wall" value={uploadMainFeatures} onChange={(e) => onMainFeaturesChange(e.target.value)} />
            </div>
        </>
    );
}

function ImagePreviewList({ pendingFilesArray, perImageSpecs, onSpecChange, thumbnailIndex, onThumbChange }: { pendingFilesArray: File[]; perImageSpecs: string[]; onSpecChange: (idx: number, v: string) => void; thumbnailIndex: number; onThumbChange: (i: number) => void; }) {
    return (
        <div className="space-y-2">
            <Label>Images ({pendingFilesArray.length})</Label>
            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
                {pendingFilesArray.map((file, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2 rounded bg-brand-sand/30">
                        <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden border"><img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" /></div>
                        <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-xs font-medium truncate">{file.name}</p>
                            <Input placeholder="Image title" className="h-7 text-xs" value={perImageSpecs[idx] || ''} onChange={(e) => onSpecChange(idx, e.target.value)} />
                            <label className="flex items-center gap-2 text-xs text-brand-muted"><input type="radio" name="thumbnail-index" checked={thumbnailIndex === idx} onChange={() => onThumbChange(idx)} />Set as project thumbnail</label>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}