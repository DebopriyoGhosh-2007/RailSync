# RailSync Frontend Work Documentation

## 1. Project Overview

RailSync is a browser-based railway maintenance planning and operational decision-support application. The frontend brings maintenance work from multiple railway departments into one planning workflow, evaluates candidate work windows, calculates explainable priority, creates proposed coordinated block plans, simulates train-operation impact, monitors live block execution, and gives authorized controllers a cockpit for sanctioning and audit.

The frontend is implemented as a collection of server-served HTML pages with page-specific vanilla JavaScript and CSS. There is no React, Vue, Angular, TypeScript, bundler, or frontend package manager in the repository.

The main application is not a static-only website. Pages are served by the FastAPI application in `backend/main.py`, and browser scripts communicate with JSON API endpoints under `/api/v1`. Static files are mounted at `/static`.

## 2. Frontend Technology

### Core technologies

- HTML5 documents with responsive viewport metadata.
- Vanilla JavaScript using `fetch`, `FormData`, DOM APIs, template strings, and WebSocket APIs.
- CSS split into shared styles and page-specific stylesheets.
- FastAPI serves the pages and static assets.
- SQLite-backed data is exposed through the backend API.
- Google Fonts are loaded remotely:
  - DM Sans for body/UI text.
  - Manrope for display headings.
  - JetBrains Mono is additionally used by the operations cockpit for technical values.
- No frontend npm dependencies are present.

### Application shell

Most production pages share these elements:

- RailSync brand mark and wordmark.
- Primary navigation linking to Overview, Data intake, Feasibility, Priority, Block plan, Operations data, What-if, Live monitor, and Cockpit.
- Feature status label such as `Authoritative input only`, `Proposed plan only`, or `Alerts and recommendations only`.
- Main feature content.
- Footer with the feature name and an operational disclaimer.

The overview page has a richer dashboard shell with notifications, profile identity, metrics, a visual corridor illustration, a timeline, a priority queue, and a stored live-state panel.

## 3. User Workflow

The intended planning flow is:

1. Register an authoritative network reference in Data intake.
2. Ingest a TMS, SMMS, or TDMS maintenance record with planning context.
3. Review whether the record is normalized as `COMPLETE` or stored as `NEEDS_REVIEW`.
4. Import timetable occupancy, goods forecasts, and COA availability in Operations data.
5. Assess a normalized task against a live weather forecast and authority-approved limits in Feasibility.
6. Calculate an explainable 0-100 priority score in Priority.
7. Review task eligibility and submit weekly or monthly COA windows in Block plan.
8. Inspect scheduled and deferred work, including shared block metrics.
9. Use What-if to estimate train regulation and delay impact before sanction.
10. Open the Operations Cockpit to inspect proposed blocks and record human decisions.
11. Use Live monitor to submit field progress updates and receive overrun or early-restoration recommendations.
12. Use the cockpit audit ledger and memo export features to preserve the decision trail.

The application repeatedly communicates that recommendations are not approvals and that final operational authority remains with an authorized human controller.

## 4. Page Inventory

### 4.1 Overview: `index.html` and `app.js`

Route: `/`

Purpose: Dashboard landing page for the current stored planning state.

Main frontend areas:

- Top navigation and RailSync brand.
- Hero heading: automatic block planning and coordinated maintenance windows.
- Primary actions:
  - Generate weekly plan, routed to `/planner`.
  - Run what-if scenario, routed to `/what-if`.
- CSS-built railway corridor illustration containing hills, sun, clouds, signal, poles, track, train, and department chips.
- Four planning KPI cards:
  - Planned availability.
  - Shared block hours.
  - Scheduled tasks.
  - Sanctioned blocks.
- Current stored plan timeline.
- Department legend for Engineering, S&T, and Traction.
- Priority queue for unscheduled tasks needing review.
- Stored live block state panel.
- Footer data connection status.
- Generic planning assistant modal markup.

`app.js` behavior:

- Calls `/api/v1/cockpit/summary` and `/api/v1/cockpit/identity` in parallel.
- Renders KPI values from stored backend records.
- Renders configured actor initials and role into the profile area.
- Renders stored blocks by section, effective time, and state.
- Renders up to three unscheduled tasks.
- Shows active or extension-requested blocks in the live panel.
- Escapes dynamic values before inserting them into HTML.
- Handles `[data-route]` navigation.
- Supports closing the generic modal by close button, cancel button, backdrop click, or Escape.
- Updates the active navigation link on click.

Important behavior: planned availability remains blank when no approved availability baseline exists. The backend intentionally returns no inferred percentage in this situation.

### 4.2 Data intake: `intake.html` and `intake.js`

Route: `/intake`

Feature: F-01 multi-department integration.

The page is divided into two tabs:

#### Tab 1: Register reference

Collects a controlled mapping from an authorized network master:

- Source system: TMS, SMMS, or TDMS.
- Source reference.
- Controlled section ID.
- Asset type.
- Start kilometre.
- End kilometre.
- Asset reference.

The browser posts the form to `/api/v1/network-references`. Successful registration displays a reference ID, section, and source reference. Duplicate authoritative references are rejected by the backend.

#### Tab 2: Ingest maintenance record

Collects:

- Source system.
- Severity.
- Original source JSON.
- Estimated duration.
- Due date and time.
- Required crews, entered one per line.
- Required equipment, entered one per line.
- Traffic-block requirement.
- Traction-disconnection requirement.
- Co-working compatibility.

The source guide changes with the source system:

- TMS requires `ticket_id`, `track_id`, `km_start`, `km_end`, `defect_class`, and `date_detected`.
- SMMS requires `fault_id`, `station_code`, `gear_type`, `failure_category`, `reported_ts`, and `urgency_code`.
- TDMS requires `defect_no`, `ohe_substation`, `mast_from`, `mast_to`, `issue_type`, and `scheduled_date`.

The browser parses the source JSON locally and posts the normalized request to `/api/v1/ingestion/tasks`.

Result states:

- `COMPLETE`: displays the normalized task, department, section, kilometre range, asset, maintenance type, due date, duration, crews, equipment, and isolation requirements.
- `NEEDS_REVIEW`: retains the original record and displays review reasons without guessing a section or kilometre range.
- Validation error: shows a correction message and does not present a normalized result.

The page also loads `/api/v1/ingestion/tasks` and renders a persisted traceability table containing received time, source, source reference, data quality, and review reason. A refresh button reloads the table.

Duplicate-complete ingestion handling:

- If the API returns a conflict and a source ID is available, the browser looks up the existing record and displays that existing normalized task instead of treating it as a new task.

### 4.3 Operations data: `operations-data.html` and `operations-data.js`

Route: `/operations-data`

Feature: Operational data integration for timetable occupancy, goods forecasts, and COA windows.

Import form:

- Record type selector:
  - Timetable occupancy.
  - Goods forecast.
  - COA availability window.
- Source JSON textarea.
- Dynamic field guide describing the required JSON structure.
- Import status panel.

Client-side endpoint mapping:

- Timetable: `POST /api/v1/operations/timetable-occupancy`
- Goods: `POST /api/v1/operations/goods-forecasts`
- COA: `POST /api/v1/operations/coa-windows`

COA records must cite existing timetable and goods records. The backend validates that those records exist, match the COA section, and cover the complete COA interval.

Stored register:

- Loads `/api/v1/operations/summary`.
- Displays grouped counts and records for timetable occupancy, goods forecasts, and COA windows.
- Supports manual refresh.

Integrated planning section:

- Select weekly or monthly horizon.
- Enter horizon start and end.
- Posts to `/api/v1/block-plans/from-integrated-data`.
- Displays generated plan ID and scheduled task count.
- Uses stored COA, timetable, and goods data to resolve train-impact counts during planning.

### 4.4 Feasibility: `feasibility.html` and `feasibility.js`

Route: `/feasibility`

Feature: F-02 operating-condition feasibility and risk assessment.

The page loads complete normalized tasks from `/api/v1/ingestion/tasks` into a task selector.

Assessment input:

- Normalized task.
- Section latitude and longitude.
- Proposed block date and time.
- Rule version or circular reference.
- Engineering maximum temperature.
- Traction maximum wind speed.
- Traffic-block minimum visibility.
- Caution risk multiplier.

The browser posts to `/api/v1/feasibility/assessments`.

Result presentation:

- `SUITABLE`.
- `CAUTION_REQUIRED`.
- `NOT_SUITABLE`.
- `NEEDS_REVIEW`.
- Forecast timestamp.
- Temperature, wind speed, visibility, and risk multiplier when available.
- Rule version.
- Warning reasons.

The UI deliberately leaves optional rule fields blank rather than inventing thresholds. The backend queries Open-Meteo for the selected forecast hour. Missing forecast data or missing applicable rules produces `NEEDS_REVIEW`.

### 4.5 Priority: `priority.html` and `priority.js`

Route: `/priority`

Feature: F-03 explainable cross-department prioritization.

The page loads complete tasks from `/api/v1/ingestion/tasks`.

Operational context input:

- Eligible task.
- Passenger trains per day.
- Goods forecast per day.
- Section traffic GMT.
- Route criticality score.
- Active operational restriction checkbox.

Policy input:

- Policy or circular version.
- Severity scores for Critical, High, Medium, and Low.
- Maximum overdue days.
- Maximum passenger trains per day.
- Maximum goods trains per day.
- Maximum section traffic GMT.
- Active restriction score.
- Maximum F-02 weather risk multiplier.
- Factor weights for severity, overdue age, passenger demand, goods demand, traffic, restriction, route criticality, and weather.
- Critical, high, and medium tier thresholds.

The browser posts an inline policy object to `/api/v1/priority/evaluations`.

Result presentation:

- Priority tier.
- Score out of 100.
- Task ID.
- Top contributing factors.
- Input score, weight, and score contribution for each displayed factor.
- Policy version.

The backend requires a current eligible F-02 assessment before calculating priority. The model is a transparent weighted rules calculation rather than an ML prediction.

### 4.6 Block planner: `planner.html`, `planner.js`, and `planner.css`

Route: `/planner`

Feature: F-04 weekly and monthly coordinated block optimizer.

Eligibility panel:

The JavaScript inserts an automatic task pool before the planner form. It loads `/api/v1/block-plans/eligibility` and displays:

- Task ID.
- Department.
- Section.
- F-03 score.
- Eligibility state.
- Missing requirements.
- Required COA start hour from the eligible F-02 assessment.

A task is eligible only when it has complete F-01 data, an eligible F-02 assessment, and an F-03 priority evaluation.

Planning form:

- Weekly or monthly horizon.
- Horizon start.
- Horizon end.
- COA windows JSON array.

Each COA window must include corridor ID, section ID, start/end time, maximum simultaneous crews, traffic-block availability, traction-disconnection availability, timetable reference, goods forecast reference, passenger trains affected, and goods trains affected.

The browser parses the JSON array and posts to `/api/v1/block-plans`.

Plan result:

- Proposed status.
- Scheduled task count.
- Distinct block count.
- Total priority points scheduled.
- Shared block count.
- Block hours used.
- Unscheduled task count.
- Passenger and goods trains affected.
- Optimizer notes.
- Search-timeout warning when applicable.

Detailed blocks show:

- Corridor and section.
- Window start and end.
- Assigned task count and departments.
- Timetable and goods references.
- Used versus available minutes.
- Assigned task IDs.
- Department.
- Priority score.
- Scheduled interval.
- Traffic and traction isolation requirements.

Deferred work is shown separately with an explanation for each task.

The backend optimizer enforces section matching, F-02 assessment hour matching, COA capacity, isolation availability, due dates, crew/equipment conflict checks, and co-working compatibility. The output remains `PROPOSED` until a human controller acts in the cockpit.

### 4.7 What-if simulation: `what-if.html` and `what-if.js`

Route: `/what-if`

Feature: F-05 controller what-if operational-impact simulation.

Inputs:

- Corridor ID.
- Section from station code.
- Section to station code.
- Block start and end time.
- Optional verified train schedules JSON array.

If train JSON is blank, the backend derives representative schedules from imported timetable occupancy records. The page clearly labels the result as a planning estimate and not live movement authority.

The browser posts to `/api/v1/simulate/what-if`.

Result presentation:

- Clear or impact status.
- Passenger delay minutes.
- Freight delay minutes.
- Number of regulated trains.
- Network punctuality impact percentage.
- Simulation ID.
- Regulated train table with train number, type, held station, delay, original arrival, and simulated arrival.
- Headway conflict warnings.

The backend uses a graph-based delay propagation model. It rejects the request when neither matching imported timetable data nor operator-supplied schedules are available.

### 4.8 Live monitor: `live-monitor.html`, `live-monitor.js`, and `live-monitor.css`

Route: `/live-monitor`

Feature: F-06 live execution monitoring.

Telemetry form:

- Block ID.
- Corridor ID.
- Supervisor ID.
- Actual progress percentage.
- Estimated minutes remaining.
- Optional timestamp, defaulting to the current time in the browser.

On submit, the browser:

1. Opens or reconnects a WebSocket for the corridor at `/ws/live-blocks/{corridor_id}`.
2. Posts the update to `/api/v1/telemetry/progress-update`.
3. Displays accepted block state.
4. Renders the response immediately so the interface does not depend on WebSocket timing.

WebSocket behavior:

- Detects `https` and chooses `wss`; otherwise uses `ws`.
- Displays Connecting, Connected, Disconnected, and Connection error states.
- Prepends incoming feed items.
- Shows raw text if a WebSocket message is not valid JSON.

Feed states:

- Active.
- Extension requested.
- Cleared early.
- Completed.
- Pending start.

Alert types:

- Overrun warning with overrun minutes, revised handover, and first impacted timetable information.
- Early restoration available with recoverable slack capacity and recommended action.

The page repeatedly states that alerts are advisory. It does not autonomously extend a block, restore a line, issue signals, or direct station staff.

### 4.9 Operations cockpit: `cockpit.html`, `cockpit.js`, and `cockpit.css`

Route: `/cockpit`

Features: F-07 planner/dispatcher cockpit and F-08 human approval, override, audit, and reporting.

Cockpit header:

- Active role badge.
- Configured controller identity card.
- Officer name field.
- Authorized role selector.
- Audit ledger button.

KPI deck:

- Block hours saved.
- Planned line availability.
- Coordinated blocks.
- Sanction queue split into Proposed, Sanctioned, and Overridden.
- Deferred or critical queue.

Controls:

- Corridor section filter.
- Sanction state filter.
- Department legend.
- Refresh summary.
- Open embedded What-if drawer.

Gantt timeline:

- Loads real data from `/api/v1/cockpit/summary`.
- Groups blocks by section.
- Calculates a time axis from the visible block range.
- Positions block pills proportionally by start and duration.
- Visually segments Engineering, Signal & Telecom, and Traction departments.
- Displays state, time, duration, task count, and traffic/traction precaution icons.
- Supports mouse click and keyboard Enter/Space activation.
- Displays an empty state when no block plans exist.
- Displays a filtered empty state when no blocks match the selected filters.

Deferred work section:

- Shows deferred task ID, abbreviated plan ID, and exclusion reason.
- Remains hidden when there are no deferred tasks.

Block inspection and sanction modal:

- Section and current state.
- Scheduled and effective windows.
- Duration.
- Traffic block requirement.
- 25kV traction power disconnection requirement.
- Passenger and goods impact.
- Consolidated departmental task table.
- Feasibility and data-quality status.
- Priority factor contribution breakdown.
- Human action controls.
- Block audit history.
- Memo export actions.

Human action choices:

- Approve or sanction.
- Override or shift window.
- Reject.
- Record active.
- Request extension.
- Record restoration.
- Complete block.

Override and extension choices reveal modified date/time inputs. Justification notes have a live character counter and a minimum five-character requirement. Reason codes include routine sanction, weather advisory, operational emergency, VIP movement, machine breakdown, traffic congestion, rolling-stock delay, and custom.

Action API:

- Block actions post to `/api/v1/blocks/{block_id}/action`.
- The browser sends plan ID, actor, role, action, reason code, justification, and optional modified window.
- The backend verifies the submitted identity against server configuration and enforces role/state transitions.
- Each accepted decision is appended to the audit ledger.

Audit drawer:

- Loads `/api/v1/audit/logs?limit=50`.
- Displays timestamp, block, actor/role, action, reason code, and justification.
- Closes through the close button or backdrop click.

Block audit history:

- Loads `/api/v1/blocks/{block_id}/audit-logs`.
- Displays chronological action, actor, role, timestamp, reason code, and notes.

Embedded What-if drawer:

- Loads available timetable hints from `/api/v1/simulate/what-if/hints`.
- Allows corridor, section, window, and optional train schedule input.
- Converts local datetime values to UTC ISO timestamps.
- Calls `/api/v1/simulate/what-if`.
- Displays passenger delay, regulated trains, punctuality impact, warnings, and a regulated-train breakdown.
- Shows an inline error/info banner instead of browser alert dialogs.

Exports:

- PDF memo: opens `/api/v1/blocks/{block_id}/export-memo?format=pdf`.
- Printable HTML memo: opens the same endpoint with `format=html`.
- Decision JSON: generates departmental transfer JSON files in the browser and downloads one file per department represented in the block.

The backend memo generator explicitly labels output as a draft and not an official authority-approved sanction format.

## 5. Shared Styling and Visual System

### `styles.css`

Provides the primary global visual language:

- CSS variables for colors, spacing, borders, typography, and status colors.
- Application shell and topbar.
- Brand mark.
- Navigation links.
- Shared buttons.
- Hero and dashboard layout.
- Metric cards.
- Timeline and planner surfaces.
- Modal styling.
- Shared responsive rules.

### `overrides.css`

Contains later overrides and refinements applied after the base styles. It is loaded on the main dashboard and most workflow pages.

### `intake.css`

Provides the shared workflow-page system used by Data intake, Feasibility, Priority, Planner, Operations data, What-if, and Live monitor:

- Intro banner.
- Two-column form/result layout.
- Form cards.
- Field grids.
- Tabs.
- Result states.
- Source and JSON guides.
- Persisted-record tables.
- Status badges.
- Responsive stacking for smaller viewports.

### Feature stylesheets

- `planner.css`: candidate task table, block detail cards, assignment tables, deferred queue, and planning-specific layout.
- `operations-data.css`: operational import groups, stored-record presentation, and integrated plan area.
- `what-if.css`: simulation detail, impact tables, warnings, and disclaimer styling.
- `live-monitor.css`: WebSocket status indicators, alert feed, progress bars, overrun/early-restoration alerts, and safeguard notice.
- `cockpit.css`: high-density operational dashboard, Gantt timeline, state badges, modal, drawers, audit tables, action controls, and cockpit-specific responsive behavior.

The interface uses a light, high-contrast operational aesthetic with teal/green control accents, orange and blue department/status accents, compact data tables, and restrained rounded panels. The cockpit additionally uses monospace typography for timestamps and technical values.

## 6. Backend and Frontend Contract

### Page routes

FastAPI serves these HTML pages:

| Route | HTML file | Feature |
| --- | --- | --- |
| `/` | `index.html` | Overview dashboard |
| `/intake` | `intake.html` | F-01 maintenance intake |
| `/feasibility` | `feasibility.html` | F-02 feasibility |
| `/priority` | `priority.html` | F-03 priority |
| `/planner` | `planner.html` | F-04 block planning |
| `/operations-data` | `operations-data.html` | Operational records |
| `/what-if` | `what-if.html` | F-05 simulation |
| `/live-monitor` | `live-monitor.html` | F-06 live monitoring |
| `/cockpit` | `cockpit.html` | F-07/F-08 cockpit |

Static assets are available through `/static/{filename}`. The backend dynamically injects a Cockpit navigation link into pages that do not already contain one.

### Main JSON endpoints used by the frontend

- `GET /api/v1/cockpit/identity`
- `GET /api/v1/cockpit/summary`
- `POST /api/v1/network-references`
- `POST /api/v1/ingestion/tasks`
- `GET /api/v1/ingestion/tasks`
- `GET /api/v1/operations/summary`
- `POST /api/v1/operations/timetable-occupancy`
- `POST /api/v1/operations/goods-forecasts`
- `POST /api/v1/operations/coa-windows`
- `POST /api/v1/feasibility/assessments`
- `POST /api/v1/priority/evaluations`
- `GET /api/v1/block-plans/eligibility`
- `POST /api/v1/block-plans`
- `POST /api/v1/block-plans/from-integrated-data`
- `GET /api/v1/simulate/what-if/hints`
- `POST /api/v1/simulate/what-if`
- `POST /api/v1/telemetry/progress-update`
- `GET /api/v1/blocks/{block_id}/audit-logs`
- `POST /api/v1/blocks/{block_id}/action`
- `GET /api/v1/audit/logs`
- `GET /api/v1/audit/verify`
- `GET /api/v1/blocks/{block_id}/export-memo`
- `GET /api/v1/simulate/what-if/hints`
- WebSocket `/ws/live-blocks/{corridor_id}`

## 7. Data and Safety Principles Reflected in the UI

The frontend consistently reinforces these product rules:

- No sample operational data is displayed as real data.
- No source reference is silently guessed.
- Incomplete records are visible as `NEEDS_REVIEW`.
- Forecast and rule uncertainty is surfaced.
- Priority is explainable and versioned.
- Plans are proposals until human sanction.
- What-if values are estimates, not movement authority.
- Live monitoring produces alerts and recommendations only.
- Controller actions require identity, role, reason code, and justification.
- Audit history is visible and exportable.
- Sanction memo exports are drafts requiring railway-authority approval.

## 8. Standalone Test Page

### `test-user-input.html`

This file is separate from the RailSync operational workflow and does not use the shared app shell or backend API.

It is a browser-only validation demo named `railSYSTEM User Input Test` with:

- Origin station code.
- Destination station code.
- Proposed journey date.
- Preferred departure time.
- Train class.
- Inline station validation.
- Inline date validation.
- JSON output of the accepted form values.

Valid station codes are stored in a local JavaScript object, including NDLS, CSMT, HWH, MAS, SBC, LKO, BCT, and PNBE. The page rejects past dates and dates more than six months in the future. It is useful as a simple input-validation prototype but is not connected to the RailSync backend.

## 9. Runtime Setup

### Launch script

`start_server.bat`:

1. Sets `RAILSYNC_ACTOR=Ananda Jana`.
2. Sets `RAILSYNC_ROLE=Section Controller`.
3. Checks for Python 3.11 or newer.
4. Starts `uvicorn backend.main:app --reload`.
5. Exposes the app at `http://127.0.0.1:8000`.

### Python dependencies

`requirements.txt` includes:

- FastAPI.
- Pydantic.
- Uvicorn.
- HTTPX.
- NetworkX.
- Redis.
- ReportLab.

The frontend itself has no separate install or build step. It relies on the backend server being available because the HTML pages use `/static/...` asset paths and `/api/...` relative URLs.

### VS Code configuration

`.vscode/settings.json` selects the system Python environment manager:

```json
{
  "python-envs.defaultEnvManager": "ms-python.python:system"
}
```

## 10. Frontend Rebuild Parameter Specification

This section is the practical contract for an AI or frontend engineer rebuilding the interface with a more advanced, interactive implementation. Preserve the existing product meaning, field names, API contracts, operational disclaimers, and human-approval boundaries even if the visual design, component structure, or frontend framework changes.

### 10.1 Global shell parameters

Every production page should expose the following shared navigation model:

| Label | Route | Meaning |
| --- | --- | --- |
| Overview | `/` | Stored planning summary |
| Data intake | `/intake` | TMS/SMMS/TDMS reference and task ingestion |
| Feasibility | `/feasibility` | Forecast and rule assessment |
| Priority | `/priority` | Explainable weighted scoring |
| Block plan | `/planner` | Weekly/monthly proposed optimizer output |
| Operations data | `/operations-data` | Timetable, goods, and COA imports |
| What-if | `/what-if` | Pre-sanction operational simulation |
| Live monitor | `/live-monitor` | Telemetry and advisory execution alerts |
| Cockpit | `/cockpit` | Dispatcher review, sanction, audit, and exports |

Shared layout parameters:

- Use a persistent RailSync brand link to `/`.
- Mark the current page with an active navigation state.
- Show a feature status label in the header.
- Keep the main content readable at desktop, tablet, and mobile widths.
- Preserve visible loading, empty, success, warning, error, and unavailable states.
- Keep operational disclaimers near actions that could be mistaken for authority or live control.
- Use keyboard-accessible buttons, links, fields, tabs, dialogs, drawers, tables, and expandable areas.
- Use `aria-label`, `aria-labelledby`, `aria-describedby`, `role`, `aria-selected`, and `aria-live` where the current HTML already establishes those semantics.
- Use a focus trap or equivalent focus restoration for dialogs and drawers in an advanced rebuild.
- Escape all server-provided or operator-provided values before rendering them as HTML.

Shared visual tokens to preserve or intentionally evolve:

- Display font: Manrope.
- Body/UI font: DM Sans.
- Technical/timestamp font: JetBrains Mono in the cockpit.
- Status colors: green for complete/sanctioned, amber for caution/proposed/overrun, red for error/rejected/critical, blue for information, and muted gray for unavailable data.
- Department colors: Engineering, Signal & Telecom, and Traction must remain visually distinguishable in legends, timelines, pills, and tables.
- Compact operational cards, data tables, status badges, progress bars, timeline lanes, modal dialogs, and slide-out drawers.

### 10.2 Overview parameter inventory

Source files: `index.html`, `app.js`, `styles.css`, and `overrides.css`.

Required DOM hooks and data targets:

| Selector | Purpose | Expected value |
| --- | --- | --- |
| `#profile-avatar` | Identity initials | Up to two uppercase initials |
| `.profile-copy strong` | Actor display | Configured operator name |
| `.profile-copy small` | Role display | Configured role |
| `#metric-availability` | Availability KPI | Percentage or em dash |
| `#metric-availability-note` | Availability explanation | Backend status text |
| `#metric-hours` | Block-hours KPI | Number plus hours suffix |
| `#metric-tasks` | Scheduled-task KPI | Integer |
| `#metric-unscheduled` | Deferred-task note | Integer plus `unscheduled` |
| `#metric-sanctioned` | Sanctioned-block KPI | Integer |
| `#metric-proposed` | Proposed-block note | Integer plus `proposed` |
| `#overview-section-title` | Timeline section heading | Registered section list |
| `#overview-route-status` | Timeline record count | Stored block count or empty state |
| `#overview-time-head` | Timeline date labels | Distinct block dates |
| `#overview-timeline-rows` | Dynamic timeline rows | Section, state, and block buttons |
| `#overview-plan-status` | Plan footer status | Stored block count |
| `#overview-task-list` | Attention queue | Up to three unscheduled tasks |
| `#overview-live-state` | Active state panel | Active or extension-requested blocks |
| `#overview-data-status` | Connection status | Connected or unable-to-load message |

Overview interactions:

- Hero button `data-route="/planner"` opens the planner.
- Hero and footer what-if buttons use `data-route="/what-if"`.
- Open full plan uses `data-route="/planner"`.
- Open monitor uses `data-route="/live-monitor"`.
- Dynamically rendered block buttons lead to `/cockpit`.
- Dynamically rendered task rows lead to `/intake`.
- Notification and profile controls are currently visual controls; an advanced rebuild may add panels without changing the core workflow.
- The overview should animate loading and reveal states carefully, but data values must remain grounded in `/api/v1/cockpit/summary`.

### 10.3 Data intake parameter inventory

Source files: `intake.html` and `intake.js`.

Tab parameters:

| Selector/name | Type | Required behavior |
| --- | --- | --- |
| `.tab[data-tab="reference"]` | Button/tab | Activate reference panel |
| `.tab[data-tab="task"]` | Button/tab | Activate task panel |
| `#reference-panel` | Tab panel | Controlled reference form |
| `#task-panel` | Tab panel | Maintenance ingestion form |
| `#source-guide` | Dynamic text | Source-specific required fields |
| `#result-output` | Result region | Normalized or review output |
| `#result-caption` | Result description | Explain current result |
| `#records-body` | Table body | Persisted ingestion records |
| `#refresh-records` | Button | Reload ingestion records |

Reference form field names and rules:

- `source_system`: `TMS`, `SMMS`, or `TDMS`.
- `source_reference`: authoritative source identifier.
- `section_id`: controlled network section.
- `asset_type`: mapped asset category.
- `start_km`: non-negative number.
- `end_km`: non-negative number not less than `start_km`.
- `asset_reference`: controlled asset identifier.

Task form field names and rules:

- `source_system`: `TMS`, `SMMS`, or `TDMS`.
- `severity`: `CRITICAL`, `HIGH`, `MEDIUM`, or `LOW`.
- `record`: valid JSON object from the source system.
- `estimated_duration_minutes`: positive integer.
- `due_date`: datetime-local value.
- `required_crews`: newline-separated non-empty values.
- `required_equipment`: newline-separated non-empty values.
- `requires_traffic_block`: Boolean checkbox.
- `requires_traction_disconnection`: Boolean checkbox.
- `co_working_compatible`: Boolean checkbox.

Source JSON parameter guides:

- TMS: `ticket_id`, `track_id`, `km_start`, `km_end`, `defect_class`, `date_detected`.
- SMMS: `fault_id`, `station_code`, `gear_type`, `failure_category`, `reported_ts`, `urgency_code`.
- TDMS: `defect_no`, `ohe_substation`, `mast_from`, `mast_to`, `issue_type`, `scheduled_date`.

Result states to design explicitly:

- Awaiting input.
- Reference registered.
- Normalized task ready.
- Planner review required.
- Input needs correction.
- Complete.
- Needs review.
- Duplicate source record resolved to an existing record.

The advanced UI may replace the two tabs with a stepper, split-pane wizard, or command workflow, but it must retain the two logical steps: controlled mapping first, source maintenance record second.

### 10.4 Operations data parameter inventory

Source files: `operations-data.html` and `operations-data.js`.

Import controls:

- `#record-type` / form name `type`: `timetable`, `goods`, or `coa`.
- `#record-guide`: required JSON guide that changes with record type.
- `#operations-form`: JSON import form.
- `#import-heading`: current import state.
- `#import-caption`: traceability or error explanation.
- `#import-result`: import result panel.
- `#stored-records`: grouped operational register.
- `#refresh-records`: refresh stored records.

Record JSON parameters:

- Timetable occupancy: `record_id`, `section_id`, `window_start`, `window_end`, `passenger_trains_affected`, `source_timestamp`.
- Goods forecast: `record_id`, `section_id`, `window_start`, `window_end`, `goods_trains_affected`, `source_timestamp`.
- COA window wrapper: `source_timestamp` and `window`.
- COA `window`: `corridor_id`, `section_id`, `start_time`, `end_time`, `max_simultaneous_crews`, `traffic_block_available`, `traction_disconnection_available`, `timetable_reference`, and `goods_forecast_reference`.

Integrated plan controls:

- `#integrated-plan-form`.
- `horizon`: `WEEKLY` or `MONTHLY`.
- `horizon_start`: datetime-local.
- `horizon_end`: datetime-local.
- `#integrated-status`: plan ID, scheduled count, or error message.

Required UI behavior:

- Explain the required import order: timetable, goods, then COA.
- Show grouped stored record counts.
- Make duplicate IDs and missing cited records understandable.
- Never imply that an imported record is a generated sample.
- Make the integrated planning mode visibly distinct from manual COA JSON planning.

### 10.5 Feasibility parameter inventory

Source files: `feasibility.html` and `feasibility.js`.

Form ID: `#assessment-form`.

Fields:

- `task_id` / `#task-select`: complete normalized F-01 task.
- `section_latitude`: number from `-90` to `90`.
- `section_longitude`: number from `-180` to `180`.
- `proposed_time`: candidate block datetime.
- `rule_version`: authority-approved rule or circular reference.
- `engineering_max_temperature_c`: optional number, required for Engineering tasks.
- `traction_max_wind_speed_kmh`: optional non-negative number, required for Traction tasks.
- `traffic_block_min_visibility_m`: optional non-negative number, required when a traffic block is required.
- `caution_risk_multiplier`: optional number from `1` to `2`, required when a traffic block is required.

Result hooks:

- `.result-heading h2`: status heading.
- `#f02-caption`: advisory explanation.
- `#f02-result`: forecast, rule, risk, and warning details.

States:

- Awaiting assessment.
- Suitable.
- Caution required.
- Not suitable.
- Needs review.
- Input needs correction.
- No complete F-01 tasks found.
- Could not load F-01 tasks.

The interface must show missing forecast data and missing rule values as uncertainty. Empty rule fields must never become hidden defaults in the redesign.

### 10.6 Priority parameter inventory

Source files: `priority.html` and `priority.js`.

Form ID: `#priority-form`.

Operational context fields:

- `task_id` / `#priority-task`.
- `passenger`: passenger trains per day.
- `goods`: goods forecast per day.
- `traffic`: section traffic GMT.
- `criticality`: route criticality from `0` to `100`.
- `restriction`: active operational restriction Boolean.

Policy fields:

- `version`.
- `sevCritical`, `sevHigh`, `sevMedium`, `sevLow`.
- `maxOverdue`.
- `maxPassenger`.
- `maxGoods`.
- `maxTraffic`.
- `restrictionScore`.
- `maxWeather`.
- `wSeverity`, `wOverdue`, `wPassenger`, `wGoods`, `wTraffic`, `wRestriction`, `wRoute`, `wWeather`.
- `criticalThreshold`, `highThreshold`, `mediumThreshold`.

Result hooks:

- `.result-heading h2`.
- `#priority-caption`.
- `#priority-result`.

The advanced UI should make the weighted formula inspectable. Useful interaction patterns include expandable factor rows, a contribution bar, a score gauge, policy version metadata, and an input-to-contribution comparison table. These are presentation improvements only; the backend remains the source of truth.

### 10.7 Planner parameter inventory

Source files: `planner.html`, `planner.js`, and `planner.css`.

Eligibility table columns:

- Task.
- Department.
- Section.
- F-03 score.
- Eligibility.
- Required COA start.

Planner form ID: `#plan-form`.

Fields:

- `horizon`: `WEEKLY` or `MONTHLY`.
- `horizon_start`: datetime-local.
- `horizon_end`: datetime-local.
- `coa_windows`: JSON array.

COA window object parameters:

- `corridor_id`.
- `section_id`.
- `start_time`.
- `end_time`.
- `max_simultaneous_crews`.
- `traffic_block_available`.
- `traction_disconnection_available`.
- `timetable_reference`.
- `goods_forecast_reference`.
- `passenger_trains_affected`.
- `goods_trains_affected`.

Result hooks:

- `#plan-caption`.
- `#plan-result`.
- `#plan-detail`.
- `#block-list`.
- `#deferred-list`.
- `#candidate-body`.
- `#refresh-candidates`.

Block result parameters:

- Block ID.
- Corridor ID and section ID.
- Window start/end.
- Assigned task count.
- Consolidated departments.
- Timetable reference.
- Goods forecast reference.
- Used minutes and available minutes.
- Task ID and department.
- Priority score.
- Scheduled start/end.
- Traffic block requirement.
- Traction disconnection requirement.

Planner states:

- Awaiting COA input.
- Loading eligibility.
- Eligible.
- Not ready with missing requirements.
- Proposed.
- No eligible task could be placed.
- Deferred with reason.
- Search time limit reached.
- Input needs correction.

An advanced planner may use a draggable timeline, filterable task pool, JSON editor with schema validation, or interactive window cards, but must not offer manual task selection that contradicts the current automatic eligibility behavior unless the backend contract is changed too.

### 10.8 What-if parameter inventory

Source files: `what-if.html`, `what-if.js`, and `what-if.css`.

Form ID: `#whatif-form`.

Fields:

- `corridor_id`.
- `section_from`.
- `section_to`.
- `block_start_time`.
- `block_end_time`.
- `trains`: optional JSON array.

Train schedule object parameters:

- `train_no`.
- `train_type`: `EXPRESS`, `SUBURBAN`, or `FREIGHT`.
- `station_stops`: array of objects containing `station_code`, `scheduled_arrival`, and `scheduled_departure`.

Result hooks:

- `#sim-heading`.
- `#sim-caption`.
- `#sim-result`.
- `#sim-detail`.
- `#sim-trains`.
- `#sim-warnings`.

Result parameters:

- `block_id_simulated`.
- `section_impacted`.
- `total_passenger_delay_minutes`.
- `total_freight_delay_minutes`.
- `regulated_trains`.
- `network_punctuality_impact_pct`.
- `headway_conflict_warnings`.

The redesign should make the distinction between `CLEAR` and `IMPACT` immediate, show the affected-train list clearly, and keep the planning-estimate disclaimer adjacent to the result.

### 10.9 Live monitor parameter inventory

Source files: `live-monitor.html`, `live-monitor.js`, and `live-monitor.css`.

Telemetry form ID: `#telemetry-form`.

Fields:

- `block_id`.
- `corridor_id` / `#corridor-id-input`.
- `supervisor_id`.
- `actual_progress_pct`: `0` to `100`.
- `estimated_minutes_remaining`: non-negative integer.
- `timestamp`: optional datetime-local; defaults to current time.

Connection hooks:

- `#ws-heading`.
- `#ws-caption`.
- `#ws-status`.
- `#alerts-feed`.
- `#telemetry-status`.

Connection states:

- Not connected.
- Connecting.
- Connected.
- Disconnected.
- Connection error.

Telemetry states:

- Pending start.
- Active.
- Extension requested.
- Cleared early.
- Completed.

Alert parameters:

- Overrun: `overrun_minutes`, `message`, `revised_handover_time`, `first_impacted_train`.
- Early restoration: `slack_capacity_recovered_minutes`, `recommended_action`.
- First impacted train may contain `timetable_record_id`, `passenger_trains_affected`, and `note`.

An advanced rebuild should include reconnect handling, a clear connection indicator, bounded feed history, progress visualization, and an accessible live region. It must not add autonomous control buttons to this page.

### 10.10 Cockpit parameter inventory

Source files: `cockpit.html`, `cockpit.js`, and `cockpit.css`.

Identity hooks:

- `#controllerNameInput`.
- `#controllerRoleSelect`.
- `#headerRoleDisplay`.
- `#authorityIdentityHint`.
- `#openAuditLedgerBtn`.

Cockpit KPI hooks:

- `#kpiHoursSaved`.
- `#kpiAvailability`.
- `#kpiHoursUsed`.
- `#kpiBlockCount`.
- `#kpiTaskCount`.
- `#kpiDeferredCount`.
- `#chipCountProposed`.
- `#chipCountSanctioned`.
- `#chipCountOverridden`.

Filtering and timeline hooks:

- `#sectionFilter`: all sections or one section.
- `#statusFilter`: all, proposed, sanctioned, overridden, rejected, active, or completed.
- `#refreshCockpitBtn`.
- `#openWhatIfDrawerBtn`.
- `#timelineEmptyState`.
- `#ganttBoard`.
- `#deferredSection`.
- `#deferredCountBadge`.
- `#deferredTableBody`.

Block modal hooks:

- `#blockModalBackdrop`.
- `#modalBlockTitle`.
- `#mSection`.
- `#mStateBadge`.
- `#mScheduledWindow`.
- `#mEffectiveWindow`.
- `#mDuration`.
- `#mTrafficBlock`.
- `#mTractionDisconnection`.
- `#mTrainImpact`.
- `#mTasksTableBody`.
- `#mPriorityBreakdownHeading`.
- `#mPriorityBreakdown`.
- `#blockAuditTimeline`.
- `#closeModalBtn` and `#closeModalFooterBtn`.

Action controls:

- `input[name="blockActionChoice"]`: `APPROVE`, `OVERRIDE`, `REJECT`, `ACTIVATE`, `EXTEND`, `RESTORE`, `COMPLETE`.
- `#overrideInputsBox`.
- `#overrideStartInput`.
- `#overrideEndInput`.
- `#reasonCodeSelect`.
- `#justificationNotesInput`.
- `#justificationCharCount`.
- `#submitBlockActionBtn`.
- `#actionStatusMsg`.

Reason code values:

- `ROUTINE_SANCTION`.
- `WEATHER_ADVISORY`.
- `OPERATIONAL_EMERGENCY`.
- `VIP_MOVEMENT`.
- `MACHINE_BREAKDOWN`.
- `TRAFFIC_CONGESTION`.
- `ROLLING_STOCK_DELAY`.
- `CUSTOM`.

Export controls:

- `#exportPdfBtn`.
- `#exportHtmlBtn`.
- `#exportJsonBtn`.

Audit drawer hooks:

- `#auditDrawerBackdrop`.
- `#closeAuditDrawerBtn`.
- `#globalAuditTableBody`.

Embedded What-if drawer hooks:

- `#whatIfDrawerBackdrop`.
- `#closeWhatIfDrawerBtn`.
- `#modalWhatIfBtn`.
- `#wiErrorBanner`.
- `#wiHintsDetails`.
- `#wiHintsContent`.
- `#cockpitWhatIfForm`.
- `#wiCorridorId`.
- `#wiSectionFrom`.
- `#wiSectionTo`.
- `#wiStartTime`.
- `#wiEndTime`.
- `#wiTrainSchedules`.
- `#runWiSimBtn`.
- `#wiResultsArea`.
- `#wiPassDelay`.
- `#wiRegTrains`.
- `#wiPunctuality`.
- `#wiWarningsBox`.
- `#wiTrainsWrap`.
- `#wiTrainsTableBody`.

Cockpit block states to visually distinguish:

- `PROPOSED`.
- `SANCTIONED`.
- `OVERRIDDEN`.
- `REJECTED`.
- `ACTIVE`.
- `EXTENSION_REQUESTED`.
- `RESTORATION_RECORDED`.
- `COMPLETED`.

The modal and drawer components should support Escape, backdrop click, close buttons, keyboard focus, and restoration of focus to the control that opened them. The Gantt block pill must remain keyboard activatable, not just clickable with a mouse.

### 10.11 API payload and response parameters

An advanced frontend may transform the presentation layer completely, but these request and response concepts must remain available.

#### F-01

`POST /api/v1/network-references` accepts source system, source reference, section ID, start/end KM, asset type, and asset reference.

`POST /api/v1/ingestion/tasks` accepts `source_system`, `record`, and `planning_context`. `planning_context` contains severity, duration, due date, crews, equipment, traffic block, traction disconnection, and co-working compatibility.

#### F-02

`POST /api/v1/feasibility/assessments` accepts task ID, coordinates, proposed time, and a `rules` object containing rule version and applicable thresholds.

#### F-03

`POST /api/v1/priority/evaluations` accepts `context` and an inline `policy` object. Context includes task ID, passenger demand, goods demand, section traffic, route criticality, and active restriction. Policy includes severity scores, maxima, factor weights, and tier thresholds.

#### F-04

`POST /api/v1/block-plans` accepts horizon, horizon start/end, and a non-empty `coa_windows` array. The response contains plan ID, status, scheduled blocks, unscheduled tasks, metrics, and notes.

#### F-05

`POST /api/v1/simulate/what-if` accepts corridor, section endpoints, block times, and optional train schedules. The response contains regulated trains, delay totals, punctuality impact, and headway warnings.

#### F-06

`POST /api/v1/telemetry/progress-update` accepts block ID, corridor ID, supervisor ID, progress percentage, estimated remaining minutes, and timestamp. The WebSocket emits block ID, state, completion percentage, telemetry timestamp, and optional active alert.

#### F-07/F-08

`GET /api/v1/cockpit/summary` provides KPIs, sections, blocks, unscheduled tasks, and recent audit logs. `GET /api/v1/cockpit/identity` provides actor and role. Block actions require plan ID, actor, role, action, reason code, justification notes, and modified times where applicable.

### 10.12 Advanced interaction and visual requirements

The future rebuild should make the application feel more interactive and interesting without turning it into a decorative dashboard that obscures operational meaning.

- Use progressive disclosure for large forms: stepper, accordions, expandable policy sections, or a command-style workflow.
- Add schema-aware JSON editors with inline validation while retaining raw JSON submission compatibility.
- Add skeleton loading to KPI cards, tables, result panels, and timeline rows.
- Add optimistic visual feedback only for local UI state; server-backed decisions must wait for confirmed responses.
- Use status transitions, progress bars, timeline movement, and subtle staged reveals to communicate state changes.
- Add filter chips, search, sort, and department/state filters where the existing data supports them.
- Add hover/focus tooltips for technical abbreviations such as TMS, SMMS, TDMS, COA, GMT, and TRD.
- Add a clear time-zone treatment for all timestamps, especially cockpit UTC values and `datetime-local` inputs.
- Keep tables horizontally usable on small screens through responsive wrappers, column prioritization, or expandable rows.
- Keep the timeline and Gantt views readable when many blocks or sections are present.
- Use charts or gauges only when the metric has a valid backend value; never visualize unavailable data as zero.
- Keep proposed, sanctioned, active, rejected, and completed states visually and textually distinct.
- Preserve warnings and uncertainty instead of hiding them behind color alone.
- Announce live WebSocket updates through an accessible live region without stealing focus.
- Disable submit buttons while requests are in flight and restore them after success or failure.
- Show actionable API errors near the affected form and retain the user’s entered values where possible.
- Use confirmations for irreversible or high-consequence controller actions.
- Keep all audit, sanction, extension, restoration, and export actions traceable to the selected block.

### 10.13 Responsive breakpoints and layout behavior

The current CSS uses approximately `900px` as an important compact breakpoint, especially for the live monitor. A future rebuild should define explicit responsive behavior rather than only scaling the desktop layout.

- Large desktop: full navigation, two-column forms, wide timeline/Gantt lanes, KPI deck, and side result panels.
- Tablet: allow navigation wrapping or a compact menu, reduce form columns, stack secondary panels when necessary, and preserve tables through horizontal scrolling.
- Mobile: stack form and result regions, make action controls full width, keep touch targets at least comfortably tappable, collapse legends into a filter/control row, and make modal/drawer content nearly full screen.
- Maintain stable dimensions for progress bars, block pills, badges, inputs, and buttons so dynamic labels do not shift surrounding content.
- Ensure long IDs, JSON validation messages, audit notes, and deferred reasons wrap without overlapping.

### 10.14 Acceptance checklist for the rebuilt frontend

- All nine production routes remain reachable.
- Navigation labels and feature meaning remain intact.
- Every current form field and payload property remains available.
- All current loading, empty, success, warning, review, and error states remain represented.
- No sample railway data is introduced into production views.
- The UI never presents a proposed plan as sanctioned.
- What-if and feasibility outputs remain advisory.
- Live monitor remains recommendation-only.
- Controller actions require identity, role, reason code, and justification.
- Audit history and export controls remain available from the selected block.
- Dynamic values are escaped and API errors are rendered safely.
- Keyboard navigation works for tabs, buttons, timeline blocks, modals, drawers, and forms.
- Mobile and desktop layouts do not overlap or hide critical text.
- The frontend is tested against an empty database as well as a populated database.

## 11. Implementation Notes and Known Inconsistencies

The following details are visible in the current implementation and should be considered during future frontend maintenance:

1. `index.html` contains duplicated navigation fragments and an extra closing navigation tag in the current source. The browser may recover from the malformed markup, but the header should eventually be normalized.
2. `intake.html` contains two primary navigation elements with overlapping links. One omits Cockpit while the other includes it.
3. `cockpit.html` contains the Operations data navigation link twice.
4. Several HTML pages are minified into one or two long lines, which makes manual maintenance and code review harder.
5. Some JavaScript files use compact one-line implementations (`planner.js`, `priority.js`, and `operations-data.js`), while other files use a more readable expanded style.
6. `app.js` contains generic modal handlers for selectors such as `.block`, `.task-row`, and `[data-action]`, but the overview content is primarily rendered dynamically. These handlers should be reviewed whenever the overview DOM changes.
7. The cockpit JavaScript is substantially larger than the other page scripts and contains browser-side generation of departmental transfer JSON files in addition to API-backed cockpit actions.
8. The overview and cockpit both display planned availability, but the backend intentionally returns no percentage without an approved baseline, so the UI correctly falls back to a dash and explanatory status.
9. The live monitor uses an in-memory telemetry engine and either Redis or a fallback in-process pub/sub implementation. The UI should be treated as a live-session monitor unless persistence is added to the backend.
10. The standalone test page uses a separate `railSYSTEM` label and a different visual system from the RailSync application.
11. The page scripts perform HTML escaping for most dynamic values, but any future dynamic rendering should preserve this practice.
12. The page navigation is server-routed rather than a client-side single-page router. Full page navigation is expected.
13. There are no automated frontend tests, component tests, browser tests, or build/lint scripts visible in the repository.

## 11. Suggested Frontend Maintenance Priorities

1. Normalize duplicated navigation markup across all pages.
2. Format the minified HTML and JavaScript files for easier maintenance.
3. Add a shared navigation partial or server-side template to avoid drift between pages.
4. Add consistent loading, empty, error, and success states to every API-backed panel.
5. Add automated browser coverage for the main workflow from intake through cockpit sanction.
6. Add accessibility checks for focus management, modal behavior, keyboard operation, labels, and responsive tables.
7. Consolidate repeated `escapeHtml`, date formatting, and API error handling into a shared browser utility.
8. Decide whether `test-user-input.html` belongs in the product, in a demos folder, or in a separate test area.
9. Add visible connection/error states to the cockpit when summary or identity requests fail.
10. Keep all operational disclaimers and human-approval safeguards visible when adding new automation.

## 12. Summary

The folder contains a complete multi-screen frontend for a railway maintenance planning system. Its strongest implemented areas are the controlled data-intake flow, explainable feasibility and priority workflows, coordinated block-plan rendering, operational-impact simulation, WebSocket live monitoring, and human-governed cockpit with audit and export support.

The frontend is intentionally data-driven: it waits for operator-supplied records and backend results instead of fabricating railway data. The next major frontend engineering opportunity is consolidation: shared navigation, shared utilities, readable source formatting, consistent error/loading handling, and automated browser validation would reduce drift while preserving the current safety and governance model.
