const addTaskBtn = document.querySelector('#task-adder');
const dialogPopup = document.querySelector('#dialog-box');
const enter = document.querySelector('#enter-button');
const output = document.querySelector('#output');
const clear = document.querySelector('#clear-button');
const yesClear = document.querySelector('#sure-yes');
const noClear = document.querySelector('#sure-no');
const clearPopup = document.querySelector('#are-you-sure');
const breatheBtn = document.querySelector('#breathe-button');
const meditatePopup = document.querySelector('#mediate');
const meditateAnim = document.querySelector('#medita-btn');
const endMeditate = document.querySelector('#end-meditate');
const sortDeadlineBtn = document.querySelector('#sort-deadline-btn');
const sortArrow = document.querySelector('#sort-arrow');
const editDialog = document.querySelector('#edit-dialog-box');
const saveEditBtn = document.querySelector('#save-edit-button');

let currentEditId = null;
let stopMedit = false;
let sortState = 0;
let activeCategoryFilter = null;

const RED_SHADES = [
    "#e63946",
    "#d62828",
    "#c1121f",
    "#b71c1c",
    "#a4161a",
    "#e5383b",
    "#ba181b",
    "#dd2f45",
    "#9e2a2b",
    "#800f2f"
];

let categoryColorMap = {};

meditateAnim.addEventListener('click', () => {
    stopMedit = !stopMedit;
    if(stopMedit) {
        meditateAnim.style.animationPlayState = 'paused';
    } else{
        meditateAnim.style.animationPlayState = 'running';
    }
});

endMeditate.addEventListener('click', () => {
    meditatePopup.close();
});

breatheBtn.addEventListener('click', () => {
    meditatePopup.showModal();
});

clear.addEventListener('click', () => {
    clearPopup.showModal();
});

yesClear.addEventListener('click', () => {
    chrome.storage.local.set({ tasks: [] }, () => {
        loadTasks();
    });
    clearPopup.close();
});

noClear.addEventListener('click', () => {
    clearPopup.close();
});

addTaskBtn.addEventListener('click', () => {
    dialogPopup.showModal();
});

enter.addEventListener('click', () => {
    const taskInputElem = document.querySelector('.task-input');
    const categoryInputElem = document.querySelector('#task-category-input');
    const deadlineInputElem = document.querySelector('#task-deadline-input');

    const taskText = taskInputElem.textContent.trim();
    const category = categoryInputElem.value.trim() || "General";
    const deadline = deadlineInputElem.value;

    if (taskText.length > 0) {
        addNewTask(taskText, category, deadline);
    }

    dialogPopup.close();
    taskInputElem.textContent = "";
    categoryInputElem.value = "";
    deadlineInputElem.value = "";
});

saveEditBtn.addEventListener('click', () => {
    const editTaskElem = document.querySelector('.edit-task-input');
    const editCatElem = document.querySelector('#edit-category-input');
    const editDeadElem = document.querySelector('#edit-deadline-input');

    const newText = editTaskElem.textContent.trim();
    const newCategory = editCatElem.value.trim() || "General";
    const newDeadline = editDeadElem.value;

    if (newText.length > 0 && currentEditId) {
        chrome.storage.local.get(["tasks"], (result) => {
            const tasks = result.tasks || [];
            const updated = tasks.map(t => 
                t.id === currentEditId ? { ...t, text: newText, category: newCategory, deadline: newDeadline } : t
            );
            chrome.storage.local.set({ tasks: updated }, () => {
                loadTasks();
            });
        });
    }

    editDialog.close();
    currentEditId = null;
});

sortDeadlineBtn.addEventListener('click', () => {
    sortState = (sortState + 1) % 3;
    if (sortState === 1) {
        sortArrow.textContent = '↓';
    } else if (sortState === 2) {
        sortArrow.textContent = '↑';
    } else {
        sortArrow.textContent = '↕';
    }
    loadTasks();
});

function getCategoryColor(category) {
    if (!categoryColorMap[category]) {
        const usedCount = Object.keys(categoryColorMap).length;
        categoryColorMap[category] = RED_SHADES[usedCount % RED_SHADES.length];
    }
    return categoryColorMap[category];
}

function createRedConfetti(anchorElement) {
    const rect = anchorElement.getBoundingClientRect();
    const root = document.querySelector('#main');
    const rootRect = root.getBoundingClientRect();
    const originX = rect.left - rootRect.left + rect.width / 2;
    const originY = rect.top - rootRect.top + rect.height / 2;

    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.classList.add('confetti-particle');
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 25;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;

        particle.style.left = `${originX}px`;
        particle.style.top = `${originY}px`;
        particle.style.setProperty('--dx', `${dx}px`);
        particle.style.setProperty('--dy', `${dy}px`);

        root.appendChild(particle);

        setTimeout(() => {
            particle.remove();
        }, 800);
    }
}

function createTaskElement(task) {
    const wrapperDiv = document.createElement("div");
    wrapperDiv.classList.add("task-item");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.checked;
    checkbox.classList.add("tasks");

    const catTag = document.createElement("span");
    catTag.classList.add("task-category-tag");
    catTag.textContent = task.category;
    catTag.style.backgroundColor = getCategoryColor(task.category);

    if (activeCategoryFilter === task.category) {
        catTag.classList.add("active-filter");
    }

    catTag.addEventListener("click", () => {
        if (activeCategoryFilter === task.category) {
            activeCategoryFilter = null;
        } else {
            activeCategoryFilter = task.category;
        }
        loadTasks();
    });

    const text = document.createElement("span");
    text.textContent = task.text;
    text.classList.add("task-text");
    if (task.checked) { 
        text.classList.add("completed");
    }

    const deadlineText = document.createElement("span");
    deadlineText.classList.add("task-deadline-text");
    deadlineText.textContent = task.deadline ? task.deadline : "";

    const editBtn = document.createElement("button");
    editBtn.classList.add("action-btn", "edit-task-btn");
    editBtn.style.opacity = "0";
    const pencilImg = document.createElement("img");
    pencilImg.src = "./assets/pencil.svg";
    pencilImg.width = 11;
    pencilImg.height = 11;
    editBtn.appendChild(pencilImg);

    editBtn.addEventListener("click", () => {
        currentEditId = task.id;
        document.querySelector('.edit-task-input').textContent = task.text;
        document.querySelector('#edit-category-input').value = task.category || "";
        document.querySelector('#edit-deadline-input').value = task.deadline || "";
        editDialog.showModal();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("action-btn", "delete-task-btn");
    deleteBtn.style.opacity = "0";
    const trashImg = document.createElement("img");
    trashImg.src = "./assets/trash.svg";
    trashImg.width = 14;
    trashImg.height = 14;
    deleteBtn.appendChild(trashImg);

    deleteBtn.addEventListener("click", () => {
        deleteTask(task.id);
    });

    wrapperDiv.addEventListener("mouseenter", () => {
        editBtn.style.opacity = "1";
        deleteBtn.style.opacity = "1";
    });

    wrapperDiv.addEventListener("mouseleave", () => {
        editBtn.style.opacity = "0";
        deleteBtn.style.opacity = "0";
    });

    checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
            createRedConfetti(checkbox);
        }
        text.classList.toggle("completed", checkbox.checked);
        updateTaskStatus(task.id, checkbox.checked);
        setTimeout(() => {
            loadTasks();
        }, 300);
    });

    wrapperDiv.append(checkbox, catTag, text, deadlineText, editBtn, deleteBtn);
    output.append(wrapperDiv);
}

function addNewTask(taskText, category, deadline) {
    chrome.storage.local.get(["tasks"], (result) => {
        const tasks = result.tasks || [];
        const newTask = {
            id: Date.now().toString(),
            text: taskText,
            category: category,
            deadline: deadline,
            checked: false
        };
        tasks.push(newTask);
        chrome.storage.local.set({ tasks }, () => {
            loadTasks();
        });
    });
}

function deleteTask(id) {
    chrome.storage.local.get(["tasks"], (result) => {
        const tasks = result.tasks || [];
        const filtered = tasks.filter(t => t.id !== id);
        chrome.storage.local.set({ tasks: filtered }, () => {
            loadTasks();
        });
    });
}

function updateTaskStatus(id, isChecked) {
    chrome.storage.local.get(["tasks"], (result) => {
        const tasks = result.tasks || [];
        const updated = tasks.map(t =>
            t.id === id ? { ...t, checked: isChecked } : t
        );
        chrome.storage.local.set({ tasks: updated });
    });
}

function loadTasks() {
    output.innerHTML = "";

    chrome.storage.local.get(["tasks"], (result) => {
        let tasks = result.tasks || [];

        if (activeCategoryFilter) {
            tasks = tasks.filter(t => (t.category || "General") === activeCategoryFilter);
        }

        if (sortState === 1) {
            tasks.sort((a, b) => {
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return new Date(a.deadline) - new Date(b.deadline);
            });
        } else if (sortState === 2) {
            tasks.sort((a, b) => {
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return new Date(b.deadline) - new Date(a.deadline);
            });
        }

        tasks.sort((a, b) => (a.checked === b.checked ? 0 : a.checked ? 1 : -1));

        tasks.forEach(task => {
            createTaskElement(task);
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    loadTasks();
});