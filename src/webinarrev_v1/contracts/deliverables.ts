import { DeliverableId } from './enums';

export type DeliverableCategory = 'Strategy' | 'Core Delivery' | 'Marketing' | 'Delivery' | 'Operator';

export interface DeliverableMeta {
  id: DeliverableId;
  title: string;
  short_title: string;
  category: DeliverableCategory;
  exportable: boolean;
  sort_order: number;
  filename_title: string;
  internal_badge: string;
}

export const DELIVERABLES: Record<DeliverableId, DeliverableMeta> = {
  PREFLIGHT: {
    id: 'PREFLIGHT',
    title: 'Preflight (Readiness Check)',
    short_title: 'Preflight',
    category: 'Operator',
    exportable: false,
    sort_order: 0,
    filename_title: 'Preflight_Readiness_Check',
    internal_badge: 'PREFLIGHT',
  },
  WR1: {
    id: 'WR1',
    title: 'Client Profile Dossier',
    short_title: 'Dossier',
    category: 'Strategy',
    exportable: true,
    sort_order: 1,
    filename_title: 'Client_Profile_Dossier',
    internal_badge: 'WR1',
  },
  WR2: {
    id: 'WR2',
    title: 'Framework 21',
    short_title: 'Framework 21',
    category: 'Core Delivery',
    exportable: true,
    sort_order: 2,
    filename_title: 'Framework_21',
    internal_badge: 'WR2',
  },
  WR3: {
    id: 'WR3',
    title: 'Landing Page Copy',
    short_title: 'Landing Page',
    category: 'Marketing',
    exportable: true,
    sort_order: 3,
    filename_title: 'Landing_Page_Copy',
    internal_badge: 'WR3',
  },
  WR4: {
    id: 'WR4',
    title: 'Email Campaign',
    short_title: 'Email',
    category: 'Marketing',
    exportable: true,
    sort_order: 4,
    filename_title: 'Email_Campaign',
    internal_badge: 'WR4',
  },
  WR5: {
    id: 'WR5',
    title: 'Social Posts Pack',
    short_title: 'Social',
    category: 'Marketing',
    exportable: true,
    sort_order: 5,
    filename_title: 'Social_Posts_Pack',
    internal_badge: 'WR5',
  },
  WR6: {
    id: 'WR6',
    title: 'Run of Show',
    short_title: 'Run of Show',
    category: 'Delivery',
    exportable: true,
    sort_order: 6,
    filename_title: 'Run_of_Show',
    internal_badge: 'WR6',
  },
  WR7: {
    id: 'WR7',
    title: 'Execution Checklist',
    short_title: 'Checklist',
    category: 'Delivery',
    exportable: true,
    sort_order: 7,
    filename_title: 'Execution_Checklist',
    internal_badge: 'WR7',
  },
  WR8: {
    id: 'WR8',
    title: 'Deck Prompt (Gamma)',
    short_title: 'Deck Prompt',
    category: 'Delivery',
    exportable: true,
    sort_order: 8,
    filename_title: 'Deck_Prompt_Gamma',
    internal_badge: 'WR8',
  },
  WR9: {
    id: 'WR9',
    title: 'Readiness & QA Report',
    short_title: 'QA Report',
    category: 'Operator',
    exportable: false,
    sort_order: 9,
    filename_title: 'Readiness_QA_Report',
    internal_badge: 'WR9',
  },
};

export const UI_DELIVERABLE_ORDER: DeliverableId[] = Object.values(DELIVERABLES)
  .sort((a, b) => a.sort_order - b.sort_order)
  .map(d => d.id);

export const CLIENT_EXPORT_DELIVERABLES: DeliverableId[] = Object.values(DELIVERABLES)
  .filter(d => d.exportable)
  .sort((a, b) => a.sort_order - b.sort_order)
  .map(d => d.id);

export function getDeliverableTitle(id: DeliverableId): string {
  return DELIVERABLES[id]?.title || id;
}

export function getDeliverableShortTitle(id: DeliverableId): string {
  return DELIVERABLES[id]?.short_title || id;
}

export function getDeliverableFilename(id: DeliverableId): string {
  const meta = DELIVERABLES[id];
  if (!meta) return id;
  const order = String(meta.sort_order).padStart(2, '0');
  return `${order}_${meta.filename_title}_${id}`;
}
