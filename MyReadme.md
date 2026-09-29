# Take-Home Assignment — The Untested API

A Task Manager REST API built with Node.js and Express. This submission focuses on automated testing, identifying and fixing existing bugs, and implementing a task-assignment feature.

## Tech Stack

* Node.js
* Express.js
* Jest
* Supertest

The API currently uses an in-memory data store, so task data resets whenever the application restarts.

---

## Getting Started

### Prerequisites

* Node.js 18+

### Install dependencies

```bash
npm install
```

### Start the API

```bash
npm start
```

The API runs on:

```text
http://localhost:3000
```

---

## Running Tests

Run the complete test suite:

```bash
npm test
```

For a sequential test run:

```bash
npm test -- --runInBand
```

Run tests with coverage:

```bash
npm run coverage
```

### Final Test Results

```text
Test Suites: 2 passed, 2 total
Tests:       35 passed, 35 total
Snapshots:   0 total
Time:        1.335 s
```

### Coverage

| Metric     | Coverage |
| ---------- | -------: |
| Statements |   94.70% |
| Branches   |   86.90% |
| Functions  |   93.10% |
| Lines      |   94.16% |

The assignment target was 80%+ coverage.

---

# Project Structure

```text
task-api/
├── src/
│   ├── app.js
│   ├── routes/
│   │   └── tasks.js
│   ├── services/
│   │   └── taskService.js
│   └── utils/
│       └── validators.js
│
├── tests/
│   ├── taskService.test.js
│   └── tasks.test.js
│── jest.config.js
├── package.json
├── package-lock.json
├── BUG_REPORT.md
├── ASSIGNMENT.md
├── MyReadme.md
├── README.md

```

---

# API Reference

| Method   | Path                     | Description                         |
| -------- | ------------------------ | ----------------------------------- |
| `GET`    | `/tasks`                 | List all tasks                      |
| `GET`    | `/tasks?status=todo`     | Filter tasks by status              |
| `GET`    | `/tasks?page=1&limit=10` | Paginated task list                 |
| `POST`   | `/tasks`                 | Create a task                       |
| `PUT`    | `/tasks/:id`             | Update a task                       |
| `DELETE` | `/tasks/:id`             | Delete a task                       |
| `PATCH`  | `/tasks/:id/complete`    | Mark a task as complete             |
| `GET`    | `/tasks/stats`           | Get status counts and overdue count |
| `PATCH`  | `/tasks/:id/assign`      | Assign a task to a person           |

## Task Shape

```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "status": "todo | in_progress | done",
  "priority": "low | medium | high",
  "dueDate": "ISO string | null",
  "completedAt": "ISO string | null",
  "assignee": "string | null",
  "createdAt": "ISO string"
}
```

---

# Testing Approach

The test suite is divided into two layers.

## Unit Tests

`tests/taskService.test.js`

These tests directly exercise the task service and cover:

* task creation
* default values
* retrieving tasks
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

## Integration Tests

`tests/tasks.test.js`

These tests exercise the HTTP API using Supertest.

They cover:

* creating tasks
* retrieving tasks
* filtering by status
* pagination
* statistics
* updating tasks
* deleting tasks
* completing tasks
* assigning tasks
* validation failures
* nonexistent task IDs

The tests focus on observable behavior rather than implementation details.

---

# Bugs Found and Fixed

Testing identified two functional bugs in the original implementation.

## 1. Completing a Task Changed Its Priority

The original `completeTask()` implementation explicitly set:

```js
priority: 'medium'
```

when completing a task.

This meant that completing a high-priority task silently changed its priority to medium.

### Fix

The unnecessary priority assignment was removed so that completing a task only changes the completion-related fields:

```js
const updated = {
  ...task,
  status: 'done',
  completedAt: new Date().toISOString(),
};
```

A regression test verifies that the original priority is preserved.

---

## 2. Pagination Used an Incorrect Offset

The original pagination implementation used:

```js
const offset = page * limit;
```

For a 1-based page number, this caused the first page to skip the first set of tasks.

For example:

```text
page = 1
limit = 2

offset = 1 × 2
       = 2
```

### Fix

The calculation was changed to:

```js
const offset = (page - 1) * limit;
```

Tests were added for both the first and second pages to prevent regression.

More detailed information about the bugs, reproduction steps, root causes, and fixes is available in [`BUG_REPORT.md`](./BUG_REPORT.md).

---

# New Feature — Assign Task

The requested endpoint was implemented:

```text
PATCH /tasks/:id/assign
```

### Request

```json
{
  "assignee": "Utkarsh"
}
```

### Successful Response

The endpoint returns the updated task:

```json
{
  "id": "uuid",
  "title": "Finish assignment",
  "assignee": "Utkarsh"
}
```

## Design Decisions

### Validation

The endpoint requires `assignee` to be a non-empty string.

An empty or whitespace-only value returns:

```text
400 Bad Request
```

### Whitespace

Leading and trailing whitespace is removed before storing the name.

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

### Missing Task

If the requested task does not exist, the endpoint returns:

```text
404 Not Found
```

### Already Assigned Tasks

The implementation allows an existing assignee to be replaced with another valid name.

This keeps the endpoint simple and allows reassignment without introducing an additional operation.

The feature is covered by both unit and integration tests.

---

# Test Isolation

The application uses an in-memory array for task storage.

To prevent tests from affecting one another, the service state is reset before every test:

```js
beforeEach(() => {
  taskService._reset();
});
```

This ensures that each test starts with a clean task collection.

---

# What Surprised Me

The most significant surprise was that the existing implementation contained behavior that looked reasonable at first glance but was incorrect when tested against expected behavior.

In particular, `completeTask()` explicitly changed a task's priority to `medium`. This was easy to miss without a test that checked preservation of existing task data.

The pagination issue was also exposed by testing multiple pages rather than only checking that pagination returned the expected number of items.

This reinforced the importance of testing behavior and edge cases rather than assuming that existing implementation logic is correct.

---

# What I Would Test Next

With more time, I would add tests for:

1. Invalid pagination values such as negative pages or limits.
2. Requests for pages beyond the available tasks.
3. Additional date-validation cases.
4. Boundary conditions around overdue tasks.
5. Reassigning an already-assigned task.
6. Very long assignee names.
7. Malformed JSON requests.
8. Error-handling middleware.
9. Concurrent updates to the same task.
10. Performance with a larger number of tasks.

---

# Questions Before Production

Before shipping this API to production, I would clarify:

* Should authentication and authorization be required?
* Should tasks belong to individual users?
* Should an already-assigned task be allowed to be reassigned?
* What are the expected pagination rules for invalid page and limit values?
* What database should replace the current in-memory store?
* What validation and maximum lengths should apply to task fields?
* What are the expected logging, monitoring, and rate-limiting requirements?
* What API error format should be standardized across all endpoints?

---

# Production Considerations

The current implementation uses an in-memory data store, which is appropriate for this assignment but would not be suitable for production.

Before production deployment, I would consider:

* persistent database storage
* authentication and authorization
* stronger request/schema validation
* structured logging
* centralized error handling
* rate limiting
* database constraints
* monitoring and alerting
* health checks
* API documentation
* CI-based automated testing
* dependency and security auditing
* concurrency and data-integrity handling

These considerations are outside the scope of the requested implementation.

---

# Submission Summary

This submission includes:

* Unit tests for `taskService.js`
* Integration tests using Supertest
* Happy-path and edge-case coverage
* Two identified and fixed bugs
* Regression tests for the fixes
* `PATCH /tasks/:id/assign` implementation
* Validation and error handling for the new feature
* 35 passing tests
* 94.70% statement coverage

The goal was to understand the existing codebase, identify behavior through testing, make targeted fixes, and add the requested feature without unnecessarily redesigning the application.
