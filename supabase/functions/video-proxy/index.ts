import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const API_SOURCES = [
  "https://api.apibdzy.com/api.php/provide/vod/",
  "https://okzyw9.com/api.php/provide/vod/",
];

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

    let apiUrl: string;

    if (action === "detail" && ids) {
      // Detail view - use ac=detail for full info
      apiUrl = `${baseUrl}?ac=detail&ids=${ids}`;
    } else if (action === "search" && wd) {
      // Search - use ac=detail for full info
      apiUrl = `${baseUrl}?ac=detail&pg=${pg}&wd=${encodeURIComponent(wd)}`;
    } else {
      // List/browse - use ac=list for category filtering, then fetch details
      apiUrl = `${baseUrl}?ac=list&pg=${pg}`;
      if (t) apiUrl += `&t=${t}`;
    }

    console.log(`Fetching: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const data = await response.json();

    // If we used ac=list, we got basic info. Now fetch details for those items.
    if (action !== "detail" && action !== "search" && data.list && data.list.length > 0) {
      const ids = data.list.map((item: any) => item.vod_id).join(",");
      const detailUrl = `${baseUrl}?ac=detail&ids=${ids}`;
      console.log(`Fetching details: ${detailUrl}`);
      const detailResponse = await fetch(detailUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      const detailData = await detailResponse.json();
      // Keep pagination from list response but use detail data
      data.list = detailData.list || [];
    }

    return new Response(JSON.stringify(data), {
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
