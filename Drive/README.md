# 📂 VibeVenue — Reviewer Evaluation Dossier & Media Artifacts

Welcome to the **VibeVenue Reviewer Media Hub**. This directory contains all primary high-resolution screen recordings and interface screenshots organized logically by functional area to streamline code review, architecture verification, and end-to-end evaluation.

---

## 🎬 Section 1: End-to-End Screen Recordings (`01_Video_Walkthroughs/`)

| File Name | Functional Area Verified | What Reviewers Will Observe |
| :--- | :--- | :--- |
| **`01_Delegate_Registration_UPI_Payment_and_Email_Confirmation.mp4`** | Student Registration & Resend Delivery | Complete delegate sign-up flow: dynamic UPI checkout QR, UTR reference entry, payment screenshot attachment, instant pass issuance, and transactional email delivery via Resend. |
| **`02_Capacity_Saturation_and_Waitlist_Queuing_Positions_1_and_2.mp4`** | Capacity Saturation & FIFO Waitlist | Live verification filling 10/10 confirmed event seats, assigning the 11th applicant as `Waitlist (#1)`, and the 12th applicant as `Waitlist (#2)` with custom queue passes and notification emails. |
| **`03_Cancellation_Queue_Advancement_and_Auto_Promotion.mp4`** | Cancellation & PostgreSQL Trigger Promotion | Delegate registration cancellation releasing seat, triggering instant automatic promotion of `Waitlist (#1)` to Confirmed status with new ticket pass, and advancing `Waitlist (#2)` to `#1`. |
| **`04_1_Click_Attendee_Roster_CSV_Export.mp4`** | Client-Side CSV Export Engine | Instant generation and client-side UTF-8 BOM download of delegate rosters from `/registrations` with custom date-stamped filename (`vibevenue_registrations_YYYY-MM-DD.csv`). |
| **`05_60FPS_Camera_QR_Gate_Scanner_and_Audio_Verification.mp4`** | 60FPS Camera Gate Scanner Check-in | Direct Canvas 2D frame grabber scanning digital QR passes at 60 FPS with rapid pass validation, audio chime feedback, and instantaneous attendance check-in. |

---

## 🖥️ Section 2: Administrative Consoles (`02_Administrative_Consoles/`)

| File Name | Console View | Operational Capability |
| :--- | :--- | :--- |
| **`01_Executive_Analytics_and_30Day_Velocity_Telemetry.png`** | Overview / Analytics Dashboard | Live KPI stat cards (Total Events, Active Events, Registrations, Waitlist, 84% Capacity), 30-day velocity telemetry curve, and live registrations table. |
| **`02_Event_Catalog_and_Track_Directory_with_Capacity_Bars.png`** | Events Catalog | Category-filter pills (Hackathons, Coding, Cloud, Security), event cards with dynamic mode badges, date intervals, and live occupancy bars. |
| **`03_Event_Specification_Dossier_and_90Percent_Occupancy_Matrix.png`** | Event Specification Dossier | High-craft event detail view: hero branding, 90% occupancy circular donut gauge, session timeline, and enrolled attendees tab. |
| **`04_Central_Delegate_Registrations_Desk_and_Filters.png`** | Delegate Registrations Table | Full registration management desk with real-time text search, filter pills (All, Confirmed, Waitlisted, Cancelled), payment audit status, and CSV export. |
| **`05_Granular_Attendee_Inspection_Dossier_and_Payment_Verification.png`** | Attendee Dossier Modal | Deep attendee profile audit (Kavya S), uploaded UPI payment proof image, check-in timeline audit, and physical merchandise checklist. |
| **`06_Team_Attendance_Roster_Clearance_and_Turnout_Hub.png`** | Turnout & Gate Attendance | Turnout KPI cards (Total, Present, Absent, Teams) with expandable team cards and member-by-member gate clearance checkboxes. |
| **`07_Registration_Decision_Hub_and_Dynamic_Pricing_Verification.png`** | Registration Review Desk | Administrative decision controls (Approve, Request Info, Decline) and tiered pricing verification (CSI/IEEE member rate). |

---

## 🎫 Section 3: Student Portal & Digital Passes (`03_Student_Portal_and_Digital_Passes/`)

| File Name | Portal Step | User Experience |
| :--- | :--- | :--- |
| **`01_Delegate_Registration_UPI_QR_and_Proof_Upload.png`** | UPI Payment Gateway Step | High-contrast dynamic UPI QR code generator, payee VPA, amount auto-calculation, UTR transaction reference input, and payment receipt upload. |
| **`02_Confirmed_Delegate_Digital_Gate_Pass_with_Dynamic_QR.png`** | Confirmed Gate Pass | Official entrance credential with high-density dynamic QR code, ticket code (`TCK-598947`), category badge, and venue coordinates. |
| **`03_Waitlist_Pass_Issued_with_Queue_Position_1_Badge.png`** | Waitlist Queue Pass | High-contrast waitlist pass with prominent `WAITLISTED (#1)` badge, queue tracking QR, and real-time status banner. |

---

## 📬 Section 4: Automated Email Notifications (`04_Automated_Email_Notifications/`)

| File Name | Email Template | Delivery Context |
| :--- | :--- | :--- |
| **`01_Confirmed_Registration_Pass_Delivery_Email.jpeg`** | Confirmed Ticket Pass Email | Transactional pass delivered via Resend with scannable QR ticket badge, event venue, time coordinates, and attendee details. |
| **`02_Waitlist_Queue_Advancement_Position_Update_Email.jpeg`** | Queue Advancement Email | Notification automatically sent to waitlist attendees when an ahead attendee cancels (`Position #2 ➔ Position #1`) with updated tracking QR badge. |
| **`03_Registration_Cancellation_and_Seat_Revocation_Email.jpeg`** | Cancellation Receipt Email | Instant revocation receipt notifying attendee that their seat was released to the waitlist. |

---

## 🛡️ Section 5: System Safeguards & Telemetry (`05_System_Safeguards_and_Backend_Telemetry/`)

| File Name | Safeguard / Metric | System Behavior |
| :--- | :--- | :--- |
| **`01_Scheduling_Conflict_Prevention_Warning_Banner.png`** | Overlap Conflict Banner | Warning banner alerting attendee of simultaneous event registrations and offering 1-click cancellation of conflicting pass. |
| **`02_Scheduling_Conflict_Interception_Toast_Modal.png`** | Conflict Interception Toast | Prominent non-blocking alert intercepting overlapping registration attempts before form submission. |
| **`03_Registration_Deadline_Windows_and_Spot_Access_Controls.png`** | Registration Deadline Config | Fine-grained deadline timestamps for online admissions and on-desk spot walk-in registrations. |
| **`04_Supabase_Edge_Function_Email_Automation_Telemetry.png`** | Supabase Edge Metrics | Invocations dashboard showing 59 executions, 0% error rate, and 159ms average execution speed. |
| **`05_Edit_Event_Specification_Event_Info_Modal.png`** | Event Metadata Form | Form controls for event banner upload, logo, title, tagline, description, and event format. |
| **`06_Edit_Event_Specification_Resources_and_Comms_Modal.png`** | Event Resources & Comms | Pre-registration links, post-registration materials, setup guides, and customized email confirmation messages. |
| **`07_Supabase_Database_Event_Addons_and_Pricing_Schema.png`** | Supabase Table Editor | Direct database schema inspection showing `event_addons` table, RLS policies, and pricing structures. |

---
*Generated for VibeVenue Executive Reviewers.*
