type InputProps = {
  label: string;
  type: string;
  placeholder: string;
};

export default function Input({
  label,
  type,
  placeholder,
}: InputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
      />
    </div>
  );
}