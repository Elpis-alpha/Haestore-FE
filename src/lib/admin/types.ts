import type { components, paths } from '@/lib/api/schema';

/**
 * The admin console's shapes, every one taken from the generated contract.
 *
 * The one thing written here that the document does not say is the recursion in the
 * category tree, which OpenAPI cannot express without a reference cycle — so the node type
 * is the generated category with its `children` re-stated in terms of itself.
 */

type Schemas = components['schemas'];

export type AttributeDefinition = Schemas['AttributeDefinition'];
export type AttributeOption = Schemas['AttributeOption'];
export type AttributeType = AttributeDefinition['type'];
export type FilterUi = AttributeDefinition['filterUi'];
export type AttributeUsage =
  paths['/api/admin/catalog/attributes/usage']['get']['responses'][200]['content']['application/json']['data'];

export type AdminCategory = Omit<Schemas['AdminCategory'], 'children'>;
export type AdminCategoryNode = AdminCategory & { children: AdminCategoryNode[] };

export type AdminProduct = Schemas['AdminProduct'];
export type AdminProductSummary = Schemas['AdminProductSummary'];
export type EffectiveAttribute = Schemas['EffectiveAttribute'];
export type EffectiveAttributeSet = Schemas['EffectiveAttributeSet'];

export type AdminOrder = Schemas['AdminOrder'];
export type AdminOrderSummary = Schemas['AdminOrderSummary'];
export type AdminOrderAction = AdminOrder['actions'][number];
export type OrderStatus = AdminOrder['status'];

export type CustomerSummary = Schemas['CustomerSummary'];
export type CustomerDetail = Schemas['CustomerDetail'];

export type StorefrontSection = Schemas['StorefrontSection'];
export type ResolvedSection = Schemas['ResolvedSection'];
export type StorefrontLayout = Schemas['StorefrontLayout'];
export type StorefrontVersion = Schemas['StorefrontVersion'];
export type StorefrontState =
  paths['/api/admin/storefront/{handle}']['get']['responses'][200]['content']['application/json']['data'];
export type StorefrontPreview =
  paths['/api/admin/storefront/{handle}/versions/{version}/preview']['get']['responses'][200]['content']['application/json']['data'];

export type Dashboard = Schemas['Dashboard'];
export type AuditEntry = Schemas['AuditEntry'];

export type Paged<T> = {
  data: T[];
  page: { page: number; perPage: number; total: number; totalPages: number };
};
