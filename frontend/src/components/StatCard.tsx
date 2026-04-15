export const StatCard = ({
  label,
  value,
  tone,
  helper,
}: {
  label: string;
  value: string;
  tone: "gold" | "teal" | "red" | "ink";
  helper: string;
}) => (
  <article className={`stat-card tone-${tone}`}>
    <p>{label}</p>
    <strong>{value}</strong>
    <span>{helper}</span>
  </article>
);
