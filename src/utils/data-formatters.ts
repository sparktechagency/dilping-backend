interface DayCount {
    [day: number]: number; // day: count
  }
  
  export function generateDataPoints(
    counts: DayCount,
    totalDays: number,
    numPoints: number
  ): { day: number; value: number }[] {
    if (numPoints <= 0) throw new Error("numPoints must be > 0");
    if (totalDays <= 0) throw new Error("totalDays must be > 0");
  
    const step = totalDays / numPoints;
    const result: { day: number; value: number }[] = [];
  
    for (let i = 0; i < numPoints; i++) {
      const startDay = Math.floor(i * step) + 1;
      const endDay = Math.floor((i + 1) * step);
  
      let sum = 0;
      for (let d = startDay; d <= endDay && d <= totalDays; d++) {
        sum += counts[d] || 0;
      }
  
      result.push({ day: startDay, value: sum });
    }
  
    return result;
  }