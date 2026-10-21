export default function InputProblems({ problems }) {
  if (!problems || problems.length === 0) return null;
  return (
    <div className="hive-problems" role="alert">
      <p>
        <strong>Please check before saving:</strong>
      </p>
      <ul>
        {problems.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  );
}
