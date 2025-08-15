import { poppins } from './fonts';
import './globals.css';

export const metadata = {
  title: 'Balista KPI System',
  description: 'Sistem Evaluasi & Target Kinerja Karyawan',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${poppins.variable}`}>
      <body>{children}</body>
    </html>
  );
}