interface CountryFlagProps {
  code: string;
  size?: number;
  className?: string;
}

export default function CountryFlag({ code, size = 20, className = '' }: CountryFlagProps) {
  return (
    <img
      src={`/flags/${code.toLowerCase()}.svg`}
      alt={code}
      width={size}
      height={size}
      className={`inline-block rounded-full ${className}`}
      loading="lazy"
    />
  );
}
