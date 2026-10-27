const STORAGE_KEY = "studyBloomTasks";

const form = document.querySelector("#task-form");
const titleInput = document.querySelector("#task-title");
const subjectInput = document.querySelector("#task-subject");
const dueInput = document.querySelector("#task-due");
const priorityInput = document.querySelector("#task-priority");
const filterInput = document.querySelector("#task-filter");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const formMessage = document.querySelector("#form-message");

function getTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Could not read tasks:", error);
    return [];
  }
}

function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.error("Could not save tasks:", error);
    formMessage.textContent = "Could not save tasks. Check your browser storage settings.";
    return false;
  }
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function updateSummary(tasks) {
  const done = tasks.filter((task) => task.completed).length;
  document.querySelector("#total-count").textContent = tasks.length;
  document.querySelector("#todo-count").textContent = tasks.length - done;
  document.querySelector("#done-count").textContent = done;
}

function formatDueDate(dateString) {
  if (!dateString) return "No due date";
  const date = new Date(`${dateString}T00:00:00`);
  return `Due ${date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}

function renderTasks() {
  const tasks = getTasks().sort((a, b) => {
    if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return b.createdAt - a.createdAt;
  });

  updateSummary(tasks);
  const filter = filterInput.value;
  const visibleTasks = tasks.filter((task) => {
    if (filter === "todo") return !task.completed;
    if (filter === "done") return task.completed;
    return true;
  });

  taskList.replaceChildren();
  emptyState.hidden = visibleTasks.length > 0;
  emptyState.textContent = tasks.length === 0
    ? "Nothing on your list yet. Add one task and start small. 🌱"
    : "No tasks match this filter.";

  visibleTasks.forEach((task) => {
    const card = createElement("article", "task-card");
    const checkbox = createElement("input", "task-check");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Mark ${task.title} as ${task.completed ? "not completed" : "completed"}`);
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const content = createElement("div", "task-content");
    const title = createElement("p", `task-name${task.completed ? " completed" : ""}`, task.title);
    const meta = createElement("div", "task-meta");
    meta.append(createElement("span", "pill", task.subject));

    const priorityClass = task.priority === "High" ? "pill high" : task.priority === "Low" ? "pill low" : "pill";
    meta.append(createElement("span", priorityClass, `${task.priority} priority`));

    const due = createElement("span", "pill", formatDueDate(task.dueDate));
    if (task.dueDate && !task.completed && task.dueDate < new Date().toLocaleDateString("en-CA")) {
      due.className = "pill overdue";
      due.textContent += " · overdue";
    }
    meta.append(due);

    content.append(title, meta);
    const deleteButton = createElement("button", "delete-button", "Delete");
    deleteButton.type = "button";
    deleteButton.setAttribute("aria-label", `Delete task: ${task.title}`);
    deleteButton.addEventListener("click", () => deleteTask(task.id));

    card.append(checkbox, content, deleteButton);
    taskList.append(card);
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = titleInput.value.trim();
  if (!title) {
    formMessage.textContent = "Please enter a task name.";
    return;
  }

  const tasks = getTasks();
  tasks.push({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    subject: subjectInput.value,
    dueDate: dueInput.value,
    priority: priorityInput.value,
    completed: false,
    createdAt: Date.now()
  });

  if (saveTasks(tasks)) {
    form.reset();
    subjectInput.value = "General";
    priorityInput.value = "Normal";
    formMessage.textContent = "Task added to your plan. One step at a time! ✿";
    renderTasks();
  }
});

function toggleTask(id) {
  const tasks = getTasks().map((task) => task.id === id ? { ...task, completed: !task.completed } : task);
  if (saveTasks(tasks)) renderTasks();
}

function deleteTask(id) {
  const tasks = getTasks().filter((task) => task.id !== id);
  if (saveTasks(tasks)) {
    formMessage.textContent = "Task removed.";
    renderTasks();
  }
}

filterInput.addEventListener("change", renderTasks);
renderTasks();
