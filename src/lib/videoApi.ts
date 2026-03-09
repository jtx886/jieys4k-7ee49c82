// 光速资源站 - 稳定无广告高清资源
const API_SOURCE = {
  name: "光速资源",
  base: "https://api.guangsuapi.com/api.php/provide/vod/",
};

export interface VodItem {
  vod_id: number;
  vod_name: string;
  vod_pic: string;
  vod_class: string;
  vod_remarks: string;
  vod_year: string;
  vod_area: string;
  vod_lang: string;
  vod_content: string;
  vod_play_from: string;
  vod_play_url: string;
  vod_director: string;
  vod_actor: string;
  vod_blurb: string;
  type_name: string;
}

export interface VodApiResponse {
  code: number;
  msg: string;
  page: number;
  pagecount: number;
  limit: string;
  total: number;
  list: VodItem[];
}

const PROXY_BASE = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/video-proxy`;

export async function searchVideos(keyword: string, page = 1): Promise<VodApiResponse> {
  const res = await fetch(`${PROXY_BASE}?action=search&wd=${encodeURIComponent(keyword)}&pg=${page}`);
  if (!res.ok) throw new Error("搜索失败");
  return res.json();
}

export async function getVideoDetail(id: number | string): Promise<VodItem | null> {
  const res = await fetch(`${PROXY_BASE}?action=detail&ids=${id}`);
  if (!res.ok) throw new Error("获取详情失败");
  const data: VodApiResponse = await res.json();
  return data.list?.[0] || null;
}

export async function getVideoList(type?: number, page = 1): Promise<VodApiResponse> {
  let url = `${PROXY_BASE}?action=list&pg=${page}`;
  if (type) url += `&t=${type}`;
  return fetch(url).then(r => r.json());
}

export function parsePlayUrls(playUrl: string): { name: string; url: string }[] {
  if (!playUrl) return [];
  // Format: "第01集$url#第02集$url" or "HD$url"
  return playUrl.split("#").map(item => {
    const [name, url] = item.split("$");
    return { name: name || "播放", url: url || "" };
  }).filter(item => item.url);
}

// Category IDs for MacCMS standard
export const CATEGORIES = [
  { id: 0, name: "推荐" },
  { id: 1, name: "电影" },
  { id: 2, name: "电视剧" },
  { id: 3, name: "综艺" },
  { id: 4, name: "动漫" },
  { id: 39, name: "动画片" },
];
