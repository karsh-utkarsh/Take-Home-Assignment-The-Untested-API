# Bug Report

# Task Manager API — Bug Report

**Project:** Task Manager API
**Date:** September 29, 2026
**Environment:** Node.js, Express.js, Jest, Supertest
**Test Command:** `npm test -- --runInBand`
**Coverage Command:** `npm run coverage`

---

## Executive Summary

During testing and validation of the Task Manager API, two functional bugs were identified through automated tests:

1. Completing a task unexpectedly changed its priority to `medium`.
2. Task pagination used an incorrect offset calculation, causing the first page to skip tasks.

Both issues were reproduced through automated tests and fixed.

A new `PATCH /tasks/:id/assign` feature was also implemented with input validation, error handling, unit tests, and integration tests.

### Final Verification

| Metric             |    Result |
| ------------------ | --------: |
| Test Suites        |  2 passed |
| Tests              | 35 passed |
| Tests Failed       |         0 |
| Statement Coverage |    94.70% |
| Branch Coverage    |    86.90% |
| Function Coverage  |    93.10% |
| Line Coverage      |    94.16% |

---

# Bug 1 — Completing a Task Changes Its Priority

## Summary

Completing a task unexpectedly changes its existing priority to `medium`.

## Severity

**Medium**

The issue does not prevent a task from being completed, but it silently modifies existing task data. This can cause users to lose their intended priority information.

## Expected Behavior

When a task is completed:

* `status` should change to `done`.
* `completedAt` should be populated.
* Existing task properties, including `priority`, should remain unchanged unless explicitly required by the operation.

For example, before completion:

```json
{
  "title": "Finish assignment",
  "priority": "high",
  "status": "todo"
}
```

After completion:

```json
{
  "title": "Finish assignment",
  "priority": "high",
  "status": "done"
}
```

## Actual Behavior

A task with `priority: "high"` was changed to:

```json
{
  "priority": "medium",
  "status": "done"
}
```

when completed.

## How the Bug Was Discovered

The issue was discovered while writing a unit test for `completeTask()`.

The initial test verified that the task status became `done` and that `completedAt` was populated. The test was then strengthened to verify that completing a task did not unexpectedly modify its existing priority.

The strengthened test failed, revealing the bug.

## Steps to Reproduce

1. Create a task with high priority.
2. Call `completeTask()` with the task ID.
3. Inspect the returned task.
4. Observe that its priority has changed from `high` to `medium`.

The behavior was reproduced through an automated unit test.

## Test That Exposed the Bug

The test created a high-priority task:

```js
const task = taskService.create({
  title: 'Complete me',
  priority: 'high'
});
```

It then completed the task:

```js
const completed = taskService.completeTask(task.id);
```

The test expected:

```js
expect(completed.priority).toBe('high');
```

The test initially failed with:

```text
Expected: "high"
Received: "medium"
```

## Root Cause

The `completeTask()` implementation explicitly overwrote the existing priority:

```js
const updated = {
  ...task,
  priority: 'medium',
  status: 'done',
  completedAt: new Date().toISOString(),
};
```

Because `priority: 'medium'` appears after `...task`, it replaces the task's original priority.

## Fix

The unintended priority assignment was removed:

```js
const updated = {
  ...task,
  status: 'done',
  completedAt: new Date().toISOString(),
};
```

The existing priority is now preserved.

## Regression Test

The unit test was retained after the fix and verifies that:

* the task status becomes `done`
* `completedAt` is populated
* the existing priority is preserved

This prevents the same regression from being introduced again.

## Verification

After applying the fix:

```text
PASS tests/taskService.test.js
PASS tests/tasks.test.js

Test Suites: 2 passed, 2 total
Tests:       35 passed, 35 total
```

---

# Bug 2 — Incorrect Pagination Offset

## Summary

The pagination implementation calculated the starting offset incorrectly for 1-based page numbers.

## Severity

**Medium**

The issue causes users requesting the first page of tasks to receive the wrong records.

## Expected Behavior

For:

```text
GET /tasks?page=1&limit=2
```

the API should return:

```text
Task 1
Task 2
```

For:

```text
GET /tasks?page=2&limit=2
```

the API should return:

```text
Task 3
Task 4
```

## Actual Behavior

The original implementation calculated the offset using:

```js
const offset = page * limit;
```

For:

```text
page = 1
limit = 2
```

the resulting offset was:

```text
1 × 2 = 2
```

Since arrays use zero-based indexing, the API skipped the first two tasks and started from the third task.

## How the Bug Was Discovered

The issue was discovered while writing pagination unit tests.

A test for the first page expected `Task 1` and `Task 2`, but the implementation returned tasks starting from the third item.

A second-page test was then added to verify that pagination worked correctly across multiple pages.

These tests exposed the incorrect offset calculation.

## Steps to Reproduce

1. Create four tasks:

```text
Task 1
Task 2
Task 3
Task 4
```

2. Request:

```text
GET /tasks?page=1&limit=2
```

3. Observe that the first page does not contain `Task 1` and `Task 2`.

## Root Cause

The pagination calculation treated the page number as a zero-based index even though the API accepts conventional 1-based page numbers.

Original implementation:

```js
const offset = page * limit;
```

## Fix

The calculation was changed to:

```js
const offset = (page - 1) * limit;
```

This correctly converts the 1-based page number into a zero-based array offset.

For example:

```text
page = 1
limit = 2

offset = (1 - 1) × 2
       = 0
```

Therefore, the first page starts at index `0`.

## Regression Tests

Pagination tests were added for multiple pages.

### First page

```text
page = 1
limit = 2

Expected:
Task 1
Task 2
```

### Second page

```text
page = 2
limit = 2

Expected:
Task 3
Task 4
```

Both tests pass after the fix.

---

# New Feature — Assign Task

As part of the assignment, the following feature was implemented:

```text
PATCH /tasks/:id/assign
```

## Request

```json
{
  "assignee": "Utkarsh"
}
```

## Successful Response

The endpoint returns the updated task:

```json
{
  "id": "uuid",
  "title": "Finish assignment",
  "assignee": "Utkarsh"
}
```

## Validation

The endpoint validates the `assignee` field.

### Valid Value

```json
{
  "assignee": "Utkarsh"
}
```

Returns:

```text
200 OK
```

### Empty Value

```json
{
  "assignee": ""
}
```

Returns:

```text
400 Bad Request
```

with:

```json
{
  "error": "assignee is required and must be a non-empty string"
}
```

### Whitespace

Leading and trailing whitespace is removed before storing the assignee.

For example:

```json
{
  "assignee": "  Utkarsh  "
}
```

is stored as:

```text
Utkarsh
```

### Nonexistent Task

```text
PATCH /tasks/does-not-exist/assign
```

returns:

```text
404 Not Found
```

with:

```json
{
  "error": "Task not found"
}
```

## Testing

The new feature has both unit and integration coverage.

### Unit Tests

* assigns an existing task through `taskService.assignTask()`
* returns `null` for a nonexistent task

### Integration Tests

* assigns an existing task
* rejects an empty assignee
* returns `404` for a nonexistent task

---

# Testing Strategy

The test suite was divided into two layers.

## Unit Tests

**File:** `tests/taskService.test.js`

The unit tests directly test the task service and cover:

* task creation
* default values
* retrieving all tasks
* finding tasks by ID
* missing task IDs
* status filtering
* pagination
* statistics
* overdue tasks
* updating tasks
* deleting tasks
* completing tasks
* assigning tasks
* missing-task behavior

## Integration Tests

**File:** `tests/tasks.test.js`

The integration tests exercise the actual HTTP API using Supertest.

Endpoints covered include:

```text
GET    /tasks
GET    /tasks?status=...
GET    /tasks?page=...&limit=...
GET    /tasks/stats
POST   /tasks
PUT    /tasks/:id
DELETE /tasks/:id
PATCH  /tasks/:id/complete
PATCH  /tasks/:id/assign
```

Validation and error cases were also tested, including:

* missing required fields
* invalid status
* invalid priority
* empty assignee
* nonexistent task IDs

---

# Test Isolation

The application currently stores tasks in an in-memory array.

To prevent tests from affecting each other, the test suite resets the service state before each test:

```js
beforeEach(() => {
  taskService._reset();
});
```

This ensures that every test starts with a clean task collection and that test results do not depend on execution order.

---

# Final Test Results

The final test suite produced:

```text
Test Suites: 2 passed, 2 total
Tests:       35 passed, 35 total
Snapshots:   0 total
Time:        1.335 s
```

No tests are failing.

## Coverage

```text
Statements: 94.70%
Branches:   86.90%
Functions:  93.10%
Lines:      94.16%
```

The assignment target of **80%+ coverage** was exceeded.

---

# Remaining Testing Opportunities

Although the current test suite provides strong coverage, additional testing would be useful before production.

Potential areas include:

1. Pagination with invalid values such as negative pages or limits.
2. Pagination when the requested page contains no tasks.
3. Additional date validation cases.
4. Boundary cases around overdue tasks.
5. Behavior when assigning an already-assigned task.
6. Validation of extremely long assignee names.
7. Concurrent requests modifying the same task.
8. API behavior with malformed JSON requests.
9. Error-handling middleware.
10. Performance testing with a large number of tasks.

These cases were not added unnecessarily because the assignment focuses on the behavior required by the current API specification.

---

# Production Considerations

Before production deployment, the in-memory task storage should be replaced with persistent storage such as a database.

Other production considerations would include:

* authentication and authorization
* structured logging
* centralized error handling
* API rate limiting
* request/schema validation
* database-level constraints
* monitoring and alerting
* health-check endpoints
* API documentation
* automated CI test execution
* dependency and security auditing
* concurrency and data-integrity handling

These considerations are outside the scope of the requested implementation but would be important for a production Task Manager API.

---

# Conclusion

The Task Manager API was tested at both the service and HTTP integration levels.

Testing identified two functional issues:

1. Completing a task unexpectedly changed its priority.
2. Pagination used an incorrect offset calculation.

Both issues were reproduced through automated tests and corrected.

The requested task-assignment feature was also implemented with validation, error handling, unit tests, and integration tests.

The final implementation contains **35 passing tests** with **94.70% statement coverage**, providing regression protection for the existing functionality and the newly implemented feature.
