

# Fix: Clock-In PIN Validation Failing

## Root Cause
There are **two employees** with PIN `1234` in the database (John Smith and Rohan Yadav). The `lookupEmployeeByPin()` function uses `.maybeSingle()`, which **throws an error** when multiple rows match — causing the PIN to appear invalid.

## Fix (2 changes)

### 1. Update `src/lib/employeePinLookup.ts`
Change `.maybeSingle()` to `.limit(1)` so the query returns the first matching employee instead of erroring on duplicates:
```typescript
// Before
.maybeSingle();
if (error || !data) return null;
return data;

// After
.limit(1);
if (error || !data || data.length === 0) return null;
return data[0];
```

### 2. Fix duplicate PIN in database
Update the duplicate employee (Rohan Yadav) to have a different PIN so two employees don't share `1234`. This prevents ambiguity on clock-in. Migration:
```sql
UPDATE employees SET pin = '4321' WHERE id = '376cfa22-3f2a-460f-849b-5f92640d2e18';
```

