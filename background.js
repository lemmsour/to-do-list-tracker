chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "pomodoroAlarm") {
    const breakDuration = 10 * 60 * 1000;
    const endTime = Date.now() + breakDuration;

    chrome.storage.local.set({ 
      timerState: "running", 
      timerMode: "break",
      endTime: endTime,
      remainingTime: breakDuration 
    });

    chrome.alarms.create("breakAlarm", { delayInMinutes: 10 });

    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "Focus Session Complete",
      message: "Focus time done. 10 minute break.",
      priority: 2
    });
  } 
  
  else if (alarm.name === "breakAlarm") {
    chrome.storage.local.set({ 
      timerState: "stopped", 
      timerMode: "focus", 
      endTime: null, 
      remainingTime: null 
    });

    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "Break Over",
      message: "Start new session",
      priority: 2
    });
  }
});