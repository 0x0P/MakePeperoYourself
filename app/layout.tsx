import "@/styles/globals.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "빼빼로메이커",
  description: "나만의 특별한 빼빼로를 만들어봐요",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
