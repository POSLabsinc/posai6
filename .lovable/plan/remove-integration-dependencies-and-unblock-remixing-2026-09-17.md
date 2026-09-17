# Remove integration dependencies and unblock remixing

## Confirmed diagnosis

- The remix dialog fails specifically while Lovable copies project integrations.
- No standard connector or app MCP is currently linked to this project. The workspace Google Maps connection exists, but is not linked here.
- The project still contains direct Google Maps connector-gateway calls, multiple Lovable AI gateway functions, and the managed `LOVABLE_API_KEY` used by those functions.
- Lovable Cloud itself is healthy. It will remain connected so the app keeps its database, authentication, storage, and non-AI backend behavior.

## Changes

1. **Remove Google Maps integration usage**
   - Remove connector-gateway calls from both onboarding business-search experiences.
   - Preserve the onboarding flow with manual business entry and existing local fallback behavior, without presenting fallback data as live Maps results.

2. **Remove managed AI integration usage**
   - Remove client calls to AI-backed functions across onboarding, settings, reports, dashboards, employee PIN lookup, delivery, and handoff experiences.
   - Replace AI-dependent controls with honest non-AI states or deterministic local behavior where an existing fallback already exists.
   - Do not fabricate AI responses or hardcode database data into screens.

3. **Remove AI backend functions**
   - Remove the six confirmed AI gateway functions from source and deployment: device setup chat, settings chat, order chat, Point of Sale insights, reports AI, and shift insights.
   - Remove their function configuration entries where present.
   - Leave unrelated Lovable Cloud functions and all database features untouched.

4. **Clean integration references**
   - Remove unused integration imports, gateway URLs, and `LOVABLE_API_KEY` reads.
   - Confirm there are no remaining Google Maps connector or Lovable AI gateway references in application and function code.
   - The managed key itself cannot be manually deleted with project secret controls. Once nothing consumes it, any remaining remix failure indicates stale Lovable platform metadata rather than an active app integration.

5. **Validate and retry path**
   - Check the affected onboarding, order, settings, reports, dashboard, delivery, and handoff screens on desktop and mobile.
   - Verify the app has no new browser errors and core Lovable Cloud data flows still work.
   - Retry Remix. If the same integration-copy error remains, collect the confirmed evidence for Lovable Support because the blocker is then outside the project code and available connection controls.

## Expected tradeoff

Google Maps suggestions and all AI-generated chats, insights, reports, recommendations, and AI-assisted lookups will no longer function. Core Point of Sale workflows and Lovable Cloud data remain.
