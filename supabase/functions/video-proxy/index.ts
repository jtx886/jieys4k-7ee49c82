import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    let apiUrl = `${baseUrl}?ac=detail&pg=${pg}`;

    if (action === "search" && wd) {
      apiUrl += `&wd=${encodeURIComponent(wd)}`;
    } else if (action === "detail" && ids) {
      apiUrl += `&ids=${ids}`;
    } else if (t) {
      apiUrl += `&t=${t}`;
    }

    console.log(`Fetching: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const data = await response.json();

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
