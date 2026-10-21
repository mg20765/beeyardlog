// The list of things to fix before saving. Each line is a button that jumps to
// its field, so nobody has to scroll back up looking for it.
export default function InputProblems({ problems, onGoTo }) {
  if (!problems || problems.length === 0) return null;
  return (
    <div className="hive-problems" role="alert">
      <p>
        <strong>Please check before saving:</strong> tap a line to go to it.
      </p>
      <ul>
        {problems.map((p) => (
          <li key={p.message}>
            <button
              type="button"
              className="hive-problem-link"
              onClick={() => onGoTo(p.field)}
            >
              {p.message}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
