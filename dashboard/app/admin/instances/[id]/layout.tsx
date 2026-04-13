import type { ReactNode } from "react";
import { MotionProvider } from "./_components/motion-provider";

export default function InstanceLayout({
  children,
  presenter,
}: {
  children: ReactNode;
  presenter: ReactNode;
}) {
  return (
    <MotionProvider>
      {children}
      {presenter}
    </MotionProvider>
  );
}
