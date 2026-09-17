/**
 * block-state.ts — Single source of truth for block status lifecycle.
 * 
 * Referenced by: Overview timeline, Planner results, Cockpit Gantt/modal.
 * The governance model (proposed ≠ sanctioned, role-gated transitions)
 * cannot drift between screens because every screen imports from here.
 */

export type BlockStatus =
  | "PROPOSED"
  | "SANCTIONED"
  | "OVERRIDDEN"
  | "REJECTED"
  | "ACTIVE"
  | "EXTENDED"
  | "RESTORED"
  | "COMPLETED";

export interface BlockStatusConfig {
  label: string;
  color: string;        // Tailwind-safe hex
  bgClass: string;      // For pills/badges
  textClass: string;
  description: string;
  /** Actions legally available FROM this state */
  allowedActions: BlockAction[];
}

export type BlockAction =
  | "APPROVE"
  | "OVERRIDE"
  | "REJECT"
  | "ACTIVATE"
  | "EXTEND"
  | "RESTORE"
  | "COMPLETE";

export const BLOCK_ACTIONS: Record<BlockAction, {
  label: string;
  description: string;
  colorType: "green" | "orange" | "red";
}> = {
  APPROVE: {
    label: "Approve / Sanction Block",
    description: "Authorize proposed window as scheduled without changes.",
    colorType: "green",
  },
  OVERRIDE: {
    label: "Override / Shift Window",
    description: "Adjust scheduled start/end times with regulatory justification.",
    colorType: "orange",
  },
  REJECT: {
    label: "Reject Block",
    description: "Deny block authorization due to traffic or emergency constraints.",
    colorType: "red",
  },
  ACTIVATE: {
    label: "Record Block Active",
    description: "Record that sanctioned work has started under controller authority.",
    colorType: "green",
  },
  EXTEND: {
    label: "Request Extension",
    description: "Record a revised end time with operational justification.",
    colorType: "orange",
  },
  RESTORE: {
    label: "Record Restoration",
    description: "Record that the block has been restored for completion review.",
    colorType: "green",
  },
  COMPLETE: {
    label: "Complete Block",
    description: "Close a restoration-recorded block in the audit ledger.",
    colorType: "green",
  },
};

export const BLOCK_STATUS_MAP: Record<BlockStatus, BlockStatusConfig> = {
  PROPOSED: {
    label: "Proposed",
    color: "#f59e0b",
    bgClass: "bg-amber-100",
    textClass: "text-amber-800",
    description: "Pending section controller sanction",
    allowedActions: ["APPROVE", "OVERRIDE", "REJECT"],
  },
  SANCTIONED: {
    label: "Sanctioned",
    color: "#22c55e",
    bgClass: "bg-green-100",
    textClass: "text-green-800",
    description: "Authorized by section controller",
    allowedActions: ["ACTIVATE", "OVERRIDE", "REJECT"],
  },
  OVERRIDDEN: {
    label: "Overridden",
    color: "#f97316",
    bgClass: "bg-orange-100",
    textClass: "text-orange-800",
    description: "Window shifted by controller override",
    allowedActions: ["APPROVE", "REJECT", "ACTIVATE"],
  },
  REJECTED: {
    label: "Rejected",
    color: "#ef4444",
    bgClass: "bg-red-100",
    textClass: "text-red-800",
    description: "Denied by section controller",
    allowedActions: [],
  },
  ACTIVE: {
    label: "Active",
    color: "#3b82f6",
    bgClass: "bg-blue-100",
    textClass: "text-blue-800",
    description: "Work currently in progress",
    allowedActions: ["EXTEND", "RESTORE"],
  },
  EXTENDED: {
    label: "Extended",
    color: "#f97316",
    bgClass: "bg-orange-100",
    textClass: "text-orange-800",
    description: "Extension granted beyond original window",
    allowedActions: ["RESTORE"],
  },
  RESTORED: {
    label: "Restored",
    color: "#8b5cf6",
    bgClass: "bg-violet-100",
    textClass: "text-violet-800",
    description: "Block restored, pending completion",
    allowedActions: ["COMPLETE"],
  },
  COMPLETED: {
    label: "Completed",
    color: "#22c55e",
    bgClass: "bg-green-100",
    textClass: "text-green-800",
    description: "Block closed in audit ledger",
    allowedActions: [],
  },
};

export const REASON_CODES = [
  { value: "ROUTINE_SANCTION", label: "ROUTINE_SANCTION — Standard authorized maintenance" },
  { value: "WEATHER_ADVISORY", label: "WEATHER_ADVISORY — Fog/Rain/Heat constraint shift" },
  { value: "OPERATIONAL_EMERGENCY", label: "OPERATIONAL_EMERGENCY — Urgent track/signal failure" },
  { value: "VIP_MOVEMENT", label: "VIP_MOVEMENT — High-priority special passenger path" },
  { value: "MACHINE_BREAKDOWN", label: "MACHINE_BREAKDOWN — Track machine maintenance delay" },
  { value: "TRAFFIC_CONGESTION", label: "TRAFFIC_CONGESTION — Upstream corridor train backlog" },
  { value: "ROLLING_STOCK_DELAY", label: "ROLLING_STOCK_DELAY — Freight/Goods regulation shift" },
  { value: "CUSTOM", label: "CUSTOM — Other operational reason (specify in notes)" },
];

/** Get the status config, with a safe fallback */
export function getBlockStatusConfig(status: string): BlockStatusConfig {
  return BLOCK_STATUS_MAP[status as BlockStatus] ?? {
    label: status,
    color: "#9ca3af",
    bgClass: "bg-gray-100",
    textClass: "text-gray-800",
    description: "Unknown status",
    allowedActions: [],
  };
}

/** Check if an action is legal from the current state */
export function isActionAllowed(currentStatus: BlockStatus, action: BlockAction): boolean {
  const config = BLOCK_STATUS_MAP[currentStatus];
  return config ? config.allowedActions.includes(action) : false;
}
