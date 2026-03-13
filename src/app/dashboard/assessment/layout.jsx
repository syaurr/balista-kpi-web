// app/dashboard/admin/assessment/layout.jsx

// Ini adalah layout paling sederhana yang tidak akan menyebabkan konflik.
// Ia hanya akan me-render halaman anaknya tanpa wrapper tambahan.
export default function AssessmentLayout({ children }) {
  return (
    <>
      {children}
    </>
  );
}