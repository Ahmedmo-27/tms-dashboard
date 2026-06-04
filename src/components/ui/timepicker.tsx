import { ScrollArea, ScrollBar } from "./scroll-area";
import { Button } from "./button";
import { Separator } from "./separator";

export default function TimePicker({
  date,
  onChange,
}: {
  date: Date;
  onChange: (date: string ) => void;
}) {
  const hours: number[] = [];
  const minutes: number[] = [];
  for (let i = 0; i < 24; i++) {
    hours.push(i);
  }
  for (let i = 0; i < 60; i = i + 5) {
    minutes.push(i);
  }

  const handleTimeChange = (type: "hour" | "minute", value: string) => {
    const newDate = new Date(date);
    if (type === "hour") {
      newDate.setHours(Number(value));
    } else {
      newDate.setMinutes(Number(value));
    }
    onChange(newDate.toString());
  };
  return (
    <div className="flex flex-col gap-2 w-full border rounded-md">
      <ScrollArea className="w-full py-2">
        <div className="flex p-1">
          {hours.map((hour) => (
            <Button
              key={hour}
              size="icon"
              variant={date && date.getHours() === hour ? "default" : "ghost"}
              className="h-8 w-8 shrink-0"
              onClick={(e) => {
                e.preventDefault(); // Prevent form submission
                handleTimeChange("hour", hour.toString());
              }}
              type="button" // Explicitly set type to button
            >
              {hour.toString().padStart(2, "0")}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <Separator />
      <ScrollArea className="w-full py-2">
        <div className="flex p-1">
          {minutes.map((minute) => (
            <Button
              key={minute}
              size="icon"
              variant={
                date && date.getMinutes() === minute ? "default" : "ghost"
              }
              className="h-8 w-8 shrink-0"
              onClick={(e) => {
                e.preventDefault(); // Prevent form submission
                handleTimeChange("minute", minute.toString());
              }}
              type="button" // Explicitly set type to button
            >
              {minute.toString().padStart(2, "0")}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
