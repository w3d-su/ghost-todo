export const HOUR_MS = 3_600_000;

export const MAX_STAT = 100;

/** 每小時衰減量（蛋不扣 HP）。 */
export const DECAY_HP = 5;
export const DECAY_HUNGER = 8;
export const DECAY_MOOD = 6;

/** 每隻殭屍每小時吸走的 HP。 */
export const ZOMBIE_DRAIN = 3;

/** 完成任務的回復量。逾期任務回復較少。 */
export const COMPLETE_HP = 10;
export const COMPLETE_HUNGER = 20;
export const COMPLETE_MOOD = 15;
export const COMPLETE_OVERDUE_HP = 5;
export const COMPLETE_OVERDUE_HUNGER = 10;

/** 成長條件。 */
export const ADULT_TASKS = 7;
export const ADULT_STREAK = 3;
export const EVOLVE_STREAK = 10;
export const EVOLVE_HOURS_AS_ADULT = 24;

/** 超過這麼久沒完成任務，連續天數歸零並扣心情。 */
export const STREAK_BREAK_HOURS = 48;
export const STREAK_BREAK_MOOD = 20;

export const TITLE_MAX = 120;
