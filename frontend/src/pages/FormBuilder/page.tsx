export default function FormBuilder() {
  return (
    // Full-page gray canvas — fills remaining space below the header
    <div className="relative flex-1 bg-gray-200 overflow-hidden">

      {/* Floating sidebar — fixed, offset by header height (~65px) + gap */}
      <div className="fixed top-4 right-3 bottom-4 w-120 bg-sidebar rounded-xl" />

    </div>
  );
}