import { createContext } from 'react';

import { CalendarDatesContextType } from '@/context/calendarDatesContextType';

export const ScheduleCalendarDatesContext = createContext<CalendarDatesContextType>({
  calendarStartDate : new Date(2024, 0, 15),
  calendarEndDate : new Date(2024, 0, 20),
  setCalendarStartDate : (d : Date) => {},
  setCalendarEndDate : (d : Date) => {},
});