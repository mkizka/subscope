export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-base-300 min-h-dvh">
      <div className="bg-base-200 container mx-auto h-full min-h-dvh max-w-md p-4">
        {children}
      </div>
    </div>
  );
}
