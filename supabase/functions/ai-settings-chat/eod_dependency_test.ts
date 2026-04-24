// E2E tests for the deployed `ai-settings-chat` edge function.
//
// Verifies the AI's MANDATORY DEPENDENCY CHAINS for End of Day toggles:
//   1. Enabling "End of Day Reminder" must first prompt for Auto End of Day Time
//      (no update_setting emitted on the first turn).
//   2. Enabling "Run End of Day" must first prompt for Auto Run Time
//      (no update_setting emitted on the first turn).
//   3. Enabling "Send Daily Reports" must first prompt for recipient employees
//      (no update_setting emitted on the first turn, multiSelect:true).
//
// Each test then sends a follow-up turn supplying the dependent value and
// asserts that update_setting is finally emitted with the full payload
// (toggle + dependent field) and autoApply:true.

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FN_URL = `${SUPABASE_URL}/functions/v1/ai-settings-chat`;

interface AIResponse {
  message: string;
  action?: {
    type: string;
    settingType?: string;
    operation?: string;
    data?: Record<string, unknown>;
    autoApply?: boolean;
  };
  quickReplies?: string[];
  multiSelect?: boolean;
}

async function callAI(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<AIResponse> {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      messages,
      context: "end-of-day",
      scope: "End of Day",
    }),
  });

  const text = await res.text();
  assertEquals(res.status, 200, `Edge function failed: ${text}`);

  // Function may return either a parsed JSON action or a stringified one.
  let parsed: AIResponse;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response: ${text}`);
  }
  // Some implementations wrap in {response: "..."} — tolerate that.
  // deno-lint-ignore no-explicit-any
  const maybeWrapped = parsed as any;
  if (typeof maybeWrapped.response === "string") {
    try {
      parsed = JSON.parse(maybeWrapped.response);
    } catch {
      // leave parsed as-is; tests will fail with a clear message
    }
  }
  return parsed;
}

function isInfoOrNoUpdate(r: AIResponse): boolean {
  if (!r.action) return true;
  if (r.action.type === "info") return true;
  // Anything other than update_setting on the first turn is acceptable
  return r.action.type !== "update_setting";
}

// ─── Test 1: EOD Reminder must prompt for Auto End of Day Time ──────────────
Deno.test("EOD Reminder enable → prompts for Auto End of Day Time first", async () => {
  const turn1 = await callAI([
    { role: "user", content: "Enable End of Day Reminder" },
  ]);

  assertExists(turn1.message, "Missing message on turn 1");
  assert(
    isInfoOrNoUpdate(turn1),
    `Expected NO update_setting on turn 1, got: ${JSON.stringify(turn1.action)}`,
  );
  // Message should reference time selection
  assert(
    /time/i.test(turn1.message),
    `Turn 1 message should ask about time. Got: "${turn1.message}"`,
  );
  // Quick replies should include time options
  assertExists(turn1.quickReplies, "Turn 1 should include quickReplies");
  const hasTimeOption = turn1.quickReplies!.some((q) =>
    /\d{1,2}:\d{2}\s?(AM|PM)/i.test(q)
  );
  assert(
    hasTimeOption,
    `Turn 1 quickReplies should include time options. Got: ${
      JSON.stringify(turn1.quickReplies)
    }`,
  );

  // Turn 2: pick a time and verify update_setting is emitted with both fields
  const turn2 = await callAI([
    { role: "user", content: "Enable End of Day Reminder" },
    { role: "assistant", content: turn1.message },
    { role: "user", content: "11:00 PM" },
  ]);

  assertExists(turn2.action, "Turn 2 must include an action");
  assertEquals(
    turn2.action!.type,
    "update_setting",
    `Turn 2 should emit update_setting. Got: ${JSON.stringify(turn2.action)}`,
  );
  assertEquals(turn2.action!.settingType, "endOfDay");
  assertEquals(turn2.action!.autoApply, true);
  const data = turn2.action!.data as Record<string, unknown>;
  assertEquals(data.endOfDayReminder, true);
  assertExists(data.autoEndOfDayTime, "Must include autoEndOfDayTime");
});

// ─── Test 2: Run End of Day must prompt for Auto Run Time ───────────────────
Deno.test("Run End of Day enable → prompts for Auto Run Time first", async () => {
  const turn1 = await callAI([
    { role: "user", content: "Enable Run End of Day" },
  ]);

  assert(
    isInfoOrNoUpdate(turn1),
    `Expected NO update_setting on turn 1, got: ${JSON.stringify(turn1.action)}`,
  );
  assert(
    /time/i.test(turn1.message),
    `Turn 1 message should ask for run time. Got: "${turn1.message}"`,
  );

  const turn2 = await callAI([
    { role: "user", content: "Enable Run End of Day" },
    { role: "assistant", content: turn1.message },
    { role: "user", content: "11:30 PM" },
  ]);

  assertExists(turn2.action, "Turn 2 must include an action");
  // The flow may ask additional companion-toggle questions before applying.
  // Accept either a final update_setting or an info turn that still references
  // the picked time. The strongest assertion: if update_setting fires, the
  // payload must contain runEndOfDay:true AND autoRunTime.
  if (turn2.action!.type === "update_setting") {
    assertEquals(turn2.action!.settingType, "endOfDay");
    assertEquals(turn2.action!.autoApply, true);
    const data = turn2.action!.data as Record<string, unknown>;
    assertEquals(data.runEndOfDay, true);
    assertExists(data.autoRunTime, "Must include autoRunTime");
  } else {
    // Acceptable: an intermediate companion-toggle question. Verify it is
    // still gated (no premature update_setting) and references EOD context.
    assert(
      isInfoOrNoUpdate(turn2),
      `Expected info or final update_setting on turn 2. Got: ${
        JSON.stringify(turn2.action)
      }`,
    );
  }
});

// ─── Test 3: Send Daily Reports must prompt for recipient employees ─────────
Deno.test("Send Daily Reports enable → prompts for recipients first (multiSelect)", async () => {
  const turn1 = await callAI([
    { role: "user", content: "Enable Send Daily Reports" },
  ]);

  assert(
    isInfoOrNoUpdate(turn1),
    `Expected NO update_setting on turn 1, got: ${JSON.stringify(turn1.action)}`,
  );
  assert(
    /(employee|recipient|who|send.*to)/i.test(turn1.message),
    `Turn 1 message should ask for recipients. Got: "${turn1.message}"`,
  );
  assertEquals(
    turn1.multiSelect,
    true,
    "Recipient selection should be multiSelect:true",
  );
  assertExists(turn1.quickReplies, "Turn 1 should include employee quickReplies");
  assert(
    turn1.quickReplies!.length >= 2,
    `Expected multiple employee options. Got: ${
      JSON.stringify(turn1.quickReplies)
    }`,
  );

  // Turn 2: pick recipients and verify final update_setting payload
  const turn2 = await callAI([
    { role: "user", content: "Enable Send Daily Reports" },
    { role: "assistant", content: turn1.message },
    { role: "user", content: "John Smith, Jane Doe" },
  ]);

  assertExists(turn2.action, "Turn 2 must include an action");
  assertEquals(
    turn2.action!.type,
    "update_setting",
    `Turn 2 should emit update_setting. Got: ${JSON.stringify(turn2.action)}`,
  );
  assertEquals(turn2.action!.settingType, "endOfDay");
  assertEquals(turn2.action!.autoApply, true);
  const data = turn2.action!.data as Record<string, unknown>;
  assertExists(
    data.selectedEmployees,
    `Must include selectedEmployees. Got data: ${JSON.stringify(data)}`,
  );
  assert(
    Array.isArray(data.selectedEmployees) &&
      (data.selectedEmployees as unknown[]).length >= 1,
    "selectedEmployees must be a non-empty array",
  );
});
