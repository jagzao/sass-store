# Migration Guide: Native Select to SearchableSelect

## Overview

This guide provides step-by-step instructions for migrating native HTML `<select>` elements to the `SearchableSelect` component. This migration brings improved UX, searchability, accessibility, and modern styling to your forms.

## Why Migrate?

### Benefits of SearchableSelect

- 🔍 **Instant Search**: Users can type to filter options
- ✨ **Better UX**: Modern, polished interface with smooth interactions
- ♿ **Accessibility**: Full WCAG 2.1 compliance with keyboard navigation
- 🎯 **Multi-select**: Built-in support for selecting multiple options
- 🌐 **Async Search**: Load options dynamically from APIs
- 📱 **Mobile-Friendly**: Optimized touch interactions
- 🎨 **Consistent Styling**: Matches your Tailwind design system

## Prerequisites

Before starting the migration, ensure:

1. ✅ `react-select` is installed (`npm install react-select`)
2. ✅ `SearchableSelect` components are available in `apps/web/components/ui/forms/`
3. ✅ You have read the [SearchableSelect Documentation](../components/SearchableSelect.md)

## Migration Steps

### Step 1: Identify Native Selects

Search for native `<select>` elements in your codebase:

```bash
# Search for select elements
grep -r "<select" apps/web --include="*.tsx" --include="*.ts"
```

### Step 2: Import the Component

Replace your existing imports:

```tsx
// Before
// No import needed for native select

// After
import {
  SearchableSelect,
  SelectOption,
} from "@/components/ui/forms/SearchableSelect";
```

### Step 3: Convert Options to SelectOption Format

Transform your option elements into the `SelectOption` array format:

```tsx
// Before
<select value={selected} onChange={handleChange}>
  <option value="">Select...</option>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
  <option value="option3">Option 3</option>
</select>;

// After
const options: SelectOption[] = useMemo(
  () => [
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" },
  ],
  [],
);

<SearchableSelect
  options={options}
  value={selected}
  onChange={handleChange}
  placeholder="Select..."
/>;
```

### Step 4: Update Value Handling

Native selects use string values, while `SearchableSelect` uses `SelectOption` objects:

```tsx
// Before
const [selected, setSelected] = useState<string>("");

const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  setSelected(e.target.value);
};

// After
const [selected, setSelected] = useState<SelectOption | null>(null);

const handleChange = (value: SelectOption | null) => {
  setSelected(value);
};
```

### Step 5: Update onChange Handler

The onChange handler receives different types:

```tsx
// Before
onChange={(e) => setSelected(e.target.value)}

// After - Single select
onChange={(value: SelectOption | null) => setSelected(value)}

// After - Multi select
onChange={(values: SelectOption[]) => setSelected(values)}
```

### Step 6: Add Labels and Helper Text

Enhance your forms with proper labels and helper text:

```tsx
// Before
<select>
  <option value="">Select...</option>
</select>

// After
<SearchableSelect
  options={options}
  value={selected}
  onChange={handleChange}
  label="Country"
  placeholder="Select a country"
  helperText="Choose your country of residence"
/>
```

### Step 7: Handle Error States

Replace error handling:

```tsx
// Before
<select className={error ? "border-red-500" : ""}>
  <option value="">Select...</option>
</select>;
{
  error && <span className="text-red-500">{error}</span>;
}

// After
<SearchableSelect
  options={options}
  value={selected}
  onChange={handleChange}
  label="Country"
  error={error}
/>;
```

## Complete Migration Examples

### Example 1: Simple Select

#### Before

```tsx
function CountrySelector() {
  const [country, setCountry] = useState<string>("");

  return (
    <div>
      <label>Country</label>
      <select
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        className="border rounded px-3 py-2"
      >
        <option value="">Select a country</option>
        <option value="us">United States</option>
        <option value="ca">Canada</option>
        <option value="mx">Mexico</option>
      </select>
    </div>
  );
}
```

#### After

```tsx
import { useState, useMemo } from "react";
import {
  SearchableSelect,
  SelectOption,
} from "@/components/ui/forms/SearchableSelect";

function CountrySelector() {
  const [country, setCountry] = useState<SelectOption | null>(null);

  const options = useMemo(
    () => [
      { value: "us", label: "United States" },
      { value: "ca", label: "Canada" },
      { value: "mx", label: "Mexico" },
    ],
    [],
  );

  return (
    <SearchableSelect
      options={options}
      value={country}
      onChange={setCountry}
      label="Country"
      placeholder="Select a country"
    />
  );
}
```

### Example 2: Multi-Select

#### Before

```tsx
function TagSelector() {
  const [tags, setTags] = useState<string[]>([]);

  return (
    <div>
      <label>Tags</label>
      <select
        multiple
        value={tags}
        onChange={(e) => {
          const selected = Array.from(e.target.selectedOptions).map(
            (opt) => opt.value,
          );
          setTags(selected);
        }}
        className="border rounded px-3 py-2"
      >
        <option value="react">React</option>
        <option value="vue">Vue</option>
        <option value="angular">Angular</option>
      </select>
    </div>
  );
}
```

#### After

```tsx
import { useState, useMemo } from "react";
import { SearchableSelectMulti } from "@/components/ui/forms/SearchableSelectMulti";

function TagSelector() {
  const [tags, setTags] = useState<SelectOption[]>([]);

  const options = useMemo(
    () => [
      { value: "react", label: "React" },
      { value: "vue", label: "Vue" },
      { value: "angular", label: "Angular" },
    ],
    [],
  );

  return (
    <SearchableSelectMulti
      options={options}
      value={tags}
      onChange={setTags}
      label="Tags"
      placeholder="Select tags"
    />
  );
}
```

### Example 3: Async Search

#### Before

```tsx
function UserSelector() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data));
  }, []);

  return (
    <select
      value={selectedUser}
      onChange={(e) => setSelectedUser(e.target.value)}
      className="border rounded px-3 py-2"
    >
      <option value="">Select a user</option>
      {users.map((user) => (
        <option key={user.id} value={user.id}>
          {user.name}
        </option>
      ))}
    </select>
  );
}
```

#### After

```tsx
import { useState } from "react";
import {
  AsyncSearchableSelect,
  SelectOption,
} from "@/components/ui/forms/AsyncSearchableSelect";

function UserSelector() {
  const [selectedUser, setSelectedUser] = useState<SelectOption | null>(null);

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
      value={selectedUser}
      onChange={setSelectedUser}
      label="User"
      placeholder="Search for a user..."
      defaultOptions={true}
    />
  );
}
```

### Example 4: With Form Validation

#### Before

```tsx
function FormWithValidation() {
  const [country, setCountry] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!country) {
      setError("Country is required");
      return;
    }
    setError("");
    // Submit form
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Country *</label>
        <select
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            setError("");
          }}
          className={`border rounded px-3 py-2 ${error ? "border-red-500" : ""}`}
        >
          <option value="">Select a country</option>
          <option value="us">United States</option>
          <option value="ca">Canada</option>
        </select>
        {error && <span className="text-red-500">{error}</span>}
      </div>
      <button type="submit">Submit</button>
    </form>
  );
}
```

#### After

```tsx
import { useState, useMemo } from "react";
import {
  SearchableSelect,
  SelectOption,
} from "@/components/ui/forms/SearchableSelect";

function FormWithValidation() {
  const [country, setCountry] = useState<SelectOption | null>(null);
  const [error, setError] = useState<string>("");

  const options = useMemo(
    () => [
      { value: "us", label: "United States" },
      { value: "ca", label: "Canada" },
    ],
    [],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!country) {
      setError("Country is required");
      return;
    }
    setError("");
    // Submit form with country.value
  };

  return (
    <form onSubmit={handleSubmit}>
      <SearchableSelect
        options={options}
        value={country}
        onChange={(value) => {
          setCountry(value);
          setError("");
        }}
        label="Country"
        placeholder="Select a country"
        error={error}
        required
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Common Patterns

### Pattern 1: Conditional Options

```tsx
const options = useMemo(() => {
  if (userRole === "admin") {
    return allOptions;
  }
  return allOptions.filter((opt) => !opt.adminOnly);
}, [userRole, allOptions]);
```

### Pattern 2: Disabled Options

```tsx
const options = useMemo(
  () => [
    { value: "opt1", label: "Available Option" },
    { value: "opt2", label: "Disabled Option", disabled: true },
    { value: "opt3", label: "Another Available Option" },
  ],
  [],
);
```

### Pattern 3: Grouped Options

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

### Pattern 4: Dynamic Options from API

```tsx
const [options, setOptions] = useState<SelectOption[]>([]);

useEffect(() => {
  fetch("/api/categories")
    .then((res) => res.json())
    .then((data) => {
      const mappedOptions = data.map((item: any) => ({
        value: item.id,
        label: item.name,
      }));
      setOptions(mappedOptions);
    });
}, []);
```

## Integration with Form Libraries

### React Hook Form

```tsx
import { useForm } from "react-hook-form";
import {
  SearchableSelect,
  SelectOption,
} from "@/components/ui/forms/SearchableSelect";

function MyForm() {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm();

  return (
    <SearchableSelect
      options={options}
      value={watch("country")}
      onChange={(value) => setValue("country", value?.value || "")}
      label="Country"
      error={errors.country?.message}
      required
    />
  );
}
```

### Formik

```tsx
import { Formik, Form, Field } from "formik";
import {
  SearchableSelect,
  SelectOption,
} from "@/components/ui/forms/SearchableSelect";

function MyForm() {
  return (
    <Formik
      initialValues={{ country: "" }}
      onSubmit={(values) => console.log(values)}
    >
      {({ values, setFieldValue, errors }) => (
        <Form>
          <SearchableSelect
            options={options}
            value={options.find((opt) => opt.value === values.country) || null}
            onChange={(value) => setFieldValue("country", value?.value || "")}
            label="Country"
            error={errors.country}
            required
          />
        </Form>
      )}
    </Formik>
  );
}
```

## Testing

### Unit Tests

```tsx
import { render, screen } from "@testing-library/react";
import { SearchableSelect } from "@/components/ui/forms/SearchableSelect";

test("renders searchable select", () => {
  const options = [
    { value: "opt1", label: "Option 1" },
    { value: "opt2", label: "Option 2" },
  ];

  render(
    <SearchableSelect
      options={options}
      value={null}
      onChange={vi.fn()}
      label="Test Select"
    />,
  );

  expect(screen.getByText("Test Select")).toBeInTheDocument();
});
```

### E2E Tests with Playwright

```tsx
test("searchable select interaction", async ({ page }) => {
  await page.goto("/my-page");

  // Click on the select
  await page.click('[data-testid="react-select"]');

  // Type to search
  await page.fill('input[placeholder*="Search"]', "Option 1");

  // Select an option
  await page.click("text=Option 1");

  // Verify selection
  expect(await page.textContent('[data-testid="react-select"]')).toContain(
    "Option 1",
  );
});
```

## Troubleshooting

### Issue: Value not updating

**Problem**: The selected value doesn't change when clicking options.

**Solution**: Ensure your onChange handler is correctly updating state:

```tsx
// ❌ Wrong
onChange={(value) => console.log(value)}

// ✅ Correct
onChange={(value) => setSelected(value)}
```

### Issue: Options not displaying

**Problem**: The dropdown appears but no options are shown.

**Solution**: Verify options are in the correct format:

```tsx
// ❌ Wrong
const options = ["option1", "option2"];

// ✅ Correct
const options = [
  { value: "option1", label: "Option 1" },
  { value: "option2", label: "Option 2" },
];
```

### Issue: Type errors with TypeScript

**Problem**: TypeScript complains about value types.

**Solution**: Use proper typing:

```tsx
import { SelectOption } from "@/components/ui/forms/SearchableSelect";

const [selected, setSelected] = useState<SelectOption | null>(null);
```

### Issue: Async search not working

**Problem**: Async search doesn't load options.

**Solution**: Ensure loadOptions returns the correct type:

```tsx
// ❌ Wrong
const loadOptions = async (inputValue: string) => {
  return fetch(`/api/search?q=${inputValue}`);
};

// ✅ Correct
const loadOptions = async (inputValue: string): Promise<SelectOption[]> => {
  const response = await fetch(`/api/search?q=${inputValue}`);
  return response.json();
};
```

## Best Practices

1. **Memoize Options**: Use `useMemo` for options arrays to prevent unnecessary re-renders
2. **Debounce Async Search**: Use debounce for API calls to reduce requests
3. **Provide Clear Labels**: Always include descriptive labels for accessibility
4. **Handle Loading States**: Show loading indicators during async operations
5. **Validate on Blur**: Validate form fields when the user leaves the field
6. **Use Helper Text**: Provide context and guidance to users
7. **Test Accessibility**: Verify keyboard navigation and screen reader support

## Performance Considerations

- **Large Lists**: react-select includes virtualization for lists with 100+ options
- **Debounce Async Search**: Use 300ms debounce for optimal performance
- **Memoize Options**: Prevent unnecessary re-renders with `useMemo`
- **Avoid Inline Functions**: Define handlers outside render when possible

## Migration Checklist

Use this checklist to ensure complete migration:

- [ ] Identify all native `<select>` elements
- [ ] Import `SearchableSelect` component
- [ ] Convert options to `SelectOption` format
- [ ] Update value state to use `SelectOption | null` or `SelectOption[]`
- [ ] Update onChange handler
- [ ] Add labels and helper text
- [ ] Handle error states
- [ ] Test keyboard navigation
- [ ] Test with screen readers
- [ ] Update unit tests
- [ ] Update E2E tests
- [ ] Verify accessibility compliance
- [ ] Test on mobile devices
- [ ] Update documentation

## Additional Resources

- [SearchableSelect Documentation](../components/SearchableSelect.md)
- [react-select Documentation](https://react-select.com/home)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Migration Plan](../../plans/searchable-dropdown-migration-plan.md)

## Support

If you encounter issues during migration:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [SearchableSelect Documentation](../components/SearchableSelect.md)
3. Consult the [Migration Plan](../../plans/searchable-dropdown-migration-plan.md)
4. Reach out to the development team for assistance

## Summary

Migrating from native `<select>` to `SearchableSelect` provides significant improvements in UX, accessibility, and functionality. Follow this guide step-by-step, and use the examples as templates for your specific use cases.

The migration is straightforward and the benefits are immediate. Happy migrating! 🚀
