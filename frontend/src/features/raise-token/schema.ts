import { z } from "zod";
import { Department } from "@/auth/types";

export const planningContextSchema = z.object({
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  estimated_duration_minutes: z.number().min(1, "Duration must be at least 1 minute"),
  due_date: z.string().min(1, "Due date is required"),
  required_crews: z.array(z.string()).min(1, "At least one crew is required"),
  required_equipment: z.array(z.string()),
  requires_traffic_block: z.boolean().default(false),
  requires_traction_disconnection: z.boolean().default(false),
  co_working_compatible: z.boolean().default(false),
});

export const tmsRecordSchema = z.object({
  ticket_id: z.string().min(1, "Ticket ID is required"),
  track_id: z.string().min(1, "Track ID is required"),
  km_start: z.number().min(0),
  km_end: z.number().min(0),
  defect_class: z.string().min(1, "Defect class is required"),
  date_detected: z.string().min(1, "Date detected is required"),
});

export const smmsRecordSchema = z.object({
  fault_id: z.string().min(1, "Fault ID is required"),
  station_code: z.string().min(1, "Station code is required"),
  gear_type: z.string().min(1, "Gear type is required"),
  failure_category: z.string().min(1, "Failure category is required"),
  reported_ts: z.string().min(1, "Reported timestamp is required"),
  urgency_code: z.string().min(1, "Urgency code is required"),
});

export const tdmsRecordSchema = z.object({
  defect_no: z.string().min(1, "Defect no is required"),
  ohe_substation: z.string().min(1, "OHE substation is required"),
  mast_from: z.number().min(0),
  mast_to: z.number().min(0),
  issue_type: z.string().min(1, "Issue type is required"),
  scheduled_date: z.string().min(1, "Scheduled date is required"),
});

export function getFormSchemaForDepartment(dept: Department) {
  switch (dept) {
    case "ENGINEERING":
      return z.object({
        source_system: z.literal("TMS"),
        record: tmsRecordSchema,
        planning_context: planningContextSchema,
      });
    case "SIGNAL_TELECOM":
      return z.object({
        source_system: z.literal("SMMS"),
        record: smmsRecordSchema,
        planning_context: planningContextSchema,
      });
    case "TRACTION":
      return z.object({
        source_system: z.literal("TDMS"),
        record: tdmsRecordSchema,
        planning_context: planningContextSchema,
      });
  }
}
