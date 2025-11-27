import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Medication, IntakeStatus } from '../types';

export const useAdherence = (patientId: string | undefined, medications: Medication[], externalIntakes?: any[]) => {
  const { intakes: reduxIntakes } = useSelector((state: RootState) => state.intakes);
  const intakes = externalIntakes || reduxIntakes;

  const adherenceData = useMemo(() => {
    if (!patientId || !medications || medications.length === 0) {
      return { takenCount: 0, totalCount: 0, percentage: 0 };
    }

    const DAY_ABBREVS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const getTodayAbbrev = () => DAY_ABBREVS[new Date().getDay()];
    
    const isScheduledToday = (med: Medication) => {
      const freq = med.frequency || '';
      const days = freq.split(',').map((s) => s.trim());
      return days.includes(getTodayAbbrev());
    };

    const todaysMeds = medications.filter(isScheduledToday);
    
    if (todaysMeds.length === 0) return { takenCount: 0, totalCount: 0, percentage: 0 };

    let totalDoses = 0;
    todaysMeds.forEach(med => {
      totalDoses += med.times.length;
    });

    if (totalDoses === 0) return { takenCount: 0, totalCount: 0, percentage: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const uniqueTaken = new Set<string>();
    intakes.forEach((intake) => {
      const intakeDate = new Date(intake.scheduledTime);
      // Check if it belongs to one of today's meds and is taken today
      // Note: This logic assumes intakes are filtered/subscribed by patientId in the store
      if (intakeDate >= today && intake.status === IntakeStatus.TAKEN) {
         // Ideally we check if this intake corresponds to one of the meds
         // For now assuming the subscription is correct for the patient
         uniqueTaken.add(intake.id);
      }
    });

    const takenCount = uniqueTaken.size; // This is a rough approximation if we don't link intakes exactly to scheduled slots
    
    // Better approximation if we don't have exact intake-schedule mapping in this context:
    // Just use the count of TAKEN intakes for today vs expected total.
    // Ensure takenCount doesn't exceed totalDoses for the percentage
    const safeTakenCount = Math.min(takenCount, totalDoses);
    
    return { takenCount: safeTakenCount, totalCount: totalDoses, percentage: Math.round((safeTakenCount / totalDoses) * 100) };
  }, [patientId, medications, intakes]);

  const weeklyStats = useMemo(() => {
    if (!patientId || !medications) return [];

    const stats = [];
    const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate for last 7 days (including today or ending yesterday? usually ending today)
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayAbbrev = days[date.getDay()];
      
      // Filter intakes for this day
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayIntakes = intakes.filter(intake => {
        const intakeDate = new Date(intake.scheduledTime || intake.timestamp);
        return intakeDate >= dayStart && intakeDate <= dayEnd && intake.status === IntakeStatus.TAKEN;
      });

      // Calculate total expected doses for this day
      // (Simplified: assuming schedule is constant)
      // We need to check if medication was active on that day ideally, but keeping it simple
      const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
      
      let dayTotalDoses = 0;
      medications.forEach(med => {
         const freq = med.frequency || '';
         if (freq.includes(dayOfWeek)) {
           dayTotalDoses += med.times.length;
         }
      });

      let percentage = 0;
      let status: 'good' | 'warning' | 'bad' | 'future' = 'bad';

      if (date > new Date()) {
        status = 'future';
      } else if (dayTotalDoses > 0) {
        percentage = Math.min(Math.round((dayIntakes.length / dayTotalDoses) * 100), 100);
        if (percentage >= 80) status = 'good';
        else if (percentage >= 50) status = 'warning';
        else status = 'bad';
      } else {
        // No meds scheduled
        status = 'good'; // or distinct status
        percentage = 100;
      }

      stats.push({
        day: dayAbbrev,
        percentage,
        status
      });
    }
    return stats;
  }, [patientId, medications, intakes]);

  return { ...adherenceData, weeklyStats };
};
