import type { ReactNode } from "react";
import { MotionProvider } from "./_components/motion-provider";

export default function InstanceLayout({ children }: { children: ReactNode }) {
  return <MotionProvider>{children}</MotionProvider>;
}
