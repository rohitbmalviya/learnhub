// The learning view has its own minimal navbar — suppress the global layout nav/footer
export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
