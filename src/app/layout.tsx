import type { Metadata } from "next";
import "./globals.css";
import { prisma } from "@/lib/prisma";
import { buttonRadiusFor, darkenHex } from "@/lib/design";

export async function generateMetadata(): Promise<Metadata> {
  const design = await prisma.designSettings.findUnique({ where: { id: 1 } });
  return {
    title: "ageLOC 肌・髪・からだ診断",
    description: "肌・髪・からだの悩みに、科学的根拠にもとづいたご提案をします。",
    icons: design?.faviconUrl ? { icon: design.faviconUrl } : undefined,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const design = await prisma.designSettings.findUnique({ where: { id: 1 } });
  const primaryColor = design?.primaryColorHex ?? "#e11d48";
  const primaryColorHover = darkenHex(primaryColor, 0.12);
  const buttonRadius = buttonRadiusFor(design?.buttonStyle ?? "rounded-full");

  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-50 font-sans text-zinc-900">
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `:root { --brand-primary: ${primaryColor}; --brand-primary-hover: ${primaryColorHover}; --brand-button-radius: ${buttonRadius}; }`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
