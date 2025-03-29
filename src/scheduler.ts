import { weatherNotifier } from './index.js';

function scheduleWeatherReport(): void {
  const now = new Date();
  const iranTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tehran' }));

  // Set target time to 6 AM Iran time
  const targetTime = new Date(iranTime);
  targetTime.setHours(6, 0, 0, 0);

  // If current time is past 6 AM, schedule for next day
  if (iranTime > targetTime) {
    targetTime.setDate(targetTime.getDate() + 1);
  }

  const timeUntilNext = targetTime.getTime() - iranTime.getTime();

  console.log(
    `Next weather report scheduled for ${targetTime.toLocaleString('en-US', {
      timeZone: 'Asia/Tehran',
    })}`
  );

  setTimeout(() => {
    weatherNotifier.sendWeatherReport();
    // Schedule next report
    scheduleWeatherReport();
  }, timeUntilNext);
}

// Start scheduling
scheduleWeatherReport();
