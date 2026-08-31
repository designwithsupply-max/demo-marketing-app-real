// Regenerates sitemap.xml to include database-driven pages (blog posts,
// gallery projects, service pages, location pages) alongside the fixed
// static routes, so search engines can discover content that doesn't have
// a hardcoded URL anywhere in the app. Runs automatically after `vite build`
// (see package.json), and can also be run on its own via `npm run generate-sitemap`.
//
// Writes to both public/sitemap.xml (so the source stays in sync in git) and
// dist/sitemap.xml (so the build that's about to be deployed has it too —
// vite build already copied the old public/sitemap.xml into dist/ before this
// script runs, so dist/ needs its own fresh write).
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const ROOT = path.join(__dirname, "..");
const SITE_ORIGIN = "https://designandsupply.ca";

// Vercel's build environment injects these directly into process.env. For
// local runs, fall back to reading them out of .env (minimal parser, so this
// script doesn't need a `dotenv` dependency just for one line each).
function loadEnvFallback() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnvFallback();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Fixed pages that don't come from a database table. Kept in sync manually —
// this is the same list that used to be the entire sitemap.
const STATIC_URLS = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/how-it-works", changefreq: "monthly", priority: "0.8" },
  { loc: "/space-planner", changefreq: "monthly", priority: "0.9" },
  { loc: "/gallery", changefreq: "weekly", priority: "0.7" },
  { loc: "/blog", changefreq: "weekly", priority: "0.7" },
  { loc: "/faq", changefreq: "monthly", priority: "0.6" },
  { loc: "/contact", changefreq: "monthly", priority: "0.7" },
  { loc: "/about-us", changefreq: "monthly", priority: "0.6" },
  { loc: "/terms", changefreq: "yearly", priority: "0.3" },
  { loc: "/privacy", changefreq: "yearly", priority: "0.3" },
];

function xmlEscape(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function urlEntry({ loc, changefreq, priority }) {
  return `  <url>\n    <loc>${xmlEscape(SITE_ORIGIN + loc)}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

async function main() {
  const urls = [...STATIC_URLS];

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn(
      "generate-sitemap: Supabase env vars not found — writing static URLs only (this is expected if you haven't set VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY in this environment)."
    );
  } else {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    try {
      const { data: services } = await supabase
        .from("service_pages")
        .select("slug")
        .eq("is_active", true);
      for (const s of services || []) {
        urls.push({ loc: `/${s.slug}`, changefreq: "monthly", priority: "0.9" });
      }
    } catch (e) {
      console.warn("generate-sitemap: could not fetch service_pages —", e.message);
    }

    try {
      const { data: posts } = await supabase
        .from("blog_posts")
        .select("slug")
        .eq("is_published", true);
      for (const p of posts || []) {
        urls.push({ loc: `/blog/${p.slug}`, changefreq: "monthly", priority: "0.6" });
      }
    } catch (e) {
      console.warn("generate-sitemap: could not fetch blog_posts —", e.message);
    }

    try {
      const { data: projects } = await supabase
        .from("gallery_projects")
        .select("slug")
        .eq("is_active", true);
      for (const g of projects || []) {
        urls.push({ loc: `/gallery/${g.slug}`, changefreq: "monthly", priority: "0.6" });
      }
    } catch (e) {
      console.warn("generate-sitemap: could not fetch gallery_projects —", e.message);
    }

    try {
      const { data: locations } = await supabase
        .from("location_pages")
        .select("slug")
        .eq("is_active", true);
      for (const l of locations || []) {
        urls.push({ loc: `/${l.slug}`, changefreq: "monthly", priority: "0.8" });
      }
    } catch (e) {
      // location_pages may not exist yet if its migration hasn't been applied — fine, just skip.
    }
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(urlEntry).join("\n") +
    `\n</urlset>\n`;

  fs.writeFileSync(path.join(ROOT, "public", "sitemap.xml"), xml);
  const distDir = path.join(ROOT, "dist");
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, "sitemap.xml"), xml);
  }
  console.log(`generate-sitemap: wrote ${urls.length} URLs to sitemap.xml`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
