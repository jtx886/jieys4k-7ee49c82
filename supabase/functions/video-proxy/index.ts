import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const API_SOURCES = [
  "https://www.hongniuzy2.com/api.php/provide/vod/",
  "https://api.guangsuapi.com/api.php/provide/vod/",
  "https://suoniapi.com/api.php/provide/vod/",
];

// Parent category -> sub-category mappings
const CATEGORY_MAP: Record<string, string[]> = {
  "1": ["6", "7", "8", "9", "10", "11", "12"],      // 电影
  "2": ["13", "14", "15", "16", "17", "18", "19", "23"], // 电视剧
  "3": ["25", "26", "27", "28"],                      // 综艺
  "4": ["29", "30", "31", "44", "45"],                // 动漫
  "39": ["39"],                                        // 动画电影(动画片)
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "list";
    const wd = url.searchParams.get("wd") || "";
    const pg = url.searchParams.get("pg") || "1";
    const ids = url.searchParams.get("ids") || "";
    const t = url.searchParams.get("t") || "";
    const sourceIndex = parseInt(url.searchParams.get("source") || "0");

    const baseUrl = API_SOURCES[sourceIndex] || API_SOURCES[0];

    if (action === "detail" && ids) {
      const apiUrl = `${baseUrl}?ac=detail&ids=${ids}`;
      console.log(`Fetching detail: ${apiUrl}`);
      const response = await fetch(apiUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      });
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "search" && wd) {
      const apiUrl = `${baseUrl}?ac=detail&pg=${pg}&wd=${encodeURIComponent(wd)}`;
      console.log(`Fetching search: ${apiUrl}`);
      const response = await fetch(apiUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      });
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // List mode - handle parent categories
    const subCategories = t ? (CATEGORY_MAP[t] || [t]) : [];
    
    if (subCategories.length === 0) {
      // No category filter - fetch all
      const apiUrl = `${baseUrl}?ac=list&pg=${pg}`;
      console.log(`Fetching list: ${apiUrl}`);
      const response = await fetch(apiUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      });
      const listData = await response.json();
      
      if (listData.list && listData.list.length > 0) {
        const vodIds = listData.list.map((item: any) => item.vod_id).join(",");
        const detailUrl = `${baseUrl}?ac=detail&ids=${vodIds}`;
        const detailRes = await fetch(detailUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        });
        const detailData = await detailRes.json();
        listData.list = detailData.list || [];
      }
      
      return new Response(JSON.stringify(listData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch first sub-category for pagination info, then get details
    const firstSub = subCategories[0];
    const apiUrl = `${baseUrl}?ac=list&pg=${pg}&t=${firstSub}`;
    console.log(`Fetching category ${t} (sub: ${firstSub}): ${apiUrl}`);
    const response = await fetch(apiUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    const listData = await response.json();

    // If multiple sub-categories, fetch more to fill content
    if (subCategories.length > 1 && listData.list) {
      const otherFetches = subCategories.slice(1, 3).map(async (sub) => {
        const subUrl = `${baseUrl}?ac=list&pg=${pg}&t=${sub}`;
        const res = await fetch(subUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        });
        const data = await res.json();
        return data.list || [];
      });
      const otherLists = await Promise.all(otherFetches);
      for (const items of otherLists) {
        listData.list.push(...items);
      }
      // Shuffle to mix sub-categories
      listData.list.sort(() => Math.random() - 0.5);
      // Limit to 20
      listData.list = listData.list.slice(0, 20);
    }

    // Fetch full details for the list items
    if (listData.list && listData.list.length > 0) {
      const vodIds = listData.list.map((item: any) => item.vod_id).join(",");
      const detailUrl = `${baseUrl}?ac=detail&ids=${vodIds}`;
      console.log(`Fetching details: ${detailUrl}`);
      const detailRes = await fetch(detailUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      });
      const detailData = await detailRes.json();
      listData.list = detailData.list || [];
    }

    return new Response(JSON.stringify(listData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(JSON.stringify({ code: 0, msg: "请求失败", list: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
