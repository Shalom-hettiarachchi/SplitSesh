export interface BuiltinAvatar {
  id: string;
  label: string;
  src: string;
}

export const BUILTIN_AVATARS: BuiltinAvatar[] = [
  { id: "coughing-smoke", label: "Coughing smoke", src: "/avatars/coughing-smoke.jpg" },
  { id: "couch", label: "On the couch", src: "/avatars/couch.jpg" },
  { id: "jar-of-nugs", label: "Jar of nugs", src: "/avatars/jar-of-nugs.jpg" },
  { id: "sunglasses", label: "Sunglasses", src: "/avatars/sunglasses.jpg" },
  { id: "gamer", label: "Gamer", src: "/avatars/gamer.jpg" },
  { id: "lighter", label: "Lighter", src: "/avatars/lighter.jpg" },
  { id: "smirk-leaf", label: "Smirking leaf", src: "/avatars/smirk-leaf.jpg" },
  { id: "skunk", label: "Skunk", src: "/avatars/skunk.jpg" },
];

export function isValidBuiltinAvatarId(id: string): boolean {
  return BUILTIN_AVATARS.some((a) => a.id === id);
}

export function builtinAvatarSrc(id: string): string | undefined {
  return BUILTIN_AVATARS.find((a) => a.id === id)?.src;
}
