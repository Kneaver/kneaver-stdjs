// Timestamps
const OneSecond = 1000;
const OneMinute = 60*OneSecond;
const OneHour = 60*OneMinute;
const OneDay = 24*OneHour;
const OneWeek = 7*OneDay;

export function getUTCNow() 
{ 
  return new Date() 
}

export function addSeconds( date: Date, seconds: number)
{
  return new Date( date.getTime() + seconds * OneSecond);
}
