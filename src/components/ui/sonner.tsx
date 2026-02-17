"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      style={
        {
          "--normal-bg": "hsl(222.2 84% 4.9%)",
          "--normal-text": "hsl(210 40% 98%)",
          "--normal-border": "hsl(217.2 32.6% 17.5%)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
