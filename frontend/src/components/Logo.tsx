import Image from "next/image";

export default function Logo({ size = 64 }: { size?: number }) {
  return (
    <div className="relative select-none" style={{ width: size, height: size }}>
      {/* leve glow */}
      <div
        className="absolute inset-0 rounded-full"
      />
      <Image
        src="/icon.png"
        alt="Logo Squadly"
        fill
        sizes="(max-width: 768px) 64px, 96px"
        className="object-contain drop-shadow-[0_0_10px_rgba(168,164,255,0.45)] rounded-[20%]"
        priority
      />
    </div>
  );
}
