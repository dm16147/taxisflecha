import {
  type Assignment,
  type InsertAssignment,
  type BookingsListResponse,
  type BookingDetailResponse,
} from "@/shared/schema";

export interface IStorage {
  // Mock Data Methods
  getBookingsList(): Promise<BookingsListResponse>;
  getBookingDetail(ref: string): Promise<BookingDetailResponse | undefined>;
  
  // Assignment Methods
  assignDriver(assignment: InsertAssignment): Promise<Assignment>;
}

export class MemStorage implements IStorage {
  private assignments: Map<number, Assignment>;
  private currentId: number;

  constructor() {
    this.assignments = new Map();
    this.currentId = 1;
  }

  async getBookingsList(): Promise<BookingsListResponse> {
    return {
      "bookings": {
          "booking_0": {
              "ref": "BAHOL-24591526",
              "status": "ACON",
              "arrivaldate": "",
              "departuredate": "2025-11-08T20:05:00",
              "passengername": "Mrs Mary Ann Smith",
              "vehicle": "Shared Shuttle"
          },
          "booking_1": {
              "ref": "BAHOL-999999",
              "status": "PEND",
              "arrivaldate": "",
              "departuredate": "2025-11-08T21:00:00",
              "passengername": "Mr John Doe",
              "vehicle": "Private Taxi"
          }
      }
    };
  }

  async getBookingDetail(ref: string): Promise<BookingDetailResponse | undefined> {
    // In a real app we'd look up by ref, but here we return the mock detail 
    // regardless of ref, as per instructions to use the static JSON.
    // We can verify the ref matches if we want, but for simulation we just return the mock.
    
    return {
      "booking": {
          "general": {
              "ref": ref, // Echo back the ref so it looks correct in UI, or use the mock ref "VPG-24545227"
              "status": "ACON",
              "passengername": "Mr Harminder Kumar",
              "adults": 2,
              "children": 1
          },
          "arrival": {
              "fromairport": "London Gatwick (LGW)",
              "arrivaldate": "2025-12-02T16:40:00",
              "accommodationname": "Hospes Infante Sagres Porto"
          }
      }
    };
  }

  async assignDriver(insertAssignment: InsertAssignment): Promise<Assignment> {
    const id = this.currentId++;
    const assignment: Assignment = { ...insertAssignment, id, assignedAt: new Date() };
    this.assignments.set(id, assignment);
    return assignment;
  }
}

export const storage = new MemStorage();
