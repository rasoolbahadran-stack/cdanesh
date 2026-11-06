import type { PortfolioItem } from './types';
import { env } from './env';

const DEFAULT_TEAM_ID = 'team_2HhADsN06h0DCSCbvkNwLxNj';
const CACHE_TTL = 5 * 60 * 1000;

type VercelProject = {
  id: string;
  name: string;
  framework?: string | null;
  domains?: string[];
  ssoProtection?: { enabled?: boolean; deploymentType?: string | null };
  passwordProtection?: { enabled?: boolean; deploymentType?: string | null };
  createdAt?: number;
  updatedAt?: number;
};

type VercelDeployment = {
  url?: string | null;
  target?: string | null;
  readyState?: string;
  state?: string;
  createdAt?: number;
};

type PortfolioMetadata = Partial<PortfolioItem> & {
  preview_webp?: string;
  live_url?: string;
  sort_order?: number;
};

let cachedItems: PortfolioItem[] | null = null;
let cachedAt = 0;
let pendingRequest: Promise<PortfolioItem[]> | null = null;

export function hasVercelPortfolioConfig(): boolean {
  return Boolean(env('VERCEL_ACCESS_TOKEN'));
}

async function vercelGet<T>(url: URL, token: string): Promise<T> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Vercel API ${response.status}: ${detail.slice(0, 240)}`);
  }

  return response.json() as Promise<T>;
}

async function listProjects(token: string, teamId: string): Promise<VercelProject[]> {
  const projects: VercelProject[] = [];
  let cursor = '';

  for (let page = 0; page < 5; page += 1) {
    const url = new URL('https://api.vercel.com/v10/projects');
    url.searchParams.set('limit', '100');
    url.searchParams.set('teamId', teamId);
    if (cursor) url.searchParams.set('from', cursor);

    const data = await vercelGet<{
      projects?: VercelProject[];
      pagination?: { next?: string | number | null };
    }>(url, token);

    projects.push(...(data.projects || []));
    const next = data.pagination?.next;
    if (next == null || String(next) === cursor || !data.projects?.length) break;
    cursor = String(next);
  }

  return projects;
}

async function listProjectDomains(
  projectId: string,
  token: string,
  teamId: string,
): Promise<string[]> {
  const url = new URL(`https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}/domains`);
  url.searchParams.set('production', 'true');
  url.searchParams.set('verified', 'true');
  url.searchParams.set('limit', '100');
  url.searchParams.set('teamId', teamId);

  const data = await vercelGet<{ domains?: Array<{ name?: string }> }>(url, token);
  return (data.domains || []).map((domain) => domain.name || '').filter(Boolean);
}

async function latestReadyProduction(
  projectId: string,
  token: string,
  teamId: string,
): Promise<VercelDeployment | null> {
  const url = new URL('https://api.vercel.com/v7/deployments');
  url.searchParams.set('projectId', projectId);
  url.searchParams.set('target', 'production');
  url.searchParams.set('limit', '10');
  url.searchParams.set('teamId', teamId);

  const data = await vercelGet<{ deployments?: VercelDeployment[] }>(url, token);
  const deployments = data.deployments || [];
  return deployments.find((deployment) =>
    deployment.target === 'production' &&
    (deployment.readyState === 'READY' || deployment.state === 'READY') &&
    Boolean(deployment.url),
  ) || null;
}

function isPublicProject(project: VercelProject): boolean {
  if (project.passwordProtection?.enabled) return false;

  const sso = project.ssoProtection;
  if (!sso?.enabled || sso.deploymentType === 'preview') return true;

  const hasCustomDomain = (project.domains || []).some(
    (domain) => !domain.toLowerCase().endsWith('.vercel.app'),
  );

  if (sso.deploymentType === 'all_except_custom_domains') return hasCustomDomain;
  return false;
}

function displayName(slug: string): string {
  return slug
    .replace(/-astro$/i, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function makeLiveUrl(project: VercelProject, deployment: VercelDeployment): string {
  const domains = project.domains || [];
  const customDomain = domains.find((domain) => !domain.toLowerCase().endsWith('.vercel.app'));
  const stableVercelDomain = domains.find(
    (domain) => domain.toLowerCase() === `${project.name.toLowerCase()}.vercel.app`,
  );
  const hostname = customDomain || stableVercelDomain || deployment.url;
  return hostname ? `https://${hostname.replace(/^https?:\/\//, '')}` : '';
}

function metadataFor(
  project: VercelProject,
  localItems: PortfolioMetadata[],
  databaseItems: PortfolioMetadata[],
  sort: number,
): PortfolioItem {
  const slug = project.name.toLowerCase();
  const local = localItems.find((item) => item.slug === slug);
  const database = databaseItems.find((item) => item.slug === slug);
  const metadata = local || database || {};

  return {
    slug,
    title: metadata.title || displayName(project.name),
    excerpt: metadata.excerpt || `وب‌سایت ${displayName(project.name)}؛ یکی از پروژه‌های منتشرشده کافه دانش.`,
    description: metadata.description || metadata.excerpt || `این پروژه با فریم‌ورک Astro توسعه داده شده و روی زیرساخت Vercel منتشر شده است.`,
    category: metadata.category || 'وب‌سایت',
    tags: metadata.tags?.length ? metadata.tags : ['طراحی اختصاصی', 'Astro'],
    cover: metadata.cover || metadata.preview_webp || '',
    preview: metadata.preview || metadata.preview_webp || metadata.cover || '',
    liveUrl: metadata.liveUrl || metadata.live_url || '',
    status: 'published',
    sort: typeof metadata.sort === 'number'
      ? metadata.sort
      : typeof metadata.sort_order === 'number' ? metadata.sort_order : sort,
  };
}

async function fetchPortfolioFromVercel(
  localItems: PortfolioMetadata[],
  databaseItems: PortfolioMetadata[],
): Promise<PortfolioItem[]> {
  const token = env('VERCEL_ACCESS_TOKEN');
  if (!token) throw new Error('VERCEL_ACCESS_TOKEN is not configured');

  const teamId = env('VERCEL_TEAM_ID') || DEFAULT_TEAM_ID;
  const projects = await listProjects(token, teamId);

  // این وب‌سایت خودش نمونه‌کار محسوب نمی‌شود؛ فقط پروژه‌های Astro بررسی می‌شوند.
  const astroProjects = projects.filter((project) =>
    project.framework?.toLowerCase() === 'astro' &&
    project.name !== 'cafe-danesh-ir' &&
    project.name !== 'cdanesh-galaxe',
  );

  const checked = await Promise.all(astroProjects.map(async (project) => {
    const [details, deployment, domains] = await Promise.all([
      (async () => {
        const url = new URL(`https://api.vercel.com/v9/projects/${encodeURIComponent(project.id)}`);
        url.searchParams.set('teamId', teamId);
        return vercelGet<VercelProject>(url, token).catch(() => project);
      })(),
      latestReadyProduction(project.id, token, teamId),
      listProjectDomains(project.id, token, teamId).catch(() => []),
    ]);

    const fullProject = { ...project, ...details, domains };
    if (!deployment || !isPublicProject(fullProject)) return null;

    const liveUrl = makeLiveUrl(fullProject, deployment);
    if (!liveUrl) return null;

    return { project: fullProject, sort: deployment.createdAt || fullProject.updatedAt || 0, liveUrl };
  }));

  const visible = checked.filter(
    (entry): entry is { project: VercelProject; sort: number; liveUrl: string } => entry !== null,
  );

  return visible
    .map((entry, index) => ({
      ...metadataFor(entry.project, localItems, databaseItems, index + 1),
      liveUrl: entry.liveUrl,
    }))
    .sort((a, b) => a.sort - b.sort);
}

export async function getVercelPortfolio(
  localItems: PortfolioMetadata[],
  databaseItems: PortfolioMetadata[],
): Promise<PortfolioItem[]> {
  if (cachedItems && Date.now() - cachedAt < CACHE_TTL) return cachedItems;
  if (pendingRequest) return pendingRequest;

  pendingRequest = fetchPortfolioFromVercel(localItems, databaseItems)
    .then((items) => {
      cachedItems = items;
      cachedAt = Date.now();
      return items;
    })
    .catch((error) => {
      // در خطای موقت API، آخرین فهرست موفق را حفظ می‌کنیم.
      if (cachedItems) return cachedItems;
      throw error;
    })
    .finally(() => {
      pendingRequest = null;
    });

  return pendingRequest;
}
