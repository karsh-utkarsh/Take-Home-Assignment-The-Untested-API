const taskService = require('../src/services/taskService');

beforeEach(() => {
  taskService._reset();
});

test('creates a task with default values', () => {
  const task = taskService.create({
    title: 'Learn testing'
  });

  expect(task.title).toBe('Learn testing');
  expect(task.description).toBe('');
  expect(task.status).toBe('todo');
  expect(task.priority).toBe('medium');
  expect(task.dueDate).toBe(null);
  expect(task.completedAt).toBe(null);
  expect(task.id).toBeDefined();
  expect(task.createdAt).toBeDefined();
});



test('gets all tasks', () => {
  taskService.create({ title: 'Task 1' });
  taskService.create({ title: 'Task 2' });

  const tasks = taskService.getAll();

  expect(tasks).toHaveLength(2);
  expect(tasks[0].title).toBe('Task 1');
  expect(tasks[1].title).toBe('Task 2');
});


test('finds a task by id', () => {
  const createdTask = taskService.create({
    title: 'Find me'
  });

  const task = taskService.findById(createdTask.id);

  expect(task).toEqual(createdTask);
});

test('returns undefined when task id does not exist', () => {
  const task = taskService.findById('does-not-exist');

  expect(task).toBeUndefined();
});


test('gets tasks by status', () => {
  taskService.create({
    title: 'Task 1',
    status: 'todo'
  });

  taskService.create({
    title: 'Task 2',
    status: 'done'
  });

  taskService.create({
    title: 'Task 3',
    status: 'todo'
  });

  const tasks = taskService.getByStatus('todo');

  expect(tasks).toHaveLength(2);
  expect(tasks[0].title).toBe('Task 1');
  expect(tasks[1].title).toBe('Task 3');
});



test('gets paginated tasks', () => {
  taskService.create({ title: 'Task 1' });
  taskService.create({ title: 'Task 2' });
  taskService.create({ title: 'Task 3' });

  const tasks = taskService.getPaginated(1, 2);

  expect(tasks).toHaveLength(2);
  expect(tasks[0].title).toBe('Task 1');
  expect(tasks[1].title).toBe('Task 2');
});


test('gets the second page of tasks', () => {
  taskService.create({ title: 'Task 1' });
  taskService.create({ title: 'Task 2' });
  taskService.create({ title: 'Task 3' });
  taskService.create({ title: 'Task 4' });

  const tasks = taskService.getPaginated(2, 2);

  expect(tasks).toHaveLength(2);
  expect(tasks[0].title).toBe('Task 3');
  expect(tasks[1].title).toBe('Task 4');
});


test('gets task statistics by status', () => {
  taskService.create({ title: 'Task 1', status: 'todo' });
  taskService.create({ title: 'Task 2', status: 'todo' });
  taskService.create({ title: 'Task 3', status: 'in_progress' });
  taskService.create({ title: 'Task 4', status: 'done' });

  const stats = taskService.getStats();

  expect(stats.todo).toBe(2);
  expect(stats.in_progress).toBe(1);
  expect(stats.done).toBe(1);
});



test('counts overdue tasks', () => {
  taskService.create({
    title: 'Overdue task',
    dueDate: '2020-01-01T00:00:00.000Z'
  });

  taskService.create({
    title: 'Completed overdue task',
    status: 'done',
    dueDate: '2020-01-01T00:00:00.000Z'
  });

  taskService.create({
    title: 'Future task',
    dueDate: '2099-01-01T00:00:00.000Z'
  });

  const stats = taskService.getStats();

  expect(stats.overdue).toBe(1);
});


test('updates a task', () => {
  const task = taskService.create({
    title: 'Old title',
    priority: 'low'
  });

  const updated = taskService.update(task.id, {
    title: 'New title',
    priority: 'high'
  });

  expect(updated.title).toBe('New title');
  expect(updated.priority).toBe('high');
  expect(updated.id).toBe(task.id);
});

test('returns null when updating a task that does not exist', () => {
  const result = taskService.update('does-not-exist', {
    title: 'New title'
  });

  expect(result).toBeNull();
});



test('removes an existing task', () => {
  const task = taskService.create({
    title: 'Delete me'
  });

  const result = taskService.remove(task.id);

  expect(result).toBe(true);
  expect(taskService.findById(task.id)).toBeUndefined();
});

test('returns false when removing a task that does not exist', () => {
  const result = taskService.remove('does-not-exist');

  expect(result).toBe(false);
});



test('completes a task', () => {
  const task = taskService.create({
    title: 'Complete me',
    priority: 'high'
  });

  const completed = taskService.completeTask(task.id);

  expect(completed.status).toBe('done');
  expect(completed.completedAt).toBeDefined();
  expect(completed.priority).toBe('high');
});

test('returns null when completing a task that does not exist', () => {
  const result = taskService.completeTask('does-not-exist');

  expect(result).toBeNull();
});


test('assigns a task to a person', () => {
  const task = taskService.create({
    title: 'Finish assignment'
  });

  const updated = taskService.assignTask(
    task.id,
    'Utkarsh'
  );

  expect(updated.id).toBe(task.id);
  expect(updated.assignee).toBe('Utkarsh');
});


test('returns null when assigning a task that does not exist', () => {
  const result = taskService.assignTask(
    'does-not-exist',
    'Utkarsh'
  );

  expect(result).toBeNull();
});