import { z } from "zod";
import { pgTable, serial, varchar, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";


// Simple assignment schema for in-memory use
export const insertAssignmentSchema = z.object({
  bookingRef: z.string(),
  driverName: z.string(),
});

export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = InsertAssignment & { id?: number; assignedAt?: Date };

export type BookingType = 'departures' | 'arrivals';

// === DATABASE TABLES ===
export const bookingsStatus = pgTable("bookings_status", {
  id: serial("id").primaryKey(),
  bookingRef: varchar("booking_ref", { length: 64 }).notNull().unique(),
  type: varchar("type", { length: 32 }).notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  driver: varchar("driver", { length: 255 }).notNull().default(""),
  autoSendLocation: boolean("auto_send_location").notNull().default(false),
  locationSent: boolean("location_sent").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const locationLogs = pgTable("location_logs", {
  id: serial("id").primaryKey(),
  bookingRef: varchar("booking_ref", { length: 64 }).notNull(),
  location: varchar("location", { length: 32 }).notNull(),
  sendType: varchar("send_type", { length: 32 }).notNull(),
  success: boolean("success").notNull(),
  errorMessage: varchar("error_message", { length: 512 }),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow(),
});

export const contactTypes = pgTable("contact_types", {
  id: serial("id").primaryKey(),
  description: varchar("description", { length: 64 }).notNull().unique(),
});

export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  mobilePhone: varchar("mobile_phone", { length: 32 }).notNull(),
  preferredContactTypeId: serial("preferred_contact_type_id").notNull().references(() => contactTypes.id),
  acceptedContactTypeId: serial("accepted_contact_type_id").notNull().references(() => contactTypes.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// === DATA SCHEMAS ===

// List View Item
export const bookingListItemSchema = z.object({
  ref: z.string(),
  status: z.string(),
  arrivaldate: z.string(),
  departuredate: z.string(),
  passengername: z.string(),
  vehicle: z.string(),
});

// The API returns an object of objects for the list
export const bookingsListResponseSchema = z.object({
  bookings: z.record(z.string(), bookingListItemSchema)
});

// Detail View Item
const bookingGeneralSchema = z.object({
  ref: z.string(),
  status: z.string(),
  passengername: z.string(),
  adults: z.number(),
  children: z.number(),
});

const arrivalDetailSchema = z.object({
  fromairport: z.string(),
  arrivaldate: z.string(),
  accommodationname: z.string(),
  flightno: z.string().optional(),
});

const departureDetailSchema = z.object({
  toairport: z.string(),
  pickupdate: z.string().optional(),
  departuredate: z.string().optional(),
  accommodationname: z.string(),
  flightno: z.string().optional(),
});

export const bookingDetailSchema = z.object({
  booking: z.object({
    general: bookingGeneralSchema,
    arrival: arrivalDetailSchema.optional(),
    departure: departureDetailSchema.optional(),
  }),
});

export const bookingDetailWithStatusSchema = bookingDetailSchema.extend({
  bookingStatus: z.object({
    driver: z.string(),
    autoSendLocation: z.boolean(),
    locationSent: z.boolean(),
  }).optional(),
});

export type BookingListItem = z.infer<typeof bookingListItemSchema>;
export type BookingsListResponse = z.infer<typeof bookingsListResponseSchema>;
export type BookingDetailResponse = z.infer<typeof bookingDetailSchema>;
export type BookingDetailWithStatusResponse = z.infer<typeof bookingDetailWithStatusSchema>;

// Driver schemas
export const driverSchema = z.object({
  id: z.number(),
  name: z.string(),
  mobilePhone: z.string(),
  preferredContactTypeId: z.number(),
  acceptedContactTypeId: z.number(),
});

export const contactTypeSchema = z.object({
  id: z.number(),
  description: z.string(),
});

export type Driver = z.infer<typeof driverSchema>;
export type ContactType = z.infer<typeof contactTypeSchema>;

export const assignDriverSchema = z.object({
  driverName: z.string(),
});

// Location schemas
export const locationSchema = z.object({
  id: z.number(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const InsertLocationSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  latitude: z.number({ required_error: "Latitude é obrigatória" }),
  longitude: z.number({ required_error: "Longitude é obrigatória" }),
});

export const updateLocationSchema = InsertLocationSchema.partial();

export type Location = z.infer<typeof locationSchema>;
export type InsertLocation = z.infer<typeof InsertLocationSchema>;
export type UpdateLocation = z.infer<typeof updateLocationSchema>;

