const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

beforeEach(() => {
  taskService._reset();
});


test('creates a task', async () => {
  const response = await request(app)
    .post('/tasks')
    .send({
      title: 'Learn testing',
      priority: 'high'
    });

  expect(response.status).toBe(201);
  expect(response.body.title).toBe('Learn testing');
  expect(response.body.priority).toBe('high');
});


test('rejects a task without a title', async () => {
  const response = await request(app)
    .post('/tasks')
    .send({
      priority: 'high'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe(
    'title is required and must be a non-empty string'
  );
});


test('gets all tasks', async () => {
  await request(app)
    .post('/tasks')
    .send({ title: 'Task 1' });

  await request(app)
    .post('/tasks')
    .send({ title: 'Task 2' });

  const response = await request(app)
    .get('/tasks');

  expect(response.status).toBe(200);
  expect(response.body).toHaveLength(2);
  expect(response.body[0].title).toBe('Task 1');
  expect(response.body[1].title).toBe('Task 2');
});

test('filters tasks by status', async () => {
  await request(app)
    .post('/tasks')
    .send({
      title: 'Todo task',
      status: 'todo'
    });

  await request(app)
    .post('/tasks')
    .send({
      title: 'Done task',
      status: 'done'
    });

  const response = await request(app)
    .get('/tasks?status=todo');

  expect(response.status).toBe(200);
  expect(response.body).toHaveLength(1);
  expect(response.body[0].title).toBe('Todo task');
  expect(response.body[0].status).toBe('todo');
});


test('gets paginated tasks', async () => {
  await request(app)
    .post('/tasks')
    .send({ title: 'Task 1' });

  await request(app)
    .post('/tasks')
    .send({ title: 'Task 2' });

  await request(app)
    .post('/tasks')
    .send({ title: 'Task 3' });

  const response = await request(app)
    .get('/tasks?page=1&limit=2');

  expect(response.status).toBe(200);
  expect(response.body).toHaveLength(2);
  expect(response.body[0].title).toBe('Task 1');
  expect(response.body[1].title).toBe('Task 2');
});


test('gets task statistics', async () => {
  await request(app)
    .post('/tasks')
    .send({
      title: 'Todo task',
      status: 'todo'
    });

  await request(app)
    .post('/tasks')
    .send({
      title: 'In progress task',
      status: 'in_progress'
    });

  await request(app)
    .post('/tasks')
    .send({
      title: 'Done task',
      status: 'done'
    });

  const response = await request(app)
    .get('/tasks/stats');

  expect(response.status).toBe(200);
  expect(response.body.todo).toBe(1);
  expect(response.body.in_progress).toBe(1);
  expect(response.body.done).toBe(1);
  expect(response.body.overdue).toBe(0);
});


test('updates a task', async () => {
  const createResponse = await request(app)
    .post('/tasks')
    .send({
      title: 'Old title',
      priority: 'low'
    });

  const taskId = createResponse.body.id;

  const response = await request(app)
    .put(`/tasks/${taskId}`)
    .send({
      title: 'New title',
      priority: 'high'
    });

  expect(response.status).toBe(200);
  expect(response.body.id).toBe(taskId);
  expect(response.body.title).toBe('New title');
  expect(response.body.priority).toBe('high');
});

test('rejects an update with an empty title', async () => {
  const createResponse = await request(app)
    .post('/tasks')
    .send({
      title: 'Original title'
    });

  const taskId = createResponse.body.id;

  const response = await request(app)
    .put(`/tasks/${taskId}`)
    .send({
      title: ''
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe(
    'title must be a non-empty string'
  );
});

test('returns 404 when updating a task that does not exist', async () => {
  const response = await request(app)
    .put('/tasks/does-not-exist')
    .send({
      title: 'New title'
    });

  expect(response.status).toBe(404);
  expect(response.body.error).toBe('Task not found');
});


test('deletes a task', async () => {
  const createResponse = await request(app)
    .post('/tasks')
    .send({
      title: 'Delete me'
    });

  const taskId = createResponse.body.id;

  const response = await request(app)
    .delete(`/tasks/${taskId}`);

  expect(response.status).toBe(204);
});

test('returns 404 when deleting a task that does not exist', async () => {
  const response = await request(app)
    .delete('/tasks/does-not-exist');

  expect(response.status).toBe(404);
  expect(response.body.error).toBe('Task not found');
});



test('completes a task', async () => {
  const createResponse = await request(app)
    .post('/tasks')
    .send({
      title: 'Complete me'
    });

  const taskId = createResponse.body.id;

  const response = await request(app)
    .patch(`/tasks/${taskId}/complete`);

  expect(response.status).toBe(200);
  expect(response.body.id).toBe(taskId);
  expect(response.body.status).toBe('done');
  expect(response.body.completedAt).toBeDefined();
});

test('returns 404 when completing a task that does not exist', async () => {
  const response = await request(app)
    .patch('/tasks/does-not-exist/complete');

  expect(response.status).toBe(404);
  expect(response.body.error).toBe('Task not found');
});

test('rejects a task with an invalid status', async () => {
  const response = await request(app)
    .post('/tasks')
    .send({
      title: 'Invalid status',
      status: 'waiting'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe(
    'status must be one of: todo, in_progress, done'
  );
});



test('rejects a task with an invalid priority', async () => {
  const response = await request(app)
    .post('/tasks')
    .send({
      title: 'Invalid priority',
      priority: 'urgent'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe(
    'priority must be one of: low, medium, high'
  );
});


test('assigns a task to a person', async () => {
  const createResponse = await request(app)
    .post('/tasks')
    .send({
      title: 'Finish assignment'
    });

  const taskId = createResponse.body.id;

  const response = await request(app)
    .patch(`/tasks/${taskId}/assign`)
    .send({
      assignee: 'Utkarsh'
    });

  expect(response.status).toBe(200);
  expect(response.body.id).toBe(taskId);
  expect(response.body.assignee).toBe('Utkarsh');
});


test('returns 404 when assigning a task that does not exist', async () => {
  const response = await request(app)
    .patch('/tasks/does-not-exist/assign')
    .send({
      assignee: 'Utkarsh'
    });

  expect(response.status).toBe(404);
  expect(response.body.error).toBe('Task not found');
});

test('rejects an empty assignee', async () => {
  const createResponse = await request(app)
    .post('/tasks')
    .send({
      title: 'Finish assignment'
    });

  const taskId = createResponse.body.id;

  const response = await request(app)
    .patch(`/tasks/${taskId}/assign`)
    .send({
      assignee: ''
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe(
    'assignee is required and must be a non-empty string'
  );
});