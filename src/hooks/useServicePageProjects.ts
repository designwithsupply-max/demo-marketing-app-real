"use client";

import { useState, useEffect } from "react";
import { imageService, type GalleryViewItem } from "@/lib/imageService";

export function useServicePageProjects(type: "closet" | "kitchen" | "garage") {
  const [projects, setProjects] = useState<GalleryViewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    imageService
      .fetchGalleryProjects()
      .then((data) => {
        const filtered = data.filter((item) => item.type === type && item.isActive);
        setProjects(filtered);
        setLoading(false);
      })
      .catch((err) => {
        console.error(`Failed to load ${type} projects:`, err);
        setLoading(false);
      });
  }, [type]);

  const firstProject = projects[0] ?? null;

  return { projects, loading, firstProject };
}