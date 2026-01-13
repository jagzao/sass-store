# SearchableSelect Component Documentation

## Overview

The `SearchableSelect` component is a powerful, accessible dropdown component built on top of [react-select](https://react-select.com/). It provides searchable, multi-select, and async search capabilities with full TypeScript support and WCAG 2.1 accessibility compliance.

## Features

- 🔍 **Searchable**: Built-in search functionality for filtering options
- ✨ **Multi-select**: Support for single and multiple selection modes
- 🌐 **Async Search**: Load options asynchronously from an API
- ♿ **Accessible**: Full WCAG 2.1 compliance with keyboard navigation and screen reader support
- 🎨 **Customizable**: Extensive styling options matching Tailwind design system
- 📱 **Responsive**: Works seamlessly on mobile and desktop
- 🧪 **Type-Safe**: Full TypeScript support with generic types

## Installation

The component is already installed as part of the project dependencies:

```bash
npm install react-select
```

## Components

### SearchableSelect (Base Component)

The main component that provides all functionality.

```tsx
import {
  SearchableSelect,
  SelectOption,
} from "@/components/ui/forms/SearchableSelect";

const options: SelectOption[] = [
  { value: "option1", label: "Option 1" },
  { value: "option2", label: "Option 2" },
  { value: "option3", label: "Option 3" },
];

<SearchableSelect
  options={options}
  value={selectedValue}
  onChange={handleChange}
  label="Select an option"
  placeholder="Choose..."
/>;
```

### SearchableSelectSingle

Simplified wrapper for single-select use cases.

```tsx
import { SearchableSelectSingle } from "@/components/ui/forms/SearchableSelectSingle";

<SearchableSelectSingle
  options={options}
  value={selectedValue}
  onChange={handleChange}
  label="Single Select"
/>;
```

### SearchableSelectMulti

Wrapper for multi-select use cases.

```tsx
import { SearchableSelectMulti } from "@/components/ui/forms/SearchableSelectMulti";

<SearchableSelectMulti
  options={options}
  value={selectedValues}
  onChange={handleChange}
  label="Multi Select"
/>;
```

### AsyncSearchableSelect

Wrapper for async search from API.

```tsx
import { AsyncSearchableSelect } from "@/components/ui/forms/AsyncSearchableSelect";

const loadOptions = async (inputValue: string): Promise<SelectOption[]> => {
  const response = await fetch(`/api/search?q=${inputValue}`);
  return response.json();
};

<AsyncSearchableSelect
  loadOptions={loadOptions}
  value={selectedValue}
  onChange={handleChange}
  label="Async Search"
/>;
```

## Props

### SearchableSelectProps

| Prop                  | Type                                                   | Default            | Description                      |
| --------------------- | ------------------------------------------------------ | ------------------ | -------------------------------- |
| `options`             | `SelectOption[]`                                       | `[]`               | Array of available options       |
| `value`               | `SelectOption \| string \| SelectOption[] \| string[]` | `undefined`        | Current selected value(s)        |
| `onChange`            | `(value) => void`                                      | **Required**       | Callback when selection changes  |
| `isMulti`             | `boolean`                                              | `false`            | Enable multi-select mode         |
| `isSearchable`        | `boolean`                                              | `true`             | Enable search functionality      |
| `isClearable`         | `boolean`                                              | `true`             | Allow clearing selection         |
| `isDisabled`          | `boolean`                                              | `false`            | Disable the component            |
| `isLoading`           | `boolean`                                              | `false`            | Show loading indicator           |
| `loadOptions`         | `(inputValue) => Promise<SelectOption[]>`              | `undefined`        | Async search function            |
| `defaultOptions`      | `boolean \| SelectOption[]`                            | `false`            | Default options for async search |
| `label`               | `string`                                               | `undefined`        | Label for the select             |
| `placeholder`         | `string`                                               | `"Seleccionar..."` | Placeholder text                 |
| `error`               | `string`                                               | `undefined`        | Error message                    |
| `helperText`          | `string`                                               | `undefined`        | Helper text below select         |
| `noOptionsMessage`    | `string`                                               | `"Sin opciones"`   | Message when no options          |
| `loadingMessage`      | `string`                                               | `"Cargando..."`    | Message while loading            |
| `containerClassName`  | `string`                                               | `""`               | CSS class for container          |
| `className`           | `string`                                               | `""`               | CSS class for select             |
| `name`                | `string`                                               | `undefined`        | Form field name                  |
| `id`                  | `string`                                               | `undefined`        | Unique identifier                |
| `required`            | `boolean`                                              | `false`            | Required field indicator         |
| `autoFocus`           | `boolean`                                              | `false`            | Auto-focus on mount              |
| `menuPortalTarget`    | `HTMLElement`                                          | `undefined`        | Portal target for menu           |
| `closeMenuOnSelect`   | `boolean`                                              | `!isMulti`         | Close menu on select             |
| `hideSelectedOptions` | `boolean`                                              | `isMulti`          | Hide selected options            |
| `onBlur`              | `() => void`                                           | `undefined`        | Blur callback                    |
| `onFocus`             | `() => void`                                           | `undefined`        | Focus callback                   |

### SelectOption

```typescript
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  [key: string]: any; // Additional custom properties
}
```

## Usage Examples

### Basic Single Select

```tsx
import { useState } from "react";
import {
  SearchableSelect,
  SelectOption,
} from "@/components/ui/forms/SearchableSelect";

function Example() {
  const [selected, setSelected] = useState<SelectOption | null>(null);

  const options: SelectOption[] = [
    { value: "us", label: "United States" },
    { value: "ca", label: "Canada" },
    { value: "mx", label: "Mexico" },
  ];

  return (
    <SearchableSelect
      options={options}
      value={selected}
      onChange={setSelected}
      label="Country"
      placeholder="Select a country"
    />
  );
}
```

### Multi Select

```tsx
import { useState } from "react";
import { SearchableSelectMulti } from "@/components/ui/forms/SearchableSelectMulti";

function Example() {
  const [selected, setSelected] = useState<SelectOption[]>([]);

  const options: SelectOption[] = [
    { value: "js", label: "JavaScript" },
    { value: "ts", label: "TypeScript" },
    { value: "py", label: "Python" },
    { value: "rs", label: "Rust" },
  ];

  return (
    <SearchableSelectMulti
      options={options}
      value={selected}
      onChange={setSelected}
      label="Programming Languages"
      placeholder="Select languages"
    />
  );
}
```

### Async Search

```tsx
import { useState } from "react";
import { AsyncSearchableSelect } from "@/components/ui/forms/AsyncSearchableSelect";

function Example() {
  const [selected, setSelected] = useState<SelectOption | null>(null);

  const loadOptions = async (inputValue: string): Promise<SelectOption[]> => {
    if (!inputValue) return [];

    const response = await fetch(
      `/api/users/search?q=${encodeURIComponent(inputValue)}`,
    );
    const users = await response.json();

    return users.map((user: any) => ({
      value: user.id,
      label: user.name,
      email: user.email,
    }));
  };

  return (
    <AsyncSearchableSelect
      loadOptions={loadOptions}
      value={selected}
      onChange={setSelected}
      label="User Search"
      placeholder="Type to search users..."
      defaultOptions={true}
    />
  );
}
```

### With Error State

```tsx
import { useState } from "react";
import { SearchableSelect } from "@/components/ui/forms/SearchableSelect";

function Example() {
  const [selected, setSelected] = useState<SelectOption | null>(null);
  const [error, setError] = useState<string>("");

  const handleChange = (value: SelectOption | null) => {
    setSelected(value);
    setError("");
  };

  const handleBlur = () => {
    if (!selected) {
      setError("This field is required");
    }
  };

  return (
    <SearchableSelect
      options={options}
      value={selected}
      onChange={handleChange}
      onBlur={handleBlur}
      label="Required Field"
      error={error}
      required
    />
  );
}
```

### With Helper Text

```tsx
<SearchableSelect
  options={options}
  value={selected}
  onChange={setSelected}
  label="Select Option"
  helperText="Choose the best option for your needs"
/>
```

### Disabled State

```tsx
<SearchableSelect
  options={options}
  value={selected}
  onChange={setSelected}
  label="Disabled Select"
  isDisabled={true}
/>
```

### Disabled Options

```tsx
const options: SelectOption[] = [
  { value: "opt1", label: "Available Option" },
  { value: "opt2", label: "Disabled Option", disabled: true },
  { value: "opt3", label: "Another Available Option" },
];

<SearchableSelect
  options={options}
  value={selected}
  onChange={setSelected}
  label="With Disabled Options"
/>;
```

## Styling

The component uses custom styles that match the Tailwind design system. Styles are applied through the `StylesConfig` from react-select.

### Custom Styles

The component includes the following styled parts:

- **Control**: The main input container
- **ValueContainer**: Container for selected values
- **Input**: The search input
- **IndicatorSeparator**: Separator between indicators (hidden)
- **DropdownIndicator**: The dropdown arrow
- **ClearIndicator**: The clear button
- **Menu**: The dropdown menu
- **MenuList**: The list of options
- **Option**: Individual options
- **MultiValue**: Selected value chips (multi-select)
- **MultiValueLabel**: Label of selected value chip
- **MultiValueRemove**: Remove button of selected value chip
- **Placeholder**: Placeholder text
- **NoOptionsMessage**: Message when no options
- **LoadingMessage**: Message while loading

### Custom Styling

You can override styles by passing custom styles to the component:

```tsx
const customStyles = {
  control: (base: any) => ({
    ...base,
    backgroundColor: "#f3f4f6",
  }),
};

<SearchableSelect
  options={options}
  value={selected}
  onChange={setSelected}
  styles={customStyles}
/>;
```

## Accessibility

The component is fully accessible and follows WCAG 2.1 guidelines:

- **Keyboard Navigation**: Full keyboard support (Tab, Enter, Escape, Arrow keys)
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Focus Management**: Clear focus indicators and management
- **Error States**: Proper error announcements
- **Labels**: Associated labels for all inputs

### ARIA Attributes

The component automatically sets:

- `aria-label`: From label or placeholder prop
- `aria-invalid`: Set to true when error is present
- `aria-describedby`: Links to error or helper text

## Performance

### Optimization Tips

1. **Memoize Options**: Use `useMemo` for options arrays to prevent unnecessary re-renders

```tsx
const options = useMemo(
  () => [
    { value: "opt1", label: "Option 1" },
    { value: "opt2", label: "Option 2" },
  ],
  [],
);
```

2. **Debounce Async Search**: Use debounce for API calls

```tsx
import { debounce } from "lodash";

const debouncedLoadOptions = useMemo(() => debounce(loadOptions, 300), []);
```

3. **Virtualization**: For large lists, react-select includes virtualization automatically

## Migration from Native Select

### Before (Native Select)

```tsx
<select
  value={selected}
  onChange={(e) => setSelected(e.target.value)}
  className="border rounded px-3 py-2"
>
  <option value="">Select...</option>
  <option value="opt1">Option 1</option>
  <option value="opt2">Option 2</option>
</select>
```

### After (SearchableSelect)

```tsx
import { SearchableSelect } from "@/components/ui/forms/SearchableSelect";

const options = useMemo(
  () => [
    { value: "opt1", label: "Option 1" },
    { value: "opt2", label: "Option 2" },
  ],
  [],
);

<SearchableSelect
  options={options}
  value={selected}
  onChange={setSelected}
  placeholder="Select..."
/>;
```

## Common Patterns

### Form Integration

```tsx
import { useForm } from "react-hook-form";

function MyForm() {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm();

  return (
    <form>
      <SearchableSelect
        options={options}
        value={watch("country")}
        onChange={(value) => setValue("country", value?.value || "")}
        label="Country"
        error={errors.country?.message}
        required
      />
    </form>
  );
}
```

### Conditional Options

```tsx
const options = useMemo(() => {
  if (userRole === "admin") {
    return allOptions;
  }
  return allOptions.filter((opt) => !opt.adminOnly);
}, [userRole, allOptions]);
```

### Grouped Options

```tsx
const options = [
  {
    label: "Fruits",
    options: [
      { value: "apple", label: "Apple" },
      { value: "banana", label: "Banana" },
    ],
  },
  {
    label: "Vegetables",
    options: [
      { value: "carrot", label: "Carrot" },
      { value: "broccoli", label: "Broccoli" },
    ],
  },
];
```

## Troubleshooting

### Issue: Options not displaying

**Solution**: Ensure options are in the correct format with `value` and `label` properties.

```typescript
const options: SelectOption[] = [
  { value: "opt1", label: "Option 1" }, // ✅ Correct
  { opt1: "Option 1" }, // ❌ Wrong format
];
```

### Issue: Value not updating

**Solution**: Ensure the onChange handler is properly updating state.

```tsx
// ✅ Correct
const handleChange = (value: SelectOption | null) => {
  setSelected(value);
};

// ❌ Wrong - not using the value parameter
const handleChange = () => {
  setSelected(value); // value is undefined
};
```

### Issue: Async search not working

**Solution**: Ensure `loadOptions` returns a Promise that resolves to an array of `SelectOption`.

```tsx
// ✅ Correct
const loadOptions = async (inputValue: string): Promise<SelectOption[]> => {
  const response = await fetch(`/api/search?q=${inputValue}`);
  return response.json();
};

// ❌ Wrong - not returning Promise<SelectOption[]>
const loadOptions = async (inputValue: string) => {
  const response = await fetch(`/api/search?q=${inputValue}`);
  return response.data; // Wrong structure
};
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

This component is part of the SaaS Store project and uses the MIT-licensed react-select library.

## Additional Resources

- [react-select Documentation](https://react-select.com/home)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
