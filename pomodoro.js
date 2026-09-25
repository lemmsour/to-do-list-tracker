const pomodoro = document.querySelector('#pomodoro-timer');
const pomodoPopup = document.querySelector('#pomodoro-time-win');
const pomodoStart = document.querySelector('#start-timer');
const pauseTimerBtn = document.querySelector('#pause-timer');
const closePopup = document.querySelector('#close');
const timeElem = document.querySelector('#time');

const FOCUS_DURATION = 60 * 60 * 1000; 

let intervalId = null;

const PAUSE_ICON_HTML = '<img src="./assets/pause.svg" height="10px" width="10px">';

document.addEventListener("DOMContentLoaded", () => {
    checkTimerState();
});

pomodoro.addEventListener('click', () => {
    pomodoPopup.showModal();
    checkTimerState();
});

closePopup.addEventListener('click', () => {
    pomodoPopup.close();
});

pomodoStart.addEventListener('click', () => {
    chrome.storage.local.get(["timerState"], (res) => {
        const state = res.timerState || "stopped";
        
        if (state === "stopped") {
            startTimer(FOCUS_DURATION, "focus"); 
        } else {
            stopTimer(); 
        }
    });
});

pauseTimerBtn.addEventListener('click', () => {
    chrome.storage.local.get(["timerState", "endTime", "remainingTime", "timerMode"], (res) => {
        const state = res.timerState || "stopped";
        const mode = res.timerMode || "focus";

        if (state === "running") {
            pauseTimer(res.endTime);
        } else if (state === "paused") {
            resumeTimer(res.remainingTime, mode);
        }
    });
});

function startTimer(duration, mode) {
    const endTime = Date.now() + duration;
    const alarmName = mode === "focus" ? "pomodoroAlarm" : "breakAlarm";
    
    chrome.storage.local.set({ timerState: "running", timerMode: mode, endTime: endTime, remainingTime: duration }, () => {
        const delayInMinutes = duration / 60000;
        chrome.alarms.create(alarmName, { delayInMinutes: delayInMinutes });
        
        pomodoStart.textContent = "Stop Timer";
        pauseTimerBtn.innerHTML = PAUSE_ICON_HTML;
        runVisualCountdown(endTime);
    });
}

function pauseTimer(endTime) {
    const remainingTime = endTime - Date.now();
    
    chrome.alarms.clear("pomodoroAlarm");
    chrome.alarms.clear("breakAlarm");
    clearInterval(intervalId);

    chrome.storage.local.set({ timerState: "paused", endTime: null, remainingTime: remainingTime }, () => {
        pauseTimerBtn.innerHTML = PAUSE_ICON_HTML; 
    });
}

function resumeTimer(remainingTime, mode) {
    startTimer(remainingTime, mode);
}

function stopTimer() {
    chrome.alarms.clear("pomodoroAlarm");
    chrome.alarms.clear("breakAlarm");
    
    chrome.storage.local.set({ timerState: "stopped", timerMode: "focus", endTime: null, remainingTime: null }, () => {
        clearInterval(intervalId);
        pomodoStart.textContent = "Start Timer";
        pauseTimerBtn.innerHTML = PAUSE_ICON_HTML;
        timeElem.textContent = "00:00";
    });
}

function runVisualCountdown(endTime) {
    clearInterval(intervalId); 

    intervalId = setInterval(() => {
        const remainingTime = endTime - Date.now();

        if (remainingTime <= 0) {
            clearInterval(intervalId);
            setTimeout(() => checkTimerState(), 1100); 
            return;
        }

        displayTime(remainingTime);
    }, 1000);
}

function displayTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    timeElem.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function checkTimerState() {
    chrome.storage.local.get(["timerState", "endTime", "remainingTime", "timerMode"], (res) => {
        const state = res.timerState || "stopped";
        const endTime = res.endTime || null;
        const remainingTime = res.remainingTime || null;

        if (state === "running" && endTime && endTime > Date.now()) {
            pomodoStart.textContent = "Stop Timer";
            pauseTimerBtn.innerHTML = PAUSE_ICON_HTML;
            runVisualCountdown(endTime);
        } else if (state === "paused" && remainingTime) {
            pomodoStart.textContent = "Stop Timer";
            pauseTimerBtn.innerHTML = PAUSE_ICON_HTML;
            displayTime(remainingTime);
            clearInterval(intervalId);
        } else {
            stopTimer();
        }
    });
}