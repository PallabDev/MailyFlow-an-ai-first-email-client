import CalendarClient from './CalendarClient';

export default function CalendarPage() {
  return (
    <CalendarClient
      initialEvents={[]}
      calendarError={null}
    />
  );
}
