import { useFieldProblem } from "./problemsContext.js";

// A small red message under a field, shown only when that field has a problem.
export default function FieldError({ name }) {
  const message = useFieldProblem(name);
  return message ? <p className="hive-field-error">{message}</p> : null;
}
