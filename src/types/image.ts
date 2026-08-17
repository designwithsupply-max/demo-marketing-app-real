export interface ImageReference {
    public_id: string;
    url: string;
}

export interface ImageAsset {
    public_id: string;
    url: string;
    resource_type: string;
    secure_url?: string;
    format?: string;
    bytes?: number;
    width?: number;
    height?: number;
    folder?: string;
    created_at?: string;
}

export interface SupabaseFile {
    id: string;
    url: string;
    public_id: string;
    folder: string | null;
    created_at: string;
}

// Gallery project (gallery_projects table)
export interface GalleryProject {
    id: string;
    title: string;
    slug: string;
    category: string;
    type: 'closet' | 'kitchen' | 'garage' | 'other';
    description: string | null;
    tags: string[];
    city: string | null;
    client_needed: string | null;
    what_we_designed: string | null;
    main_features: string[];
    is_featured?: boolean;
    is_active?: boolean;
    /** Slug of the related service_pages row, e.g. "walk-in-closets". Optional. */
    service_page_slug?: string | null;
    created_at: string;
    updated_at: string;
}

// Gallery image (gallery table - updated with project grouping)
export interface GalleryImage {
    id: string;
    project_id: string;
    image_url: string;
    public_id: string;
    title: string;
    description: string | null;
    spec: string | null;
    alt_text?: string | null;
    is_thumbnail: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

// Project with its images joined (used for album views)
export interface GalleryProjectWithImages extends GalleryProject {
    images: GalleryImage[];
}

// Legacy flat row (kept for compatibility with existing code during transition)
export interface GalleryRow {
    id: string;
    image_url: string;
    public_id: string;
    title: string;
    description: string | null;
    type: 'closet' | 'kitchen' | 'garage' | 'other';
    created_at: string;
}

export interface ServiceItem {
    id: string;
    image_url: string;
    public_id: string;
    title: string;
    description: string | null;
    type: 'closet' | 'kitchen' | 'garage' | 'other';
    created_at: string;
}

export interface BeforeAfterItem {
    id: string;
    before_image_url: string;
    before_public_id: string;
    after_image_url: string;
    after_public_id: string;
    title: string;
    description: string | null;
    type: 'closet' | 'kitchen' | 'garage' | 'other';
    is_active: boolean;
    order_index: number;
    created_at: string;
    // Editorial fields for the homepage transformations section (all optional)
    location?: string | null;
    project_date?: string | null;
    before_label?: string | null;
    after_label?: string | null;
    tagline?: string | null;
    stat_value?: string | null;
    stat_label?: string | null;
}