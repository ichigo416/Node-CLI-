import React from "react";

export interface ButtonProps {
  children?: React.ReactNode;
}

export function Button({ children }: ButtonProps) {
  return <div className="button">{children}</div>;
}

export default Button;
