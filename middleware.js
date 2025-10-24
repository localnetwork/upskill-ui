import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secretKey = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET);

// Decode JWT
const decodeToken = async (token) => {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch {
    return null;
  }
};

// 🔹 Admin (id = 1)
const isAdmin = async (req) => {
  const token = req.cookies.get(process.env.NEXT_PUBLIC_TOKEN)?.value;
  const decoded = await decodeToken(token);
  const restrictedPaths = ["/my-progress", "/register"];

  const roleIds = Array.isArray(decoded?.roles)
    ? decoded.roles.map((r) => String(r.id))
    : [String(decoded?.role ?? "")];

  if (roleIds.includes("1") && restrictedPaths.includes(req.nextUrl.pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/profile";
    return NextResponse.redirect(url);
  }
  return null;
};

// 🔹 Student (id = 2)
const isMember = async (req) => {
  const token = req.cookies.get(process.env.NEXT_PUBLIC_TOKEN)?.value;
  const decoded = await decodeToken(token);
  const restrictedPaths = ["/statistics", "/population", "/puroks"];

  const roleIds = Array.isArray(decoded?.roles)
    ? decoded.roles.map((r) => String(r.id))
    : [String(decoded?.role ?? "")];

  if (roleIds.includes("2") && restrictedPaths.includes(req.nextUrl.pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/profile";
    return NextResponse.redirect(url);
  }
  return null;
};

// 🔹 Teacher (id = 3)
const isTeacher = async (req) => {
  const token = req.cookies.get(process.env.NEXT_PUBLIC_TOKEN)?.value;
  const decoded = await decodeToken(token);
  const restrictedPaths = ["/statistics", "/population", "/puroks"];

  const roleIds = Array.isArray(decoded?.roles)
    ? decoded.roles.map((r) => String(r.id))
    : [String(decoded?.role ?? "")];

  if (roleIds.includes("3") && restrictedPaths.includes(req.nextUrl.pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/teacher-dashboard";
    return NextResponse.redirect(url);
  }
  return null;
};

// 🔹 Block login/register/forgot for logged-in users
const isLoggedInBlock = async (req) => {
  const token = req.cookies.get(process.env.NEXT_PUBLIC_TOKEN)?.value;
  // console.log("token", token);
  const decoded = await decodeToken(token);
  const restrictedPaths = ["/login", "/register", "/forgot"];

  if (token && restrictedPaths.includes(req.nextUrl.pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return null;
};

const isAnonymous = async (req) => {
  const token = req.cookies.get(process.env.NEXT_PUBLIC_TOKEN)?.value;
  const decoded = await decodeToken(token);
  const restrictedPaths = ["/profile", "/checkout", "/cart"];

  if (!token && restrictedPaths.includes(req.nextUrl.pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return null;
};

export async function middleware(req) {
  const adminResponse = await isAdmin(req);
  if (adminResponse) return adminResponse;

  const memberResponse = await isMember(req);
  if (memberResponse) return memberResponse;

  const teacherResponse = await isTeacher(req);
  if (teacherResponse) return teacherResponse;

  const loggedInBlockResponse = await isLoggedInBlock(req); // ✅ NEW
  if (loggedInBlockResponse) return loggedInBlockResponse;

  const anonymousResponse = await isAnonymous(req);
  if (anonymousResponse) return anonymousResponse;

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/forgot",
    "/profile",
    "/checkout",
    "/checkout/:path*",
    "/cart",
  ],
};
