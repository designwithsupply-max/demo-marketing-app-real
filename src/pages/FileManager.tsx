import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Session } from "@supabase/supabase-js";
import {
  imageService,
  IMAGE_FOLDERS,
  type GalleryViewItem,
} from "@/lib/imageService";
import AdminTopBar from "@/components/layout/AdminTopBar";
import FileList from "@/components/fileManager/FileList";
import UploadDialog from "@/components/fileManager/UploadDialog";
import ProjectList from "@/components/fileManager/ProjectList";
import { BeforeAfterManager } from "@/components/admin/BeforeAfterManager";
import { VideoManager } from "@/components/admin/VideoManager";
import {
  type FileManagerFile,
  type UploadProgress,
  FOLDER_OPTIONS,
  MAX_FILE_SIZE,
  MAX_FILES_PER_UPLOAD,
  TYPE_OPTIONS,
} from "@/components/fileManager/types";

const PAGE_SIZE = 20;

const FileManager = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileManagerFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileManagerFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState("");
  const [previewName, setPreviewName] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("service");
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [pendingFilesArray, setPendingFilesArray] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState<FileManagerFile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState("closet");
  const [uploadDescription, setUploadDescription] = useState("");
  const [pendingBeforeFile, setPendingBeforeFile] = useState<File | null>(null);
  const [pendingAfterFile, setPendingAfterFile] = useState<File | null>(null);
  const [uploadSlug, setUploadSlug] = useState("");
  const [uploadCategory, setUploadCategory] = useState("Walk-in Closets");
  const [uploadTags, setUploadTags] = useState("");
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const [perImageSpecs, setPerImageSpecs] = useState<string[]>([]);
  const [projects, setProjects] = useState<GalleryViewItem[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [targetProject, setTargetProject] = useState<GalleryViewItem | null>(
    null,
  );
  const [dialogMode, setDialogMode] = useState<
    "edit" | "add-images" | undefined
  >(undefined);

  // ---- Auth ----
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) setTimeout(() => navigate("/auth"), 0);
      else setTimeout(() => checkAdminRole(session.user.id), 0);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) navigate("/auth");
      else checkAdminRole(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
      if (!data) {
        toast.error("Access denied.");
        setTimeout(() => navigate("/"), 1000);
      }
    } catch {
      setIsAdmin(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  const fetchFiles = useCallback(async (showToast = false) => {
    setLoading(true);
    try {
      const tables = [
        { name: "gallery", mapField: "image_url", folder: "gallery" },
        { name: "services", mapField: "image_url", folder: "service" },
      ] as const;
      const results = await Promise.all(
        tables.map(async ({ name, mapField, folder }) => {
          try {
            const { data } = await supabase
              .from(name as any)
              .select("*")
              .order("created_at", { ascending: false });
            return (data || []).map((item: any) => ({
              id: item.id,
              url: item[mapField],
              public_id: item.public_id,
              original_name: item.title,
              folder,
              created_at: item.created_at,
              title: item.title,
              type: item.type,
              resource_type: "image",
              description: item.description,
            }));
          } catch {
            return [];
          }
        }),
      );
      let baData: any[] = [];
      try {
        const { data } = await supabase
          .from("before_after")
          .select("*")
          .order("created_at", { ascending: false });
        baData = data || [];
      } catch {}
      const baFiles: FileManagerFile[] = baData.flatMap((item) => [
        {
          id: `${item.id}-before`,
          url: item.before_image_url,
          public_id: item.before_public_id,
          original_name: `Before: ${item.title}`,
          folder: "before-after",
          created_at: item.created_at,
          title: item.title,
          type: item.type,
          resource_type: "image",
          description: item.description,
        },
        {
          id: `${item.id}-after`,
          url: item.after_image_url,
          public_id: item.after_public_id,
          original_name: `After: ${item.title}`,
          folder: "before-after",
          created_at: item.created_at,
          title: item.title,
          type: item.type,
          resource_type: "image",
          description: item.description,
        },
      ]);
      const all = [...results[0], ...results[1], ...baFiles].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      setFiles(all);
      if (showToast) toast.success("Files refreshed");
    } catch {
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      setProjects(await imageService.fetchGalleryProjects());
    } catch (err) {
      console.error(err);
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    let filtered = [...files];
    if (activeTab !== "all" && activeTab !== "projects")
      filtered = filtered.filter((f) => f.folder === activeTab);
    if (typeFilter !== "all")
      filtered = filtered.filter(
        (f) => (f.type || "").toLowerCase() === typeFilter,
      );
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.original_name?.toLowerCase().includes(term) ||
          f.public_id.toLowerCase().includes(term) ||
          f.folder?.toLowerCase().includes(term),
      );
    }
    setFilteredFiles(filtered);
  }, [files, activeTab, searchTerm, typeFilter]);

  useEffect(() => {
    if (isAdmin && session) {
      fetchFiles();
      fetchProjects();
    }
  }, [isAdmin, session, fetchFiles, fetchProjects]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles?.length) return;
    const filesArray = Array.from(selectedFiles);
    const errors: string[] = [];
    const valid: File[] = [];
    if (filesArray.length > MAX_FILES_PER_UPLOAD)
      errors.push(`Max ${MAX_FILES_PER_UPLOAD} files`);
    filesArray.forEach((f) =>
      f.size > MAX_FILE_SIZE
        ? errors.push(`${f.name} exceeds 100MB`)
        : valid.push(f),
    );
    if (errors.length) {
      setUploadErrors(errors);
      toast.error(`${errors.length} file(s) rejected`);
    }
    if (valid.length) {
      setPendingFilesArray(valid);
      setUploadTitle("");
      setUploadType("closet");
      setUploadDescription("");
      if (!dialogMode) {
        setSelectedFolder("service");
      }
      setShowFolderDialog(true);
      setUploadProgress(
        valid.map((f) => ({
          fileName: f.name,
          progress: 0,
          status: "pending" as const,
        })),
      );
    }
    e.target.value = "";
  };

  const handleUploadConfirm = async () => {
    if (
      selectedFolder === "before-after" &&
      (!pendingBeforeFile || !pendingAfterFile || !uploadTitle.trim())
    ) {
      toast.error("Title + both images required");
      return;
    }
    if (pendingFilesArray.length === 0) return;
    setShowFolderDialog(false);
    setUploading(true);
    setUploadErrors([]);
    try {
      if (
        selectedFolder === "before-after" &&
        pendingBeforeFile &&
        pendingAfterFile
      ) {
        await imageService.uploadBeforeAfter(
          pendingBeforeFile,
          pendingAfterFile,
          {
            title: uploadTitle,
            description: uploadDescription,
            type: uploadType,
          },
        );
        toast.success("Comparison uploaded");
      } else if (selectedFolder === "gallery") {
        if (targetProject && dialogMode === "add-images") {
          const filesForProject = pendingFilesArray.map((file, i) => ({
            file,
            title: perImageSpecs[i] || file.name.replace(/\.[^/.]+$/, ""),
            description: uploadDescription || null,
            isThumbnail: i === thumbnailIndex,
          }));
          await imageService.addImagesToProject(
            targetProject.id,
            targetProject.type,
            filesForProject,
          );
          toast.success(
            `${filesForProject.length} image(s) added to "${targetProject.title}"`,
          );
          setTargetProject(null);
          setDialogMode(undefined);
        } else {
          if (!uploadSlug.trim()) {
            toast.error("URL slug required");
            setUploading(false);
            return;
          }
          const tags = uploadTags
            ? uploadTags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            : [];
          const filesForProject = pendingFilesArray.map((file, i) => ({
            file,
            title: perImageSpecs[i] || file.name.replace(/\.[^/.]+$/, ""),
            description: uploadDescription || null,
            isThumbnail: i === thumbnailIndex,
          }));
          await imageService.createGalleryProject(
            {
              title: uploadTitle.trim(),
              slug: uploadSlug.trim(),
              category: uploadCategory.trim() || uploadTitle.trim(),
              type: uploadType as any,
              description: uploadDescription || undefined,
              tags,
            },
            filesForProject,
          );
          toast.success(`Project "${uploadTitle}" created`);
        }
      } else {
        let success = 0,
          failed = 0;
        for (let i = 0; i < pendingFilesArray.length; i++) {
          const file = pendingFilesArray[i];
          setUploadProgress((prev) =>
            prev.map((p, idx) =>
              idx === i ? { ...p, status: "uploading" as const } : p,
            ),
          );
          try {
            const data = await imageService.uploadImage(
              file,
              IMAGE_FOLDERS.SERVICES,
            );
            if (selectedFolder === "service") {
              const { error } = await supabase
                .from("services")
                .insert({
                  image_url: data.url,
                  public_id: data.path,
                  title: uploadTitle || file.name,
                  description: uploadDescription || null,
                  type: uploadType as any,
                });
              if (error) throw error;
            }
            setUploadProgress((prev) =>
              prev.map((p, idx) =>
                idx === i
                  ? { ...p, status: "success" as const, progress: 100 }
                  : p,
              ),
            );
            success++;
          } catch (err: any) {
            setUploadProgress((prev) =>
              prev.map((p, idx) =>
                idx === i
                  ? {
                      ...p,
                      status: "error" as const,
                      error: err?.message || "Upload failed",
                    }
                  : p,
              ),
            );
            failed++;
          }
          if (i < pendingFilesArray.length - 1)
            await new Promise((r) => setTimeout(r, 500));
        }
        if (success) toast.success(`${success} file(s) uploaded`);
        if (failed) toast.error(`${failed} file(s) failed`);
      }
      await fetchFiles();
      if (activeTab === "projects") await fetchProjects();
    } catch (error: any) {
      toast.error(error?.message || "Failed to upload");
    } finally {
      setUploading(false);
      setTimeout(() => {
        setPendingFilesArray([]);
        setPendingBeforeFile(null);
        setPendingAfterFile(null);
        setUploadProgress([]);
        setTargetProject(null);
        setDialogMode(undefined);
      }, 3000);
    }
  };

  const handleDelete = async (file: FileManagerFile) => {
    try {
      let table: string = file.folder || "gallery";
      if (file.folder === "service") {
        table = "services";
      }
      let publicIds = [file.public_id];
      let idToDelete = file.id;
      if (file.folder === "before-after") {
        table = "before_after";
        idToDelete = file.id.replace(/-(before|after)$/, "");
        const { data: record } = await supabase
          .from("before_after")
          .select("*")
          .eq("id", idToDelete)
          .maybeSingle();
        if (record)
          publicIds = [record.before_public_id, record.after_public_id];
      }
      await imageService.deleteItem(idToDelete, table, publicIds);
      toast.success(`"${file.original_name || file.public_id}" deleted`);
      setShowDeleteConfirm(null);
      fetchFiles();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete");
    }
  };

  const handleDeleteProject = async (project: GalleryViewItem) => {
    try {
      await imageService.deleteProject(project.id);
      toast.success(`Project "${project.title}" deleted`);
      fetchProjects();
      fetchFiles();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete project");
    }
  };

  const handleAddImagesToProject = (project: GalleryViewItem) => {
    setTargetProject(project);
    setDialogMode("add-images");
    setSelectedFolder("gallery");
    setUploadTitle(project.title);
    setUploadSlug(project.slug);
    setUploadType(project.type);
    setUploadCategory(project.category);
    setUploadTags(project.tags.join(", "));
    setUploadDescription(project.description || "");
    setThumbnailIndex(0);
    setPerImageSpecs([]);
    setPendingFilesArray([]);
    setUploadProgress([]);
    setTimeout(() => document.getElementById("file-upload")?.click(), 50);
  };

  const handleEditProject = (project: GalleryViewItem) => {
    setTargetProject(project);
    setDialogMode("edit");
    setSelectedFolder("gallery");
    setUploadTitle(project.title);
    setUploadSlug(project.slug);
    setUploadType(project.type);
    setUploadCategory(project.category);
    setUploadTags(project.tags.join(", "));
    setUploadDescription(project.description || "");
    setThumbnailIndex(0);
    setPerImageSpecs([]);
    setPendingFilesArray([]);
    setUploadProgress([]);
    setShowFolderDialog(true);
  };

  const handleSaveProjectEdit = async () => {
    if (!targetProject || !uploadTitle.trim()) return;
    setUploading(true);
    try {
      const tags = uploadTags
        ? uploadTags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
      await imageService.updateProject(targetProject.id, {
        title: uploadTitle.trim(),
        slug: uploadSlug.trim(),
        category: uploadCategory.trim() || uploadTitle.trim(),
        type: uploadType,
        description: uploadDescription || undefined,
        tags,
      });
      toast.success(`Project "${uploadTitle}" updated`);
      setShowFolderDialog(false);
      setTargetProject(null);
      setDialogMode(undefined);
      fetchProjects();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save");
    } finally {
      setUploading(false);
    }
  };

  const handleReorderImages = async (fromIndex: number, toIndex: number) => {
    if (!targetProject) return;
    const images = [...targetProject.images];
    const [moved] = images.splice(fromIndex, 1);
    images.splice(toIndex, 0, moved);
    setTargetProject((prev) =>
      prev ? { ...prev, images: images.map((img, idx) => ({ ...img })) } : null,
    );
    try {
      const { data: dbImages } = await supabase
        .from("gallery")
        .select("id")
        .eq("project_id", targetProject.id)
        .order("sort_order", { ascending: true });
      if (dbImages) {
        const reorderedIds = [...dbImages];
        const [movedDb] = reorderedIds.splice(fromIndex, 1);
        reorderedIds.splice(toIndex, 0, movedDb);
        await imageService.updateImageOrder(
          reorderedIds.map((img, idx) => ({ id: img.id, sort_order: idx })),
        );
      }
    } catch (err) {
      toast.error("Failed to save image order");
    }
  };

  const handleFolderChange = (val: string) => {
    setSelectedFolder(val);
    setUploadTitle("");
    setUploadType("closet");
    setUploadDescription("");
    setUploadSlug("");
    setUploadCategory("Walk-in Closets");
    setUploadTags("");
    setThumbnailIndex(0);
    setPerImageSpecs([]);
    setTargetProject(null);
    setDialogMode(undefined);
  };

  const getFolderStats = (folder: string) => ({
    count: files.filter((f) => f.folder === folder).length,
  });

  if (checkingAuth || !session)
    return (
      <div className="min-h-screen bg-brand-cream lg:pl-72 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-copper" />
      </div>
    );
  if (!isAdmin)
    return (
      <div className="min-h-screen bg-brand-cream lg:pl-72 flex items-center justify-center px-6">
        <Card className="p-8 text-center border-brand-border">
          <h2 className="text-2xl font-semibold text-brand-espresso mb-2">
            Access Denied
          </h2>
          <p className="text-brand-muted">Admin privileges required.</p>
        </Card>
      </div>
    );

  return (
    <>
    <AdminTopBar/>
      <div className="min-h-screen bg-brand-cream lg:pl-72 py-8 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/admin")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1
                  className="text-3xl font-semibold text-brand-espresso"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  File Manager
                </h1>
                <p className="text-brand-muted text-sm">
                  Upload to Supabase Storage
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setRefreshing(true);
                  fetchFiles(true);
                  fetchProjects();
                }}
                disabled={refreshing}
                className="border-brand-border"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </Button>
              <Input
                id="file-upload"
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => {
                  setTargetProject(null);
                  setDialogMode(undefined);
                  document.getElementById("file-upload")?.click();
                }}
                disabled={uploading}
                className="bg-brand-copper text-white hover:bg-brand-copper-dark"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {uploading ? "Uploading..." : "Upload Files"}
              </Button>
            </div>
          </div>
          {uploadProgress.length > 0 && (
            <Card className="p-4 space-y-3 border-brand-border bg-white">
              <h3 className="font-semibold text-sm">Upload Progress</h3>
              <div className="space-y-2">
                {uploadProgress.map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate max-w-[200px]">
                        {item.fileName}
                      </span>
                      <span className="flex items-center gap-1">
                        {item.status === "success" && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                        {item.status === "error" && (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        {item.status === "uploading" && (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-brand-copper" />{" "}
                            {item.progress}%
                          </>
                        )}
                      </span>
                    </div>
                    {item.status === "uploading" && (
                      <Progress value={item.progress} className="h-2" />
                    )}
                    {item.error && (
                      <p className="text-xs text-red-600">{item.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
          {uploadErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Upload Errors</AlertTitle>
              <AlertDescription>
                {uploadErrors.map((e, i) => (
                  <p key={i}>{e}</p>
                ))}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {activeTab !== "projects" && activeTab !== "beforeafter" && activeTab !== "videos" && (
              <div className="flex items-center gap-3">
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
                <Select
                  value={typeFilter}
                  onValueChange={(v) => {
                    setTypeFilter(v);
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="w-[160px] h-9 text-xs">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex-wrap h-auto gap-1">
                <TabsTrigger value="all">
                  <FolderOpen className="w-3 h-3 mr-1" /> All ({files.length})
                </TabsTrigger>
                {FOLDER_OPTIONS.map((f) => (
                  <TabsTrigger key={f.value} value={f.value}>
                    {f.label} ({getFolderStats(f.value).count})
                  </TabsTrigger>
                ))}
                <TabsTrigger value="projects">
                  📁 Projects ({projects.length})
                </TabsTrigger>
                <TabsTrigger value="beforeafter">🖼️ Before / After</TabsTrigger>
                <TabsTrigger value="videos">🎬 Project Videos</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {activeTab === "beforeafter" ? (
            <BeforeAfterManager />
          ) : activeTab === "videos" ? (
            <VideoManager />
          ) : activeTab === "projects" ? (
            <ProjectList
              projects={projects}
              loading={projectsLoading}
              onDelete={handleDeleteProject}
              onAddImages={handleAddImagesToProject}
              onEdit={handleEditProject}
            />
          ) : (
            <FileList
              files={filteredFiles}
              loading={loading}
              page={page}
              pageSize={PAGE_SIZE}
              onPageChange={(p) => setPage(p)}
              onPreview={(f) => {
                setPreviewUrl(f.url);
                setPreviewType(
                  f.folder === "gallery" ||
                    f.folder === "service" ||
                    f.folder === "before-after"
                    ? "image"
                    : f.resource_type || "",
                );
                setPreviewName(f.original_name || f.public_id);
              }}
              onCopyUrl={(url) => {
                navigator.clipboard.writeText(url);
                toast.success("URL copied");
              }}
              onDelete={(f) => setShowDeleteConfirm(f)}
            />
          )}
        </div>
      </div>
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-5xl w-full bg-brand-cream border-brand-border">
          <DialogHeader>
            <DialogTitle>{previewName}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center max-h-[85vh] overflow-auto">
            {previewType === "image" && previewUrl && (
              <img
                src={previewUrl}
                alt={previewName}
                className="max-w-full max-h-[80vh] rounded"
              />
            )}
            {previewType === "video" && previewUrl && (
              <video
                src={previewUrl}
                controls
                className="max-w-full max-h-[80vh] rounded"
              >
                Your browser does not support video.
              </video>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <UploadDialog
        open={showFolderDialog}
        onOpenChange={(open) => {
          setShowFolderDialog(open);
          if (!open) {
            setTargetProject(null);
            setDialogMode(undefined);
          }
        }}
        pendingFilesArray={pendingFilesArray}
        selectedFolder={selectedFolder}
        onFolderChange={handleFolderChange}
        uploading={uploading}
        onConfirm={handleUploadConfirm}
        onSaveEdit={handleSaveProjectEdit}
        getFolderStats={getFolderStats}
        uploadTitle={uploadTitle}
        onTitleChange={setUploadTitle}
        uploadType={uploadType}
        onTypeChange={setUploadType}
        uploadDescription={uploadDescription}
        onDescChange={setUploadDescription}
        pendingBeforeFile={pendingBeforeFile}
        onBeforeChange={setPendingBeforeFile}
        pendingAfterFile={pendingAfterFile}
        onAfterChange={setPendingAfterFile}
        uploadSlug={uploadSlug}
        onSlugChange={setUploadSlug}
        uploadCategory={uploadCategory}
        onCategoryChange={setUploadCategory}
        uploadTags={uploadTags}
        onTagsChange={setUploadTags}
        thumbnailIndex={thumbnailIndex}
        onThumbChange={setThumbnailIndex}
        perImageSpecs={perImageSpecs}
        onSpecChange={(idx, v) => {
          const n = [...perImageSpecs];
          n[idx] = v;
          setPerImageSpecs(n);
        }}
        targetProject={targetProject}
        dialogMode={dialogMode}
        existingImages={targetProject?.images}
        onReorderImage={handleReorderImages}
      />
      <Dialog
        open={!!showDeleteConfirm}
        onOpenChange={() => setShowDeleteConfirm(null)}
      >
        <DialogContent className="max-w-sm bg-brand-cream border-brand-border">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Delete "
              {showDeleteConfirm?.original_name || showDeleteConfirm?.public_id}
              "? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                showDeleteConfirm && handleDelete(showDeleteConfirm)
              }
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FileManager;
