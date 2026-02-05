import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const pretendard = localFont({
	src:
		"../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
	display: "swap",
	variable: "--font-pretendard",
	weight: "45 920"
});

export const metadata: Metadata = {
  title: "Vibe App",
  description: "Built with Vibe Coding",
};

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ko">
			<body className={`${pretendard.className} antialiased`}>{children}</body>
		</html>
	);
}
