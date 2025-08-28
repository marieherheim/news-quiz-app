import { ReactNode } from "react";
import clsx from "clsx";

type ButtonProps = {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
};

export default function Button({ children, onClick, disabled = false, className }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "px-6 py-2 bg-brand text-white rounded hover:bg-brand-hover disabled:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}

