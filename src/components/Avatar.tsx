import { avatarColor, initials } from "@/lib/avatar";

const PIXELS = { sm: 24, md: 32, lg: 40 };

export default function Avatar({
  name,
  avatarUrl,
  size = "md",
}: {
  name: string;
  avatarUrl?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = { sm: "h-6 w-6 text-[10px]", md: "h-8 w-8 text-xs", lg: "h-10 w-10 text-sm" }[size];

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        width={PIXELS[size]}
        height={PIXELS[size]}
        className={`inline-block shrink-0 rounded-full object-cover ${sizeClasses}`}
      />
    );
  }

  const { bg, text } = avatarColor(name);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${bg} ${text} ${sizeClasses}`}
    >
      {initials(name)}
    </span>
  );
}
