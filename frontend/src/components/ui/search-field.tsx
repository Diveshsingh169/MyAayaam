"use client";

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
};

export default function SearchField({
  value,
  onChange,
  placeholder = "Search...",
  label = "Search",
}: SearchFieldProps) {
  return (
    <label className="ui-search-field">
      <span className="ui-search-field__icon" aria-hidden="true">⌕</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
      />
      {value && (
        <button type="button" onClick={() => onChange("")} aria-label="Clear search">
          ×
        </button>
      )}
    </label>
  );
}
