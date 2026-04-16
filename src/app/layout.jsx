import './globals.css';
import ReduxProvider from '@/providers/ReduxProvider';
import NavbarWrapper from '@/components/layout/NavbarWrapper';

export const metadata = {
  title: 'Next.js Fullstack App',
  description: 'Scalable Next.js application with frontend and backend',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ReduxProvider>
          <NavbarWrapper />
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}