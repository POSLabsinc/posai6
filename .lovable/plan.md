

# Plan: Connect All Menu Settings to Database

## Current State
| Component | Storage | DB Table Exists? |
|-----------|---------|-----------------|
| Menu Items | Database ✅ | menus ✅ |
| Add-Ons | Database ✅ | add_ons ✅ |
| Products | Database ✅ | products ✅ |
| Categories | localStorage ❌ | categories ✅ (unused by UI) |
| Modifiers | localStorage ❌ | modifier_groups + modifiers ✅ (unused by settings UI) |
| Default Modifiers | localStorage ❌ | No table ❌ |
| Groups | localStorage ❌ | No table ❌ |
| Timed Pricing | localStorage ❌ | No table ❌ |

## New Tables Needed (3)

### 1. `default_modifiers`
```
id, name, type (Normal/Exceptional), archived, sort_order, created_at, updated_at
```

### 2. `groups`
```
id, name, type (Add-On/Modifier), archived, sort_order, created_at, updated_at
```

### 3. `timed_pricing_rules`
```
id, name, type (happy_hour/peak_time/late_night/custom), start_time, end_time, adjustment (numeric), days (text[]), enabled, created_at, updated_at
```

## Components to Migrate (6 files + their Add/Edit forms)

### 1. CategoriesContent.tsx + AddCategoryContent + EditCategoryContent
- Replace localStorage with queries to existing `categories` table
- Map fields: name, icon, active (for archive), sort_order
- Add realtime subscription

### 2. ModifiersContent.tsx + AddModifierContent + EditModifierContent
- Replace localStorage with queries to existing `modifier_groups` + `modifiers` tables
- The "Modifiers" settings screen maps to individual modifiers within groups
- On add: insert into `modifiers` table (assign to a default group or create standalone entries)
- On archive: set `active = false`
- Add realtime subscription

### 3. DefaultModifiersContent.tsx + AddDefaultModifierContent + EditDefaultModifierContent
- Create new `default_modifiers` table
- Replace localStorage CRUD with database queries
- Add realtime subscription

### 4. GroupsContent.tsx + AddGroupContent + EditGroupContent
- Create new `groups` table
- Replace localStorage CRUD with database queries
- Groups reference modifiers/add-ons — store selected items as jsonb or junction table
- Add realtime subscription

### 5. TimedPricingContent.tsx + AddTimedPricingRuleContent
- Create new `timed_pricing_rules` table
- Replace localStorage CRUD with database queries
- Add realtime subscription

## Migration Pattern (same for each)
Each component follows the same conversion pattern already used by AddOnsContent:
1. Import supabase client
2. Replace `useState(() => localStorage...)` with `useState([])` + async `fetch` in `useEffect`
3. Replace `saveX(items)` localStorage calls with `supabase.from().insert/update/delete`
4. Add realtime channel subscription for live sync
5. Add loading state

## Execution Order
1. Create 3 new database tables via migration
2. Migrate CategoriesContent (uses existing table)
3. Migrate ModifiersContent (uses existing tables)
4. Migrate DefaultModifiersContent (new table)
5. Migrate GroupsContent (new table)
6. Migrate TimedPricingContent (new table)

