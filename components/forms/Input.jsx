import { useState } from "react";

export default function Input({
  label,
  name,
  value,
  onChange,
  placeholder,
  error,
  payload,
}) {
  const [isFocused, setIsFocused] = useState({});

  const onFocus = (e) => {
    setIsFocused((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const onBlur = (e) => {
    setIsFocused((prev) => ({ ...prev, [e.target.name]: false }));
  };

  return (
    <div className="relative">
      <input
        type="text"
        id={name}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        value={value || ""}
        onFocus={onFocus}
        onBlur={onBlur} // ✅ reset focus when clicking outside
        className={`border-[#4b4c54] border-[1px] rounded-lg min-h-[60px] py-3 px-[20px] w-full focus:outline-[#3588FC] ${
          error ? "border-red-500 shadow-md shadow-red-200" : ""
        }`}
      />
      <label
        htmlFor={name} // ✅ match the input id dynamically
        className={`absolute left-[20px] font-medium transition-all text-[#2a2b3f] ${
          isFocused?.[name] || value || error
            ? "top-[5px] text-[8px]"
            : "top-[18px] cursor-pointer text-[16px]"
        }`}
      >
        {label}
      </label>
      {error && <p className="text-red-500 text-[12px] mt-1">{error}</p>}
    </div>
  );
}
