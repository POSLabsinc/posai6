import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Compact system prompt (~60% smaller than original) ──────────────────────
const SYSTEM_PROMPT = `You are an AI assistant for a POS system. Help users manage settings and menu data through conversation.

## ACTIVE SCOPE (HIGHEST PRIORITY):
{SCOPE_BLOCK}

## RULES:
1. "message" must be plain text only — NO JSON, code, backticks. Staff see this on a touch screen.
2. Respond with valid JSON: {"message","action","quickReplies","multiSelect"}
3. Use "Product" not "Item" in all text.
4. NEVER fabricate data — only reference Live Database Context below.
5. ALWAYS include quickReplies (2-10 options). Staff use touch screens.
6. For enable/disable: autoApply: true. For add: autoApply: false.
7. SCOPE ENFORCEMENT: Strictly follow the ACTIVE SCOPE above. Do NOT reference, list, or suggest data, settings, or modules outside the active scope. If the user asks about something outside scope, briefly tell them which module to switch to and offer that as a quickReply navigation, but do NOT show out-of-scope data.
8. If the active module does not need database tables, answer strictly from Local Settings Context.

## Action Types:
- view: {"type":"view","category":"menus|products|categories|modifiers|addOns|discounts|taxes|serviceCharges|gratuity|all"}
- update_setting: {"type":"update_setting","setting":"Name","path":"Path","currentValue":"Old","newValue":"New","settingType":"menu|product|category|modifierGroup|modifier|addOn|gratuity|discount|tax|serviceCharge|appearance|controlCenter|checkoutOptions|orders|securityPin|endOfDay","operation":"add|update|archive|enable|disable|change_pin|trigger","data":{...},"autoApply":true|false}
  CRITICAL: For toggle/enable/disable settings, "data" MUST be a JSON object using the exact backend key with a boolean/number value (NOT a string like "Enabled"). Examples:
    • Bold Text → data:{"boldText":true}, settingType:"appearance"
    • Debug Mode → data:{"debugMode":true}, settingType:"controlCenter"
    • Force Clock-In → data:{"forceClockIn":false}, settingType:"controlCenter"
    • Theme → data:{"theme":"dark"}, settingType:"appearance"
    • Split Check → data:{"splitCheck":true}, settingType:"checkoutOptions"
    • Enable Tip → data:{"enableTip":true}, settingType:"gratuity"
  Always include settingType. Always set autoApply:true for boolean toggles. Use camelCase keys exactly as defined in the data shape sections below. Never put words like "Enabled"/"Disabled"/"On"/"Off" inside data — only true/false.
- update_ai_rules: {"type":"update_ai_rules","ruleType":"dos|donts|custom_instructions|restaurant_type|knowledge_base","operation":"add|remove|replace","value":"string or array of strings","autoApply":true}
  Use this when user wants to add/edit/remove AI behavior rules, do's, don'ts, custom instructions, restaurant type, or knowledge base.
  For dos/donts: value is a single rule string for add/remove, or array for replace. For others: value is the full string to set.
- generate_report: {"type":"generate_report","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD","startTime":"HH:mm","endTime":"HH:mm"}
  Use when user asks for sales report, revenue report, order summary, analytics data. Ask user for start date/time and end date/time first. Common shortcuts: "today"=today's date 00:00-23:59, "yesterday"=yesterday, "this week"=Monday to today, "this month"=1st to today, "last month"=previous month full. When user provides dates, emit this action to generate the report.
- navigate: {"type":"navigate","path":"/settings/path"}
- info: {"type":"info"}

## Menu add data shape:
{"name":"Menu Name","revenueCenters":["Full Service"],"categoryNames":["Cat1"],"categoryOrder":["Cat1"],"channelSchedules":{"pos":{"active":true,"days":["Mon"],"startTime":"11:00 AM","endTime":"10:00 PM"}}}
Device keys: "Point Of Sale"=pos, "Point Of Purchase"=pop, "KIOSK"=kiosk, "Order-OS"=orderos

## Product add: {"name":"Name","price":12.99,"categoryName":"Cat","categoryId":"uuid","description":"optional"}
## Category add: {"name":"Name"}
## ModifierGroup add: {"name":"Name","required":false,"multiSelect":false}
## Modifier add: {"name":"Name","price":1.50,"modifierGroupId":"uuid","modifierGroupName":"Name"}
## AddOn add: {"name":"Name","price":2.00}
## DefaultModifier add: {"name":"Name","type":"Normal"}  (type: Normal | No | Extra | Side | Sub | Add | Allergy)
## Group add: {"name":"Name","type":"Add-On","displayName":"optional","hasMaxSelections":false,"maxSelections":1,"selectedModifiers":[],"selectedAddOns":[],"selectedDefaultModifiers":[]}
## TimedPricing add: {"name":"Happy Hour","type":"happy_hour","startTime":"4:00 PM","endTime":"6:00 PM","adjustment":-20,"days":["Mon","Tue","Wed","Thu","Fri"],"enabled":true}
## Inventory update: {"name":"Product Name","stockCount":50,"outOfStock":false,"inventoryTracking":true,"negativeInventory":false}
## Discount add: {"name":"Name","amount":15,"type":"Percentage","applicableTo":"All Products","applicableProducts":[],"requiresManagerPin":false,"scheduleEnabled":false}
## Tax add: {"name":"Name","amount":8.25,"type":"Exclusive","applicableTo":"All Products","applicableProducts":[]}
## ServiceCharge add: {"name":"Name","amount":5,"type":"Fixed","orderType":"All Orders","automaticApply":false,"minSeats":null,"taxApplicable":"Taxable","requiresManagerPin":false}
## Gratuity update: {"tipsEnabled":true,"autoGratuity":true,"autoGratuityPercent":18,"autoGratuityMinGuests":6}
## Appearance update: {"theme":"dark","textSize":"17px","iconSize":"Small","brightness":"100%","boldText":false}
## ControlCenter update: {"debugMode":false,"forceClockIn":true,"autoLockTimer":5}
## CheckoutOptions update: {"splitCheck":true,"skipTipScreen":false,"signatureThreshold":25}
## Orders update: {"orderCreationRules":true,"holdAndRecall":true}
## EndOfDay actions/toggles: settingType:"endOfDay"
  • Action triggers (operation:"trigger", autoApply:true): data:{"action":"start_eod|run_eod_now|print_eod_report|clock_out_employees|close_cash_drawer|close_paid_orders|cancel_unpaid_tickets"}
  • Toggle/value updates (operation:"update", autoApply:true): data may include any of: endOfDayReminder(boolean), autoEndOfDayTime("11:00 PM"), runEndOfDay(boolean), autoRunTime("11:00 PM"), clockOutEmployees(boolean), closeCashDrawer(boolean), closePaidOrders(boolean), cancelUnpaidTickets(boolean), printReport(boolean), includeEmployeeData(boolean), printSummaryOnClockOut(boolean), selectedDevice("POS 1.2"), selectedEmployees(["John Smith","Jane Doe"])
## Security PIN change: {"type":"update_setting","setting":"Change PIN","path":"Account → Security","currentValue":"••••","newValue":"Open Change PIN Flow","settingType":"securityPin","operation":"change_pin","data":{"openDialog":true},"autoApply":true}

## GUIDED END OF DAY FLOWS (MANDATORY DEPENDENCY CHAINS — DO NOT SKIP STEPS):
The AI MUST replicate the manual UI flow exactly. When a toggle is enabled, the dependent follow-up question(s) MUST be asked BEFORE emitting the update_setting action. NEVER auto-apply a toggle that has dependent fields without first collecting those fields. Use {"type":"info"} for intermediate question steps.

- Action triggers ("Start End of Day" / "Run EOD Now" / "Print report" / "Clock out employees" / "Close cash drawer" / "Close paid orders" / "Cancel unpaid tickets"): Step 1 confirm with quickReplies ["Yes, do it","Cancel"]. Step 2 emit update_setting with settingType:"endOfDay", operation:"trigger", data:{"action":"..."}, autoApply:true.

- EOD Reminder (toggle has dependency: autoEndOfDayTime):
  • If user says "Enable End of Day Reminder" / "Turn on EOD Reminder" → Step 1: ask "What time should the End of Day reminder trigger?" with quickReplies ["9:00 PM","10:00 PM","11:00 PM","12:00 AM","Custom time"], action:{"type":"info"}. DO NOT emit update_setting yet.
  • Step 2 (after user picks time): emit update_setting with data:{endOfDayReminder:true, autoEndOfDayTime:"<picked time>"}, autoApply:true.
  • If user says "Disable EOD Reminder" → emit data:{endOfDayReminder:false}, autoApply:true (no follow-up needed).

- Auto Run End of Day (toggle has dependency: autoRunTime + recommended companion toggles):
  • Step 1 (after "Enable Run End of Day"): ask "What time should End of Day run automatically?" quickReplies ["10:00 PM","11:00 PM","12:00 AM","1:00 AM","Custom time"], action:info.
  • Step 2: ask "Which automatic actions should run with End of Day? (select all that apply)" multiSelect:true, quickReplies ["Clock Out Employees","Close Cash Drawer","Close Paid Orders","Cancel Unpaid Tickets","Print Report","Done"], action:info.
  • Step 3: emit update_setting with data:{runEndOfDay:true, autoRunTime:"<picked>", clockOutEmployees:?, closeCashDrawer:?, closePaidOrders:?, cancelUnpaidTickets:?, printReport:?}, autoApply:true.

- Send Daily Reports (toggle has dependency: recipient employees):
  • If user says "Enable Send Daily Reports" / "Turn on daily reports" → Step 1: ask "Send Daily Reports To — which employees should receive the report?" multiSelect:true, quickReplies from EMPLOYEES list (John Smith, Jane Doe, Mike Johnson, Sarah Williams, David Brown, Emily Davis, Chris Wilson, Amanda Taylor) plus "Done", action:info. DO NOT emit update yet.
  • Step 2: emit update_setting with data:{sendDailyReports:true, selectedEmployees:["..."]}, autoApply:true.

- Print End of Day Report (toggle has dependency: includeEmployeeData prompt):
  • Step 1 (after enable): ask "Should the report include employee data (hours, sales per employee)?" quickReplies ["Yes, include employee data","No, exclude"], action:info.
  • Step 2: emit data:{printReport:true, includeEmployeeData:true|false}, autoApply:true.

- EOD Device selection: ask "Which device should run End of Day?" quickReplies ["POS 1.1","POS 1.2","POS 2.1","POS 2.2","POS 3.1"], action:info → then emit data:{selectedDevice:"POS 1.2"}, autoApply:true.

- Pure single-toggles with no dependencies (Include Employee Data, Print Summary on Clock-Out, Clock Out Employees, Close Cash Drawer, Close Paid Orders, Cancel Unpaid Tickets): confirm Yes/No → emit single-key data with autoApply:true.

## UNIVERSAL TOGGLE-DEPENDENCY RULE (applies to ALL settings, not just EOD):
Whenever the user enables a toggle that the manual UI reveals additional fields for (time pickers, device pickers, recipient pickers, threshold inputs, etc.), the AI MUST first ask the dependent question(s) and only emit update_setting after collecting every revealed field. Examples beyond EOD:
- Enable Auto-Gratuity → ask % and min guests before emit.
- Enable Schedule on a Discount → ask days/start/end before emit.
- Enable Timed Pricing rule → ask start/end/days before emit.
- Enable Auto Lock → ask timer minutes before emit.
- Enable Signature Threshold-related toggle → ask threshold amount before emit.
Never emit a partial toggle update that leaves the dependent value unset.

## CRITICAL DYNAMIC QUESTION FLOW RULES:
For ANY add/edit operation, you MUST collect every required field via sequential questions. NEVER skip a required field. NEVER fabricate values. Use {"type":"info"} for intermediate question steps and only emit update_setting on the final confirmation step. Always provide quickReplies for each step.

## GUIDED MENU CREATION (7 steps):
Step 1: Name (multiSelect:false) → Step 2: Display Devices (multiSelect:true, options: Point Of Sale/Point Of Purchase/KIOSK/Order-OS/All)
Step 3: Device Schedule — ask days+time for first device, then offer "Copy to All Devices" for rest. Days: Every Day/Weekdays Only/Weekends Only/individual. Time: All Day (24h)/preset ranges/Custom Time.
Step 4: Categories (multiSelect:true) → Step 5: Organize order → Step 6: Revenue Centers (multiSelect:true, Full Service/Quick Service/All) → Step 7: Overview & Confirm.

## GUIDED PRODUCT CREATION (5 steps):
Step 1: Name → Step 2: Category (show existing category list as quickReplies) → Step 3: Price (numeric) → Step 4: Description (optional, offer "Skip") → Step 5: Confirm with summary.

## GUIDED CATEGORY CREATION (2 steps):
Step 1: Name → Step 2: Confirm.

## GUIDED MODIFIER GROUP CREATION (4 steps):
Step 1: Name → Step 2: Required? (Yes/No) → Step 3: Multi-Select? (Yes/No) → Step 4: Confirm.

## GUIDED MODIFIER CREATION (4 steps):
Step 1: Name → Step 2: Modifier Group (show existing groups as quickReplies) → Step 3: Price (numeric, can be 0) → Step 4: Confirm.

## GUIDED ADD-ON CREATION (3 steps):
Step 1: Name → Step 2: Price (numeric, can be 0) → Step 3: Confirm.

## GUIDED DEFAULT MODIFIER CREATION (3 steps):
Step 1: Name → Step 2: Type (Normal/No/Extra/Side/Sub/Add/Allergy as quickReplies) → Step 3: Confirm.

## GUIDED GROUP CREATION (5 steps):
Step 1: Name → Step 2: Type (Add-On/Modifier/Default Modifier as quickReplies) → Step 3: Display Name (optional, offer "Skip") → Step 4: Max Selections? (No limit / set number) → Step 5: Confirm.

## GUIDED TIMED PRICING CREATION (6 steps):
Step 1: Rule Name → Step 2: Type (happy_hour/early_bird/late_night as quickReplies) → Step 3: Start Time → Step 4: End Time → Step 5: Adjustment % (e.g. -20 for 20% off) → Step 6: Days (multiSelect: Mon/Tue/Wed/Thu/Fri/Sat/Sun or Every Day/Weekdays/Weekends) → Step 7: Confirm.

## GUIDED INVENTORY UPDATE (3 steps):
Step 1: Product (show existing products as quickReplies) → Step 2: Action (Set Stock Count / Mark Out of Stock / Mark In Stock / Toggle Tracking) → Step 3: Value if needed → Step 4: Confirm.

## GUIDED GUEST CREATION (settingType:"guest", operation:"add") — MANDATORY step-by-step:
The Settings AI MUST collect every guest field one question at a time. Never skip a step. Never emit update_setting until the final Confirm step. Use {"type":"info"} for each intermediate question and ALWAYS include focused quickReplies. Do NOT mix in unrelated chips like "View guests", "Add Guest" or "Archive Guest" while the flow is in progress.
Step 1 — First Name (free text, required). quickReplies: ["Cancel"].
Step 2 — Last Name (free text, optional). quickReplies: ["Skip","Cancel"].
Step 3 — Phone (numeric, optional). quickReplies: ["Skip","Cancel"].
Step 4 — Email (optional). quickReplies: ["Skip","Cancel"].
Step 5 — Birthday (YYYY-MM-DD, optional). quickReplies: ["Skip","Cancel"].
Step 6 — Anniversary (YYYY-MM-DD, optional). quickReplies: ["Skip","Cancel"].
Step 7 — Tags (optional, multiSelect:true). quickReplies: ["VIP","Regular","New","Loyalty","Done","Skip"].
Step 8 — Allergies (optional, multiSelect:true). quickReplies: ["Peanuts","Gluten","Dairy","Shellfish","Eggs","None","Done","Skip"].
Step 9 — Note (optional, max 250 chars). quickReplies: ["Skip","Cancel"].
Step 10 — Guest photo (LAST field before summary): ask "Want to upload a photo for this guest? Tap the paperclip icon below to attach an image, then reply Done. Or Skip." quickReplies: ["Skip","Done","Cancel"]. If user already attached an image earlier in the conversation, acknowledge it and proceed.
Step 11 — Summary + Confirm. Show a clean readable summary of ALL collected fields (First Name, Last Name, Phone, Email, Birthday, Anniversary, Tags, Allergies, Note, Photo: "Attached" or "None"). Then ask "Confirm to save this guest. You can still upload/replace the photo using the paperclip icon below before confirming." quickReplies: ["Confirm","Upload Photo","Cancel"]. If user clicks "Upload Photo", remind them to use the paperclip icon and wait. On "Confirm" emit:
  {"type":"update_setting","setting":"Guest","path":"Guest Book","settingType":"guest","operation":"add","data":{"firstName":"","lastName":"","name":"","phone":"","email":"","birthday":"","anniversary":"","tags":[],"allergies":[],"note":"","avatarUrl":"<data-url-if-attached>"},"autoApply":true}

## VIEW GUESTS / ARCHIVE GUEST FLOWS:
- "View guests" / "Show guests" / "Show me all guests": Use ONLY the live guest data in Database Context (active guests, is_archived=false). Format the message as a numbered readable list: "1. <Name> — <phone> — <email> (id:<id>)". Do NOT emit update_setting. quickReplies: ["Add Guest","Archive Guest"].
- "Archive Guest" / "Show archived guests": Use ONLY the archived guest list in Database Context (is_archived=true). Format the same way and offer per-guest restore. quickReplies: ["Add Guest","View Guests"].
- NEVER show "Guest preferences" or "Guest history" anywhere — those options were removed.

## GUIDED DISCOUNT CREATION (7 steps):
Step 1: Name → Step 2: Type (Percentage/Fixed as quickReplies) → Step 3: Amount (numeric) → Step 4: Applicable To (All Products/Specific Products/Specific Categories as quickReplies) → Step 5: If Specific, ask which (multiSelect) → Step 6: Require Manager PIN? (Yes/No) → Step 7: Confirm.

## GUIDED TAX CREATION (5 steps):
Step 1: Name → Step 2: Rate (numeric percent) → Step 3: Type (Exclusive/Inclusive as quickReplies) → Step 4: Applicable To (All Products/Specific Products as quickReplies) → Step 5: Confirm.

## GUIDED SERVICE CHARGE CREATION (8 steps):
Step 1: Name → Step 2: Type (Percentage/Fixed as quickReplies) → Step 3: Amount (numeric) → Step 4: Order Type (All Orders/Dine In/Takeaway/Delivery as quickReplies) → Step 5: Auto Apply? (Yes/No) → Step 6: If Yes, Min Seats (numeric or "No minimum") → Step 7: Tax Applicable? (Taxable/Non-Taxable) → Step 8: Confirm.

## EDIT/UPDATE FLOW:
For any update, first ask which item (show list as quickReplies) → then ask which field to change → then new value → then confirm. Provide existing value in the question for context.

## DELETE/ARCHIVE FLOW:
Always confirm with quickReplies ["Yes, delete", "Cancel"] before emitting the destructive action. Use operation:"archive" for soft-delete, operation:"remove" for hard-delete.

## Nav Paths: /settings/menu, /settings/menu/menu, /settings/menu/categories, /settings/menu/products, /settings/menu/modifiers, /settings/menu/add-ons, /settings/menu/default-modifiers, /settings/menu/groups, /settings/menu/timed-pricing, /settings/menu/inventory, /settings/payments/discounts, /settings/payments/taxes, /settings/payments/gratuity, /settings/payments/service-charge, /settings/system/appearance, /settings/system/control-center

## Nav Paths: /settings/menu, /settings/menu/menu, /settings/menu/categories, /settings/menu/products, /settings/menu/modifiers, /settings/menu/add-ons, /settings/payments/discounts, /settings/payments/taxes, /settings/payments/gratuity, /settings/payments/service-charge, /settings/system/appearance, /settings/system/control-center

## Live Database Context:
{DATABASE_CONTEXT}

## Local Settings Context:
{SETTINGS_CONTEXT}

## AI Rules & Instructions (Admin-configured behavior guidelines):
{AI_RULES_CONTEXT}`;

const IMAGE_ADDENDUM = `\n\n## IMAGE ANALYSIS:
When user uploads a menu image: extract all items/prices/categories, present organized summary, then offer to create a menu from them. Pre-fill categories and products in the guided flow.`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string | any[];
}

// ── Intent detection: only fetch relevant DB tables ─────────────────────────
type Intent = "menus" | "categories" | "products" | "modifiers" | "addons" | "defaultModifiers" | "groups" | "timedPricing" | "inventory" | "taxes" | "discounts" | "serviceCharges" | "reports" | "guests" | "archivedGuests" | "employees" | "archivedEmployees" | "employeeShifts" | "openShifts" | "general";

// ── Context → Scope mapping ─────────────────────────────────────────────────
// Maps the `context` prop sent from the client (the active settings module)
// to: a human-readable scope label, the DB intents that are relevant, and a
// strict instruction telling the AI what it MUST and MUST NOT discuss.
type ContextScope = {
  label: string;
  intents: Intent[];
  instruction: string;
};

const CONTEXT_SCOPE_MAP: Record<string, ContextScope> = {
  account: { label: "Account", intents: [], instruction: "Only discuss the user's Account: profile, restaurant information, security, and personal information. Do not reference menus, products, categories, modifiers, payments, or other modules unless the user explicitly asks to switch context." },
  "account-personal-information": { label: "Personal Information", intents: [], instruction: "Only discuss the user's Personal Information fields (name, email, phone, avatar, language). Do not reference menus, products, payments, or other modules." },
  "account-restaurant-information": { label: "Restaurant Information", intents: [], instruction: "Only discuss Restaurant Information fields (restaurant name, address, contact details, business hours, currency, time zone, logo). Do not reference menus, products, categories, payments, or any other module." },
  "account-security": { label: "Security", intents: [], instruction: "Only discuss Security settings (PIN, password, two-factor, lock timer). Do not reference menus, products, or other modules." },
  menu: { label: "Menu", intents: ["menus", "categories", "products", "modifiers", "addons"], instruction: "Only discuss the Menu module: products, categories, modifiers, add-ons, default modifiers, groups, and menus. Do not reference payments, taxes, gratuity, system, account, workforce, or other modules." },
  "menu-products": { label: "Products", intents: ["products", "categories"], instruction: "Only discuss Products: list, add, edit, archive, pricing, stock, search. Do not reference menus, modifiers, payments, taxes, or any other module." },
  "menu-categories": { label: "Categories", intents: ["categories"], instruction: "Only discuss Categories: list, add, rename, reorder, archive. Do not reference products, menus, payments, or any other module." },
  "menu-modifiers": { label: "Modifiers", intents: ["modifiers"], instruction: "Only discuss Modifiers and modifier groups. Do not reference products, payments, or any other module." },
  "menu-add-ons": { label: "Add-ons", intents: ["addons"], instruction: "Only discuss Add-ons. Do not reference modifiers, products, payments, or any other module." },
  "menu-default-modifiers": { label: "Default Modifiers", intents: ["defaultModifiers"], instruction: "Only discuss Default Modifiers. Do not reference products, payments, or any other module." },
  "menu-groups": { label: "Groups", intents: ["groups", "modifiers", "addons", "defaultModifiers"], instruction: "Only discuss Groups. Do not reference payments, system, or any other module." },
  "menu-menus": { label: "Menus", intents: ["menus", "categories"], instruction: "Only discuss Menus: list, add, schedules, revenue centers, assigned categories. Do not reference payments, system, account, or any other module." },
  "menu-timed-pricing": { label: "Timed Pricing", intents: ["timedPricing"], instruction: "Only discuss Timed Pricing rules. Do not reference payments, system, account, or any other module." },
  "menu-inventory": { label: "Inventory", intents: ["inventory", "products", "categories"], instruction: "Only discuss Inventory and stock configuration. Do not reference payments, system, account, or any other module." },
  payments: { label: "Payments", intents: ["taxes", "discounts", "serviceCharges"], instruction: "Only discuss Payments: taxes, gratuity, discounts, service charge, payment methods, cash management, checkout options. Do not reference menu, products, categories, modifiers, account, or any other module." },
  "payments-taxes": { label: "Taxes", intents: ["taxes", "products", "categories"], instruction: "Only discuss Taxes (rates, exemptions, pricing modes). Do not reference menu, products, or any other module." },
  "payments-gratuity": { label: "Gratuity", intents: [], instruction: "Only discuss Gratuity (tip presets, auto-gratuity, distribution). Do not reference menu, products, or any other module." },
  "payments-discounts": { label: "Discounts", intents: ["discounts", "products", "categories"], instruction: "Only discuss Discounts (rules, eligibility, manager PIN). Do not reference menu, products, or any other module." },
  "payments-service-charge": { label: "Service Charge", intents: ["serviceCharges"], instruction: "Only discuss Service Charge configuration. Do not reference menu, products, or any other module." },
  "payments-payment-methods": { label: "Payment Methods", intents: [], instruction: "Only discuss Payment Methods (accepted types, visibility). Do not reference menu, products, or any other module." },
  "payments-cash-management": { label: "Cash Management", intents: [], instruction: "Only discuss Cash Management (drawer, pay in/out, reconciliation). Do not reference menu, products, or any other module." },
  "payments-checkout-options": { label: "Checkout Options", intents: [], instruction: "Only discuss Checkout Options (split check, signature, tip screen, receipts). Do not reference menu, products, or any other module." },
  system: { label: "System", intents: [], instruction: "Only discuss System settings: appearance, control center, AI integration. Do not reference menu, products, payments, or other modules." },
  "system-appearance": { label: "Appearance", intents: [], instruction: "Only discuss Appearance: theme, theme color, text size, brightness, bold text, icon style. Do not reference menu, products, payments, or any other module." },
  "system-control-center": { label: "Control Center", intents: [], instruction: "Only discuss Control Center toggles (debug mode, force clock-in, auto-lock). Do not reference menu, products, payments, or any other module." },
  "system-ai-integration": { label: "AI Integration", intents: [], instruction: "Only discuss AI Integration: providers, API keys, models. Do not reference menu, products, payments, or any other module." },
  workforce: { label: "Workforce", intents: ["employees", "archivedEmployees", "employeeShifts", "openShifts"], instruction: "Only discuss Workforce: employees, shifts, schedules, clock-in/out. Do not reference menu, products, payments, or other modules. Available actions: View Employees, Add New Employee (run GUIDED EMPLOYEE CREATION step-by-step), Archive Employees, View Shifts, Add Shift (run GUIDED SHIFT CREATION step-by-step), Schedule Information (View / Add Schedule run GUIDED SCHEDULE CREATION step-by-step)." },
  "workforce-employee": { label: "Employee", intents: ["employees", "archivedEmployees"], instruction: "Only discuss Employees. Available actions: View Employees (active list from Database Context), Archive Employees (list archived from Database Context with restore option), Add New Employee (run GUIDED EMPLOYEE CREATION step-by-step). Do NOT skip steps. Do NOT reference menu, products, payments, shifts, or schedules unless user explicitly asks to switch." },
  "workforce-shift": { label: "Shift", intents: ["employeeShifts", "employees", "openShifts"], instruction: "Only discuss Shifts. Available actions: View Shifts (list current shifts from Database Context), Add Shift (run GUIDED SHIFT CREATION step-by-step). Do NOT skip steps. Do NOT reference menu, products, payments, employees archive, or schedules unless user asks." },
  "workforce-schedule-information": { label: "Schedule Information", intents: ["employeeShifts", "openShifts"], instruction: "Only discuss Schedule Information. Available actions: View Schedules (list scheduled shifts from Database Context), Add Schedule (run GUIDED SCHEDULE CREATION step-by-step). Do NOT skip steps. Do NOT reference menu, products, payments, or employees unless user asks." },
  "workforce-schedule": { label: "Schedule Information", intents: ["employeeShifts", "openShifts"], instruction: "Only discuss Schedule Information. Available actions: View Schedules (list scheduled shifts from Database Context), Add Schedule (run GUIDED SCHEDULE CREATION step-by-step). Do NOT skip steps. Do NOT reference menu, products, payments, or employees unless user asks." },
  "end-of-day": { label: "End of Day", intents: [], instruction: "Only discuss the End of Day (EOD) module. You can: start EOD, run EOD automation now, print the EOD report, clock out employees, close the cash drawer, close paid orders, cancel unpaid tickets, and configure all EOD toggles (reminder, auto-run, clock out, close cash drawer, close paid orders, cancel unpaid, print report, include employee data, print summary on clock out, end of day device, daily report recipients). Do not reference menus, products, payments, or other modules." },
  "guest-book": { label: "Guest Book", intents: ["guests", "archivedGuests"], instruction: "Only discuss Guest Book. Available actions: View guests (active), Archive Guest (list archived), Add Guest (run GUIDED GUEST CREATION step-by-step). Do NOT reference menu, products, payments, or other modules. Do NOT mention 'Guest preferences' or 'Guest history' — those options were removed." },
  reports: { label: "Reports & Analytics", intents: ["reports"], instruction: "Only discuss Reports & Analytics: sales, revenue, summaries. Do not reference menu, products, or other modules." },
  notifications: { label: "Notifications", intents: [], instruction: "Only discuss Notifications settings. Do not reference menu, products, or other modules." },
  hardware: { label: "Hardware", intents: [], instruction: "Only discuss Hardware: printers, card readers, cash drawers. Do not reference menu, products, or other modules." },
  network: { label: "Network", intents: [], instruction: "Only discuss Network settings. Do not reference menu, products, or other modules." },
  support: { label: "Support", intents: [], instruction: "Only discuss Support: contacts, help, documentation. Do not reference menu, products, or other modules." },
};

function resolveContextScope(context: string | undefined): ContextScope | null {
  if (!context) return null;
  return CONTEXT_SCOPE_MAP[context] || null;
}


function detectIntent(messages: any[]): Set<Intent> {
  const intents = new Set<Intent>();
  // Scan last 4 user messages for keywords
  const recentUserMsgs = messages
    .filter((m: any) => m.role === "user")
    .slice(-4)
    .map((m: any) => {
      if (typeof m.content === "string") return m.content.toLowerCase();
      if (Array.isArray(m.content)) {
        return m.content.filter((c: any) => c.type === "text").map((c: any) => c.text).join(" ").toLowerCase();
      }
      return "";
    })
    .join(" ");

  // Also check last assistant message for ongoing flows
  const lastAssistant = [...messages].reverse().find((m: any) => m.role === "assistant");
  const assistantText = typeof lastAssistant?.content === "string" ? lastAssistant.content.toLowerCase() : "";
  const combined = recentUserMsgs + " " + assistantText;

  if (/menu|channel|schedule|device|revenue center|step [1-7]/.test(combined)) intents.add("menus");
  if (/categor/.test(combined)) intents.add("categories");
  if (/product|price|sku|stock/.test(combined)) intents.add("products");
  if (/modifier|mod group/.test(combined)) intents.add("modifiers");
  if (/default modifier/.test(combined)) intents.add("defaultModifiers");
  if (/\bgroup\b/.test(combined)) intents.add("groups");
  if (/add.?on/.test(combined)) intents.add("addons");
  if (/timed pricing|happy hour|early bird|late night/.test(combined)) intents.add("timedPricing");
  if (/inventory|stock|out of stock|86\b|negative inventory/.test(combined)) intents.add("inventory");
  if (/\btax\b|vat|gst/.test(combined)) intents.add("taxes");
  if (/discount|coupon|promo/.test(combined)) intents.add("discounts");
  if (/service charge|surcharge|auto gratuity/.test(combined)) intents.add("serviceCharges");
  if (/report|sales|revenue|analytics|total.*sales|daily.*sales|weekly|monthly|order.*summary/.test(combined)) intents.add("reports");
  if (/guest|customer|view guests|add guest|guest book/.test(combined)) intents.add("guests");
  if (/archive|archived/.test(combined) && /guest|customer/.test(combined)) intents.add("archivedGuests");
  if (/employee|staff|view employees|add (new )?employee|hire/.test(combined)) intents.add("employees");
  if (/archive|archived/.test(combined) && /employee|staff/.test(combined)) intents.add("archivedEmployees");
  if (/shift|clock.?in|clock.?out|roster|schedule.*shift|add shift|view shifts/.test(combined)) intents.add("employeeShifts");
  if (/open shift|unassigned shift/.test(combined)) intents.add("openShifts");
  if (/schedule information|view schedule|add schedule|weekly schedule/.test(combined)) intents.add("employeeShifts");

  // If creating a menu, we need categories too
  if (intents.has("menus")) intents.add("categories");
  // If creating a product, we need categories
  if (intents.has("products")) intents.add("categories");
  // If creating a modifier, we need modifier groups
  if (intents.has("modifiers")) intents.add("modifiers");

  // If nothing detected or it's a general/greeting query
  if (intents.size === 0) intents.add("general");

  return intents;
}

async function fetchDatabaseContext(supabaseUrl: string, serviceRoleKey: string, intents: Set<Intent>): Promise<string> {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const parts: string[] = [];

  const fetchAll = intents.has("general");

  // Always fetch lightweight counts for overview
  const promises: Promise<void>[] = [];

  // Menus — always lightweight (small table)
  if (fetchAll || intents.has("menus")) {
    promises.push((async () => {
      const { data: menus } = await supabase.from("menus").select("id, name, enabled, archived, revenue_centers, channel_schedules").eq("archived", false).order("sort_order");
      if (menus?.length) {
        parts.push(`### Menus (${menus.length}):`);
        menus.forEach((m: any) => {
          const channels: string[] = [];
          if (m.channel_schedules) {
            const cs = typeof m.channel_schedules === "string" ? JSON.parse(m.channel_schedules) : m.channel_schedules;
            Object.entries(cs).forEach(([key, val]: [string, any]) => { if (val?.active) channels.push(key); });
          }
          parts.push(`- ${m.name} (id:${m.id}) ${m.enabled ? "Active" : "Inactive"}${channels.length ? ` [${channels.join(",")}]` : ""}${m.revenue_centers?.length ? ` RC:${m.revenue_centers.join(",")}` : ""}`);
        });
      } else {
        parts.push("### Menus: none");
      }
    })());
  }

  // Categories
  if (fetchAll || intents.has("categories")) {
    promises.push((async () => {
      const { data: categories } = await supabase.from("categories").select("id, name, active").eq("active", true).order("sort_order");
      if (categories?.length) {
        parts.push(`### Categories (${categories.length}): ${categories.map((c: any) => `${c.name}(${c.id})`).join(", ")}`);
      } else {
        parts.push("### Categories: none");
      }
    })());
  }

  // Products — limit to 100, compact format
  if (fetchAll || intents.has("products")) {
    promises.push((async () => {
      const [{ data: products }, { data: categories }] = await Promise.all([
        supabase.from("products").select("id, name, price, category_id, active, out_of_stock, popular").eq("archived", false).order("sort_order").limit(100),
        supabase.from("categories").select("id, name").eq("active", true),
      ]);
      const catMap: Record<string, string> = {};
      (categories || []).forEach((c: any) => { catMap[c.id] = c.name; });
      if (products?.length) {
        const byCategory: Record<string, any[]> = {};
        products.forEach((p: any) => {
          const cat = catMap[p.category_id] || "Other";
          (byCategory[cat] ||= []).push(p);
        });
        parts.push(`### Products (${products.length}):`);
        Object.entries(byCategory).forEach(([cat, prods]) => {
          parts.push(`**${cat}:** ${prods.map((p: any) => `${p.name}=$${Number(p.price).toFixed(2)}(${p.id})${!p.active ? "[OFF]" : ""}${p.out_of_stock ? "[OOS]" : ""}`).join("; ")}`);
        });
      } else {
        parts.push("### Products: none");
      }
    })());
  }

  // Modifiers
  if (fetchAll || intents.has("modifiers")) {
    promises.push((async () => {
      const [{ data: groups }, { data: mods }] = await Promise.all([
        supabase.from("modifier_groups").select("id, name, required, multi_select").eq("active", true).order("sort_order"),
        supabase.from("modifiers").select("id, name, price, modifier_group_id, is_default").eq("active", true).order("sort_order"),
      ]);
      if (groups?.length) {
        parts.push(`### Modifier Groups (${groups.length}):`);
        groups.forEach((g: any) => {
          const gMods = (mods || []).filter((m: any) => m.modifier_group_id === g.id);
          parts.push(`- ${g.name}(${g.id}) ${g.required ? "Req" : "Opt"}${g.multi_select ? ",Multi" : ""}: ${gMods.map((m: any) => `${m.name}=$${Number(m.price).toFixed(2)}(${m.id})`).join("; ") || "none"}`);
        });
      }
    })());
  }

  // Add-Ons
  if (fetchAll || intents.has("addons")) {
    promises.push((async () => {
      const { data: addOns } = await supabase.from("add_ons").select("id, name, price").eq("active", true).order("sort_order");
      if (addOns?.length) {
        parts.push(`### Add-Ons (${addOns.length}): ${addOns.map((a: any) => `${a.name}=$${Number(a.price).toFixed(2)}(${a.id})`).join("; ")}`);
      }
    })());
  }

  if (fetchAll || intents.has("defaultModifiers")) {
    promises.push((async () => {
      const { data } = await supabase.from("default_modifiers").select("id, name, type").eq("archived", false).order("sort_order");
      if (data?.length) parts.push(`### Default Modifiers (${data.length}): ${data.map((d: any) => `${d.name}[${d.type}](${d.id})`).join("; ")}`);
    })());
  }

  if (fetchAll || intents.has("groups")) {
    promises.push((async () => {
      const { data } = await supabase.from("groups").select("id, name, type, display_name, has_max_selections, max_selections").eq("archived", false).order("sort_order");
      if (data?.length) parts.push(`### Groups (${data.length}): ${data.map((g: any) => `${g.name}[${g.type}](${g.id})${g.display_name ? ` display:${g.display_name}` : ""}${g.has_max_selections ? ` max:${g.max_selections}` : ""}`).join("; ")}`);
    })());
  }

  if (fetchAll || intents.has("timedPricing")) {
    promises.push((async () => {
      const { data } = await supabase.from("timed_pricing_rules").select("id, name, type, start_time, end_time, adjustment, days, enabled").order("created_at", { ascending: false });
      if (data?.length) parts.push(`### Timed Pricing (${data.length}): ${data.map((r: any) => `${r.name}(${r.id}) ${r.type} ${r.start_time}-${r.end_time} adj:${r.adjustment} days:${(r.days || []).join(",")} ${r.enabled ? "ON" : "OFF"}`).join("; ")}`);
    })());
  }

  if (fetchAll || intents.has("inventory")) {
    promises.push((async () => {
      const { data } = await supabase.from("products").select("id, name, stock_count, out_of_stock, inventory_tracking, negative_inventory").eq("archived", false).order("name").limit(100);
      if (data?.length) parts.push(`### Inventory (${data.length}): ${data.map((p: any) => `${p.name}(${p.id}) stock:${p.stock_count ?? 0}${p.out_of_stock ? "[OOS]" : ""}${p.inventory_tracking ? "[TRACK]" : ""}${p.negative_inventory ? "[NEG]" : ""}`).join("; ")}`);
    })());
  }

  if (fetchAll || intents.has("taxes")) {
    promises.push((async () => {
      const { data } = await supabase.from("taxes").select("id, name, amount, type, applicable_to, archived").eq("archived", false).order("sort_order");
      if (data?.length) parts.push(`### Taxes (${data.length}): ${data.map((t: any) => `${t.name}=${t.amount}${t.type === "Inclusive" ? "% incl" : "% excl"}(${t.id}) applies:${t.applicable_to || "All Products"}`).join("; ")}`);
    })());
  }

  if (fetchAll || intents.has("discounts")) {
    promises.push((async () => {
      const { data } = await supabase.from("discounts").select("id, name, amount, type, applicable_to, requires_manager_pin, archived").eq("archived", false).order("sort_order");
      if (data?.length) parts.push(`### Discounts (${data.length}): ${data.map((d: any) => `${d.name}=${d.amount}${d.type === "Percentage" ? "%" : "$"}(${d.id}) applies:${d.applicable_to || "All Products"}${d.requires_manager_pin ? "[PIN]" : ""}`).join("; ")}`);
    })());
  }

  if (fetchAll || intents.has("serviceCharges")) {
    promises.push((async () => {
      const { data } = await supabase.from("service_charges").select("id, name, amount, type, order_type, tax_applicable, automatic_apply, min_seats, archived").eq("archived", false).order("sort_order");
      if (data?.length) parts.push(`### Service Charges (${data.length}): ${data.map((s: any) => `${s.name}=${s.amount}${s.type === "Percentage" ? "%" : "$"}(${s.id}) order:${s.order_type || "All Orders"} tax:${s.tax_applicable || "Taxable"}${s.automatic_apply ? ` auto minSeats:${s.min_seats ?? 0}` : ""}`).join("; ")}`);
    })());
  }

  // Guests — active (View guests)
  if (fetchAll || intents.has("guests")) {
    promises.push((async () => {
      const { data } = await supabase
        .from("guests")
        .select("id, name, phone, email, tags, allergies, loyalty_points_balance, order_count, is_archived")
        .eq("is_archived", false)
        .order("name")
        .limit(100);
      if (data?.length) {
        parts.push(`### Active Guests (${data.length}):`);
        data.forEach((g: any, idx: number) => {
          const tags = (g.tags || []).join(",");
          parts.push(`${idx + 1}. ${g.name} — ${g.phone || "no phone"} — ${g.email || "no email"}${tags ? ` [${tags}]` : ""} pts:${g.loyalty_points_balance || 0} orders:${g.order_count || 0} (id:${g.id})`);
        });
      } else {
        parts.push("### Active Guests: none yet. Suggest 'Add Guest' to create one.");
      }
    })());
  }

  // Archived guests
  if (fetchAll || intents.has("archivedGuests")) {
    promises.push((async () => {
      const { data } = await supabase
        .from("guests")
        .select("id, name, phone, email, is_archived")
        .eq("is_archived", true)
        .order("name")
        .limit(100);
      if (data?.length) {
        parts.push(`### Archived Guests (${data.length}):`);
        data.forEach((g: any, idx: number) => {
          parts.push(`${idx + 1}. ${g.name} — ${g.phone || "no phone"} — ${g.email || "no email"} (id:${g.id})`);
        });
      } else {
        parts.push("### Archived Guests: none.");
      }
    })());
  }

  // Active Employees
  if (fetchAll || intents.has("employees")) {
    promises.push((async () => {
      const { data } = await supabase
        .from("employees")
        .select("id, full_name, role, phone, email, hourly_rate, assigned_job_types, revenue_center, is_archived, is_on_leave")
        .eq("is_archived", false)
        .order("full_name")
        .limit(200);
      if (data?.length) {
        parts.push(`### Active Employees (${data.length}):`);
        data.forEach((e: any, idx: number) => {
          const jobs = (e.assigned_job_types || []).join(",");
          parts.push(`${idx + 1}. ${e.full_name} — ${e.role}${jobs ? ` [${jobs}]` : ""} — ${e.phone || "no phone"} — ${e.email || "no email"}${e.hourly_rate ? ` rate:$${Number(e.hourly_rate).toFixed(2)}/h` : ""}${e.is_on_leave ? " [ON LEAVE]" : ""} (id:${e.id})`);
        });
      } else {
        parts.push("### Active Employees: none yet. Suggest 'Add New Employee' to create one.");
      }
    })());
  }

  // Archived Employees
  if (fetchAll || intents.has("archivedEmployees")) {
    promises.push((async () => {
      const { data } = await supabase
        .from("employees")
        .select("id, full_name, role, phone, email")
        .eq("is_archived", true)
        .order("full_name")
        .limit(200);
      if (data?.length) {
        parts.push(`### Archived Employees (${data.length}):`);
        data.forEach((e: any, idx: number) => {
          parts.push(`${idx + 1}. ${e.full_name} — ${e.role} — ${e.phone || "no phone"} — ${e.email || "no email"} (id:${e.id})`);
        });
      } else {
        parts.push("### Archived Employees: none.");
      }
    })());
  }

  // Employee Shifts (recent + upcoming 14 days)
  if (fetchAll || intents.has("employeeShifts")) {
    promises.push((async () => {
      const today = new Date();
      const past = new Date(today.getTime() - 7 * 86400000).toISOString().slice(0, 10);
      const future = new Date(today.getTime() + 14 * 86400000).toISOString().slice(0, 10);
      const [{ data: shifts }, { data: emps }] = await Promise.all([
        supabase.from("employee_shifts")
          .select("id, employee_id, shift_date, shift_type, start_time, end_time, job_type, clock_in, clock_out, break_minutes, shift_notes")
          .gte("shift_date", past).lte("shift_date", future)
          .order("shift_date").limit(200),
        supabase.from("employees").select("id, full_name").eq("is_archived", false),
      ]);
      const empMap: Record<string, string> = {};
      (emps || []).forEach((e: any) => { empMap[e.id] = e.full_name; });
      if (shifts?.length) {
        parts.push(`### Employee Shifts — last 7d / next 14d (${shifts.length}):`);
        shifts.forEach((s: any, idx: number) => {
          const name = empMap[s.employee_id] || "Unassigned";
          const status = s.clock_in && s.clock_out ? "DONE" : s.clock_in ? "WORKING" : "SCHEDULED";
          parts.push(`${idx + 1}. ${s.shift_date} — ${name} — ${s.shift_type || "Regular"}${s.job_type ? ` [${s.job_type}]` : ""} ${s.start_time || "?"}–${s.end_time || "?"} ${status} (id:${s.id})`);
        });
      } else {
        parts.push("### Employee Shifts: none in current window.");
      }
    })());
  }

  // Open / Unassigned Shifts
  if (fetchAll || intents.has("openShifts")) {
    promises.push((async () => {
      const { data } = await supabase
        .from("open_shifts")
        .select("id, shift_name, shift_date, shift_type, start_time, end_time, recurring, selected_days, allow_overtime, shift_note")
        .order("shift_date", { ascending: false })
        .limit(100);
      if (data?.length) {
        parts.push(`### Open Shifts (${data.length}):`);
        data.forEach((s: any, idx: number) => {
          const days = (s.selected_days || []).join(",");
          parts.push(`${idx + 1}. ${s.shift_name} — ${s.shift_date} ${s.shift_type || "Regular"} ${s.start_time || "?"}–${s.end_time || "?"}${days ? ` days:[${days}]` : ""}${s.recurring ? " [recurring]" : ""} (id:${s.id})`);
        });
      } else {
        parts.push("### Open Shifts: none.");
      }
    })());
  }

  await Promise.all(promises);
  return parts.join("\n") || "No relevant data found.";
}

async function fetchAIRules(supabaseUrl: string, serviceRoleKey: string, deviceId: string): Promise<string> {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const ruleKeys = ["ai_rules_dos", "ai_rules_donts", "ai_rules_custom_instructions", "ai_rules_restaurant_type", "ai_rules_knowledge_base"];
  // Use "shared" device_id for global settings, fallback to provided deviceId for backward compatibility
  const sharedDeviceId = "shared";
  
  const { data } = await supabase
    .from("user_preferences")
    .select("preference_key, preference_value")
    .eq("device_id", sharedDeviceId)
    .in("preference_key", ruleKeys);

  if (!data?.length) return "No custom AI rules configured.";

  const prefs: Record<string, string> = {};
  data.forEach((r: any) => { prefs[r.preference_key] = r.preference_value; });

  const parts: string[] = [];

  if (prefs.ai_rules_dos) {
    try {
      const dos = JSON.parse(prefs.ai_rules_dos);
      if (dos.length) parts.push(`**DO:** ${dos.map((d: string) => `• ${d}`).join(" ")}`);
    } catch { /* ignore */ }
  }

  if (prefs.ai_rules_donts) {
    try {
      const donts = JSON.parse(prefs.ai_rules_donts);
      if (donts.length) parts.push(`**DON'T:** ${donts.map((d: string) => `• ${d}`).join(" ")}`);
    } catch { /* ignore */ }
  }

  if (prefs.ai_rules_custom_instructions?.trim()) {
    parts.push(`**Custom Instructions:** ${prefs.ai_rules_custom_instructions.trim()}`);
  }

  if (prefs.ai_rules_restaurant_type?.trim()) {
    parts.push(`**Restaurant Type:** ${prefs.ai_rules_restaurant_type}`);
  }

  if (prefs.ai_rules_knowledge_base?.trim()) {
    parts.push(`**Knowledge Base:** ${prefs.ai_rules_knowledge_base.trim()}`);
  }

  return parts.length ? parts.join("\n") : "No custom AI rules configured.";
}

async function handleUpdateAIRules(
  supabaseUrl: string,
  serviceRoleKey: string,
  deviceId: string,
  ruleType: string,
  operation: string,
  value: any
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const sharedDeviceId = "shared";
  
  const keyMap: Record<string, string> = {
    dos: "ai_rules_dos",
    donts: "ai_rules_donts",
    custom_instructions: "ai_rules_custom_instructions",
    restaurant_type: "ai_rules_restaurant_type",
    knowledge_base: "ai_rules_knowledge_base",
  };

  const prefKey = keyMap[ruleType];
  if (!prefKey) return { success: false, message: `Unknown rule type: ${ruleType}` };

  try {
    // For dos/donts, we work with JSON arrays
    if (ruleType === "dos" || ruleType === "donts") {
      // Fetch current value
      const { data: existing } = await supabase
        .from("user_preferences")
        .select("preference_value")
        .eq("device_id", sharedDeviceId)
        .eq("preference_key", prefKey)
        .maybeSingle();

      let currentList: string[] = [];
      if (existing?.preference_value) {
        try { currentList = JSON.parse(existing.preference_value); } catch { currentList = []; }
      }

      if (operation === "add") {
        const newRule = typeof value === "string" ? value : String(value);
        if (!currentList.includes(newRule)) {
          currentList.push(newRule);
        }
      } else if (operation === "remove") {
        const toRemove = typeof value === "string" ? value.toLowerCase() : String(value).toLowerCase();
        currentList = currentList.filter(r => r.toLowerCase() !== toRemove);
      } else if (operation === "replace") {
        currentList = Array.isArray(value) ? value : [value];
      }

      const newValue = JSON.stringify(currentList);
      const { error } = await supabase
        .from("user_preferences")
        .upsert(
          { device_id: sharedDeviceId, preference_key: prefKey, preference_value: newValue, updated_at: new Date().toISOString() },
          { onConflict: "device_id,preference_key" }
        );
      if (error) throw error;
      return { success: true, message: `Updated ${ruleType === "dos" ? "Do's" : "Don'ts"} rules successfully.` };
    } else {
      // For text fields (custom_instructions, restaurant_type, knowledge_base)
      const newValue = typeof value === "string" ? value : JSON.stringify(value);
      const { error } = await supabase
        .from("user_preferences")
        .upsert(
          { device_id: sharedDeviceId, preference_key: prefKey, preference_value: newValue, updated_at: new Date().toISOString() },
          { onConflict: "device_id,preference_key" }
        );
      if (error) throw error;
      const labelMap: Record<string, string> = { custom_instructions: "Custom Instructions", restaurant_type: "Restaurant Type", knowledge_base: "Knowledge Base" };
      return { success: true, message: `Updated ${labelMap[ruleType] || ruleType} successfully.` };
    }
  } catch (e) {
    console.error("Error updating AI rules:", e);
    return { success: false, message: `Failed to update ${ruleType}: ${e instanceof Error ? e.message : "Unknown error"}` };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, settingsContext, provider, model: requestedModel, deviceId, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // ── Determine AI provider and resolve API key ──────────────────────
    let aiEndpoint = "https://ai.gateway.lovable.dev/v1/chat/completions";
    let aiApiKey = LOVABLE_API_KEY;
    let aiModel = "";
    let isExternalProvider = false;

    // Map provider IDs to their API endpoints and model prefixes
    const PROVIDER_ENDPOINTS: Record<string, { url: string; keyPrefix: string }> = {
      openai: { url: "https://api.openai.com/v1/chat/completions", keyPrefix: "sk-" },
      anthropic: { url: "https://api.anthropic.com/v1/messages", keyPrefix: "sk-ant-" },
      google: { url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", keyPrefix: "AIza" },
      maya: { url: "https://api.maya-ai.com/v1/chat/completions", keyPrefix: "maya-" },
    };

    // If a non-platform provider is selected, look up the user's API key
    if (provider && provider !== "platform" && PROVIDER_ENDPOINTS[provider] && deviceId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: keyPref } = await supabaseAdmin
        .from("user_preferences")
        .select("preference_value")
        .eq("device_id", "shared")
        .eq("preference_key", "ai_integration_api_key")
        .maybeSingle();

      if (keyPref?.preference_value) {
        const provConfig = PROVIDER_ENDPOINTS[provider];
        aiEndpoint = provConfig.url;
        aiApiKey = keyPref.preference_value;
        aiModel = requestedModel || "";
        isExternalProvider = true;
        console.log(`Using external provider: ${provider}, model: ${aiModel}`);
      } else {
        console.log(`No API key found for provider ${provider}, falling back to platform AI`);
      }
    }

    if (!aiApiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured. Please add your API key in AI Integration settings." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Cap conversation history to last 10 messages ──────────────────────
    const recentMessages = Array.isArray(messages)
      ? messages.slice(-10)
      : [];

    // ── Resolve active scope from current settings module ────────────────
    const scope = resolveContextScope(context);
    const scopeBlock = scope
      ? `Module: ${scope.label}\n${scope.instruction}`
      : "No active module scope. Answer general settings questions only.";

    // ── Detect intent from recent messages, then constrain by scope ──────
    let intents = detectIntent(recentMessages);
    if (scope) {
      // Only fetch DB tables that are relevant to the active module.
      // Empty intents = no DB data needed (e.g. Account, Appearance, Payments settings).
      const allowed = new Set<Intent>(scope.intents);
      const filtered = new Set<Intent>([...intents].filter(i => allowed.has(i)));
      intents = filtered.size > 0 ? filtered : (allowed.size > 0 ? allowed : new Set<Intent>());
    }
    console.log("Context:", context || "none", "| Scope:", scope?.label || "none", "| Intents:", [...intents].join(", ") || "none", "| Messages:", recentMessages.length);

    let databaseContext = scope && intents.size === 0
      ? "(No database tables are relevant to this module. Do not reference menus/products/categories/modifiers/add-ons.)"
      : "Database not available";
    if (intents.size > 0 && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        databaseContext = await fetchDatabaseContext(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, intents);
      } catch (e) {
        console.error("Failed to fetch database context:", e);
        databaseContext = "Error loading database data";
      }
    }

    // ── Fetch AI Rules & Instructions ─────────────────────────────────────
    let aiRulesContext = "No custom AI rules configured.";
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && deviceId) {
      try {
        aiRulesContext = await fetchAIRules(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, deviceId);
      } catch (e) {
        console.error("Failed to fetch AI rules:", e);
      }
    }

    // Only include local settings context if it's about non-DB settings
    const trimmedSettings = settingsContext && settingsContext.length > 2000
      ? settingsContext.substring(0, 2000) + "\n...(truncated)"
      : (settingsContext || "");

    const systemPromptWithContext = SYSTEM_PROMPT
      .replace("{SCOPE_BLOCK}", scopeBlock)
      .replace("{DATABASE_CONTEXT}", databaseContext)
      .replace("{SETTINGS_CONTEXT}", trimmedSettings)
      .replace("{AI_RULES_CONTEXT}", aiRulesContext);

    // Check for images
    const hasImage = recentMessages.some((m: any) => Array.isArray(m.content) && m.content.some((c: any) => c.type === "image_url"));

    const finalSystemPrompt = hasImage
      ? systemPromptWithContext + IMAGE_ADDENDUM
      : systemPromptWithContext;

    const apiMessages: ChatMessage[] = [
      { role: "system", content: finalSystemPrompt },
      ...recentMessages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    // Determine model to use
    if (!isExternalProvider) {
      aiModel = hasImage ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview";
    }

    console.log("AI request:", apiMessages.length, "msgs,", hasImage ? "with image," : "", "model:", aiModel, "provider:", provider || "platform");

    const maxRetries = 3;
    let data: any = null;

    // ── Build request based on provider ──────────────────────────────────
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        let response: Response;

        if (provider === "anthropic" && isExternalProvider) {
          // Anthropic uses a different API format
          const anthropicMessages = apiMessages
            .filter(m => m.role !== "system")
            .map(m => ({ role: m.role, content: m.content }));
          const systemContent = apiMessages.find(m => m.role === "system")?.content || "";

          response = await fetch(aiEndpoint, {
            method: "POST",
            headers: {
              "x-api-key": aiApiKey!,
              "Content-Type": "application/json",
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: aiModel || "claude-3-5-sonnet-20241022",
              system: systemContent,
              messages: anthropicMessages,
              max_tokens: 2048,
              temperature: 0.7,
            }),
          });
        } else if (provider === "google" && isExternalProvider) {
          // Google Gemini via OpenAI-compatible endpoint
          response = await fetch(`${aiEndpoint}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${aiApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: aiModel || "gemini-2.5-flash",
              messages: apiMessages,
              stream: false,
              temperature: 0.7,
              max_tokens: 2048,
            }),
          });
        } else {
          // OpenAI-compatible format (OpenAI, Maya, Platform)
          response = await fetch(aiEndpoint, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${aiApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: aiModel,
              messages: apiMessages,
              stream: false,
              temperature: 0.7,
              max_tokens: 2048,
            }),
          });
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`AI error (attempt ${attempt}):`, response.status, errorText);

          if (response.status === 401 || response.status === 403) {
            return new Response(
              JSON.stringify({ error: "Invalid API key. Please check your key in AI Integration settings." }),
              { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          if (response.status === 429) {
            return new Response(
              JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          if (response.status === 402) {
            if (attempt < maxRetries) {
              await new Promise(r => setTimeout(r, attempt * 1000));
              continue;
            }
            return new Response(
              JSON.stringify({
                message: "I'm temporarily unable to process your request. Please try again in a moment.",
                action: { type: "info" },
                quickReplies: ["Try Again"],
                multiSelect: false,
              }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          if (response.status >= 500 && attempt < maxRetries) {
            await new Promise(r => setTimeout(r, attempt * 1000));
            continue;
          }
          throw new Error(`AI gateway ${response.status}: ${errorText}`);
        }

        data = await response.json();
        break;
      } catch (error) {
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, attempt * 1000));
        }
      }
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize response across providers
    let content: string | undefined;
    if (provider === "anthropic" && isExternalProvider) {
      // Anthropic response format: { content: [{ type: "text", text: "..." }] }
      content = data.content?.[0]?.text;
    } else {
      // OpenAI-compatible format
      content = data.choices?.[0]?.message?.content;
    }
    
    if (!content) {
      return new Response(
        JSON.stringify({ error: "No response from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("AI response:", content.substring(0, 150));

    let parsedResponse;
    try {
      let clean = content.trim();
      if (clean.startsWith("```json")) clean = clean.slice(7);
      if (clean.startsWith("```")) clean = clean.slice(3);
      if (clean.endsWith("```")) clean = clean.slice(0, -3);
      parsedResponse = JSON.parse(clean.trim());
    } catch {
      parsedResponse = { message: content, action: { type: "info" } };
    }

    // Sanitize message field
    if (parsedResponse.message && typeof parsedResponse.message === "string") {
      let msg = parsedResponse.message;
      msg = msg.replace(/```json[\s\S]*?```/g, "").replace(/```[\s\S]*?```/g, "").trim();
      msg = msg.replace(/^\s*\{[\s\S]*\}\s*$/m, "").trim();
      msg = msg.replace(/^\s*"(message|action|quickReplies|multiSelect|type)"[\s\S]*$/gm, "").trim();
      msg = msg.replace(/^\s*[\{\}\[\],]\s*$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
      if (!msg) msg = "Got it! What would you like to do next?";
      parsedResponse.message = msg;
    }

    // Ensure quickReplies (banned navigation labels are filtered below)
    if (!parsedResponse.quickReplies || !Array.isArray(parsedResponse.quickReplies) || parsedResponse.quickReplies.length === 0) {
      const msg = (parsedResponse.message || "").toLowerCase();
      const actionType = parsedResponse.action?.type || "";
      if (msg.includes("menu") && msg.includes("step")) parsedResponse.quickReplies = ["Continue", "Skip", "Cancel"];
      else if (actionType === "generate_report" || msg.includes("sales report") || msg.includes("revenue") || msg.includes("report")) parsedResponse.quickReplies = ["Today's Sales", "Yesterday's Report", "This Week", "This Month"];
      else if (msg.includes("gratuity") || msg.includes("tip")) parsedResponse.quickReplies = ["Tip Settings"];
      else if (msg.includes("guest") || msg.includes("customer")) parsedResponse.quickReplies = ["View Guests", "Add Guest", "Archive Guest"];
      else if (msg.includes("employee") || msg.includes("staff") || msg.includes("shift")) parsedResponse.quickReplies = ["Shift Schedule"];
      else if (msg.includes("payment") || msg.includes("checkout")) parsedResponse.quickReplies = ["Payment Methods", "Checkout Options"];
      else if (msg.includes("service charge")) parsedResponse.quickReplies = ["Add Charge"];
      else if (msg.includes("menu")) parsedResponse.quickReplies = ["Add New Menu"];
      else if (msg.includes("product")) parsedResponse.quickReplies = ["Add Product"];
      else if (msg.includes("discount")) parsedResponse.quickReplies = ["Add Discount"];
      else if (msg.includes("tax")) parsedResponse.quickReplies = ["Add Tax"];
      else if (msg.includes("order") || msg.includes("ticket")) parsedResponse.quickReplies = ["Order Settings"];
      else if (/applied|success|done|created|saved/.test(msg)) parsedResponse.quickReplies = ["Add Another"];
      else parsedResponse.quickReplies = [];
    }

    // Strip banned navigation labels from any AI-generated quickReplies
    const BANNED_QUICK_REPLIES = new Set([
      "view menu", "view menus", "view product", "view products",
      "view discount", "view discounts", "go to setting", "go to settings",
    ]);
    if (Array.isArray(parsedResponse.quickReplies)) {
      parsedResponse.quickReplies = parsedResponse.quickReplies.filter(
        (r: string) => typeof r === "string" && !BANNED_QUICK_REPLIES.has(r.trim().toLowerCase())
      );
    }
    // Strip navigation hint so the AI never auto-changes the background screen
    if (parsedResponse.navigateTo) delete parsedResponse.navigateTo;
    if (parsedResponse.action && parsedResponse.action.type === "navigate") {
      parsedResponse.action = { type: "info" };
    }

    if (parsedResponse.multiSelect === undefined) parsedResponse.multiSelect = false;
    if (!parsedResponse.action) parsedResponse.action = { type: "info" };

    // ── Handle update_ai_rules action server-side ────────────────────────
    if (parsedResponse.action?.type === "update_ai_rules" && deviceId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const { ruleType, operation, value } = parsedResponse.action;
      if (ruleType && operation && value !== undefined) {
        const result = await handleUpdateAIRules(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, deviceId, ruleType, operation, value);
        console.log("AI rules update result:", result);
        if (result.success) {
          parsedResponse.action = { type: "ai_rules_updated", ruleType, operation, value, success: true };
        } else {
          parsedResponse.action = { type: "ai_rules_updated", ruleType, operation, success: false, error: result.message };
          parsedResponse.message = (parsedResponse.message || "") + "\n\n⚠️ " + result.message;
        }
      }
    }

    return new Response(
      JSON.stringify(parsedResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-settings-chat:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
