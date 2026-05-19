import Link from "next/link";

export function Logo() {
  return (
    <Link className="logo" href="/" aria-label="Catarino Prime Ferramentas">
      <span className="logo-mark" aria-hidden="true">
        <span />
      </span>
      <span className="logo-copy">
        <strong>
          Catarino <em>Prime</em>
        </strong>
        <small>Ferramentas</small>
      </span>
    </Link>
  );
}
