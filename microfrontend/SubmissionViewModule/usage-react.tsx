// microfrontend/SubmissionViewModule/usage-react.tsx
import React, { Suspense } from "react";

/**
 * Example of using the Submission View Module as a Remote Microfrontend.
 * 
 * This example uses @originjs/vite-plugin-federation, which is the setup
 * found in the project's 'test-host'.
 */

// 1. Define the remote component using React.lazy
const SubmissionView = React.lazy(
  // @ts-expect-error - Remote module not defined locally
  () => import("submission_provider/SubmissionView"),
);

// 2. Realistic sample schema from the host environment
const sampleSchema = {
  form: { title: "Q2 Customer Feedback Snapshot" },
  version: {
    meta: {
      description: "<p>This is a read-only snapshot reflecting customer feedback.</p>",
    },
    theme: {
      color: "orange",
      mode: "light",
      layout: { formWidth: "800px", cardStyle: "glassmorphism" },
    },
    pages: [
      {
        pageNo: 1,
        title: "Respondent Details",
        components: [
          {
            componentId: "full-name",
            componentType: "single-line-input",
            props: { questionText: "Full Name" },
          },
          {
            componentId: "email-address",
            componentType: "single-line-input",
            props: { questionText: "Work Email" },
          },
        ],
      },
    ],
  },
};

// 3. Realistic response data (Submission Array format)
const sampleResponses = [
  {
    pageNo: 1,
    responses: [
      { componentId: "full-name", response: "Alex Johnson" },
      { componentId: "email-address", response: "alex.johnson@sample.com" },
    ],
  },
];

export const RemoteSubmissionViewExample = () => {
  return (
    <Suspense fallback={<div>Loading Submission View...</div>}>
      <SubmissionView
        formSchema={sampleSchema as any}
        responseData={sampleResponses as any}
      />
    </Suspense>
  );
};
