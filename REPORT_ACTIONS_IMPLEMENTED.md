## Summary: Made Report Actions Functional

### Changes Made:

1. **Updated API endpoint** (`app/api/admin/reports/[id]/route.ts`):
   - Changed valid statuses from `['pending', 'under_review', 'resolved', 'dismissed']` to `['open', 'in_progress', 'closed', 'rejected']`

2. **Created new client component** (`components/ReportActions.tsx`):
   - Handles status updates for reports
   - Shows loading states while updating
   - Only shows action buttons for "open" reports
   - Three actions:
     - 🔵 Clock icon → Mark "In Progress"
     - ✅ Check icon → Mark "Closed" (resolved)
     - ❌ X icon → Mark "Rejected" (dismissed)

3. **Updated reports page** (`app/admin/reports/page.tsx`):
   - Imported the new ReportActions component
   - Replaced static buttons with functional component

### How It Works:

- Admin sees action buttons only for reports with "open" status
- Clicking a button:
  1. Shows loading spinner
  2. Calls API to update status
  3. Refreshes the page to show updated data
  4. Updates the count cards at the top

### Test It:

1. Go to `/admin/reports`
2. Click any action button on an open report
3. Report status should update and counts should change
4. The action buttons disappear after status changes (no longer "open")
