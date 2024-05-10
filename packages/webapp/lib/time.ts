/** Return a string representing the given time. */
export function timeString(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secondsRemainder = Math.floor(seconds % 60);
  return `${hours}:${minutes.toString().padStart(2, '0')}:${secondsRemainder.toString().padStart(2, '0')}`;
}

/** Return a string representing the given duration. */
export function durationString(seconds: number): string {
  let hours = Math.floor(seconds / 3600);
  let minutes = Math.floor((seconds % 3600) / 60);
  const secondsRemainder = Math.floor(seconds % 60);
  if (secondsRemainder > 30) {
    minutes += 1;
    if (minutes === 60) {
      minutes = 0;
      hours += 1;
    }
  }
  return `${hours > 0 ? hours.toString() + 'h' : ''} ${minutes.toString().padStart(2, '0')}m`;
}
