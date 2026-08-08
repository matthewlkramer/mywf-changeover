/**
 * Minimal JSON:API document builder matching the Rails `ApplicationSerializer`
 * conventions the existing UI depends on: camelLower attribute keys and
 * `external_identifier` used as the resource id.
 */

export type Attributes = Record<string, unknown>;

export type Resource = {
  id: string;
  type: string;
  attributes: Attributes;
  relationships?: Record<string, { data: RelationshipRef | RelationshipRef[] | null }>;
};

type RelationshipRef = { id: string; type: string };

export type PaginationMeta = {
  currentPage: number;
  perPage: number;
  totalEntries: number;
  totalPages: number;
};

export function camelize(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

export function camelizeKeys(attributes: Attributes): Attributes {
  const out: Attributes = {};
  for (const [key, value] of Object.entries(attributes)) {
    out[camelize(key)] = value;
  }
  return out;
}

export function document(
  data: Resource | Resource[],
  options: { meta?: PaginationMeta; included?: Resource[] } = {},
): Response {
  const body: Record<string, unknown> = { data };
  if (options.included?.length) body.included = options.included;
  if (options.meta) body.meta = options.meta;
  return Response.json(body);
}

export function paginationMeta(
  page: number,
  perPage: number,
  totalEntries: number,
): PaginationMeta {
  return {
    currentPage: page,
    perPage,
    totalEntries,
    totalPages: Math.max(Math.ceil(totalEntries / perPage), 1),
  };
}

/** Mirrors the Rails controllers' page/per_page clamping. */
export function pagination(
  searchParams: URLSearchParams,
  maxPerPage: number,
): { page: number; perPage: number; from: number; to: number } {
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const requested = Number(searchParams.get("per_page")) || 0;
  const perPage = requested > 0 ? Math.min(Math.max(requested, 1), maxPerPage) : 25;
  const from = (page - 1) * perPage;
  return { page, perPage, from, to: from + perPage - 1 };
}
