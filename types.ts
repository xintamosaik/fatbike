type TodoRow = {
  id: number;
  short: string;
  due_date: string;
  cost_of_delay: -2 | -1 | 0 | 1 | 2;
  effort: "mins" | "hours" | "days" | "weeks" | "months";
 
};

export type { TodoRow };
