## Add text input when "Other" is selected on Restaurant Type screen

**File:** `src/pages/OnboardingAppSignupRestaurantType.tsx`

### Behavior
- When the user taps the **Other** card, reveal a text input directly below the options grid: "Tell us about your business" (placeholder: e.g. "Juice bar, ghost kitchen, catering…").
- Input is single-line, max ~60 chars, optional trim.
- **Next** button stays disabled until either (a) a non-Other option is selected, or (b) Other is selected AND the text input has at least 2 non-whitespace characters.
- On Next, pass `restaurantType: "other"` plus `restaurantTypeOther: <trimmed text>` through router state to `/locations` (and onward to Mode/Revenue).
- Skip behavior unchanged (sets `restaurantType: "other"` with no custom text).
- Mode recommendation downstream still maps Other → Standard (no change).

### Implementation notes
- Add `const [otherText, setOtherText] = useState<string>((incoming.restaurantTypeOther as string) ?? "")`.
- Conditionally render an `<input>` (styled to match existing dark inputs in the onboarding flow) below `optionsGrid` when `selected === "other"`.
- Update `handleNext` disabled check: `!selected || (selected === "other" && otherText.trim().length < 2)`.
- Auto-focus the input when Other is first selected.
- Works in both portrait and landscape layouts (input lives inside the same scrollable area as the options grid).

No routing, no backend, no other screens affected.