import { Timestamp } from 'firebase/firestore';

export type Department = "ENGINEERING" | "SIGNAL_TELECOM" | "TRACTION";

export interface UserProfile {
  uid: string; // The Firestore document ID matches Firebase Auth UID
  fullName: string;
  /**
   * KNOWN LIMITATION:
   * The 'employeeId' field uniqueness is NOT enforced client-side.
   * Real uniqueness requires either backend validation or a Firestore
   * security rule with a separate lookup collection.
   */
  employeeId: string;
  department: Department;
  designation?: string;
  zoneOrDivision?: string;
  email: string;
  createdAt: Timestamp;
}
