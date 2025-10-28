import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";

export default function Password({
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

  const [showPassword, setShowPassword] = useState(false); // 👁️ Toggle state

  return (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
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
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        className="absolute top-[18px] right-3 text-gray-500 hover:text-gray-700"
      >
        {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
      </button>
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
