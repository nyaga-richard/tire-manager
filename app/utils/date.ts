import { format } from "date-fns";

export const formatDateTime = (date?: string | number | Date | null) => {
  if (!date) return "Never";
  return format(new Date(date), "dd MMM yyyy, HH:mm");
};
