export default function AmbientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full mix-blend-multiply blur-3xl opacity-70 animate-blob" />
      <div className="absolute top-20 -right-20 w-96 h-96 bg-teal-500/10 rounded-full mix-blend-multiply blur-3xl opacity-70 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-40 left-20 w-96 h-96 bg-amber-500/5 rounded-full mix-blend-multiply blur-3xl opacity-70 animate-blob animation-delay-4000" />
    </div>
  );
}
