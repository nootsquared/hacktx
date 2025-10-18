// components/Navbar.jsx
import Link from 'next/link';

// interface NavbarProps {
//     currentPage: String;
// }
const Navbar = () => {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-white text-lg font-semibold">
          <Link href="/">
            My Next.js App
          </Link>
        </div>
        <ul className="flex space-x-4">
          <li>
            <Link href="/" className = { "text-gray-300 hover:text-white"}>
              Home
            </Link>
          </li>
          <li>
            <Link href="/dashboard" className="text-gray-300 hover:text-white">
              Dashboard
            </Link>
          </li>
          <li>
            <Link href="/about" className="text-gray-300 hover:text-white">
              Form
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;