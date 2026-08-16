import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Play, ArrowRight } from "lucide-react";
import { videoService, type ProjectVideo } from "@/lib/videoService";

export const ProjectVideos = () => {
  const [videos, setVideos] = useState<ProjectVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    videoService
      .fetchProjectVideos()
      .then(setVideos)
      .catch((err) => console.error("Failed to load project videos:", err))
      .finally(() => setLoading(false));
  }, []);

  // Don't render the section at all if there are no videos to show.
  if (!loading && videos.length === 0) return null;

  return (
    <section className="bg-[#1A1A18] py-20 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-[#C9A96E] text-xs tracking-[0.3em] uppercase block mb-4">
            Project Videos
          </span>
          <h2
            className="text-white font-light leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            See our work in motion
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto mt-3 leading-relaxed">
            Walkthroughs and reveals from real closet, kitchen, and garage projects.
          </p>
          <Link
            href="/space-planner"
            className="group inline-flex items-center gap-2 mt-6 text-[#C9A96E] text-xs tracking-[0.2em] uppercase hover:gap-3 transition-all duration-300"
          >
            Start Your Free Design
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#C9A96E]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((v) => (
              <figure
                key={v.id}
                className="group bg-[#232320] rounded-xl overflow-hidden border border-white/10 shadow-lg"
              >
                <div className="relative aspect-video bg-black">
                  <video
                    controls
                    preload="metadata"
                    poster={v.thumbnail_url ?? undefined}
                    className="w-full h-full object-cover"
                  >
                    <source src={v.video_url} />
                    Your browser does not support the video tag.
                  </video>
                  {!v.thumbnail_url && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-70 group-hover:opacity-0 transition-opacity">
                      <div className="w-14 h-14 rounded-full bg-[#C9A96E]/90 flex items-center justify-center">
                        <Play className="w-6 h-6 text-[#1A1A18] ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                  )}
                </div>
                <figcaption className="p-4">
                  <h3 className="text-white font-medium">{v.title}</h3>
                  {v.description && (
                    <p className="text-white/55 text-sm mt-1 line-clamp-2">{v.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-3">
                    <span className="text-[10px] tracking-[0.18em] uppercase text-[#C9A96E]">
                      {v.type}
                    </span>
                    {v.city && (
                      <>
                        <span className="text-white/30 text-[10px]">·</span>
                        <span className="text-[10px] tracking-[0.1em] uppercase text-white/50">{v.city}</span>
                      </>
                    )}
                  </div>
                  {v.transcript && (
                    <details className="mt-3 group/transcript">
                      <summary className="text-xs text-white/50 hover:text-white/80 cursor-pointer transition-colors">
                        Transcript
                      </summary>
                      <p className="text-white/55 text-xs leading-relaxed mt-2 whitespace-pre-line">{v.transcript}</p>
                    </details>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProjectVideos;
