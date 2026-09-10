cat << 'EOF' >> plan.md

## Application Architecture & Specification

### 1. Navigation Header
* **Brand / Title:** `Knowledge Base` (bold, left-aligned)
* **Navigation Tabs:**
  * **Dashboard** (Icon: grid / dashboard)
  * **Notes** (Active tab: highlighted with dark background pill/badge, Icon: document)
  * **Tags** (Icon: price tag)
  * **Time** (Icon: clock)
  * **Assistant** (Icon: robot / bot)

### 2. Notes Section Layout

#### Section Header
* **Heading:** `Notes` (level 1 / large bold)

#### Note Creation Card
* **Title Input:** Text input field (`placeholder="New note title..."`)
* **Submit Action:** Button (`label="+ Create"`, primary action)

#### Search & Filter Toolbar
* **Search Field:** Text input with search/magnifier icon (`placeholder="Search notes..."`)
* **Tag Selector:** Dropdown menu (`default="All tags"`)
* **Priority Selector:** Dropdown menu (`default="All priorities"`, options: `Lowest`, `Low`, `Medium`, `High`, `Urgent`)
* **Archive Toggle:** Checkbox input (`label="Archived"`, boolean filter)

#### Note Item Card
* **Card Container:** Rounded bordered card
* **Title:** Display text (e.g., `"First note"`)
* **Body / Markdown:** Rendered text content (e.g., `"++COOL++"`)
* **Priority Badge:** Pill badge placed at top-right of card (e.g., `"Lowest"`)

### 3. Functional Requirements
* **Tab Routing:** Clicking any header tab (`Dashboard`, `Notes`, `Tags`, `Time`, `Assistant`) updates active view state and navigation styling.
* **Note Creation:** Submitting text via `+ Create` adds a new card to the list below.
* **Live Filtering:** Adjusting search text, tag dropdown, priority dropdown, or the archived checkbox filters the visible note cards dynamically.
EOF
