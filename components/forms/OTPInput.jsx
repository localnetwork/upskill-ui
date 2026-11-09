import { useEffect, useRef } from "react";

const LENGTH = 6;

// Six digit boxes with paste and backspace support.
export default function OTPInput({ value, onChange, disabled }) {
  const inputsRef = useRef([]);
  const digits = value.split("").concat(Array(LENGTH).fill("")).slice(0, LENGTH);

  const setAt = (i, char) =>
    onChange(digits.map((d, idx) => (idx === i ? char : d)).join(""));

  const handleChange = (i, e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) return;
    setAt(i, val.slice(-1));
    if (i < LENGTH - 1) inputsRef.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) {
        setAt(i, "");
      } else if (i > 0) {
        inputsRef.current[i - 1]?.focus();
        setAt(i - 1, "");
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      inputsRef.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < LENGTH - 1) {
      inputsRef.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, LENGTH);
    onChange(pasted);
    inputsRef.current[Math.min(pasted.length, LENGTH - 1)]?.focus();
  };

  useEffect(() => {
    if (value === "") inputsRef.current[0]?.focus();
  }, [value]);

  return (
    <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          autoFocus={i === 0}
          className={`h-14 w-11 rounded-xl border-2 text-center text-xl font-semibold outline-none transition-all duration-150 focus:border-slate-800 ${
            digit ? "border-slate-800 bg-slate-50" : "border-slate-200 bg-white"
          }`}
        />
      ))}
    </div>
  );
}
