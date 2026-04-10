

# Plan: Generate PDF Report of All Settings Functionality for AI Assistant

## Objective
Create a comprehensive PDF document listing every setting module, its configurable options, and the natural language commands the AI Assistant can execute for each. This serves as a reference guide for both users and the AI Assistant.

## Report Structure
The PDF will be organized by settings module with these sections:

1. **Cover Page** - "POS AI 6.0 - AI Assistant Settings Reference Guide"
2. **Gratuity & Tips** - Enable/disable tips, presets, custom gratuity, show on receipt, auto-gratuity for large parties
3. **Discounts** - Add, update, archive discounts; set PIN requirements; view active discounts
4. **Taxes** - Add, update, archive taxes; change tax type (inclusive/exclusive); view active taxes
5. **Service Charges** - Add, update, archive charges; set delivery fees; auto-apply for party sizes
6. **Checkout Options** - 18 toggles (quick amounts, split check, tips, order type, guest name, receipts, signatures, payment sounds, hold & fire, etc.)
7. **Menu Management** - Activate/deactivate menus; enable/disable channels (POS, Kiosk, Online); add new menus
8. **Orders Settings** - 5 toggles (creation rules, order flow, hold & recall, sync, notifications)
9. **Appearance** - Theme (dark/light/system), text size, bold text, brightness, icon style, icon size
10. **Control Center** - KDS, debug mode, auto-lock timer, force clock-in, restart app, performance summary, built-in display, and more
11. **Navigation Commands** - All "go to" / "open" navigation paths
12. **Cash Management** - Drawer sessions, pay in/out, vouchers
13. **Payment Methods** - Enable/disable individual payment methods

Each section will include:
- Setting name and description
- Current default value
- Example AI commands (what to say to the assistant)
- Supported actions (view, enable, disable, add, update, archive)

## Technical Approach
- Use Python `reportlab` to generate a professional PDF
- Montserrat font (project standard)
- Dark-themed design matching the POS brand (#131316 background, white text)
- Output to `/mnt/documents/POS_AI_Settings_Reference_Guide.pdf`
- Visual QA via `pdftoppm` before delivery

## Files Changed
No codebase changes. This is a standalone PDF artifact generated via script.

