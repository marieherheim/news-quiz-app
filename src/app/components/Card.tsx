import { ReactNode } from "react";
import clsx from "clsx";

type CardProps = {
  children: ReactNode;
  center?: boolean;
  className?: string;
};

export default function Card({ children, center = false, className }: CardProps) {
  return (
    <div
      className={clsx(
        "p-4 bg-white rounded-lg shadow-lg border border-gray-200",
        center && "text-center",
        className
      )}
    >
      {children}
    </div>
  );
}