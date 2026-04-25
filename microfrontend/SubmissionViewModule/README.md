# Submission View Module

The Submission View Module is a microfrontend designed to render a read-only view of form submissions. 

## Integration Methods

### 1. Module Federation (Recommended)
This project uses `@originjs/vite-plugin-federation`. You can consume the module as a remote component.

#### Host Configuration (`vite.config.ts`)
```typescript
federation({
  name: "host_app",
  remotes: {
    submission_provider: "http://localhost:5173/assets/remoteEntry.js",
  },
  shared: ["react", "react-dom"],
})
```

#### Consumption (`usage-react.tsx`)
```tsx
const SubmissionView = React.lazy(() => import("submission_provider/SubmissionView"));

// Usage in JSX
<Suspense fallback="...">
  <SubmissionView formSchema={schema} responseData={responses} />
</Suspense>
```

---

### 2. Framework Agnostic (Iframe) usage
For environments not using React or Module Federation, embed the view via an `<iframe>`.

- **Endpoint**: `/microfrontend/submission-view`
- **Communication**: `postMessage` protocol (see [usage-agnostic.html](./usage-agnostic.html)).

---

## Data Structures (Summary)

### `formSchema`
A `PublicFormData` object containing form metadata and a list of pages/components.

### `responseData`
- **Submission Array (Preferred)**: 
  ```json
  [
    {
      "pageNo": 1,
      "responses": [{ "componentId": "id", "response": "value" }]
    }
  ]
  ```
- **Flat Map**: 
  ```json
  { "id": "value" }
  ```

---

## Reference Files
- [SubmissionViewModule.tsx](./SubmissionViewModule.tsx): The core wrapper component.
- [usage-react.tsx](./usage-react.tsx): React implementation example.
- [usage-agnostic.html](./usage-agnostic.html): Non-React implementation example.
