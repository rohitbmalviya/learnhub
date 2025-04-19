import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-foreground text-background mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap size={18} className="text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">LearnHub</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Empowering learners worldwide with world-class online education.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Categories</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/courses?category=Programming" className="hover:text-background transition-colors">Programming</Link></li>
              <li><Link href="/courses?category=Design" className="hover:text-background transition-colors">Design</Link></li>
              <li><Link href="/courses?category=Business" className="hover:text-background transition-colors">Business</Link></li>
              <li><Link href="/courses?category=Data+Science" className="hover:text-background transition-colors">Data Science</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-background transition-colors">About</Link></li>
              <li><Link href="/courses" className="hover:text-background transition-colors">Browse Courses</Link></li>
              <li><Link href="/register" className="hover:text-background transition-colors">Become an Instructor</Link></li>
              <li><Link href="/login" className="hover:text-background transition-colors">Sign In</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span className="hover:text-background transition-colors cursor-default">Help Center</span></li>
              <li><span className="hover:text-background transition-colors cursor-default">Privacy Policy</span></li>
              <li><span className="hover:text-background transition-colors cursor-default">Terms of Service</span></li>
              <li><span className="hover:text-background transition-colors cursor-default">Contact Us</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-background/10 text-sm text-muted-foreground text-center">
          © {new Date().getFullYear()} LearnHub. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
