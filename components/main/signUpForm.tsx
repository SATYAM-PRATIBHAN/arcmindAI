"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { signUpSchema } from "@/lib/validation/signUpschema";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { DOC_ROUTES } from "@/lib/routes";
import Link from "next/link";

type FormErrors = Partial<Record<"email" | "username" | "password", string>>;

const SignUpForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [errors, setErrors] = useState<FormErrors>({}); // 🧠 error state
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    setLoading(true);
    e.preventDefault();

    setErrors({});

    const result = signUpSchema.safeParse({ email, username, password });

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      if (result.error && Array.isArray(result.error.issues)) {
        result.error.issues.forEach((err) => {
          const field = err.path[0] as keyof FormErrors;
          fieldErrors[field] = err.message;
        });
      }
      setErrors(fieldErrors);
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(DOC_ROUTES.API.AUTH.SIGNUP, {
        email,
        username,
        password,
      });
      if (res.data.success) {
        router.push(
          `${DOC_ROUTES.AUTH.VERIFY_REQUEST}?email=${encodeURIComponent(email)}`,
        );
      }
    } catch (err) {
      setLoading(false);
      console.error("Signup failed:", err);
    }
  };

  return (
    <section className="flex h-screen bg-white text-black">
      {/* Left Section (Image) */}
      <div className="hidden md:flex w-1/2 items-center justify-center m-4 rounded-4xl bg-gray-200">
        <Image
          src="/signupImage.webp"
          alt="Signup"
          className="w-full h-full object-cover rounded-4xl"
          width={700}
          height={700}
          priority
        />
      </div>

      {/* Right Section (Form) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12">
        {/* Form Container */}
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="mb-12 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-black">ArcMind AI</h1>
            <Link
              href={DOC_ROUTES.HOME}
              className="text-sm text-gray-600 hover:text-black transition underline"
            >
              ← Back to Home
            </Link>
          </div>
          <h2 className="text-4xl font-light text-black mb-3">
            Create an account
          </h2>
          <p className="text-gray-600 text-sm mb-8">
            Join ArcMind AI and start designing smarter systems.
          </p>

          <form onSubmit={handleSignup} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-xs text-gray-700 mb-2">
                Username
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-5 py-6 rounded-full border border-gray-200 bg-gray-50 text-black placeholder-gray-400 focus:outline-none focus:bg-white focus:border-gray-300 transition"
                required
              />
              {errors.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs text-gray-700 mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-5 py-6 rounded-full border border-gray-200 bg-gray-50 text-black placeholder-gray-400 focus:outline-none focus:bg-white focus:border-gray-300 transition"
                required
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••••••••"
                  className="w-full px-5 py-6 rounded-full border border-gray-200 bg-gray-50 text-black placeholder-gray-400 focus:outline-none focus:bg-white focus:border-gray-300 transition pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="cursor-pointer w-full bg-black text-white font-medium py-3 rounded-full hover:bg-gray-800 transition mt-4"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-12 flex items-center justify-between text-xs text-gray-600">
            <Link
              href={DOC_ROUTES.AUTH.LOGIN}
              className="hover:text-black transition"
            >
              Already have an account? <span className="underline">Login</span>
            </Link>
            <Link
              href={DOC_ROUTES.PRIVACY_POLICY}
              className="hover:text-black transition underline"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SignUpForm;
