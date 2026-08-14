import '@/styles/globals.css';
import '@/styles/App.css';
import { Toaster } from "@/components/ui/sonner";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Toaster />
    </>
  );
}