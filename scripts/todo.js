import { getWeekMonday, setLocalData, isToday } from "./utils.js";

// TODO: навесить события keydown на навигацию недель и кнопку удаления задачи

const Status = Object.freeze({
    Planned: 0,
    Done: 1,
    Moved: 2,
    Cancelled: 3,
});
const StatusNames = Object.freeze({
    [Status.Planned]: "Запланировано",
    [Status.Done]: "Выполнено",
    [Status.Moved]: "Отложено",
    [Status.Cancelled]: "Отменено",
});
const StatusClasses = Object.freeze({
    [Status.Planned]: "todo__day--planned",
    [Status.Done]: "todo__day--done",
    [Status.Moved]: "todo__day--moved",
    [Status.Cancelled]: "todo__day--cancelled",
});

// ----------------------------------------------------------
// DOM
const datesRangeDiv = document.getElementById("dates-range");
const headerRow = document.querySelector(".todo__row--header");
const weekBody = document.querySelector(".todo__week-body");
const weekPrevButton = document.getElementById("week-prev-btn");
const weekNextButton = document.getElementById("week-next-btn");
const newTaskButton = document.getElementById("new-task-btn");
const taskFormTitle = document.getElementById("task-title");
const taskFormNameInput = document.getElementById("task-name");
const taskFormTextInput = document.getElementById("task-descr");
const taskFormDaysDiv = document.getElementById("task-days");

newTaskButton.addEventListener("click", (e) => {
    taskToUpdate = null;
    openTask(e);
});

const onChangeWeekPrev = (e) => {
    // if (weekOffset < 0) return;
    weekOffset--;
    setWeek();
    loadTasks();
};
const onChangeWeekNext = (e) => {
    weekOffset++;
    setWeek();
    loadTasks();
};
weekPrevButton.addEventListener("click", onChangeWeekPrev);
weekPrevButton.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        onChangeWeekPrev(e);
    }
});
weekNextButton.addEventListener("click", onChangeWeekNext);
weekNextButton.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        onChangeWeekNext(e);
    }
});

const clearTasksRows = () => {
    weekBody.innerHTML = "";
};

const createTaskRow = (task) => {
    const row = document.createElement("div");
    row.id = task.id;
    row.className = "todo__row todo__row--days";

    for (let i = 1; i <= 7; i++) {
        const cell = document.createElement("div");
        const day = task.days.find((d) => d.day === (i === 7 ? 0 : i));
        cell.className = `todo__day ${day ? StatusClasses[day.status] : ""} ${
            isToday(week.at(i - 1)) ? "todo__day--today" : ""
        }`.trim();
        cell.dataset.taskId = task.id;
        cell.dataset.day = i === 7 ? 0 : i;
        cell.role = "button";
        cell.tabIndex = 0;
        cell.title = day ? StatusNames[day.status] : "";

        const clickDay = (e) => {
            const task = tasks.find(
                (el) => el.id.toString() === e.target.dataset.taskId
            );
            const day = task.days.find(
                (d) => d.day === parseInt(e.target.dataset.day)
            );
            const idx = task.days.findIndex(
                (d) => d.day === parseInt(e.target.dataset.day)
            );

            if (!day) {
                task &&
                    task.days.push({
                        day: parseInt(cell.dataset.day),
                        status: Status.Planned,
                        date: getDayDate(parseInt(cell.dataset.day)),
                    });
                cell.classList.add(StatusClasses[Status.Planned]);
                cell.title = StatusNames[Status.Planned];
            } else {
                switch (day?.status) {
                    case Status.Planned:
                        day.status = Status.Done;
                        cell.classList.replace(
                            StatusClasses[Status.Planned],
                            StatusClasses[Status.Done]
                        );
                        cell.title = StatusNames[Status.Done];
                        break;
                    case Status.Done:
                        day.status = Status.Moved;
                        cell.classList.replace(
                            StatusClasses[Status.Done],
                            StatusClasses[Status.Moved]
                        );
                        cell.title = StatusNames[Status.Moved];
                        break;
                    case Status.Moved:
                        day.status = Status.Cancelled;
                        cell.classList.replace(
                            StatusClasses[Status.Moved],
                            StatusClasses[Status.Cancelled]
                        );
                        cell.title = StatusNames[Status.Cancelled];
                        break;
                    case Status.Cancelled:
                        task.days.splice(idx, 1);
                        cell.classList.remove(StatusClasses[Status.Cancelled]);
                        cell.title = "";
                        break;
                }
            }

            setLocalData("todoTasks", tasksTotal);
        };
        cell.addEventListener("click", clickDay);
        cell.addEventListener("keydown", (e) => {
            if (e.code === "Space" || e.code === "Enter") {
                e.preventDefault();
                clickDay(e);
            }
        });

        row.appendChild(cell);
    }

    const taskText = document.createElement("div");
    taskText.dataset.taskId = task.id;
    taskText.className = "todo__task-text";
    taskText.textContent = task.name;
    taskText.title = task.text || task.name;

    taskText.addEventListener("click", (e) => {
        const idx = tasks.findIndex(
            (t) => t.id.toString() === e.target.dataset.taskId
        );
        if (idx < 0) return;

        taskToUpdate = tasks[idx];
        openTask(e);
    });

    const deleteDiv = document.createElement("div");
    deleteDiv.className = "todo__task-delete";
    deleteDiv.textContent = "❌";
    deleteDiv.title = "Удалить задачу";
    deleteDiv.role = "button";
    deleteDiv.tabIndex = 0;
    deleteDiv.dataset.taskId = task.id;
    const onDeleteTask = (e) => {
        const idx = tasks.findIndex(
            (t) => t.id.toString() === e.target.dataset.taskId
        );
        if (idx < 0) return;

        taskToDelete = tasks[idx];
        deleteTask_Dlg.showModal();
    };
    deleteDiv.addEventListener("click", onDeleteTask);
    deleteDiv.addEventListener("keydown", (e) => {
        if (e.code === "Space" || e.code === "Enter") {
            e.preventDefault();
            onDeleteTask(e);
        }
    });

    const taskDiv = document.createElement("div");
    taskDiv.className = "todo__task";
    taskDiv.appendChild(taskText);
    taskDiv.appendChild(deleteDiv);
    row.appendChild(taskDiv);

    weekBody.appendChild(row);
};

const openTask = (e) => {
    e.preventDefault();
    if (taskToUpdate) {
        taskToUpdate.name && (taskFormNameInput.value = taskToUpdate.name);
        taskToUpdate.text && (taskFormTextInput.value = taskToUpdate.text);
        taskFormDaysDiv.style.display = "none";
        taskFormTitle.textContent = "Изменить задачу";
    } else {
        taskFormDaysDiv.style.display = "block";
        taskFormTitle.textContent = "Новая задача";
    }
    taskDlg.showModal();
};

const updateDatesRangeDiv = () => {
    // обновить диапазон дат
    datesRangeDiv.textContent = `${week[0]
        .getDate()
        .toString()
        .padStart(2, "0")}.${(week[0].getMonth() + 1)
        .toString()
        .padStart(2, "0")} - ${week
        .at(-1)
        .getDate()
        .toString()
        .padStart(2, "0")}.${(week.at(-1).getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
};

const updateDaysHeaders = () => {
    // обновить шапку
    for (const child of headerRow.querySelectorAll('[id$="d"]')) {
        child.textContent =
            week[parseInt(child.id)].getDate().toString().padStart(2, "0") +
            "." +
            (week[parseInt(child.id)].getMonth() + 1)
                .toString()
                .padStart(2, "0");
    }
};

const setWeekDisabled = (disabled) => {
    const value = disabled ?? true;
    newTaskButton.disabled = value;
    // value ? weekPrevButton.setAttribute("disabled", true) : weekPrevButton.removeAttribute("disabled");
};

// ----------------------------------------------------------
// управление диалогом создания/изменения задачи
const taskDlg = document.getElementById("task-dlg"); // диалог с формой создания задачи
taskDlg.addEventListener(
    "click",
    (e) => e.target === taskDlg && closeTask_Dlg.showModal()
); // клик вне диалога формы
taskDlg.addEventListener("cancel", (e) => {
    e.preventDefault(); // предотвратить закрытие формы при попытке отмены
    closeTask_Dlg.showModal();
});

const taskForm = document.getElementById("task-form"); // форма создания задачи
taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const days = Array.from(
        document.querySelectorAll('input[name="days"]:checked')
    ).map((input) => input.value);

    if (!taskToUpdate) {
        // создание новой задачи
        const task = {
            id: Date.now(),
            name: taskFormNameInput.value?.trim(),
            text: taskFormTextInput.value?.trim(),
            days: days.map((d) => ({
                day: parseInt(d),
                date: getDayDate(parseInt(d))?.toISOString() || null,
                status: Status.Planned,
            })),
        };

        tasks.push(task);
        tasksTotal.push(task); // при редактировании объект уже есть, при создании еще нет, поэтому добавляем в тотал лист
        createTaskRow(task);
    } else {
        // апдейт имеющейся задачи
        taskToUpdate.name = taskFormNameInput.value?.trim();
        taskToUpdate.text = taskFormTextInput.value?.trim();
        const row = document.getElementById(taskToUpdate.id);

        if (row) {
            const textDiv = row.querySelector(".todo__task-text");
            textDiv.textContent = taskToUpdate.name;
            textDiv.title = taskToUpdate.text || taskToUpdate.name;
        }
    }

    setLocalData("todoTasks", tasksTotal);

    taskForm.reset();
    taskDlg.close();
    taskToUpdate = null;
});

const taskForm_Cancel = document.getElementById("task-cancel"); // кнопка отмены
taskForm_Cancel.addEventListener("click", () => closeTask_Dlg.showModal());

const closeTask_Dlg = document.getElementById("close-dlg"); // диалог подтверждения закрытия формы
closeTask_Dlg.addEventListener(
    "click",
    (e) => e.target === closeTask_Dlg && closeTask_Dlg.close()
); // клик вне диалога подтверждения
closeTask_Dlg.addEventListener("cancel", (e) => taskDlg.showModal()); // на случай бага с исчезновением диалога формы

const closeTask_Confirm = document.getElementById("close-confirm"); // кнопка согласия
closeTask_Confirm.addEventListener("click", () => {
    taskForm.reset();
    taskDlg.close();
    closeTask_Dlg.close();
});

const closeTask_Cancel = document.getElementById("close-cancel"); // кнопка отмены
closeTask_Cancel.addEventListener("click", () => closeTask_Dlg.close());

// ----------------------------------------------------------
// управление диалогом удаления задачи
const deleteTask_Dlg = document.getElementById("delete-dlg");
deleteTask_Dlg.addEventListener("click", (e) => {
    if (e.target === deleteTask_Dlg) deleteTask_Dlg.close();
});

const deleteTask_Confirm = document.getElementById("delete-confirm");
deleteTask_Confirm.addEventListener("click", () => {
    if (taskToDelete) {
        const row = document.getElementById(taskToDelete.id);
        if (row) row.remove();
        tasks.splice(
            tasks.findIndex((el) => el.id === taskToDelete.id),
            1
        );
        tasksTotal.splice(
            tasks.findIndex((el) => el.id === taskToDelete.id),
            1
        );
        setLocalData("todoTasks", tasksTotal);
        taskToDelete = null;
    }
    deleteTask_Dlg.close();
});

const deleteTask_Cancel = document.getElementById("delete-cancel");
deleteTask_Cancel.addEventListener("click", () => {
    deleteTask_Dlg.close();
});

// ----------------------------------------------------------
function setWeek() {
    // инициировать понедельник недели с учетом смещения
    const start = getWeekMonday(weekOffset || 0);
    if (start.getTime !== week?.at(0)?.getTime()) {
        week = [];
        for (let i = 0; i < 7; i++)
            week.push(new Date(start.getTime() + 24 * 60 * 60 * 1000 * i)); // + i дней
    }

    weekOffset < 0 ? setWeekDisabled() : setWeekDisabled(false);

    updateDatesRangeDiv();
    updateDaysHeaders();
}
function loadTasks() {
    // достать полный список задач из хранилища и восстановить объекты Date
    tasksTotal = localStorage.getItem("todoTasks")
        ? JSON.parse(localStorage.getItem("todoTasks"))
        : [];
    tasksTotal.forEach(
        (task) =>
            (task.days = task.days.map((d) => ({
                ...d,
                date: d.date ? new Date(d.date) : null,
            })))
    );

    // отфильтровать задачи на текущую неделю и отрисовать строки
    tasks = getWeekTasks();

    clearTasksRows();
    tasks.forEach((task) => createTaskRow(task));

    // очистить промежуточные переменные после обновления
    taskToDelete = null;
    taskToUpdate = null;
}
function getDayDate(day) {
    // получить дату из текущей недели по номеру дня (от 1 до 7)
    const date = week.find((d) => d.getDay() === day);
    return date || null;
}
function getWeekTasks() {
    const weekSet = new Set(week.map((d) => d.getTime()));
    return tasksTotal.filter((el) =>
        el.days.some((day) => weekSet.has(day.date?.getTime()))
    );
}

// данные
let weekOffset = 0;
let week = [];
let tasks = [];
let tasksTotal = [];
let taskToDelete = null;
let taskToUpdate = null;

// инициализация
setWeek();
loadTasks();
