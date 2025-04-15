import Header from '@/components/header';
import Footer from '@/components/footer';
export default function BlogLayout({ children }) {
    return (<div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>);
}
